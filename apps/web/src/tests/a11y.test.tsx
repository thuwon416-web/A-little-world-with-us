import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { expect, test, describe } from 'vitest'
import React from 'react'

describe('A11Y smoke tests', () => {
  test('Semantic main with h1 has no violations', async () => {
    const { container } = render(
      <main>
        <h1>Test Page</h1>
        <p>Content</p>
      </main>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('Button with label has no violations', async () => {
    const { container } = render(
      <button type="button" aria-label="Submit">
        Submit
      </button>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('Image with alt has no violations', async () => {
    const { container } = render(
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/test.png" alt="Test image" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
