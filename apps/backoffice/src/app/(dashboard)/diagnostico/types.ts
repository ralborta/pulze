export type ModelTab = 'consolidado' | 'chatgpt' | 'gemini'

export interface BrandRankItem {
  rank: number
  marca: string
  score: number
  top3Percent: number
}

export interface CleexsScoreData {
  score: number
  vsLastMonth: number
  shortlistPresence: number
  recommendationShare: number
  trendData: { month: string; value: number }[]
}

export interface IntentItem {
  name: string
  value: number
}

export interface MetricItem {
  rank: number
  label: string
  value: number
}

export interface ComparisonRow {
  marca: string
  tipo: 'marca' | 'competidor'
  apariciones: number
  top3Percent: number
}

export interface DiagnosticData {
  entityName: string
  context: string
  country: string
  language: string
  brandRanking: BrandRankItem[]
  cleexsScore: CleexsScoreData
  byIntent: IntentItem[]
  metrics: MetricItem[]
  comparisons: ComparisonRow[]
  suggestions: string[]
}
