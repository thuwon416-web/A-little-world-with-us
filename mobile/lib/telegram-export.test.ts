import { parseTelegramExport } from './telegram-export'

describe('parseTelegramExport', () => {
  it('parses Telegram text blocks and timestamp strings', () => {
    const rows = parseTelegramExport({ messages: [{
      type: 'message',
      date_unixtime: '1710000000',
      from: 'A',
      text: ['မင်္ဂလာ ', { type: 'bold', text: 'ပါ' }],
    }] })
    expect(rows).toHaveLength(1)
    expect(rows[0].message_date).toBe('2024-03-09T16:00:00.000Z')
    expect(rows[0].message_text).toBe('မင်္ဂလာ ပါ')
  })

  it('drops service messages and duplicate messages', () => {
    const message = { type: 'message', date: '2024-01-01T00:00:00Z', from: 'A', text: 'Hi' }
    expect(parseTelegramExport({ messages: [message, message, { type: 'service', date: '2024-01-01', text: 'joined' }] })).toHaveLength(1)
  })

  it('rejects invalid or empty Telegram exports', () => {
    expect(() => parseTelegramExport({})).toThrow('Choose a Telegram JSON export file.')
    expect(() => parseTelegramExport({ messages: [] })).toThrow('No importable text messages')
  })
})
