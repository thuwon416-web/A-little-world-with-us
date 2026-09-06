'use client'
import { useState } from 'react'

export default function FeedbackWidget() {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    // Send to your backend or email
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    })
    setSubmitted(true)
  }

  if (submitted) {
    return <div className="p-4 bg-green-100 text-green-800 rounded-lg">Thank you for your feedback! 💕</div>
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="font-bold mb-2">Feedback?</h3>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Tell us what you think..."
        rows={3}
        className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-900 mb-2"
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-lg font-medium"
      >
        Send Feedback
      </button>
    </div>
  )
}
