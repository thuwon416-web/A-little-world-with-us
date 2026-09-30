export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'travel', label: 'Travel' },
  { value: 'bills', label: 'Bills' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
] as const

export const SPLIT_TYPES = [
  { value: 'equal', label: 'Equal (50/50)' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'custom', label: 'Exact Amount' },
] as const
