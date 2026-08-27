/**
 * Centralized Career Module Constants (Backend)
 * Defines standardized weights, ATS thresholds, readiness bands, and career roles catalog.
 */

const READINESS_WEIGHTS = {
  learning: 0.35,
  resume: 0.25,
  interview: 0.20,
  academics: 0.10,
  jobs: 0.10
}

const ATS_BENCHMARKS = {
  placementReady: 80,
  needsOptimization: 65,
  criticalGap: 50
}

const CAREER_CATEGORIES = [
  'Software Engineering',
  'Full Stack Development',
  'Frontend Engineering',
  'Backend Engineering',
  'Data Science & AI',
  'DevOps & Cloud',
  'Cybersecurity',
  'Mobile Engineering'
]

const DEFAULT_TARGET_ROLES = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Software Engineer',
  'Mobile App Developer',
  'Game Developer',
  'AI / ML Engineer',
  'DevOps Engineer',
  'Data Scientist',
  'Cloud Architect',
  'Cybersecurity Analyst',
  'UI/UX Developer'
]

module.exports = {
  READINESS_WEIGHTS,
  ATS_BENCHMARKS,
  CAREER_CATEGORIES,
  DEFAULT_TARGET_ROLES
}
