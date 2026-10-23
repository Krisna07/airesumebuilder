"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Download, FileText, ScanLine, Sparkles, Wand2 } from "lucide-react";

const STEP_DURATION_MS = 7000;

const steps = [
  {
    id: 0,
    icon: ScanLine,
    title: "Add your experience",
    description: "Paste your resume or import a job description — we extract the key facts for you in seconds.",
  },
  {
    id: 1,
    icon: Wand2,
    title: "Tailor with AI",
    description: "Rewrite bullets, highlight impact, and match the language of the job posting.",
  },
  {
    id: 2,
    icon: Download,
    title: "Export & apply for free",
    description: "Pick an ATS-friendly template and export unlimited PDFs — completely free.",
  },
];

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

/* ---------- Step 1: resume gets scanned, fields are extracted ---------- */
const ExtractVisual = () => {
  const fields = [
    { label: "Job title", value: "Senior Product Designer" },
    { label: "Company", value: "Northwind Labs" },
    { label: "Dates", value: "2021 — Present" },
  ];
  const skills = ["Figma", "User research", "Design systems", "Prototyping"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] gap-4 h-full">
      {/* Source document */}
      <div className="relative rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 overflow-hidden hiw-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">my-resume.pdf</span>
        </div>
        <div className="space-y-2.5">
          {[90, 70, 100, 85, 60, 95, 75, 88, 50].map((w, i) => (
            <div
              key={i}
              className={`h-2 rounded-full ${i === 0 || i === 4 ? "bg-slate-300 dark:bg-slate-500" : "bg-slate-200 dark:bg-slate-700"}`}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        {/* Scanner beam */}
        <div className="hiw-scan absolute inset-x-0 top-0 h-16 pointer-events-none">
          <div className="h-full bg-gradient-to-b from-transparent via-teal-400/20 to-transparent" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-teal-400 shadow-[0_0_12px_2px_rgba(45,212,191,0.6)]" />
        </div>
      </div>

      {/* Extracted data */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hiw-fade-up" style={delay(300)}>
          <Sparkles className="w-3.5 h-3.5" /> Extracted automatically
        </div>
        {fields.map((f, i) => (
          <div
            key={f.label}
            className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 hiw-slide-in"
            style={delay(900 + i * 450)}
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{f.label}</div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100 flex items-center justify-between">
              {f.value}
              <Check className="w-3.5 h-3.5 text-teal-500 hiw-pop" style={delay(1200 + i * 450)} />
            </div>
          </div>
        ))}
        <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 hiw-slide-in" style={delay(2300)}>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span
                key={s}
                className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 hiw-pop"
                style={delay(2600 + i * 180)}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Step 2: weak bullet is rewritten to match the job post ---------- */
const AFTER_TEXT =
  "Led a cross-functional redesign of checkout, lifting conversion 18% through A/B testing.";
const KEYWORDS = ["cross-functional", "conversion", "A/B testing"];

const highlight = (text: string, active: boolean) => {
  const parts = text.split(new RegExp(`(${KEYWORDS.map((k) => k.replace("/", "\\/")).join("|")})`, "g"));
  return parts.map((p, i) =>
    KEYWORDS.includes(p) ? (
      <mark
        key={i}
        className={`rounded px-0.5 transition-colors duration-500 ${active ? "bg-teal-200/70 text-teal-900 dark:bg-teal-400/25 dark:text-teal-200" : "bg-transparent text-inherit"}`}
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

const TailorVisual = ({ reducedMotion }: { reducedMotion: boolean }) => {
  const [typed, setTyped] = useState(reducedMotion ? AFTER_TEXT.length : 0);
  const done = typed >= AFTER_TEXT.length;
  const score = done ? 92 : 41;
  const circumference = 2 * Math.PI * 26;

  useEffect(() => {
    if (reducedMotion) return;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setTyped((t) => {
          if (t >= AFTER_TEXT.length) {
            clearInterval(interval);
            return t;
          }
          return t + 1;
        });
      }, 32);
    }, 1400);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [reducedMotion]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Job posting keywords */}
      <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 hiw-fade-up">
        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Keywords from job posting</div>
        <div className="flex flex-wrap gap-1.5">
          {KEYWORDS.map((k) => (
            <span
              key={k}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-all duration-500 flex items-center gap-1 ${
                done
                  ? "border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                  : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"
              }`}
            >
              {done && <Check className="w-3 h-3" />}
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3 flex-1">
        <div className="flex flex-col gap-2.5">
          {/* Before */}
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-3 hiw-fade-up" style={delay(200)}>
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Before</div>
            <p className={`text-sm text-slate-500 dark:text-slate-400 transition-all duration-700 ${typed > 0 ? "line-through decoration-rose-400/70 opacity-60" : ""}`}>
              • Worked on the checkout page redesign.
            </p>
          </div>
          {/* After */}
          <div className="relative rounded-xl bg-white dark:bg-slate-800 border border-teal-400/60 p-3 shadow-[0_0_0_4px_rgba(20,184,166,0.08)] hiw-fade-up" style={delay(700)}>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-teal-600 dark:text-teal-400 mb-1">
              <Sparkles className={`w-3 h-3 ${!done ? "animate-pulse" : ""}`} /> AI rewrite
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-100 min-h-[3.75rem] leading-relaxed">
              • {highlight(AFTER_TEXT.slice(0, typed), done)}
              {!done && <span className="inline-block w-[2px] h-4 -mb-0.5 ml-0.5 bg-teal-500 hiw-caret" />}
            </p>
          </div>
        </div>

        {/* Match score ring */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 sm:px-4 hiw-fade-up" style={delay(400)}>
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-1">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" className="fill-none stroke-slate-200 dark:stroke-slate-700" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="26"
              className={`fill-none transition-all duration-1000 ease-out ${done ? "stroke-teal-500" : "stroke-amber-400"}`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {score}%
          </span>
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 text-center">Job match</div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Step 3: resume assembles into a template and downloads ---------- */
const TEMPLATES = [
  { name: "Modern", accent: "bg-teal-500" },
  { name: "Classic", accent: "bg-slate-700 dark:bg-slate-300" },
  { name: "Minimal", accent: "bg-indigo-500" },
];

const ExportVisual = ({ reducedMotion }: { reducedMotion: boolean }) => {
  const [template, setTemplate] = useState(0);
  const [phase, setPhase] = useState<"idle" | "loading" | "done">(reducedMotion ? "done" : "idle");

  useEffect(() => {
    if (reducedMotion) return;
    const timers = [
      setTimeout(() => setTemplate(1), 1500),
      setTimeout(() => setTemplate(2), 2500),
      setTimeout(() => setTemplate(0), 3500),
      setTimeout(() => setPhase("loading"), 4300),
      setTimeout(() => setPhase("done"), 5600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  const accent = TEMPLATES[template].accent;

  return (
    <div className="grid grid-cols-[1fr_0.9fr] gap-4 h-full">
      {/* Resume page */}
      <div className="rounded-xl bg-white border border-slate-200 dark:border-slate-600 p-4 shadow-lg hiw-fade-up">
        <div className={`h-1.5 w-full rounded-full mb-3 transition-colors duration-500 ${accent}`} />
        <div className="h-3 w-2/3 rounded bg-slate-800 mb-1.5 hiw-slide-in" style={delay(200)} />
        <div className="h-2 w-1/2 rounded bg-slate-300 mb-4 hiw-slide-in" style={delay(300)} />
        {[0, 1, 2].map((s) => (
          <div key={s} className="mb-3 hiw-slide-in" style={delay(500 + s * 250)}>
            <div className={`h-2 w-1/3 rounded mb-1.5 transition-colors duration-500 ${accent}`} />
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-11/12 rounded bg-slate-200" />
              <div className="h-1.5 w-4/5 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 hiw-fade-up" style={delay(300)}>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Template</div>
          <div className="flex flex-col gap-1.5">
            {TEMPLATES.map((t, i) => (
              <div
                key={t.name}
                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md border transition-all duration-300 ${
                  template === i
                    ? "border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                    : "border-transparent text-slate-500 dark:text-slate-400"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${t.accent}`} />
                {t.name}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 space-y-1.5 hiw-fade-up" style={delay(600)}>
          {["ATS-readable", "Clean formatting", "1 page"].map((c, i) => (
            <div key={c} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hiw-slide-in" style={delay(900 + i * 250)}>
              <span className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
              {c}
            </div>
          ))}
        </div>

        <div
          className={`relative mt-auto overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 hiw-fade-up ${
            phase === "done" ? "bg-emerald-500 text-white" : "bg-teal-600 text-white"
          }`}
          style={delay(800)}
        >
          {phase === "loading" && <span className="absolute inset-y-0 left-0 bg-white/20 hiw-fill" />}
          <span className="relative flex items-center gap-2">
            {phase === "done" ? (
              <>
                <Check className="w-4 h-4 hiw-pop" /> Downloaded
              </>
            ) : (
              <>
                <Download className={`w-4 h-4 ${phase === "loading" ? "animate-bounce" : ""}`} /> Download PDF
              </>
            )}
          </span>
        </div>
        <div className="text-[10px] text-center text-slate-400">Free · Unlimited · No watermark</div>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setHasBeenInView(true);
    }, { rootMargin: "-20% 0px -20% 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const running = inView && !paused;
  const next = () => setActiveTab((i) => (i + 1) % steps.length);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="w-full py-16 md:py-24 text-left"
    >
      <style>{`
        @keyframes hiw-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes hiw-slide-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
        @keyframes hiw-pop { 0% { opacity: 0; transform: scale(0.5); } 70% { transform: scale(1.15); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes hiw-scan { 0% { transform: translateY(-100%); opacity: 0; } 10%, 85% { opacity: 1; } 100% { transform: translateY(260px); opacity: 0; } }
        @keyframes hiw-caret { 50% { opacity: 0; } }
        @keyframes hiw-fill { from { width: 0; } to { width: 100%; } }
        @keyframes hiw-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .hiw-fade-up { animation: hiw-fade-up 0.5s ease-out both; }
        .hiw-slide-in { animation: hiw-slide-in 0.45s ease-out both; }
        .hiw-pop { animation: hiw-pop 0.4s ease-out both; }
        .hiw-scan { animation: hiw-scan 2.2s ease-in-out 2 both; }
        .hiw-caret { animation: hiw-caret 0.8s step-end infinite; }
        .hiw-fill { animation: hiw-fill 1.3s ease-in-out both; }
        .hiw-progress { transform-origin: left; animation: hiw-progress ${STEP_DURATION_MS}ms linear both; }
        @media (prefers-reduced-motion: reduce) {
          .hiw-fade-up, .hiw-slide-in, .hiw-pop, .hiw-fill { animation: none; }
          .hiw-scan, .hiw-caret, .hiw-progress { display: none; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">How it works</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Create a tailored resume in three simple steps — no design skills required.
          </p>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-12 items-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Steps */}
          <ol className="relative flex flex-col gap-2" role="tablist" aria-label="How it works steps">
            {/* Connecting line */}
            <span aria-hidden className="absolute left-[2.15rem] top-10 bottom-10 w-px bg-slate-200 dark:bg-slate-700" />
            {steps.map((step, index) => {
              const active = activeTab === index;
              const Icon = step.icon;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls="how-it-works-panel"
                    onClick={() => setActiveTab(index)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                    className={`relative w-full text-left flex gap-4 p-4 md:p-5 rounded-2xl transition-all duration-300 overflow-hidden ${
                      active
                        ? "bg-white dark:bg-slate-800 shadow-lg shadow-slate-900/5 dark:shadow-black/20 ring-1 ring-slate-200 dark:ring-slate-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <span
                      className={`relative z-10 shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        active
                          ? "bg-teal-500 text-white shadow-[0_0_0_6px_rgba(20,184,166,0.15)]"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-xs font-semibold tracking-wide uppercase text-teal-600 dark:text-teal-400 mb-0.5">
                        Step {index + 1}
                      </span>
                      <span className={`block text-lg font-semibold transition-colors ${active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                        {step.title}
                      </span>
                      <span
                        className={`grid transition-all duration-300 ${active ? "grid-rows-[1fr] opacity-100 mt-1.5" : "grid-rows-[0fr] opacity-0"}`}
                      >
                        <span className="overflow-hidden text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {step.description}
                        </span>
                      </span>
                    </span>

                    {/* Auto-advance progress */}
                    {active && (
                      <span aria-hidden className="absolute left-0 bottom-0 h-0.5 w-full bg-slate-100 dark:bg-slate-700/60">
                        <span
                          key={`progress-${activeTab}`}
                          className="hiw-progress block h-full bg-teal-500"
                          style={{ animationPlayState: running ? "running" : "paused" }}
                          onAnimationEnd={next}
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Animated product preview */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-teal-500/15 via-transparent to-indigo-500/15 blur-2xl" />
            <div
              id="how-it-works-panel"
              role="tabpanel"
              aria-label={steps[activeTab].title}
              className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-black/40"
            >
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-400 truncate">airesumecraft.xyz — {steps[activeTab].title}</span>
              </div>
              {/* Remount on tab change so each animation replays from the start */}
              <div key={activeTab} className="p-4 sm:p-6 min-h-[22rem] sm:h-[23.5rem]">
                {hasBeenInView && activeTab === 0 && <ExtractVisual />}
                {hasBeenInView && activeTab === 1 && <TailorVisual reducedMotion={reducedMotion} />}
                {hasBeenInView && activeTab === 2 && <ExportVisual reducedMotion={reducedMotion} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
