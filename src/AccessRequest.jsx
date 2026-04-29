import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  Loader2,
  Mail,
  Send,
  Shield,
} from "lucide-react";
import { submitAccessRequest } from "./lib/accessRequests";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const scopeOptions = [
  "Personal coordination layer",
  "Family office operations",
  "Executive team productivity",
  "Portfolio company oversight",
  "Other (specify in note)",
];

const inputClass =
  "min-h-12 w-full rounded-lg border border-white/[0.07] bg-white/[0.035] px-4 text-sm text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-colors placeholder:text-text-muted focus:border-accent/35 focus:bg-white/[0.055]";

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
      {children}
      {required && <span className="ml-1 text-accent">*</span>}
    </label>
  );
}

export default function AccessRequest({ onBack }) {
  const [formData, setFormData] = useState({
    fullName: "",
    role: "",
    organization: "",
    email: "",
    scope: "",
    note: "",
    source: "landing_page",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await submitAccessRequest({
        full_name: formData.fullName,
        role: formData.role,
        organization: formData.organization,
        email: formData.email,
        scope: formData.scope,
        note: formData.note,
        source: formData.source,
      });

      setSubmitted(true);
    } catch (submitError) {
      console.error("[Access Request] Error:", submitError);
      setError("We could not submit this request. Please review the fields.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    formData.fullName.trim() &&
    formData.role.trim() &&
    formData.email.trim() &&
    formData.email.includes("@");

  if (submitted) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background-primary px-6 py-10 text-text-primary">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.11),transparent_60%)]" />
          <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
        </div>

        <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <motion.section
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 text-center shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 shadow-[0_10px_36px_rgba(212,175,55,0.12)]">
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
            <h1 className="mt-6 text-balance font-serif text-4xl leading-tight">
              Request received
            </h1>
            <p className="mt-4 text-pretty text-sm leading-6 text-text-secondary">
              If aligned, we will reach out privately through the email you
              provided.
            </p>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary active:scale-[0.96]"
              >
                <ArrowLeft className="h-4 w-4" />
                Return
              </button>
            )}
          </motion.section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-primary text-text-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.09),transparent_58%)]" />
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
      </div>

      <main className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.aside
          initial="initial"
          animate="animate"
          variants={stagger}
          className="max-w-xl"
        >
          {onBack && (
            <motion.button
              variants={fadeUp}
              type="button"
              onClick={onBack}
              className="mb-10 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-sm text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary active:scale-[0.96]"
            >
              <ArrowLeft className="h-4 w-4" />
              Blackwood
            </motion.button>
          )}

          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-accent"
          >
            <Shield className="h-3.5 w-3.5" />
            Private access
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-balance font-serif text-5xl leading-[1.02] md:text-6xl"
          >
            Request a quiet operating layer.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-lg text-pretty text-base leading-7 text-text-secondary"
          >
            Share enough context for a private review. Blackwood evaluates fit,
            scope, and urgency before opening a direct conversation.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 grid gap-3 border-l border-white/[0.08] pl-5 text-sm text-text-muted"
          >
            <p>Reviewed manually. No newsletter list.</p>
            <p>Use a direct email monitored by you or your office.</p>
          </motion.div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl"
        >
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/[0.05] bg-black/20 p-5 md:p-7"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  Intake
                </p>
                <h2 className="mt-2 font-serif text-3xl leading-tight">
                  Access request
                </h2>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.035]">
                <Mail className="h-4 w-4 text-accent" />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel required>Full name</FieldLabel>
                <input
                  className={inputClass}
                  placeholder="Avery Stone"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Role</FieldLabel>
                <input
                  className={inputClass}
                  placeholder="Principal, founder, chief of staff"
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Organization</FieldLabel>
                <input
                  className={inputClass}
                  placeholder="Family office, company, or advisory group"
                  value={formData.organization}
                  onChange={(e) =>
                    handleChange("organization", e.target.value)
                  }
                />
              </div>

              <div>
                <FieldLabel required>Email</FieldLabel>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5">
              <FieldLabel>Scope</FieldLabel>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowScopeDropdown((value) => !value)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.035] px-4 text-left text-sm text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-white/15 focus:border-accent/35 focus:outline-none active:scale-[0.96]"
                >
                  <span
                    className={
                      formData.scope ? "text-text-primary" : "text-text-muted"
                    }
                  >
                    {formData.scope || "Select the closest operating need"}
                  </span>
                  <motion.span
                    animate={{ rotate: showScopeDropdown ? 180 : 0 }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                    className="shrink-0 text-text-muted"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showScopeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 6 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute z-20 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-background-secondary p-1 shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
                    >
                      {scopeOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            handleChange("scope", option);
                            setShowScopeDropdown(false);
                          }}
                          className="min-h-10 w-full rounded-lg px-3 text-left text-sm text-text-secondary transition-colors hover:bg-white/[0.045] hover:text-text-primary active:scale-[0.96]"
                        >
                          {option}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-5">
              <FieldLabel>Note</FieldLabel>
              <textarea
                className={`${inputClass} min-h-32 resize-none py-3 leading-6`}
                placeholder="What should Blackwood understand before reviewing this request?"
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
              />
            </div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5 flex items-start gap-3 rounded-lg border border-red-400/15 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200"
                >
                  <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-7 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-text-muted">
                Required fields are marked with gold.
              </p>
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-text-primary px-5 text-sm font-medium text-background-primary transition-colors hover:bg-text-secondary active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit request
              </button>
            </div>
          </form>
        </motion.section>
      </main>
    </div>
  );
}
