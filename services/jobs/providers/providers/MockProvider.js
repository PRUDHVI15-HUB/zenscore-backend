const BaseProvider = require('../BaseProvider')
const providerLogger = require('../../utils/providerLogger')

/**
 * Concrete Mock Provider implementation for testing the Provider Pipeline.
 * Serves as the benchmark implementation for Step 1 before integrating live external APIs.
 * 
 * @extends BaseProvider
 */
class MockProvider extends BaseProvider {
  constructor() {
    super('mock')
  }

  getProviderName() {
    return 'mock'
  }

  getProviderVersion() {
    return '1.0.0'
  }

  /**
   * Returns mock job listings in raw provider format
   */
  async fetchJobs(params = {}) {
    providerLogger.info(this.getProviderName(), 'FETCH', 'Fetching mock jobs from MockProvider pipeline...')

    // Simulated network latency (10ms)
    await new Promise(resolve => setTimeout(resolve, 10))

    const mockRawPayloads = [
      {
        provider_job_id: 'MOCK-101',
        job_heading: 'Senior Full Stack Engineer',
        employer_name: 'Stripe',
        location_raw: 'San Francisco, CA',
        is_remote: true,
        job_type: 'Full-Time',
        compensation_str: '$140,000 - $180,000 / yr',
        domain_category: 'Full-Stack',
        required_tech_stack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        job_summary: 'Architect high-throughput payment gateways and global developer API platforms.',
        direct_apply_url: 'https://stripe.com/jobs/senior-full-stack',
        posting_timestamp: new Date().toISOString()
      },
      {
        provider_job_id: 'MOCK-102',
        job_heading: 'AI & Data Science Specialist',
        employer_name: 'OpenAI',
        location_raw: 'Remote (US)',
        is_remote: true,
        job_type: 'Full-Time',
        compensation_str: '$160,000 - $210,000 / yr',
        domain_category: 'AI/ML',
        required_tech_stack: ['Python', 'PyTorch', 'Transformers', 'FastAPI'],
        job_summary: 'Train next-generation multimodal neural networks and optimize LLM inference endpoints.',
        direct_apply_url: 'https://openai.com/careers/data-science-specialist',
        posting_timestamp: new Date().toISOString()
      },
      {
        provider_job_id: 'MOCK-103',
        job_heading: 'Cloud Infrastructure & DevOps Lead',
        employer_name: 'Datadog',
        location_raw: 'New York, NY',
        is_remote: false,
        job_type: 'Full-Time',
        compensation_str: '$130,000 - $165,000 / yr',
        domain_category: 'DevOps',
        required_tech_stack: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
        job_summary: 'Manage multi-region Kubernetes clusters and build resilient telemetry infrastructure.',
        direct_apply_url: 'https://datadoghq.com/careers/devops-lead',
        posting_timestamp: new Date().toISOString()
      },
      {
        provider_job_id: 'MOCK-104',
        job_heading: 'Frontend Systems Engineer',
        employer_name: 'Figma',
        location_raw: 'San Francisco, CA',
        is_remote: true,
        job_type: 'Full-Time',
        compensation_str: '$125,000 - $155,000 / yr',
        domain_category: 'Frontend',
        required_tech_stack: ['React', 'WebAssembly', 'Canvas API', 'TypeScript'],
        job_summary: 'Build high-performance real-time collaborative canvas rendering engines.',
        direct_apply_url: 'https://figma.com/careers/frontend-systems',
        posting_timestamp: new Date().toISOString()
      },
      {
        provider_job_id: 'MOCK-105',
        job_heading: 'Backend Distributed Systems Engineer',
        employer_name: 'MongoDB',
        location_raw: 'Austin, TX',
        is_remote: false,
        job_type: 'Full-Time',
        compensation_str: '$135,000 - $170,000 / yr',
        domain_category: 'Backend',
        required_tech_stack: ['Go', 'C++', 'Distributed Systems', 'MongoDB'],
        job_summary: 'Optimize core database storage engines and distributed consensus algorithms.',
        direct_apply_url: 'https://mongodb.com/careers/backend-systems',
        posting_timestamp: new Date().toISOString()
      },
      {
        provider_job_id: 'MOCK-106',
        job_heading: 'Cybersecurity Operations Engineer',
        employer_name: 'CrowdStrike',
        location_raw: 'Remote (US)',
        is_remote: true,
        job_type: 'Full-Time',
        compensation_str: '$120,000 - $150,000 / yr',
        domain_category: 'Cybersecurity',
        required_tech_stack: ['Python', 'Threat Detection', 'SIEM', 'Linux Security'],
        job_summary: 'Analyze zero-day malware threats and deploy real-time endpoint protection rules.',
        direct_apply_url: 'https://crowdstrike.com/careers/security-ops',
        posting_timestamp: new Date().toISOString()
      }
    ]

    providerLogger.success(this.getProviderName(), 'FETCH', `Successfully fetched ${mockRawPayloads.length} raw mock jobs.`)
    return mockRawPayloads
  }

  /**
   * Normalizes raw mock job payload into canonical ZenScore job format
   */
  normalize(rawJob) {
    if (!rawJob) return null

    return {
      title: rawJob.job_heading,
      company: rawJob.employer_name,
      location: rawJob.location_raw,
      workMode: rawJob.is_remote ? 'Remote' : 'On-Site',
      employmentType: rawJob.job_type,
      experience: '0-3 years',
      salary: rawJob.compensation_str,
      category: rawJob.domain_category,
      requiredSkills: rawJob.required_tech_stack || [],
      description: rawJob.job_summary,
      applyLink: rawJob.direct_apply_url,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
      source: 'MockProvider',
      externalId: rawJob.provider_job_id
    }
  }
}

module.exports = MockProvider
