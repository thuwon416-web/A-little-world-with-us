'use client'

import { useState } from 'react'

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export default function TicTacToe() {
  const [board, setBoard] = useState<(null | 'X' | 'O')[]>(new Array(9).fill(null))
  const [xTurn, setXTurn] = useState(true)
  const [winner, setWinner] = useState<null | 'X' | 'O' | 'Draw'>(null)

  const play = (i: number) => {
    if (board[i] || winner) return
    const mark = xTurn ? 'X' : 'O'
    const next = [...board]
    next[i] = mark
    setBoard(next)
    setXTurn(!xTurn)

    for (const line of LINES) {
      const a = line[0]
      const b = line[1]
      const c = line[2]

      if (a === undefined || b === undefined || c === undefined) {
        continue
      }

      if (next[a] && next[a] === next[b] && next[a] === next[c]) {
        setWinner(next[a]!)
        return
      }
    }

    if (next.every(Boolean)) setWinner('Draw')
  }

  const reset = () => {
    setBoard(new Array(9).fill(null))
    setWinner(null)
    setXTurn(true)
  }

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Tic-tac-toe board" className="grid w-full max-w-48 grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            disabled={Boolean(c) || Boolean(winner)}
            aria-label={`Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}: ${c ?? 'empty'}`}
            className="flex h-12 items-center justify-center rounded bg-card/80 text-lg font-bold shadow transition hover:bg-soft-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm opacity-70" aria-live="polite">Turn: {winner ? '-' : xTurn ? 'X' : 'O'}</div>
        {winner && <div className="font-medium" role="status">Result: {winner}</div>}
        <button type="button" onClick={reset} className="glass-button rounded-btn px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1" aria-label="Reset tic-tac-toe game">
          Reset
        </button>
      </div>
    </div>
  )
}
