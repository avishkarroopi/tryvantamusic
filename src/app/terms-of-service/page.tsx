import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { legalStyles as s } from "@/components/LegalContent/legal-styles";

export const metadata: Metadata = {
  title: "Terms of Service | MUZICLLY",
  description: "Read the terms and conditions for using the MUZICLLY platform.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="container" style={s.page}>
          <h1 style={s.h1}>Terms of Service</h1>
          <p style={s.lastUpdated}>Last updated: 7/8/2026</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Muziclly platform, you agree to comply with and be bound by these Terms of
              Service. If you do not agree to these terms, you may not access or use the services.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Description of Service</h2>
            <p>
              Muziclly is an online music education platform providing structured music learning through live online
              classes and recorded content. While we strive to provide the best educational experience, we are an
              education platform and cannot guarantee specific learning outcomes, as progress depends on individual
              student effort and practice.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Class Scheduling &amp; Availability</h2>
            <p>
              Classes are scheduled based on the availability of both teachers and students. We will make reasonable
              efforts to accommodate preferred timings, but we cannot guarantee availability for specific slots.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Cancellation &amp; Rescheduling</h2>
            <p>
              We understand that schedules change. If you need to cancel or reschedule a class, we require
              reasonable notice (typically 24 hours in advance) to allow the teacher to adjust their schedule.
              Frequent cancellations or no-shows may result in forfeiture of the class credit as per your specific
              plan terms.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Payments &amp; Refunds</h2>
            <p>
              Payments for courses and subscriptions are due in advance. Refund policies are determined by the
              specific plan you subscribe to. Please review your plan details carefully before purchase.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Conduct Guidelines</h2>
            <ul style={s.ulNoMb}>
              <li style={s.li}>
                <strong style={s.strong}>Student Conduct:</strong> Students are expected to be respectful to
                teachers and peers. Harassment or inappropriate behavior will not be tolerated.
              </li>
              <li style={s.li}>
                <strong style={s.strong}>Teacher Conduct:</strong> Teachers are expected to maintain professional
                standards and provide a supportive learning environment.
              </li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Intellectual Property</h2>
            <p>
              All course content, materials, and resources provided on Muziclly are the intellectual property of
              Muziclly. You may not copy, distribute, modify, or sell any content without our prior written consent.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Termination</h2>
            <p>
              Muziclly reserves the right to suspend or terminate your account if you violate these Terms of Service
              or engage in any conduct that we determine to be inappropriate or harmful to the platform or its
              users.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Muziclly shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of India, without regard to
              its conflict of law provisions.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:hello@muzicllyglobal.com" className="text-accent">
                hello@muzicllyglobal.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
