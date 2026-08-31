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
  const [board, setBoard] = useState<(null | 'X' | 'O')[]>(Array(9).fill(null))
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
    setBoard(Array(9).fill(null))
    setWinner(null)
    setXTurn(true)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 w-48">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            className="h-12 bg-[var(--card-bg)]/80 rounded shadow flex items-center justify-center text-lg font-bold"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm opacity-70">Turn: {winner ? '-' : xTurn ? 'X' : 'O'}</div>
        {winner && <div className="font-medium">Result: {winner}</div>}
        <button onClick={reset} className="glass-button px-3 py-1">
          Reset
        </button>
      </div>
    </div>
  )
}
