"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, X, Music, Video, Users, Disc,
} from "lucide-react";
import styles from "./page.module.css";

// Rebuilt from the recovered "Tryvanta Music Label" basic prototype (admin-store-label.zip)
// into a full Next.js music-label showcase: artists, videos, releases, and a mock
// bottom player bar (no real media files were provided in the recovered source —
// preserved as a mock transport, matching the recovered evidence's own placeholder
// mediaUrl: '#').

interface Artist { id: string; name: string; photo: string; bio: string; genres: string[]; featured?: boolean }
interface Release { id: string; title: string; type: "audio" | "video"; artistId: string; cover: string; duration: string }

const ARTISTS: Artist[] = [
  { id: "a1", name: "Aarya", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400", bio: "Classical fusion vocalist bridging traditions.", genres: ["Classical", "Fusion"], featured: true },
  { id: "a2", name: "The Midnight Echo", photo: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400", bio: "Cinematic electronic landscapes.", genres: ["Cinematic", "Electronic"], featured: true },
  { id: "a3", name: "Zara K", photo: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400", bio: "Indie pop sensation with soul.", genres: ["Pop", "Indie"] },
];

const RELEASES: Release[] = [
  { id: "r1", title: "Morning Mist", type: "audio", artistId: "a1", cover: "https://images.unsplash.com/photo-1465847899078-b29ecc91237d?auto=format&fit=crop&q=80&w=400", duration: "4:12" },
  { id: "r2", title: "Neon City (Official Video)", type: "video", artistId: "a2", cover: "https://images.unsplash.com/photo-1535930749574-1399327ce78f?auto=format&fit=crop&q=80&w=800", duration: "3:45" },
  { id: "r3", title: "Starlight", type: "audio", artistId: "a2", cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400", duration: "3:30" },
  { id: "r4", title: "Deep Dive", type: "audio", artistId: "a2", cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400", duration: "5:00" },
  { id: "r5", title: "Heartbeat", type: "audio", artistId: "a3", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400", duration: "2:55" },
];

type Tab = "home" | "videos" | "audio" | "artists";

function artistName(id: string) { return ARTISTS.find((a) => a.id === id)?.name ?? ""; }

export default function LabelPage() {
  const [tab, setTab] = useState<Tab>("home");
  const [nowPlaying, setNowPlaying] = useState<Release | null>(null);
  const [playing, setPlaying] = useState(false);
  const [openVideo, setOpenVideo] = useState<Release | null>(null);
  const [openArtist, setOpenArtist] = useState<Artist | null>(null);

  const play = (r: Release) => {
    if (r.type === "video") { setOpenVideo(r); return; }
    setNowPlaying(r);
    setPlaying(true);
  };

  const audioReleases = RELEASES.filter((r) => r.type === "audio");
  const videoReleases = RELEASES.filter((r) => r.type === "video");

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logoWrap} onClick={() => { setTab("home"); setOpenArtist(null); }}>
            <div className={styles.logoMark}>T</div>
            <span className={styles.logoText}>Tryvanta Music <span className={styles.logoAccent}>Label</span></span>
          </div>
          <div className={styles.tabRow}>
            {([["home", Disc, "Home"], ["videos", Video, "Videos"], ["audio", Music, "Music"], ["artists", Users, "Artists"]] as const).map(([id, Icon, label]) => (
              <button key={id} onClick={() => { setTab(id); setOpenArtist(null); }} className={`${styles.tabBtn} ${tab === id ? styles.tabBtnActive : ""}`}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {openArtist ? (
        <div className={styles.section} style={{ paddingTop: 128 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 32 }}>
            <div style={{ width: 140, height: 140, borderRadius: 999, overflow: "hidden", position: "relative", flexShrink: 0 }}>
              <Image src={openArtist.photo} alt={openArtist.name} fill sizes="140px" style={{ objectFit: "cover" }} />
            </div>
            <div>
              <h1 className={styles.heroTitle} style={{ margin: "0 0 8px" }}>{openArtist.name}</h1>
              <p className={styles.artistDetailBio}>{openArtist.bio}</p>
              <div className={styles.genrePillRow} style={{ marginBottom: 0 }}>
                {openArtist.genres.map((g) => <span key={g} className={styles.genrePill}>{g}</span>)}
              </div>
            </div>
          </div>
          <div className={styles.sectionHead}><span className={styles.sectionTitle}>Releases</span></div>
          <div className={styles.releaseGrid}>
            {RELEASES.filter((r) => r.artistId === openArtist.id).map((r) => (
              <ReleaseCard key={r.id} r={r} onPlay={() => play(r)} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {tab === "home" && (
            <>
              <div className={styles.hero}>
                <span className={styles.heroEyebrow}>Tryvanta Music Label</span>
                <h1 className={styles.heroTitle}>Original artists. Original sound.</h1>
                <p className={styles.heroDesc}>The recording arm of Tryvanta Music Global — releasing music and video from artists across our teaching network.</p>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>Featured Artists</span></div>
                <div className={styles.artistGrid}>
                  {ARTISTS.filter((a) => a.featured).map((a) => <ArtistCard key={a.id} a={a} onOpen={() => setOpenArtist(a)} />)}
                </div>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>Latest Releases</span></div>
                <div className={styles.releaseGrid}>
                  {RELEASES.map((r) => <ReleaseCard key={r.id} r={r} onPlay={() => play(r)} />)}
                </div>
              </div>
            </>
          )}

          {tab === "videos" && (
            <div className={styles.section} style={{ paddingTop: 128 }}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>Music Videos</span></div>
              <div className={styles.releaseGrid}>
                {videoReleases.map((r) => <ReleaseCard key={r.id} r={r} onPlay={() => play(r)} />)}
              </div>
            </div>
          )}

          {tab === "audio" && (
            <div className={styles.section} style={{ paddingTop: 128 }}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>Music</span></div>
              <div className={styles.releaseGrid}>
                {audioReleases.map((r) => <ReleaseCard key={r.id} r={r} onPlay={() => play(r)} />)}
              </div>
            </div>
          )}

          {tab === "artists" && (
            <div className={styles.section} style={{ paddingTop: 128 }}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>All Artists</span></div>
              <div className={styles.artistGrid}>
                {ARTISTS.map((a) => <ArtistCard key={a.id} a={a} onOpen={() => setOpenArtist(a)} />)}
              </div>
            </div>
          )}
        </>
      )}

      {nowPlaying && (
        <div className={styles.player}>
          <div className={styles.playerInner}>
            <div className={styles.progressTrack}><div className={styles.progressFill} /></div>
            <div className={styles.playerLeft}>
              <div className={styles.playerCover}><Image src={nowPlaying.cover} alt={nowPlaying.title} fill sizes="48px" style={{ objectFit: "cover" }} /></div>
              <div style={{ minWidth: 0 }}>
                <div className={styles.playerTitle}>{nowPlaying.title}</div>
                <div className={styles.playerArtist}>{artistName(nowPlaying.artistId)}</div>
              </div>
            </div>
            <div className={styles.playerControls}>
              <button className={styles.playerControlBtn}><SkipBack size={18} /></button>
              <button className={styles.playToggle} onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
              </button>
              <button className={styles.playerControlBtn}><SkipForward size={18} /></button>
            </div>
            <div className={styles.playerRight}>
              <Volume2 size={18} className={styles.playerControlBtn} />
              <button className={styles.playerControlBtn} onClick={() => setNowPlaying(null)}><X size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {openVideo && (
        <div className={styles.videoOverlay}>
          <button className={styles.videoCloseBtn} onClick={() => setOpenVideo(null)}><X size={28} /></button>
          <div className={styles.videoFrame}>
            <Image src={openVideo.cover} alt={openVideo.title} fill sizes="960px" style={{ objectFit: "cover", opacity: 0.5 }} />
            <div className={styles.videoPlayCircle}><div className={styles.videoPlayInner}><Play size={32} fill="#fff" style={{ marginLeft: 4 }} /></div></div>
            <div className={styles.videoCaption}>
              <div className={styles.videoCaptionTitle}>{openVideo.title}</div>
              <div className={styles.videoCaptionArtist}>{artistName(openVideo.artistId)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArtistCard({ a, onOpen }: { a: Artist; onOpen: () => void }) {
  return (
    <div className={styles.artistCard} onClick={onOpen}>
      <div className={styles.artistPhotoWrap}>
        <Image src={a.photo} alt={a.name} fill sizes="200px" style={{ objectFit: "cover" }} />
      </div>
      <div className={styles.artistName}>{a.name}</div>
      <div className={styles.artistGenres}>{a.genres.join(", ")}</div>
    </div>
  );
}

function ReleaseCard({ r, onPlay }: { r: Release; onPlay: () => void }) {
  return (
    <div className={styles.releaseCard} onClick={onPlay}>
      <div className={styles.releaseCoverWrap}>
        <Image src={r.cover} alt={r.title} fill sizes="220px" style={{ objectFit: "cover" }} />
        <div className={styles.playOverlay}><div className={styles.playBtn}><Play size={18} fill="currentColor" style={{ marginLeft: 2 }} /></div></div>
        {r.type === "video" && <span className={styles.videoBadge}><Video size={11} /> Video</span>}
      </div>
      <div className={styles.releaseTitle}>{r.title}</div>
      <div className={styles.releaseArtist}>{artistName(r.artistId)} · {r.duration}</div>
    </div>
  );
}
