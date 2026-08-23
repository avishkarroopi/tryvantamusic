import Image from "next/image";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: number;
}

export default function LoadingSpinner({ fullScreen = false, size = 100 }: LoadingSpinnerProps) {
  return (
    <div className={`${styles.container} ${fullScreen ? styles.fullScreen : ""}`}>
      <div className={styles.spinnerWrapper} style={{ width: size, height: size }}>
        <div className={styles.rotatingRing} />
        <div className={styles.logoContainer}>
          <Image src="/logo.png" alt="Muziclly Loading" fill sizes="100vw" style={{ objectFit: "contain" }} />
        </div>
      </div>
    </div>
  );
}
