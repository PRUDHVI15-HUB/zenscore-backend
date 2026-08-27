/**
 * ZenScore AI - Master Curriculum Aggregator
 * Consolidates all comprehensive engineering curricula & dynamic 7-phase generator
 */

const { dockerCurriculum } = require('./dockerCurriculum');
const { mernCurriculum } = require('./mernCurriculum');
const { mongoCurriculum } = require('./mongoCurriculum');
const { nodeCurriculum } = require('./nodeCurriculum');
const { pythonCurriculum } = require('./pythonCurriculum');
const { reactCurriculum } = require('./reactCurriculum');
const { generateDynamic7PhaseCurriculum } = require('./dynamicCurriculumGenerator');

const DOMAIN_CURRICULUM_DATASETS = {
  // Docker & Containerization
  'docker': dockerCurriculum,
  'docker-containerization': dockerCurriculum,
  'docker-and-containerization': dockerCurriculum,

  // Full Stack MERN Architecture
  'full-stack-mern': mernCurriculum,
  'mern': mernCurriculum,
  'full-stack-mern-architecture': mernCurriculum,
  'mern-stack': mernCurriculum,

  // MongoDB & Database Architecture
  'mongodb': mongoCurriculum,
  'mongodb-database-architecture': mongoCurriculum,
  'mongodb-and-database-architecture': mongoCurriculum,
  'database-architecture': mongoCurriculum,

  // Node.js & Express Microservices
  'node-express': nodeCurriculum,
  'nodejs': nodeCurriculum,
  'node.js': nodeCurriculum,
  'node-js-express-microservices': nodeCurriculum,
  'nodejs-express-microservices': nodeCurriculum,
  'nodejs-and-express-microservices': nodeCurriculum,

  // Python & AI Engineering
  'python-ai': pythonCurriculum,
  'python': pythonCurriculum,
  'python-ai-engineering': pythonCurriculum,
  'python-and-ai-engineering': pythonCurriculum,
  'ai-engineering': pythonCurriculum,

  // React.js & Next.js Ecosystem
  'react-next': reactCurriculum,
  'react': reactCurriculum,
  'reactjs': reactCurriculum,
  'react.js': reactCurriculum,
  'react-js-next-js-ecosystem': reactCurriculum,
  'reactjs-and-nextjs-ecosystem': reactCurriculum,
  'react-js-and-next-js-ecosystem': reactCurriculum
};

module.exports = {
  dockerCurriculum,
  mernCurriculum,
  mongoCurriculum,
  nodeCurriculum,
  pythonCurriculum,
  reactCurriculum,
  generateDynamic7PhaseCurriculum,
  DOMAIN_CURRICULUM_DATASETS
};
