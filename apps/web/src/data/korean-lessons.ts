import type { KoreanLesson } from '@/types/korean'

const CREATED_AT = '2026-09-15T00:00:00Z'

export const KOREAN_LESSONS: KoreanLesson[] = [
  ['kr-l1-consonants', 1, 'Basic Consonants', 'အခြေခံဗျည်းများ', 'Learn the 14 basic Korean consonants.', 1],
  ['kr-l1-double-consonants', 1, 'Double Consonants', 'တင်းကျပ်ဗျည်းများ', 'Learn the five Korean double consonants.', 2],
  ['kr-l1-vowels', 1, 'Basic Vowels', 'အခြေခံသရများ', 'Learn the ten basic Korean vowels.', 3],
  ['kr-l1-compound-vowels', 1, 'Compound Vowels', 'ပေါင်းစပ်သရများ', 'Learn the eleven compound Korean vowels.', 4],
  ['kr-l2-greetings', 2, 'Greetings', 'နှုတ်ဆက်စကားများ', 'Learn common Korean greetings and introductions.', 5],
  ['kr-l2-politeness', 2, 'Polite Expressions', 'ယဉ်ကျေးသောအသုံးအနှုန်းများ', 'Practice polite phrases for everyday conversations.', 6],
  ['kr-l3-numbers', 3, 'Numbers', 'ဂဏန်းများ', 'Learn Sino-Korean and native Korean numbers from one to ten.', 7],
  ['kr-l3-days', 3, 'Days of the Week', 'တစ်ပတ်တာနေ့များ', 'Learn the Korean names for the days of the week.', 8],
  ['kr-l3-family', 3, 'Family', 'မိသားစု', 'Learn vocabulary for close family members.', 9],
  ['kr-l3-colors', 3, 'Colors', 'အရောင်များ', 'Learn common Korean color words.', 10],
  ['kr-l3-food', 3, 'Food', 'အစားအစာများ', 'Learn common food and drink vocabulary.', 11],
  ['kr-l3-verbs', 3, 'Common Verbs', 'အသုံးများသောကြိယာများ', 'Learn verbs for everyday actions.', 12],
  ['kr-l3-places', 3, 'Common Places', 'အသုံးများသောနေရာများ', 'Learn vocabulary for familiar places.', 13],
].map(([id, level, title, titleMy, description, order]) => ({
  id: id as string,
  level: level as KoreanLesson['level'],
  title: title as string,
  titleMy: titleMy as string,
  description: description as string,
  order: order as number,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
}))
