"use client";

import { useMemo, useState } from "react";
import {
  ShoppingCart, Search, X, BookOpen, Music, Plus, Minus, Trash2, ShieldCheck, Truck, Check, AlertCircle, Loader2,
} from "lucide-react";
import styles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";

// Real Razorpay Checkout integration: /api/checkout/create-order opens a
// Razorpay order server-side, checkout.razorpay.com's script renders the
// actual payment modal (cards/UPI/netbanking/wallets — whatever the
// merchant account has enabled), and /api/checkout/verify confirms the
// signed response before the order is treated as paid. See those two route
// files for the server half and .env.example for the required credentials.

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (typeof window.Razorpay !== "undefined") return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment gateway. Check your connection and try again."));
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

// Rebuilt from the recovered "Muziclly Store v2" basic prototype (admin-store-label.zip)
// into a full Next.js storefront: catalog, cart drawer, and checkout. Product catalog
// ported verbatim from the recovered mock inventory (courses, instruments, books,
// accessories, bundles).

interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  level?: string;
  price: number;
  description: string;
  stock?: number;
  tint: string;
}

const PRODUCTS: Product[] = [
  { id: "c-k-1", name: "Keyboard Mastery: Level 1", category: "courses", subCategory: "Keyboard", level: "Basic", price: 49.99, description: "Foundation skills: hand placement, reading notation, basic chords.", tint: "#dbeafe" },
  { id: "c-k-2", name: "Keyboard Mastery: Level 2", category: "courses", subCategory: "Keyboard", level: "Intermediate", price: 69.99, description: "Progressing to scales, arpeggios, and hand independence.", tint: "#dbeafe" },
  { id: "c-k-3", name: "Keyboard Mastery: Level 3", category: "courses", subCategory: "Keyboard", level: "Advanced", price: 89.99, description: "Professional techniques, improvisation, and complex theory.", tint: "#dbeafe" },
  { id: "c-g-1", name: "Guitar Fundamentals: Level 1", category: "courses", subCategory: "Guitar", level: "Basic", price: 49.99, description: "First steps: tuning, open chords, and strumming patterns.", tint: "#ffedd5" },
  { id: "k-beg-1", name: "Muziclly Key-Start 61", category: "keyboards", subCategory: "Beginner", price: 199, description: "61-key portable keyboard. Perfect for Level 1 students.", stock: 20, tint: "#e2e8f0" },
  { id: "k-int-1", name: "Muziclly Learn-88", category: "keyboards", subCategory: "Intermediate", price: 449, description: "88-key semi-weighted digital piano for serious practice.", stock: 12, tint: "#e2e8f0" },
  { id: "k-adv-1", name: "Muziclly Pro-Grand", category: "keyboards", subCategory: "Advanced", price: 899, description: "Flagship hammer-action digital piano with realistic feel.", stock: 5, tint: "#cbd5e1" },
  { id: "k-work-1", name: "Muziclly Synth-X Workstation", category: "keyboards", subCategory: "Workstation", price: 1299, description: "Professional production workstation with synthesis and sequencing.", stock: 3, tint: "#e9d5ff" },
  { id: "g-beg-1", name: "Muziclly Acoustic G1", category: "guitars", subCategory: "Beginner", price: 149, description: "Dreadnought acoustic. Low action setup for easy learning.", stock: 15, tint: "#fef3c7" },
  { id: "g-int-1", name: "Muziclly Acoustic G2 Solid", category: "guitars", subCategory: "Intermediate", price: 299, description: "Solid spruce top acoustic for richer tone and projection.", stock: 10, tint: "#fef3c7" },
  { id: "g-adv-1", name: "Muziclly Luthier Series", category: "guitars", subCategory: "Advanced", price: 799, description: "Handcrafted all-wood construction for professional performance.", stock: 4, tint: "#fde68a" },
  { id: "g-elec-1", name: "Muziclly Strat-E", category: "guitars", subCategory: "Electric Guitar", price: 249, description: "Versatile electric guitar with S-S-S pickup configuration.", stock: 8, tint: "#fecaca" },
  { id: "g-class-1", name: "Muziclly Nylon-C", category: "guitars", subCategory: "Classical Guitar", price: 189, description: "Traditional nylon string guitar for classical repertoire.", stock: 6, tint: "#fed7aa" },
  { id: "g-bass-1", name: "Muziclly Bass-4", category: "guitars", subCategory: "Bass Guitar", price: 279, description: "4-string precision bass with punchy low-end tone.", stock: 5, tint: "#c7d2fe" },
  { id: "b-1", name: "Muziclly Theory: Level 1", category: "books", price: 19.99, description: "Essential theory workbook.", stock: 50, tint: "#f3f4f6" },
  { id: "a-1", name: "Clip-on Tuner", category: "accessories", price: 14.99, description: "Chromatic tuner for guitar, bass, ukulele, and violin.", stock: 100, tint: "#f3f4f6" },
  { id: "bun-1", name: "Ultimate Beginner Piano Bundle", category: "bundles", price: 229, description: "Key-Start 61 + Course Level 1 + Stand.", stock: 5, tint: "#c7d2fe" },
];

const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "courses", name: "Courses" },
  { id: "keyboards", name: "Keyboards" },
  { id: "guitars", name: "Guitars" },
  { id: "books", name: "Books" },
  { id: "accessories", name: "Accessories" },
  { id: "bundles", name: "Bundles" },
];

interface CartLine { product: Product; qty: number }

export default function StorePage() {
  const { user } = useAuth(); // optional — Store checkout stays guest-friendly; attaches the buyer when signed in
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [customer, setCustomer] = useState({ name: "", email: "", address: "", city: "", zip: "" });

  const filtered = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          (activeCategory === "all" || p.category === activeCategory) &&
          p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [activeCategory, search],
  );

  const cartCount = cart.reduce((a, l) => a + l.qty, 0);
  const subtotal = cart.reduce((a, l) => a + l.product.price * l.qty, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product, qty: 1 }];
    });
    setCartOpen(true);
  };
  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return setCart((prev) => prev.filter((l) => l.product.id !== id));
    setCart((prev) => prev.map((l) => (l.product.id === id ? { ...l, qty } : l)));
  };

  const payWithRazorpay = async () => {
    setCheckoutError(null);
    setSubmitting(true);
    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: subtotal,
          receipt: `store_${Date.now()}`,
          module: "store",
          userId: user?.id, // omitted entirely for guest checkout — undefined isn't sent by JSON.stringify
          productRef: cart.map((l) => `${l.product.id}x${l.qty}`).join(","),
          description: `Store order: ${cartCount} item${cartCount === 1 ? "" : "s"}`,
          notes: { customerEmail: customer.email, items: String(cartCount) },
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not start checkout.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Muziclly Store",
        description: `${cartCount} item${cartCount === 1 ? "" : "s"}`,
        prefill: { name: customer.name, email: customer.email },
        notes: { address: customer.address },
        theme: { color: "#111827" },
        handler: async (response: unknown) => {
          try {
            const r = response as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(r),
            });
            const verified = await verifyRes.json();
            if (!verifyRes.ok || !verified.verified) throw new Error(verified.error || "Payment could not be verified.");
            setPaymentId(verified.paymentId);
            setOrderPlaced(true);
            setCart([]);
          } catch (err) {
            setCheckoutError(err instanceof Error ? err.message : "Payment verification failed.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      rzp.on("payment.failed", (response: unknown) => {
        const r = response as { error?: { description?: string } };
        setCheckoutError(r?.error?.description || "Payment failed. Please try again.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Could not start checkout.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoWrap}>
            <span className={styles.logoMark}>M</span>
            <span className={styles.logoText}>Muziclly<span className={styles.logoLight}>Store</span></span>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.iconBtn} onClick={() => setCartOpen(true)} aria-label="Open cart">
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div className={styles.catRow}>
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                className={`${styles.catBtn} ${activeCategory === c.id ? styles.catBtnActive : ""}`}>
                {c.name}
              </button>
            ))}
          </div>
          <div className={styles.searchWrap}>
            <Search size={17} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 && <div className={styles.emptyState}>No products match your search.</div>}
        {filtered.map((p) => (
          <div key={p.id} className={styles.card}>
            <div className={styles.cardMedia} style={{ background: p.tint }}>
              {p.category === "courses" ? <BookOpen size={40} opacity={0.7} /> : <Music size={44} opacity={0.7} />}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTopRow}>
                <span className={styles.cardCat}>{p.subCategory ?? p.category}</span>
                {p.level && <span className={styles.cardLevel}>{p.level}</span>}
              </div>
              <h3 className={styles.cardName}>{p.name}</h3>
              <p className={styles.cardDesc}>{p.description}</p>
              <div className={styles.cardFoot}>
                <span className={styles.cardPrice}>${p.price.toFixed(2)}</span>
                <button className={styles.addBtn} onClick={() => addToCart(p)}><Plus size={14} /> Add</button>
              </div>
              {p.stock !== undefined && <p className={styles.stockNote}>{p.stock} in stock</p>}
            </div>
          </div>
        ))}
      </div>

      {cartOpen && (
        <>
          <div className={styles.overlay} onClick={() => setCartOpen(false)} />
          <div className={styles.drawer} role="dialog" aria-modal="true">
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>Your Cart ({cartCount})</span>
              <button className={styles.iconBtn} onClick={() => setCartOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.drawerBody}>
              {cart.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>Your cart is empty.</p>}
              {cart.map((line) => (
                <div key={line.product.id} className={styles.cartRow}>
                  <div className={styles.cartThumb} style={{ background: line.product.tint }}>
                    <Music size={20} opacity={0.7} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className={styles.cartRowName}>{line.product.name}</div>
                    <div className={styles.cartRowPrice}>${line.product.price.toFixed(2)}</div>
                    <div className={styles.qtyRow}>
                      <button className={styles.qtyBtn} onClick={() => setQty(line.product.id, line.qty - 1)}><Minus size={12} /></button>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: "center" }}>{line.qty}</span>
                      <button className={styles.qtyBtn} onClick={() => setQty(line.product.id, line.qty + 1)}><Plus size={12} /></button>
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => setQty(line.product.id, 0)}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className={styles.drawerFoot}>
                <div className={styles.subtotalRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <button className={styles.checkoutBtn} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {checkoutOpen && (
        <>
          <div className={styles.overlay} onClick={() => setCheckoutOpen(false)} />
          <div className={styles.drawer} style={{ maxWidth: 480 }} role="dialog" aria-modal="true">
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>Checkout</span>
              <button className={styles.iconBtn} onClick={() => { setCheckoutOpen(false); setOrderPlaced(false); setCheckoutError(null); }}><X size={20} /></button>
            </div>
            <div className={styles.drawerBody}>
              {orderPlaced ? (
                <div className={styles.successState}>
                  <div style={{ width: 56, height: 56, borderRadius: 999, background: "#dcfce7", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                    <Check size={28} color="#16a34a" />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Payment successful!</h3>
                  <p style={{ color: "#6b7280", fontSize: 14 }}>A confirmation has been sent to your email.</p>
                  {paymentId && <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>Payment ID: {paymentId}</p>}
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); void payWithRazorpay(); }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}><label className={styles.fieldLabel}>Full name</label>
                      <input required className={styles.fieldInput} value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} /></div>
                    <div className={styles.field}><label className={styles.fieldLabel}>Email</label>
                      <input required type="email" className={styles.fieldInput} value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} /></div>
                    <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.fieldLabel}>Shipping address</label>
                      <input required className={styles.fieldInput} value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} /></div>
                    <div className={styles.field}><label className={styles.fieldLabel}>City</label>
                      <input required className={styles.fieldInput} value={customer.city} onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))} /></div>
                    <div className={styles.field}><label className={styles.fieldLabel}>ZIP / Postal code</label>
                      <input required className={styles.fieldInput} value={customer.zip} onChange={(e) => setCustomer((c) => ({ ...c, zip: e.target.value }))} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ShieldCheck size={14} /> Secured by Razorpay</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Truck size={14} /> Ships in 3-5 days</span>
                  </div>
                  <div className={styles.subtotalRow}><span>Total</span><span>${subtotal.toFixed(2)}</span></div>
                  {checkoutError && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#b91c1c" }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{checkoutError}</span>
                    </div>
                  )}
                  <button type="submit" className={styles.checkoutBtn} disabled={submitting}>
                    {submitting ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center", width: "100%" }}>
                        <Loader2 size={16} className={styles.spin} /> Processing…
                      </span>
                    ) : (
                      `Pay $${subtotal.toFixed(2)}`
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
