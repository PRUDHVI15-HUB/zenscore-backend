const mongoose = require('mongoose')
const SkillRoadmap = require('../models/SkillRoadmap')
const UserRoadmap = require('../models/UserRoadmap')
const Skill = require('../models/Skill')
const UserSkillProgress = require('../models/UserSkillProgress')

/**
 * Service Layer for Production Roadmap Engine (Step 8)
 * Handles prerequisite-based unlocking, percentage calculations, and MongoDB persistence.
 */
class RoadmapService {
  /**
   * Seed default production roadmaps if database is empty
   */
  static async seedDefaultRoadmaps() {
    const skills = await Skill.find({}).lean()
    const getSkillId = (skillSlug) => {
      const target = skillSlug.toLowerCase().trim()
      const found = skills.find(s =>
        s.slug?.toLowerCase() === target ||
        s.name?.toLowerCase() === target ||
        s.name?.toLowerCase().includes(target)
      )
      return found ? found._id : (skills[0]?._id || null)
    }

    const defaultRoadmaps = [
      {
        title: 'Full-Stack Web Development Path',
        slug: 'fullstack-web-dev',
        description: 'Complete engineering roadmap from HTML/CSS foundations to React UI and Node.js backend architecture.',
        icon: '💻',
        estimatedHours: 120,
        estimatedWeeks: 12,
        category: 'Web Engineering',
        difficulty: 'Intermediate',
        displayOrder: 1,
        isPublished: true,
        nodes: [
          { nodeId: 'fs-1', title: 'HTML & Web Semantics', linkedSkill: getSkillId('html'), prerequisiteNodeIds: [], order: 1, estimatedHours: 8, description: 'Learn modern markup structure, semantic elements, and accessibility.' },
          { nodeId: 'fs-2', title: 'CSS Layouts & Flexbox', linkedSkill: getSkillId('css'), prerequisiteNodeIds: ['fs-1'], order: 2, estimatedHours: 12, description: 'Master responsive design, grid systems, and CSS architecture.' },
          { nodeId: 'fs-3', title: 'JavaScript ES6+ & Async', linkedSkill: getSkillId('javascript'), prerequisiteNodeIds: ['fs-2'], order: 3, estimatedHours: 25, description: 'ES6+, async/await, DOM manipulation, and closure patterns.' },
          { nodeId: 'fs-4', title: 'React.js Component Ecosystem', linkedSkill: getSkillId('react'), prerequisiteNodeIds: ['fs-3'], order: 4, estimatedHours: 30, description: 'Virtual DOM, custom hooks, state management, and performance.' },
          { nodeId: 'fs-5', title: 'Node.js & Express REST APIs', linkedSkill: getSkillId('nodejs'), prerequisiteNodeIds: ['fs-4'], order: 5, estimatedHours: 25, description: 'RESTful API pipelines, JWT auth, middleware, and HTTP protocols.' },
          { nodeId: 'fs-6', title: 'MongoDB Database Architecture', linkedSkill: getSkillId('mongodb'), prerequisiteNodeIds: ['fs-5'], order: 6, estimatedHours: 20, description: 'BSON modeling, Mongoose schemas, compound indexing, and queries.' }
        ]
      },
      {
        title: 'DevOps & Cloud Engineering Path',
        slug: 'devops-cloud-engineering',
        description: 'Master containerization with Docker, CI/CD automation, Kubernetes clusters, and cloud infrastructure.',
        icon: '🐳',
        estimatedHours: 110,
        estimatedWeeks: 10,
        category: 'Cloud & DevOps',
        difficulty: 'Advanced',
        displayOrder: 2,
        isPublished: true,
        nodes: [
          { nodeId: 'do-1', title: 'Linux System Administration', linkedSkill: getSkillId('linux'), prerequisiteNodeIds: [], order: 1, estimatedHours: 15, description: 'Shell scripting, permissions, systemd, and network configuration.' },
          { nodeId: 'do-2', title: 'Docker Containerization & Multi-Stage Builds', linkedSkill: getSkillId('docker'), prerequisiteNodeIds: ['do-1'], order: 2, estimatedHours: 25, description: 'Docker daemon, image layer caching, volumes, and Compose stacks.' },
          { nodeId: 'do-3', title: 'CI/CD Pipelines & GitHub Actions', linkedSkill: getSkillId('github-actions'), prerequisiteNodeIds: ['do-2'], order: 3, estimatedHours: 20, description: 'Automated test runners, image tagging, and deployment triggers.' },
          { nodeId: 'do-4', title: 'Kubernetes Container Orchestration', linkedSkill: getSkillId('kubernetes'), prerequisiteNodeIds: ['do-3'], order: 4, estimatedHours: 30, description: 'Pods, Deployments, Services, ConfigMaps, and Ingress routing.' },
          { nodeId: 'do-5', title: 'Cloud Infrastructure & Monitoring', linkedSkill: getSkillId('aws'), prerequisiteNodeIds: ['do-4'], order: 5, estimatedHours: 20, description: 'Prometheus metrics, Grafana dashboards, and cloud provisioning.' }
        ]
      },
      {
        title: 'AI & Data Science Pathway',
        slug: 'ai-data-science',
        description: 'Comprehensive pathway covering Python, NumPy, Pandas, Scikit-Learn, and LLM Prompt Engineering.',
        icon: '🤖',
        estimatedHours: 140,
        estimatedWeeks: 14,
        category: 'Artificial Intelligence',
        difficulty: 'Advanced',
        displayOrder: 3,
        isPublished: true,
        nodes: [
          { nodeId: 'ai-1', title: 'Python Core & Data Structures', linkedSkill: getSkillId('python'), prerequisiteNodeIds: [], order: 1, estimatedHours: 25, description: 'Python memory model, comprehensions, and functional design.' },
          { nodeId: 'ai-2', title: 'NumPy Vector Calculations', linkedSkill: getSkillId('numpy'), prerequisiteNodeIds: ['ai-1'], order: 2, estimatedHours: 15, description: 'N-dimensional arrays, matrix math, strides, and broadcasting.' },
          { nodeId: 'ai-3', title: 'Pandas Data Analysis', linkedSkill: getSkillId('pandas'), prerequisiteNodeIds: ['ai-2'], order: 3, estimatedHours: 20, description: 'DataFrames, cleaning missing data, grouping, and aggregations.' },
          { nodeId: 'ai-4', title: 'Scikit-Learn ML Classifiers', linkedSkill: getSkillId('scikit-learn'), prerequisiteNodeIds: ['ai-3'], order: 4, estimatedHours: 30, description: 'Pipelines, standard scalers, random forests, and metrics.' },
          { nodeId: 'ai-5', title: 'LLM Prompt Engineering & RAG', linkedSkill: getSkillId('prompt-engineering'), prerequisiteNodeIds: ['ai-4'], order: 5, estimatedHours: 20, description: 'Prompt design, embedding vectors, and RAG retrieval pipelines.' }
        ]
      },
      {
        title: 'Backend & Microservices Architect Path',
        slug: 'backend-microservices',
        description: 'Deep dive into asynchronous Node.js, Express middleware architecture, database indexing, and API security.',
        icon: '⚡',
        estimatedHours: 105,
        estimatedWeeks: 10,
        category: 'Backend Engineering',
        difficulty: 'Intermediate',
        displayOrder: 4,
        isPublished: true,
        nodes: [
          { nodeId: 'be-1', title: 'Node.js & Event Loop Architecture', linkedSkill: getSkillId('nodejs'), prerequisiteNodeIds: [], order: 1, estimatedHours: 20, description: 'Single-threaded non-blocking I/O, V8 engine, and libuv phases.' },
          { nodeId: 'be-2', title: 'Express.js RESTful Pipeline Design', linkedSkill: getSkillId('expressjs'), prerequisiteNodeIds: ['be-1'], order: 2, estimatedHours: 25, description: 'Middleware sequencing, error handlers, and route controllers.' },
          { nodeId: 'be-3', title: 'Authentication, JWT & Security', linkedSkill: getSkillId('nodejs'), prerequisiteNodeIds: ['be-2'], order: 3, estimatedHours: 20, description: 'Bcrypt hashing, stateless token verification, and rate limiting.' },
          { nodeId: 'be-4', title: 'Database Optimization & Indexing', linkedSkill: getSkillId('mongodb'), prerequisiteNodeIds: ['be-3'], order: 4, estimatedHours: 20, description: 'Compound indexes, WiredTiger B-Trees, and aggregation pipelines.' },
          { nodeId: 'be-5', title: 'Microservices & Redis Caching', linkedSkill: getSkillId('redis'), prerequisiteNodeIds: ['be-4'], order: 5, estimatedHours: 20, description: 'In-memory caching, message queues, and service communication.' }
        ]
      },
      {
        title: 'Frontend UI/UX & React Specialist Path',
        slug: 'frontend-react-specialist',
        description: 'Master modern component design, Virtual DOM optimization, custom React hooks, and Next.js 14 App Router.',
        icon: '🎨',
        estimatedHours: 115,
        estimatedWeeks: 11,
        category: 'Frontend Engineering',
        difficulty: 'Intermediate',
        displayOrder: 5,
        isPublished: true,
        nodes: [
          { nodeId: 'fe-1', title: 'Modern HTML5 & Semantic Web', linkedSkill: getSkillId('html'), prerequisiteNodeIds: [], order: 1, estimatedHours: 10, description: 'Accessibility (a11y), semantic tags, and document architecture.' },
          { nodeId: 'fe-2', title: 'Tailwind CSS & Design Systems', linkedSkill: getSkillId('tailwind-css'), prerequisiteNodeIds: ['fe-1'], order: 2, estimatedHours: 15, description: 'Utility-first styling, color tokens, responsive grids, and dark mode.' },
          { nodeId: 'fe-3', title: 'React 18 Component Architecture', linkedSkill: getSkillId('react'), prerequisiteNodeIds: ['fe-2'], order: 3, estimatedHours: 30, description: 'Virtual DOM, Fiber reconciliation, state immutability, and JSX.' },
          { nodeId: 'fe-4', title: 'Advanced Hooks & State Management', linkedSkill: getSkillId('react'), prerequisiteNodeIds: ['fe-3'], order: 4, estimatedHours: 30, description: 'useMemo, useCallback, Context API, and custom hook composition.' },
          { nodeId: 'fe-5', title: 'Next.js 14 App Router & Performance', linkedSkill: getSkillId('nextjs'), prerequisiteNodeIds: ['fe-4'], order: 5, estimatedHours: 30, description: 'Server Components, SSR streaming, static optimization, and SEO.' }
        ]
      }
    ]

    for (const rm of defaultRoadmaps) {
      await SkillRoadmap.findOneAndUpdate(
        { slug: rm.slug },
        { $set: rm },
        { upsert: true, new: true }
      )
    }
    console.log('✅ Seeded / updated 5 production SkillRoadmaps in MongoDB!')
  }

  /**
   * 1. Get all published roadmaps
   */
  static async getRoadmaps() {
    await this.seedDefaultRoadmaps()
    return SkillRoadmap.find({ isPublished: true }).sort({ displayOrder: 1 }).lean()
  }

  /**
   * 2. Get detailed roadmap with prerequisite unlock calculations
   */
  static async getRoadmapDetails(roadmapId, userId = null) {
    let roadmap = null
    if (mongoose.Types.ObjectId.isValid(roadmapId)) {
      roadmap = await SkillRoadmap.findById(roadmapId).populate('nodes.linkedSkill', 'name slug category difficulty').lean()
    } else {
      roadmap = await SkillRoadmap.findOne({ slug: roadmapId }).populate('nodes.linkedSkill', 'name slug category difficulty').lean()
    }

    if (!roadmap) throw { status: 404, message: 'Roadmap not found.' }

    let userRoadmap = null
    if (userId) {
      userRoadmap = await UserRoadmap.findOne({ user: userId, roadmap: roadmap._id }).lean()
    }

    const completedSet = new Set(userRoadmap?.completedNodeIds || [])

    // Process nodes with prerequisite unlock calculation
    const processedNodes = (roadmap.nodes || []).map((node) => {
      const isCompleted = completedSet.has(node.nodeId)
      // Node is unlocked if it has no prerequisites OR all prerequisites are in completedSet
      const isUnlocked = !node.prerequisiteNodeIds || node.prerequisiteNodeIds.length === 0 ||
        node.prerequisiteNodeIds.every(reqId => completedSet.has(reqId))

      return {
        nodeId: node.nodeId,
        title: node.title,
        linkedSkill: node.linkedSkill,
        prerequisiteNodeIds: node.prerequisiteNodeIds || [],
        estimatedHours: node.estimatedHours || 10,
        order: node.order,
        isOptional: node.isOptional,
        description: node.description,
        isCompleted,
        isUnlocked,
        status: isCompleted ? 'Completed' : (isUnlocked ? 'Unlocked' : 'Locked')
      }
    })

    const totalNodes = processedNodes.length
    const completedCount = completedSet.size
    const currentProgressPercentage = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0

    return {
      roadmap: {
        id: roadmap._id,
        title: roadmap.title,
        slug: roadmap.slug,
        description: roadmap.description,
        icon: roadmap.icon,
        estimatedHours: roadmap.estimatedHours,
        estimatedWeeks: roadmap.estimatedWeeks,
        category: roadmap.category,
        difficulty: roadmap.difficulty
      },
      nodes: processedNodes,
      totalNodes,
      completedNodesCount: completedCount,
      remainingNodesCount: Math.max(totalNodes - completedCount, 0),
      currentProgressPercentage,
      isEnrolled: Boolean(userRoadmap)
    }
  }

  /**
   * 3. Enroll user in a roadmap
   */
  static async enrollRoadmap(roadmapId, userId) {
    let roadmap = await SkillRoadmap.findById(roadmapId).lean()
    if (!roadmap) roadmap = await SkillRoadmap.findOne({ slug: roadmapId }).lean()
    if (!roadmap) throw { status: 404, message: 'Roadmap not found.' }

    let userRoadmap = await UserRoadmap.findOne({ user: userId, roadmap: roadmap._id })
    if (userRoadmap) return userRoadmap

    userRoadmap = await UserRoadmap.create({
      user: userId,
      roadmap: roadmap._id,
      completedNodeIds: [],
      currentProgressPercentage: 0,
      lastActivityAt: new Date()
    })

    return userRoadmap
  }

  /**
   * 4. Toggle/Update Roadmap Node Completion
   */
  static async updateNodeProgress(roadmapId, nodeId, userId) {
    let roadmap = await SkillRoadmap.findById(roadmapId).lean()
    if (!roadmap) roadmap = await SkillRoadmap.findOne({ slug: roadmapId }).lean()
    if (!roadmap) throw { status: 404, message: 'Roadmap not found.' }

    let userRoadmap = await UserRoadmap.findOne({ user: userId, roadmap: roadmap._id })
    if (!userRoadmap) {
      userRoadmap = await UserRoadmap.create({
        user: userId,
        roadmap: roadmap._id,
        completedNodeIds: []
      })
    }

    const isCompleted = userRoadmap.completedNodeIds.includes(nodeId)
    if (isCompleted) {
      userRoadmap.completedNodeIds = userRoadmap.completedNodeIds.filter(id => id !== nodeId)
    } else {
      userRoadmap.completedNodeIds.push(nodeId)
    }

    const totalNodes = roadmap.nodes.length
    userRoadmap.currentProgressPercentage = totalNodes > 0 ? Math.round((userRoadmap.completedNodeIds.length / totalNodes) * 100) : 0
    userRoadmap.lastActivityAt = new Date()

    await userRoadmap.save()

    return this.getRoadmapDetails(roadmap._id, userId)
  }

  /**
   * 5. Get User Enrolled Roadmaps — Always returns ALL published roadmaps with user progress
   */
  static async getUserRoadmaps(userId) {
    await this.seedDefaultRoadmaps()

    const allRoadmaps = await SkillRoadmap.find({ isPublished: true }).sort({ displayOrder: 1 }).lean()

    return Promise.all(
      allRoadmaps.map(async (rm) => {
        return this.getRoadmapDetails(rm._id, userId)
      })
    ).then(res => res.filter(Boolean))
  }
}

module.exports = RoadmapService
