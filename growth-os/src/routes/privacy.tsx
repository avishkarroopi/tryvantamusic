import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Muziclly Growth OS" },
      {
        name: "description",
        content:
          "Privacy Policy for Muziclly Growth OS describing what data we collect, how we use it, third-party services, retention, and your rights.",
      },
      { property: "og:title", content: "Privacy Policy — Muziclly Growth OS" },
      {
        property: "og:description",
        content:
          "How Muziclly Growth OS collects, uses, stores, and protects personal data across Meta, WhatsApp, and Google integrations.",
      },
      { property: "og:type", content: "article" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

const EFFECTIVE_DATE = "July 12, 2026";
const CONTACT_EMAIL = "privacy@muziclly.com";
const COMPANY = "Muziclly";
const APP = "Muziclly Growth OS";

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </nav>

      <header className="mb-10 border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed">
        <section>
          <p>
            This Privacy Policy explains how {COMPANY} ("we", "us", or "our")
            collects, uses, discloses, and safeguards information when you use{" "}
            {APP} (the "Service"), including any integrations with Meta
            Platforms (Facebook, Instagram), WhatsApp Business Cloud API, and
            Google services. By using the Service you agree to this Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="mt-2">We collect the following categories of data:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Account data:</strong> name, email address, password
              hash, organization, role, and authentication tokens.
            </li>
            <li>
              <strong>Lead &amp; contact data:</strong> names, phone numbers,
              email addresses, messages, and interaction history you or your
              customers submit through forms, chat, or connected channels.
            </li>
            <li>
              <strong>Meta / Facebook / Instagram data:</strong> Page ID,
              Instagram Business account ID, ad account IDs, page access
              tokens, ad performance metrics, and message threads — only for
              the assets you explicitly connect.
            </li>
            <li>
              <strong>WhatsApp Business data:</strong> phone number ID,
              business display name, message content, delivery/read receipts,
              and template status, received via the WhatsApp Cloud API webhook.
            </li>
            <li>
              <strong>Google data:</strong> Google Business Profile,
              Analytics, Search Console, Ads, and Gmail metadata, only for
              accounts you explicitly authorize via OAuth.
            </li>
            <li>
              <strong>Usage &amp; device data:</strong> IP address, browser
              type, pages viewed, timestamps, and diagnostic logs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, operate, secure, and improve the Service.</li>
            <li>
              Send and receive messages you initiate with your customers over
              WhatsApp, email, and Meta Messenger/Instagram.
            </li>
            <li>Analyze marketing, sales, and support performance.</li>
            <li>
              Comply with legal obligations and enforce our Terms of Service.
            </li>
          </ul>
          <p className="mt-2">
            We do <strong>not</strong> sell personal data, and we do not use
            data received from Meta or WhatsApp for advertising to end users
            or for building profiles unrelated to the services you configured.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Legal Bases (GDPR)</h2>
          <p className="mt-2">
            We process personal data on the basis of (a) your consent, (b)
            performance of a contract, (c) our legitimate interests in
            operating the Service, and (d) compliance with legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            4. Third-Party Services &amp; Sub-processors
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Meta Platforms, Inc. — Facebook, Instagram, WhatsApp APIs</li>
            <li>Google LLC — Business Profile, Analytics, Ads, Gmail APIs</li>
            <li>Supabase / Lovable Cloud — hosting, database, authentication</li>
            <li>Cloudflare — edge delivery and DDoS protection</li>
          </ul>
          <p className="mt-2">
            Each sub-processor is bound by its own privacy terms. We only
            share the minimum data required to deliver the requested feature.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Data Retention</h2>
          <p className="mt-2">
            We retain personal data while your account is active and for up to
            24 months afterwards, unless a shorter period is required by law
            or a longer period is required for legitimate business or
            compliance reasons (e.g. financial records). WhatsApp message
            content is retained for up to 90 days for operational and support
            purposes unless you configure a shorter window.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Data Security</h2>
          <p className="mt-2">
            We use encryption in transit (TLS 1.2+) and at rest,
            role-based access control, row-level security in our database,
            secret management for third-party tokens, and continuous
            monitoring. No system is 100% secure; we work to reduce risk to a
            commercially reasonable level.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p className="mt-2">
            Depending on your jurisdiction (including the EU/EEA, UK, and
            California) you may have the right to access, correct, export,
            restrict, or delete your personal data, and to withdraw consent
            at any time. To exercise these rights, contact us at{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            or use our{" "}
            <Link to="/data-deletion" className="underline">
              Data Deletion page
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            8. Meta Platform Data &amp; App Review
          </h2>
          <p className="mt-2">
            When you connect a Facebook Page, Instagram Business account, or
            WhatsApp Business account, we receive data through the Meta Graph
            API and WhatsApp Cloud API strictly for the features you enable
            (e.g. reading leads, replying to messages, reporting on ads).
            We comply with the Meta Platform Terms, Developer Policies, and
            WhatsApp Business Messaging Policy. If you disconnect an asset
            or delete our app from your Business Settings, we stop collecting
            new data from that asset and delete stored tokens.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. International Transfers</h2>
          <p className="mt-2">
            Data may be processed in countries outside your own. Where
            required, we rely on Standard Contractual Clauses or equivalent
            safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Children</h2>
          <p className="mt-2">
            The Service is not directed to children under 13 (or the minimum
            age in your jurisdiction). We do not knowingly collect data from
            children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Changes to this Policy</h2>
          <p className="mt-2">
            We may update this Policy from time to time. Material changes
            will be announced in-app or via email. Continued use of the
            Service after changes take effect constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">12. Contact</h2>
          <p className="mt-2">
            {COMPANY} — Data Protection Contact
            <br />
            Email:{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
