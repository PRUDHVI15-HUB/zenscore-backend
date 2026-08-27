/**
 * Node.js & Express Microservices Master Curriculum
 * 7 Phases, 21 Comprehensive Engineering Lessons
 */

const nodeCurriculum = {
  title: 'Node.js & Express Microservices',
  category: 'Backend Development',
  description: 'Master Node.js runtime internals, asynchronous event loops, Express REST microservices, Redis caching, gRPC, message queues, and cloud backend engineering.',
  modules: [
    {
      title: 'Phase 1: Node.js Runtime & Asynchronous Internals',
      order: 1,
      lessons: [
        {
          lessonNumber: 1,
          title: 'Node.js Architecture: V8 Engine, libuv & Thread Pool',
          description: 'Explore the V8 engine, libuv C library, UV_THREADPOOL_SIZE, DNS lookups, crypto hashing, and file system I/O.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand how V8 executes JavaScript while libuv handles system I/O',
            'Configure the libuv worker thread pool via UV_THREADPOOL_SIZE',
            'Differentiate OS asynchronous kernel polling (epoll) from worker thread offloading'
          ],
          introduction: `Node.js is an event-driven JavaScript runtime built on Chrome's V8 engine and the libuv C++ library. While JavaScript execution is single-threaded, libuv provides a multi-threaded worker pool to handle blocking tasks like disk I/O, DNS queries, and cryptographic operations without blocking the main event loop.`,
          deepDiveSections: [
            {
              title: 'Libuv Thread Pool & UV_THREADPOOL_SIZE',
              explanation: `How libuv handles different types of I/O:
1. Network I/O (Sockets, HTTP): Handled directly by the OS kernel non-blocking mechanisms (epoll on Linux, kqueue on macOS, IOCP on Windows). Requires 0 threads from the thread pool.
2. File System, DNS & Crypto (fs.readFile, crypto.pbkdf2): Offloaded to the internal libuv worker thread pool (default size: 4 threads).
If you run 8 heavy bcrypt password hashes concurrently on a default Node server, 4 will execute immediately while 4 will queue up until threads become free.`,
              keyPoint: 'Network I/O is handled by kernel epoll; File system and crypto tasks run on the libuv thread pool.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Main Thread vs. libuv Worker Pool',
            headers: ['Workload Type', 'Execution Target', 'Threading Model'],
            rows: [
              ['JavaScript Logic & App Code', 'V8 Main Thread', 'Single-threaded event loop'],
              ['Network TCP / HTTP Sockets', 'OS Kernel (epoll/kqueue)', 'Non-blocking kernel polling (0 worker threads)'],
              ['File I/O & Cryptography', 'libuv Thread Pool', 'Multi-threaded (Default: 4 threads, configurable up to 1024)']
            ]
          },
          coreConcepts: ['V8 execution engine', 'libuv worker thread pool (`UV_THREADPOOL_SIZE`)', 'OS kernel I/O multiplexing'],
          syntax: `# Configure thread pool before launching Node
UV_THREADPOOL_SIZE=16 node server.js`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Demonstrating libuv thread pool parallelism with crypto
const crypto = require('crypto');
const start = Date.now();

for (let i = 0; i < 4; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    console.log(\`Hash \${i + 1} completed in: \${Date.now() - start}ms\`);
  });
}`,
              explanation: 'Runs 4 crypto hashes concurrently utilizing the 4 default libuv worker threads.'
            }
          ],
          commonMistakes: ['Running heavy CPU calculations (e.g. image processing) on the main thread, freezing the server for all connected clients'],
          bestPractices: ['Offload CPU-bound calculations to Node.js Worker Threads (`worker_threads`) or dedicated microservices'],
          summary: `Node.js achieves high concurrency by combining a single-threaded event loop with a multi-threaded libuv C worker pool.`,
          resources: [{ title: 'Node.js libuv Architecture Guide', url: 'https://nodejs.org/en/docs/guides/dont-block-the-event-loop', provider: 'Nodejs.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd1_q1',
                question: 'Which environment variable is used to increase the default size of Node.js internal libuv worker thread pool?',
                options: [
                  'UV_THREADPOOL_SIZE',
                  'NODE_THREADS_COUNT',
                  'V8_MAX_THREADS',
                  'LIBUV_WORKERS'
                ],
                correctIndex: 0,
                topic: 'libuv Configuration',
                explanation: '`UV_THREADPOOL_SIZE` configures the number of worker threads allocated by libuv (default: 4, maximum: 1024).'
              }
            ]
          },
          practicalTask: {
            title: 'Inspect Process Platform and Architecture',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `getSystemInfo()` that returns an object containing `platform: process.platform` and `arch: process.arch`.',
            instructions: 'Return an object with platform and arch from process.',
            requirements: ['return { platform: process.platform, arch: process.arch }'],
            starterCode: `function getSystemInfo() {\n  // TODO: Return system info\n}`,
            solutionCode: `function getSystemInfo() {\n  return { platform: process.platform, arch: process.arch };\n}`,
            hints: ['return { platform: process.platform, arch: process.arch };']
          }
        },
        {
          lessonNumber: 2,
          title: 'Event Loop Deep Dive: Timers, Poll, Check & Close Phases',
          description: 'Master the 6 micro-phases of the libuv event loop, process.nextTick vs setImmediate, and unblocking the event loop.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master the order of operations in the 6 Event Loop phases',
            'Understand the execution priority of `process.nextTick()` vs `setImmediate()`',
            'Diagnose and prevent Event Loop Starvation'
          ],
          introduction: `To master backend performance in Node.js, you must understand the exact lifecycle of the libuv Event Loop. The loop cycles through 6 distinct phases on every tick, processing timers, kernel I/O, and immediate callbacks in a strict order.`,
          deepDiveSections: [
            {
              title: 'process.nextTick() vs. setImmediate() Priority',
              explanation: `The difference in execution timing:
• \`process.nextTick()\`: NOT part of the libuv event loop phases. It runs immediately after the current operation finishes, before the event loop continues to ANY phase. Recursive \`process.nextTick()\` calls will completely freeze the event loop (Starvation)!
• \`setImmediate()\`: Executes specifically in the libuv **Check** phase (after the Poll I/O phase).
• \`setTimeout(cb, 0)\`: Executes in the **Timers** phase.`,
              keyPoint: 'process.nextTick fires immediately before the event loop advances to the next phase; setImmediate fires in the Check phase.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: process.nextTick vs. setImmediate vs. setTimeout',
            headers: ['API', 'Execution Phase', 'Priority', 'Starvation Risk'],
            rows: [
              ['process.nextTick', 'Microtask queue (Between loop phases)', 'Highest (Preempts all phases)', 'High if called recursively'],
              ['Promise.then', 'Microtask queue (After nextTick queue)', 'Very High', 'High if infinite chaining'],
              ['setImmediate', 'libuv Check phase', 'Normal (Runs after I/O poll)', 'None (Safe for cooperative multitasking)'],
              ['setTimeout(..., 0)', 'libuv Timers phase', 'Normal (Requires timer threshold check)', 'None']
            ]
          },
          coreConcepts: ['Event loop phase transitions', 'Microtask queue draining', 'Cooperative multitasking with `setImmediate`'],
          syntax: `// Scheduling microtasks vs immediates
process.nextTick(() => console.log('1. nextTick (Immediate)'));
setImmediate(() => console.log('3. setImmediate (Check phase)'));
setTimeout(() => console.log('2. setTimeout (Timers phase)'), 0);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Breaking up heavy synchronous loops with setImmediate
function processLargeBatch(items, index = 0) {
  const chunkSize = 1000;
  const chunk = items.slice(index, index + chunkSize);
  
  for (const item of chunk) {
    // Process item
  }

  if (index + chunkSize < items.length) {
    // Yield execution to allow I/O and HTTP requests to be processed!
    setImmediate(() => processLargeBatch(items, index + chunkSize));
  }
}`,
              explanation: 'Prevents event loop lag by chunking large loops and yielding to the event loop via setImmediate.'
            }
          ],
          commonMistakes: ['Calling `process.nextTick()` recursively inside an async queue, starving all incoming HTTP connections'],
          bestPractices: ['Use `setImmediate()` to yield control back to the event loop during heavy batch processing'],
          summary: `The Event Loop coordinates asynchronous execution; understanding phase priorities prevents starvation and latency spikes.`,
          resources: [{ title: 'The Node.js Event Loop, Timers, and process.nextTick()', url: 'https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick', provider: 'Nodejs.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd2_q1',
                question: 'Which function executes its callback in the "Check" phase of the libuv event loop, immediately after I/O polling?',
                options: [
                  'setImmediate()',
                  'setTimeout()',
                  'process.nextTick()',
                  'setInterval()'
                ],
                correctIndex: 0,
                topic: 'Event Loop Check Phase',
                explanation: '`setImmediate()` is specifically designed to execute callbacks in the Check phase right after I/O events are polled.'
              }
            ]
          },
          practicalTask: {
            title: 'Schedule a Check Phase Callback',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `deferExecution(cb)` that schedules `cb` to run in the Check phase of the Event Loop using `setImmediate`.',
            instructions: 'Use setImmediate(cb).',
            requirements: ['setImmediate(cb)'],
            starterCode: `function deferExecution(cb) {\n  // TODO: Schedule\n}`,
            solutionCode: `function deferExecution(cb) {\n  setImmediate(cb);\n}`,
            hints: ['setImmediate(cb);']
          }
        },
        {
          lessonNumber: 3,
          title: 'Node.js Buffers, Streams & Pipeline Processing',
          description: 'Master raw binary Buffers, Readable, Writable, Transform streams, backpressure management, and stream.pipeline.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Manipulate binary byte buffers using Buffer.from, Buffer.alloc, and byte encoding',
            'Master the 4 stream types (Readable, Writable, Duplex, Transform)',
            'Handle stream backpressure and prevent memory exhaustion using `stream.pipeline`'
          ],
          introduction: `Loading a 2GB file directly into memory using \`fs.readFile\` will instantly crash a Node.js process due to V8 heap limits. Streams allow Node.js to read and transform massive datasets in small, sequential chunks with negligible memory consumption.`,
          deepDiveSections: [
            {
              title: 'Stream Backpressure & stream.pipeline',
              explanation: `When reading from a fast source (e.g. SSD disk) and writing to a slow destination (e.g. 3G network connection):
• If unhandled, data accumulates in RAM until memory is exhausted.
• Backpressure: When the internal buffer is full, \`stream.write()\` returns \`false\`. The readable stream pauses until the writable stream emits \`drain\`.
• \`stream.pipeline()\`: Automatically manages backpressure, cleans up file descriptors, and properly forwards errors without leaking memory!`,
              keyPoint: 'Always use stream.pipeline() over stream.pipe() for automated error handling and resource cleanup.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Buffer Loading vs. Stream Processing',
            headers: ['Metric', 'fs.readFile (Buffer in Memory)', 'fs.createReadStream (Streaming)'],
            rows: [
              ['Memory Footprint', 'Proportional to full file size (2GB file = 2GB RAM)', 'Constant (~64 KB chunk buffer regardless of file size)'],
              ['Time to First Byte', 'Waits for entire file to load into RAM', 'Streams first byte to client in milliseconds'],
              ['Max File Size', 'Limited by V8 heap size (~1.4 GB)', 'Unlimited (Terabytes of data processed safely)']
            ]
          },
          coreConcepts: ['Binary Buffers in V8', 'Backpressure and drain events', '`stream.pipeline` with promises'],
          syntax: `// Safe Stream Pipeline in Node.js
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

await pipeline(
  fs.createReadStream('large-file.csv'),
  zlib.createGzip(),
  fs.createWriteStream('large-file.csv.gz')
);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Custom Transform Stream for CSV to JSON parsing
const { Transform } = require('stream');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}`,
              explanation: 'A custom Transform stream converting incoming binary chunks to uppercase text on the fly.'
            }
          ],
          commonMistakes: ['Using `readable.pipe(writable)` without attaching error handlers to both streams, causing unhandled error crashes'],
          bestPractices: ['Always use `stream.pipeline` from `stream/promises` with async/await for robust stream error propagation'],
          summary: `Streams process continuous data streams chunk-by-chunk with constant low memory usage and automatic backpressure.`,
          resources: [{ title: 'Node.js Streams Handbook', url: 'https://nodejs.org/api/stream.html', provider: 'Nodejs.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd3_q1',
                question: 'Why is `stream.pipeline()` preferred over `readable.pipe(writable)` in production Node.js applications?',
                options: [
                  '`pipeline()` properly forwards errors from all streams in the chain and automatically cleans up file descriptors and memory',
                  '`pipeline()` encrypts files with AES-256',
                  '`pipeline()` runs on the GPU',
                  'There is no difference'
                ],
                correctIndex: 0,
                topic: 'Stream Pipeline Safety',
                explanation: '`stream.pipeline()` ensures that if any stream in the pipeline encounters an error or is destroyed, all streams are closed cleanly without resource leaks.'
              }
            ]
          },
          practicalTask: {
            title: 'Allocate and Fill a Binary Buffer',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `createZeroBuffer(size)` that allocates a zero-filled Buffer of `size` bytes using `Buffer.alloc(size)`.',
            instructions: 'Use Buffer.alloc(size).',
            requirements: ['return Buffer.alloc(size)'],
            starterCode: `function createZeroBuffer(size) {\n  // TODO: Allocate buffer\n}`,
            solutionCode: `function createZeroBuffer(size) {\n  return Buffer.alloc(size);\n}`,
            hints: ['return Buffer.alloc(size);']
          }
        }
      ]
    },
    {
      title: 'Phase 2: Express REST API Engineering',
      order: 2,
      lessons: [
        {
          lessonNumber: 4,
          title: 'Express Architecture & The Middleware Chain',
          description: 'Deep dive into Express router internals, middleware pipelines, req/res lifecycle, and sub-app mounting.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand Express internal middleware layer stack (`app._router.stack`)',
            'Mount sub-applications and modular routers with prefix routing',
            'Handle response lifecycles and avoid "Cannot set headers after they are sent" errors'
          ],
          introduction: `Express is a minimalist web framework designed around a sequential middleware stack. Understanding how Express routes requests through its internal layer stack allows engineers to build modular, maintainable microservice architectures.`,
          deepDiveSections: [
            {
              title: 'The Express Middleware Stack & "Headers Already Sent"',
              explanation: `Inside Express, every \`app.use()\` and \`router.get()\` pushes a Layer object onto an internal array.
When a request arrives, Express iterates through the stack.
If your code calls \`res.json()\` and then subsequently calls \`next()\` or another \`res.send()\`:
Express attempts to write HTTP headers to the socket a second time, throwing:
\`ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client.\`
Rule: ALWAYS return after sending a response (\`return res.status(200).json(...)\`).`,
              keyPoint: 'Always prefix response methods with return (return res.json(...)) to prevent double-response header exceptions.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Application Middleware vs. Router Middleware vs. Error Middleware',
            headers: ['Type', 'Signature', 'Scope', 'Trigger'],
            rows: [
              ['Application Middleware', '`(req, res, next)`', 'Global across all routes', 'Every incoming request'],
              ['Router Middleware', '`(req, res, next)`', 'Scoped to specific path prefix (e.g. `/api/v1/auth`)', 'Matching route requests only'],
              ['Error Middleware', '`(err, req, res, next)`', 'Global error catcher', 'When an exception is thrown or `next(err)` is called']
            ]
          },
          coreConcepts: ['Middleware execution stack', 'Sub-app mounting with `app.use("/api/v1", router)`', 'Atomic response sending'],
          syntax: `// Mounting modular routers in Express
const app = express();
app.use('/api/v1/skills', require('./routes/skillsRouter'));
app.use('/api/v1/users', require('./routes/usersRouter'));`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Request Timing Middleware
const requestTimer = (req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const ms = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
    console.log(\`[\${req.method}] \${req.originalUrl} - \${res.statusCode} (\${ms}ms)\`);
  });
  next();
};`,
              explanation: 'High-precision request latency logging using process.hrtime().'
            }
          ],
          commonMistakes: ['Forgetting `return` before `res.status().json()`, leading to subtle runtime headers already sent crashes'],
          bestPractices: ['Always write `return res.status(...).json(...)` in controller handlers'],
          summary: `Express executes a sequential middleware pipeline; disciplined return statements guarantee clean request lifecycles.`,
          resources: [{ title: 'Express.js Routing Guide', url: 'https://expressjs.com/en/guide/routing.html', provider: 'Expressjs.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'nd4_q1',
                question: 'What causes the error `ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client` in Express?',
                options: [
                  'Attempting to send an HTTP response (e.g. res.json) when a response has already been sent for this request',
                  'Running Express on port 80 without root permissions',
                  'Using JSON instead of XML',
                  'A syntax error in package.json'
                ],
                correctIndex: 0,
                topic: 'Express Response Lifecycle',
                explanation: 'Once HTTP headers and body are written to the network socket, sending another response throws ERR_HTTP_HEADERS_SENT.'
              }
            ]
          },
          practicalTask: {
            title: 'Mount a Sub-Router in Express',
            difficulty: 'Beginner',
            problemStatement: 'Write the Express statement to mount `skillsRouter` under the prefix `"/api/v1/skills"`.',
            instructions: 'Use app.use("/api/v1/skills", skillsRouter).',
            requirements: ['app.use("/api/v1/skills", skillsRouter)'],
            starterCode: `app.use(`,
            solutionCode: `app.use('/api/v1/skills', skillsRouter);`,
            hints: ['app.use("/api/v1/skills", skillsRouter);']
          }
        },
        {
          lessonNumber: 5,
          title: 'REST API Best Practices & HATEOAS Principles',
          description: 'Design enterprise REST APIs with semantic status codes, URL versioning, filtering, sorting, cursor pagination, and HATEOAS links.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement URL-based API versioning (`/api/v1/` vs `/api/v2/`)',
            'Build high-performance Cursor-Based Pagination instead of offset pagination',
            'Integrate HATEOAS hypermedia links in JSON API responses'
          ],
          introduction: `Designing production APIs requires adhering to established REST standards: clear pluralized resource URLs, semantic query filtering, robust error responses, and cursor-based pagination for high scalability.`,
          deepDiveSections: [
            {
              title: 'Offset Pagination (Skip/Limit) vs. Cursor Pagination',
              explanation: `Why Offset Pagination (\`skip(100000).limit(20)\`) breaks in production:
1. Performance: MongoDB must traverse all 100,000 documents before returning 20, causing severe latency spikes on deep pages.
2. Missing/Duplicate Items: If new documents are inserted while a user scrolls, items shift across page boundaries.
Cursor Pagination Solution: Query using the last seen document ID:
\`db.skills.find({ _id: { $gt: lastSeenObjectId } }).sort({ _id: 1 }).limit(20)\`
This runs as an instant O(1) index seek regardless of whether you are on page 1 or page 10,000!`,
              keyPoint: 'Cursor-based pagination utilizes indexed comparison ({ _id: { $gt: cursor } }) for constant O(1) pagination speed.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Offset Pagination vs. Cursor Pagination',
            headers: ['Dimension', 'Offset Pagination (`skip`/`limit`)', 'Cursor Pagination (`$gt: lastId`)'],
            rows: [
              ['Deep Page Latency', 'O(N) — Degrades severely on deep pages', 'O(1) — Constant sub-millisecond lookup'],
              ['Consistency during live writes', 'Prone to duplicate or skipped items', 'Guaranteed consistent streaming results'],
              ['Random Page Jumping', 'Supported (Jump directly to page 50)', 'Sequential only (Next / Previous cursor)']
            ]
          },
          coreConcepts: ['Cursor-based pagination', 'REST URL versioning', 'HATEOAS hypermedia links'],
          syntax: `// Cursor Pagination query in Mongoose
const query = cursor ? { _id: { $gt: cursor } } : {};
const items = await Skill.find(query).sort({ _id: 1 }).limit(20).lean();
const nextCursor = items.length === 20 ? items[items.length - 1]._id : null;`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// HATEOAS JSON Response Formatter
function formatSkillResponse(skill, req) {
  const baseUrl = \`\${req.protocol}://\${req.get('host')}/api/v1/skills\`;
  return {
    ...skill,
    _links: {
      self: { href: \`\${baseUrl}/\${skill._id}\`, method: 'GET' },
      update: { href: \`\${baseUrl}/\${skill._id}\`, method: 'PATCH' },
      delete: { href: \`\${baseUrl}/\${skill._id}\`, method: 'DELETE' },
      lessons: { href: \`\${baseUrl}/\${skill._id}/lessons\`, method: 'GET' }
    }
  };
}`,
              explanation: 'Attaches standardized HATEOAS hypermedia navigation links to API responses.'
            }
          ],
          commonMistakes: ['Using `skip(10000)` on large MongoDB collections, causing severe CPU and RAM exhaustion'],
          bestPractices: ['Implement cursor-based pagination for high-volume infinite scroll endpoints'],
          summary: `Cursor pagination and semantic REST design guarantee blazing fast response times and clear API discoverability.`,
          resources: [{ title: 'RESTful API Design Best Practices', url: 'https://restfulapi.net/', provider: 'REST API Tutorial', type: 'Article', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'nd5_q1',
                question: 'Why is Cursor-based pagination significantly faster than Offset pagination (skip/limit) on large datasets?',
                options: [
                  'Cursor pagination uses an index seek (`_id: { $gt: lastId }`) to jump directly to the next page without scanning previous documents',
                  'Cursor pagination deletes old documents',
                  'Cursor pagination compresses data with gzip',
                  'Cursor pagination runs on client browsers'
                ],
                correctIndex: 0,
                topic: 'Cursor Pagination',
                explanation: 'Offset pagination must scan and discard all skipped documents, whereas cursor pagination performs an instant index lookup on the last seen ID.'
              }
            ]
          },
          practicalTask: {
            title: 'Build a Cursor Pagination Query',
            difficulty: 'Intermediate',
            problemStatement: 'Write the query filter object for a cursor query where if `lastId` is provided, it returns `{ _id: { $gt: lastId } }`, otherwise returns `{}`.',
            instructions: 'Use ternary expression lastId ? { _id: { $gt: lastId } } : {}.',
            requirements: ['lastId ? { _id: { $gt: lastId } } : {}'],
            starterCode: `function getPaginationFilter(lastId) {\n  // TODO: Return query\n}`,
            solutionCode: `function getPaginationFilter(lastId) {\n  return lastId ? { _id: { $gt: lastId } } : {};\n}`,
            hints: ['return lastId ? { _id: { $gt: lastId } } : {};']
          }
        },
        {
          lessonNumber: 6,
          title: 'Request Validation with Zod / Joi & Centralized Error Handlers',
          description: 'Enforce runtime schema validation with Zod, sanitize inputs, and build unified AppError exception hierarchies.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Define strict runtime validation schemas using Zod for req.body, req.query, and req.params',
            'Build custom operational `AppError` classes with explicit HTTP status codes',
            'Handle uncaught exceptions and unhandled promise rejections safely'
          ],
          introduction: `Never trust client input. Attackers submit unexpected fields, malicious types, and invalid payloads. Schema validation with Zod verifies request parameters before they reach business services, and structured AppError hierarchies provide clean, informative error responses.`,
          deepDiveSections: [
            {
              title: 'Operational Errors vs. Programmer Errors',
              explanation: `Differentiating backend error types:
1. Operational Errors (Expected): Known failure states like Invalid Input (400), Unauthorized (401), or Not Found (404). Represented via custom \`AppError\` classes that do not crash the application.
2. Programmer Errors (Bugs): Unexpected exceptions like \`TypeError: Cannot read properties of undefined\` or syntax crashes. Must be logged with full stack traces and gracefully handled to prevent server crashes.`,
              keyPoint: 'Operational errors are expected business rejections; Programmer errors indicate software bugs that require immediate alerting.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Validation with Zod vs. Manual if/else Checks',
            headers: ['Feature', 'Manual if/else Validation', 'Zod Schema Validation'],
            rows: [
              ['Type Safety', 'Manual casting and runtime typeof checks', 'Automatic TypeScript / JavaScript type inference'],
              ['Complex Rules', 'Verbose, error-prone nested condition trees', 'Declarative chaining (`z.string().email().min(8)`)'],
              ['Error Reporting', 'Custom error messages per line', 'Automated formatted error array with exact path names']
            ]
          },
          coreConcepts: ['Zod schema validation middleware', 'Custom `AppError` hierarchy', 'Process-level crash handlers (`uncaughtException`)'],
          syntax: `// Custom Operational AppError Class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Universal Zod Validation Middleware Factory
const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    req.body = validated.body;
    req.query = validated.query;
    req.params = validated.params;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
};`,
              explanation: 'Validates body, query, and params in a single unified middleware.'
            }
          ],
          commonMistakes: ['Letting unhandled promise rejections terminate Node.js processes without catching them in process handlers'],
          bestPractices: ['Attach `process.on("unhandledRejection")` handlers to log and gracefully shut down on fatal bugs'],
          summary: `Zod runtime validation and custom AppError classes eliminate defensive boilerplate and protect backend data integrity.`,
          resources: [{ title: 'Zod Official Documentation', url: 'https://zod.dev/', provider: 'Zod.dev', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd6_q1',
                question: 'What is the key advantage of distinguishing "Operational Errors" from "Programmer Errors" in Node.js backend services?',
                options: [
                  'Operational errors can be resolved gracefully with standard HTTP 4xx responses without crashing the server process',
                  'Operational errors delete the database',
                  'Programmer errors cannot be logged',
                  'Operational errors only happen on Windows'
                ],
                correctIndex: 0,
                topic: 'Error Handling Patterns',
                explanation: 'Operational errors (e.g. invalid input, missing auth) are expected runtime states that return structured 4xx responses without restarting the server.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Custom AppError Class',
            difficulty: 'Intermediate',
            problemStatement: 'Write a class `AppError` extending `Error` that accepts `message` and `statusCode`, sets `this.statusCode = statusCode`, and sets `this.isOperational = true`.',
            instructions: 'Extend Error and call super(message).',
            requirements: ['class AppError extends Error', 'constructor(message, statusCode)', 'this.statusCode = statusCode; this.isOperational = true;'],
            starterCode: `class AppError extends Error {\n  // TODO: Constructor\n}`,
            solutionCode: `class AppError extends Error {\n  constructor(message, statusCode) {\n    super(message);\n    this.statusCode = statusCode;\n    this.isOperational = true;\n  }\n}`,
            hints: ['super(message); this.statusCode = statusCode; this.isOperational = true;']
          }
        }
      ]
    },
    {
      title: 'Phase 3: Authentication, Cryptography & Security',
      order: 3,
      lessons: [
        {
          lessonNumber: 7,
          title: 'Password Hashing (bcrypt/argon2) & Salt Rounds',
          description: 'Understand cryptographic hash functions, rainbow table attacks, salt generation, and Argon2id / bcrypt performance.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand why one-way salted key-derivation functions (KDFs) are mandatory for passwords',
            'Compare bcrypt work factor (salt rounds) vs Argon2id memory-hard algorithms',
            'Prevent timing attacks using constant-time string comparisons (`crypto.timingSafeEqual`)'
          ],
          introduction: `Passwords must NEVER be stored in plaintext or with fast cryptographic hashes like MD5 or SHA-256. Fast hashes can be brute-forced at billions of attempts per second using modern GPUs. Password hashing requires adaptive, computationally expensive algorithms like bcrypt or Argon2id.`,
          deepDiveSections: [
            {
              title: 'Why MD5/SHA-256 are Broken for Passwords (and Why bcrypt Wins)',
              explanation: `Why fast hashes fail for passwords:
• SHA-256 is designed to be fast (calculating millions of hashes per second for block integrity). A hacker with an RTX 4090 GPU can compute 10 billion SHA-256 hashes/sec to crack passwords.
• bcrypt & Argon2id are slow by design: They include a configurable Work Factor (Salt Rounds). Setting bcrypt salt rounds to 12 requires ~300ms of CPU time per hash, making brute-force attacks computationally impossible!`,
              keyPoint: 'Adaptive Key Derivation Functions (bcrypt, Argon2) deliberately introduce CPU and memory costs to defeat GPU brute-forcing.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: SHA-256 vs. bcrypt vs. Argon2id',
            headers: ['Algorithm', 'Speed', 'GPU Cracking Resistance', 'Security Rating'],
            rows: [
              ['SHA-256 / MD5', 'Extremely Fast (Nanoseconds)', 'Zero (Vulnerable to GPU cracking)', 'Dangerous / Insecure for passwords'],
              ['bcrypt', 'Slow / Configurable cost (e.g. 12 rounds ~300ms)', 'High (CPU intensive)', 'Industry Standard'],
              ['Argon2id', 'Configurable Memory & CPU hardness', 'Maximum (Memory-hard; defeats ASIC/GPU hardware)', 'State of the Art (PHC Winner)']
            ]
          },
          coreConcepts: ['Salt generation and rainbow table prevention', 'bcrypt work factor cost tuning', 'Constant-time comparison with `crypto.timingSafeEqual`'],
          syntax: `// Secure password hashing with bcryptjs
const bcrypt = require('bcryptjs');
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);
const isMatch = await bcrypt.compare(password, hashedPassword);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Constant-time token verification to prevent timing attacks
const crypto = require('crypto');

function safeCompareTokens(userToken, storedToken) {
  const bufA = Buffer.from(userToken, 'utf8');
  const bufB = Buffer.from(storedToken, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}`,
              explanation: 'Uses timingSafeEqual to prevent microsecond-level timing attack exploits.'
            }
          ],
          commonMistakes: ['Using salt rounds lower than 10 in production or using fast algorithms like MD5 or plain SHA-256'],
          bestPractices: ['Use bcrypt with 12 salt rounds or Argon2id with 64MB memory limit for password storage'],
          summary: `Cryptographic hashing with bcrypt and Argon2id safeguards user credentials against rainbow table and GPU brute-force attacks.`,
          resources: [{ title: 'OWASP Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', provider: 'OWASP', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd7_q1',
                question: 'Why are general-purpose cryptographic hashes like SHA-256 considered insecure for password storage?',
                options: [
                  'They are designed to be extremely fast, allowing attackers to compute billions of guesses per second on modern GPUs',
                  'They only work on lowercase text',
                  'They are limited to 4 characters',
                  'They require an active internet connection'
                ],
                correctIndex: 0,
                topic: 'Password Hashing Security',
                explanation: 'Fast algorithms allow attackers to test billions of combinations per second, whereas bcrypt introduces computational delay to defeat brute force.'
              }
            ]
          },
          practicalTask: {
            title: 'Hash a Password with bcrypt',
            difficulty: 'Beginner',
            problemStatement: 'Write an async function `hashPassword(password)` that generates a salt with 12 rounds and returns `bcrypt.hash(password, salt)`.',
            instructions: 'Use bcrypt.genSalt(12) and bcrypt.hash(password, salt).',
            requirements: ['const salt = await bcrypt.genSalt(12)', 'return await bcrypt.hash(password, salt)'],
            starterCode: `const bcrypt = require('bcryptjs');\nasync function hashPassword(password) {\n  // TODO: Hash password\n}`,
            solutionCode: `const bcrypt = require('bcryptjs');\nasync function hashPassword(password) {\n  const salt = await bcrypt.genSalt(12);\n  return await bcrypt.hash(password, salt);\n}`,
            hints: ['const salt = await bcrypt.genSalt(12); return await bcrypt.hash(password, salt);']
          }
        },
        {
          lessonNumber: 8,
          title: 'Stateless JWT Auth, Key Rotation & Token Blacklisting',
          description: 'Implement asymmetric RS256 JWT signing, public/private key pairs, Redis token blacklisting, and instant session revocation.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Compare symmetric HMAC (HS256) vs Asymmetric RSA/ECDSA (RS256) JWT signing',
            'Implement token blacklisting in Redis to revoke compromised tokens before expiry',
            'Rotate signing keys without breaking active user sessions'
          ],
          introduction: `While symmetric HS256 tokens share a single secret across all microservices, asymmetric RS256 tokens use a Private Key to sign tokens on the Auth service and a Public Key for other microservices to verify tokens independently.`,
          deepDiveSections: [
            {
              title: 'Asymmetric RS256 Signing & Distributed Verification',
              explanation: `How asymmetric token architecture works:
1. Authentication Microservice: Holds the private key (\`private.key\`). Signs JWTs when users log in.
2. Downstream Microservices (Skills, Academics, Careers): Hold only the public key (\`public.key\`). They can verify signatures locally in CPU memory without making any network calls to the Auth service!
3. Compromise Resilience: Even if a downstream microservice is hacked, the attacker only gets the public key and cannot forge new tokens.`,
              keyPoint: 'Asymmetric RS256 signing allows microservices to verify tokens locally with public keys without sharing secrets.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Symmetric (HS256) vs. Asymmetric (RS256) JWTs',
            headers: ['Feature', 'Symmetric (HS256)', 'Asymmetric (RS256 / ES256)'],
            rows: [
              ['Keys Used', 'Single shared secret key', 'Private key to sign, Public key to verify'],
              ['Microservice Scaling', 'All services must know the secret', 'Downstream services only need the public key'],
              ['Blast Radius', 'High (If one service leaks secret, all tokens compromised)', 'Low (Leaking public key does not allow token forgery)']
            ]
          },
          coreConcepts: ['Asymmetric RS256 key pair signing', 'Redis token revocation blacklist with TTL', 'Token versioning pattern'],
          syntax: `// Verifying RS256 JWT with Public Key
const jwt = require('jsonwebtoken');
const publicKey = fs.readFileSync('public.key');

const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Instant Token Revocation using Redis Blacklist
async function revokeToken(token, decoded) {
  const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
  if (remainingSeconds > 0) {
    // Store token in Redis blacklist with TTL matching its remaining lifetime
    await redis.setex(\`blacklist:\${token}\`, remainingSeconds, 'revoked');
  }
}

async function isTokenRevoked(token) {
  const isBlacklisted = await redis.get(\`blacklist:\${token}\`);
  return Boolean(isBlacklisted);
}`,
              explanation: 'Revokes active JWTs upon logout by blacklisting their signature in Redis until natural expiration.'
            }
          ],
          commonMistakes: ['Allowing symmetric HS256 tokens to be verified by algorithms like "none", exposing the server to algorithmic confusion attacks'],
          bestPractices: ['Explicitly specify `{ algorithms: ["RS256"] }` in `jwt.verify()` options'],
          summary: `Asymmetric RS256 signing and Redis token blacklists combine stateless scalability with instant session revocation.`,
          resources: [{ title: 'JSON Web Token Best Current Practices', url: 'https://datatracker.ietf.org/doc/html/rfc8725', provider: 'IETF', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd8_q1',
                question: 'What is the primary architectural advantage of using asymmetric RS256 JWT signing in a microservices architecture?',
                options: [
                  'Downstream microservices can verify tokens using the public key without needing the private signing secret',
                  'It doubles internet bandwidth',
                  'It bypasses SSL certificates',
                  'Tokens never expire'
                ],
                correctIndex: 0,
                topic: 'Asymmetric JWT Verification',
                explanation: 'Downstream services verify tokens locally using the public key, so the private signing key is never shared outside the auth service.'
              }
            ]
          },
          practicalTask: {
            title: 'Verify Token with Explicit RS256 Algorithm',
            difficulty: 'Intermediate',
            problemStatement: 'Write the `jwt.verify` call that verifies `token` using `publicKey` and enforces `algorithms: ["RS256"]`.',
            instructions: 'Pass token, publicKey, and { algorithms: ["RS256"] } to jwt.verify.',
            requirements: ['jwt.verify(token, publicKey, { algorithms: ["RS256"] })'],
            starterCode: `const decoded = jwt.verify(token, publicKey, {\n  // TODO: Enforce algorithm\n});`,
            solutionCode: `const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });`,
            hints: ['jwt.verify(token, publicKey, { algorithms: ["RS256"] })']
          }
        },
        {
          lessonNumber: 9,
          title: 'Hardening Express: Helmet, CORS, Rate-Limiting & CSRF Prevention',
          description: 'Implement defense-in-depth security with Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and Double Submit Cookies.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Configure Helmet HTTP security headers (CSP, HSTS, X-Content-Type-Options)',
            'Enforce strict CORS origin matching with credentials support',
            'Protect state-changing endpoints against Cross-Site Request Forgery (CSRF)'
          ],
          introduction: `A secure API requires layered defensive controls. Configuring Helmet security headers, CORS origin whitelisting, IP rate limiting, and CSRF tokens shields the Express backend against cross-site exploitation and automated vulnerability scanners.`,
          deepDiveSections: [
            {
              title: 'Content Security Policy (CSP) & HTTP Strict Transport Security (HSTS)',
              explanation: `Critical security headers injected by Helmet:
1. HSTS (\`Strict-Transport-Security\`): Forces browsers to connect exclusively over HTTPS for the next year (\`max-age=31536000; includeSubDomains; preload\`), defeating SSL-stripping attacks.
2. CSP (\`Content-Security-Policy\`): Restricts the domains from which scripts, images, and styles can be loaded, neutralizing XSS code injections.
3. \`X-Frame-Options: DENY\`: Prevents the application from being embedded in iframes, defeating Clickjacking attacks.`,
              keyPoint: 'Helmet injects 14 secure HTTP response headers to harden the application against client-side exploits.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Security Headers and Attacks Mitigated',
            headers: ['HTTP Header', 'Value', 'Attack Mitigated'],
            rows: [
              ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains', 'SSL Stripping & Man-in-the-Middle wiretapping'],
              ['X-Frame-Options', 'DENY', 'Clickjacking and UI redress attacks'],
              ['X-Content-Type-Options', 'nosniff', 'MIME type sniffing and script execution from uploads'],
              ['Content-Security-Policy', 'default-src \'self\'', 'Cross-Site Scripting (XSS) and data exfiltration']
            ]
          },
          coreConcepts: ['Helmet HTTP header defense', 'Double Submit Cookie CSRF defense', 'CORS origin whitelisting'],
          syntax: `// Production Security Configuration
const helmet = require('helmet');
const cors = require('cors');

app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Double Submit Cookie CSRF Validation Middleware
const crypto = require('crypto');

const csrfProtect = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  
  const tokenFromCookie = req.cookies['XSRF-TOKEN'];
  const tokenFromHeader = req.headers['x-xsrf-token'];
  
  if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  }
  next();
};`,
              explanation: 'Stateless Double Submit Cookie pattern preventing cross-site form forgery.'
            }
          ],
          commonMistakes: ['Setting `origin: "*"` while using cookie authentication, which breaks browser security constraints'],
          bestPractices: ['Explicitly specify exact frontend origin URLs and enable HSTS in production'],
          summary: `Comprehensive HTTP security headers and CSRF defenses protect Express APIs against automated web vulnerabilities.`,
          resources: [{ title: 'Helmet.js Official Documentation', url: 'https://helmetjs.github.io/', provider: 'Helmetjs.github.io', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'nd9_q1',
                question: 'What attack does the `X-Frame-Options: DENY` header prevent?',
                options: [
                  'Clickjacking (embedding your website inside a hidden malicious iframe)',
                  'SQL Injection',
                  'DDoS attacks',
                  'Slow database queries'
                ],
                correctIndex: 0,
                topic: 'Clickjacking Defense',
                explanation: '`X-Frame-Options: DENY` instructs browsers never to render the page inside an `<frame>` or `<iframe>`, neutralizing Clickjacking.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Helmet with HSTS Options',
            difficulty: 'Intermediate',
            problemStatement: 'Write the Express `app.use(helmet({ ... }))` call that configures `hsts` with `maxAge: 31536000` and `includeSubDomains: true`.',
            instructions: 'Pass hsts configuration object inside helmet.',
            requirements: ['app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true } }))'],
            starterCode: `app.use(helmet({\n  // TODO: Configure hsts\n}));`,
            solutionCode: `app.use(helmet({\n  hsts: {\n    maxAge: 31536000,\n    includeSubDomains: true\n  }\n}));`,
            hints: ['app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true } }));']
          }
        }
      ]
    },
    {
      title: 'Phase 4: Advanced Backend Architecture',
      order: 4,
      lessons: [
        {
          lessonNumber: 10,
          title: 'Clean Architecture: Controllers, Services & Repositories',
          description: 'Structure enterprise backend codebases using Clean Architecture, Dependency Injection, and Repository interfaces.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement Clean Architecture layers (Controllers -> Services -> Repositories -> Models)',
            'Decouple business logic from database frameworks using the Repository Pattern',
            'Inject mock repositories to perform fast, hermetic unit tests'
          ],
          introduction: `As backend systems scale, coupling business rules directly to database drivers (like Mongoose or Prisma) makes refactoring and unit testing nearly impossible. Clean Architecture isolates business logic into pure, framework-independent services.`,
          deepDiveSections: [
            {
              title: 'The Repository Pattern & Inversion of Control',
              explanation: `Clean Architecture separation:
1. Controller Layer: Handles HTTP protocol (req/res, status codes).
2. Service Layer: Contains core business logic (e.g. calculating GPA, issuing certificates). Has zero knowledge of HTTP or database specifics.
3. Repository Interface: Defines contract for data storage (\`findById\`, \`save\`, \`delete\`).
4. Database Implementation: Concrete Mongoose or SQL repository fulfilling the interface.
Benefits: You can swap MongoDB for PostgreSQL by writing a new repository class without changing a single line of business service code!`,
              keyPoint: 'Services depend on abstract repository interfaces, decoupling business logic from underlying database drivers.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Spaghetti MVC vs. Clean Architecture',
            headers: ['Dimension', 'Standard Spaghetti MVC', 'Clean Architecture'],
            rows: [
              ['Business Logic Location', 'Scattered across controllers and Mongoose hooks', 'Encapsulated in pure, isolated Service classes'],
              ['Database Coupling', 'Tightly coupled to specific ORM/ODM', 'Decoupled via Repository interfaces'],
              ['Unit Testing', 'Requires spin up of live/mock database server', 'Instant in-memory testing with mock repositories']
            ]
          },
          coreConcepts: ['Dependency Inversion Principle (SOLID)', 'Repository pattern abstraction', 'Pure business service isolation'],
          syntax: `// Repository Interface Pattern
class ISkillsRepository {
  async getById(id) { throw new Error('Not implemented'); }
  async save(skill) { throw new Error('Not implemented'); }
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Clean Service Layer with Injected Repository
class SkillsService {
  constructor(skillsRepository) {
    this.skillsRepo = skillsRepository;
  }

  async calculateMastery(skillId, userId) {
    const skill = await this.skillsRepo.getById(skillId);
    if (!skill) throw new AppError('Skill not found', 404);
    
    const completedCount = skill.lessons.filter(l => l.isCompleted).length;
    return Math.round((completedCount / skill.lessons.length) * 100);
  }
}`,
              explanation: 'Pure business logic service accepting an injected repository for hermetic testing.'
            }
          ],
          commonMistakes: ['Importing Mongoose models directly into controller files and mixing validation, database queries, and response formatting in one function'],
          bestPractices: ['Maintain strict layer boundaries: Controllers parse HTTP -> Services execute logic -> Repositories execute database queries'],
          summary: `Clean Architecture and the Repository pattern ensure enterprise codebases remain testable, modular, and maintainable over years of growth.`,
          resources: [{ title: 'The Clean Architecture by Robert C. Martin', url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html', provider: 'Clean Coder', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'nd10_q1',
                question: 'In Clean Architecture, what is the primary responsibility of the Repository layer?',
                options: [
                  'To abstract and encapsulate all data access operations, isolating business services from specific database drivers',
                  'To render HTML templates',
                  'To parse URL query parameters',
                  'To manage user sessions in browser cookies'
                ],
                correctIndex: 0,
                topic: 'Repository Pattern',
                explanation: 'Repositories handle data storage and retrieval, allowing services to remain agnostic of database implementation details.'
              }
            ]
          },
          practicalTask: {
            title: 'Instantiate a Service with Injected Repository',
            difficulty: 'Beginner',
            problemStatement: 'Write the code to instantiate `SkillsService` passing `mongoSkillsRepository` into its constructor.',
            instructions: 'Create instance using new SkillsService(mongoSkillsRepository).',
            requirements: ['const skillsService = new SkillsService(mongoSkillsRepository)'],
            starterCode: `const skillsService = `,
            solutionCode: `const skillsService = new SkillsService(mongoSkillsRepository);`,
            hints: ['new SkillsService(mongoSkillsRepository);']
          }
        },
        {
          lessonNumber: 11,
          title: 'Asynchronous Background Jobs with BullMQ & Worker Threads',
          description: 'Process asynchronous background queues with BullMQ, Redis streams, worker threads, rate limiting, and exponential backoff.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement background task queues using BullMQ and Redis',
            'Handle job retries with exponential backoff and Dead-Letter Queues (DLQ)',
            'Offload CPU-intensive workloads to Node.js Worker Threads (`worker_threads`)'
          ],
          introduction: `Operations like generating PDF certificates, transcribing audio, or sending thousands of emails take seconds or minutes to complete. These tasks must never block HTTP request-response cycles. Offloading work to BullMQ background queues ensures instant HTTP 202 responses while workers process jobs asynchronously.`,
          deepDiveSections: [
            {
              title: 'BullMQ Queue Architecture & Retry Exponential Backoff',
              explanation: `How BullMQ orchestrates background work:
1. Producer: Express API receives \`POST /certificates/generate\`, pushes a job onto the Redis queue (\`queue.add("generatePDF", { userId })\`), and immediately returns \`HTTP 202 Accepted\`.
2. Worker: A separate background Node.js worker process consumes jobs from Redis.
3. Resilience: If a worker crashes or an external email API fails, BullMQ automatically retries the job with Exponential Backoff (\`backoff: { type: "exponential", delay: 2000 }\`). After 5 failures, the job moves to a Dead-Letter Queue (DLQ) for inspection.`,
              keyPoint: 'Background queues decouple slow operations from the HTTP response loop and provide automatic retry resilience.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Synchronous Request vs. Asynchronous Job Queue',
            headers: ['Dimension', 'Synchronous HTTP Processing', 'BullMQ Background Worker'],
            rows: [
              ['HTTP Response Time', '5,000 ms – 30,000 ms (User browser hangs)', '10 ms (Instant HTTP 202 Accepted)'],
              ['Timeout Risk', 'High (Cloudflare/Nginx drops connection at 30s)', 'Zero (Worker runs independently in background)'],
              ['Failure Recovery', 'Lost if server crashes mid-execution', 'Guaranteed retry via Redis persistence and DLQ']
            ]
          },
          coreConcepts: ['Producer-Consumer queue pattern', 'Exponential backoff retries', 'Dead-Letter Queue (DLQ) analysis'],
          syntax: `// Adding a job to BullMQ Queue
const { Queue } = require('bullmq');
const emailQueue = new Queue('emails', { connection: redisConfig });

await emailQueue.add('sendWelcome', { email: user.email }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// BullMQ Worker Implementation
const { Worker } = require('bullmq');

const emailWorker = new Worker('emails', async (job) => {
  console.log(\`Processing job \${job.id}: Sending email to \${job.data.email}\`);
  await sendEmailService(job.data.email);
  console.log(\`Job \${job.id} completed.\`);
}, { connection: redisConfig });

emailWorker.on('failed', (job, err) => {
  console.error(\`Job \${job.id} failed after \${job.attemptsMade} attempts: \${err.message}\`);
});`,
              explanation: 'Dedicated background worker processing jobs with error handling.'
            }
          ],
          commonMistakes: ['Processing heavy PDF or video encoding inside Express request handlers instead of background queues'],
          bestPractices: ['Return HTTP 202 Accepted immediately and notify the client upon job completion via WebSockets or Webhooks'],
          summary: `BullMQ background job queues ensure sub-millisecond API response times and fault-tolerant background processing.`,
          resources: [{ title: 'BullMQ Official Guide', url: 'https://docs.bullmq.io/', provider: 'BullMQ', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd11_q1',
                question: 'Which HTTP status code should an API return when an operation (like generating a large PDF report) has been accepted and queued for background processing?',
                options: [
                  '202 Accepted',
                  '200 OK',
                  '504 Gateway Timeout',
                  '301 Moved Permanently'
                ],
                correctIndex: 0,
                topic: 'Asynchronous HTTP Responses',
                explanation: 'HTTP 202 Accepted signifies that the request has been received and queued for processing, but execution has not yet finished.'
              }
            ]
          },
          practicalTask: {
            title: 'Enqueue a Background Job in BullMQ',
            difficulty: 'Intermediate',
            problemStatement: 'Write the code to add a job named `"generateCertificate"` with data `{ studentId: 101 }` and `attempts: 3` to `certQueue`.',
            instructions: 'Use await certQueue.add("generateCertificate", { studentId: 101 }, { attempts: 3 }).',
            requirements: ['await certQueue.add("generateCertificate", { studentId: 101 }, { attempts: 3 })'],
            starterCode: `await certQueue.add(`,
            solutionCode: `await certQueue.add('generateCertificate', { studentId: 101 }, { attempts: 3 });`,
            hints: ['await certQueue.add("generateCertificate", { studentId: 101 }, { attempts: 3 });']
          }
        },
        {
          lessonNumber: 12,
          title: 'File Uploads, S3 Object Storage & Streaming Processing',
          description: 'Handle multipart form uploads with Multer, direct client-to-S3 presigned URLs, and streaming file transformations.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Process multipart/form-data uploads with Multer and memory storage',
            'Generate AWS S3 Presigned URLs for direct, serverless client uploads',
            'Validate file MIME types and enforce byte limits to prevent storage attacks'
          ],
          introduction: `Allowing users to upload large files (PDF resumes, profile pictures) directly through an API server consumes high bandwidth, exhausts disk space, and creates security risks. Best practice utilizes AWS S3 Presigned URLs, enabling browsers to upload directly to cloud object storage.`,
          deepDiveSections: [
            {
              title: 'Direct Client-to-S3 Presigned URL Pattern',
              explanation: `How S3 Presigned Uploads function:
1. Client requests upload ticket: \`POST /api/uploads/presigned-url\` sending \`{ filename: "resume.pdf", contentType: "application/pdf" }\`.
2. Backend generates Presigned PUT URL: Uses \`@aws-sdk/s3-request-presigner\` with a 5-minute expiry.
3. Client uploads directly to AWS S3: Sends \`PUT <presigned-url>\` with raw file binary directly to AWS S3.
Benefits: Zero bandwidth and CPU consumed on the Node.js API server!`,
              keyPoint: 'Presigned URLs offload file upload bandwidth and storage management directly to cloud object stores.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Server Uploads (Multer) vs. S3 Presigned URLs',
            headers: ['Dimension', 'Server Multipart (Multer)', 'S3 Presigned URLs (Serverless)'],
            rows: [
              ['API Server Load', 'High (Bandwidth, memory buffers, disk I/O)', 'Zero (Direct client-to-cloud upload)'],
              ['Max File Size', 'Limited by server memory/disk constraints', 'Up to 5 Terabytes per S3 object'],
              ['Server Crash Risk', 'High on simultaneous multi-gigabyte uploads', 'Zero risk to application server']
            ]
          },
          coreConcepts: ['S3 Presigned URLs (`getSignedUrl`)', 'MIME type magic number verification', 'Multer memory storage limits'],
          syntax: `// Generating S3 Presigned Upload URL
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const command = new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: \`uploads/\${Date.now()}-\${filename}\`,
  ContentType: contentType
});
const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Multer Secure Memory Storage with Strict Validation
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and PDF allowed.', 400), false);
    }
  }
});`,
              explanation: 'Multer middleware enforcing 5MB limit and strict MIME whitelist.'
            }
          ],
          commonMistakes: ['Relying solely on file extensions (.jpg) which can be spoofed, instead of validating actual file MIME types'],
          bestPractices: ['Enforce 5MB file limits in Multer and use S3 Presigned URLs for larger media files'],
          summary: `S3 Presigned URLs and strict Multer validation ensure scalable, secure cloud file management.`,
          resources: [{ title: 'AWS S3 Presigned URLs Guide', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html', provider: 'AWS', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd12_q1',
                question: 'Why are AWS S3 Presigned URLs the standard architectural pattern for handling large file uploads in modern web applications?',
                options: [
                  'They allow clients to upload files directly to S3 cloud storage without routing heavy binary payloads through the Node.js API server',
                  'They compress videos automatically',
                  'They bypass S3 billing',
                  'They convert PDF files to HTML'
                ],
                correctIndex: 0,
                topic: 'Presigned URL Architecture',
                explanation: 'Presigned URLs offload bandwidth and CPU load, allowing files to stream directly from the browser to cloud storage.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Multer File Size Limit',
            difficulty: 'Beginner',
            problemStatement: 'Write the Multer configuration object setting `limits: { fileSize: 10 * 1024 * 1024 }` (10 MB).',
            instructions: 'Set limits with fileSize in bytes.',
            requirements: ['{ limits: { fileSize: 10 * 1024 * 1024 } }'],
            starterCode: `const upload = multer({\n  // TODO: Configure limit\n});`,
            solutionCode: `const upload = multer({\n  limits: { fileSize: 10 * 1024 * 1024 }\n});`,
            hints: ['limits: { fileSize: 10 * 1024 * 1024 }']
          }
        }
      ]
    },
    {
      title: 'Phase 5: Redis, Caching & Performance Tuning',
      order: 5,
      lessons: [
        {
          lessonNumber: 13,
          title: 'Redis Data Structures & In-Memory Caching Strategies',
          description: 'Master Redis Strings, Hashes, Lists, Sets, Sorted Sets (ZSET), Bitmaps, and in-memory key expiration.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master Redis core data structures (Strings, Hashes, Lists, Sets, Sorted Sets)',
            'Build real-time leaderboards using Redis Sorted Sets (`ZADD`, `ZRANGE`)',
            'Implement atomic rate-limiting counters using Redis Strings (`INCR`, `EXPIRE`)'
          ],
          introduction: `Redis (Remote Dictionary Server) is an open-source, in-memory key-value data structure store used as a database, cache, and message broker. Understanding its rich data structures unlocks sub-millisecond leaderboard tracking, caching, and distributed counters.`,
          deepDiveSections: [
            {
              title: 'Redis Sorted Sets (ZSET) for Real-Time Leaderboards',
              explanation: `A Redis Sorted Set is a collection of unique strings ordered by an associated floating-point score:
• \`ZADD leaderboard 98.5 "student_101"\`: Inserts a score in O(log N) time.
• \`ZREVRANGE leaderboard 0 9 WITHSCORES\`: Retrieves the top 10 highest-scoring students instantly in 0.5ms.
• \`ZRANK leaderboard "student_101"\`: Retrieves a student's exact ranking position across 1,000,000 users in O(log N) time.`,
              keyPoint: 'Redis Sorted Sets (ZSET) maintain instant rankings and leaderboards without expensive database sort scans.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Redis Data Structures',
            headers: ['Data Structure', 'Commands', 'Best Use Case'],
            rows: [
              ['Strings', '`GET`, `SET`, `INCR`, `SETEX`', 'JSON document caching, rate limit counters, lock flags'],
              ['Hashes', '`HGET`, `HSET`, `HGETALL`', 'User session objects, profile property lookups'],
              ['Lists', '`LPUSH`, `RPOP`, `BLPOP`', 'FIFO message queues, recent activity streams'],
              ['Sets', '`SADD`, `SMEMBERS`, `SINTER`', 'Unique tag sets, online user tracking, mutual friends'],
              ['Sorted Sets (ZSET)', '`ZADD`, `ZRANGE`, `ZREVRANGE`', 'Gaming leaderboards, trending skills ranking, rate limit windows']
            ]
          },
          coreConcepts: ['In-memory single-threaded execution model', 'Sorted Set leaderboard algorithms', 'Atomic string counters (`INCR`)'],
          syntax: `# Redis CLI commands
SET user:101:session "active" EX 3600
ZADD skill_popularity 1500 "docker" 2400 "react"
ZREVRANGE skill_popularity 0 5 WITHSCORES`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Real-Time Skill Leaderboard using Redis Sorted Sets
class SkillLeaderboard {
  constructor(redisClient) {
    this.redis = redisClient;
    this.key = 'skills:popularity';
  }

  async recordEnrollment(skillSlug) {
    await this.redis.zincrby(this.key, 1, skillSlug);
  }

  async getTopSkills(limit = 5) {
    return await this.redis.zrevrange(this.key, 0, limit - 1, 'WITHSCORES');
  }
}`,
              explanation: 'Maintains real-time skill popularity rankings with sub-millisecond retrieval.'
            }
          ],
          commonMistakes: ['Using `KEYS *` in production scripts, which blocks the single-threaded Redis event loop while scanning millions of keys'],
          bestPractices: ['Never run `KEYS *` in production; always use `SCAN` with cursor iteration'],
          summary: `Redis rich data structures enable sub-millisecond caching, real-time leaderboards, and atomic counters.`,
          resources: [{ title: 'Redis Data Types Tutorial', url: 'https://redis.io/docs/data-types/', provider: 'Redis.io', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'nd13_q1',
                question: 'Which Redis data structure is optimal for maintaining a live leaderboard of top-performing students sorted by GPA?',
                options: [
                  'Sorted Set (ZSET)',
                  'String',
                  'Bitmap',
                  'HyperLogLog'
                ],
                correctIndex: 0,
                topic: 'Redis Data Structures',
                explanation: 'Sorted Sets (ZSET) maintain unique elements ordered by score, allowing logarithmic insertion and instant range queries.'
              }
            ]
          },
          practicalTask: {
            title: 'Increment a Sorted Set Score in Redis',
            difficulty: 'Beginner',
            problemStatement: 'Write the command to increment the score of member `"docker"` by `1` in sorted set `"skills:popularity"` using `redis.zincrby()`.',
            instructions: 'Use await redis.zincrby("skills:popularity", 1, "docker").',
            requirements: ['await redis.zincrby("skills:popularity", 1, "docker")'],
            starterCode: `await redis.zincrby(`,
            solutionCode: `await redis.zincrby('skills:popularity', 1, 'docker');`,
            hints: ['await redis.zincrby("skills:popularity", 1, "docker");']
          }
        },
        {
          lessonNumber: 14,
          title: 'Cache Invalidation, Write-Through & Cache Aside Patterns',
          description: 'Master caching patterns: Cache-Aside, Write-Through, Write-Behind, and solving Cache Stampede (Thundering Herd) with distributed locks.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Compare Cache-Aside, Write-Through, and Write-Behind caching patterns',
            'Prevent Cache Stampede (Thundering Herd) using probabilistic early expiration (XFetch) or Mutex locks',
            'Implement pub/sub cache invalidation across distributed microservice nodes'
          ],
          introduction: `There are only two hard things in Computer Science: cache invalidation and naming things. When cached database data changes, stale cache entries must be evicted immediately without creating Cache Stampede storms that crash your primary database.`,
          deepDiveSections: [
            {
              title: 'Cache Stampede (Thundering Herd Problem) & Solution',
              explanation: `What happens when a hot cache key expires:
1. High-Traffic Key Expires: \`skill:full-stack-mern\` expires under 10,000 req/sec traffic.
2. The Stampede: 10,000 concurrent requests simultaneously experience a Cache Miss.
3. Database Crash: All 10,000 requests query MongoDB simultaneously, causing CPU saturation and database failure.
Solution: Mutex Locking or Probabilistic Early Expiration (XFetch):
When a cache miss occurs, the first request acquires a distributed Redis lock (\`SET lock:skill NX EX 5\`), queries the database, and repopulates the cache while other requests wait briefly or receive stale data.`,
              keyPoint: 'Distributed mutex locks prevent thousands of concurrent requests from hammering the database on cache key expiry.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Caching Architectures',
            headers: ['Pattern', 'Read Flow', 'Write Flow', 'Data Freshness'],
            rows: [
              ['Cache-Aside (Lazy)', 'App checks cache -> DB on miss', 'App writes to DB -> invalidates cache key', 'Eventual consistency (High read performance)'],
              ['Write-Through', 'App reads from cache', 'App writes to Cache -> Cache writes to DB', 'Strictly consistent (Higher write latency)'],
              ['Write-Behind (Write-Back)', 'App reads from cache', 'App writes to Cache -> Asynchronously flushes to DB', 'Highest write speed (Risk of data loss on power crash)']
            ]
          },
          coreConcepts: ['Cache-Aside vs Write-Through', 'Cache Stampede prevention with mutex locks', 'Pub/Sub cache synchronization'],
          syntax: `// Distributed Lock with Redis SET NX
const acquired = await redis.set('lock:key', 'locked', 'NX', 'EX', 5);
if (acquired) {
  // Safe to query DB and populate cache
  await redis.del('lock:key');
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Resilient Cache-Aside with Stampede Protection
async function getCachedSkill(skillId) {
  const cacheKey = \`skill:\${skillId}\`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try acquiring lock to populate cache
  const lockKey = \`lock:\${cacheKey}\`;
  const gotLock = await redis.set(lockKey, '1', 'NX', 'EX', 3);
  
  if (gotLock) {
    try {
      const data = await Skill.findById(skillId).lean();
      await redis.setex(cacheKey, 3600, JSON.stringify(data));
      return data;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // Wait briefly and retry reading cache
    await new Promise(r => setTimeout(r, 100));
    return getCachedSkill(skillId);
  }
}`,
              explanation: 'Cache-aside pattern with distributed lock protection against thundering herd crashes.'
            }
          ],
          commonMistakes: ['Failing to delete cache keys upon database updates, serving stale outdated data to users'],
          bestPractices: ['Invalidate cache keys immediately in update controllers and set safety TTLs on all keys'],
          summary: `Robust cache invalidation and distributed lock stampede protection ensure sub-millisecond latency without database overload.`,
          resources: [{ title: 'Caching Strategies and Best Practices', url: 'https://aws.amazon.com/caching/best-practices/', provider: 'AWS', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd14_q1',
                question: 'What is a "Cache Stampede" (or Thundering Herd problem)?',
                options: [
                  'When a popular cache key expires and thousands of simultaneous requests all hit the primary database at once, overwhelming the database',
                  'When Redis runs out of memory and crashes',
                  'When the network cable is disconnected',
                  'When a user clears their browser cookies'
                ],
                correctIndex: 0,
                topic: 'Cache Stampede',
                explanation: 'A cache stampede occurs when many concurrent requests experience a cache miss on an expired key and overwhelm the database simultaneously.'
              }
            ]
          },
          practicalTask: {
            title: 'Acquire an Atomic Redis Lock',
            difficulty: 'Intermediate',
            problemStatement: 'Write the Redis command to acquire a lock `lock:inventory` that succeeds only if the key does not exist (`"NX"`) with a `5` second expiration (`"EX", 5`).',
            instructions: 'Use await redis.set("lock:inventory", "1", "NX", "EX", 5).',
            requirements: ['await redis.set("lock:inventory", "1", "NX", "EX", 5)'],
            starterCode: `const lock = await redis.set(`,
            solutionCode: `const lock = await redis.set('lock:inventory', '1', 'NX', 'EX', 5);`,
            hints: ['await redis.set("lock:inventory", "1", "NX", "EX", 5);']
          }
        },
        {
          lessonNumber: 15,
          title: 'Profiling Node.js: Memory Leaks, CPU Flamegraphs & Clinic.js',
          description: 'Detect memory leaks with heap snapshots, analyze CPU bottlenecks with flamegraphs, and diagnose latency using Clinic.js.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Diagnose V8 memory leaks using Chrome DevTools Heap Snapshots and heapdump',
            'Generate and interpret CPU Flamegraphs to identify blocking synchronous code',
            'Profile latency and event loop delay using Clinic.js Doctor and Bubbleprof'
          ],
          introduction: `Production performance degradations often stem from subtle memory leaks (closures, global arrays, un-cleaned event listeners) or CPU-blocking code. Mastering profiling tools like Clinic.js and Chrome DevTools Heap Snapshots enables surgical diagnosis of performance regressions.`,
          deepDiveSections: [
            {
              title: 'Common V8 Memory Leak Patterns in Node.js',
              explanation: `Top 3 sources of Node.js memory leaks:
1. Accidental Global Variables: Assigning \`leakedVar = data\` without \`const\` attaches data to the root Global object, preventing garbage collection.
2. Uncleaned Event Listeners: Attaching \`emitter.on('event', cb)\` on every HTTP request without calling \`emitter.removeListener()\`.
3. Retained Closures: Outer function variables retained indefinitely by long-lived inner callback functions.`,
              keyPoint: 'Always remove event listeners and avoid accumulating unbounded arrays in global module scope.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Profiling Tools for Node.js',
            headers: ['Tool', 'Target Metric', 'Primary Use Case'],
            rows: [
              ['Clinic.js Doctor', 'Event Loop Delay, CPU %, Memory', 'High-level automated health diagnostic'],
              ['Clinic.js Flame', 'CPU Execution Time per Function', 'Identifying synchronous CPU bottlenecks and slow regex'],
              ['Chrome DevTools Snapshots', 'V8 Heap Memory Retention Trees', 'Identifying memory leaks and retained objects']
            ]
          },
          coreConcepts: ['V8 heap snapshot delta comparison', 'CPU Flamegraph stack width analysis', 'Clinic.js automated diagnostics'],
          syntax: `# Run diagnostic health profiling with Clinic.js
npx clinic doctor --on-port 'autocannon http://localhost:5000' -- node server.js`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Monitoring process memory in Node.js
function logMemoryUsage() {
  const memory = process.memoryUsage();
  console.log({
    rss: \`\${(memory.rss / 1024 / 1024).toFixed(2)} MB\`, // Resident Set Size
    heapTotal: \`\${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB\`,
    heapUsed: \`\${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB\`,
    external: \`\${(memory.external / 1024 / 1024).toFixed(2)} MB\`
  });
}`,
              explanation: 'Tracks heapUsed and RSS memory footprint in real-time.'
            }
          ],
          commonMistakes: ['Leaving active setInterval timers running on objects that should have been garbage collected'],
          bestPractices: ['Profile applications under synthetic load with Autocannon and Clinic.js before major production releases'],
          summary: `Systematic memory profiling and CPU flamegraph analysis prevent silent memory leaks and high-latency production incidents.`,
          resources: [{ title: 'Clinic.js Diagnostic Toolkit', url: 'https://clinicjs.org/', provider: 'NearForm', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd15_q1',
                question: 'What does a wide horizontal bar in a CPU Flamegraph signify?',
                options: [
                  'The function consumed a significant amount of CPU execution time on the main thread',
                  'The function downloaded a large image',
                  'The server ran out of disk space',
                  'The function used 0% CPU'
                ],
                correctIndex: 0,
                topic: 'CPU Flamegraphs',
                explanation: 'In flamegraphs, the horizontal width of a bar represents the percentage of total CPU time spent executing that specific function stack.'
              }
            ]
          },
          practicalTask: {
            title: 'Read Heap Memory Usage in Megabytes',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `getHeapUsedMB()` that returns `process.memoryUsage().heapUsed / 1024 / 1024`.',
            instructions: 'Return process.memoryUsage().heapUsed / 1024 / 1024.',
            requirements: ['return process.memoryUsage().heapUsed / 1024 / 1024'],
            starterCode: `function getHeapUsedMB() {\n  // TODO: Return heapUsed in MB\n}`,
            solutionCode: `function getHeapUsedMB() {\n  return process.memoryUsage().heapUsed / 1024 / 1024;\n}`,
            hints: ['return process.memoryUsage().heapUsed / 1024 / 1024;']
          }
        }
      ]
    },
    {
      title: 'Phase 6: Microservices Architecture & Message Brokers',
      order: 6,
      lessons: [
        {
          lessonNumber: 16,
          title: 'Monolith to Microservices Decomposition & Service Boundaries',
          description: 'Deconstruct monoliths using Domain-Driven Design (DDD), Bounded Contexts, and Database-per-Service patterns.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Identify service boundaries using Domain-Driven Design (DDD) Bounded Contexts',
            'Apply the Database-per-Service pattern to prevent shared database coupling',
            'Implement the Strangler Fig Pattern for incremental zero-downtime monolith migration'
          ],
          introduction: `Splitting a monolithic application into microservices requires clear domain boundaries. If microservices share a single centralized database or make synchronous spaghetti calls to each other, you end up with a "distributed monolith" that combines the worst aspects of both architectures.`,
          deepDiveSections: [
            {
              title: 'The Database-per-Service Pattern & The Strangler Fig Pattern',
              explanation: `Microservices design rules:
1. Database per Service: Each microservice MUST own its private database. No other service may query its database directly; all interactions must occur via public APIs or asynchronous event streams.
2. Strangler Fig Pattern: Incrementally replace monolithic endpoints by routing traffic through an API Gateway to newly built microservices one route at a time until the legacy monolith is completely decommissioned.`,
              keyPoint: 'Never share databases between microservices; enforce strict API and event contracts.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Monolithic Architecture vs. Microservices Architecture',
            headers: ['Dimension', 'Monolith', 'Microservices'],
            rows: [
              ['Deployment', 'Single atomic build and release', 'Independent CI/CD pipelines per service'],
              ['Scaling', 'Scales entire application together', 'Scales only bottleneck services (e.g. scale Auth 10x)'],
              ['Blast Radius', 'A crash in one module can take down entire server', 'Failures isolated to specific microservice bounded context'],
              ['Complexity', 'Simple local debugging', 'Higher operational complexity (Distributed tracing required)']
            ]
          },
          coreConcepts: ['Bounded Contexts (DDD)', 'Database-per-Service pattern', 'Strangler Fig migration pattern'],
          syntax: `// Microservices Bounded Context Domains
Auth Service       -> Users, Credentials, Roles (PostgreSQL)
Skills Service     -> Curriculum, Lessons, Exercises (MongoDB)
Academics Service  -> GPA, Transcript, Grades (PostgreSQL)
Careers Service    -> Roadmaps, Jobs, Applications (MongoDB)`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Inter-Service API Client with Circuit Breaker
class SkillsServiceClient {
  constructor(baseUrl) {
    this.client = axios.create({ baseURL: baseUrl, timeout: 2000 });
  }

  async getSkillOverview(skillId) {
    try {
      const { data } = await this.client.get(\`/api/v1/skills/\${skillId}\`);
      return data;
    } catch (err) {
      console.error('Skills service unreachable:', err.message);
      return null; // Fallback gracefully
    }
  }
}`,
              explanation: 'Decoupled HTTP client with timeouts and graceful fallback.'
            }
          ],
          commonMistakes: ['Allowing multiple microservices to read and write directly to the same shared database tables'],
          bestPractices: ['Enforce the Database-per-Service pattern and communicate via asynchronous events or gRPC'],
          summary: `Domain-Driven Design and independent service databases form the foundation of scalable microservice ecosystems.`,
          resources: [{ title: 'Microservice Architecture Patterns by Chris Richardson', url: 'https://microservices.io/patterns/index.html', provider: 'Microservices.io', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd16_q1',
                question: 'Why is the "Database-per-Service" pattern considered mandatory in microservices architecture?',
                options: [
                  'To ensure services remain loosely coupled, allowing teams to change schemas and scale databases independently without breaking other services',
                  'Because databases only support 1 table each',
                  'To increase licensing costs',
                  'Because microservices cannot connect to SQL'
                ],
                correctIndex: 0,
                topic: 'Database-per-Service Pattern',
                explanation: 'A shared database tightly couples services, causing schema changes in one service to break other unrelated services.'
              }
            ]
          },
          practicalTask: {
            title: 'Create an Axios Microservice Client with Timeout',
            difficulty: 'Beginner',
            problemStatement: 'Write the code to create an `axios` instance with `baseURL: "http://skills-service:5000"` and a `timeout: 3000` ms.',
            instructions: 'Use axios.create({ baseURL: "http://skills-service:5000", timeout: 3000 }).',
            requirements: ['axios.create({ baseURL: "http://skills-service:5000", timeout: 3000 })'],
            starterCode: `const axios = require('axios');\nconst client = axios.create({\n  // TODO: Config\n});`,
            solutionCode: `const axios = require('axios');\nconst client = axios.create({\n  baseURL: 'http://skills-service:5000',\n  timeout: 3000\n});`,
            hints: ['baseURL: "http://skills-service:5000", timeout: 3000']
          }
        },
        {
          lessonNumber: 17,
          title: 'Inter-Service Communication: REST vs gRPC vs RabbitMQ/Kafka',
          description: 'Compare synchronous REST vs high-performance binary gRPC (Protocol Buffers) vs asynchronous AMQP message brokers.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Compare synchronous HTTP/REST with high-performance binary gRPC',
            'Define Protocol Buffers (.proto) service interfaces and message schemas',
            'Publish and consume asynchronous events via RabbitMQ / Kafka AMQP brokers'
          ],
          introduction: `Microservices communicate through two paradigms: Synchronous (REST / gRPC) for immediate request-reply lookups, and Asynchronous (RabbitMQ / Kafka) for decoupled event publishing (e.g. \`UserRegisteredEvent\`). Binary gRPC delivers up to 7x higher throughput than text-based JSON REST.`,
          deepDiveSections: [
            {
              title: 'gRPC & Protocol Buffers (Protobuf) Architecture',
              explanation: `Why gRPC outperforms REST:
1. Binary Serialization: Protocol Buffers serialize data into compact binary bytes instead of heavy JSON text strings, reducing network bandwidth by up to 80%.
2. HTTP/2 Transport: Multiplexes multiple requests over a single persistent TCP connection with header compression.
3. Strongly Typed Contracts: \`.proto\` files define strictly typed contracts shared across Node.js, Go, Python, and Java services.`,
              keyPoint: 'gRPC uses binary Protocol Buffers and HTTP/2 multiplexing for lightning-fast inter-service RPC calls.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: REST vs. gRPC vs. RabbitMQ / Kafka',
            headers: ['Protocol', 'Communication Style', 'Payload Format', 'Best Use Case'],
            rows: [
              ['REST (HTTP/1.1)', 'Synchronous Request-Reply', 'JSON Text', 'Public client-facing APIs & third-party integrations'],
              ['gRPC (HTTP/2)', 'Synchronous RPC', 'Binary Protocol Buffers', 'High-throughput internal service-to-service calls'],
              ['RabbitMQ / Kafka', 'Asynchronous Pub/Sub', 'Binary / JSON Events', 'Event-driven decoupling, notifications, audit logging']
            ]
          },
          coreConcepts: ['gRPC Protocol Buffers (.proto)', 'HTTP/2 multiplexing', 'Event-Driven Pub/Sub architecture'],
          syntax: `// Protocol Buffer Definition (.proto)
syntax = "proto3";

service SkillsService {
  rpc GetSkill (SkillRequest) returns (SkillResponse);
}

message SkillRequest {
  string skillId = 1;
}

message SkillResponse {
  string id = 1;
  string title = 2;
  int32 hours = 3;
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// RabbitMQ Event Publisher in Node.js
const amqp = require('amqplib');

async function publishEvent(queueName, eventData) {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(queueName, { durable: true });
  
  const payload = Buffer.from(JSON.stringify(eventData));
  channel.sendToQueue(queueName, payload, { persistent: true });
  
  setTimeout(() => connection.close(), 500);
}`,
              explanation: 'Publishes durable, persistent message events to a RabbitMQ queue.'
            }
          ],
          commonMistakes: ['Using synchronous REST calls across a chain of 10 microservices, where latency compounds and any single failure crashes the entire chain'],
          bestPractices: ['Use asynchronous event broadcasting (RabbitMQ/Kafka) for actions that do not require immediate responses'],
          summary: `Combining gRPC for fast synchronous queries and RabbitMQ/Kafka for asynchronous events creates resilient distributed backends.`,
          resources: [{ title: 'gRPC Official Documentation', url: 'https://grpc.io/docs/languages/node/basics/', provider: 'gRPC.io', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd17_q1',
                question: 'Why is binary gRPC significantly faster than standard REST JSON APIs for internal microservice communication?',
                options: [
                  'It serializes data into compact binary bytes using Protocol Buffers and multiplexes requests over HTTP/2',
                  'It skips all security encryption',
                  'It runs in the browser kernel',
                  'It disables TCP acknowledgments'
                ],
                correctIndex: 0,
                topic: 'gRPC Performance',
                explanation: 'Binary Protobuf serialization and HTTP/2 connection reuse drastically reduce serialization overhead and network latency.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a Protocol Buffer Message',
            difficulty: 'Beginner',
            problemStatement: 'Write the Protobuf message definition for `UserSummary` with string field `userId = 1` and string field `email = 2`.',
            instructions: 'Use message UserSummary { string userId = 1; string email = 2; }.',
            requirements: ['message UserSummary { string userId = 1; string email = 2; }'],
            starterCode: `message UserSummary {\n  // TODO: Fields\n}`,
            solutionCode: `message UserSummary {\n  string userId = 1;\n  string email = 2;\n}`,
            hints: ['string userId = 1; string email = 2;']
          }
        },
        {
          lessonNumber: 18,
          title: 'API Gateway Pattern, Service Discovery & Circuit Breakers (Opossum)',
          description: 'Implement API Gateway routing, dynamic service discovery, and Circuit Breaker patterns (Closed, Open, Half-Open) with Opossum.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement an API Gateway routing client requests to internal microservices',
            'Master the Circuit Breaker pattern states (Closed, Open, Half-Open)',
            'Prevent cascading service failures using the Opossum circuit breaker library'
          ],
          introduction: `If Microservice A calls Microservice B, and Microservice B is down or experiencing heavy latency, Microservice A will quickly exhaust its socket connections waiting for responses, causing a cascading failure that crashes the entire platform. The Circuit Breaker pattern stops calling failing services and returns fallback responses immediately.`,
          deepDiveSections: [
            {
              title: 'The 3 States of a Circuit Breaker',
              explanation: `How a Circuit Breaker operates:
1. Closed (Normal): Requests flow freely. The breaker tracks error rates.
2. Open (Tripped): If errors exceed threshold (e.g. 50% failures), the breaker trips OPEN. For the next 30 seconds, ALL calls fail immediately without touching the failing microservice, returning cached fallbacks.
3. Half-Open (Testing): After timeout, the breaker allows a few canary test requests. If they succeed, it resets to CLOSED; if they fail, it trips back to OPEN.`,
              keyPoint: 'Circuit breakers prevent cascading system outages by failing fast when downstream services are degraded.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Circuit Breaker States',
            headers: ['State', 'Downstream Traffic', 'Action on Request', 'Next Transition'],
            rows: [
              ['Closed', 'Full traffic permitted', 'Executes normal remote network call', 'Trips to OPEN if failure threshold exceeded'],
              ['Open', 'Zero traffic permitted', 'Fails immediately and executes fallback function', 'Transitions to HALF-OPEN after reset timeout'],
              ['Half-Open', 'Limited canary traffic permitted', 'Tests downstream health with sample requests', 'Returns to CLOSED on success, or OPEN on failure']
            ]
          },
          coreConcepts: ['Circuit Breaker finite state machine', 'API Gateway single-entrypoint routing', 'Graceful fallback degradation'],
          syntax: `// Opossum Circuit Breaker in Node.js
const CircuitBreaker = require('opossum');

const breaker = new CircuitBreaker(fetchRemoteData, {
  timeout: 3000, // 3s request timeout
  errorThresholdPercentage: 50, // Trip if 50% fail
  resetTimeout: 30000 // Test again after 30s
});

breaker.fallback(() => ({ data: [], fromFallback: true }));`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Resilient API Gateway Route with Circuit Breaker
const CircuitBreaker = require('opossum');
const axios = require('axios');

const callCareerService = async (studentId) => {
  const { data } = await axios.get(\`http://career-service:5002/api/v1/roadmap/\${studentId}\`, { timeout: 2000 });
  return data;
};

const careerBreaker = new CircuitBreaker(callCareerService, {
  timeout: 2000,
  errorThresholdPercentage: 50,
  resetTimeout: 15000
});

careerBreaker.fallback(() => ({ status: 'unavailable', roadmap: null, cached: true }));

app.get('/api/student/:id/roadmap', async (req, res) => {
  const result = await careerBreaker.fire(req.params.id);
  res.json(result);
});`,
              explanation: 'Protects the API gateway from failing career services using Opossum circuit breaker.'
            }
          ],
          commonMistakes: ['Omitting request timeouts on inter-service HTTP calls, causing worker threads to hang forever until sockets deplete'],
          bestPractices: ['Always configure strict HTTP timeouts (< 3s) and wrap remote calls with circuit breakers'],
          summary: `API Gateways and Circuit Breakers provide fault isolation and prevent platform-wide cascading outages.`,
          resources: [{ title: 'Opossum Circuit Breaker Documentation', url: 'https://nodeshift.dev/opossum/', provider: 'NodeShift', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd18_q1',
                question: 'What happens when a Circuit Breaker enters the "Open" state after detecting high downstream failure rates?',
                options: [
                  'It stops sending traffic to the failing service and immediately executes a fallback response to protect the caller from hanging',
                  'It deletes all user sessions',
                  'It reboots the operating system',
                  'It sends double the requests'
                ],
                correctIndex: 0,
                topic: 'Circuit Breaker Open State',
                explanation: 'In the Open state, requests fail fast immediately without waiting for timeouts, allowing the downstream service time to recover.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure an Opossum Circuit Breaker',
            difficulty: 'Intermediate',
            problemStatement: 'Write the Opossum configuration options setting `timeout: 2000`, `errorThresholdPercentage: 50`, and `resetTimeout: 10000`.',
            instructions: 'Declare options object with timeout, errorThresholdPercentage, and resetTimeout.',
            requirements: ['{ timeout: 2000, errorThresholdPercentage: 50, resetTimeout: 10000 }'],
            starterCode: `const breakerOptions = {\n  // TODO: Options\n};`,
            solutionCode: `const breakerOptions = {\n  timeout: 2000,\n  errorThresholdPercentage: 50,\n  resetTimeout: 10000\n};`,
            hints: ['timeout: 2000, errorThresholdPercentage: 50, resetTimeout: 10000']
          }
        }
      ]
    },
    {
      title: 'Phase 7: Production Microservices Capstone',
      order: 7,
      lessons: [
        {
          lessonNumber: 19,
          title: 'Distributed Tracing with OpenTelemetry & Structured Logging (Pino)',
          description: 'Instrument distributed request tracing across microservices with OpenTelemetry, Jaeger, W3C TraceContext, and high-speed Pino logging.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Propagate W3C `traceparent` headers across distributed microservices',
            'Visualize distributed request waterfall traces in Jaeger / Zipkin',
            'Implement ultra-fast structured JSON logging with Pino'
          ],
          introduction: `When an incoming user request traverses 5 different microservices, debugging an error or latency spike requires distributed context propagation. OpenTelemetry injects a unique Trace ID that travels with the request across all network boundaries.`,
          deepDiveSections: [
            {
              title: 'W3C TraceContext & Distributed Spans',
              explanation: `How distributed tracing functions:
1. Client makes request: API Gateway generates a Root Trace ID (\`traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\`).
2. Header Propagation: When calling downstream microservices via HTTP or gRPC, the \`traceparent\` header is passed along.
3. Spans: Each microservice records a Span (timing duration for its specific work) tagged with the same Root Trace ID.
4. Visualization: Jaeger aggregates spans into a single visual waterfall diagram showing exact millisecond latencies for each service hop.`,
              keyPoint: 'W3C traceparent headers correlate logs and latency spans across all distributed microservice boundaries.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Pino Logger vs. Winston Logger',
            headers: ['Metric', 'Winston', 'Pino'],
            rows: [
              ['Throughput', '~30,000 logs / sec', '~150,000 logs / sec (Up to 5x faster)'],
              ['Overhead', 'Higher CPU overhead during serialization', 'Zero-overhead asynchronous logging'],
              ['Formatting', 'Flexible transports', 'High-performance JSON serialization by design']
            ]
          },
          coreConcepts: ['W3C TraceContext standard', 'OpenTelemetry SDK instrumentation', 'High-throughput Pino logging'],
          syntax: `// Fast Pino Logger with traceId correlation
const pino = require('pino');
const logger = pino({ level: 'info' });

logger.info({ traceId: req.headers['traceparent'], userId: '101' }, 'Processing order checkout');`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// OpenTelemetry Express Tracing Initialization (tracer.js)
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://jaeger:4318/v1/traces' }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();`,
              explanation: 'Automated OpenTelemetry tracing SDK exporting to Jaeger collector.'
            }
          ],
          commonMistakes: ['Generating new trace IDs in downstream microservices instead of extracting and propagating the incoming W3C traceparent header'],
          bestPractices: ['Propagate `traceparent` headers across all HTTP, gRPC, and RabbitMQ message payloads'],
          summary: `OpenTelemetry distributed tracing and Pino logging provide end-to-end observability across enterprise microservice stacks.`,
          resources: [{ title: 'OpenTelemetry Node.js Getting Started', url: 'https://opentelemetry.io/docs/languages/js/', provider: 'OpenTelemetry.io', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd19_q1',
                question: 'What is the purpose of propagating the W3C `traceparent` header across microservice HTTP calls?',
                options: [
                  'To correlate all distributed logs and execution spans across multiple servers under a single unified Trace ID',
                  'To bypass CORS verification',
                  'To compress HTTP payloads',
                  'To delete old traces'
                ],
                correctIndex: 0,
                topic: 'Distributed Tracing',
                explanation: '`traceparent` propagates the global Trace ID, enabling distributed tracing tools (like Jaeger) to stitch together the full request lifecycle.'
              }
            ]
          },
          practicalTask: {
            title: 'Log with Structured Pino Metadata',
            difficulty: 'Beginner',
            problemStatement: 'Write the statement to log an info message `"Order created"` with metadata `{ orderId: "ORD-123", latencyMs: 42 }` using `logger.info()`.',
            instructions: 'Use logger.info(metadata, message).',
            requirements: ['logger.info({ orderId: "ORD-123", latencyMs: 42 }, "Order created")'],
            starterCode: `logger.info(`,
            solutionCode: `logger.info({ orderId: 'ORD-123', latencyMs: 42 }, 'Order created');`,
            hints: ['logger.info({ orderId: "ORD-123", latencyMs: 42 }, "Order created");']
          }
        },
        {
          lessonNumber: 20,
          title: 'Building an Event-Driven Order Processing Microservice',
          description: 'Construct a complete event-driven order processing pipeline with SAGA distributed transaction patterns and RabbitMQ.',
          estimatedMinutes: 40,
          learningObjectives: [
            'Implement the SAGA Pattern (Choreography vs Orchestration) for distributed transactions',
            'Handle compensating transactions to roll back distributed state upon failures',
            'Guarantee idempotent event consumption to prevent duplicate processing'
          ],
          introduction: `Because microservices do not share a single database, standard ACID transactions cannot span multiple services. The SAGA Pattern manages distributed transactions as a sequence of local transactions, publishing events and executing Compensating Transactions to roll back state if any step fails.`,
          deepDiveSections: [
            {
              title: 'The SAGA Distributed Transaction Pattern',
              explanation: `How a SAGA handles an Order Checkout across 3 microservices:
1. Order Service: Creates order in \`PENDING\` status -> Emits \`OrderCreatedEvent\`.
2. Payment Service: Consumes event -> Charges credit card -> Emits \`PaymentProcessedEvent\`.
3. Inventory Service: Consumes event -> Attempts stock reservation.
• FAILURE CASE (Insufficient Stock): Inventory Service emits \`InventoryReservationFailedEvent\`.
• COMPENSATING TRANSACTION: Payment Service consumes the failure event and automatically REFUNDS the credit card! Order Service marks order as \`CANCELLED\`.`,
              keyPoint: 'The SAGA pattern achieves eventual consistency across microservices via automated compensating rollback actions.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: 2-Phase Commit (2PC) vs. SAGA Pattern',
            headers: ['Dimension', 'Two-Phase Commit (2PC)', 'SAGA Pattern (Compensating Events)'],
            rows: [
              ['Coordination', 'Synchronous blocking coordinator lock', 'Asynchronous event-driven choreography'],
              ['Availability & Scalability', 'Low (Blocks all nodes during commit phase)', 'High (Non-blocking local database transactions)'],
              ['Rollback Mechanism', 'Native database rollback', 'Compensating transactions (e.g. issue refund)']
            ]
          },
          coreConcepts: ['SAGA choreography vs orchestration', 'Compensating transactions', 'Idempotent event consumers'],
          syntax: `// Idempotent Event Consumer Pattern
async function handlePaymentEvent(event) {
  const isProcessed = await redis.get(\`processed_event:\${event.id}\`);
  if (isProcessed) return; // Ignore duplicate event

  await executePayment(event.data);
  await redis.set(\`processed_event:\${event.id}\`, '1', 'EX', 86400);
}`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Complete SAGA Event Handler in Node.js
async function handleInventoryFailure(event) {
  const { orderId, userId, amount } = event.data;
  console.log(\`Compensating transaction triggered for Order \${orderId}: Refunding \${amount}\`);
  
  // 1. Issue refund
  await paymentGateway.refund(userId, amount);
  
  // 2. Publish compensation completed event
  await publishEvent('order_events', {
    type: 'ORDER_COMPENSATION_COMPLETED',
    orderId,
    status: 'REFUNDED'
  });
}`,
              explanation: 'Compensating transaction handler restoring financial state upon inventory depletion.'
            }
          ],
          commonMistakes: ['Assuming message queues deliver messages exactly once; in distributed systems, network retries mean messages can arrive multiple times (At-Least-Once Delivery)'],
          bestPractices: ['Always implement idempotency checks on message consumers using event IDs'],
          summary: `The SAGA pattern and idempotent event processing guarantee distributed data consistency without blocking coordinators.`,
          resources: [{ title: 'Saga Pattern for Microservices', url: 'https://microservices.io/patterns/data/saga.html', provider: 'Microservices.io', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'nd20_q1',
                question: 'What is a "Compensating Transaction" in the SAGA microservices pattern?',
                options: [
                  'An explicit operation that undoes or reverses the effects of a previously committed local transaction when a downstream step fails',
                  'A transaction fee charged to users',
                  'A hardware upgrade',
                  'A SQL join'
                ],
                correctIndex: 0,
                topic: 'SAGA Compensating Transactions',
                explanation: 'When a distributed step fails, compensating transactions execute reverse actions (like refunding a charge) to restore data consistency.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement an Idempotency Check',
            difficulty: 'Intermediate',
            problemStatement: 'Write an async function `isEventDuplicate(eventId)` that returns `true` if `redis.get("event:" + eventId)` exists, and otherwise sets `"event:" + eventId` with `1` and a `3600` TTL returning `false`.',
            instructions: 'Use redis.get and redis.setex.',
            requirements: ['check redis.get("event:" + eventId)', 'setex("event:" + eventId, 3600, "1")', 'return boolean'],
            starterCode: `async function isEventDuplicate(redis, eventId) {\n  // TODO: Implement\n}`,
            solutionCode: `async function isEventDuplicate(redis, eventId) {\n  const exists = await redis.get('event:' + eventId);\n  if (exists) return true;\n  await redis.setex('event:' + eventId, 3600, '1');\n  return false;\n}`,
            hints: ['Check if key exists in redis; if not, store with setex and return false.']
          }
        },
        {
          lessonNumber: 21,
          title: 'Production Dockerization, Health Checks & Graceful Shutdowns',
          description: 'Capstone project: Deploy high-availability Node.js microservices with multi-stage Docker builds, Kubernetes readiness probes, and SIGTERM drain.',
          estimatedMinutes: 45,
          learningObjectives: [
            'Build hardened multi-stage Docker containers with non-root execution',
            'Configure Kubernetes/Docker liveness probes (`/health/live`) and readiness probes (`/health/ready`)',
            'Implement clean HTTP connection draining and database teardown upon SIGTERM'
          ],
          introduction: `Congratulations on reaching the final capstone lesson of Node.js & Express Microservices! In this lesson, we will package our microservices into production multi-stage Docker containers, configure deep health check endpoints, and implement zero-downtime graceful shutdown handlers.`,
          deepDiveSections: [
            {
              title: 'Liveness Probes vs. Readiness Probes',
              explanation: `Production container orchestrators probe two separate health states:
1. Liveness Probe (\`/health/live\`): Checks if the Node.js process is alive. If it fails, the container is restarted.
2. Readiness Probe (\`/health/ready\`): Checks if the microservice is ready to accept user traffic (verifies database connections, Redis socket status, and message broker links). If it fails, traffic is temporarily diverted without killing the container!`,
              keyPoint: 'Liveness probes detect deadlocks; Readiness probes verify database and cache dependencies before routing traffic.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Liveness Probe vs. Readiness Probe',
            headers: ['Probe Type', 'Endpoint', 'Verification Check', 'Action on Failure'],
            rows: [
              ['Liveness', '`/health/live`', 'Basic process heartbeat (Is event loop responsive?)', 'Kills and restarts the container'],
              ['Readiness', '`/health/ready`', 'Full dependency check (DB connected, Redis reachable)', 'Removes container from load balancer pool until healthy']
            ]
          },
          coreConcepts: ['Liveness vs Readiness health checks', 'Graceful SIGTERM connection draining', 'Production multi-stage container optimization'],
          syntax: `// Production Healthcheck Endpoints
app.get('/health/live', (req, res) => res.status(200).send('OK'));

app.get('/health/ready', async (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  const redisOk = redis.status === 'ready';
  if (dbOk && redisOk) return res.status(200).json({ status: 'ready' });
  return res.status(503).json({ status: 'degraded', dbOk, redisOk });
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Complete Graceful Shutdown Handler
function setupGracefulShutdown(server, connections) {
  const shutdown = async (signal) => {
    console.log(\`Received \${signal}. Starting graceful shutdown...\`);
    
    // 1. Stop accepting new HTTP requests
    server.close(async () => {
      console.log('HTTP server closed.');
      
      try {
        // 2. Close database and cache connections
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
        
        await redis.quit();
        console.log('Redis connection closed.');
        
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    // 3. Force exit if shutdown takes longer than 10s timeout
    setTimeout(() => {
      console.error('Forced shutdown due to timeout!');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}`,
              explanation: 'Comprehensive graceful shutdown draining HTTP connections and database sockets.'
            }
          ],
          commonMistakes: ['Calling `process.exit(0)` immediately on SIGTERM before closing active database transactions'],
          bestPractices: ['Always close HTTP servers first, await database socket closures, and set a 10s fallback timeout'],
          summary: `You have mastered Node.js & Express Microservices from V8 event loop internals to enterprise microservice orchestration and cloud container deployments!`,
          resources: [{ title: 'Production Node.js Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices', provider: 'GitHub', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'nd21_q1',
                question: 'What is the critical difference between a Kubernetes Liveness probe and a Readiness probe?',
                options: [
                  'A failed Liveness probe restarts the container, whereas a failed Readiness probe temporarily removes the container from the load balancer without killing it',
                  'Readiness probes only work on Sundays',
                  'Liveness probes format code',
                  'There is no difference'
                ],
                correctIndex: 0,
                topic: 'Container Probes',
                explanation: 'Liveness probes restart hung processes; Readiness probes check dependency health to avoid sending user traffic to initializing containers.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement a Readiness Probe Handler',
            difficulty: 'Intermediate',
            problemStatement: 'Write an Express GET `/health/ready` handler that returns `200` with `{ status: "ready" }` if `isDbConnected` is true, and `503` with `{ status: "unhealthy" }` otherwise.',
            instructions: 'Use isDbConnected to return 200 or 503.',
            requirements: ['if (isDbConnected) return res.status(200).json({ status: "ready" })', 'else return res.status(503).json({ status: "unhealthy" })'],
            starterCode: `app.get('/health/ready', (req, res) => {\n  // TODO: Check DB and return\n});`,
            solutionCode: `app.get('/health/ready', (req, res) => {\n  if (isDbConnected) {\n    return res.status(200).json({ status: 'ready' });\n  }\n  return res.status(503).json({ status: 'unhealthy' });\n});`,
            hints: ['if (isDbConnected) return res.status(200).json({ status: "ready" }); return res.status(503).json({ status: "unhealthy" });']
          }
        }
      ]
    }
  ]
}

module.exports = { nodeCurriculum }
