import type { Metadata } from "next";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Gallery | MUZICLLY",
  description:
    "Join thousands of students discovering their musical potential. From first notes to stage performances, we celebrate every moment.",
};

// Ported from the recovered original (_next/static/chunks/15235e3186cf8d61.js).
const images = Array.from({ length: 30 }, (_, i) => `/muzzly_gallery/${i + 1}.jpg`);

export default function GalleryPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Our Community</span>
          <h1 className={styles.title}>
            Life at <span className={styles.highlight}>Muziclly</span>
          </h1>
          <p className={styles.description}>
            Join thousands of students discovering their musical potential. From first notes to stage performances,
            we celebrate every moment.
          </p>
        </div>

        <div className={styles.galleryGrid}>
          {images.map((src, i) => (
            <div className={styles.galleryItem} key={src}>
              <div className={styles.imageWrapper}>
                <Image
                  src={src}
                  alt={`Muziclly Community Moment ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={styles.image}
                  loading="lazy"
                />
                <div className={styles.overlay}>
                  <div className={styles.zoomIcon}>
                    <Maximize2 size={24} aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
