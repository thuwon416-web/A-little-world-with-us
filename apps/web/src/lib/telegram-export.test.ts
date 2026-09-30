import { describe, expect, it } from 'vitest'
import { parseTelegramExport } from './telegram-export'

describe('parseTelegramExport', () => {
  it('reads Telegram JSON text blocks and Unix timestamp strings', () => {
    const rows = parseTelegramExport({
      messages: [{
        type: 'message',
        date_unixtime: '1710000000',
        from: 'A',
        from_id: 'user1',
        text: ['မင်္ဂလာပါ ', { type: 'bold', text: 'တို့နှစ်ယောက်' }],
      }],
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      message_date: '2024-03-09T16:00:00.000Z',
      sender_name: 'A',
      sender_id: 'user1',
      message_text: 'မင်္ဂလာပါ တို့နှစ်ယောက်',
    })
  })

  it('skips non-message events, blank entries, and repeated entries', () => {
    const repeated = { type: 'message', date: '2024-01-01T00:00:00Z', from: 'A', text: 'Hi' }
    const rows = parseTelegramExport({ messages: [repeated, repeated, { type: 'service', date: '2024-01-01', text: 'joined' }, { type: 'message', date: 'bad', text: 'bad date' }] })
    expect(rows).toHaveLength(1)
  })

  it('rejects a file without importable Telegram messages', () => {
    expect(() => parseTelegramExport({ messages: [] })).toThrow('တင်သွင်းလို့ရတဲ့ စာသားမှတ်တမ်း မတွေ့ပါ')
    expect(() => parseTelegramExport({})).toThrow('Telegram မှ JSON စကားပြောမှတ်တမ်းဖိုင်ကို ရွေးပါ')
  })
})
