import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { pricingTiers, faqs } from "@/lib/mockData";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "OilStrikeAI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI that reads oil & gas contracts and billing statements to catch overbilling and track every deadline, cited to source.",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "1500",
        highPrice: "6000",
      },
      url: "https://oilstrikeai.com",
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

const capabilityPills = [
  "Contract Reading",
  "JIB Reconciliation",
  "Deadline Tracking",
  "Team Delegation",
  "AI Assistant",
];

const roles = [
  {
    name: "Director",
    tagline: "The full picture, at a glance.",
    desc: "See total exposure across every JV, every contract, every open finding — and where your team's attention is actually going.",
  },
  {
    name: "Manager",
    tagline: "Turn findings into action.",
    desc: "Assign discrepancies and deadlines to the right person the moment the AI flags them, with a due date and a clear next step.",
  },
  {
    name: "Employee",
    tagline: "One worklist, no guessing.",
    desc: "Log in to a single queue of exactly what's yours to resolve today — no digging through email threads or shared drives.",
  },
];

function BrowserFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="glow-frame overflow-hidden rounded-2xl shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 truncate text-xs text-white/30">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-navy">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Nav />

      {/* Hero */}
      <section className="bg-grain bg-hud-grid relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,160,23,0.18), transparent), radial-gradient(ellipse 40% 40% at 90% 20%, rgba(212,160,23,0.1), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Built for indigenous & mid-size African operators
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            Find the money hidden in your JV billing.
            <br />
            <span className="italic text-gold" style={{ textShadow: "0 0 30px rgba(212,160,23,0.45)" }}>
              Never miss another contract deadline.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            OilStrikeAI reads your PSC or JOA once and automatically reconciles every
            JIB statement against it — catching overbilling and tracking every
            obligation, cited back to the exact clause, every day.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-lg bg-gold px-8 py-4 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0"
            >
              Get Your Free Discovery Audit
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              Book a Call
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/40">
            No credit card required. We find $50K+ or it&apos;s free.
          </p>

          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-3">
            {capabilityPills.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-white/60"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-white/10 bg-navy-light py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-sm text-white/40">
          <span>Built for indigenous & mid-size African operators</span>
          <span>·</span>
          <span>Backed by real COPAS & JOA/PSC industry standards</span>
          <span>·</span>
          <span>Every finding cited to source, never a black box</span>
        </div>
      </section>

      {/* Feature showcase A — real screenshot */}
      <section id="product" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              Real, cited findings
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
              A risk score you can actually trust
            </h2>
            <p className="mt-4 text-white/60">
              No invented percentages, no black-box math. Your score is computed
              straight from your real open findings and obligations — and every
              dollar shown is money the AI has actually traced to a document,
              never a guess.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-gold">✓</span> Computed from your real open items, not a model output
              </li>
              <li className="flex gap-2">
                <span className="text-gold">✓</span> Every recovered dollar is a resolved finding, cited to source
              </li>
              <li className="flex gap-2">
                <span className="text-gold">✓</span> Updates the moment a new document is analyzed
              </li>
            </ul>
          </div>
          <BrowserFrame title="oilstrikeai.com/dashboard">
            <div className="bg-navy p-2">
              <Image
                src="/screenshots/risk-score.png"
                alt="Live OilStrikeAI risk exposure score card"
                width={1104}
                height={340}
                className="w-full rounded-lg"
              />
            </div>
          </BrowserFrame>
        </div>
      </section>

      {/* Feature showcase B — Daily Queue mockup */}
      <section className="mx-auto max-w-6xl px-6 py-4">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <BrowserFrame title="oilstrikeai.com/dashboard">
              <div className="space-y-3 bg-navy p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Daily Queue
                </p>
                {[
                  { tag: "RED", title: "Overhead recovery exceeds Article 8.1 cap", amt: "$14,200" },
                  { tag: "YELLOW", title: "Insurance certificate expires in 12 days", amt: null },
                  { tag: "WHITE", title: "Freight allocation differs from JOA schedule", amt: "$2,100" },
                ].map((row) => (
                  <div
                    key={row.title}
                    className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-navy-light px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          row.tag === "RED"
                            ? "bg-red-500"
                            : row.tag === "YELLOW"
                              ? "bg-yellow-400"
                              : "bg-white/40"
                        }`}
                      />
                      <span className="text-sm text-white/80">{row.title}</span>
                    </div>
                    {row.amt && <span className="shrink-0 text-sm font-semibold text-money-green">{row.amt}</span>}
                  </div>
                ))}
              </div>
            </BrowserFrame>
          </div>
          <div className="order-1 md:order-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              One worklist, not five spreadsheets
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
              Everything that needs attention today, in one place
            </h2>
            <p className="mt-4 text-white/60">
              New invoices, contract deadlines, and flagged discrepancies all land
              in a single daily queue — sorted by real severity, so nothing
              important gets buried under routine paperwork.
            </p>
          </div>
        </div>
      </section>

      {/* Feature showcase C — Ask AI mockup */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              Trained on your real data
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
              Ask AI, instead of digging through PDFs
            </h2>
            <p className="mt-4 text-white/60">
              Your team already knows how to type a question into ChatGPT — this
              is the same habit, except every answer is grounded in your actual
              contracts, billing, and deadlines, with a citation back to the
              source.
            </p>
            <p className="mt-3 text-sm text-white/40">
              Included on Tier 3 (Large/IOC-adjacent) plans.
            </p>
          </div>
          <BrowserFrame title="AI Assistant">
            <div className="space-y-3 bg-navy p-6">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gold px-4 py-2.5 text-sm font-medium text-navy">
                  What is our biggest open discrepancy?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/10 bg-navy-light px-4 py-2.5 text-sm text-white/80">
                  Your largest open finding is a{" "}
                  <span className="font-semibold text-money-green">$14,200</span>{" "}
                  overhead recovery that exceeds the cap set in{" "}
                  <span className="text-gold">Article 8.1</span> of your JOA.
                  It&apos;s been open for 6 days.
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>
      </section>

      {/* Built for every role */}
      <section className="border-y border-white/10 bg-navy-light py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-white">
            Built for every role on your team
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
            One platform, with the right view for whoever&apos;s logged in.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roles.map((r) => (
              <div
                key={r.name}
                className="glow-corner rounded-2xl border border-white/10 bg-navy p-8 shadow-[var(--shadow-card)] transition hover:border-gold/30"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gold">{r.name}</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-white">{r.tagline}</h3>
                <p className="mt-3 text-sm text-white/60">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-center text-3xl font-semibold tracking-tight text-white">How It Works</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            {
              step: "1",
              title: "Upload your contract + JIB",
              desc: "Drag and drop, or forward it by email. No integration required.",
            },
            {
              step: "2",
              title: "AI reads & cross-references",
              desc: "Watch it work in real time — reading clauses, matching billing lines.",
            },
            {
              step: "3",
              title: "See cited discrepancies",
              desc: "Every finding links back to the exact clause and page it came from.",
            },
            {
              step: "4",
              title: "Daily queue keeps you covered",
              desc: "New invoices and deadlines flow into one worklist, every day.",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-white/10 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold font-bold text-navy">
                {item.step}
              </div>
              <h4 className="mt-4 font-semibold text-white">{item.title}</h4>
              <p className="mt-2 text-sm text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Sample finding mock */}
        <div className="mt-12 rounded-xl border border-gold/30 bg-navy-light p-6">
          <p className="text-xs uppercase tracking-wide text-gold">
            Sample finding
          </p>
          <p className="mt-2 text-white">
            Partner X was billed <span className="font-bold text-gold">$340,000</span> for
            drilling costs. Article 12.3 says this should be split 60/40, not
            50/50.
          </p>
          <p className="mt-1 text-white/60">
            You may be owed <span className="font-bold text-money-green">$68,000</span>.
          </p>
        </div>
      </section>

      {/* Guarantee */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div
          className="rounded-2xl border-2 border-gold bg-navy-light p-10 text-center"
          style={{ boxShadow: "0 0 60px -12px rgba(212,160,23,0.35)" }}
        >
          <h3 className="font-display text-2xl font-semibold text-white">The Guarantee</h3>
          <p className="mt-4 text-lg text-white/70">
            We&apos;ll find at least <span className="font-bold text-gold">$50,000</span> in
            recoverable discrepancies or exposure in your first audit —
            <span className="font-bold text-white"> or it&apos;s free</span>, and you owe
            us nothing.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-center text-3xl font-semibold tracking-tight text-white">Pricing</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
          Priced by JV count and JIB volume, not employee count — you pay for
          the complexity we&apos;re actually solving.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 transition hover:-translate-y-1 ${
                tier.highlighted
                  ? "glow-frame shadow-[var(--shadow-gold)]"
                  : "border border-white/10 hover:border-white/20"
              }`}
            >
              <h3 className="font-semibold text-white">{tier.name}</h3>
              <p className="mt-4 text-3xl font-bold text-white">
                {tier.price}
                <span className="text-base font-normal text-white/50">
                  {tier.period}
                </span>
              </p>
              <p className="mt-2 text-sm text-white/50">{tier.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-white/70">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-gold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
                  tier.highlighted
                    ? "bg-gold text-navy shadow-[var(--shadow-gold)] hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    : "border border-white/20 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-white/40">
          Consulting engagements (contract expansion, follow-up automation,
          full workflow integration) are available separately, once your core
          audit has proven its value.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-center text-3xl font-semibold tracking-tight text-white">
          Frequently Asked Questions
        </h2>
        <div className="mt-10 space-y-4">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-white/10 bg-navy-light p-6"
            >
              <summary className="cursor-pointer list-none font-semibold text-white marker:content-none">
                {f.q}
              </summary>
              <p className="mt-3 text-white/60">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
          Ready to find out what your contracts are hiding?
        </h2>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-lg bg-gold px-8 py-4 text-base font-semibold text-navy transition hover:bg-gold-light"
        >
          Get Your Free Discovery Audit
        </Link>
      </section>

      <Footer />
    </div>
  );
}
