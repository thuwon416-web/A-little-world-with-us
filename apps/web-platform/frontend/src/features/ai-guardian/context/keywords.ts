export type ContextCategory = 'conflict' | 'mood' | 'intimacy' | 'health' | 'milestone' | 'affection'

export const CONTEXT_KEYWORDS: Record<ContextCategory, string[]> = {
  conflict: ['argument', 'fight', 'angry', 'upset', 'disagree', 'ရန်ဖြစ်', 'စိတ်ဆိုး', 'ဒေါသထွက်', 'မတည့်'],
  mood: ['sad', 'happy', 'stressed', 'anxious', 'lonely', 'စိတ်မကောင်း', 'ပျော်', 'စိတ်ဖိစီး', 'စိုးရိမ်', 'အထီးကျန်'],
  intimacy: ['intimacy', 'romantic', 'close', 'နီးကပ်', 'အချစ်ရေး', 'ရင်းနှီး'],
  health: ['sick', 'pain', 'period', 'health', 'နေမကောင်း', 'နာကျင်', 'ရာသီ', 'ကျန်းမာရေး'],
  milestone: ['anniversary', 'birthday', 'first date', 'အထိမ်းအမှတ်', 'မွေးနေ့', 'နှစ်ပတ်လည်'],
  affection: ['love', 'miss you', 'thank you', 'ချစ်တယ်', 'လွမ်းတယ်', 'ကျေးဇူးတင်'],
}
