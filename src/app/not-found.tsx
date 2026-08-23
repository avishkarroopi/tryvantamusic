import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import Button from "@/components/Button/Button";

// The recovered crawl confirms the original site used Next.js's default
// not-found handling (plain 404 response, no custom page was captured), so
// this page follows the same dark theme as the rest of the site without
// inventing copy that wasn't recovered.
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "160px 24px 80px",
          gap: "var(--space-6)",
        }}
      >
        <span style={{ fontSize: "var(--text-7xl)", fontWeight: 800, color: "var(--color-accent-primary)" }}>404</span>
        <h1>This page could not be found</h1>
        <p style={{ maxWidth: 480 }}>
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>
        <Button variant="primary" size="lg" href="/">
          Back to Home
        </Button>
        <Link href="/forum-hub" className="text-accent">
          Or reach out via Forum Hub
        </Link>
      </main>
      <Footer />
    </>
  );
}
