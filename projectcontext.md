# Project Context: ZenScore AI

This document serves as the comprehensive development guide, architectural specification, and state-of-the-project reference for **ZenScore AI**. It provides direct, fully-articulated context for any developer or AI agent continuing the development of the codebase.

---

## 1. Project Overview & Target Audience
**ZenScore AI** is an AI-driven, full-stack student companion application tailored for undergraduate engineering students in India. It aims to improve academic performance, bridge the industry skill gap, and boost placement readiness.

### Key Modules & Capabilities:
1. **Authentication**: Integrated Google Login using Firebase Authentication bridged with a custom backend JWT session token.
2. **Academic Dashboard & Intelligence**: SGPA/CGPA tracking, GPA prediction algorithm, subject health monitoring, weak subject detection, risk cards, semester timelines, and automated study plan generator.
3. **OCR Transcript & Marks Card Parser**: Automated document classification and grade extraction engine using Tesseract OCR (`eng.traineddata`), multi-university rule parsers (JNTU, VTU, Anna University, etc.), grade/credit calculators, and Groq fallback parsing.
4. **AI Tutor & Academic Copilot**: Multi-turn chat assistant and study copilot powered by Groq API (`llama-3.3-70b-versatile`), prompt builders, response formatters, syllabus context integration, and dynamic YouTube video tutorial matching.
5. **Interactive Skills Learning Engine (Learn → Assess → Build → Auto-Complete)**:
   - Publication-grade domain curriculum (Docker, Python/AI, React/Next.js, Node.js/Express, MongoDB, Full-Stack MERN).
   - Deep-dive conceptual chapters with architectural analogies and principle callouts.
   - Structured comparison matrices (e.g. VMs vs Containers, Real DOM vs Virtual DOM, SQL vs NoSQL).
   - Interactive quiz assessments scoring ≥70% to unlock build tasks.
   - Hands-on coding environment with automated test verification and auto-completion sync.
   - Sticky left sidebar with milestone progress, streak counters, and quick AI/Notes study tools launcher.
   - Dedicated SVG icon system (`SkillIcon.jsx`) rendering distinct technology brand icons without raw text overflows.
6. **Production Skill Roadmaps Engine**:
   - 5 comprehensive industry roadmaps: Full-Stack Web Development, DevOps & Cloud Engineering, AI & Data Science, Backend & Microservices, Frontend UI/UX Specialist.
   - Prerequisite node dependency graphs, unlock calculations, completion meters, and interactive direct module links into the Skill Workspace.
7. **Courses & Learning Hub**: Catalog of CS & engineering subjects, video modules, course progress tracking, bookmarking system, daily coding/academic challenges, and downloadable completion certificates.
8. **Career Intelligence & Skill Gap Suite**: AI-powered skill gap analyzer, industry priority service, learning recommendations, interactive 12-month career roadmaps, and custom user roadmap node progress tracking.
9. **AI Resume & Mock Interview Suite**: ATS score analyzer, recruiter review intelligence, resume export formatting, AI mock interview engine (technical, HR, coding, system design).
10. **Jobs & Placement Hub**: Job search catalog, application tracker, job alert notifications, and weighted placement readiness calculator.
11. **Productivity Suite**: Pomodoro focus timer, distraction log, daily task manager, weekly planners, streak tracking, and peers leaderboard.

---

## 2. Technical Stack

The application is built on a modern **MERN (MongoDB, Express, React, Node)** architecture with specialized AI and OCR integration layers:

### Backend (`zenscore-backend/zenscore-backend/`)
*   **Runtime Environment**: Node.js (v18+)
*   **Web Framework**: Express.js (`^4.18.2`)
*   **Database ODM**: Mongoose (`^8.23.0`) with MongoDB Atlas / local MongoDB
*   **Authentication**: Firebase Admin SDK (`^12.0.0`) for ID token verification, and JSON Web Tokens (`jsonwebtoken ^9.0.2`) for backend API session verification.
*   **AI Integration Engine**: Groq SDK (`^0.37.0`) utilizing `llama-3.3-70b-versatile` with custom prompt builders, response formatters, context builders, and multi-service AI layer.
*   **OCR & Document Parsing**: Tesseract.js with `eng.traineddata` OCR engine, rule-based table isolator, document classifier, grade mapping, credit calculator, and fallback decision engine.
*   **Logging & Security**: Morgan (`^1.10.0`) for HTTP logging, CORS (`^2.8.5`) for origin policies.
*   **Development Tools**: Nodemon (`^3.1.14`) for hot reloading.

### Frontend (`zenscore-ai/zenscore-ai/`)
*   **Build Tool**: Vite (`^5.4.21`)
*   **Framework**: React (`^18.2.0`)
*   **Routing**: React Router DOM (`^6.22.0`)
*   **State & Context Management**: `AuthContext` (Firebase + JWT session), `CareerContext` (Target roles, skill gaps, roadmaps, resume analysis), `StudentProfileContext`.
*   **Network & Sync Layer**: `api.js` (25s extended timeout with exponential backoff auto-retry), `syncQueue.js` (debounced background cloud synchronizer).
*   **Authentication Client**: Firebase Client SDK (`^10.14.1`)
*   **Styling**: Tailwind CSS (`^3.4.1`), Lucide React icons (`^0.475.0`), Framer Motion, and custom CSS design systems.
*   **Modular AI & Business Services**: Dedicated service architecture covering `services/ai/`, `services/careerMarket/`, `services/interview/`, `services/resume/`, `services/roadmap/`, and `services/skills/`.

---

## 3. Comprehensive Directory Structures

### Backend Directory Structure (`zenscore-backend/zenscore-backend/`)
```
zenscore-backend/
├── config/
│   ├── db.js                 # MongoDB connection setup via Mongoose
│   └── firebase.js           # Firebase Admin SDK initialization using environment variables
├── controllers/
│   ├── academicsController.js# Handles CGPA/SGPA, GPA prediction, weak subjects, study plans
│   ├── authController.js     # Handles Firebase token verification & JWT issuance/validation
│   ├── careersAIController.js# AI-driven career recommendations, skill gap analysis, roadmaps
│   ├── careersController.js  # CRUD & listings for seeded career paths and target roles
│   ├── copilotController.js  # AI Academic Copilot chat, context generation, smart recommendations
│   ├── coursesController.js  # Course catalog, enrollment, module progress, certificates, bookmarks
│   ├── jobsController.js     # Job search filters, application tracking, placement readiness scores
│   ├── ocrController.js      # Marks card / transcript OCR parsing & auto grade extraction
│   ├── productivityController.js # Focus sessions logger, analytics, distraction history, tips
│   ├── roadmapController.js  # Production roadmaps endpoints, node unlocks, progress updates
│   ├── skillsAdminController.js # Skills admin CMS controller
│   └── skillsController.js   # Skill tree categories, detailed curricula, and notes
├── middleware/
│   ├── adminMiddleware.js   # Protects admin-only routes
│   └── authMiddleware.js    # Validates JWT tokens and injects req.user context
├── models/
│   ├── AcademicRecord.js    # Schema for user semesters, subjects, grades, predicted GPA
│   ├── Bookmark.js          # Schema for user bookmarks (courses, roadmaps, jobs)
│   ├── CareerPath.js        # Schema for target roles, required skills, packages, roadmaps
│   ├── Certificate.js       # Schema for course & skill completion certificates
│   ├── Course.js            # Schema for curated courses, modules, lessons, quizzes
│   ├── CourseProgress.js    # Schema for user course completion and module tracking
│   ├── DailyChallenge.js    # Schema for daily coding & academic challenges
│   ├── FocusLog.js          # Schema for recorded study focus sessions
│   ├── ImportSession.js     # Schema for transcript OCR import sessions and review state
│   ├── JobListing.js        # Schema for active jobs/internships requirements
│   ├── Lesson.js            # Schema for skill lessons, deep dives, syntax, code examples, quizzes
│   ├── Notification.js      # Schema for user system & milestone notifications
│   ├── Skill.js             # Schema for skills registry, category, difficulty, estimated hours
│   ├── SkillCategory.js     # Schema for skill categories (Full Stack, Cloud, AI, etc.)
│   ├── SkillRoadmap.js      # Schema for multi-node prerequisite roadmaps
│   ├── User.js              # Schema for user profile, branch, overall CGPA, projects count
│   ├── UserLessonNote.js    # Schema for user lesson notes and bookmarks
│   ├── UserRoadmap.js       # Schema for customized user roadmaps & step checkmarks
│   └── UserSkillProgress.js # Schema for student skill progress, completed lessons, score
├── routes/
│   ├── academicsRoutes.js   # Route mappings for /api/academics/*
│   ├── aiTutorRoute.js      # Route mappings for /api/ai-tutor/*
│   ├── authRoutes.js        # Route mappings for /api/auth/*
│   ├── careersRoutes.js     # Route mappings for /api/careers/*
│   ├── copilotRoutes.js     # Route mappings for /api/copilot/*
│   ├── coursesRoutes.js     # Route mappings for /api/courses/*
│   ├── jobsRoutes.js        # Route mappings for /api/jobs/*
│   ├── ocrRoutes.js         # Route mappings for /api/ocr/*
│   ├── productivityRoutes.js# Route mappings for /api/productivity/*
│   ├── roadmapRoutes.js     # Route mappings for /api/roadmaps/*
│   ├── skillsAdminRoutes.js # Route mappings for /api/skills-admin/*
│   └── skillsRoutes.js      # Route mappings for /api/skills/*
├── services/
│   ├── ai/
│   │   ├── academicCopilotService.js # AI copilot prompt & context builder for academics
│   │   ├── aiProvider.js            # Unified Groq API client & fallback handler
│   │   ├── careersAIService.js      # Comprehensive AI engine for skill gap & roadmaps
│   │   ├── contextBuilder.js        # Assembles student academic & skill context for LLM
│   │   ├── promptBuilder.js         # Modular prompt construction pipeline
│   │   └── responseFormatter.js     # JSON/Markdown response sanitizer
│   ├── intelligence/
│   │   ├── analyticsService.js      # Academic performance & trend analytics
│   │   └── engines/                 # Mathematical prediction engines
│   ├── parser/
│   │   ├── creditCalculator.js      # Subject credit detection & default fallback rules
│   │   ├── decisionEngine.js        # OCR confidence threshold & fallback decision maker
│   │   ├── documentClassifier.js    # Identifies university marks cards / transcripts
│   │   ├── documentQualityAnalyzer.js# Evaluates image resolution, contrast, and noise
│   │   ├── fingerprint.js           # Document layout fingerprint matching
│   │   ├── gradeMappingService.js   # Converts letter grades to 10-point GPA scale
│   │   ├── groqFallback.js          # Vision/LLM fallback when rule parsing has low confidence
│   │   ├── profileDetector.js       # Auto-detects university profile (JNTU, VTU, Anna, etc.)
│   │   ├── profiles/                # University specific pattern definitions
│   │   ├── ruleParser.js            # Regex & spatial table parser for grades
│   │   ├── subjectConfidence.js     # Scores confidence per extracted subject row
│   │   ├── tableIsolator.js         # Isolates subject grade tables from transcript images
│   │   ├── utils/                   # Parser text normalization helpers
│   │   └── validationLayer.js       # Validates parsed grades, credits, and totals
│   ├── ocrService.js                # Tesseract OCR engine wrapper & image preprocessor
│   ├── roadmapService.js            # 5-roadmap seeder, prerequisite node unlocks, progress
│   ├── skillsCurriculumDataset.js   # Master domain educational curriculum service
│   └── skillsService.js             # Skill details, lessons, progress, and certificates
├── utils/
│   └── gpaUtils.js                  # Math utilities for SGPA/CGPA calculation & weighting
├── .env                         # Local environment configurations
├── package.json                 # Backend scripts and dependency management
└── server.js                    # Express server bootstrap, middleware, route mounts
```

### Frontend Directory Structure (`zenscore-ai/zenscore-ai/`)
```
zenscore-ai/
├── public/                      # Static assets, icons, traineddata
├── src/
│   ├── components/
│   │   ├── academics/           # Academic components (SubjectTable, TranscriptOCRModal, SemesterTimeline, RiskCards)
│   │   │   ├── copilot/         # AI Copilot floating panel & chat widget
│   │   │   ├── intelligence/    # Performance analytics, GPA predictions, risk visualizers
│   │   │   ├── ocr/             # OCR transcript upload, preview, grade review editor
│   │   │   ├── onboarding/      # Academic initial setup wizard
│   │   │   └── planner/         # Weekly study planner, task allocation, productivity summary
│   │   ├── careers/             # Career intelligence components
│   │   │   ├── explorer/        # Career path explorer & role detail modal
│   │   │   ├── interview/       # AI Mock interview simulator & feedback cards
│   │   │   ├── resume/          # ATS resume scanner, recruiter feedback, export templates
│   │   │   ├── roadmap/         # Interactive node-based career roadmap graph
│   │   │   ├── sections/        # Section tabs for overview, skills, resume, interview
│   │   │   └── skillgap/        # Skill gap matrix, required vs missing skill bars
│   │   ├── common/              # Reusable UI elements (Modals, Badges, Tabs, Spinners)
│   │   ├── skills/              # Skills Hub & Roadmap components
│   │   │   ├── certificates/    # CertificatesSection, CertificateCard
│   │   │   ├── Explore/         # ExploreSection, SkillCard, SkillFilter, SkillGrid
│   │   │   ├── progress/        # ProgressDashboard, SkillProgressCard, AchievementsGrid
│   │   │   ├── roadmaps/        # RoadmapsSection, RoadmapCard, RoadmapProgress, RoadmapTimeline, RoadmapStep
│   │   │   ├── ContinueLearning.jsx
│   │   │   ├── SkillIcon.jsx    # SVG Lucide technology icons mapper
│   │   │   ├── SkillsHero.jsx
│   │   │   └── SkillsOverview.jsx
│   │   ├── AppLayout.jsx        # Global app layout with collapsible sidebar and search bar
│   │   ├── CoursesGrid.jsx      # Curated skills and CS course grid
│   │   ├── FeatureGrid.jsx      # Feature highlights section
│   │   ├── Footer.jsx           # Bottom navigation footer
│   │   ├── Hero.jsx             # Landing page banner
│   │   ├── Navbar.jsx           # Top navigation bar
│   │   ├── ProtectedRoute.jsx   # Route guard checking authentication state
│   │   └── WhyUs.jsx            # Value proposition section
│   ├── context/
│   │   ├── AuthContext.jsx      # Firebase auth listener & backend JWT session store
│   │   ├── CareerContext.jsx    # Global state manager for target role, skill gap, and roadmaps
│   │   └── StudentProfileContext.jsx # Global student profile caching and sync
│   ├── hooks/
│   │   ├── useAuth.js           # Custom hook to consume AuthContext
│   │   ├── useCareerData.js     # Custom hook for career intelligence
│   │   └── useSkillsData.js     # Master hook for Skills Hub, Roadmaps, Progress, Certificates
│   ├── pages/
│   │   ├── Academics.jsx        # Academic intelligence hub (Grades, OCR, GPA Predictor, Copilot)
│   │   ├── AITutor.jsx          # Engineering AI Tutor chat with Groq & YouTube integration
│   │   ├── Careers.jsx          # Career & Skill Gap Hub (Roadmaps, ATS Resume, AI Interview)
│   │   ├── Courses.jsx          # Full course catalog, enrolled courses, module player
│   │   ├── Dashboard.jsx        # Primary student command center with quick analytics
│   │   ├── Home.jsx             # Landing page for unauthenticated visitors
│   │   ├── Jobs.jsx             # Job listings, placement readiness calculator, application tracker
│   │   ├── Login.jsx            # Authentication login screen (Google popup + email)
│   │   ├── NotFound.jsx        # 404 page
│   │   ├── Productivity.jsx    # Pomodoro timer, focus logs, distraction tracker, leaderboard
│   │   ├── Profile.jsx         # Profile settings (branch, college, target role, skills)
│   │   ├── Register.jsx        # Sign up screen
│   │   ├── Skills.jsx          # Skill tree tracker, roadmaps, and progress tabs
│   │   ├── StudyGroups.jsx     # Virtual study rooms & Discord channel directory
│   │   └── skills/             # Interactive Skill Learning Workspace
│   │       ├── AITutorDrawer.jsx # Slide-over AI assistant for instant lesson explanations
│   │       ├── LessonAssessment.jsx # Interactive quiz component with scoring
│   │       ├── LessonContent.jsx    # Publication-grade deep-dive reading workspace
│   │       ├── LessonViewer.jsx     # Multi-stage learning flow manager (Learn -> Assess -> Build)
│   │       ├── ModuleSidebar.jsx    # Sticky curriculum outline with milestone tracker & study tools
│   │       ├── NotesDrawer.jsx      # Persistent lesson markdown notes manager
│   │       ├── PracticalProject.jsx # Hands-on code test runner & auto-completer
│   │       ├── ProgressCard.jsx     # Hero banner displaying skill stats & certification status
│   │       └── SkillDetail.jsx      # Main Skill Learning Workspace container
│   ├── services/
│   │   ├── ai/                  # 18 Modular AI client services (skillGapAIService, resumeATSService, etc.)
│   │   ├── careerMarket/        # 5 Market trend & salary insight services
│   │   ├── interview/           # 18 AI Mock interview, coding challenge & evaluation services
│   │   ├── resume/              # 5 Resume ATS metadata, section builder & exporter services
│   │   ├── roadmap/             # 17 Interactive roadmap execution, XP, streak & badge engines
│   │   ├── skills/              # Master frontend skills services
│   │   │   ├── skillsCurriculumDataset.js # Domain-specific curriculum resolver
│   │   │   ├── skillsCurriculumMap.js     # Comprehensive educational curricula definitions
│   │   │   ├── skillsNormalizer.js        # Normalizes API and fallback skill data with deep sections
│   │   │   ├── skillsProfileSync.js       # Background sync with StudentProfile
│   │   │   └── skillsService.js           # API calls for skills, lessons, notes, AI tutor
│   │   ├── api.js               # Base fetch client with 25s timeout and transient retry
│   │   ├── syncQueue.js         # Debounced offline-resilient background sync queue
│   │   └── copilotApi.js        # Academic Copilot API endpoints fetch client
│   ├── App.jsx                  # Main routes configuration & context providers
│   ├── firebase.js              # Client-side Firebase configuration
│   └── main.jsx                 # React DOM entry point
├── package.json                 # Dependencies and scripts
└── vite.config.js               # Vite configuration
```

---

## 4. System Architecture & Interactive Learning Engine

### Auth Flow
```mermaid
sequenceDiagram
    participant User as Frontend Client
    participant Fire as Firebase Auth
    participant Server as Express Server (Node.js)
    participant DB as MongoDB Database

    User->>Fire: Sign in with Google Popup
    Fire-->>User: Return idToken (JWT)
    User->>Server: POST /api/auth/firebase-login { idToken }
    Server->>Fire: Verify idToken (Firebase Admin SDK)
    Fire-->>Server: Return Decoded Token (uid, email, name, picture)
    Server->>DB: Find or create User by firebaseUid
    DB-->>Server: Return User Document
    Server->>Server: Sign Custom JWT { id: User._id } using JWT_SECRET
    Server-->>User: Return Custom JWT & User profile
    User->>User: Save Custom JWT to localStorage ("zenscore_jwt")
    User->>Server: Request /api/skills/:skillId with Bearer JWT
    Server->>Server: authMiddleware verifies JWT using JWT_SECRET
    Server->>DB: Load skill & progress from MongoDB
    DB-->>Server: Return Record
    Server-->>User: Return 200 JSON Response
```

### Interactive Learning Pipeline Flow
```mermaid
sequenceDiagram
    participant Student as Student UI (LessonViewer)
    participant Content as LessonContent (Read & Deep Dive)
    participant Quiz as LessonAssessment (Test Understanding)
    participant Project as PracticalProject (Build & Verify)
    participant Backend as Skills Backend & MongoDB

    Student->>Content: 1. Read Conceptual Overview, Deep Dives, Comparison Matrix & Code
    Student->>Quiz: 2. Click "Start Skill Assessment"
    Student->>Quiz: 3. Answer 3-4 domain-specific questions
    alt Score < 70%
        Quiz-->>Student: Show Explanations & Prompt to Review Material
    else Score >= 70%
        Quiz-->>Student: Unlock Practical Build Project (Stage -> 'build')
    end
    Student->>Project: 4. Implement practical coding task in editor
    Student->>Project: 5. Click "Run & Verify Code"
    Project->>Project: Automated regex / assertion verification
    Project->>Backend: POST /api/skills/:skillId/lessons/:lessonId/complete
    Backend->>Backend: Update UserSkillProgress & StudentProfile.skillsSummary
    Backend-->>Student: Lesson Completed! Unlock Next Lesson & Advance Stage
```

---

## 5. Complete Database Schemas (Mongoose Models)

### User Model (`models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  profileImage: { type: String, default: '' },
  firebaseUid: { type: String, required: true, unique: true },
  skills: [{ type: String }],
  cgpa: { type: Number, default: 0, min: 0, max: 10 },
  projectsCount: { type: Number, default: 0 },
  branch: { type: String, default: '' },
  college: { type: String, default: '' },
  yearOfStudy: { type: Number, default: 1 },
}, { timestamps: true })
```

### Lesson Model (`models/Lesson.js`)
```javascript
const lessonSchema = new mongoose.Schema({
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  title: { type: String, required: true },
  lessonNumber: { type: Number, required: true },
  description: { type: String },
  introduction: { type: String },
  whatYouWillLearn: [{ type: String }],
  deepDiveSections: [{
    title: { type: String },
    explanation: { type: String },
    keyPoint: { type: String }
  }],
  comparisonTable: {
    title: { type: String },
    headers: [{ type: String }],
    rows: [[{ type: String }]]
  },
  coreConcepts: [{ type: String }],
  syntax: { type: String },
  codeExamples: [{
    language: { type: String },
    code: { type: String },
    explanation: { type: String }
  }],
  commonMistakes: [{ type: String }],
  bestPractices: [{ type: String }],
  summary: { type: String },
  estimatedMinutes: { type: Number, default: 30 },
  learningObjectives: [{ type: String }],
  resources: [{
    title: { type: String },
    url: { type: String },
    provider: { type: String },
    type: { type: String },
    difficulty: { type: String },
    estimatedMinutes: { type: Number }
  }],
  assessment: {
    questions: [{
      id: { type: String },
      question: { type: String },
      options: [{ type: String }],
      correctIndex: { type: Number },
      topic: { type: String },
      explanation: { type: String }
    }]
  },
  practicalTask: {
    title: { type: String },
    difficulty: { type: String },
    problemStatement: { type: String },
    instructions: { type: String },
    requirements: [{ type: String }],
    starterCode: { type: String },
    solutionCode: { type: String },
    hints: [{ type: String }]
  }
}, { timestamps: true })
```

### SkillRoadmap Model (`models/SkillRoadmap.js`)
```javascript
const roadmapNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  title: { type: String, required: true },
  linkedSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  prerequisiteNodeIds: [{ type: String }],
  estimatedHours: { type: Number, default: 10 },
  order: { type: Number, required: true },
  isOptional: { type: Boolean, default: false },
  description: { type: String }
})

const skillRoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String, default: '🚀' },
  estimatedHours: { type: Number, default: 40 },
  estimatedWeeks: { type: Number, default: 8 },
  category: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  displayOrder: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  nodes: [roadmapNodeSchema]
}, { timestamps: true })
```

### UserSkillProgress Model (`models/UserSkillProgress.js`)
```javascript
const userSkillProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  bookmarkedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  currentLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  completionPercentage: { type: Number, default: 0 },
  assessmentScores: [{
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    score: { type: Number },
    passed: { type: Boolean },
    completedAt: { type: Date, default: Date.now }
  }],
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true })
```

---

## 6. Backend REST API Endpoints Summary

All protected endpoints require header: `Authorization: Bearer <zenscore_jwt>`.

### Authentication (`/api/auth`)
*   `POST /api/auth/firebase-login`: Exchange Firebase `idToken` for custom backend JWT.
*   `GET /api/auth/me`: Retrieve current user profile.

### Skills & Interactive Learning Engine (`/api/skills`)
*   `GET /api/skills`: Fetch all published skills with category, difficulty, search, and pagination.
*   `GET /api/skills/categories`: Retrieve skill categories with display orders and counts.
*   `GET /api/skills/continue-learning`: Retrieve user enrolled in-progress skills.
*   `GET /api/skills/progress`: Retrieve overall student skill progress statistics and streak counts.
*   `GET /api/skills/recommended`: Retrieve personalized skill recommendations based on target roles.
*   `GET /api/skills/ai-recommendations`: AI-generated skill gap tips.
*   `GET /api/skills/:skillId`: Fetch detailed skill document, modules, rich lessons, deep dives, quizzes, and user progress.
*   `POST /api/skills/:skillId/enroll`: Enroll user into a skill.
*   `POST /api/skills/:skillId/lessons/:lessonId/complete`: Mark lesson as complete, update progress %, and issue completion certificate on 100%.
*   `POST /api/skills/:skillId/lessons/:lessonId/note`: Save student markdown notes for a specific lesson.
*   `POST /api/skills/:skillId/lessons/:lessonId/bookmark`: Toggle bookmark on a lesson.
*   `POST /api/skills/:skillId/ai-tutor`: Ask instant AI Tutor questions with lesson and syllabus context.

### Production Roadmaps Engine (`/api/roadmaps`)
*   `GET /api/roadmaps`: Fetch all published roadmaps.
*   `GET /api/roadmaps/user`: Fetch all roadmaps with user prerequisite unlock states and progress percentages.
*   `GET /api/roadmaps/:roadmapId`: Fetch detailed roadmap nodes, dependencies, and completion status.
*   `POST /api/roadmaps/enroll`: Enroll user in a roadmap.
*   `PATCH /api/roadmaps/node/:nodeId`: Toggle completion for a specific roadmap node.

### Academics & Intelligence (`/api/academics`)
*   `GET /api/academics/dashboard`: Fetch semesters, SGPA/CGPA, weak subjects, predicted GPA.
*   `POST /api/academics/cgpa`: Add or update semester grades and subjects.
*   `POST /api/academics/predict`: Compute next semester GPA prediction.
*   `GET /api/academics/weak-subjects`: Flag subjects with grade < 6.5.
*   `POST /api/academics/study-plan`: Generate weekly study plan based on weak subjects.

### OCR & Transcript Parsing (`/api/ocr`)
*   `POST /api/ocr/parse-transcript`: Upload marks card image, run Tesseract OCR + university rule parser, return extracted subjects & grades for review.
*   `POST /api/ocr/confirm-import`: Save confirmed OCR grades directly into `AcademicRecord`.

### Academic Copilot (`/api/copilot`)
*   `POST /api/copilot/chat`: Multiturn academic copilot assistance with student context injection.
*   `GET /api/copilot/recommendations`: Generate AI study recommendations based on grade trends.

### Courses & Learning Catalog (`/api/courses`)
*   `GET /api/courses`: Fetch course catalog with filters.
*   `GET /api/courses/:id`: Fetch detailed course modules and lessons.
*   `POST /api/courses/:id/enroll`: Enroll user in course.
*   `POST /api/courses/:id/progress`: Update completed module index.
*   `GET /api/courses/certificates`: Retrieve completed course certificates.

### Career Intelligence & Skill Gap (`/api/careers`)
*   `GET /api/careers/paths`: List seeded career paths.
*   `POST /api/careers/skill-gap`: Calculate skill gap percentage and roadmap recommendations.
*   `POST /api/careers/ai/analyze-resume`: AI ATS scanner and recruiter evaluation.
*   `POST /api/careers/ai/mock-interview`: Start or step through an AI mock interview.

### Productivity (`/api/productivity`)
*   `POST /api/productivity/focus-log`: Record focus study session.
*   `GET /api/productivity/analytics`: Return 7-day focus analytics, top subjects, total hours.
*   `POST /api/productivity/ai-suggestion`: Generate AI productivity tips based on focus vs distraction logs.

---

## 7. Configuration & Environment Setup

### Backend `.env` (`zenscore-backend/zenscore-backend/.env`)
```ini
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=zenscore-ai
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@zenscore-ai.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GROQ_API_KEY=gsk_your_groq_api_key
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` (`zenscore-ai/zenscore-ai/.env`)
```ini
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=zenscore-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zenscore-ai
VITE_FIREBASE_STORAGE_BUCKET=zenscore-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:12345:web:abcd
VITE_YOUTUBE_API_KEY=AIzaSyB...
```

---

## 8. Current State & Recent Developments (Changelog)

### Recently Completed Enhancements:
1. **Interactive Skills Learning Flow (Learn → Assess → Build → Auto-Complete)**:
   - Replaced static lesson viewer with a guided interactive learning flow.
   - Built `LessonAssessment.jsx` quiz engine requiring ≥70% score to unlock practical build projects.
   - Built `PracticalProject.jsx` code editor with instant automated test validation and auto-completion sync to MongoDB.
   - Added `SkillIcon.jsx` SVG brand icon system preventing text overflows.
2. **Comprehensive GeeksforGeeks-Grade Domain Curricula**:
   - Expanded both frontend and backend curriculum repositories (`skillsCurriculumMap.js` and `skillsCurriculumDataset.js`) with structured conceptual deep-dive chapters, Linux kernel isolation (namespaces & cgroups), Virtual DOM/Fiber reconciliation, libuv Event Loop phases, BSON document modeling, and multi-stage Dockerfiles.
   - Added formatted comparison matrices, CLI syntax cheat sheets, step-by-step code walkthroughs, real-world pitfalls, and best practices.
3. **Production Roadmaps Overhaul**:
   - Seeded 5 full industry roadmaps (Full-Stack Web Dev, DevOps & Cloud, AI & Data Science, Backend Microservices, Frontend UI/UX).
   - Connected all roadmap timeline nodes directly to `/skills/:skillId` interactive workspaces.
   - Added direct 1-click workspace launch banner in `RoadmapProgress.jsx`.
4. **Network & Sync Resilience**:
   - Extended `api.js` request timeout to 25s with 1-shot transient auto-retry.
   - Added 150ms write debouncing in `syncQueue.js` and graceful session notices in `AuthContext.jsx`.
   - Guaranteed clean production builds with **0 errors**.

---

## 9. Next Steps & Development Roadmap

1. **AI Code Review Assistant**:
   - Integrate Groq LLM code analyzer inside `PracticalProject.jsx` for dynamic line-by-line code feedback and performance suggestions.
2. **Database Sync for AI Tutor Chats**:
   - Persist AI Tutor chat history (`zt_chats`) and project groups in MongoDB (`ChatSession` model) instead of browser `localStorage`.
3. **Real-time WebSockets for Study Rooms**:
   - Integrate `Socket.io` into `server.js` and `StudyGroups.jsx` to enable live chat, shared study countdown timers, and pomodoro sync.
