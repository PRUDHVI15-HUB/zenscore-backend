/**
 * Production Domain Curriculum Dataset (Backend Service)
 * Aggregates all master curricula and dynamic 7-phase generators
 */

const {
  dockerCurriculum,
  mernCurriculum,
  mongoCurriculum,
  nodeCurriculum,
  pythonCurriculum,
  reactCurriculum,
  DOMAIN_CURRICULUM_DATASETS
} = require('./curriculums');
const { generateDynamic7PhaseCurriculum } = require('./curriculums/dynamicCurriculumGenerator');

function getCurriculumForSkill(slugOrId = '', rawSkill = {}) {
  const sDoc = rawSkill || {}
  const rawTitle = sDoc.name || sDoc.title || slugOrId || 'Software Engineering';
  const category = (typeof sDoc.category === 'object' ? sDoc.category?.name : sDoc.category) || 'Core Engineering';
  const query = `${slugOrId || ''} ${sDoc.name || ''} ${sDoc.title || ''} ${sDoc.category?.name || sDoc.category || ''} ${sDoc.slug || ''}`.toLowerCase();
  
  // 1. Direct and keyword matches for the core master curricula
  if (query.includes('docker') || query.includes('container') || query.includes('kubernetes')) {
    return dockerCurriculum;
  }
  if (query.includes('mongo') || query.includes('nosql')) {
    return mongoCurriculum;
  }
  if (query.includes('node') || query.includes('express') || query.includes('microservice') || query.includes('grpc')) {
    return nodeCurriculum;
  }
  if (query.includes('python') || query.includes('scikit') || query.includes('tensorflow') || query.includes('pytorch') || query.includes('machine-learning')) {
    return pythonCurriculum;
  }
  if (query.includes('react') || query.includes('next.js') || query.includes('nextjs') || query.includes('redux')) {
    return reactCurriculum;
  }
  if (query.includes('mern') || query.includes('full-stack') || query.includes('fullstack') || query.includes('web-development')) {
    return mernCurriculum;
  }
  
  // 2. Dynamic 7-Phase, 21-Lesson Curriculum Generator for ANY specific skill in DB (HTML, CSS, Java, C++, Go, Rust, Git, AWS, etc.)
  return generateDynamic7PhaseCurriculum(rawTitle, category);
}

module.exports = {
  DOMAIN_CURRICULUM_DATASETS,
  dockerCurriculum,
  mernCurriculum,
  mongoCurriculum,
  nodeCurriculum,
  pythonCurriculum,
  reactCurriculum,
  generateDynamic7PhaseCurriculum,
  getCurriculumForSkill
};
