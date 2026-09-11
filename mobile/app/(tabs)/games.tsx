import { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'

const winLines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
function winner(board: string[]) { return winLines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) }
export default function GamesScreen() {
  const [board, setBoard] = useState<string[]>(Array(9).fill('')); const [xNext, setXNext] = useState(true)
  const play = (index: number) => { if (board[index] || winner(board)) return; const next = [...board]; next[index] = xNext ? 'X' : 'O'; setBoard(next); setXNext(!xNext); if (winner(next)) Alert.alert('Game over', `${next[index]} wins!`) }
  return <SecondaryPage title="Couple Games"><View style={s.card}><Text style={s.buttonText}>Love Calculator</Text><Text style={s.muted}>A playful score for your shared story.</Text><Text style={{ color: '#ff9bba', fontSize: 34, fontWeight: '800' }}>88%</Text></View><View style={s.card}><Text style={s.buttonText}>Tic-Tac-Toe</Text><View style={{ width: 210, flexDirection: 'row', flexWrap: 'wrap' }}>{board.map((value, index) => <TouchableOpacity key={index} onPress={() => play(index)} style={{ width: 70, height: 70, borderWidth: 1, borderColor: '#604582', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ff9bba', fontSize: 28 }}>{value}</Text></TouchableOpacity>)}</View><TouchableOpacity style={s.button} onPress={() => { setBoard(Array(9).fill('')); setXNext(true) }}><Text style={s.buttonText}>New game</Text></TouchableOpacity></View><View style={s.card}><Text style={s.buttonText}>Couple Quiz</Text><Text style={s.muted}>Where did we first meet? Take turns answering, then compare your memories.</Text><TouchableOpacity style={s.button} onPress={() => Alert.alert('Quiz', 'Create a shared question deck from your memories.') }><Text style={s.buttonText}>Start quiz</Text></TouchableOpacity></View></SecondaryPage>
}
