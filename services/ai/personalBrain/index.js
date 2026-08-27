/**
 * index.js — Personal AI Brain Service Exports
 */

const { chatWithPersonalBrain } = require('./personalBrainService')
const { getStudentSnapshot, invalidateSnapshotCache } = require('./studentSnapshotService')
const { classifyIntent, INTENTS } = require('./intentClassifier')
const { routeContext } = require('./contextRouter')

module.exports = {
  chatWithPersonalBrain,
  getStudentSnapshot,
  invalidateSnapshotCache,
  classifyIntent,
  INTENTS,
  routeContext
}
