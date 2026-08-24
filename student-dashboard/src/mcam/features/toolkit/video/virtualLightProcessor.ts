/**
 * Virtual Light — a GPU-composited glow overlaid on the camera feed that
 * realistically sits "in the scene": when the user's hand/body passes in
 * front of the light's position, it's occluded; when they move away, the
 * glow shows normally. No depth camera needed — a real-time person
 * segmentation model (MediaPipe's selfie segmenter, GPU-delegated) supplies
 * a per-pixel "is this the person or the background" mask each frame, and a
 * WebGL fragment shader uses that mask to decide, per pixel, whether to draw
 * the glow or the original (person) video — that decision IS the occlusion
 * effect. This is the same technique behind Zoom/Snap-style background
 * effects; a full 3D depth reconstruction of the room was never necessary
 * for "does the light appear in front of or behind the user."
 *
 * Implements LiveKit's TrackProcessor contract (see livekit-client's
 * `LocalVideoTrack.setProcessor`) so this can be attached directly to the
 * real published camera track — everyone in the room sees the effect, not
 * just a local mirror. It also works completely standalone (own camera
 * capture, own <canvas> preview) so it's useful before/without a published
 * track too.
 */
import { FilesetResolver, ImageSegmenter, type ImageSegmenterResult } from "@mediapipe/tasks-vision";

export interface VirtualLightOptions {
  /** Normalized 0..1 position within the frame, (0,0) = top-left. */
  x: number;
  y: number;
  /** Normalized radius (relative to frame width) of the glow's falloff. */
  radius: number;
  /** RGB, 0..1 each. */
  color: [number, number, number];
  /** 0..1 overall brightness multiplier. */
  intensity: number;
  /** Soft pulsing, like a real ring light isn't perfectly static — 0 disables. */
  pulseAmount: number;
}

export const DEFAULT_VIRTUAL_LIGHT_OPTIONS: VirtualLightOptions = {
  x: 0.5,
  y: 0.35,
  radius: 0.16,
  color: [1, 0.86, 0.66], // warm ring-light white
  intensity: 0.85,
  pulseAmount: 0.06,
};

// A recent stable release's WASM bundle — pin here (rather than an
// unversioned "latest" CDN path) so this doesn't silently change behavior
// out from under a working deployment.
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const SELFIE_SEGMENTER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vTexCoord;
  void main() {
    // fullscreen quad in clip space; texcoord flipped on Y (video/canvas origin differs from GL)
    vTexCoord = vec2((aPosition.x + 1.0) * 0.5, 1.0 - (aPosition.y + 1.0) * 0.5);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 vTexCoord;
  uniform sampler2D uVideo;
  uniform sampler2D uMask;      // r channel: 1.0 = person, 0.0 = background
  uniform vec2 uLightPos;       // normalized, video-space (0,0 top-left)
  uniform float uRadius;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uAspect;        // width / height, so the glow stays circular

  void main() {
    vec4 video = texture2D(uVideo, vTexCoord);
    float personMask = texture2D(uMask, vTexCoord).r;

    // Distance in aspect-corrected space so the falloff is a circle, not an ellipse.
    vec2 d = vTexCoord - uLightPos;
    d.x *= uAspect;
    float dist = length(d);

    float glow = smoothstep(uRadius, 0.0, dist) * uIntensity;
    // A tighter, brighter core inside the soft falloff — reads like a real light source.
    float core = smoothstep(uRadius * 0.35, 0.0, dist) * uIntensity;
    vec3 lit = video.rgb + uColor * glow + uColor * core * 0.6;

    // The whole point: where the person mask says "this pixel is the user",
    // show the ORIGINAL video (no glow) — the user visually covers the
    // light there. Everywhere else, show the lit version.
    vec3 finalColor = mix(lit, video.rgb, personMask);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Virtual Light: could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Virtual Light: shader compile failed — ${log}`);
  }
  return shader;
}

interface ProcessorInit {
  track: MediaStreamTrack;
}

/** Matches livekit-client's TrackProcessor<Track.Kind.Video> shape without
 *  importing livekit-client here, so this module has zero dependency on it
 *  and stays usable in a plain standalone preview too. */
export class VirtualLightProcessor {
  readonly name = "virtual-light";
  options: VirtualLightOptions;
  processedTrack?: MediaStreamTrack;

  private sourceEl: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private videoTexture: WebGLTexture | null = null;
  private maskTexture: WebGLTexture | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private segmenter: ImageSegmenter | null = null;
  private rafId: number | null = null;
  private startedAt = 0;
  private destroyed = false;
  private initPromise: Promise<void> | null = null;
  /** Set once a frame has actually been segmented — until then we just pass
   *  the raw video through, so there's no flash-of-no-video on startup while
   *  the (few-hundred-ms) model load is still in flight. */
  private ready = false;

  constructor(options: Partial<VirtualLightOptions> = {}) {
    this.options = { ...DEFAULT_VIRTUAL_LIGHT_OPTIONS, ...options };
  }

  updateTransformerOptions(options: Partial<VirtualLightOptions>) {
    this.options = { ...this.options, ...options };
  }

  async init(opts: ProcessorInit): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit(opts);
    return this.initPromise;
  }

  private async doInit({ track }: ProcessorInit): Promise<void> {
    this.destroyed = false;
    this.startedAt = performance.now();

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = new MediaStream([track]);
    await video.play();
    // Wait for real dimensions — a track can report 0x0 for a frame or two
    // right after getUserMedia resolves.
    if (video.videoWidth === 0) {
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
    }
    this.sourceEl = video;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    this.canvas = canvas;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) throw new Error("Virtual Light: WebGL is not available in this browser.");
    this.gl = gl;
    this.setupGl(gl);

    // captureStream on a canvas that's actively being drawn to via WebGL
    // gives a live MediaStreamTrack we can hand straight to LiveKit (or to
    // any <video> element for a standalone preview).
    const stream = (canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }).captureStream(30);
    this.processedTrack = stream.getVideoTracks()[0];

    // Model load happens in parallel with the render loop starting — frames
    // pass through untouched (see `ready`) until the segmenter is live.
    this.loadSegmenter().catch((err) => {
      // Segmentation failing shouldn't kill the whole effect — fall back to
      // "glow with no occlusion" rather than a blank/frozen track.
      console.error("[virtual-light] segmenter failed to load, continuing without occlusion", err);
    });

    this.renderLoop();
  }

  private async loadSegmenter(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    this.segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: { modelAssetPath: SELFIE_SEGMENTER_MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
    this.ready = true;
  }

  private setupGl(gl: WebGLRenderingContext) {
    const program = gl.createProgram();
    if (!program) throw new Error("Virtual Light: could not create GL program");
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Virtual Light: program link failed — ${gl.getProgramInfoLog(program)}`);
    }
    this.program = program;
    gl.useProgram(program);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const makeTex = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    };
    this.videoTexture = makeTex();
    this.maskTexture = makeTex();

    this.uniforms = {
      uVideo: gl.getUniformLocation(program, "uVideo"),
      uMask: gl.getUniformLocation(program, "uMask"),
      uLightPos: gl.getUniformLocation(program, "uLightPos"),
      uRadius: gl.getUniformLocation(program, "uRadius"),
      uColor: gl.getUniformLocation(program, "uColor"),
      uIntensity: gl.getUniformLocation(program, "uIntensity"),
      uAspect: gl.getUniformLocation(program, "uAspect"),
    };
  }

  private renderLoop = () => {
    if (this.destroyed || !this.gl || !this.sourceEl || !this.canvas) return;
    const gl = this.gl;
    const video = this.sourceEl;

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      let maskData: Uint8Array | null = null;
      let maskW = 1;
      let maskH = 1;

      if (this.ready && this.segmenter) {
        try {
          const result: ImageSegmenterResult = this.segmenter.segmentForVideo(video, performance.now());
          const catMask = result.categoryMask;
          if (catMask) {
            maskData = catMask.getAsUint8Array();
            maskW = catMask.width;
            maskH = catMask.height;
          }
          result.close?.();
        } catch {
          // A single bad frame shouldn't stop the loop — just draw without
          // an updated mask this frame (reuses whatever's already bound).
        }
      }

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.useProgram(this.program);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.uniform1i(this.uniforms.uVideo, 0);

      if (maskData) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
        // Category indices for the 2-class selfie model are 0 (background) /
        // 1 (person) — scale to 0..255 so the shader can read it as 0..1 in
        // a plain LUMINANCE byte texture.
        const scaled = new Uint8Array(maskData.length);
        for (let i = 0; i < maskData.length; i++) scaled[i] = maskData[i] > 0 ? 255 : 0;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, maskW, maskH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, scaled);
        gl.uniform1i(this.uniforms.uMask, 1);
      }

      const t = (performance.now() - this.startedAt) / 1000;
      const pulse = 1 + Math.sin(t * 1.6) * this.options.pulseAmount;
      gl.uniform2f(this.uniforms.uLightPos, this.options.x, this.options.y);
      gl.uniform1f(this.uniforms.uRadius, this.options.radius * pulse);
      gl.uniform3f(this.uniforms.uColor, ...this.options.color);
      gl.uniform1f(this.uniforms.uIntensity, this.options.intensity);
      gl.uniform1f(this.uniforms.uAspect, this.canvas.width / this.canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    this.rafId = requestAnimationFrame(this.renderLoop);
  };

  async restart(opts: ProcessorInit): Promise<void> {
    await this.destroy();
    this.initPromise = null;
    await this.init(opts);
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.sourceEl?.pause();
    this.sourceEl = null;
    this.segmenter?.close();
    this.segmenter = null;
    this.ready = false;
    this.processedTrack?.stop();
    this.processedTrack = undefined;
    this.gl = null;
    this.canvas = null;
  }
}
