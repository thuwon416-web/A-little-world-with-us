import Link from 'next/link'
import {
  Bot,
  Camera,
  Heart,
  Mail,
  MessageCircle,
  MoonStar,
  NotebookText,
  Palette,
  Target,
} from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in">
      <section className="rounded-[32px] border border-accent-1/20 bg-card p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">About</p>
        <h1 className="mt-3 text-3xl font-serif text-text-1">Our Little World</h1>
      </section>

      <div className="space-y-6">
        <p className="text-lg text-text-2 leading-relaxed">
          A Little World With Us is a private relationship app designed to help couples celebrate
          their love, preserve memories, and build meaningful rituals together.
        </p>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">App Information</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-2">App Name</dt>
              <dd className="font-medium text-text-1">A Little World With Us</dd>
            </div>
            <div>
              <dt className="text-text-2">Version</dt>
              <dd className="font-medium text-text-1">1.0.0</dd>
            </div>
            <div>
              <dt className="text-text-2">Platform</dt>
              <dd className="font-medium text-text-1">Web + Android</dd>
            </div>
            <div>
              <dt className="text-text-2">Last Updated</dt>
              <dd className="font-medium text-text-1">September 12, 2026</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">Features</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-text-1">
              <Camera className="h-5 w-5 text-accent-1" />
              <span>Memory timeline with photos and notes</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Target className="h-5 w-5 text-accent-1" />
              <span>Relationship goals and progress tracking</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <MessageCircle className="h-5 w-5 text-accent-1" />
              <span>Private messaging between partners</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <NotebookText className="h-5 w-5 text-accent-1" />
              <span>Shared todo lists and reminders</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Mail className="h-5 w-5 text-accent-1" />
              <span>Daily love notes and gentle reminders</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <MoonStar className="h-5 w-5 text-accent-1" />
              <span>Bedtime stories and evening rituals</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Palette className="h-5 w-5 text-accent-1" />
              <span>Random date ideas generator</span>
            </li>
            <li className="flex items-center gap-3 text-text-1">
              <Bot className="h-5 w-5 text-accent-1" />
              <span>AI-powered relationship assistant</span>
            </li>
          </ul>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">Support</h2>
          <p className="text-text-2 leading-relaxed">
            For setup help, questions, or feature feedback, email support@alittleworldwithus.com.
            We&apos;ll review your message as soon as possible.
          </p>
          <Link
            href="/help"
            className="mt-4 inline-flex rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white"
          >
            Visit Help & FAQ
          </Link>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-text-1">
                How do I link with my partner?
              </h3>
              <p className="mt-1 text-text-2">
                Use the couple-linking flow from the app and share the invite with your partner.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-1">How is my data secured?</h3>
              <p className="mt-1 text-text-2">
                The app uses authenticated access and couple-scoped data access to protect shared
                content.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-1">
                Does AI read my messages?
              </h3>
              <p className="mt-1 text-text-2">
                AI features process only the data you choose to submit for an AI request.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-1">Can I export my data?</h3>
              <p className="mt-1 text-text-2">
                Yes. Use the Export option in Settings to download available account data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-1">
                How do I delete my account?
              </h3>
              <p className="mt-1 text-text-2">
                Open Settings and review the account-management options, or contact support for
                help.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-1">
                Is my location shared with anyone?
              </h3>
              <p className="mt-1 text-text-2">
                Location sharing is an opt-in couple feature and is intended for your accepted
                partner.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">Our Mission</h2>
          <p className="text-text-2 leading-relaxed">
            To create a digital space where couples can nurture their relationship, celebrate
            milestones, and build lasting memories together.
          </p>
        </section>

        <section className="rounded-[24px] border border-border/20 bg-card p-5">
          <h2 className="font-bold text-xl mb-4 text-text-1">Built With Love</h2>
          <p className="flex items-center gap-2 text-text-2 leading-relaxed">
            <Heart className="h-4 w-4 text-accent-1" />
            <span>Made for couples who believe that every day together is worth celebrating.</span>
          </p>
        </section>
      </div>
    </div>
  )
}
