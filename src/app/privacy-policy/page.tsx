import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { legalStyles as s } from "@/components/LegalContent/legal-styles";

export const metadata: Metadata = {
  title: "Privacy Policy | TRYVANTA MUSIC",
  description: "Learn how TRYVANTA MUSIC collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="container" style={s.page}>
          <h1 style={s.h1}>Privacy Policy</h1>
          <p style={s.lastUpdated}>Last updated: 7/8/2026</p>

          <section style={s.section}>
            <h2 style={s.h2}>1. Introduction</h2>
            <p>
              Welcome to Tryvanta Music. We respect your privacy and are committed to protecting your personal data. This
              privacy policy will inform you as to how we look after your personal data when you visit our website
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Data We Collect</h2>
            <p style={s.pMb1}>We collect various types of information to provide and improve our services to you:</p>
            <ul style={s.ul}>
              <li style={s.li}>
                <strong style={s.strong}>User Data:</strong> Name, email address, phone number, age, instrument
                preference, and class schedules.
              </li>
              <li style={s.li}>
                <strong style={s.strong}>Teacher Data:</strong> Profile details, experience, qualifications, and
                availability.
              </li>
              <li style={s.li}>
                <strong style={s.strong}>Payment Data:</strong> We do not store credit card or UPI details directly.
                All payments are processed through secure third-party payment gateways.
              </li>
              <li style={s.li}>
                <strong style={s.strong}>Usage Data:</strong> Information about how you use our app and website,
                class attendance, and interactions.
              </li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. How We Use Your Data</h2>
            <p style={s.pMb1}>We use your personal data for the following purposes:</p>
            <ul style={s.ulNoMb}>
              <li style={s.li}>To register you as a new customer or teacher.</li>
              <li style={s.li}>To manage class scheduling and coordination.</li>
              <li style={s.li}>To communicate with you via WhatsApp, email, or calls regarding your classes and account.</li>
              <li style={s.li}>To improve our website, services, marketing, and customer relationships.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Data Sharing</h2>
            <p>
              We do not sell your personal data. We only share data with internal systems or trusted service
              providers necessary to operate our platform, such as:
            </p>
            <ul style={s.ulMt1}>
              <li style={s.li}>Video conferencing tools (e.g., Zoom) for conducting classes.</li>
              <li style={s.li}>Payment gateways for processing transactions.</li>
              <li style={s.li}>Hosting and infrastructure providers.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being
              accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to
              those employees, agents, contractors, and other third parties who have a business need to know.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Your Legal Rights</h2>
            <p style={s.pMb1}>
              Under certain circumstances, you have rights under data protection laws in relation to your personal
              data, including:
            </p>
            <ul style={s.ulNoMb}>
              <li style={s.li}>Request access to your personal data.</li>
              <li style={s.li}>Request correction of your personal data.</li>
              <li style={s.li}>Request erasure of your personal data.</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Contact Us</h2>
            <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
            <p style={s.contactLink}>
              <a href="mailto:hello@muzicllyglobal.com" className="text-accent">
                hello@muzicllyglobal.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
