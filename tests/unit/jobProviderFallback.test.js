const ProviderFactory = require('../../services/jobs/providers/ProviderFactory')
const MockProvider = require('../../services/jobs/providers/providers/MockProvider')
const { syncJobsFromProvider } = require('../../services/jobs/sync/syncJobs')

describe('Job Provider Fallback to Mock Provider - Unit Tests', () => {
  test('ProviderFactory instantiates MockProvider successfully', () => {
    const provider = ProviderFactory.create('mock')
    expect(provider).toBeInstanceOf(MockProvider)
    expect(provider.getProviderName()).toBe('mock')
    expect(provider.getProviderVersion()).toBe('1.0.0')
  })

  test('MockProvider fetches raw job listings without external API keys', async () => {
    const provider = ProviderFactory.create('mock')
    const jobs = await provider.fetchJobs({ keywords: 'Software Engineer' })
    expect(Array.isArray(jobs)).toBe(true)
    expect(jobs.length).toBeGreaterThan(0)
    expect(jobs[0]).toHaveProperty('job_heading')
    expect(jobs[0]).toHaveProperty('employer_name')
  })

  test('MockProvider normalization outputs canonical jobs tagged with source="MockProvider"', async () => {
    const provider = ProviderFactory.create('mock')
    const rawJobs = await provider.fetchJobs()
    const normalized = rawJobs.map(j => provider.normalize(j)).filter(Boolean)

    expect(normalized.length).toBe(rawJobs.length)
    normalized.forEach(job => {
      expect(job.source).toBe('MockProvider')
      expect(job).toHaveProperty('title')
      expect(job).toHaveProperty('company')
      expect(job).toHaveProperty('location')
      expect(job).toHaveProperty('workMode')
    })
  })

  test('ProviderFactory throws ProviderNotFoundError for unregistered providers', () => {
    expect(() => {
      ProviderFactory.create('nonexistent_provider')
    }).toThrow()
  })

  test('Job sync pipeline falls back to mock provider when providerName is omitted or falsy', async () => {
    const result = await syncJobsFromProvider(null, { persistToDb: false })
    expect(result).toBeDefined()
    expect(result.provider).toBe('mock')
    expect(result.totalFetched).toBeGreaterThan(0)
    expect(result.validJobs).toBeGreaterThan(0)
  })
})
