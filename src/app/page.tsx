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

export default function Home() {
  return (
    <div className="min-h-screen bg-navy">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Nav />

      {/* Hero */}
      <section className="bg-grain relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,160,23,0.15), transparent), radial-gradient(ellipse 40% 40% at 90% 20%, rgba(212,160,23,0.08), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            Find the money hidden in your JV billing.
            <br />
            <span className="italic text-gold">Never miss another contract deadline.</span>
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
          <span className="text-sm text-white/40">
            No credit card required. We find $50K+ or it&apos;s free.
          </span>
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

      {/* Problem */}
      <section id="product" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-navy-light p-8 shadow-[var(--shadow-card)]">
            <h3 className="font-display text-xl font-semibold text-white">
              The JIB reconciliation grind
            </h3>
            <p className="mt-3 text-white/60">
              Every month, a giant billing statement arrives from the operator.
              A small team checks it by hand against a 150-page contract —
              taking weeks, and errors of 2–5% routinely slip through
              unnoticed for months.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-navy-light p-8 shadow-[var(--shadow-card)]">
            <h3 className="font-display text-xl font-semibold text-white">
              The buried deadline nobody was tracking
            </h3>
            <p className="mt-3 text-white/60">
              Somewhere on page 120 of your JOA is a rule with a real
              deadline. Miss it, and you&apos;re facing penalties — or in the
              worst case, losing your rights to the field entirely.
            </p>
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
        <div className="rounded-2xl border-2 border-gold bg-navy-light p-10 text-center">
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
              className={`rounded-2xl border p-8 ${
                tier.highlighted
                  ? "border-gold bg-navy-light shadow-[var(--shadow-gold)]"
                  : "border-white/10"
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
