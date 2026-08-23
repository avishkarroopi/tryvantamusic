/** Floating emoji reactions that rise and fade over the stage. */
import { AnimatePresence, motion } from "framer-motion";
import type { Reaction } from "../hooks/useRealtime";

export function ReactionsLayer({ reactions }: { reactions: Reaction[] }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div key={r.key}
            initial={{ opacity: 0, y: 0, x: `${10 + Math.random() * 80}%`, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -240, scale: 1.1 }}
            transition={{ duration: 2.4, ease: "easeOut" }}
            style={{ position: "absolute", bottom: 80, fontSize: 34 }}>
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
