export default function About() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">About</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Our Little World</h1>
      </section>
      
      <div className="space-y-6">
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          A Little World With Us is a private relationship app designed to help couples
          celebrate their love, preserve memories, and build meaningful rituals together.
        </p>

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
          <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">Our Mission</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            To create a digital space where couples can nurture their relationship,
            celebrate milestones, and build lasting memories together.
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
