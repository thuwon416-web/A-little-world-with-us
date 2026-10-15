export type IntimacyRiskLevel = 'green' | 'yellow' | 'red'

export type IntimacyContext = {
  consent: 'yes' | 'no' | 'not-sure'
  boundaries?: string
  question?: string
}
