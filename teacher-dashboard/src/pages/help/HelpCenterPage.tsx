import { useState } from "react";
import { ChevronDown, LifeBuoy, Mail, MessageCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const FAQS = [
  {
    q: "How do I claim a trial opportunity?",
    a: "Go to Trial Sessions → Trial Opportunities, review the student's details and course, then click \"Claim trial\" to add it to your schedule.",
  },
  {
    q: "How is my Health Score calculated?",
    a: "Your Health Score blends class feedback, trial feedback, batch retention and trial conversion into a single weekly score. Open the Dashboard to see the full breakdown with benchmarks for each component.",
  },
  {
    q: "How do I apply for leave?",
    a: "Go to My Leaves → Apply for leave, pick your dates and share a reason. Your Trainer Success Manager will approve or reject the request.",
  },
  {
    q: "When are earnings paid out?",
    a: "Earnings statements are generated monthly and shown under Earnings. Once a statement moves to \"Paid\", the payout date is shown on that statement.",
  },
  {
    q: "Can I change my weekly availability?",
    a: "Yes — open My Availability and add or remove time slots any time. Mark a slot as trial-eligible if you're open to taking trial sessions in that window.",
  },
];

export function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = FAQS.filter((f) => f.q.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader title="Help Center" description="Answers to common questions, and ways to reach us." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles…"
              className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
            />
          </div>
          <Card>
            <CardBody className="divide-y divide-ink-100 p-0 dark:divide-ink-800">
              {filtered.map((faq, i) => (
                <div key={faq.q} className="p-4">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="font-semibold text-ink-900 dark:text-white">{faq.q}</span>
                    <ChevronDown className={cn("size-4 shrink-0 text-ink-400 transition-transform", openIndex === i && "rotate-180")} />
                  </button>
                  {openIndex === i && <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{faq.a}</p>}
                </div>
              ))}
              {filtered.length === 0 && <p className="p-6 text-center text-sm text-ink-400">No articles match "{query}".</p>}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <MessageCircle className="size-5" />
              </div>
              <p className="font-display font-semibold text-ink-900 dark:text-white">Chat with support</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Use the "Chat With Support" button in the bottom-right corner for a quick reply.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                <Mail className="size-5" />
              </div>
              <p className="font-display font-semibold text-ink-900 dark:text-white">Email us</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">teachers-support@muziclly.app</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <LifeBuoy className="size-5" />
              </div>
              <p className="font-display font-semibold text-ink-900 dark:text-white">Talk to your TSM</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">Find your Trainer Success Manager under Contacts.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
