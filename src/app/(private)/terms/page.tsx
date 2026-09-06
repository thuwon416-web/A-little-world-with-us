export default function Terms() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Legal</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Terms of Service</h1>
      </section>
      
      <div className="space-y-6 text-[var(--text-primary)]">
        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">1. Acceptance of Terms</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            By using A Little World With Us, you agree to these terms of service and our privacy policy.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">2. User Responsibilities</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            You are responsible for maintaining the confidentiality of your account and all activities that occur under your account.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">3. Content Ownership</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            You retain ownership of all content you upload, including memories, photos, and messages. We do not claim ownership of your personal data.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">4. Privacy and Data</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your data.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">5. Termination</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">6. Changes to Terms</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We may update these terms from time to time. Continued use of the service constitutes acceptance of any changes.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4">7. Contact</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            For questions about these terms, contact us at legal@alittleworldwithus.com
          </p>
        </section>
      </div>
    </main>
  )
}
