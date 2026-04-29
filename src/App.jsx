import { useState, useEffect, lazy, Suspense } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Mail,
  FileText,
  Plane,
  Briefcase,
  Shield,
  CheckCircle,
  Lock,
  Eye,
  FileCheck,
  ArrowRight,
  Clock,
  Users,
  ChevronDown,
} from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";

const AcquisitionDesk = lazy(() => import("./AcquisitionDesk"));
const AccessRequest = lazy(() => import("./AccessRequest"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const OutreachEmailBrain = lazy(() => import("./OutreachEmailBrain"));

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

function Navigation({ onViewCapabilities, onRequestAccess }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "glass" : ""}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-serif text-2xl tracking-tight">Blackwood</span>
          <span className="text-xs tracking-[0.15em] text-text-muted uppercase font-medium">
            Private Office
          </span>
        </div>
        <button
          onClick={onRequestAccess}
          className="px-5 py-2.5 text-sm tracking-wide border border-border rounded-full hover:border-text-secondary/30 transition-colors"
        >
          Request Access
        </button>
      </div>
    </motion.nav>
  );
}

function Badge() {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.1 }}
      className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass mb-8"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
      <span className="text-xs tracking-[0.1em] uppercase text-text-secondary">
        Invite-only operating layer
      </span>
    </motion.div>
  );
}

function Hero({ onViewCapabilities, onRequestAccess }) {
  return (
    <section className="min-h-screen flex items-center pt-24 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 glow" />
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
        <div className="relative z-10">
          <Badge />

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6"
          >
            Quiet coordination
            <br />
            <span className="text-text-secondary">for people whose life</span>
            <br />
            outgrew their calendar.
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="text-text-secondary text-lg leading-relaxed max-w-lg mb-10"
          >
            Blackwood coordinates communications, travel, advisors, documents,
            approvals, and daily decisions—a private operating layer that
            anticipates needs before they arise.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={onRequestAccess}
              className="px-8 py-3.5 bg-text-primary text-background-primary rounded-full text-sm font-medium tracking-wide hover:bg-text-secondary transition-colors"
            >
              Request Private Access
            </button>

            <button
              onClick={onViewCapabilities}
              className="px-8 py-3.5 border border-border rounded-full text-sm tracking-wide hover:border-text-secondary/30 transition-colors flex items-center gap-2"
            >
              View Capabilities
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.5 }}
          className="hidden lg:block"
        >
          <div className="glass rounded-2xl p-6 relative animate-float">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs tracking-[0.1em] uppercase text-text-muted">
                  Morning Brief
                </span>
              </div>
              <span className="text-xs text-text-muted">Today, 7:42 AM</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg bg-surface/50">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm mb-1">Flight confirmed to Zurich</p>
                  <p className="text-xs text-text-muted">
                    Departure 14:00 • Terminal A
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg bg-surface/50">
                <Mail className="w-5 h-5 text-text-secondary mt-0.5" />
                <div>
                  <p className="text-sm mb-1">12 messages reviewed</p>
                  <p className="text-xs text-text-muted">
                    Priority items flagged
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg bg-surface/50">
                <FileCheck className="w-5 h-5 text-text-secondary mt-0.5" />
                <div>
                  <p className="text-sm mb-1">3 documents require signature</p>
                  <p className="text-xs text-text-muted">Ready for review</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-text-muted">
                Your team: 4 active handlers
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const capabilities = [
  {
    icon: Mail,
    title: "Communications Desk",
    description:
      "Priority message handling with human review for sensitive correspondence.",
  },
  {
    icon: FileText,
    title: "Daily Command Briefs",
    description:
      "Curated morning summaries of what demands your attention and what can wait.",
  },
  {
    icon: Plane,
    title: "Private Travel Operations",
    description:
      "Discrete itinerary management, bookings, and logistics handled silently.",
  },
  {
    icon: Briefcase,
    title: "Wealth Workflow Support",
    description: "Legal, tax, and advisory coordination across jurisdictions.",
  },
];

function Capabilities() {
  return (
    <section id="capabilities" className="py-24 relative scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...fadeUp} className="mb-16">
          <span className="text-xs tracking-[0.15em] uppercase text-text-muted">
            Capabilities
          </span>
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-6">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              className="glass rounded-xl p-8 hover:border-text-secondary/20 transition-colors group"
            >
              <cap.icon className="w-6 h-6 mb-5 text-text-secondary group-hover:text-text-primary transition-colors" />
              <h3 className="font-serif text-2xl mb-3">{cap.title}</h3>
              <p className="text-text-secondary leading-relaxed">
                {cap.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Positioning() {
  return (
    <section className="py-24 relative">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div {...fadeUp}>
          <h2 className="font-serif text-4xl md:text-5xl mb-16 leading-tight">
            Not a chatbot. Not a concierge app.
            <br />
            <span className="text-text-secondary">
              A private operating layer.
            </span>
          </h2>
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-8">
          {[
            {
              icon: CheckCircle,
              title: "Approval-first execution",
              desc: "No action taken without your explicit confirmation.",
            },
            {
              icon: Eye,
              title: "Human review for sensitive actions",
              desc: "Trained handlers review before any communication leaves.",
            },
            {
              icon: Lock,
              title: "Private-by-design workflows",
              desc: "Architecture built for discretion from the ground up.",
            },
            {
              icon: Users,
              title: "Invite-only client onboarding",
              desc: "Each relationship begins with careful introduction.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              className="text-left"
            >
              <div className="flex items-start gap-4">
                <item.icon className="w-5 h-5 text-accent mt-1" />
                <div>
                  <h4 className="font-medium mb-2">{item.title}</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function OnboardingCTA({ onRequestAccess }) {
  return (
    <section className="py-24 relative">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div {...fadeUp}>
          <span className="text-xs tracking-[0.15em] uppercase text-text-muted">
            Private Onboarding
          </span>

          <h2 className="font-serif text-4xl md:text-5xl mt-6 mb-6">
            Configured by hand.
          </h2>

          <p className="text-text-secondary text-lg leading-relaxed mb-10">
            Each client workflow is built individually. We learn your
            preferences, understand your requirements, and create a coordination
            layer that operates exactly as you would—no template, no compromise.
          </p>

          <button
            onClick={onRequestAccess}
            className="px-10 py-4 bg-text-primary text-background-primary rounded-full text-sm font-medium tracking-wide hover:bg-text-secondary transition-colors"
          >
            Begin Access Request
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-text-muted text-sm">
          © 2026 Blackwood Private Office
        </p>
        <p className="text-xs text-text-muted/60 mt-2 tracking-widest">
          Discretion. Control. Execution.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState(() =>
    window.location.hash === "#outreach" ? "outreach" : "landing",
  );
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const handleViewCapabilities = () => {
    setCurrentView("landing");
    window.requestAnimationFrame(() => {
      document
        .getElementById("capabilities")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <ErrorBoundary>
      {currentView === "access" ? (
        <div className="min-h-screen bg-background-primary">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <AccessRequest onBack={() => setCurrentView("landing")} />
          </Suspense>
        </div>
      ) : currentView === "admin" ? (
        <div className="min-h-screen bg-background-primary">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <AdminDashboard />
          </Suspense>
        </div>
      ) : currentView === "desk" ? (
        <div className="min-h-screen bg-background-primary">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-white/[0.015] blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-white/[0.01] blur-[100px]" />
          </div>
          <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView("landing")}
                  className="font-serif text-xl tracking-tight hover:text-text-secondary transition-colors"
                >
                  Blackwood
                </button>
                <span className="text-text-muted">/</span>
                <span className="text-sm text-text-secondary">
                  Acquisition Desk
                </span>
              </div>
            </div>
          </header>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <AcquisitionDesk />
          </Suspense>
        </div>
      ) : currentView === "outreach" ? (
        <div className="min-h-screen bg-background-primary">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <OutreachEmailBrain />
          </Suspense>
        </div>
      ) : (
        <div className="relative">
          <motion.div
            className="fixed inset-0 pointer-events-none"
            style={{ y: backgroundY }}
          >
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/[0.02] blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/[0.02] blur-3xl" />
          </motion.div>

          <div className="relative">
            <Navigation
              onViewCapabilities={handleViewCapabilities}
              onRequestAccess={() => setCurrentView("access")}
            />
            <Hero
              onViewCapabilities={handleViewCapabilities}
              onRequestAccess={() => setCurrentView("access")}
            />
            <Capabilities />
            <Positioning />
            <OnboardingCTA onRequestAccess={() => setCurrentView("access")} />
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
