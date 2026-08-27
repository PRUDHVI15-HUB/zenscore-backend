/**
 * MongoDB & Database Architecture Master Curriculum
 * 7 Phases, 21 Comprehensive Engineering Lessons
 */

const mongoCurriculum = {
  title: 'MongoDB & Database Architecture',
  category: 'Databases & Storage',
  description: 'Master MongoDB WiredTiger storage mechanics, replica set high availability, sharding, compound indexes, aggregation pipelines, and ACID transactions.',
  modules: [
    {
      title: 'Phase 1: Database Fundamentals & Storage Engines',
      order: 1,
      lessons: [
        {
          lessonNumber: 1,
          title: 'SQL vs NoSQL: Relational vs Document Databases',
          description: 'Compare ACID transactions vs BASE consistency, normalized tables vs embedded documents, and scaling trade-offs.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Compare Relational (RDBMS) tabular models with Document-oriented NoSQL models',
            'Understand the CAP theorem (Consistency, Availability, Partition Tolerance)',
            'Evaluate when to choose SQL foreign key normalization vs NoSQL denormalized embedding'
          ],
          introduction: `Databases form the persistence foundation of modern software engineering. Choosing between SQL and NoSQL requires understanding the mathematical trade-offs between normalized relational integrity and high-throughput distributed document flexibility.`,
          deepDiveSections: [
            {
              title: 'The CAP Theorem & PACELC Model',
              explanation: `The CAP theorem states that in a distributed data store experiencing a network Partition (P), you can guarantee either:
1. Consistency (C): Every read receives the most recent write or an error.
2. Availability (A): Every non-failing node returns a response, but it may not be the most recent write.
MongoDB is fundamentally a CP (Consistent & Partition Tolerant) system by default, ensuring strong consistency on primary replica nodes.`,
              keyPoint: 'MongoDB prioritizes strong consistency (CP) by directing all writes and primary reads to the elected replica set leader.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: SQL (Relational) vs. MongoDB (Document)',
            headers: ['Dimension', 'SQL Databases (PostgreSQL / MySQL)', 'MongoDB (Document NoSQL)'],
            rows: [
              ['Data Model', 'Normalized rows in rigid tables', 'Hierarchical BSON documents with dynamic fields'],
              ['Relationships', 'Foreign keys with expensive JOIN queries', 'Embedded subdocuments or referenced ObjectIds'],
              ['Scaling Strategy', 'Vertical Scaling (Larger CPU/RAM servers)', 'Horizontal Scaling (Automated shard clustering)'],
              ['Schema Flexibility', 'Requires explicit ALTER TABLE migrations', 'Polymorphic schema allowing instant field evolution']
            ]
          },
          coreConcepts: ['CAP theorem trade-offs', 'Polymorphic document schemas', 'Normalization vs denormalization'],
          syntax: `// MongoDB Document Embedding Example
{
  "_id": ObjectId("665b12a8..."),
  "name": "Sarah Connor",
  "email": "sarah@zenscore.ai",
  "address": {
    "city": "San Francisco",
    "country": "USA"
  }
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Embedded 1-to-few pattern in MongoDB
const studentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  enrolledCourses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      enrolledAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['active', 'completed'], default: 'active' }
    }
  ]
});`,
              explanation: 'Embeds enrollment records directly into the student document for single-roundtrip retrieval.'
            }
          ],
          commonMistakes: ['Treating MongoDB like a SQL database by creating a separate collection for every trivial 1:1 relationship'],
          bestPractices: ['Embed data when it is naturally read together and bounded in quantity'],
          summary: `MongoDB document databases excel at horizontal scalability and flexible hierarchical data modeling.`,
          resources: [{ title: 'MongoDB Data Modeling Concepts', url: 'https://www.mongodb.com/docs/manual/core/data-modeling-introduction/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mg1_q1',
                question: 'Under the CAP theorem, how is MongoDB classified in its default replica set configuration?',
                options: [
                  'CP (Consistent and Partition Tolerant)',
                  'AP (Available and Partition Tolerant)',
                  'CA (Consistent and Available without Partitions)',
                  'None of the above'
                ],
                correctIndex: 0,
                topic: 'CAP Theorem Classification',
                explanation: 'MongoDB provides strong consistency (CP) by directing all writes to a single primary node during network partitions.'
              }
            ]
          },
          practicalTask: {
            title: 'Design an Embedded Document Schema',
            difficulty: 'Beginner',
            problemStatement: 'Write a Mongoose schema for `Profile` containing a string `username` and an embedded `socialLinks` object containing `github` and `linkedin` strings.',
            instructions: 'Embed the socialLinks subdocument directly inside the schema.',
            requirements: ['username: String', 'socialLinks: { github: String, linkedin: String }'],
            starterCode: `const profileSchema = new mongoose.Schema({\n  // TODO: Add fields\n});`,
            solutionCode: `const profileSchema = new mongoose.Schema({\n  username: { type: String, required: true },\n  socialLinks: {\n    github: String,\n    linkedin: String\n  }\n});`,
            hints: ['Define socialLinks as a nested object with github and linkedin string properties.']
          }
        },
        {
          lessonNumber: 2,
          title: 'WiredTiger Storage Engine & Write-Ahead Logging (WAL)',
          description: 'Explore WiredTiger cache mechanics, document-level concurrency, checkpointing, and journal write-ahead logging.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand the WiredTiger storage engine architecture and cache allocation',
            'Master document-level concurrency and lock-free optimistic execution',
            'Learn how the Journal (Write-Ahead Log) prevents data loss during server crashes'
          ],
          introduction: `WiredTiger is the default, high-performance storage engine for MongoDB. It provides document-level locking, snappy compression, in-memory caching, and write-ahead journaling for crash resilience.`,
          deepDiveSections: [
            {
              title: 'WiredTiger Cache & Journaling Architecture',
              explanation: `How WiredTiger persists writes:
1. In-Memory Cache: Writes are applied immediately to the WiredTiger RAM cache (typically 50% of total host RAM).
2. Journal (WAL): The write is appended synchronously to an on-disk Journal file.
3. Checkpointing: Every 60 seconds (or when 2GB of data is written), WiredTiger flushes dirty cache pages to the permanent data files on disk in a clean atomic checkpoint.`,
              keyPoint: 'If the server crashes, WiredTiger replays the Journal from the last checkpoint to recover all committed data.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: MMAPv1 (Legacy) vs. WiredTiger (Modern)',
            headers: ['Feature', 'MMAPv1 (Legacy Engine)', 'WiredTiger (Modern Engine)'],
            rows: [
              ['Concurrency Level', 'Database-level / Collection-level lock', 'Document-level lock with optimistic concurrency'],
              ['Data Compression', 'None (Large disk footprints)', 'Snappy / zlib compression (~70% disk savings)'],
              ['Cache Management', 'Relied on OS virtual memory mapping', 'Dedicated internal cache with LRU page eviction']
            ]
          },
          coreConcepts: ['Document-level locking', 'Journal Write-Ahead Log (WAL)', '60-second checkpoint flush interval'],
          syntax: `# Inspect WiredTiger storage engine metrics
db.serverStatus().wiredTiger.cache`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Verify write durability with write concern 'w: majority, j: true'
const result = await db.collection('orders').insertOne(
  { orderId: "ORD-991", amount: 249.99, status: "PAID" },
  { writeConcern: { w: 'majority', j: true, wtimeout: 5000 } }
);`,
              explanation: 'Requires confirmation that the write has been flushed to the on-disk journal (j: true).'
            }
          ],
          commonMistakes: ['Disabling the journal in production to save disk I/O, which risks permanent database corruption on sudden power failure'],
          bestPractices: ['Keep journaling enabled (`j: true`) and configure at least 50% of available RAM for the WiredTiger cache'],
          summary: `WiredTiger delivers massive write concurrency through document-level locking and guarantees durability via write-ahead journaling.`,
          resources: [{ title: 'WiredTiger Storage Engine Reference', url: 'https://www.mongodb.com/docs/manual/core/wiredtiger/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg2_q1',
                question: 'What is the role of the WiredTiger Journal in MongoDB?',
                options: [
                  'A write-ahead log on disk that allows MongoDB to recover unwritten cache data if a sudden server crash occurs',
                  'A daily summary sent to the administrator',
                  'A collection storing user passwords',
                  'A temporary table for SQL queries'
                ],
                correctIndex: 0,
                topic: 'Write-Ahead Logging',
                explanation: 'The journal ensures write durability by recording mutations on disk before they are flushed to permanent data files.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Journaled Write Concern',
            difficulty: 'Intermediate',
            problemStatement: 'Write the options object passed to a MongoDB insert operation that specifies write concern `w: "majority"` and journal confirmation `j: true`.',
            instructions: 'Return { writeConcern: { w: "majority", j: true } }.',
            requirements: ['writeConcern with w: "majority" and j: true'],
            starterCode: `const options = {\n  // TODO: Write concern\n};`,
            solutionCode: `const options = {\n  writeConcern: {\n    w: 'majority',\n    j: true\n  }\n};`,
            hints: ['Set writeConcern: { w: "majority", j: true }']
          }
        },
        {
          lessonNumber: 3,
          title: 'MongoDB Cluster Architecture: Replica Sets & Primary-Secondary Elections',
          description: 'Master 3-node replica sets, Raft-like election mechanics, heartbeat health probes, and automatic failovers.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand MongoDB 3-node Replica Set architecture (1 Primary, 2 Secondaries)',
            'Master Raft-style consensus elections when a Primary becomes unreachable',
            'Configure read preferences (primary, secondaryPreferred, nearest)'
          ],
          introduction: `In production, a single database server is a Single Point of Failure (SPOF). MongoDB Replica Sets provide high availability and automatic failover by maintaining redundant synchronized copies of data across multiple physical servers.`,
          deepDiveSections: [
            {
              title: 'Replica Set Oplog & Raft-Style Elections',
              explanation: `A standard production replica set contains at least 3 nodes:
1. Primary Node: Accepts all client write operations and records them in its Operations Log (\`local.oplog.rs\`).
2. Secondary Nodes: Continuously tail and apply the Primary's oplog to maintain an identical byte-for-byte data replica.
3. Heartbeats & Elections: Nodes send heartbeats every 2 seconds. If the Primary fails to respond for 10 seconds, secondaries initiate a consensus election to elect a new Primary in milliseconds.`,
              keyPoint: 'The oplog (Operations Log) is a capped collection containing idempotent operations replicated to all secondaries.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Replica Set Node Roles',
            headers: ['Role', 'Accepts Writes', 'Accepts Reads', 'Participates in Elections'],
            rows: [
              ['Primary', 'Yes (Sole write master)', 'Yes (Default read target)', 'Yes (Maintains quorum)'],
              ['Secondary', 'No (Applies oplog)', 'Yes (If readPreference is set)', 'Yes (Can vote and be elected Primary)'],
              ['Arbiter', 'No (Holds no data)', 'No', 'Yes (Breaks election ties with 0 data storage)']
            ]
          },
          coreConcepts: ['Replica Set Oplog replication stream', 'Quorum voting elections (N/2 + 1)', 'Read preferences (`secondaryPreferred`)'],
          syntax: `# Check replica set status in mongosh
rs.status()
rs.isMaster()
rs.conf()`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Connecting to a 3-node Replica Set with Read Preference
const mongoose = require('mongoose');

mongoose.connect('mongodb://node1:27017,node2:27017,node3:27017/zenscore?replicaSet=rs0', {
  readPreference: 'secondaryPreferred',
  readConcern: { level: 'majority' }
});`,
              explanation: 'Configures client to route heavy analytical reads to secondaries while writing exclusively to the primary.'
            }
          ],
          commonMistakes: ['Running an even number of voting nodes (e.g. 2 nodes), which makes election quorum impossible during network partitions'],
          bestPractices: ['Always deploy an odd number of voting replica set nodes (minimum 3 nodes) for reliable quorum'],
          summary: `MongoDB Replica Sets guarantee 99.999% uptime via automated oplog synchronization and sub-second primary failover.`,
          resources: [{ title: 'MongoDB Replication Concepts', url: 'https://www.mongodb.com/docs/manual/replication/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg3_q1',
                question: 'What is the minimum number of voting nodes required to maintain automatic election quorum in a production MongoDB Replica Set?',
                options: ['3 nodes', '1 node', '2 nodes', '10 nodes'],
                correctIndex: 0,
                topic: 'Replica Set Quorum',
                explanation: 'A minimum of 3 voting nodes is required so that if 1 node fails, the remaining 2 nodes still form a strict majority (2/3 > 50%).'
              }
            ]
          },
          practicalTask: {
            title: 'Inspect Replica Set Status',
            difficulty: 'Beginner',
            problemStatement: 'Write the MongoDB shell command to inspect the current state, primary node, and health of a replica set.',
            instructions: 'Use rs.status().',
            requirements: ['rs.status()'],
            starterCode: `rs.`,
            solutionCode: `rs.status()`,
            hints: ['rs.status()']
          }
        }
      ]
    },
    {
      title: 'Phase 2: MongoDB Documents, Collections & BSON',
      order: 2,
      lessons: [
        {
          lessonNumber: 4,
          title: 'BSON Data Types & Document Anatomy',
          description: 'Deep dive into 12-byte ObjectIds, Decimal128 for financial precision, Binary data (UUIDs), and UTC Date representations.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Master BSON primitive data types and their memory byte allocations',
            'Use Decimal128 to prevent floating-point rounding errors in financial transactions',
            'Store binary UUIDs and raw buffers in BSON'
          ],
          introduction: `JSON numbers are double-precision floating-point numbers (IEEE 754), which cause disastrous rounding errors in financial computations (e.g. 0.1 + 0.2 !== 0.3). BSON introduces Decimal128, providing 34 decimal digits of precision for currency calculations.`,
          deepDiveSections: [
            {
              title: 'Decimal128 vs. Double in Financial Records',
              explanation: `Why Decimal128 is mandatory for finances:
• Double: 64-bit binary floating point. Cannot represent exact decimal fractions like 0.10.
• Decimal128: 128-bit IEEE 754-2008 decimal floating point. Stores exact base-10 values without rounding errors.`,
              keyPoint: 'Always use BSON Decimal128 or store currency in integer cents to prevent floating point inaccuracies.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: BSON Data Types and Storage Allocations',
            headers: ['BSON Type', 'Type Number', 'Byte Footprint', 'Best Use Case'],
            rows: [
              ['ObjectId', '7', '12 bytes', 'Unique primary key identifiers'],
              ['Date', '9', '8 bytes (64-bit int)', 'UTC timestamps since Unix epoch'],
              ['Decimal128', '19', '16 bytes (128-bit)', 'Monetary balances, pricing, precise scientific calculations'],
              ['Binary / UUID', '5', 'Variable / 16 bytes', 'Cryptographic keys, UUIDs, image thumbnails']
            ]
          },
          coreConcepts: ['BSON Decimal128 exact precision', '12-byte ObjectId timestamp extraction', 'UTC DateTime timezone standardization'],
          syntax: `// Creating Decimal128 in MongoDB
const { Decimal128 } = require('mongodb');
const price = Decimal128.fromString("99.99");`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Financial transaction schema using Decimal128
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  taxRate: { type: mongoose.Schema.Types.Decimal128, default: 0.18 },
  issuedAt: { type: Date, default: Date.now }
});`,
              explanation: 'Mongoose schema utilizing Decimal128 for precise financial accounting.'
            }
          ],
          commonMistakes: ['Storing money amounts as standard JavaScript numbers, resulting in floating-point penny discrepancies'],
          bestPractices: ['Always use Decimal128 or integer cents when modeling currency values in MongoDB'],
          summary: `BSON rich data types ensure data integrity, exact monetary precision, and standardized date handling.`,
          resources: [{ title: 'BSON Types Reference', url: 'https://www.mongodb.com/docs/manual/reference/bson-types/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mg4_q1',
                question: 'Which BSON data type should be chosen when modeling bank account balances and currency amounts?',
                options: [
                  'Decimal128',
                  'Double',
                  'String',
                  'Boolean'
                ],
                correctIndex: 0,
                topic: 'BSON Data Types',
                explanation: 'Decimal128 provides 128-bit exact base-10 decimal precision, eliminating floating-point rounding errors.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a Decimal128 Mongoose Field',
            difficulty: 'Beginner',
            problemStatement: 'Write the Mongoose schema field definition for `balance` using `mongoose.Schema.Types.Decimal128` and `required: true`.',
            instructions: 'Set type: mongoose.Schema.Types.Decimal128, required: true.',
            requirements: ['balance: { type: mongoose.Schema.Types.Decimal128, required: true }'],
            starterCode: `const accountSchema = new mongoose.Schema({\n  balance: \n});`,
            solutionCode: `const accountSchema = new mongoose.Schema({\n  balance: { type: mongoose.Schema.Types.Decimal128, required: true }\n});`,
            hints: ['balance: { type: mongoose.Schema.Types.Decimal128, required: true }']
          }
        },
        {
          lessonNumber: 5,
          title: 'CRUD Operations & Atomic Field Updates',
          description: 'Master atomic update operators ($set, $inc, $unset, $min, $max), upsert mechanics, and bulkWrite batches.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand document-level atomicity in MongoDB updates',
            'Master atomic field operators ($set, $inc, $unset, $rename, $currentDate)',
            'Execute high-performance batch mutations with bulkWrite()'
          ],
          introduction: `In MongoDB, write operations are atomic at the document level. Using atomic update operators (like $inc and $set) prevents concurrency race conditions where two simultaneous requests overwrite each other's changes.`,
          deepDiveSections: [
            {
              title: 'The Danger of Read-Modify-Write Race Conditions',
              explanation: `Consider incrementing a student's score:
• WRONG (Race Condition): Read user -> compute user.score + 10 in JavaScript -> Save user. (If 2 requests happen at once, score only increases by 10).
• RIGHT (Atomic Database Operator): Execute db.users.updateOne({ _id }, { $inc: { score: 10 } }). MongoDB locks the document and increments the field directly in memory.`,
              keyPoint: 'Always use atomic update operators ($inc, $set) instead of reading and saving mutated documents in application memory.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Common Atomic Update Operators',
            headers: ['Operator', 'Action', 'Example'],
            rows: [
              ['$set', 'Replaces the value of a field', '{ $set: { status: "active" } }'],
              ['$inc', 'Increments a numeric field by value', '{ $inc: { viewCount: 1, balance: -50 } }'],
              ['$unset', 'Deletes a specific field from document', '{ $unset: { temporaryToken: "" } }'],
              ['$currentDate', 'Sets field to current server timestamp', '{ $currentDate: { lastLogin: true } }']
            ]
          },
          coreConcepts: ['Document-level write atomicity', 'Atomic mathematical increments ($inc)', 'Bulk write operations (`bulkWrite`)'],
          syntax: `// Atomic MongoDB update
await User.updateOne(
  { _id: userId },
  {
    $inc: { loginCount: 1 },
    $set: { lastIp: req.ip },
    $currentDate: { updatedAt: true }
  }
);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// High-Performance Bulk Write Execution
const bulkOps = updates.map(u => ({
  updateOne: {
    filter: { _id: u.studentId },
    update: { $set: { cgpa: u.newCgpa }, $inc: { credits: u.earnedCredits } }
  }
}));

await Student.bulkWrite(bulkOps, { ordered: false });`,
              explanation: 'Executes thousands of atomic updates in a single network roundtrip with parallel execution.'
            }
          ],
          commonMistakes: ['Overwriting entire documents using replaceOne when only intending to modify a single field'],
          bestPractices: ['Always use $set or $inc to update specific fields and use bulkWrite for batch updates'],
          summary: `Atomic update operators prevent race conditions and ensure safe concurrent writes at the database layer.`,
          resources: [{ title: 'MongoDB Field Update Operators', url: 'https://www.mongodb.com/docs/manual/reference/operator/update-field/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mg5_q1',
                question: 'Which atomic operator should be used to safely increment a view counter without risking concurrency race conditions?',
                options: [
                  '$inc',
                  '$set',
                  '$push',
                  '$add'
                ],
                correctIndex: 0,
                topic: 'Atomic Update Operators',
                explanation: '$inc atomically increments numeric fields directly within the WiredTiger engine, preventing lost updates.'
              }
            ]
          },
          practicalTask: {
            title: 'Increment a View Counter Atomically',
            difficulty: 'Beginner',
            problemStatement: 'Write the MongoDB update query to atomically increment `views` by `1` and set `status` to `"trending"` for document with `_id: skillId`.',
            instructions: 'Use $inc and $set in updateOne.',
            requirements: ['{ $inc: { views: 1 }, $set: { status: "trending" } }'],
            starterCode: `await Skill.updateOne({ _id: skillId }, {\n  // TODO: Update operators\n});`,
            solutionCode: `await Skill.updateOne({ _id: skillId }, {\n  $inc: { views: 1 },\n  $set: { status: 'trending' }\n});`,
            hints: ['{ $inc: { views: 1 }, $set: { status: "trending" } }']
          }
        },
        {
          lessonNumber: 6,
          title: 'Array Manipulations & Positional Operators ($push, $pull, $elemMatch)',
          description: 'Manipulate embedded arrays using $push, $addToSet, $pull, positional operator ($), and arrayFilters ($[identifier]).',
          estimatedMinutes: 35,
          learningObjectives: [
            'Add and remove elements from nested arrays atomically using $push, $addToSet, and $pull',
            'Update matching array subdocuments using the positional operator ($)',
            'Execute complex multi-element updates using arrayFilters'
          ],
          introduction: `Document databases heavily utilize embedded arrays. Modifying specific items inside nested arrays without replacing the entire array requires mastery of MongoDB array operators and positional identifiers.`,
          deepDiveSections: [
            {
              title: 'Positional Operator ($) vs. arrayFilters ($[elem])',
              explanation: `Updating elements inside arrays:
1. Positional Operator ($): Modifies the FIRST array element that matched the query filter.
   db.courses.updateOne({ _id, "modules.id": "m1" }, { $set: { "modules.$.title": "New Title" } })
2. arrayFilters: Modifies ALL array elements matching a custom condition.
   db.courses.updateOne({ _id }, { $set: { "modules.$[m].isLocked": false } }, { arrayFilters: [{ "m.order": { $lte: 3 } }] })`,
              keyPoint: 'arrayFilters enables precise, multi-element updates inside complex nested arrays.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Array Mutation Operators',
            headers: ['Operator', 'Action', 'Duplicate Prevention'],
            rows: [
              ['$push', 'Appends an item to the end of the array', 'Allows duplicates'],
              ['$addToSet', 'Appends an item ONLY if it does not already exist', 'Guarantees set uniqueness (No duplicates)'],
              ['$pull', 'Removes all matching items from the array', 'Removes all matching values']
            ]
          },
          coreConcepts: ['Array set uniqueness with `$addToSet`', 'Positional dollar operator (`$`)', 'Targeted updates with `arrayFilters`'],
          syntax: `// Atomic array set insertion
await Skill.updateOne(
  { _id: skillId },
  { $addToSet: { tags: "Docker" } }
);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Updating a nested module title using arrayFilters
await Course.updateOne(
  { _id: courseId },
  {
    $set: { "phases.$[p].lessons.$[l].isCompleted": true }
  },
  {
    arrayFilters: [
      { "p.order": 1 },
      { "l.lessonNumber": 2 }
    ]
  }
);`,
              explanation: 'Deep nested array update using multi-level arrayFilters.'
            }
          ],
          commonMistakes: ['Using $push when uniqueness is required, resulting in bloated duplicate arrays'],
          bestPractices: ['Use $addToSet to add unique items (like tags or completed IDs) and $pull to remove them cleanly'],
          summary: `MongoDB array operators and arrayFilters allow surgical atomic modifications inside nested subdocument arrays.`,
          resources: [{ title: 'MongoDB Array Update Operators', url: 'https://www.mongodb.com/docs/manual/reference/operator/update-array/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mg6_q1',
                question: 'Which operator adds a value to an array ONLY if that value does not already exist in the array?',
                options: [
                  '$addToSet',
                  '$push',
                  '$insert',
                  '$unique'
                ],
                correctIndex: 0,
                topic: 'Array Set Operators',
                explanation: '$addToSet treats the array like a mathematical set, appending the value only if it is not already present.'
              }
            ]
          },
          practicalTask: {
            title: 'Add Unique Tag to an Array',
            difficulty: 'Beginner',
            problemStatement: 'Write the Mongoose update query to add `"Microservices"` to the `tags` array of a skill document with `_id: skillId` without creating duplicates.',
            instructions: 'Use $addToSet: { tags: "Microservices" } in updateOne.',
            requirements: ['{ $addToSet: { tags: "Microservices" } }'],
            starterCode: `await Skill.updateOne({ _id: skillId }, {\n  // TODO: Add unique tag\n});`,
            solutionCode: `await Skill.updateOne({ _id: skillId }, {\n  $addToSet: { tags: 'Microservices' }\n});`,
            hints: ['{ $addToSet: { tags: "Microservices" } }']
          }
        }
      ]
    },
    {
      title: 'Phase 3: Schema Design & Mongoose ODM',
      order: 3,
      lessons: [
        {
          lessonNumber: 7,
          title: 'Embedding vs Referencing (1:1, 1:N, N:M Patterns)',
          description: 'Architect schema relationships using the Golden Rules of MongoDB Data Modeling (1-to-few, 1-to-many, 1-to-squillions).',
          estimatedMinutes: 35,
          learningObjectives: [
            'Apply the 3 Golden Rules of MongoDB Schema Design',
            'Master 1-to-few (Embedding), 1-to-many (Referencing), and 1-to-squillions (Parent referencing)',
            'Avoid the Unbounded Array Anti-Pattern'
          ],
          introduction: `The most critical architectural decision in MongoDB is choosing whether to embed subdocuments or reference ObjectIds across collections. Making the wrong choice leads to degraded query speeds and documents breaching the 16MB limit.`,
          deepDiveSections: [
            {
              title: 'The 3 Golden Rules of MongoDB Schema Design',
              explanation: `1. Rule 1: Favor embedding unless there is a compelling reason not to.
2. Rule 2: Needing to access an object on its own is a compelling reason not to embed it.
3. Rule 3: Beware of unbounded arrays! If the "many" side can exceed a few hundred items (e.g. server log entries or user notifications), store references on the child document pointing back to the parent (parent_id).`,
              keyPoint: 'Use two-way referencing or child-to-parent references for large or unbounded 1:N relationships.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Embedding vs. Referencing Decision Matrix',
            headers: ['Relationship', 'Best Strategy', 'Example Architecture'],
            rows: [
              ['1-to-Few (< 50 items)', 'Embed directly inside parent document', 'User Addresses, Skill Phases & Learning Objectives'],
              ['1-to-Many (100–10,000 items)', 'Reference array of ObjectIds in parent or child', 'Course Lessons, Student Enrolled Classes'],
              ['1-to-Squillions (> 50,000 items)', 'Store parent ObjectId reference on child document', 'IoT Sensor logs pointing to { device_id }']
            ]
          },
          coreConcepts: ['1-to-Few vs 1-to-Squillions modeling', 'Unbounded array anti-pattern', 'Two-way referencing'],
          syntax: `// Child-to-Parent Reference Pattern (1-to-Squillions)
const logSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', index: true },
  temperature: Number,
  timestamp: { type: Date, default: Date.now }
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Schema combining embedded phases with referenced user progress
const skillSchema = new mongoose.Schema({
  title: String,
  category: String,
  phases: [{
    order: Number,
    title: String
  }]
});

const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', index: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
});`,
              explanation: 'Hybrid schema embedding static phases while referencing dynamic student progress.'
            }
          ],
          commonMistakes: ['Embedding unbounded user activity logs inside the User document, which breaks when document size hits 16MB'],
          bestPractices: ['Store high-velocity unbounded records in a separate collection with an indexed reference to the parent'],
          summary: `Applying the 3 Golden Rules guarantees optimal query latency and prevents unbounded document growth.`,
          resources: [{ title: '6 Rules of Thumb for MongoDB Schema Design', url: 'https://www.mongodb.com/blog/post/6-rules-of-thumb-for-mongodb-schema-design', provider: 'MongoDB.com', type: 'Article', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg7_q1',
                question: 'When modeling a high-velocity IoT temperature sensor that records millions of readings per device, which schema pattern should you choose?',
                options: [
                  'Parent referencing: Store each reading as a separate document referencing the device ID',
                  'Embed all millions of readings inside an array in the device document',
                  'Create a new collection for every single temperature reading',
                  'Convert all readings to strings in a single text file'
                ],
                correctIndex: 0,
                topic: '1-to-Squillions Pattern',
                explanation: 'Embedding millions of readings in one document violates the 16MB limit; parent referencing allows infinite independent documents indexed by device ID.'
              }
            ]
          },
          practicalTask: {
            title: 'Design a Parent-Referenced Model',
            difficulty: 'Intermediate',
            problemStatement: 'Write a Mongoose schema for `LessonProgress` containing an indexed `student` ObjectId reference, an indexed `lesson` ObjectId reference, and boolean `isDone`.',
            instructions: 'Use Schema.Types.ObjectId with ref and index: true.',
            requirements: ['student: { type: ObjectId, ref: "User", index: true }', 'lesson: { type: ObjectId, ref: "Lesson", index: true }', 'isDone: Boolean'],
            starterCode: `const progressSchema = new mongoose.Schema({\n  // TODO: Fields\n});`,
            solutionCode: `const progressSchema = new mongoose.Schema({\n  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },\n  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', index: true },\n  isDone: { type: Boolean, default: false }\n});`,
            hints: ['Use type: mongoose.Schema.Types.ObjectId, ref: "...", index: true']
          }
        },
        {
          lessonNumber: 8,
          title: 'Mongoose Schemas, Virtuals, Getters & Setters',
          description: 'Configure computed properties with virtuals, transform output with toJSON options, and apply custom schema getters.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Create virtual properties that do not persist to MongoDB but appear in JSON outputs',
            'Implement custom getters and setters for data formatting and encryption',
            'Configure schema toJSON and toObject options'
          ],
          introduction: `Virtual fields are computed document properties that you can get and set but do not get persisted to the database. They allow clean encapsulation of calculated metrics like full names, percentages, and duration strings.`,
          deepDiveSections: [
            {
              title: 'Virtuals & toJSON Serialization Options',
              explanation: `By default, Mongoose excludes virtual fields when converting documents to JSON.
To include virtuals in API responses, enable the schema options:
const schema = new mongoose.Schema({ ... }, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
This ensures virtuals like user.fullName appear automatically in res.json(user).`,
              keyPoint: 'Enable toJSON: { virtuals: true } in schema options so computed properties appear in API responses.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Persisted Fields vs. Mongoose Virtuals',
            headers: ['Dimension', 'Persisted Schema Field', 'Mongoose Virtual Field'],
            rows: [
              ['Storage Footprint', 'Consumes disk bytes in BSON document', 'Zero disk storage (Computed in memory)'],
              ['Querying with .find()', 'Can be queried directly and indexed', 'Cannot be queried with standard .find()'],
              ['Computation', 'Static stored value', 'Dynamically computed on demand via getter function']
            ]
          },
          coreConcepts: ['Virtual getters (`schema.virtual().get()`)', 'Virtual population (`ref` with `localField`/`foreignField`)', 'Output transformation with `toJSON.transform`'],
          syntax: `// Mongoose Virtual Getter
userSchema.virtual('fullName').get(function() {
  return \`\${this.firstName} \${this.lastName}\`;
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Schema with virtuals and sensitive field striping
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  password: { type: String, select: false }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.virtual('fullName').get(function() {
  return \`\${this.firstName} \${this.lastName}\`;
});`,
              explanation: 'Virtual fullName with automatic password and __v removal during JSON serialization.'
            }
          ],
          commonMistakes: ['Attempting to query virtual fields with Model.find({ fullName: "..." }), which fails because virtuals do not exist on disk'],
          bestPractices: ['Use virtuals for formatting and computed UI helpers; persist raw fields when index filtering is needed'],
          summary: `Virtuals encapsulate computed logic and clean serialization without bloating MongoDB database storage.`,
          resources: [{ title: 'Mongoose Virtuals Documentation', url: 'https://mongoosejs.com/docs/tutorials/virtuals.html', provider: 'Mongoosejs.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mg8_q1',
                question: 'Which schema option must be set to true for Mongoose virtual fields to be included when executing res.json(doc)?',
                options: [
                  'toJSON: { virtuals: true }',
                  'persistVirtuals: true',
                  'index: { virtuals: true }',
                  'virtualQuery: true'
                ],
                correctIndex: 0,
                topic: 'Virtual Serialization',
                explanation: 'By default, virtuals are excluded from JSON output; enabling toJSON: { virtuals: true } includes them.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a Computed Virtual Property',
            difficulty: 'Beginner',
            problemStatement: 'Define a virtual `completionRatio` on `progressSchema` that returns `this.completedCount / this.totalCount`.',
            instructions: 'Use progressSchema.virtual("completionRatio").get(function() { ... }).',
            requirements: ['progressSchema.virtual("completionRatio").get(...)', 'return this.completedCount / this.totalCount'],
            starterCode: `progressSchema.virtual('completionRatio').get(\n  // TODO: Implement getter\n);`,
            solutionCode: `progressSchema.virtual('completionRatio').get(function() {\n  return this.completedCount / this.totalCount;\n});`,
            hints: ['progressSchema.virtual("completionRatio").get(function() { return this.completedCount / this.totalCount; });']
          }
        },
        {
          lessonNumber: 9,
          title: 'Mongoose Middleware: Pre/Post Hooks & Custom Validators',
          description: 'Implement document and query hooks, cascade delete triggers, and asynchronous custom validators with regex.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement document hooks (save, validate, remove) and query hooks (find, update)',
            'Trigger cascading deletes to clean up child references when a parent document is removed',
            'Write asynchronous custom validators with detailed error messages'
          ],
          introduction: `Mongoose middleware (also called pre and post hooks) allows you to specify functions that execute automatically when specific model actions (such as saving, updating, or deleting documents) take place.`,
          deepDiveSections: [
            {
              title: 'Cascade Delete with Mongoose Middleware',
              explanation: `When a Skill document is deleted, all related Lesson documents and UserSkillProgress records must be deleted to prevent orphaned records in the database.
Attach a post-delete hook:
skillSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await Lesson.deleteMany({ skill: doc._id });
    await UserSkillProgress.deleteMany({ skill: doc._id });
  }
});`,
              keyPoint: 'Post-delete query middleware automatically maintains referential integrity by cleaning up orphaned records.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Document Middleware vs. Query Middleware',
            headers: ['Dimension', 'Document Middleware (`pre("save")`)', 'Query Middleware (`pre("findOneAndUpdate")`)'],
            rows: [
              ['Target Object (this)', 'The individual Mongoose document instance', 'The Mongoose Query object'],
              ['Validation Execution', 'Runs all schema validators automatically', 'Validators must be explicitly enabled with { runValidators: true }'],
              ['Trigger Operations', 'doc.save(), doc.validate()', 'Model.updateMany(), Model.findOneAndUpdate(), Model.find()']
            ]
          },
          coreConcepts: ['Document vs Query middleware', 'Cascade deletion automation', 'Asynchronous schema validators'],
          syntax: `// Custom Schema Validator
userSchema.path('email').validate(async function(email) {
  const count = await mongoose.models.User.countDocuments({ email, _id: { $ne: this._id } });
  return !count;
}, 'Email address is already in use.');`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Slug auto-generation pre-save hook
skillSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  next();
});`,
              explanation: 'Generates SEO-friendly URL slugs before saving a skill document.'
            }
          ],
          commonMistakes: ['Forgetting { runValidators: true } in findOneAndUpdate, which bypasses all schema validation by default in Mongoose'],
          bestPractices: ['Always pass { runValidators: true, new: true } when performing findOneAndUpdate operations'],
          summary: `Mongoose pre/post hooks enforce business invariants, automate cascading deletes, and guarantee schema consistency.`,
          resources: [{ title: 'Mongoose Middleware Reference', url: 'https://mongoosejs.com/docs/middleware.html', provider: 'Mongoosejs.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg9_q1',
                question: 'Why must you pass `{ runValidators: true }` when executing `Model.findOneAndUpdate()` in Mongoose?',
                options: [
                  'Because Mongoose disables schema validation on update queries by default for performance reasons',
                  'To restart the database connection',
                  'To delete invalid documents',
                  'Because Mongoose cannot parse update objects'
                ],
                correctIndex: 0,
                topic: 'Update Query Validation',
                explanation: 'Unlike .save(), update query methods in Mongoose do not run validators by default unless explicitly enabled via { runValidators: true }.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement an Auto-Slug Pre-Save Hook',
            difficulty: 'Intermediate',
            problemStatement: 'Write a Mongoose `pre("save")` hook on `courseSchema` that sets `this.slug = this.title.toLowerCase().replace(/\\s+/g, "-")` if `this.isModified("title")`.',
            instructions: 'Use courseSchema.pre("save", function(next) { ... }).',
            requirements: ['if (this.isModified("title")) this.slug = ...', 'call next()'],
            starterCode: `courseSchema.pre('save', function(next) {\n  // TODO: Set slug\n});`,
            solutionCode: `courseSchema.pre('save', function(next) {\n  if (this.isModified('title')) {\n    this.slug = this.title.toLowerCase().replace(/\\s+/g, '-');\n  }\n  next();\n});`,
            hints: ['if (this.isModified("title")) { this.slug = this.title.toLowerCase().replace(/\\s+/g, "-"); } next();']
          }
        }
      ]
    },
    {
      title: 'Phase 4: Queries, Indexing & Aggregation Pipelines',
      order: 4,
      lessons: [
        {
          lessonNumber: 10,
          title: 'Indexing Strategies: Single Field, Compound & Multikey Indexes',
          description: 'Master B-Tree index structures, compound indexes, ESR prefix rules, multikey array indexing, and partial indexes.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand B-Tree index structures and node pointers in WiredTiger',
            'Master the ESR (Equality, Sort, Range) rule for compound index design',
            'Create memory-efficient Partial Indexes and TTL auto-expiring indexes'
          ],
          introduction: `Indexes are specialized in-memory data structures that store a small portion of the collection’s data in an easily traversable form. Designing optimal compound indexes requires adhering to the ESR (Equality, Sort, Range) rule.`,
          deepDiveSections: [
            {
              title: 'The ESR Rule for Compound Index Optimization',
              explanation: `When designing a compound index for queries with filtering, sorting, and range conditions:
1. Equality (E) First: Place fields with exact matches first: { category: "Web" }.
2. Sort (S) Second: Place fields used in the sort order next: { score: -1 }.
3. Range (R) Last: Place fields with range operators ($gte, $in, $lt) at the end: { createdAt: { $gte: date } }.
Optimal Index: { category: 1, score: -1, createdAt: 1 }.`,
              keyPoint: 'Follow ESR (Equality -> Sort -> Range) order to enable in-index sorting and eliminate expensive in-memory sort stages.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Index Types in MongoDB',
            headers: ['Index Type', 'Structure', 'Best Use Case'],
            rows: [
              ['Single Field Index', 'B-Tree on one property (`{ email: 1 }`)', 'Unique constraints and direct lookups'],
              ['Compound Index', 'B-Tree on multiple properties in order', 'Multi-attribute filtering, sorting, and range queries'],
              ['Multikey Index', 'Indexes each individual element of an array', 'Querying items inside tags or skill arrays'],
              ['Partial Index', 'Indexes only documents matching a filter', 'Indexing active users only (`{ active: true }`) saving 80% RAM'],
              ['TTL Index', 'Automatically deletes document after seconds', 'Expiring auth tokens, OTP codes, and temp sessions']
            ]
          },
          coreConcepts: ['ESR Rule (Equality, Sort, Range)', 'Partial and TTL indexes', 'Multikey array index limits'],
          syntax: `// Creating a TTL Index (expires in 24 hours)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Creating a Partial Index
userSchema.index({ email: 1 }, { partialFilterExpression: { isVerified: true } });`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Compound Index strictly adhering to the ESR Rule
// Query: Skill.find({ category: "DevOps", hours: { $lte: 40 } }).sort({ rating: -1 })
// E: category | S: rating | R: hours
skillSchema.index({ category: 1, rating: -1, hours: 1 });`,
              explanation: 'Compound index matching Equality (category), Sort (rating), and Range (hours).'
            }
          ],
          commonMistakes: ['Placing range fields before sort fields in a compound index, which forces an expensive in-memory SORT stage'],
          bestPractices: ['Strictly order compound index fields by Equality -> Sort -> Range to guarantee IXSCAN without in-memory sorting'],
          summary: `The ESR rule and partial indexing maximize query speed while minimizing RAM memory consumption.`,
          resources: [{ title: 'MongoDB Indexing Rules', url: 'https://www.mongodb.com/docs/manual/core/index-compound/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg10_q1',
                question: 'According to the ESR rule for compound index design, in what order should query fields be placed in the index?',
                options: [
                  '1. Equality fields, 2. Sort fields, 3. Range fields',
                  '1. Range fields, 2. Sort fields, 3. Equality fields',
                  '1. Sort fields, 2. Range fields, 3. Equality fields',
                  'Alphabetical order'
                ],
                correctIndex: 0,
                topic: 'ESR Indexing Rule',
                explanation: 'Placing Equality fields first, followed by Sort fields, and finally Range fields enables MongoDB to satisfy queries and sorts directly from the index.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a TTL Auto-Expiring Index',
            difficulty: 'Beginner',
            problemStatement: 'Write the Mongoose schema index definition to auto-expire documents in `otpSchema` 300 seconds (5 minutes) after `createdAt`.',
            instructions: 'Use otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 }).',
            requirements: ['otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 })'],
            starterCode: `otpSchema.index({ createdAt: 1 }, {\n  // TODO: TTL option\n});`,
            solutionCode: `otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });`,
            hints: ['otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });']
          }
        },
        {
          lessonNumber: 11,
          title: 'Query Explain Plans (executionStats) & Index Coverage',
          description: 'Analyze explain output, totalDocsExamined vs nReturned, eliminate in-memory sorting, and achieve 100% covered queries.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Interpret `explain("executionStats")` metrics and execution stages',
            'Calculate the Index Efficiency Ratio (`nReturned / totalDocsExamined`)',
            'Achieve 100% Covered Queries (PROJECTION_COVERED) with zero disk reads'
          ],
          introduction: `Guessing query performance in production leads to performance degradation. Using MongoDB query explain plans reveals exactly how the query optimizer executed the query, how many documents were examined, and whether indexes were used.`,
          deepDiveSections: [
            {
              title: 'Key Metrics in executionStats',
              explanation: `Critical numbers to inspect in .explain("executionStats"):
1. nReturned: Number of documents that matched and were returned.
2. totalDocsExamined: Number of physical documents read from disk/cache. (Ideally equal to nReturned; if totalDocsExamined = 10000 and nReturned = 5, you have a critical indexing deficiency!).
3. totalKeysExamined: Number of B-Tree index entries traversed.
4. executionStages.stage: IXSCAN is good; COLLSCAN is bad; SORT indicates expensive in-memory sort.`,
              keyPoint: 'In an optimal query, totalDocsExamined equals nReturned, and totalKeysExamined closely matches nReturned.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Query Execution Stages',
            headers: ['Stage Name', 'Meaning', 'Performance Quality'],
            rows: [
              ['IXSCAN', 'Traversed a B-tree index', 'Excellent / Fast'],
              ['FETCH', 'Retrieved document from storage using index pointer', 'Normal'],
              ['PROJECTION_COVERED', 'All fields satisfied from index (Zero FETCH)', 'Maximum / Instantaneous'],
              ['SORT', 'Performs in-memory sort buffer (Exceeds 32MB throws error)', 'Poor / High CPU'],
              ['COLLSCAN', 'Full collection scan reading every document', 'Terrible / Unacceptable in production']
            ]
          },
          coreConcepts: ['Index Efficiency Ratio (`nReturned / totalDocsExamined`)', 'Covered queries (`PROJECTION_COVERED`)', 'In-memory 32MB sort limit'],
          syntax: `# Run query with detailed execution stats in mongosh
db.skills.find({ category: "DevOps" }).sort({ rating: -1 }).explain("executionStats")`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// A 100% Covered Query in Mongoose
// Given index: { slug: 1, name: 1 }
// By projecting ONLY indexed fields and suppressing _id (0), MongoDB never reads the document from disk!
const skill = await Skill.findOne(
  { slug: 'docker-containerization' },
  { slug: 1, name: 1, _id: 0 }
).lean();`,
              explanation: 'A fully covered query served 100% from index memory with 0 document disk reads.'
            }
          ],
          commonMistakes: ['Forgetting to exclude _id: 0 in projections when attempting to create a covered query, forcing a FETCH stage for _id'],
          bestPractices: ['Always suppress _id: 0 in projections when building covered queries for maximum throughput'],
          summary: `Explain plans provide concrete diagnostic proof of query efficiency and index coverage.`,
          resources: [{ title: 'Analyze Query Performance with Explain', url: 'https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg11_q1',
                question: 'What characterizes a 100% "Covered Query" in MongoDB?',
                options: [
                  'All queried fields and projected output fields exist inside the index, allowing MongoDB to return results with 0 document disk reads',
                  'The collection is encrypted with TLS',
                  'The database has 100% test coverage',
                  'The query runs on all 3 replica nodes simultaneously'
                ],
                correctIndex: 0,
                topic: 'Covered Queries',
                explanation: 'A covered query is satisfied entirely from index keys in RAM without needing a FETCH stage to read physical documents from disk.'
              }
            ]
          },
          practicalTask: {
            title: 'Write a Covered Query with Excluded _id',
            difficulty: 'Intermediate',
            problemStatement: 'Write a Mongoose `findOne` query on `User` filtering by `{ email: "test@zenscore.ai" }` that projects only `email` and `role` while suppressing `_id` to enable a covered query.',
            instructions: 'Pass projection { email: 1, role: 1, _id: 0 }.',
            requirements: ['User.findOne({ email: "test@zenscore.ai" }, { email: 1, role: 1, _id: 0 })'],
            starterCode: `await User.findOne({ email: 'test@zenscore.ai' }, {\n  // TODO: Projection\n});`,
            solutionCode: `await User.findOne({ email: 'test@zenscore.ai' }, { email: 1, role: 1, _id: 0 }).lean();`,
            hints: ['Pass { email: 1, role: 1, _id: 0 } as the projection object.']
          }
        },
        {
          lessonNumber: 12,
          title: 'Aggregation Framework: $match, $group, $project & $unwind',
          description: 'Build high-performance analytics pipelines using pipeline stages, memory limits (100MB RAM), and accumulator operators.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand pipeline execution flow and data stream transformation',
            'Master core aggregation stages ($match, $project, $group, $sort, $unwind, $limit)',
            'Utilize mathematical and array accumulators ($sum, $avg, $push, $addToSet)'
          ],
          introduction: `The MongoDB Aggregation Framework is an advanced data processing pipeline modeled on data processing pipelines. Documents pass through a multi-stage pipeline that transforms, filters, groups, and calculates aggregate metrics with high efficiency.`,
          deepDiveSections: [
            {
              title: 'Aggregation Pipeline Architecture & Memory Optimization',
              explanation: `Pipeline rules for high performance:
1. Filter Early ($match): Place $match and $sort at the very beginning of the pipeline so they can leverage B-Tree indexes!
2. Shrink Document Width ($project): Strip unnecessary fields before grouping to minimize memory overhead.
3. 100MB RAM Limit: Individual aggregation stages have a 100MB RAM buffer limit. If exceeded, enable { allowDiskUse: true }.`,
              keyPoint: 'Place $match at the start of the pipeline so MongoDB can use indexes to filter documents before processing.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: MapReduce (Deprecated) vs. Aggregation Pipeline',
            headers: ['Dimension', 'Legacy MapReduce', 'Aggregation Pipeline'],
            rows: [
              ['Execution Engine', 'Slow JavaScript interpreter execution', 'Native C++ optimized pipeline execution'],
              ['Speed', 'Slow (10x – 50x slower)', 'Lightning-fast native execution'],
              ['Index Utilization', 'Limited index usage', 'Seamlessly utilizes B-Tree indexes in early stages']
            ]
          },
          coreConcepts: ['Pipeline stage streaming', 'Array deconstruction with `$unwind`', 'Index utilization in early `$match` stages'],
          syntax: `// Aggregation Pipeline Syntax
const stats = await Order.aggregate([
  { $match: { status: "COMPLETED" } },
  { $group: { _id: "$customerId", totalSpent: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
]);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Unwinding tags to compute tag frequency analytics
const tagDistribution = await Skill.aggregate([
  { $match: { isPublished: true } },
  { $unwind: '$tags' },
  {
    $group: {
      _id: '$tags',
      skillCount: { $sum: 1 },
      avgDifficultyHours: { $avg: '$estimatedHours' }
    }
  },
  { $sort: { skillCount: -1 } }
]);`,
              explanation: 'Deconstructs tags array and computes average learning hours per skill tag.'
            }
          ],
          commonMistakes: ['Placing $match after $group or $unwind, which prevents MongoDB from using indexes and forces a full collection scan'],
          bestPractices: ['Always place $match as the very first stage in an aggregation pipeline'],
          summary: `The Aggregation Framework provides native C++ data pipelines for powerful analytical transformations.`,
          resources: [{ title: 'Aggregation Pipeline Reference', url: 'https://www.mongodb.com/docs/manual/core/aggregation-pipeline/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg12_q1',
                question: 'Why should `$match` stages always be placed as early as possible in an aggregation pipeline?',
                options: [
                  'To allow the query optimizer to use B-Tree indexes and drastically reduce the number of documents passed to subsequent stages',
                  'Because MongoDB syntax errors occur if $match is placed later',
                  'To convert numbers to floats',
                  'To delete unmatched documents permanently'
                ],
                correctIndex: 0,
                topic: 'Pipeline Optimization',
                explanation: 'Placing $match first allows index usage and filters out irrelevant documents early, minimizing CPU and RAM usage.'
              }
            ]
          },
          practicalTask: {
            title: 'Aggregate Average Hours by Category',
            difficulty: 'Intermediate',
            problemStatement: 'Write an aggregation pipeline that groups published skills (`{ isPublished: true }`) by `$category` and calculates `avgHours: { $avg: "$estimatedHours" }`.',
            instructions: 'Use $match followed by $group with $avg.',
            requirements: ['[{ $match: { isPublished: true } }, { $group: { _id: "$category", avgHours: { $avg: "$estimatedHours" } } }]'],
            starterCode: `const pipeline = [\n  // TODO: Stages\n];`,
            solutionCode: `const pipeline = [\n  { $match: { isPublished: true } },\n  { $group: { _id: '$category', avgHours: { $avg: '$estimatedHours' } } }\n];`,
            hints: ['[{ $match: { isPublished: true } }, { $group: { _id: "$category", avgHours: { $avg: "$estimatedHours" } } }]']
          }
        },
        {
          lessonNumber: 13,
          title: 'Advanced Aggregations: $lookup Joins, $facet & Graph Lookups',
          description: 'Master left outer joins with $lookup, multi-faceted search with $facet, and recursive hierarchical queries with $graphLookup.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Execute left outer joins across collections using `$lookup` and correlated subqueries',
            'Generate multi-faceted search filters and pagination metadata in a single pass with `$facet`',
            'Traverse recursive hierarchical data trees with `$graphLookup`'
          ],
          introduction: `Modern enterprise applications require multi-collection correlations and multi-faceted search dashboards. Advanced aggregation stages like $lookup, $facet, and $graphLookup enable SQL-style joins, recursive tree traversals, and multi-dimensional analytics in a single query.`,
          deepDiveSections: [
            {
              title: 'Multi-Faceted Search & Pagination with $facet',
              explanation: `The $facet stage processes multiple aggregation pipelines within a single stage on the same input documents:
$facet: {
  metadata: [{ $count: "total" }, { $addFields: { page: 1, totalPages: { $ceil: { $divide: ["$total", 20] } } } }],
  data: [{ $sort: { rating: -1 } }, { $skip: 0 }, { $limit: 20 }]
}
This returns both the paginated data AND total count metadata in a SINGLE database roundtrip!`,
              keyPoint: '$facet computes pagination counts, price range facets, and sorted records in a single database roundtrip.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Basic $lookup vs. Correlated Subquery $lookup',
            headers: ['Dimension', 'Basic $lookup (Equality Match)', 'Correlated Subquery $lookup (`let` + `pipeline`)'],
            rows: [
              ['Syntax', '`localField` / `foreignField` match', '`let` variable bindings + custom inner `pipeline`'],
              ['Inner Filtering', 'Fetches all foreign documents', 'Can apply `$match`, `$sort`, and `$limit` inside the join'],
              ['Use Case', 'Simple 1:1 or 1:N foreign key join', 'Joining only the top 3 latest orders per customer']
            ]
          },
          coreConcepts: ['Left outer joins with `$lookup`', 'Single-pass faceted pagination with `$facet`', 'Hierarchical tree traversal with `$graphLookup`'],
          syntax: `// Correlated Subquery $lookup
{
  $lookup: {
    from: "orders",
    let: { custId: "$_id" },
    pipeline: [
      { $match: { $expr: { $eq: ["$customerId", "$$custId"] } } },
      { $sort: { orderDate: -1 } },
      { $limit: 5 }
    ],
    as: "recentOrders"
  }
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Faceted search with pagination and category metrics
const searchResults = await Skill.aggregate([
  { $match: { isPublished: true, name: { $regex: 'react', $options: 'i' } } },
  {
    $facet: {
      totalCount: [{ $count: 'count' }],
      categories: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
      paginatedSkills: [{ $sort: { estimatedHours: 1 } }, { $skip: 0 }, { $limit: 10 }]
    }
  }
]);`,
              explanation: 'Computes total matching items, category distribution facets, and paginated rows in one pass.'
            }
          ],
          commonMistakes: ['Joining unindexed collections with $lookup, causing massive CPU spikes and severe query latency'],
          bestPractices: ['Always ensure the foreign collection has an index on the joined field before using $lookup'],
          summary: `Advanced aggregation stages unlock enterprise search dashboards, recursive tree modeling, and high-performance joins.`,
          resources: [{ title: 'MongoDB $facet and $lookup Guide', url: 'https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg13_q1',
                question: 'What is the primary benefit of using the `$facet` aggregation stage in an e-commerce or search application?',
                options: [
                  'It executes multiple independent analytical pipelines concurrently on the same input data, returning search results and filter counts in one roundtrip',
                  'It encrypts user passwords with SHA-256',
                  'It compresses database files by 50%',
                  'It converts MongoDB documents to XML'
                ],
                correctIndex: 0,
                topic: 'Faceted Aggregation',
                explanation: '$facet allows applications to compute pagination counts, category breakdown summaries, and item listings in a single query.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a $lookup Join Stage',
            difficulty: 'Intermediate',
            problemStatement: 'Write a `$lookup` stage joining the `reviews` collection where `_id` matches foreignField `skillId` and outputting as `skillReviews`.',
            instructions: 'Use from, localField: "_id", foreignField: "skillId", as: "skillReviews".',
            requirements: ['{ $lookup: { from: "reviews", localField: "_id", foreignField: "skillId", as: "skillReviews" } }'],
            starterCode: `const lookupStage = {\n  $lookup: {\n    // TODO: Configure join\n  }\n};`,
            solutionCode: `const lookupStage = {\n  $lookup: {\n    from: 'reviews',\n    localField: '_id',\n    foreignField: 'skillId',\n    as: 'skillReviews'\n  }\n};`,
            hints: ['from: "reviews", localField: "_id", foreignField: "skillId", as: "skillReviews"']
          }
        }
      ]
    },
    {
      title: 'Phase 5: Multi-Document Transactions & Scaling',
      order: 5,
      lessons: [
        {
          lessonNumber: 14,
          title: 'Multi-Document ACID Transactions & Two-Phase Commits',
          description: 'Implement distributed ACID transactions across multiple collections using client sessions and commitTransaction.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand ACID guarantees (Atomicity, Consistency, Isolation, Durability) in MongoDB 4.0+',
            'Implement multi-document transactions using `client.startSession()` and `withTransaction()`',
            'Handle transaction aborts and transient transaction error retries'
          ],
          introduction: `Single-document updates in MongoDB have always been atomic. With MongoDB 4.0+, multi-document ACID transactions allow multiple write operations across different collections to succeed or fail as a single atomic unit.`,
          deepDiveSections: [
            {
              title: 'Multi-Document Transaction Lifecycle',
              explanation: `How a distributed transaction works:
1. Start Session: const session = await mongoose.startSession().
2. Begin Transaction: session.startTransaction({ readConcern, writeConcern }).
3. Execute Operations: Pass { session } to all CRUD operations (e.g. deduct balance from Account A, credit balance to Account B).
4. Commit or Abort: If any step fails, call await session.abortTransaction(); if all succeed, call await session.commitTransaction().`,
              keyPoint: 'Transactions require a Replica Set or Sharded Cluster and must complete within the default 60-second limit.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Single Document Atomicity vs. Multi-Document Transactions',
            headers: ['Dimension', 'Single Document Atomic Update', 'Multi-Document ACID Transaction'],
            rows: [
              ['Scope', 'Within a single document / array', 'Across multiple collections and documents'],
              ['Latency Overhead', 'Minimal (~1 ms)', 'Higher (~5 ms – 20 ms due to lock management)'],
              ['Transaction Duration Limit', 'No limit', 'Strict 60-second execution window'],
              ['Best For', '95% of standard CRUD operations', 'Financial transfers, inventory checkout reservation']
            ]
          },
          coreConcepts: ['Client sessions (`startSession`)', 'ACID transaction boundary', 'Automated transaction retry helpers (`withTransaction`)'],
          syntax: `// Mongoose Multi-Document Transaction Pattern
const session = await mongoose.startSession();
session.startTransaction();
try {
  await User.updateOne({ _id: fromId }, { $inc: { balance: -100 } }, { session });
  await User.updateOne({ _id: toId }, { $inc: { balance: 100 } }, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
} finally {
  session.endSession();
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Financial Bank Transfer with Transaction
async function transferFunds(fromUserId, toUserId, amount) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const sender = await User.findById(fromUserId).session(session);
      if (sender.balance < amount) throw new Error('Insufficient funds');

      await User.findByIdAndUpdate(fromUserId, { $inc: { balance: -amount } }, { session });
      await User.findByIdAndUpdate(toUserId, { $inc: { balance: amount } }, { session });
      await TransactionAudit.create([{ from: fromUserId, to: toUserId, amount }], { session });
    });
    console.log('Transfer committed successfully');
  } finally {
    await session.endSession();
  }
}`,
              explanation: 'Uses withTransaction helper for automated transient retry management.'
            }
          ],
          commonMistakes: ['Forgetting to pass { session } into one of the database operations inside the transaction, causing it to execute outside the transaction boundary!'],
          bestPractices: ['Always use the session.withTransaction() helper to handle transient network retries automatically'],
          summary: `Multi-document ACID transactions provide bank-grade data consistency guarantees across multiple MongoDB collections.`,
          resources: [{ title: 'MongoDB Transactions Documentation', url: 'https://www.mongodb.com/docs/manual/core/transactions/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg14_q1',
                question: 'What happens if one operation fails inside a MongoDB multi-document ACID transaction when `abortTransaction()` is called?',
                options: [
                  'All modifications made during the transaction across all collections are rolled back, leaving data in its original state',
                  'Only the failed document is rolled back',
                  'The database deletes the affected collection',
                  'The server reboots'
                ],
                correctIndex: 0,
                topic: 'ACID Rollback',
                explanation: 'Atomicity guarantees that either all operations inside the transaction are committed together or none of them take effect.'
              }
            ]
          },
          practicalTask: {
            title: 'Start and End a Mongoose Session',
            difficulty: 'Intermediate',
            problemStatement: 'Write the try/finally block that starts a Mongoose session with `await mongoose.startSession()` and guarantees calling `session.endSession()` in the finally block.',
            instructions: 'Declare session, try block, finally with session.endSession().',
            requirements: ['const session = await mongoose.startSession()', 'finally { session.endSession(); }'],
            starterCode: `const session = await mongoose.startSession();\ntry {\n  // operations\n} finally {\n  // TODO: End session\n}`,
            solutionCode: `const session = await mongoose.startSession();\ntry {\n  // operations\n} finally {\n  session.endSession();\n}`,
            hints: ['session.endSession() inside finally block.']
          }
        },
        {
          lessonNumber: 15,
          title: 'Read/Write Concerns & Causal Consistency',
          description: 'Configure Write Concerns (w:1, w:majority), Read Concerns (local, majority, linearizable), and Read Preferences.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand Write Concerns (w:1, w:majority, j:true, wtimeout)',
            'Master Read Concerns (local, available, majority, linearizable, snapshot)',
            'Guarantee causal consistency across distributed read and write sessions'
          ],
          introduction: `In a distributed database, how do you know when a write is safely saved across server nodes? Write Concern and Read Concern levels allow developers to tune the exact balance between sub-millisecond latency and guaranteed multi-node durability.`,
          deepDiveSections: [
            {
              title: 'Write Concern Levels & Acknowledgments',
              explanation: `Write Concern parameters:
• w: 1 (Fast): Primary acknowledges write immediately; replicates to secondaries in background.
• w: "majority" (Safe): Acknowledges only after the write has been written to the majority (> 50%) of replica set nodes.
• j: true: Ensures the write is flushed to disk journal before acknowledging.
• wtimeout: 5000: Maximum time to wait for replica acknowledgment before returning an error.`,
              keyPoint: 'w: "majority" prevents data rollback if the primary server dies immediately after acknowledging a write.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Read Concern Levels',
            headers: ['Read Concern Level', 'Durability Guarantee', 'Latency'],
            rows: [
              ['local (Default)', 'Returns node\'s most recent data (May be rolled back if primary crashes)', 'Fastest'],
              ['majority', 'Returns data committed by a majority of nodes (Cannot be rolled back)', 'Balanced'],
              ['linearizable', 'Waits for all concurrent majority writes to complete (Real-time consistency)', 'Higher latency'],
              ['snapshot', 'Returns a point-in-time consistent snapshot (Used in transactions)', 'Consistent snapshot']
            ]
          },
          coreConcepts: ['Write concern quorum (`w: "majority"`)', 'Read concern majority vs linearizable', 'Causal consistency session guarantees'],
          syntax: `# Connection string with majority write concern
mongodb://host1,host2,host3/db?replicaSet=rs0&w=majority&wtimeoutMS=5000`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Enforcing causal consistency across sessions
const session = client.startSession({
  causalConsistency: true,
  defaultTransactionOptions: {
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' }
  }
});`,
              explanation: 'Guarantees that a user will always read their own writes even if reading from secondary replicas.'
            }
          ],
          commonMistakes: ['Using w: 1 on critical payment tables, which can lose confirmed payment records if the primary crashes before replication'],
          bestPractices: ['Use w: "majority" and readConcern: "majority" for financial, auth, and critical business records'],
          summary: `Configuring majority write concerns and causal consistency guarantees fault-tolerant distributed durability.`,
          resources: [{ title: 'MongoDB Write Concern Reference', url: 'https://www.mongodb.com/docs/manual/reference/write-concern/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mg15_q1',
                question: 'What does `w: "majority"` write concern guarantee during a write operation?',
                options: [
                  'The write has been committed to a majority of voting replica set nodes before the client receives acknowledgment',
                  'The write was approved by the majority of developers',
                  'All queries are converted to SQL',
                  'The database cache is emptied'
                ],
                correctIndex: 0,
                topic: 'Write Concerns',
                explanation: 'w: "majority" ensures that the write has been replicated to more than 50% of replica nodes, guaranteeing that the write will not be lost if the primary fails.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Majority Write Concern in Mongoose',
            difficulty: 'Beginner',
            problemStatement: 'Write the Mongoose schema options object setting `writeConcern: { w: "majority", wtimeout: 5000 }`.',
            instructions: 'Include writeConcern inside the schema options.',
            requirements: ['{ writeConcern: { w: "majority", wtimeout: 5000 } }'],
            starterCode: `const schema = new mongoose.Schema({ title: String }, {\n  // TODO: Schema options\n});`,
            solutionCode: `const schema = new mongoose.Schema({ title: String }, {\n  writeConcern: { w: 'majority', wtimeout: 5000 }\n});`,
            hints: ['{ writeConcern: { w: "majority", wtimeout: 5000 } }']
          }
        },
        {
          lessonNumber: 16,
          title: 'Horizontal Sharding: Shard Keys, Chunks & Balancer Mechanics',
          description: 'Scale databases beyond single-server limits with MongoDB Sharding, Mongos routers, shard keys, and range vs hash partitioning.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand MongoDB Sharding architecture (Mongos Routers, Config Servers, Shard Replicas)',
            'Evaluate Ranged Sharding vs Hashed Sharding strategies',
            'Select high-cardinality, high-frequency shard keys to prevent Jumbo Chunks and hotspotting'
          ],
          introduction: `When data storage grows into terabytes or write throughput exceeds what a single server can handle, Horizontal Sharding partitions data across multiple independent database clusters (shards).`,
          deepDiveSections: [
            {
              title: 'MongoDB Sharded Cluster Architecture',
              explanation: `A sharded cluster consists of three components:
1. Shard Nodes: Each shard is an independent 3-node Replica Set holding a subset of sharded data.
2. Config Servers: 3-node Replica Set holding cluster metadata, shard key routing tables, and chunk ranges.
3. Mongos Routers: Stateless query routers that accept client requests, look up chunk locations on config servers, and route queries directly to the target shard.`,
              keyPoint: 'Clients connect to stateless Mongos routers, which transparently route queries to the correct shard.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Ranged Sharding vs. Hashed Sharding',
            headers: ['Dimension', 'Ranged Sharding (`{ createdAt: 1 }`)', 'Hashed Sharding (`{ _id: "hashed" }`)'],
            rows: [
              ['Data Distribution', 'Groups similar values into contiguous chunks', 'Evenly distributes writes randomly across all shards'],
              ['Range Queries', 'Efficient (Routes to specific shard)', 'Scatter-gather (Queries all shards simultaneously)'],
              ['Write Hotspotting Risk', 'High (Monotonically increasing IDs hit single shard)', 'Zero (Uniform MD5 hash distribution across cluster)']
            ]
          },
          coreConcepts: ['Shard key cardinality and frequency', 'Hashed vs Ranged partitioning', 'Automatic chunk balancing'],
          syntax: `# Enable sharding on database and collection in mongosh
sh.enableSharding("zenscore_prod")
sh.shardCollection("zenscore_prod.users", { organizationId: 1, _id: "hashed" })`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Compound Shard Key strategy for multi-tenant SaaS
sh.shardCollection("zenscore_db.students", { "tenantId": 1, "studentId": "hashed" });`,
              explanation: 'Compound shard key combining multi-tenant isolation with uniform hash distribution.'
            }
          ],
          commonMistakes: ['Choosing a low-cardinality shard key (e.g. { country: 1 }), creating massive un-splittable "Jumbo Chunks"'],
          bestPractices: ['Choose a high-cardinality compound shard key that distributes write traffic while allowing targeted single-shard queries'],
          summary: `Horizontal sharding partitions terabytes of data across distributed clusters with automated balancing.`,
          resources: [{ title: 'MongoDB Sharding Guide', url: 'https://www.mongodb.com/docs/manual/sharding/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg16_q1',
                question: 'What is the primary danger of selecting a monotonically increasing field (like `createdAt` or auto-incrementing IDs) as a ranged shard key?',
                options: [
                  'All new write operations are routed to the single shard holding the maximum range, creating a severe write bottleneck (hotspotting)',
                  'The database automatically converts to SQL',
                  'It corrupts user passwords',
                  'It deletes old shards'
                ],
                correctIndex: 0,
                topic: 'Shard Key Hotspotting',
                explanation: 'Monotonically increasing values always fall into the newest chunk, overloading a single shard while other shards sit idle.'
              }
            ]
          },
          practicalTask: {
            title: 'Define Hashed Shard Collection Command',
            difficulty: 'Intermediate',
            problemStatement: 'Write the MongoDB shell command to shard collection `analytics.events` using a hashed shard key on `userId`.',
            instructions: 'Use sh.shardCollection("analytics.events", { userId: "hashed" }).',
            requirements: ['sh.shardCollection("analytics.events", { userId: "hashed" })'],
            starterCode: `sh.shardCollection(`,
            solutionCode: `sh.shardCollection('analytics.events', { userId: 'hashed' })`,
            hints: ['sh.shardCollection("analytics.events", { userId: "hashed" })']
          }
        }
      ]
    },
    {
      title: 'Phase 6: Security, Backup & Production Database Practices',
      order: 6,
      lessons: [
        {
          lessonNumber: 17,
          title: 'Authentication (SCRAM, X.509) & Role-Based Access Control',
          description: 'Secure MongoDB clusters with SCRAM-SHA-256 authentication, TLS/X.509 client certificates, and granular DB roles.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Configure SCRAM-SHA-256 password hashing authentication',
            'Enforce mutual TLS (mTLS) with X.509 client certificates',
            'Create least-privilege custom database roles with granular actions'
          ],
          introduction: `Leaving default MongoDB ports open without authentication has caused some of the largest data breaches in history. Hardening MongoDB requires enabling SCRAM-SHA-256 authentication, role-based database privileges, and network firewalls.`,
          deepDiveSections: [
            {
              title: 'SCRAM-SHA-256 Authentication Mechanism',
              explanation: `MongoDB uses Salted Challenge Response Authentication Mechanism (SCRAM):
1. Server never stores plaintext passwords; stores salted hashes computed with SHA-256 and PBKDF2.
2. During login, client and server exchange cryptographic challenges to prove knowledge of the password without sending the password over the network.`,
              keyPoint: 'Enable SCRAM-SHA-256 authentication and enforce authorization: enabled in mongod.conf.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: MongoDB Built-in Roles',
            headers: ['Role', 'Scope', 'Permissions'],
            rows: [
              ['readWrite', 'Specific database', 'Read and mutate collections within that database only'],
              ['dbAdmin', 'Specific database', 'Index creation, stats, schema maintenance (No data reads)'],
              ['userAdminAnyDatabase', 'Cluster-wide', 'Create and modify database users across all databases'],
              ['root', 'Cluster-wide', 'Full superuser administrative access across the entire cluster']
            ]
          },
          coreConcepts: ['SCRAM-SHA-256 challenge handshake', 'Least-privilege role assignment', 'Internal cluster keyfile authentication'],
          syntax: `# Create production application user with least privilege
use zenscore_prod
db.createUser({
  user: "zenscore_app",
  pwd: passwordPrompt(),
  roles: [{ role: "readWrite", db: "zenscore_prod" }]
})`,
          codeExamples: [
            {
              language: 'javascript',
              code: `# /etc/mongod.conf production security configuration
security:
  authorization: "enabled"
  keyFile: "/var/lib/mongodb/mongo-keyfile"
net:
  port: 27017
  bindIp: "127.0.0.1,10.0.1.5" # Never bind to 0.0.0.0 directly`,
              explanation: 'Production mongod.conf enabling authorization and internal cluster keyfile security.'
            }
          ],
          commonMistakes: ['Binding MongoDB to bindIp: 0.0.0.0 without enabling authorization: enabled in configuration'],
          bestPractices: ['Always enable authorization and create dedicated readWrite application users for each service'],
          summary: `Configuring SCRAM authentication and least-privilege roles prevents unauthorized database access.`,
          resources: [{ title: 'MongoDB Security Checklist', url: 'https://www.mongodb.com/docs/manual/administration/security-checklist/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg17_q1',
                question: 'Which built-in MongoDB role should be granted to a production web application backend user for its specific database?',
                options: [
                  'readWrite on that database',
                  'root across all databases',
                  'userAdminAnyDatabase',
                  'clusterAdmin'
                ],
                correctIndex: 0,
                topic: 'Least-Privilege Roles',
                explanation: 'The principle of least privilege dictates granting only readWrite on the application database, restricting access to other databases.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Least-Privilege Application User',
            difficulty: 'Beginner',
            problemStatement: 'Write the MongoDB shell command to create user `"app_service"` with role `"readWrite"` on database `"app_db"`.',
            instructions: 'Use db.createUser({ user: "app_service", pwd: "secretPassword123", roles: [{ role: "readWrite", db: "app_db" }] }).',
            requirements: ['db.createUser({ user: "app_service", pwd: "secretPassword123", roles: [{ role: "readWrite", db: "app_db" }] })'],
            starterCode: `db.createUser({\n  user: 'app_service',\n  // TODO: Add pwd and roles\n});`,
            solutionCode: `db.createUser({\n  user: 'app_service',\n  pwd: 'secretPassword123',\n  roles: [{ role: 'readWrite', db: 'app_db' }]\n});`,
            hints: ['user: "app_service", pwd: "...", roles: [{ role: "readWrite", db: "app_db" }]']
          }
        },
        {
          lessonNumber: 18,
          title: 'Encryption at Rest, In-Flight TLS & Network Peering',
          description: 'Configure WiredTiger AES-256 encryption at rest, TLS/SSL certificate encryption in flight, and VPC network peering.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Enable WiredTiger AES-256 Encryption at Rest with Key Management Services (AWS KMS)',
            'Enforce TLS 1.3 encryption for all client-to-server and inter-node network traffic',
            'Isolate MongoDB Atlas clusters via VPC Peering and AWS PrivateLink'
          ],
          introduction: `Enterprise compliance (HIPAA, SOC 2, GDPR) requires complete end-to-end data encryption. This includes Encrypting Data at Rest on physical disk drives, Encrypting Data in Flight across the network using TLS, and isolating database traffic via VPC Peering.`,
          deepDiveSections: [
            {
              title: 'WiredTiger Encryption at Rest & Key Management',
              explanation: `How Encryption at Rest protects data:
1. Master Key: Managed securely outside the database in AWS KMS or HashiCorp Vault.
2. Database Encryption Key (DEK): WiredTiger generates a local 256-bit AES key to encrypt BSON pages before writing to disk.
3. If physical hard drives are stolen from a datacenter, the raw BSON files cannot be decrypted without the KMS master key.`,
              keyPoint: 'Encryption at Rest protects physical storage drives; TLS protects data streams traveling across public networks.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Security in Flight vs. Security at Rest',
            headers: ['Security Layer', 'Technology', 'Threat Protected Against'],
            rows: [
              ['Encryption in Flight', 'TLS 1.3 / SSL Certificates', 'Packet sniffing, Man-in-the-Middle (MitM) wiretapping'],
              ['Encryption at Rest', 'WiredTiger AES-256 + AWS KMS', 'Physical disk drive theft, unencrypted disk snapshots'],
              ['VPC Network Peering', 'Private Cloud Subnet Routing', 'Public internet scanning, DDoS attacks']
            ]
          },
          coreConcepts: ['WiredTiger AES-256 encryption', 'TLS 1.3 connection enforcement', 'AWS VPC Peering / PrivateLink'],
          syntax: `# Enforce TLS in mongod.conf
net:
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/ssl/mongodb.pem
    CAFile: /etc/ssl/ca.pem`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Connecting via TLS with CA verification in Node.js
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  ssl: true,
  tlsCAFile: '/path/to/global-bundle.pem',
  retryWrites: true
});`,
              explanation: 'Secure TLS MongoDB connection with certificate authority verification.'
            }
          ],
          commonMistakes: ['Setting tlsAllowInvalidCertificates: true in production, which disables certificate verification and exposes connections to MitM attacks'],
          bestPractices: ['Always enforce requireTLS and configure private VPC Peering between backend servers and database clusters'],
          summary: `Combining WiredTiger AES-256 disk encryption, TLS 1.3 wire encryption, and VPC Peering satisfies strict compliance frameworks.`,
          resources: [{ title: 'MongoDB Encryption at Rest Guide', url: 'https://www.mongodb.com/docs/manual/core/security-encryption-at-rest/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg18_q1',
                question: 'What threat does WiredTiger Encryption at Rest protect against?',
                options: [
                  'Unauthorized access to raw data if physical hard drives or cloud disk snapshots are compromised',
                  'SQL injection in web forms',
                  'CSS styling bugs',
                  'Slow internet connections'
                ],
                correctIndex: 0,
                topic: 'Encryption at Rest',
                explanation: 'Encryption at rest ensures all database files, journals, and temporary files on disk are encrypted with AES-256.'
              }
            ]
          },
          practicalTask: {
            title: 'Enable TLS in MongoDB Connection URI',
            difficulty: 'Beginner',
            problemStatement: 'Add the query parameter to a MongoDB connection string to enforce TLS encryption (`tls=true`).',
            instructions: 'Append ?tls=true to the connection string.',
            requirements: ['mongodb://db.zenscore.internal:27017/prod?tls=true'],
            starterCode: `const URI = "mongodb://db.zenscore.internal:27017/prod";`,
            solutionCode: `const URI = "mongodb://db.zenscore.internal:27017/prod?tls=true";`,
            hints: ['mongodb://db.zenscore.internal:27017/prod?tls=true']
          }
        },
        {
          lessonNumber: 19,
          title: 'Backup Strategies (mongodump, Atlas Snapshots) & Disaster Recovery',
          description: 'Master binary backups with mongodump/mongorestore, Point-in-Time Recovery (PITR), and disaster recovery runbooks.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Execute live database exports and restorations using `mongodump` and `mongorestore`',
            'Configure automated Point-in-Time Recovery (PITR) with continuous oplog archiving',
            'Execute disaster recovery drills with Recovery Point Objective (RPO) and Recovery Time Objective (RTO)'
          ],
          introduction: `Data loss can occur from hardware failures, catastrophic datacenter fires, or accidental developer mistakes (e.g. executing db.users.deleteMany({})). Robust disaster recovery strategies ensure you can restore data to any point in time.`,
          deepDiveSections: [
            {
              title: 'Point-in-Time Recovery (PITR) Mechanics',
              explanation: `How Point-in-Time Recovery operates:
1. Daily Snapshots: Takes full consistent volume snapshots every 24 hours.
2. Continuous Oplog Backup: Archives the replica set oplog continuously in real-time.
3. Granular Restoration: To restore the database to 14:02:15 PM (just before an accidental drop command at 14:02:16 PM), the system restores the 12:00 PM snapshot and replays the oplog stream up to exactly 14:02:15 PM!`,
              keyPoint: 'Point-in-Time Recovery replays continuous oplog archives on top of disk snapshots to restore to the exact second.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: mongodump vs. Cloud Volume Snapshots',
            headers: ['Dimension', 'mongodump / mongorestore', 'Atlas Cloud Volume Snapshots'],
            rows: [
              ['Mechanism', 'Logical query scan exporting BSON files', 'Underlying cloud volume block-level storage snapshot'],
              ['Backup Speed', 'Slow on large DBs (Hours for 500GB)', 'Instantaneous (< 1 minute via AWS EBS snapshot)'],
              ['Point-in-Time Recovery', 'No (Manual replay required)', 'Yes (Automated continuous oplog replay)'],
              ['Best Use Case', 'Development seed exports, selective table migration', 'Production enterprise disaster recovery']
            ]
          },
          coreConcepts: ['Point-in-Time Recovery (PITR)', 'RPO (Recovery Point Objective) & RTO (Recovery Time Objective)', 'Binary `mongodump` with `--gzip --archive`'],
          syntax: `# Export compressed archive of a database
mongodump --uri="mongodb://localhost:27017/zenscore" --archive=backup.gz --gzip

# Restore compressed archive
mongorestore --uri="mongodb://localhost:27017/zenscore" --archive=backup.gz --gzip --drop`,
          codeExamples: [
            {
              language: 'bash',
              code: `# Automated daily backup script with S3 upload
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="/tmp/zenscore_\${DATE}.gz"

echo "Creating compressed binary dump..."
mongodump --uri="$MONGODB_URI" --archive="$BACKUP_FILE" --gzip

echo "Uploading to AWS S3 bucket..."
aws s3 cp "$BACKUP_FILE" "s3://zenscore-backups/database/daily/"

rm -f "$BACKUP_FILE"
echo "Backup complete."`,
              explanation: 'Automated shell script executing mongodump with S3 cloud archival.'
            }
          ],
          commonMistakes: ['Never testing database restoration drills, discovering corrupted backup files during a real emergency'],
          bestPractices: ['Automate continuous PITR in MongoDB Atlas and perform monthly restoration fire drills'],
          summary: `Continuous Point-in-Time Recovery and automated cloud volume snapshots guarantee business continuity.`,
          resources: [{ title: 'MongoDB Backup Methods', url: 'https://www.mongodb.com/docs/manual/core/backups/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg19_q1',
                question: 'How does Point-in-Time Recovery (PITR) restore a database to a specific second before an accidental deletion occurred?',
                options: [
                  'By restoring the nearest full snapshot and replaying the continuous oplog stream up to that exact timestamp',
                  'By running git revert on the database',
                  'By asking all users to re-enter their data',
                  'By undoing transactions with Ctrl+Z'
                ],
                correctIndex: 0,
                topic: 'Point-in-Time Recovery',
                explanation: 'PITR combines a baseline snapshot with real-time continuous oplog replay, allowing restoration to any exact second.'
              }
            ]
          },
          practicalTask: {
            title: 'Write a mongodump Archive Command',
            difficulty: 'Beginner',
            problemStatement: 'Write the `mongodump` CLI command to export database `zenscore_db` from `localhost:27017` to a compressed archive file `db_backup.gz`.',
            instructions: 'Use mongodump --db zenscore_db --archive=db_backup.gz --gzip.',
            requirements: ['mongodump --db zenscore_db --archive=db_backup.gz --gzip'],
            starterCode: `mongodump --db zenscore_db `,
            solutionCode: `mongodump --db zenscore_db --archive=db_backup.gz --gzip`,
            hints: ['mongodump --db zenscore_db --archive=db_backup.gz --gzip']
          }
        }
      ]
    },
    {
      title: 'Phase 7: Real-World Database Capstone',
      order: 7,
      lessons: [
        {
          lessonNumber: 20,
          title: 'High-Throughput E-Commerce Schema & Inventory Locking',
          description: 'Design a flash-sale e-commerce schema with atomic stock decrement ($gte stock checks) and two-phase reservations.',
          estimatedMinutes: 40,
          learningObjectives: [
            'Design a high-concurrency e-commerce database schema handling flash-sale spikes',
            'Prevent overselling using atomic conditional updates (`stock: { $gte: quantity }`)',
            'Implement temporary reservation locks with TTL auto-release'
          ],
          introduction: `During flash sales (like Black Friday), thousands of users attempt to purchase the same inventory item simultaneously. If your database allows overselling, you suffer inventory deficits and angry customers. We will design an inventory reservation engine with atomic conditional updates.`,
          deepDiveSections: [
            {
              title: 'Preventing Overselling with Conditional Atomic Updates',
              explanation: `The atomic pattern to prevent negative inventory:
const result = await Product.updateOne(
  { _id: productId, stock: { $gte: requestedQty } },
  { $inc: { stock: -requestedQty } }
);

if (result.matchedCount === 0) {
  throw new Error("Item out of stock!");
}
Because the query condition stock: { $gte: requestedQty } and the mutation $inc: { stock: -requestedQty } execute atomically inside WiredTiger, overselling is physically impossible!`,
              keyPoint: 'Conditional atomic updates ({ stock: { $gte: qty } }) eliminate race conditions without heavy transaction overhead.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Pessimistic Table Lock vs. Atomic Conditional Decrement',
            headers: ['Mechanism', 'Pessimistic Table Lock', 'Atomic Conditional Decrement'],
            rows: [
              ['Throughput', 'Low (Queues all buyers in a single-file line)', 'Maximum (~50,000 requests/sec across memory)'],
              ['Deadlock Risk', 'High risk of deadlock cascades', 'Zero deadlock risk'],
              ['Complexity', 'Complex distributed lock manager', 'Single elegant MongoDB update query']
            ]
          },
          coreConcepts: ['Conditional atomic inventory locking', 'TTL inventory reservations', 'Flash-sale schema patterns'],
          syntax: `// Atomic stock reservation
const updated = await Product.updateOne(
  { _id: productId, stock: { $gte: qty } },
  { $inc: { stock: -qty } }
);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Flash-Sale Checkout Reservation Service
async function reserveInventory(userId, productId, qty) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const res = await Product.updateOne(
        { _id: productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { session }
      );
      if (res.matchedCount === 0) throw new Error('Sold out');

      await Reservation.create([{
        user: userId,
        product: productId,
        quantity: qty,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }], { session });
    });
    return { success: true };
  } finally {
    session.endSession();
  }
}`,
              explanation: 'Atomic inventory decrement combined with TTL reservation records.'
            }
          ],
          commonMistakes: ['Checking product.stock >= qty in memory before sending a $set query, creating a classic Time-of-Check to Time-of-Use (TOCTOU) race condition'],
          bestPractices: ['Always include the condition ({ stock: { $gte: qty } }) directly in the database update query filter'],
          summary: `Conditional atomic updates provide lightning-fast inventory locking resilient to flash-sale traffic surges.`,
          resources: [{ title: 'MongoDB High-Throughput E-Commerce Patterns', url: 'https://www.mongodb.com/industries/retail', provider: 'MongoDB.com', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mg20_q1',
                question: 'Why does `{ stock: { $gte: quantity } }, { $inc: { stock: -quantity } }` prevent inventory overselling during high concurrency?',
                options: [
                  'Because the check and decrement occur atomically in a single operation inside the storage engine, preventing other threads from seeing intermediate states',
                  'Because it locks the entire operating system',
                  'Because it converts inventory to a string',
                  'Because it requires client-side confirmation'
                ],
                correctIndex: 0,
                topic: 'Atomic Inventory Decrement',
                explanation: 'Atomic execution ensures that the condition evaluation and stock decrement occur together without interruption from concurrent operations.'
              }
            ]
          },
          practicalTask: {
            title: 'Write an Atomic Stock Decrement Query',
            difficulty: 'Intermediate',
            problemStatement: 'Write the `Product.updateOne` call that atomically decrements `stock` by `2` only if `_id: prodId` and `stock: { $gte: 2 }`.',
            instructions: 'Use filter { _id: prodId, stock: { $gte: 2 } } and update { $inc: { stock: -2 } }.',
            requirements: ['Product.updateOne({ _id: prodId, stock: { $gte: 2 } }, { $inc: { stock: -2 } })'],
            starterCode: `await Product.updateOne({\n  _id: prodId,\n  // TODO: Condition\n}, {\n  // TODO: Decrement\n});`,
            solutionCode: `await Product.updateOne({\n  _id: prodId,\n  stock: { $gte: 2 }\n}, {\n  $inc: { stock: -2 }\n});`,
            hints: ['filter: { _id: prodId, stock: { $gte: 2 } }, update: { $inc: { stock: -2 } }']
          }
        },
        {
          lessonNumber: 21,
          title: 'Real-Time Analytics Pipeline & Time-Series Collections',
          description: 'Capstone project: Build an IoT telemetry analytics pipeline using MongoDB 5.0 Time-Series collections, bucketing, and window functions.',
          estimatedMinutes: 45,
          learningObjectives: [
            'Create specialized Time-Series collections (`timeseries: { timeField, metaField }`)',
            'Understand internal column-oriented compression and bucket storage',
            'Compute rolling moving averages and cumulative sums using `$setWindowFields`'
          ],
          introduction: `Congratulations on reaching the final capstone lesson of MongoDB & Database Architecture! In this lesson, we will build a real-time analytics pipeline using MongoDB Time-Series Collections. We will utilize native columnar compression and window functions to compute rolling moving averages over millions of data points.`,
          deepDiveSections: [
            {
              title: 'MongoDB Time-Series Collections & Bucketing',
              explanation: `MongoDB Time-Series collections optimize sequential timestamp data:
1. Columnar Storage: Instead of storing individual BSON documents for every ping, MongoDB automatically groups sequential measurements into columnar compressed buckets.
2. 90% Compression: Compresses disk footprint by up to 90% using delta-of-delta and zstd compression.
3. Fast Window Analytics: The $setWindowFields aggregation stage computes moving averages, exponential smoothing, and trendlines directly in database memory.`,
              keyPoint: 'Time-Series collections organize data into compressed columnar buckets, providing 10x faster query speeds.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Standard Collection vs. Time-Series Collection',
            headers: ['Dimension', 'Standard MongoDB Collection', 'Time-Series Collection (MongoDB 5.0+)'],
            rows: [
              ['Storage Format', 'Individual row-oriented BSON documents', 'Columnar compressed buckets per time window'],
              ['Disk Storage Footprint', '100 GB for 100M telemetry events', '12 GB (Up to 90% disk compression)'],
              ['Query Speed', 'Scans thousands of documents', 'Scans compact columnar blocks with pre-calculated min/max'],
              ['Built-in Expiration', 'Requires manual TTL index', 'Native expireAfterSeconds built into collection definition']
            ]
          },
          coreConcepts: ['Time-Series collection architecture (`timeField`, `metaField`)', 'Columnar bucketing compression', 'Window functions (`$setWindowFields`)'],
          syntax: `# Create a Time-Series collection in mongosh
db.createCollection("sensor_telemetry", {
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "seconds"
  },
  expireAfterSeconds: 2592000
})`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Rolling 1-hour Moving Average using $setWindowFields
const movingAvg = await db.collection('sensor_telemetry').aggregate([
  {
    $setWindowFields: {
      partitionBy: "$metadata.sensorId",
      sortBy: { timestamp: 1 },
      output: {
        rollingAvgTemp: {
          $avg: "$temperature",
          window: { range: [-1, "current"], unit: "hour" }
        }
      }
    }
  }
]).toArray();`,
              explanation: 'Computes a rolling 1-hour average temperature per sensor using $setWindowFields.'
            }
          ],
          commonMistakes: ['Using standard collections for millions of daily sensor metrics instead of specialized Time-Series collections'],
          bestPractices: ['Always specify a clean metaField (e.g. { sensorId, location }) for optimal time-series bucket grouping'],
          summary: `You have mastered MongoDB & Database Architecture from storage engines and replica sets to distributed sharding and real-time time-series analytics!`,
          resources: [{ title: 'MongoDB Time-Series Collections Guide', url: 'https://www.mongodb.com/docs/manual/core/timeseries-collections/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'mg21_q1',
                question: 'What are the two mandatory configuration fields required when creating a MongoDB Time-Series collection?',
                options: [
                  'timeField and metaField',
                  'userId and password',
                  'title and category',
                  'primaryKey and foreignKey'
                ],
                correctIndex: 0,
                topic: 'Time-Series Collections',
                explanation: 'Time-series collections require timeField (the timestamp property) and optionally metaField (metadata identifying the sensor or entity) to organize columnar buckets.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Time-Series Collection',
            difficulty: 'Intermediate',
            problemStatement: 'Write the MongoDB command to create a time-series collection `"telemetry"` with `timeField: "recordedAt"` and `metaField: "deviceInfo"`.',
            instructions: 'Use db.createCollection("telemetry", { timeseries: { timeField: "recordedAt", metaField: "deviceInfo" } }).',
            requirements: ['db.createCollection("telemetry", { timeseries: { timeField: "recordedAt", metaField: "deviceInfo" } })'],
            starterCode: `db.createCollection('telemetry', {\n  // TODO: Time-series options\n});`,
            solutionCode: `db.createCollection('telemetry', {\n  timeseries: {\n    timeField: 'recordedAt',\n    metaField: 'deviceInfo'\n  }\n});`,
            hints: ['timeseries: { timeField: "recordedAt", metaField: "deviceInfo" }']
          }
        }
      ]
    }
  ]
}

module.exports = { mongoCurriculum }
