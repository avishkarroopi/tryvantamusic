"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button/Button";
import styles from "./Navbar.module.css";

// Ported from the recovered original (_next/static/chunks/349969342f27d55d.js).
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!pathname || pathname.startsWith("/mhub")) return null;

  return (
    <header id="global-main-navbar" className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo-icon.png" alt="Tryvanta Music" width={40} height={40} className={styles.logoImage} priority />
          <span className={styles.logoText}>
            <span style={{ fontFamily: "var(--font-tryvanta-sans)", letterSpacing: "0.08em" }}>TRYVANTA</span>{" "}
            <span style={{ fontFamily: "var(--font-music-script)", fontSize: "1.3em" }}>Music</span>
          </span>
        </Link>

        <div className={`${styles.navLinks} ${open ? styles.open : ""}`}>
          <Link href="/#journey" className={styles.navLink} onClick={() => setOpen(false)}>
            Story
          </Link>
          <Link href="/#highlights" className={styles.navLink} onClick={() => setOpen(false)}>
            Why Us
          </Link>
          <Link href="/#curriculum" className={styles.navLink} onClick={() => setOpen(false)}>
            Curriculum
          </Link>
          <Link href="/#mentors" className={styles.navLink} onClick={() => setOpen(false)}>
            Mentors
          </Link>
          <Link href="/#reviews" className={styles.navLink} onClick={() => setOpen(false)}>
            Reviews
          </Link>
          <Link href="/gallery" className={styles.navLink} onClick={() => setOpen(false)}>
            Gallery
          </Link>

          <div className={styles.dropdown}>
            <button className={`${styles.navLink} ${styles.dropdownTrigger}`}>
              Courses
              <svg className={styles.dropdownArrow} width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className={styles.dropdownMenu}>
              <Link href="/courses/keyboard-piano" className={styles.dropdownItem}>
                Keyboard Piano
              </Link>
              <Link href="/courses/guitar" className={styles.dropdownItem}>
                Guitar
              </Link>
              <Link href="/courses/bollywood-singing" className={styles.dropdownItem}>
                Bollywood Singing
              </Link>
              <Link href="/courses/more" className={styles.dropdownItem}>
                More
              </Link>
            </div>
          </div>

          <Link href="/difmlab" className={styles.navLink} onClick={() => setOpen(false)}>
            MLAB
          </Link>

          <div className={styles.authButtons}>
            <Link href="/signin" className={styles.loginBtn} onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link href="/signup" className={styles.registerBtn} onClick={() => setOpen(false)}>
              Register
            </Link>
          </div>

          <Button variant="primary" size="sm" href="/studio" id="nav-cta">
            Tryvanta Music Studio
          </Button>
        </div>

        <button
          className={`${styles.hamburger} ${open ? styles.active : ""}`}
          aria-label="Toggle navigation menu"
          id="mobile-menu-toggle"
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}
