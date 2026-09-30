export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food', icon: 'UtensilsCrossed' },
  { value: 'travel', label: 'Travel', icon: 'Plane' },
  { value: 'bills', label: 'Bills', icon: 'Receipt' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Film' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { value: 'health', label: 'Health', icon: 'HeartPulse' },
  { value: 'other', label: 'Other', icon: 'Circle' },
] as const

export const SPLIT_TYPES = [
  { value: 'equal', label: 'Equal (50/50)' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'custom', label: 'Exact Amount' },
] as const
