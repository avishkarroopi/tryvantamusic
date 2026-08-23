import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { title: "Data Deletion Instructions — Muziclly Growth OS" },
      {
        name: "description",
        content:
          "How to request deletion of your personal data from Muziclly Growth OS, including Meta / Facebook / Instagram / WhatsApp data.",
      },
      { property: "og:title", content: "Data Deletion — Muziclly Growth OS" },
      {
        property: "og:description",
        content:
          "Request deletion of your personal data from Muziclly Growth OS in accordance with Meta Platform Policy and GDPR/CCPA.",
      },
      { property: "og:type", content: "article" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: DataDeletionPage,
});

const CONTACT_EMAIL = "privacy@muziclly.com";
const RESPONSE_WINDOW = "30 days";

function DataDeletionPage() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Data Deletion Request — Muziclly Growth OS"
  )}&body=${encodeURIComponent(
    "Hello Muziclly,\n\nI request deletion of all personal data associated with my account and any connected Meta / Facebook / Instagram / WhatsApp assets.\n\nAccount email: \nConnected Facebook Page (if any): \nConnected Instagram username (if any): \nWhatsApp business phone (if any): \n\nThank you."
  )}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </nav>

      <header className="mb-10 border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Data Deletion Instructions
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Muziclly Growth OS — compliant with Meta Platform Policy, GDPR, and
          CCPA.
        </p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed">
        <section>
          <p>
            You can request deletion of your personal data held by Muziclly
            Growth OS at any time. This includes data obtained through
            Facebook Login, Instagram Graph API, Facebook Marketing API, and
            the WhatsApp Business Cloud API.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            Option 1 — Delete from within the app
          </h2>
          <ol className="mt-2 list-decimal pl-6 space-y-1">
            <li>Sign in to Muziclly Growth OS.</li>
            <li>
              Go to <strong>Settings → Integrations</strong> and disconnect
              Meta, WhatsApp, and Google connections you want removed.
            </li>
            <li>
              Go to <strong>Settings → Account → Delete account</strong> to
              erase your account and all associated data.
            </li>
          </ol>
          <p className="mt-2 text-sm text-muted-foreground">
            Disconnection immediately revokes stored access tokens and stops
            new data collection from those assets.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            Option 2 — Remove the app from Facebook / Instagram
          </h2>
          <ol className="mt-2 list-decimal pl-6 space-y-1">
            <li>
              Go to{" "}
              <a
                className="underline"
                href="https://www.facebook.com/settings?tab=business_tools"
                target="_blank"
                rel="noreferrer"
              >
                Facebook Settings → Business Integrations
              </a>
              .
            </li>
            <li>Locate <strong>Muziclly Growth OS</strong> and click Remove.</li>
            <li>
              Check <em>"Delete all posts, videos or events…"</em> if
              available, then confirm.
            </li>
          </ol>
          <p className="mt-2">
            Meta will notify us and we will delete data associated with your
            user ID within {RESPONSE_WINDOW}.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            Option 3 — Email deletion request
          </h2>
          <p className="mt-2">
            Send an email to{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            from the email address associated with your account. Include:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Your account email</li>
            <li>Any connected Facebook Page or Instagram username</li>
            <li>Any connected WhatsApp business phone number</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={mailto}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Compose deletion email
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {copied ? "Copied!" : `Copy ${CONTACT_EMAIL}`}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What gets deleted</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Your account profile, credentials, and preferences.</li>
            <li>
              Leads, contacts, conversations, and message history you own.
            </li>
            <li>
              Meta / Facebook / Instagram / WhatsApp access tokens, IDs, and
              cached metadata.
            </li>
            <li>Google OAuth tokens and cached metadata.</li>
            <li>Diagnostic logs referencing your user ID.</li>
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Aggregated, anonymized analytics that cannot identify you may be
            retained. Data we are legally required to keep (e.g. billing
            records) is retained for the minimum required period, then
            deleted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Timeline</h2>
          <p className="mt-2">
            We confirm receipt within 72 hours and complete deletion within{" "}
            {RESPONSE_WINDOW} of a verified request. You will receive an email
            confirmation once deletion is complete.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Questions</h2>
          <p className="mt-2">
            For questions about this process see our{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            or contact{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
