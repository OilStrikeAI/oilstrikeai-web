import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — OilStrikeAI",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16 text-white/70">
        <h1 className="font-display text-3xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/40">Last updated: July 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-semibold text-white">1. What We Collect</h2>
            <p className="mt-2">We collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Contact information you provide (name, work email, company name, WhatsApp number).</li>
              <li>The contracts, billing statements, and related documents you upload for analysis.</li>
              <li>Account information (email, hashed password) if you create an account.</li>
              <li>
                Usage data (pages visited, actions taken in the dashboard) needed to operate and improve
                the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">2. How We Use It</h2>
            <p className="mt-2">
              We use your information to: analyze the documents you upload and generate findings; send
              you your audit results, deadline reminders, and task notifications by email (and WhatsApp,
              where enabled); operate your account and your company&apos;s team; process payment for paid
              subscriptions; and follow up about the Service, including by email, if you request a free
              Discovery Audit. You can unsubscribe from marketing emails at any time using the link in
              those emails.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">3. AI Processing of Your Documents</h2>
            <p className="mt-2">
              When you upload a document, its content is sent to Anthropic&apos;s Claude API to be read
              and analyzed. We do not use your documents to train any AI model, ours or anyone else&apos;s.
              Anthropic processes this content as our service provider under their own data-handling
              commitments, solely to return the analysis back to us for your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">4. Who We Share Data With</h2>
            <p className="mt-2">
              We use the following service providers (&quot;sub-processors&quot;) to operate OilStrikeAI.
              Each only receives the data it needs to perform its function:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong className="text-white">Supabase</strong> — database, authentication, and file storage.</li>
              <li><strong className="text-white">Anthropic</strong> — AI analysis of uploaded documents.</li>
              <li><strong className="text-white">Vercel</strong> — application hosting.</li>
              <li><strong className="text-white">Resend</strong> — transactional email delivery (reminders, notifications).</li>
              <li><strong className="text-white">Stripe</strong> — payment processing for paid subscriptions. We never see or store your full card number.</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal data or your documents to anyone, and we do not share them with
              third parties for their own marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">5. Data Security</h2>
            <p className="mt-2">
              Your data is encrypted in transit (HTTPS/TLS) and at rest. Access within our own system is
              restricted using per-company data isolation (Row Level Security) so that one company&apos;s
              account can never see another&apos;s documents or findings, even in the event of an
              application bug.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">6. Data Retention</h2>
            <p className="mt-2">
              We retain your account data and documents for as long as your account is active. If you
              close your account, we will delete your data within a reasonable period, except where we
              are required to retain records (for example, billing records) by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">7. Your Rights</h2>
            <p className="mt-2">
              You can request a copy of the personal data we hold about you, ask us to correct it, or ask
              us to delete your account and associated data, by emailing{" "}
              <a href="mailto:hello@oilstrikeai.com" className="text-gold hover:underline">
                hello@oilstrikeai.com
              </a>
              . We will respond within a reasonable time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">8. Cookies</h2>
            <p className="mt-2">
              We use only the minimal cookies necessary to keep you securely logged in. We do not use
              third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">9. Children&apos;s Privacy</h2>
            <p className="mt-2">
              The Service is intended for business use by adults and is not directed at children. We do
              not knowingly collect data from anyone under 18.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">10. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. If we make material changes, we will
              notify you by email or through the Service before they take effect.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">11. Contact</h2>
            <p className="mt-2">
              Questions about this Privacy Policy can be sent to{" "}
              <a href="mailto:hello@oilstrikeai.com" className="text-gold hover:underline">
                hello@oilstrikeai.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
