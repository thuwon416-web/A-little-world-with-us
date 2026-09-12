export default function Privacy() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Legal</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Privacy Policy</h1>
        <div className="mt-4 text-sm text-[var(--text-secondary)]">
          <p>Version: 1.0</p>
          <p>Effective Date: September 12, 2026</p>
          <p>Last Updated: September 12, 2026</p>
        </div>
      </section>

      <div className="space-y-6 text-[var(--text-primary)]">
        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">1. Data Collection</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We collect only essential data to provide app functionality: memories, messages,
            settings, and couple preferences. We do not collect unnecessary personal information.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">2. Data Usage</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Your data is used solely to provide app functionality and improve your experience. We do
            not sell, rent, or share your personal data with third parties for marketing purposes.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">3. Data Security</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            All data is encrypted in transit and at rest using industry-standard security practices.
            We implement appropriate technical and organizational measures to protect your
            information.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">4. Your Rights</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            You have the right to access, export, or delete your data at any time from the Settings
            page. You can also update your preferences and control what information is shared.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">5. Cookies and Local Storage</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We use browser local storage and cookies to maintain your session and preferences. You
            can control cookie settings through your browser preferences.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">6. Third-Party Services</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We may use third-party services for authentication (Supabase) and AI features. These
            services have their own privacy policies which we encourage you to review.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">7. AI Features</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            AI features process only the data you choose to submit for that feature. Your AI
            requests are used to provide the requested response and are not intended to provide the
            AI with unrestricted access to your private couple data.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">8. Data Retention</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We retain your account data while your account remains active or as needed to provide
            the service. You can export or delete available data through Settings, subject to any
            retention required for security or legal obligations.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">9. Contact</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            For privacy questions or concerns, contact us at privacy@alittleworldwithus.com
          </p>
        </section>
      </div>
    </main>
  )
}
