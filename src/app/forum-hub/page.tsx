"use client";

import { useState } from "react";
import { ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { forms } from "./forms-data";
import styles from "./page.module.css";

// Ported from the recovered original (_next/static/chunks/62de1471182e9679.js),
// including the Firestore write and the Google Apps Script webhook the site
// owner uses to mirror submissions into a Google Sheet.
const SHEET_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbylmS-83JwHbkdnR2FlQojFmRJOOHcKNPfi7hm2hQ_y25uiFgHOUKbWw18v5MwCt0ypmQ/exec";

export default function ForumHubPage() {
  const [activeId, setActiveId] = useState(forms[0].id);
  const [data, setData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeForm = forms.find((f) => f.id === activeId) ?? forms[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      const file = (e.target as HTMLInputElement).files?.[0];
      setData((prev) => ({ ...prev, [name]: file ? file.name : "" }));
      return;
    }
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isFirebaseConfigured && db) {
        await addDoc(collection(db, "form_submissions"), {
          formType: activeForm.id,
          formTitle: activeForm.title,
          data,
          createdAt: serverTimestamp(),
          status: "new",
        });
      }
      fetch(SHEET_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, formType: activeForm.id, formTitle: activeForm.title, submittedAt: new Date().toISOString() }),
      }).catch((err) => console.error("Google Sheet Error:", err));

      setSubmitted(true);
      setData({});
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Error submitting form: ", err);
      alert(`Error: ${(err as Error).message || "Something went wrong. Please try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Forum Hub</h1>
        <p className={styles.subtitle}>Connect, Enroll, and Grow. Choose the right form below to get started with Tryvanta Music.</p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.sidebar}>
          <div className={styles.menuCard}>
            <h3 className={styles.menuTitle}>Select a Form</h3>
            <div className={styles.menuList}>
              {forms.map((form) => {
                const Icon = form.icon;
                const isActive = activeId === form.id;
                return (
                  <button
                    key={form.id}
                    onClick={() => {
                      setActiveId(form.id);
                      setData({});
                      setSubmitted(false);
                    }}
                    className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
                  >
                    <Icon size={18} className={styles.icon} aria-hidden="true" />
                    <span>{form.title}</span>
                    {isActive && <ChevronRight size={16} className={styles.chevron} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <div className={styles.formTitleRow}>
              <div className={styles.iconBox}>
                <activeForm.icon size={28} aria-hidden="true" />
              </div>
              <h2 className={styles.formTitle}>{activeForm.title}</h2>
            </div>
            <p className={styles.formDesc}>{activeForm.description}</p>
          </div>

          <div className={styles.formBody}>
            {submitted ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <CheckCircle size={40} aria-hidden="true" />
                </div>
                <h3 className={styles.successTitle}>Submission Received!</h3>
                <p className={styles.successDesc}>
                  Thank you for reaching out. We have received your details and will get back to you shortly via
                  WhatsApp or Email.
                </p>
                <button onClick={() => setSubmitted(false)} className={styles.resetBtn}>
                  Submit Another Response
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.formGrid}>
                {activeForm.fields.map((field) => (
                  <div
                    key={field.name}
                    className={`${styles.fieldGroup} ${field.type === "textarea" || field.type === "file" ? styles.fullWidth : ""}`}
                  >
                    <label htmlFor={field.name} className={styles.label}>
                      {field.label} {field.required && <span className={styles.required}>*</span>}
                    </label>

                    {field.type === "select" ? (
                      <select
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        onChange={handleChange}
                        value={data[field.name] || ""}
                        className={styles.select}
                      >
                        <option value="" disabled>
                          Select {field.label}
                        </option>
                        {field.options?.map((opt) => (
                          <option value={opt} key={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        onChange={handleChange}
                        value={data[field.name] || ""}
                        className={styles.textarea}
                        placeholder={`Enter ${field.label}...`}
                      />
                    ) : field.type === "file" ? (
                      <div className={styles.fileInputWrapper}>
                        <input id={field.name} name={field.name} type="file" required={field.required} onChange={handleChange} className={styles.fileInput} />
                        <p className={styles.fileMeta}>Supported formats: PDF, DOC, DOCX, JPG</p>
                      </div>
                    ) : (
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        required={field.required}
                        onChange={handleChange}
                        value={data[field.name] || ""}
                        className={styles.input}
                        placeholder={field.label}
                      />
                    )}
                  </div>
                ))}

                <div className={`${styles.submitRow} ${styles.fullWidth}`}>
                  <button type="submit" disabled={submitting} className={styles.submitBtn}>
                    {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
