import Image from "next/image";
import { Maximize2 } from "lucide-react";
import Button from "@/components/Button/Button";
import styles from "./GalleryPreview.module.css";

// The original homepage preview shows these 6 photos (1,2,3,4,6,7 — image 5 is
// skipped in the recovered markup); the full 30-photo set lives on /gallery.
const previewImages = [1, 2, 3, 4, 6, 7];

export default function GalleryPreview() {
  return (
    <section className={styles.section} id="gallery">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Our Community</span>
          <h2 className={styles.title}>
            Life at <span className={styles.highlight}>Tryvanta Music</span>
          </h2>
          <p className={styles.description}>
            Join thousands of students discovering their musical potential. From first notes to stage performances,
            we celebrate every moment.
          </p>
        </div>

        <div className={styles.galleryGrid}>
          {previewImages.map((n, i) => (
            <div className={styles.galleryItem} key={n}>
              <div className={styles.imageWrapper}>
                <Image
                  src={`/muzzly_gallery/${n}.jpg`}
                  alt={`Tryvanta Music Community Moment ${i + 1}`}
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

        <div className={styles.viewMoreWrapper}>
          <Button variant="outline" size="md" href="/gallery" target="_blank" rel="noopener noreferrer">
            View All Gallery
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ marginLeft: 8 }}
            >
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}
