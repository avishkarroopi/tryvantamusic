"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Globe, Video, Briefcase, UsersRound, MessageSquare,
  FileText, BarChart3, Settings, ShieldCheck, LogOut, Search, Bell,
  Plus, MoreVertical, Eye, Lock, History, Terminal, CreditCard, Layers,
  Image as ImageIcon, Music, FileVideo, Download, Trash2, Clock, CheckCircle2,
  AlertCircle, TrendingUp, TrendingDown, Wallet, ToggleLeft, ToggleRight, Server, Mail, KeyRound,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import styles from "./page.module.css";

// Recovered verbatim in spirit from "admin-store-label.zip" / Muziclly Admin Full.txt
// (basic prototype), rebuilt into a full Next.js admin console: sidebar module
// switcher, CMS/Investor Room/CRM/Security modules, plus the Phase-2 KPI dashboard.

const USER_SESSION = { name: "Abhishek Founder", role: "Super Admin", email: "founder@muziclly.com" };

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cms", label: "CMS Website", icon: Globe },
  { id: "investor", label: "Investor Room", icon: Briefcase },
  { id: "crm", label: "CRM Pipeline", icon: UsersRound },
  { id: "media", label: "Media Library", icon: Video },
  { id: "support", label: "Support Tickets", icon: MessageSquare },
  { id: "finance", label: "Finance Logs", icon: CreditCard, restricted: true },
  { id: "analytics", label: "BI Analytics", icon: BarChart3 },
  { id: "security", label: "Security & Audit", icon: ShieldCheck, restricted: true },
  { id: "settings", label: "System Config", icon: Settings, restricted: true },
] as const;

type TabId = (typeof NAV)[number]["id"];

const weeklyActivity = [
  { day: "Mon", users: 0 }, { day: "Tue", users: 0 }, { day: "Wed", users: 0 },
  { day: "Thu", users: 0 }, { day: "Fri", users: 0 }, { day: "Sat", users: 0 }, { day: "Sun", users: 0 },
];
const userDistribution = [
  { name: "Students", value: 11, color: "#3B82F6" },
  { name: "Teachers", value: 6, color: "#10B981" },
];

const cmsPages = [
  { name: "Home", meta: "Last updated 2 hours ago by ContentMgr" },
  { name: "M-Hub", meta: "Last updated 1 day ago by ContentMgr" },
  { name: "Business", meta: "Last updated 3 days ago by Founder" },
  { name: "Invest", meta: "Last updated 1 week ago by Founder" },
  { name: "Team", meta: "Last updated 2 weeks ago by ContentMgr" },
];

const investorDocs = [
  { title: "Muziclly Pitch Deck", desc: "Financial projections and roadmap 2026-2028.", size: "1.2MB PDF", views: 243, badges: [{ t: "v4.2", c: "badgeBlue" }, { t: "Gated", c: "badgeAmber" }] },
  { title: "Detailed Cap Table", desc: "Full equity breakdown and shareholder rights.", size: "450KB XLSX", views: 12, badges: [{ t: "v1.0", c: "badgeBlue" }, { t: "NDA Required", c: "badgeRose" }] },
  { title: "Growth OS Metrics", desc: "Muziclly Growth OS KPI export, trailing 90 days.", size: "890KB PDF", views: 58, badges: [{ t: "v1.0", c: "badgeBlue" }, { t: "Internal", c: "badgeGreen" }] },
];

const crmLeads = [
  { name: "Priya Sharma", email: "priya@example.com", source: "Website Form", stage: "New", owner: "Sales A." },
  { name: "Rahul Verma", email: "rahul@example.com", source: "Investor Portal", stage: "Follow-up", owner: "Founder" },
  { name: "Ananya Iyer", email: "ananya@example.com", source: "Partnership", stage: "Converted", owner: "Founder" },
];

const auditLog = [
  { user: "Founder", action: "Updated Growth OS agent registry", time: "2 min ago", ip: "192.168.1.1" },
  { user: "TechAdmin", action: "Rotated CMS API keys", time: "45 min ago", ip: "10.0.4.52" },
  { user: "ContentMgr", action: "Published 'Home' v4.2", time: "1 hour ago", ip: "45.22.11.0" },
];

const mediaAssets = [
  { name: "founder-guitar.png", type: "image", size: "847KB", uploaded: "3 weeks ago" },
  { name: "journey.png", type: "image", size: "612KB", uploaded: "3 weeks ago" },
  { name: "muzzly_gallery (30 files)", type: "image", size: "18.4MB", uploaded: "3 weeks ago" },
  { name: "mhub/kids-guitar/hero.jpg", type: "image", size: "108KB", uploaded: "1 week ago" },
  { name: "team/avishkarroopi/social-connect.jpg", type: "image", size: "17.6MB", uploaded: "1 week ago" },
  { name: "gplay-promo.mp4", type: "video", size: "4.2MB", uploaded: "2 months ago" },
];

const supportTickets = [
  { id: "TCK-1042", subject: "Can't access Live Classroom on Safari", user: "priya@example.com", priority: "high", status: "open" },
  { id: "TCK-1041", subject: "Billing question — annual plan", user: "rahul@example.com", priority: "normal", status: "pending" },
  { id: "TCK-1039", subject: "M-FALL upload rejects my .mid file", user: "ananya@example.com", priority: "low", status: "resolved" },
  { id: "TCK-1037", subject: "Teacher dashboard shows wrong batch count", user: "meera@example.com", priority: "high", status: "open" },
];

const financeSummary = [
  { label: "MRR", value: "₹0", trend: 0, Icon: Wallet, color: "#2563eb" },
  { label: "Outstanding Invoices", value: "₹0", trend: 0, Icon: CreditCard, color: "#d97706" },
  { label: "Refunds (30d)", value: "₹0", trend: 0, Icon: TrendingDown, color: "#e11d48" },
  { label: "Net Revenue (30d)", value: "₹0", trend: 0, Icon: TrendingUp, color: "#059669" },
];
const financeTransactions: { date: string; desc: string; amount: string; status: string }[] = [];

const revenueBySource = [
  { source: "Courses", value: 0 }, { source: "Store", value: 0 }, { source: "M-Series Tools", value: 0 }, { source: "Growth OS", value: 0 },
];

const featureFlags = [
  { key: "GROWTH_OS_COMPETITIVE_INTEL", label: "Growth OS: Competitive Intelligence", on: false, note: "Needs GOOGLE_PLACES_API_KEY + MARKETING_API_TOKEN" },
  { key: "MFALL_MIDI_UPLOAD", label: "M-FALL: MIDI song upload", on: true, note: "" },
  { key: "STORE_LIVE_PAYMENTS", label: "Store: live payment checkout", on: false, note: "Currently a demo checkout — needs a real gateway" },
  { key: "LABEL_REAL_MEDIA", label: "Label: real audio/video playback", on: false, note: "No media host configured yet — mock player" },
];

const systemEnv = [
  { key: "NEXT_PUBLIC_FIREBASE_*", status: "configured", note: "Auth + Firestore, main site" },
  { key: "MCAM DATABASE_URL", status: "configured", note: "Postgres for M-CAM classroom backend" },
  { key: "LIVEKIT_URL / KEYS", status: "configured", note: "M-CAM audio/video SFU" },
  { key: "GOOGLE_PLACES_API_KEY", status: "missing", note: "Growth OS competitor discovery" },
  { key: "MARKETING_API_TOKEN", status: "missing", note: "Growth OS Meta Ad Library" },
  { key: "LOVABLE_API_KEY", status: "external", note: "Set inside Lovable Cloud, not this app" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.sidebarHead}>
          <div className={styles.sidebarLogo}><Layers size={18} color="#fff" /></div>
          {!collapsed && <span className={styles.sidebarTitle}>MUZICLLY</span>}
        </div>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`${styles.navItem} ${tab === item.id ? styles.navItemActive : ""}`}
            >
              <span className={styles.navItemLeft}>
                <item.icon size={20} />
                {!collapsed && <span className={styles.navItemLabel}>{item.label}</span>}
              </span>
              {!collapsed && "restricted" in item && item.restricted && <Lock size={14} opacity={0.5} />}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar} />
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p className={styles.userName}>{USER_SESSION.name}</p>
                <p className={styles.userRole}>{USER_SESSION.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 32, flex: 1 }}>
            <h1 className={styles.headerTitle} onClick={() => setCollapsed((c) => !c)} style={{ cursor: "pointer" }}>
              {NAV.find((n) => n.id === tab)?.label}
            </h1>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Universal Search…" />
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.envBadge}><span className={styles.envDot} /> PROD_ENV</div>
            <button className={styles.iconBtn}><Bell size={20} /><span className={styles.notifDot} /></button>
            <button className={styles.iconBtn}><LogOut size={20} /></button>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.contentInner}>
            {tab === "dashboard" && <DashboardModule />}
            {tab === "cms" && <CmsModule />}
            {tab === "investor" && <InvestorModule />}
            {tab === "crm" && <CrmModule />}
            {tab === "media" && <MediaLibraryModule />}
            {tab === "support" && <SupportTicketsModule />}
            {tab === "finance" && <FinanceLogsModule />}
            {tab === "analytics" && <BiAnalyticsModule />}
            {tab === "security" && <SecurityModule />}
            {tab === "settings" && <SystemConfigModule />}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, trend, Icon, color }: { label: string; value: string; trend?: number; Icon: typeof Globe; color: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div>
          <p className={styles.statLabel}>{label}</p>
          <h3 className={styles.statValue}>{value}</h3>
          {trend !== undefined && (
            <p className={`${styles.statTrend} ${trend > 0 ? styles.trendUp : trend < 0 ? styles.trendDown : ""}`}>
              {trend > 0 ? "↑" : trend < 0 ? "↓" : "—"} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={styles.statIcon} style={{ background: color }}><Icon size={20} color="#fff" /></div>
      </div>
    </div>
  );
}

function DashboardModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div className={styles.statGrid}>
        <StatCard label="Website Visitors" value="48.2k" trend={12} Icon={Globe} color="#2563eb" />
        <StatCard label="Active CRM Leads" value="1,204" trend={-2} Icon={UsersRound} color="#059669" />
        <StatCard label="Investor Doc Access" value="313" trend={24} Icon={Briefcase} color="#d97706" />
        <StatCard label="Pending Forms" value="14" trend={0} Icon={FileText} color="#7c3aed" />
      </div>

      <div className={styles.grid3}>
        <div className={styles.card}>
          <div className={styles.cardHead}>Weekly Activity</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#2563eb" fill="#2563eb22" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>User Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={userDistribution} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {userDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Legend verticalAlign="bottom" height={24} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.grid3}>
        <div style={{ gridColumn: "span 2" }}><CrmModule compact /></div>
        <div className={styles.card}>
          <div className={styles.cardHead}>Recent Submissions <span className={styles.cardHeadLink}>View All</span></div>
          {[
            { title: "Teacher Application", user: "Alice M.", time: "10m ago" },
            { title: "Investor Inquiry", user: "SeedFund LP", time: "2h ago" },
            { title: "Student Signup", user: "Tom H.", time: "5h ago" },
          ].map((item) => (
            <div key={item.title} className={styles.submissionRow}>
              <div>
                <p className={styles.submissionTitle}>{item.title}</p>
                <p className={styles.submissionUser}>{item.user}</p>
              </div>
              <span className={styles.submissionTime}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>Quick Links</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/teacher" className={styles.btnDark}>Teacher Dashboard →</Link>
          <Link href="/student" className={styles.btnDark}>Student Dashboard →</Link>
          <Link href="/mhub" className={styles.btnDark}>M-Hub →</Link>
          <Link href="/m-leaderboard" className={styles.btnDark}>M-Leaderboard →</Link>
          <Link href="/store" className={styles.btnDark}>Muziclly Store →</Link>
          <Link href="/label" className={styles.btnDark}>Muziclly Label →</Link>
          <Link href="/muzicllyos" className={styles.btnPrimary}>Muziclly Growth OS →</Link>
        </div>
      </div>
    </div>
  );
}

function CmsModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className={styles.moduleHead}>
        <div>
          <h2 className={styles.moduleTitle}>Website Content Manager</h2>
          <p className={styles.moduleDesc}>Update muziclly.com pages, SEO, and layout sections.</p>
        </div>
        <button className={styles.btnPrimary}><Plus size={14} style={{ verticalAlign: -2, marginRight: 4 }} />New Page</button>
      </div>
      {cmsPages.map((page) => (
        <div key={page.name} className={styles.pageRow}>
          <div className={styles.pageRowLeft}>
            <div className={styles.pageIcon}><Globe size={20} /></div>
            <div>
              <h4 className={styles.pageName}>{page.name} Page</h4>
              <p className={styles.pageMeta}>{page.meta}</p>
            </div>
          </div>
          <div className={styles.rowActions}>
            <button><Settings size={18} /></button>
            <button><Eye size={18} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InvestorModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className={styles.moduleHead}>
        <div>
          <h2 className={styles.moduleTitle}>Investor Data Room</h2>
          <p className={styles.moduleDesc}>Gated document management and access auditing.</p>
        </div>
        <div className={styles.btnRow}>
          <button className={styles.btnDark}>Access Logs</button>
          <button className={styles.btnEmerald}>+ Upload Doc</button>
        </div>
      </div>
      <div className={styles.docGrid}>
        {investorDocs.map((doc) => (
          <div key={doc.title} className={styles.docCard}>
            <div className={styles.docBadges}>
              {doc.badges.map((b) => <span key={b.t} className={`${styles.badge} ${styles[b.c]}`}>{b.t}</span>)}
            </div>
            <h3 className={styles.docTitle}>{doc.title}</h3>
            <p className={styles.docDesc}>{doc.desc}</p>
            <div className={styles.docFoot}>
              <span>{doc.size}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} /> {doc.views} Views</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrmModule({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!compact && (
        <div className={styles.moduleHead}>
          <h2 className={styles.moduleTitle}>CRM Pipeline</h2>
          <button className={styles.btnPrimary}><Plus size={14} style={{ verticalAlign: -2, marginRight: 4 }} />New Lead</button>
        </div>
      )}
      {compact && <div className={styles.cardHead}>CRM Pipeline <span className={styles.cardHeadLink}>Open full module</span></div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Contact</th><th>Source</th><th>Stage</th><th>Assigned</th><th /></tr>
          </thead>
          <tbody>
            {crmLeads.map((lead) => (
              <tr key={lead.email}>
                <td><div className={styles.leadName}>{lead.name}</div><div className={styles.leadEmail}>{lead.email}</div></td>
                <td>{lead.source}</td>
                <td><span className={`${styles.badge} ${lead.stage === "New" ? styles.badgeBlue : styles.badgeGreen}`}>{lead.stage}</span></td>
                <td>{lead.owner}</td>
                <td><MoreVertical size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SecurityModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 className={styles.securityHead}><ShieldCheck color="#059669" /> Security &amp; Audit Logs</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div className={styles.terminalCard}>
          <div className={styles.terminalHead}><span>Active API Keys</span><Terminal size={14} /></div>
          <div>$ MUZ_PROD_001 (Expires in 4d)</div>
          <div>$ MUZ_STAG_002 (Rotating…)</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Failed Login Attempts (24h)</div>
          <div className={styles.metricValue} style={{ color: "#e11d48" }}>0</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>System Health</div>
          <div className={styles.metricValue} style={{ color: "#059669" }}>Optimal</div>
        </div>
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardHead}><History size={18} style={{ verticalAlign: -3, marginRight: 8 }} />Immutable Audit Trail</h3>
        {auditLog.map((log) => (
          <div key={log.time + log.user} className={styles.auditRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className={styles.auditAvatar}>{log.user[0]}</div>
              <div><b>{log.user}</b> {log.action}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{log.time}</div>
              <div className={styles.auditIp}>{log.ip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaLibraryModule() {
  const iconFor = (type: string) => (type === "video" ? FileVideo : type === "audio" ? Music : ImageIcon);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className={styles.moduleHead}>
        <div>
          <h2 className={styles.moduleTitle}>Media Library</h2>
          <p className={styles.moduleDesc}>Assets referenced across the public site, M-Hub, and team pages.</p>
        </div>
        <button className={styles.btnPrimary}><Plus size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Upload</button>
      </div>
      <div className={styles.docGrid}>
        {mediaAssets.map((a) => {
          const Icon = iconFor(a.type);
          return (
            <div key={a.name} className={styles.docCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div className={styles.pageIcon}><Icon size={20} /></div>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>{a.type}</span>
              </div>
              <h3 className={styles.docTitle} style={{ fontSize: "0.9375rem", wordBreak: "break-word" }}>{a.name}</h3>
              <div className={styles.docFoot}>
                <span>{a.size} · {a.uploaded}</span>
                <span style={{ display: "flex", gap: 8 }}>
                  <Download size={14} style={{ cursor: "pointer" }} />
                  <Trash2 size={14} style={{ cursor: "pointer" }} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SupportTicketsModule() {
  const statusBadge = (status: string) =>
    status === "open" ? styles.badgeRose : status === "pending" ? styles.badgeAmber : styles.badgeGreen;
  const statusIcon = (status: string) => (status === "resolved" ? CheckCircle2 : status === "pending" ? Clock : AlertCircle);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className={styles.moduleHead}>
        <h2 className={styles.moduleTitle}>Support Tickets</h2>
        <button className={styles.btnPrimary}><Plus size={14} style={{ verticalAlign: -2, marginRight: 4 }} />New Ticket</button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Ticket</th><th>Subject</th><th>User</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            {supportTickets.map((t) => {
              const StatusIcon = statusIcon(t.status);
              return (
                <tr key={t.id}>
                  <td className={styles.leadName}>{t.id}</td>
                  <td>{t.subject}</td>
                  <td className={styles.leadEmail}>{t.user}</td>
                  <td><span className={`${styles.badge} ${t.priority === "high" ? styles.badgeRose : t.priority === "normal" ? styles.badgeBlue : styles.badgeGreen}`}>{t.priority}</span></td>
                  <td>
                    <span className={`${styles.badge} ${statusBadge(t.status)}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <StatusIcon size={11} /> {t.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceLogsModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className={styles.moduleHead}>
        <h2 className={styles.moduleTitle}>Finance Logs</h2>
        <p className={styles.moduleDesc} style={{ marginTop: -8 }}>No live payment gateway is connected yet — see System Config for what&apos;s needed.</p>
      </div>
      <div className={styles.statGrid}>
        {financeSummary.map((s) => <StatCard key={s.label} label={s.label} value={s.value} trend={s.trend} Icon={s.Icon} color={s.color} />)}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {financeTransactions.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0" }}>No transactions yet — connect a payment gateway to populate this log.</td></tr>
            ) : financeTransactions.map((tx) => (
              <tr key={tx.date + tx.desc}><td>{tx.date}</td><td>{tx.desc}</td><td>{tx.amount}</td><td>{tx.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BiAnalyticsModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 className={styles.moduleTitle}>BI Analytics</h2>
      <div className={styles.grid3}>
        <div className={styles.card}>
          <div className={styles.cardHead}>Weekly Activity</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#2563eb" fill="#2563eb22" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>Revenue by Source</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueBySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="source" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardHead}>User Distribution</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={userDistribution} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
              {userDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Legend verticalAlign="bottom" height={24} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8" }}>Charts read from the same in-memory demo dataset as the Dashboard tab — wire a real analytics source (GA4, or Growth OS&apos;s own intel functions) to populate these with live numbers.</p>
    </div>
  );
}

function SystemConfigModule() {
  const [flags, setFlags] = useState(featureFlags);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 className={styles.moduleTitle}>System Config</h2>

      <div className={styles.card}>
        <div className={styles.cardHead}><Server size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Environment &amp; Credentials</div>
        {systemEnv.map((e) => (
          <div key={e.key} className={styles.auditRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <KeyRound size={14} color="#94a3b8" />
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, fontWeight: 700 }}>{e.key}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.note}</div>
              </div>
            </div>
            <span className={`${styles.badge} ${e.status === "configured" ? styles.badgeGreen : e.status === "missing" ? styles.badgeRose : styles.badgeBlue}`}>{e.status}</span>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}><Mail size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Feature Flags</div>
        {flags.map((f) => (
          <div key={f.key} className={styles.auditRow}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</div>
              {f.note && <div style={{ fontSize: 11, color: "#94a3b8" }}>{f.note}</div>}
            </div>
            <button
              onClick={() => setFlags((prev) => prev.map((x) => (x.key === f.key ? { ...x, on: !x.on } : x)))}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: f.on ? "#059669" : "#94a3b8" }}
            >
              {f.on ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
