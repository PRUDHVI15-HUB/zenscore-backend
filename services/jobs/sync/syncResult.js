/**
 * Standardized execution summary formatter for Job Sync runs
 */
const createSyncResult = ({
  provider = 'unknown',
  totalFetched = 0,
  validCount = 0,
  invalidCount = 0,
  durationMs = 0,
  jobs = [],
  invalidRecords = []
}) => {
  return {
    provider,
    timestamp: new Date().toISOString(),
    totalFetched,
    validJobs: validCount,
    invalidJobs: invalidCount,
    duration: `${durationMs}ms`,
    jobs,
    invalidRecords
  }
}

module.exports = createSyncResult
