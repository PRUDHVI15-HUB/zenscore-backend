require('dotenv').config()
const mongoose = require('mongoose')
const SkillCategory = require('../models/SkillCategory')
const Skill = require('../models/Skill')
const Lesson = require('../models/Lesson')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zenscore'

const { getCurriculumForSkill } = require('../services/skillsCurriculumDataset')

// Lesson generator for all tech skills pulling from master/dynamic 7-phase curricula
const generateLessonsForSkill = (skillName, skillSlug, categoryName) => {
  const curriculum = getCurriculumForSkill(skillSlug, { name: skillName, category: categoryName })
  const allLessons = curriculum.modules ? curriculum.modules.flatMap(m => m.lessons) : []

  if (allLessons.length > 0) {
    return allLessons.map((l, idx) => ({
      title: l.title,
      lessonNumber: l.lessonNumber || idx + 1,
      description: l.description || `Master ${l.title} in ${skillName}.`,
      estimatedMinutes: l.estimatedMinutes || 30,
      difficulty: l.difficulty || (l.lessonNumber > 14 ? 'Advanced' : (l.lessonNumber > 7 ? 'Intermediate' : 'Beginner')),
      learningObjectives: l.learningObjectives || [`Master ${l.title}`, `Implement hands-on code in ${skillName}`],
      resources: l.resources || [
        {
          title: `Official ${skillName} Documentation: ${l.title}`,
          url: `https://docs.example.com/${skillSlug}/${idx + 1}`,
          provider: 'Documentation',
          type: 'reading'
        }
      ],
      exercisePlaceholder: l.practicalTask || {
        title: `${skillName} Practical: ${l.title}`,
        instructions: `Implement ${l.title} in ${skillName}.`,
        starterCode: `// Starter code for ${l.title}\n`,
        solutionCode: `// Solution for ${l.title}\n`
      },
      quizPlaceholder: {
        title: `${l.title} Quiz`,
        questions: (l.assessment?.questions || [
          {
            question: `What is the primary architectural purpose of ${l.title}?`,
            options: [
              `To ensure modular, scalable, and robust implementation in ${skillName}`,
              `To slow down performance`,
              `To cause memory errors`,
              `None of the above`
            ],
            correctOptionIndex: 0
          }
        ]).map(q => ({
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.correctIndex !== undefined ? q.correctIndex : 0),
          explanation: q.explanation || ''
        }))
      }
    }))
  }

  return []
}

// 71 Real Engineering Skills grouped into 10 Categories
const categoriesData = [
  {
    name: 'Programming Languages',
    slug: 'programming-languages',
    icon: '💻',
    color: '#EFF6FF',
    displayOrder: 1,
    description: 'Core syntax, paradigms, algorithms, and fundamental computer programming languages.',
    skills: [
      { name: 'C', slug: 'c', difficulty: 'Beginner', hours: 40, tags: ['C', 'Systems', 'Low-level'] },
      { name: 'C++', slug: 'cpp', difficulty: 'Intermediate', hours: 50, tags: ['C++', 'OOP', 'STL'] },
      { name: 'Java', slug: 'java', difficulty: 'Intermediate', hours: 60, tags: ['Java', 'JVM', 'OOP'] },
      { name: 'Python', slug: 'python', difficulty: 'Beginner', hours: 35, tags: ['Python', 'Scripting', 'Automation'] },
      { name: 'JavaScript', slug: 'javascript', difficulty: 'Beginner', hours: 30, tags: ['JS', 'Web', 'ES6'] },
      { name: 'TypeScript', slug: 'typescript', difficulty: 'Intermediate', hours: 25, tags: ['TS', 'Types', 'Frontend'] },
      { name: 'Go', slug: 'go', difficulty: 'Intermediate', hours: 35, tags: ['Golang', 'Concurrency', 'Backend'] },
      { name: 'Rust', slug: 'rust', difficulty: 'Advanced', hours: 45, tags: ['Rust', 'Memory Safety', 'Systems'] }
    ]
  },
  {
    name: 'Frontend Development',
    slug: 'frontend-development',
    icon: '🌐',
    color: '#F0F9FF',
    displayOrder: 2,
    description: 'User interface architecture, responsive design, component libraries, and browser client apps.',
    skills: [
      { name: 'HTML', slug: 'html', difficulty: 'Beginner', hours: 12, tags: ['HTML5', 'Markup', 'SEO'] },
      { name: 'CSS', slug: 'css', difficulty: 'Beginner', hours: 20, tags: ['CSS3', 'Styling', 'Flexbox'] },
      { name: 'Bootstrap', slug: 'bootstrap', difficulty: 'Beginner', hours: 15, tags: ['UI', 'CSS Framework', 'Grid'] },
      { name: 'Tailwind CSS', slug: 'tailwind-css', difficulty: 'Intermediate', hours: 18, tags: ['Utility-First', 'CSS', 'Design'] },
      { name: 'React', slug: 'react', difficulty: 'Intermediate', hours: 40, tags: ['React', 'JSX', 'Hooks', 'State'] },
      { name: 'Next.js', slug: 'nextjs', difficulty: 'Advanced', hours: 30, tags: ['SSR', 'Fullstack', 'React'] }
    ]
  },
  {
    name: 'Backend Development',
    slug: 'backend-development',
    icon: '⚡',
    color: '#F5F3FF',
    displayOrder: 3,
    description: 'Server-side application logic, REST & GraphQL APIs, microservices, and database drivers.',
    skills: [
      { name: 'Node.js', slug: 'nodejs', difficulty: 'Intermediate', hours: 35, tags: ['Node', 'Event Loop', 'Server'] },
      { name: 'Express.js', slug: 'expressjs', difficulty: 'Intermediate', hours: 25, tags: ['Express', 'REST API', 'Middleware'] },
      { name: 'Spring Boot', slug: 'spring-boot', difficulty: 'Advanced', hours: 50, tags: ['Java', 'Spring', 'Enterprise'] },
      { name: 'Django', slug: 'django', difficulty: 'Intermediate', hours: 40, tags: ['Python', 'ORM', 'Fullstack'] },
      { name: 'Flask', slug: 'flask', difficulty: 'Beginner', hours: 20, tags: ['Python', 'Microframework', 'API'] }
    ]
  },
  {
    name: 'Databases',
    slug: 'databases',
    icon: '🗄️',
    color: '#F0FDF4',
    displayOrder: 4,
    description: 'Relational SQL engines, NoSQL document stores, key-value caches, and schema indexing.',
    skills: [
      { name: 'MySQL', slug: 'mysql', difficulty: 'Beginner', hours: 30, tags: ['SQL', 'Relational', 'Queries'] },
      { name: 'MongoDB', slug: 'mongodb', difficulty: 'Intermediate', hours: 25, tags: ['NoSQL', 'Document', 'Mongoose'] },
      { name: 'PostgreSQL', slug: 'postgresql', difficulty: 'Intermediate', hours: 35, tags: ['SQL', 'Postgres', 'ACID'] },
      { name: 'Redis', slug: 'redis', difficulty: 'Advanced', hours: 20, tags: ['Cache', 'Key-Value', 'In-Memory'] },
      { name: 'SQLite', slug: 'sqlite', difficulty: 'Beginner', hours: 15, tags: ['Embedded', 'SQL', 'Mobile'] }
    ]
  },
  {
    name: 'DevOps',
    slug: 'devops',
    icon: '⚙️',
    color: '#FFF7ED',
    displayOrder: 5,
    description: 'Containerization, orchestration, continuous integration, infrastructure as code, and Linux.',
    skills: [
      { name: 'Git', slug: 'git', difficulty: 'Beginner', hours: 15, tags: ['VCS', 'Version Control', 'Commits'] },
      { name: 'GitHub', slug: 'github', difficulty: 'Beginner', hours: 12, tags: ['PRs', 'Actions', 'Collaboration'] },
      { name: 'Docker', slug: 'docker', difficulty: 'Intermediate', hours: 25, tags: ['Containers', 'Images', 'Compose'] },
      { name: 'Kubernetes', slug: 'kubernetes', difficulty: 'Advanced', hours: 45, tags: ['K8s', 'Orchestration', 'Pods'] },
      { name: 'Jenkins', slug: 'jenkins', difficulty: 'Intermediate', hours: 30, tags: ['CI/CD', 'Automation', 'Pipelines'] },
      { name: 'Terraform', slug: 'terraform', difficulty: 'Advanced', hours: 35, tags: ['IaC', 'Cloud Infrastructure', 'HCL'] },
      { name: 'Ansible', slug: 'ansible', difficulty: 'Intermediate', hours: 25, tags: ['Config Management', 'Playbooks'] },
      { name: 'Linux', slug: 'linux', difficulty: 'Beginner', hours: 30, tags: ['CLI', 'Bash', 'System Admin'] }
    ]
  },
  {
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    icon: '☁️',
    color: '#ECFEFF',
    displayOrder: 6,
    description: 'Public cloud platforms, serverless architecture, object storage, and managed cloud deployments.',
    skills: [
      { name: 'AWS', slug: 'aws', difficulty: 'Intermediate', hours: 50, tags: ['EC2', 'S3', 'Lambda', 'Cloud'] },
      { name: 'Azure', slug: 'azure', difficulty: 'Intermediate', hours: 45, tags: ['Microsoft', 'VMs', 'Cloud'] },
      { name: 'Google Cloud', slug: 'google-cloud', difficulty: 'Intermediate', hours: 40, tags: ['GCP', 'AppEngine', 'BigQuery'] },
      { name: 'Firebase', slug: 'firebase', difficulty: 'Beginner', hours: 20, tags: ['BaaS', 'Auth', 'Firestore'] }
    ]
  },
  {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    icon: '🤖',
    color: '#FFF1F2',
    displayOrder: 7,
    description: 'Machine learning algorithms, deep learning neural nets, natural language processing, and LLMs.',
    skills: [
      { name: 'NumPy', slug: 'numpy', difficulty: 'Beginner', hours: 15, tags: ['Arrays', 'Math', 'Data'] },
      { name: 'Pandas', slug: 'pandas', difficulty: 'Beginner', hours: 20, tags: ['Dataframes', 'Analysis', 'EDA'] },
      { name: 'Scikit-Learn', slug: 'scikit-learn', difficulty: 'Intermediate', hours: 30, tags: ['ML', 'Regression', 'Classification'] },
      { name: 'TensorFlow', slug: 'tensorflow', difficulty: 'Advanced', hours: 45, tags: ['Deep Learning', 'Neural Nets'] },
      { name: 'PyTorch', slug: 'pytorch', difficulty: 'Advanced', hours: 45, tags: ['PyTorch', 'Tensors', 'Deep Learning'] },
      { name: 'Prompt Engineering', slug: 'prompt-engineering', difficulty: 'Beginner', hours: 15, tags: ['Prompts', 'GenAI', 'LLM'] },
      { name: 'LLM Fundamentals', slug: 'llm-fundamentals', difficulty: 'Intermediate', hours: 25, tags: ['Transformers', 'RAG', 'Embeddings'] },
      { name: 'OpenCV', slug: 'opencv', difficulty: 'Intermediate', hours: 30, tags: ['Computer Vision', 'Images', 'Video'] }
    ]
  },
  {
    name: 'Computer Science Fundamentals',
    slug: 'computer-science',
    icon: '🧠',
    color: '#FEF3C7',
    displayOrder: 8,
    description: 'Core engineering concepts, algorithmic complexity, data structures, and computer architecture.',
    skills: [
      { name: 'Data Structures', slug: 'data-structures', difficulty: 'Intermediate', hours: 45, tags: ['Arrays', 'Trees', 'Graphs'] },
      { name: 'Algorithms', slug: 'algorithms', difficulty: 'Intermediate', hours: 50, tags: ['Sorting', 'Searching', 'DP'] },
      { name: 'Operating Systems', slug: 'operating-systems', difficulty: 'Intermediate', hours: 35, tags: ['Processes', 'Threads', 'Memory'] },
      { name: 'DBMS', slug: 'dbms-fundamentals', difficulty: 'Intermediate', hours: 30, tags: ['Relational Math', 'Normalization'] },
      { name: 'Computer Networks', slug: 'computer-networks', difficulty: 'Intermediate', hours: 35, tags: ['TCP/IP', 'HTTP', 'Sockets'] },
      { name: 'OOP', slug: 'object-oriented-programming', difficulty: 'Beginner', hours: 25, tags: ['Inheritance', 'Polymorphism'] },
      { name: 'System Design', slug: 'system-design', difficulty: 'Advanced', hours: 55, tags: ['Scalability', 'Load Balancing'] }
    ]
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    icon: '📱',
    color: '#FDF2F8',
    displayOrder: 9,
    description: 'Native and cross-platform mobile application development for Android and iOS.',
    skills: [
      { name: 'Android', slug: 'android', difficulty: 'Intermediate', hours: 40, tags: ['Android SDK', 'Views', 'Gradle'] },
      { name: 'Kotlin', slug: 'kotlin', difficulty: 'Intermediate', hours: 30, tags: ['Kotlin', 'Coroutines', 'Android'] },
      { name: 'Flutter', slug: 'flutter', difficulty: 'Intermediate', hours: 35, tags: ['Dart', 'Cross-Platform', 'UI'] },
      { name: 'React Native', slug: 'react-native', difficulty: 'Intermediate', hours: 35, tags: ['React', 'Expo', 'Mobile'] }
    ]
  },
  {
    name: 'Developer Tools',
    slug: 'developer-tools',
    icon: '🛠️',
    color: '#F3F4F6',
    displayOrder: 10,
    description: 'Integrated development environments, API testing tools, bundlers, and design utilities.',
    skills: [
      { name: 'VS Code', slug: 'vscode', difficulty: 'Beginner', hours: 10, tags: ['IDE', 'Editor', 'Extensions'] },
      { name: 'Postman', slug: 'postman', difficulty: 'Beginner', hours: 12, tags: ['API', 'HTTP', 'Testing'] },
      { name: 'GitHub Actions', slug: 'github-actions', difficulty: 'Intermediate', hours: 20, tags: ['CI/CD', 'Automation', 'Workflows'] },
      { name: 'Figma', slug: 'figma', difficulty: 'Beginner', hours: 15, tags: ['UI/UX', 'Design', 'Prototyping'] },
      { name: 'Webpack', slug: 'webpack', difficulty: 'Advanced', hours: 20, tags: ['Bundler', 'JavaScript', 'Build'] },
      { name: 'Vite', slug: 'vite', difficulty: 'Beginner', hours: 12, tags: ['Build Tool', 'HMR', 'Fast'] }
    ]
  }
]

async function seedSkillsData() {
  try {
    console.log('🚀 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB Atlas / Local database.')

    console.log('\n🧹 Clearing ONLY Skills-related collections (SkillCategory, Skill, Lesson)...')
    await SkillCategory.deleteMany({})
    await Skill.deleteMany({})
    await Lesson.deleteMany({})
    console.log('✅ Collections cleared successfully.')

    let totalCategories = 0
    let totalSkills = 0
    let totalLessons = 0

    console.log('\n🌱 Seeding Production Categories, Skills, and Lessons...\n')

    for (const catData of categoriesData) {
      // 1. Insert Category
      const category = await SkillCategory.create({
        name: catData.name,
        slug: catData.slug,
        icon: catData.icon,
        color: catData.color,
        displayOrder: catData.displayOrder,
        description: catData.description,
        isPublished: true
      })
      totalCategories++
      console.log(`📂 Category: [${category.name}]`)

      // 2. Insert Skills for Category
      for (const skillData of catData.skills) {
        const skill = await Skill.create({
          category: category._id,
          name: skillData.name,
          slug: skillData.slug,
          description: `Master ${skillData.name} from core principles to production deployment in ${category.name}.`,
          difficulty: skillData.difficulty,
          estimatedHours: skillData.hours,
          tags: skillData.tags,
          isPublished: true
        })
        totalSkills++

        // 3. Generate & Insert Lessons for Skill
        const lessonsPayload = generateLessonsForSkill(skill.name, skill.slug, category.name).map(l => ({
          ...l,
          skill: skill._id
        }))
        const insertedLessons = await Lesson.insertMany(lessonsPayload)
        totalLessons += insertedLessons.length

        console.log(`   ✓ Skill: ${skill.name} (${insertedLessons.length} lessons inserted)`)
      }
    }

    console.log('\n======================================================')
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!')
    console.log('======================================================')
    console.log(`Categories Created : ${totalCategories}`)
    console.log(`Skills Inserted     : ${totalSkills}`)
    console.log(`Lessons Inserted    : ${totalLessons}`)
    console.log('======================================================\n')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding error:', err)
    process.exit(1)
  }
}

seedSkillsData()
