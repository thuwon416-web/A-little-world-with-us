import Link from 'next/link'

export default function About() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">About</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Our Little World</h1>
      </section>

      <div className="space-y-6">
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          A Little World With Us is a private relationship app designed to help couples celebrate
          their love, preserve memories, and build meaningful rituals together.
        </p>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">App Information</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--text-secondary)]">App Name</dt>
              <dd className="font-medium text-[var(--text-primary)]">A Little World With Us</dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Version</dt>
              <dd className="font-medium text-[var(--text-primary)]">1.0.0</dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Platform</dt>
              <dd className="font-medium text-[var(--text-primary)]">Web + Android</dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Last Updated</dt>
              <dd className="font-medium text-[var(--text-primary)]">September 12, 2026</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">Features</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">📸</span>
              <span>Memory timeline with photos and notes</span>
            </li>
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">🎯</span>
              <span>Relationship goals and progress tracking</span>
            </li>
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">💬</span>
              <span>Private messaging between partners</span>
            </li>
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">📝</span>
              <span>Shared todo lists and reminders</span>
            </li>
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">💌</span>
              <span>Daily love notes and gentle reminders</span>
            </li>
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">🌙</span>
              <span>Bedtime stories and evening rituals</span>
            </li>
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">🎨</span>
              <span>Random date ideas generator</span>
            </li>
            <li className="flex items-center gap-3 text-[var(--text-primary)]">
              <span className="text-2xl">🤖</span>
              <span>AI-powered relationship assistant</span>
            </li>
          </ul>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">Support</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            For setup help, questions, or feature feedback, email support@alittleworldwithus.com.
            We&apos;ll review your message as soon as possible.
          </p>
          <Link
            href="/help"
            className="mt-4 inline-flex rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]"
          >
            Visit Help & FAQ
          </Link>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                How do I link with my partner?
              </h3>
              <p className="mt-1 text-[var(--text-secondary)]">
                Use the couple-linking flow from the app and share the invite with your partner.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">How is my data secured?</h3>
              <p className="mt-1 text-[var(--text-secondary)]">
                The app uses authenticated access and couple-scoped data access to protect shared
                content.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Does AI read my messages?
              </h3>
              <p className="mt-1 text-[var(--text-secondary)]">
                AI features process only the data you choose to submit for an AI request.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Can I export my data?</h3>
              <p className="mt-1 text-[var(--text-secondary)]">
                Yes. Use the Export option in Settings to download available account data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                How do I delete my account?
              </h3>
              <p className="mt-1 text-[var(--text-secondary)]">
                Open Settings and review the account-management options, or contact support for
                help.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Is my location shared with anyone?
              </h3>
              <p className="mt-1 text-[var(--text-secondary)]">
                Location sharing is an opt-in couple feature and is intended for your accepted
                partner.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">Our Mission</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            To create a digital space where couples can nurture their relationship, celebrate
            milestones, and build lasting memories together.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
          <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">Built With Love</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Made for couples who believe that every day together is worth celebrating. 💕
          </p>
        </section>
      </div>
    </main>
  )
}
