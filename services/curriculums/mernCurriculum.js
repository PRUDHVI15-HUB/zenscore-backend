/**
 * Full Stack MERN Architecture Master Curriculum
 * 7 Phases, 21 Comprehensive Engineering Lessons
 */

const mernCurriculum = {
  title: 'Full Stack MERN Architecture',
  category: 'Full Stack Web',
  description: 'Master MongoDB document design, Express REST microservices, React 18 component trees, Node.js event loops, and production MERN cloud deployments.',
  modules: [
    {
      title: 'Phase 1: Web & JavaScript Foundations',
      order: 1,
      lessons: [
        {
          lessonNumber: 1,
          title: 'Modern JavaScript ES6+ & V8 Execution Context',
          description: 'Master the V8 JavaScript engine, memory heap, call stack, execution contexts, lexical scoping, closures, and modern ES6+ features.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand V8 memory heap allocation and call stack execution frames',
            'Master lexical environment scoping, closures, and variable hoisting (var vs let/const)',
            'Utilize modern ES6+ destructuring, rest/spread operators, and optional chaining'
          ],
          introduction: `JavaScript is the foundational language of the MERN stack. To build robust full-stack systems, engineers must understand how the V8 engine executes code, creates execution contexts, manages the call stack, and handles closures in memory.`,
          deepDiveSections: [
            {
              title: 'The V8 Execution Context & Call Stack',
              explanation: `Every JavaScript script begins with a Global Execution Context (GEC). When a function is called, a new Function Execution Context (FEC) is pushed onto the Call Stack.
Each execution context contains:
1. Variable Environment: Stores variable declarations and function definitions during the Creation Phase.
2. Lexical Environment: Maintains references to parent outer environments for Scope Chain lookups.
3. \`this\` Binding: Dynamically determined at call time (or lexically via arrow functions).`,
              keyPoint: 'Closures are created when an inner function retains references to variables in its outer lexical scope even after the outer function has returned.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: var vs. let vs. const in V8 Memory',
            headers: ['Keyword', 'Scope', 'Hoisting Behavior', 'Reassignment'],
            rows: [
              ['var', 'Function scoped', 'Hoisted as `undefined`', 'Allowed (Can be re-declared)'],
              ['let', 'Block scoped ({})', 'Hoisted in Temporal Dead Zone (TDZ)', 'Allowed (Cannot re-declare in same scope)'],
              ['const', 'Block scoped ({})', 'Hoisted in Temporal Dead Zone (TDZ)', 'Immutable identifier binding']
            ]
          },
          coreConcepts: ['V8 Call Stack and Memory Heap', 'Lexical scope and closure mechanics', 'Temporal Dead Zone (TDZ)'],
          syntax: `// Modern ES6+ Syntax
const user = { id: 101, profile: { name: 'Alice', role: 'engineer' } };
const { profile: { name, role = 'developer' } } = user;
const clone = { ...user, active: true };
const roleUpper = user?.profile?.role?.toUpperCase();`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// High-performance memoized closure
function createRateLimiter(limit, windowMs) {
  const requests = new Map();
  return function isAllowed(ip) {
    const now = Date.now();
    const timestamps = requests.get(ip) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    if (validTimestamps.length >= limit) return false;
    validTimestamps.push(now);
    requests.set(ip, validTimestamps);
    return true;
  };
}`,
              explanation: 'A closure retaining the private `requests` Map across function calls.'
            }
          ],
          commonMistakes: ['Mutating object properties directly instead of using immutable spread operators in state managers'],
          bestPractices: ['Prefer `const` by default, use `let` only for mutating counters, and never use `var` in modern codebases'],
          summary: `Mastery of the V8 execution context, closures, and ES6+ immutability forms the foundation of modern full-stack development.`,
          resources: [{ title: 'MDN JavaScript Deep Dive', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', provider: 'MDN', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern1_q1',
                question: 'What happens when accessing a `let` or `const` variable before its line of declaration?',
                options: [
                  'A ReferenceError is thrown due to the Temporal Dead Zone (TDZ)',
                  'The variable returns undefined',
                  'The script reboots V8',
                  'The variable returns null'
                ],
                correctIndex: 0,
                topic: 'Temporal Dead Zone',
                explanation: '`let` and `const` variables are hoisted into a Temporal Dead Zone and cannot be accessed before their initialization.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement an Immutable Data Transformer',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `addRole(user, newRole)` that returns a new user object with `role: newRole` without mutating the original object using the spread operator.',
            instructions: 'Use the object spread operator to create and return the updated clone.',
            requirements: ['Return { ...user, role: newRole }', 'Do not mutate the original user object'],
            starterCode: `function addRole(user, newRole) {\n  // TODO: Return new object\n}`,
            solutionCode: `function addRole(user, newRole) {\n  return { ...user, role: newRole };\n}`,
            hints: ['Use return { ...user, role: newRole };']
          }
        },
        {
          lessonNumber: 2,
          title: 'Asynchronous JS: Event Loop, Promises & Async/Await',
          description: 'Deep dive into microtask vs macrotask queues, Promise state transitions, and async/await error propagation.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand the Event Loop, Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout)',
            'Master Promise.all, Promise.allSettled, and Promise.race patterns',
            'Handle asynchronous exceptions cleanly using try/catch and async/await'
          ],
          introduction: `JavaScript is single-threaded, meaning it has only one call stack. To perform non-blocking I/O operations (like database queries and HTTP calls), V8 relies on the Event Loop and asynchronous task queues.`,
          deepDiveSections: [
            {
              title: 'Microtasks vs. Macrotasks Execution Priority',
              explanation: `When the Call Stack becomes empty:
1. Microtask Queue (High Priority): Executes ALL queued microtasks (Promise.then callbacks, queueMicrotask, process.nextTick) until the queue is completely drained.
2. Macrotask Queue (Low Priority): Executes exactly ONE macrotask (setTimeout, setInterval, I/O callbacks).
3. The cycle repeats continuously. Microtasks ALWAYS preempt macrotasks!`,
              keyPoint: 'Promise callbacks in the microtask queue are executed before setTimeout callbacks in the macrotask queue.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Microtask Queue vs. Macrotask Queue',
            headers: ['Property', 'Microtask Queue', 'Macrotask Queue'],
            rows: [
              ['Sources', 'Promises (`.then`), queueMicrotask, MutationObserver', 'setTimeout, setInterval, setImmediate, I/O events'],
              ['Drain Frequency', 'Completely drained after every stack frame', 'One task processed per event loop tick'],
              ['Starvation Risk', 'Infinite microtask loops can freeze the browser/server', 'Safe from immediate execution starvation']
            ]
          },
          coreConcepts: ['Microtask queue precedence over macrotasks', 'Promise state lifecycle (Pending -> Fulfilled / Rejected)', 'Async/await syntactic sugar over Promises'],
          syntax: `// Promise concurrency utilities
const [users, products] = await Promise.all([
  fetchUsers(),
  fetchProducts()
]);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Safe parallel batch executor with error resilience
async function fetchDashboardData(userId) {
  const results = await Promise.allSettled([
    getUserProfile(userId),
    getUserGrades(userId),
    getUserNotifications(userId)
  ]);

  return {
    profile: results[0].status === 'fulfilled' ? results[0].value : null,
    grades: results[1].status === 'fulfilled' ? results[1].value : [],
    notifications: results[2].status === 'fulfilled' ? results[2].value : []
  };
}`,
              explanation: 'Uses Promise.allSettled so a failure in notifications does not break profile rendering.'
            }
          ],
          commonMistakes: ['Using `forEach` with an async callback, which executes calls concurrently without awaiting resolution'],
          bestPractices: ['Use `Promise.all` for parallel operations and `Promise.allSettled` when partial success is acceptable'],
          summary: `The Event Loop prioritizes the microtask queue, enabling high-concurrency non-blocking I/O across Node.js and browser applications.`,
          resources: [{ title: 'JavaScript Event Loop Visualized', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop', provider: 'MDN', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern2_q1',
                question: 'Which queue is processed first when the JavaScript call stack is empty?',
                options: [
                  'The Microtask Queue (Promise callbacks)',
                  'The Macrotask Queue (setTimeout callbacks)',
                  'The Rendering Pipeline',
                  'The Garbage Collector'
                ],
                correctIndex: 0,
                topic: 'Event Loop Queues',
                explanation: 'The Event Loop completely drains all pending jobs in the Microtask Queue before processing the next item from the Macrotask Queue.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement Parallel Data Fetcher with Promise.all',
            difficulty: 'Intermediate',
            problemStatement: 'Write an async function `loadUserAndPosts(fetchUser, fetchPosts)` that fetches user and posts concurrently using `Promise.all` and returns `{ user, posts }`.',
            instructions: 'Use Promise.all([fetchUser(), fetchPosts()]) and destructure the results.',
            requirements: ['Execute fetchUser() and fetchPosts() in parallel', 'Return an object with keys user and posts'],
            starterCode: `async function loadUserAndPosts(fetchUser, fetchPosts) {\n  // TODO: Fetch in parallel\n}`,
            solutionCode: `async function loadUserAndPosts(fetchUser, fetchPosts) {\n  const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);\n  return { user, posts };\n}`,
            hints: ['const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]); return { user, posts };']
          }
        },
        {
          lessonNumber: 3,
          title: 'HTTP Protocol, REST Architecture & Status Codes',
          description: 'Understand HTTP/1.1 vs HTTP/2, REST constraints, idempotency, HTTP headers, and proper status code selection.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Master HTTP methods (GET, POST, PUT, PATCH, DELETE) and idempotency principles',
            'Understand HTTP status code families (2xx, 3xx, 4xx, 5xx)',
            'Implement clean RESTful resource naming conventions'
          ],
          introduction: `HTTP is the communication protocol connecting the React frontend to the Express backend. Designing RESTful APIs requires understanding HTTP verbs, idempotency, caching headers, and semantic status codes.`,
          deepDiveSections: [
            {
              title: 'HTTP Method Idempotency & Semantics',
              explanation: `An HTTP method is IDEMPOTENT if executing it multiple times produces the exact same server state:
• GET / HEAD: Safe and Idempotent (Read-only).
• PUT: Idempotent (Complete resource replacement).
• DELETE: Idempotent (Deleting an already-deleted resource leaves the state unchanged).
• POST: NON-IDEMPOTENT (Calling multiple times creates multiple duplicate resources).
• PATCH: NON-IDEMPOTENT (Partial atomic modifications).`,
              keyPoint: 'PUT replaces the entire resource; PATCH applies partial field updates.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: HTTP Status Code Semantics',
            headers: ['Code', 'Category', 'Meaning', 'Correct Use Case'],
            rows: [
              ['200 OK', 'Success', 'Request succeeded', 'Standard GET, PUT, or PATCH response'],
              ['201 Created', 'Success', 'Resource created', 'Successful POST creation with Location header'],
              ['204 No Content', 'Success', 'Action completed, no body', 'Successful DELETE operation'],
              ['400 Bad Request', 'Client Error', 'Invalid payload / schema error', 'Zod validation failure'],
              ['401 Unauthorized', 'Client Error', 'Authentication missing/invalid', 'Missing or expired JWT token'],
              ['403 Forbidden', 'Client Error', 'Authenticated but lacks permission', 'User accessing admin route (RBAC)'],
              ['404 Not Found', 'Client Error', 'Resource does not exist', 'Invalid ID or non-existent endpoint'],
              ['500 Internal Error', 'Server Error', 'Unhandled backend crash', 'Database connection crash / uncaught exception']
            ]
          },
          coreConcepts: ['REST resource naming conventions (`/api/v1/users/:id/orders`)', 'Idempotency and safety', 'HTTP header caching (ETag, Cache-Control)'],
          syntax: `// Standard RESTful route pattern
GET    /api/v1/skills          -> List skills
POST   /api/v1/skills          -> Create skill
GET    /api/v1/skills/:id      -> Get skill
PATCH  /api/v1/skills/:id      -> Partial update
DELETE /api/v1/skills/:id      -> Remove skill`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Express REST controller with clean status codes
app.post('/api/v1/skills', async (req, res) => {
  const newSkill = await Skill.create(req.body);
  return res.status(201).json({ success: true, data: newSkill });
});

app.delete('/api/v1/skills/:id', async (req, res) => {
  await Skill.findByIdAndDelete(req.params.id);
  return res.status(204).send(); // 204 No Content
});`,
              explanation: 'Proper status code returns for creation (201) and deletion (204).'
            }
          ],
          commonMistakes: ['Returning HTTP 200 with `{ error: "Not found" }` inside the body instead of proper HTTP 404/400 status codes'],
          bestPractices: ['Always return semantic HTTP status codes matching RFC specifications'],
          summary: `Designing RESTful APIs with correct HTTP verbs and status codes ensures robust, predictable frontend integration.`,
          resources: [{ title: 'REST API Design Guide', url: 'https://restfulapi.net/', provider: 'REST API Tutorial', type: 'Article', difficulty: 'Beginner', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern3_q1',
                question: 'Which HTTP status code should be returned when an authenticated user attempts to access an admin-only endpoint without admin permissions?',
                options: [
                  '403 Forbidden',
                  '401 Unauthorized',
                  '404 Not Found',
                  '500 Internal Server Error'
                ],
                correctIndex: 0,
                topic: 'HTTP Status Codes',
                explanation: '401 indicates missing or invalid authentication; 403 Forbidden indicates the user is authenticated but lacks required permissions.'
              }
            ]
          },
          practicalTask: {
            title: 'Format a RESTful Response in Express',
            difficulty: 'Beginner',
            problemStatement: 'Write the Express response statement that sends a JSON response `{ success: true, data: user }` with HTTP status code `201 Created`.',
            instructions: 'Use res.status().json().',
            requirements: ['res.status(201).json({ success: true, data: user })'],
            starterCode: `return res.status()`,
            solutionCode: `return res.status(201).json({ success: true, data: user });`,
            hints: ['Use return res.status(201).json({ success: true, data: user });']
          }
        }
      ]
    },
    {
      title: 'Phase 2: React Frontend Architecture',
      order: 2,
      lessons: [
        {
          lessonNumber: 4,
          title: 'React Component Architecture & Virtual DOM',
          description: 'Understand JSX transpilation, React 18 Fiber reconciliation tree, render vs commit phases, and component purity.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand JSX transformation into React.createElement calls',
            'Master the Virtual DOM diffing algorithm and React 18 Fiber nodes',
            'Enforce pure component rendering without side effects during render phase'
          ],
          introduction: `React builds user interfaces using declarative, component-based architecture. Instead of directly manipulating the slow browser DOM, React maintains a lightweight Virtual DOM tree in memory and reconciles changes via the Fiber engine.`,
          deepDiveSections: [
            {
              title: 'The React 18 Fiber Reconciliation Engine',
              explanation: `React Fiber breaks rendering into two distinct phases:
1. Render Phase (Asynchronous / Interruptible): React traverses the Fiber tree, computes state updates, and calculates differences (diffing). This phase has NO side effects.
2. Commit Phase (Synchronous / Blocking): React applies the computed DOM mutations to the physical browser DOM in a single rapid batch, then runs layout effects and paint.`,
              keyPoint: 'The render phase calculates diffs in memory; the commit phase applies mutations to the real browser DOM.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Real DOM vs. React Virtual DOM',
            headers: ['Metric', 'Direct Real DOM Manipulation', 'React Virtual DOM (Fiber)'],
            rows: [
              ['Update Cost', 'Triggers expensive browser reflow & repaint per edit', 'Batches updates in memory before single DOM commit'],
              ['Diffing', 'Manual element traversal', 'Heuristic O(n) Fiber tree diffing'],
              ['Developer Model', 'Imperative (`document.createElement`)', 'Declarative state-driven JSX UI']
            ]
          },
          coreConcepts: ['Virtual DOM heuristic reconciliation', 'React Fiber node structure', 'Purity in render phase'],
          syntax: `// Declarative React Component
function UserBadge({ user }) {
  return (
    <div className="badge">
      <span>{user.name}</span>
      <span className="role">{user.role}</span>
    </div>
  );
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Pure React Component with conditional rendering
export default function SkillCard({ skill, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(skill.id)}
      className="p-4 rounded-xl border border-slate-200 hover:border-purple-500 transition-all cursor-pointer"
    >
      <h4 className="font-bold text-slate-900">{skill.title}</h4>
      <p className="text-sm text-slate-500 mt-1">{skill.description}</p>
      {skill.isCompleted && (
        <span className="mt-2 inline-block px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">
          Completed
        </span>
      )}
    </div>
  );
}`,
              explanation: 'Pure presentation component cleanly reacting to props.'
            }
          ],
          commonMistakes: ['Mutating props or external variables directly inside the component render body'],
          bestPractices: ['Keep component rendering pure; place all side effects (API calls, timers) inside useEffect'],
          summary: `React Fiber optimizes UI performance by calculating component diffs in memory and batching updates to the real DOM.`,
          resources: [{ title: 'React Official Documentation', url: 'https://react.dev/learn', provider: 'React.dev', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern4_q1',
                question: 'What is the primary purpose of keys when rendering lists in React?',
                options: [
                  'Helps the Fiber reconciliation algorithm identify which items have changed, been added, or removed',
                  'Encrypts list data for security',
                  'Sorts the list alphabetically',
                  'Binds CSS classes to DOM nodes'
                ],
                correctIndex: 0,
                topic: 'React Keys & Reconciliation',
                explanation: 'Keys provide stable identities for list elements, allowing Fiber to reuse existing DOM nodes rather than recreating the entire list.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Pure Functional Component',
            difficulty: 'Beginner',
            problemStatement: 'Write a React functional component `StatusBadge({ isOnline })` that renders `<span className="online">Active</span>` if `isOnline` is true, and `<span className="offline">Offline</span>` otherwise.',
            instructions: 'Use ternary conditional rendering inside the component.',
            requirements: ['Render span with className online when true', 'Render span with className offline when false'],
            starterCode: `export default function StatusBadge({ isOnline }) {\n  // TODO: Return conditional span\n}`,
            solutionCode: `export default function StatusBadge({ isOnline }) {\n  return isOnline ? (\n    <span className="online">Active</span>\n  ) : (\n    <span className="offline">Offline</span>\n  );\n}`,
            hints: ['return isOnline ? <span className="online">Active</span> : <span className="offline">Offline</span>;']
          }
        },
        {
          lessonNumber: 5,
          title: 'React State, Props & Unidirectional Data Flow',
          description: 'Master useState, controlled vs uncontrolled inputs, state lifting, and unidirectional data flow architecture.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Manage local component state with useState and functional state updaters',
            'Implement controlled form inputs with two-way synchronization',
            'Lift state up to common ancestors to synchronize sibling components'
          ],
          introduction: `React enforces a strict Unidirectional Data Flow: data flows down via props, and events flow up via callback functions. This makes state transitions predictable and easy to debug.`,
          deepDiveSections: [
            {
              title: 'Asynchronous State Batching & Functional Updaters',
              explanation: `React 18 batches multiple state updates automatically inside event handlers, promises, and timeouts.
When updating state based on previous state:
\`setCount(prev => prev + 1)\`
Always use a functional updater function rather than \`setCount(count + 1)\` to prevent stale closure race conditions!`,
              keyPoint: 'Use functional state updaters (`setState(prev => ... )`) to prevent stale closure bugs.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Props vs. State in React',
            headers: ['Dimension', 'Props', 'State'],
            rows: [
              ['Ownership', 'Passed down from parent component', 'Managed internally by the component'],
              ['Mutability', 'Read-only / Immutable to child', 'Mutable via `setState` function'],
              ['Trigger', 'Parent re-render triggers new props', 'Calling `setState` triggers component re-render']
            ]
          },
          coreConcepts: ['Unidirectional data flow', 'Automatic batching in React 18', 'Controlled form components'],
          syntax: `// Functional state updater
const [count, setCount] = useState(0);
setCount(prev => prev + 1);`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Controlled Search Form Component
import React, { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search engineering skills..."
        className="px-3 py-2 border rounded-lg flex-1"
      />
      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">
        Search
      </button>
    </form>
  );
}`,
              explanation: 'Controlled input syncing React state with DOM input values.'
            }
          ],
          commonMistakes: ['Mutating state arrays/objects directly with `state.push()` instead of `[...state, newItem]`'],
          bestPractices: ['Always treat React state as immutable and pass callback functions up to modify state in parent components'],
          summary: `Unidirectional data flow and controlled inputs maintain predictable state synchronization across React component trees.`,
          resources: [{ title: 'Managing State in React', url: 'https://react.dev/learn/managing-state', provider: 'React.dev', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern5_q1',
                question: 'Why should you use `setCount(prev => prev + 1)` instead of `setCount(count + 1)` when incrementing state multiple times consecutively?',
                options: [
                  'Because React batches state updates, and functional updaters guarantee access to the latest pending state',
                  'Because setCount(count + 1) crashes the browser',
                  'Because functional updaters bypass re-rendering',
                  'There is no difference'
                ],
                correctIndex: 0,
                topic: 'Functional State Updaters',
                explanation: 'Functional updaters receive the pending state value, ensuring that rapid consecutive state updates do not overwrite each other.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement a Toggle Switch Component',
            difficulty: 'Beginner',
            problemStatement: 'Write a React component `Toggle({ initial = false })` with local boolean state `isOn` that toggles between `true` and `false` when a button is clicked.',
            instructions: 'Use useState and a button onClick handler.',
            requirements: ['useState boolean initialized to initial', 'button toggling state via setIsOn(prev => !prev)'],
            starterCode: `import React, { useState } from 'react';\n\nexport default function Toggle({ initial = false }) {\n  // TODO: Implement toggle\n}`,
            solutionCode: `import React, { useState } from 'react';\n\nexport default function Toggle({ initial = false }) {\n  const [isOn, setIsOn] = useState(initial);\n  return (\n    <button onClick={() => setIsOn(prev => !prev)}>\n      {isOn ? 'ON' : 'OFF'}\n    </button>\n  );\n}`,
            hints: ['const [isOn, setIsOn] = useState(initial); toggle via onClick={() => setIsOn(prev => !prev)}']
          }
        },
        {
          lessonNumber: 6,
          title: 'Advanced React Hooks: useEffect, useMemo, useCallback & Custom Hooks',
          description: 'Master dependency arrays, cleanup functions, memoization techniques, and extracting reusable custom hooks.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand useEffect lifecycle, dependency arrays, and unmount cleanup functions',
            'Optimize expensive computations with useMemo and callback identity with useCallback',
            'Design and extract production-grade custom React hooks'
          ],
          introduction: `Hooks allow functional components to hook into React state and lifecycle features. Using useEffect for synchronization, useMemo/useCallback for performance, and custom hooks for code reusability is essential for senior frontend engineering.`,
          deepDiveSections: [
            {
              title: 'useEffect Lifecycle & AbortController Cleanup',
              explanation: `When fetching data inside \`useEffect\`, network race conditions can occur if the user navigates away or parameters change before the request resolves.
Always attach an \`AbortController\` cleanup function:
\`\`\`javascript
useEffect(() => {
  const controller = new AbortController();
  fetchData(id, { signal: controller.signal });
  return () => controller.abort(); // Cleans up on unmount or id change
}, [id]);
\`\`\``,
              keyPoint: 'Always return a cleanup function in useEffect to cancel pending network requests and clear event listeners.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: useMemo vs. useCallback',
            headers: ['Hook', 'What It Returns', 'Primary Purpose', 'When to Use'],
            rows: [
              ['useMemo', 'Memoized calculated value', 'Avoids re-running heavy computations on re-render', 'Expensive filtering/sorting of large arrays'],
              ['useCallback', 'Memoized function reference', 'Prevents function recreation on re-render', 'Passing callbacks to memoized child components']
            ]
          },
          coreConcepts: ['Cleanup phase in useEffect', 'Referential equality with useCallback', 'Custom hook encapsulation'],
          syntax: `// Custom Hook Pattern
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Production custom hook for API data fetching
import { useState, useEffect } from 'react';

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(err => {
        if (err.name !== 'AbortError') { setError(err); setLoading(false); }
      });

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}`,
              explanation: 'Encapsulated data fetching hook with automated cancellation.'
            }
          ],
          commonMistakes: ['Omitting variables used inside useEffect from the dependency array, causing stale closure bugs'],
          bestPractices: ['Always include all reactive values in hook dependency arrays and use the ESLint react-hooks plugin'],
          summary: `Correct hook dependency management and custom hook extraction create clean, high-performance React component trees.`,
          resources: [{ title: 'Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects', provider: 'React.dev', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern6_q1',
                question: 'What is the return value of a cleanup function inside a `useEffect` hook used for?',
                options: [
                  'It runs before the effect re-runs and when the component unmounts to cancel subscriptions and timers',
                  'It returns the JSX template to render',
                  'It deletes the component from localStorage',
                  'It reloads the page'
                ],
                correctIndex: 0,
                topic: 'useEffect Cleanup',
                explanation: 'The function returned from useEffect executes upon component unmount or before re-executing the effect when dependencies change.'
              }
            ]
          },
          practicalTask: {
            title: 'Build a Custom useWindowSize Hook',
            difficulty: 'Intermediate',
            problemStatement: 'Write a custom hook `useWindowWidth()` that tracks and returns the current `window.innerWidth` in state, updating on the browser `resize` event with a proper cleanup listener.',
            instructions: 'Use useState, useEffect, window.addEventListener("resize"), and window.removeEventListener("resize").',
            requirements: ['Initialize state with window.innerWidth', 'Listen to resize and removeListener on cleanup', 'Return the width number'],
            starterCode: `import { useState, useEffect } from 'react';\n\nexport function useWindowWidth() {\n  // TODO: Implement custom hook\n}`,
            solutionCode: `import { useState, useEffect } from 'react';\n\nexport function useWindowWidth() {\n  const [width, setWidth] = useState(window.innerWidth);\n  useEffect(() => {\n    const handleResize = () => setWidth(window.innerWidth);\n    window.addEventListener('resize', handleResize);\n    return () => window.removeEventListener('resize', handleResize);\n  }, []);\n  return width;\n}`,
            hints: ['Add resize event listener and return cleanup function removing the listener.']
          }
        },
        {
          lessonNumber: 7,
          title: 'Client-Side Routing & REST API Integration',
          description: 'Build single-page application routing with React Router DOM v6, nested routes, route loaders, and Axios/Fetch interceptors.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Configure React Router DOM v6 with nested layout routes and dynamic params (:id)',
            'Implement protected route guards for authentication redirection',
            'Configure centralized API client interceptors with automatic Bearer token injection'
          ],
          introduction: `Single Page Applications render dynamic views without browser page reloads. React Router DOM manages URL routing on the client, while centralized API clients handle authentication headers and error interceptors.`,
          deepDiveSections: [
            {
              title: 'Protected Route Wrapper Architecture',
              explanation: `A Protected Route component guards private views:
1. Reads auth state from \`AuthContext\`.
2. If loading, renders a spinner skeleton.
3. If unauthenticated, returns \`<Navigate to="/login" replace state={{ from: location }} />\`.
4. If authenticated, renders the child route via \`<Outlet />\`.`,
              keyPoint: 'Protected route wrappers prevent unauthenticated access and preserve the redirect URL after login.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Browser Navigation vs. Client-Side Routing',
            headers: ['Action', 'Traditional Multi-Page App', 'React Router Single Page App'],
            rows: [
              ['Page Transition', 'Full HTML reload from server', 'Instant component swap in memory'],
              ['State Retention', 'All JavaScript state is reset on reload', 'Global state persists across route transitions'],
              ['Bandwidth Usage', 'Downloads full HTML/CSS on every click', 'Fetches only raw JSON data payloads']
            ]
          },
          coreConcepts: ['Client-side URL routing', 'Protected Route guards with `<Outlet />`', 'Centralized API interceptor token injection'],
          syntax: `// React Router Route definition
<Routes>
  <Route path="/" element={<AppLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="skills/:skillId" element={<SkillDetail />} />
  </Route>
</Routes>`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Protected Route Guard Component
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-center">Authenticating...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}`,
              explanation: 'Production route guard redirecting unauthenticated visitors to login.'
            }
          ],
          commonMistakes: ['Using standard `<a href="...">` anchor tags which trigger full page reloads instead of `<Link to="...">`'],
          bestPractices: ['Always use `<Link>` and `<NavLink>` from `react-router-dom` to preserve SPA client state'],
          summary: `React Router DOM enables seamless client-side page transitions with declarative route guards and nested layout hierarchies.`,
          resources: [{ title: 'React Router Official Documentation', url: 'https://reactrouter.com/en/main', provider: 'React Router', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern7_q1',
                question: 'What is the function of the `<Outlet />` component in React Router DOM v6?',
                options: [
                  'Renders the matched child route component inside a parent layout route',
                  'Outputs text to the terminal',
                  'Creates a WebSocket connection',
                  'Deletes inactive routes'
                ],
                correctIndex: 0,
                topic: 'React Router Outlet',
                explanation: '`<Outlet />` acts as a placeholder inside parent layout routes where child route components are dynamically injected.'
              }
            ]
          },
          practicalTask: {
            title: 'Extract URL Route Parameters with useParams',
            difficulty: 'Beginner',
            problemStatement: 'Write a React component `SkillPage()` that extracts the `skillId` parameter from the URL using `useParams()` and renders `<h2>Skill ID: {skillId}</h2>`.',
            instructions: 'Import useParams from react-router-dom and extract skillId.',
            requirements: ['const { skillId } = useParams()', 'render <h2>Skill ID: {skillId}</h2>'],
            starterCode: `import React from 'react';\nimport { useParams } from 'react-router-dom';\n\nexport default function SkillPage() {\n  // TODO: Extract param and render\n}`,
            solutionCode: `import React from 'react';\nimport { useParams } from 'react-router-dom';\n\nexport default function SkillPage() {\n  const { skillId } = useParams();\n  return <h2>Skill ID: {skillId}</h2>;\n}`,
            hints: ['const { skillId } = useParams(); return <h2>Skill ID: {skillId}</h2>;']
          }
        }
      ]
    },
    {
      title: 'Phase 3: Node.js & Express Backend Engineering',
      order: 3,
      lessons: [
        {
          lessonNumber: 8,
          title: 'Node.js Runtime, libuv & Non-Blocking I/O',
          description: 'Understand the V8 C++ engine, libuv event loop phases, thread pool workers, and asynchronous streams.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand how libuv delegates I/O to the operating system kernel via epoll/kqueue',
            'Master the 6 Event Loop phases (Timers, Pending, Idle/Prepare, Poll, Check, Close)',
            'Process large datasets efficiently using Node.js Buffers and Streams'
          ],
          introduction: `Node.js is an open-source, cross-platform JavaScript runtime built on Chrome's V8 engine and the libuv C library. It uses an event-driven, non-blocking I/O model that makes it lightweight and efficient for building high-throughput web servers.`,
          deepDiveSections: [
            {
              title: 'Libuv Event Loop Architecture & Phases',
              explanation: `Libuv manages asynchronous operations via 6 distinct phases:
1. Timers: Executes callbacks scheduled by \`setTimeout\` and \`setInterval\`.
2. Pending Callbacks: Executes I/O callbacks deferred from the previous loop iteration.
3. Idle, Prepare: Internal libuv house-keeping.
4. Poll: Retrieves new I/O events from the OS kernel and executes I/O related callbacks.
5. Check: Executes callbacks registered by \`setImmediate\`.
6. Close Callbacks: Executes socket close handlers (\`socket.on('close')\`).`,
              keyPoint: 'setImmediate executes in the Check phase; setTimeout executes in the Timers phase.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Multi-Threaded Server (Java/Apache) vs. Event Loop (Node.js)',
            headers: ['Metric', 'Multi-Threaded (1 Thread per Request)', 'Node.js Non-Blocking Event Loop'],
            rows: [
              ['Concurrency Model', 'Spawns OS thread per client (heavy memory)', 'Single thread + asynchronous kernel polling'],
              ['Memory Overhead', '~2 MB stack RAM per concurrent user', '~2 KB heap memory per active connection'],
              ['10k Connections', 'Requires 20 GB RAM; context switching bottleneck', 'Handles 10k connections with ~50 MB RAM'],
              ['Best For', 'Heavy CPU bound math / image processing', 'High-throughput I/O bound APIs & microservices']
            ]
          },
          coreConcepts: ['libuv thread pool (`UV_THREADPOOL_SIZE`)', 'Non-blocking I/O multiplexing with epoll/kqueue', 'Stream piping (`readable.pipe(writable)`)'],
          syntax: `// Streaming large files without memory spikes
const fs = require('fs');
const readStream = fs.createReadStream('./large-log.txt');
readStream.pipe(res);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Stream-based file transformation in Node.js
const fs = require('fs');
const zlib = require('zlib');

function compressLogFile(sourcePath, destPath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(sourcePath)
      .pipe(zlib.createGzip())
      .pipe(fs.createWriteStream(destPath))
      .on('finish', resolve)
      .on('error', reject);
  });
}`,
              explanation: 'Streams data chunk-by-chunk with zero memory bloat.'
            }
          ],
          commonMistakes: ['Executing synchronous blocking methods like `fs.readFileSync` inside Express route handlers, blocking the entire server for all users'],
          bestPractices: ['Always use asynchronous non-blocking APIs (`fs.promises`, async/await) in server request pipelines'],
          summary: `Node.js leverages libuv non-blocking I/O to achieve massive concurrency with minimal memory overhead.`,
          resources: [{ title: 'Node.js Event Loop Guide', url: 'https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick', provider: 'Nodejs.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern8_q1',
                question: 'Why does executing `fs.readFileSync()` inside an Express route handler degrade backend performance?',
                options: [
                  'Because Node.js runs on a single main thread, and synchronous I/O blocks all incoming user requests until the file finishes reading',
                  'Because it deletes the file from disk',
                  'Because V8 crashes on synchronous code',
                  'Because it requires root permissions'
                ],
                correctIndex: 0,
                topic: 'Non-Blocking I/O',
                explanation: 'Synchronous operations block the single main execution thread, preventing the Event Loop from processing any other user requests.'
              }
            ]
          },
          practicalTask: {
            title: 'Create an Asynchronous Stream Pipeline',
            difficulty: 'Intermediate',
            problemStatement: 'Write a Node.js snippet using `fs.createReadStream("input.txt")` and pipe it directly to `res`.',
            instructions: 'Use createReadStream and .pipe(res).',
            requirements: ['fs.createReadStream("input.txt").pipe(res)'],
            starterCode: `const fs = require('fs');\nfunction streamFile(res) {\n  // TODO: Pipe stream\n}`,
            solutionCode: `const fs = require('fs');\nfunction streamFile(res) {\n  fs.createReadStream('input.txt').pipe(res);\n}`,
            hints: ['fs.createReadStream("input.txt").pipe(res);']
          }
        },
        {
          lessonNumber: 9,
          title: 'Express REST API Design & Controller-Service Pattern',
          description: 'Structure scalable Express APIs using the Controller-Service-Repository pattern and router modularization.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Structure scalable backend codebases using the 3-tier Controller-Service pattern',
            'Modularize routing using `express.Router()`',
            'Decouple business logic from HTTP transport protocols'
          ],
          introduction: `Putting all database queries and business logic directly inside Express route handlers results in unmaintainable "fat controllers". The Controller-Service-Repository pattern separates HTTP request handling, business business rules, and database queries into dedicated layers.`,
          deepDiveSections: [
            {
              title: 'The Controller-Service-Repository Pattern',
              explanation: `A clean 3-tier backend architecture:
1. Router Layer: Declares endpoints and middleware (\`routes/skillsRoutes.js\`).
2. Controller Layer: Extracts HTTP inputs (\`req.body\`, \`req.params\`), calls the service, and sends the response (\`controllers/skillsController.js\`).
3. Service Layer: Contains core business logic, validation algorithms, and orchestrates database models (\`services/skillsService.js\`).`,
              keyPoint: 'Controllers handle HTTP transport; Services handle pure business logic.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Monolithic Route Handler vs. Controller-Service Pattern',
            headers: ['Aspect', 'Monolithic Route Handler', 'Controller-Service Architecture'],
            rows: [
              ['Testability', 'Difficult (Requires mock HTTP requests)', 'Easy (Pure unit testing of service methods)'],
              ['Reusability', 'Logic locked inside Express route', 'Service can be called from CLI, WebSockets, or cron jobs'],
              ['Maintainability', 'Complex, messy, high cognitive load', 'Clean separation of concerns and single responsibility']
            ]
          },
          coreConcepts: ['Controller-Service-Repository pattern', 'Router modularization with `express.Router()`', 'Dependency injection'],
          syntax: `// Express Router Modularization
const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skillsController');

router.get('/', skillsController.getAllSkills);
router.post('/', skillsController.createSkill);
module.exports = router;`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Clean Service Layer Implementation
class SkillsService {
  static async getSkillWithProgress(skillId, userId) {
    const skill = await Skill.findById(skillId).lean();
    if (!skill) throw { status: 404, message: 'Skill not found' };
    const progress = await UserSkillProgress.findOne({ user: userId, skill: skillId }).lean();
    return { ...skill, progress: progress?.completionPercentage || 0 };
  }
}`,
              explanation: 'Pure service layer class independent of Express req/res objects.'
            }
          ],
          commonMistakes: ['Passing Express `req` and `res` objects directly into business service functions'],
          bestPractices: ['Extract plain parameters in controllers and pass only clean data primitives to services'],
          summary: `The Controller-Service pattern ensures modular, maintainable, and unit-testable backend architectures.`,
          resources: [{ title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', provider: 'Expressjs.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern9_q1',
                question: 'In the Controller-Service architectural pattern, which layer is responsible for pure business logic and calculations?',
                options: [
                  'The Service Layer',
                  'The Controller Layer',
                  'The Router Layer',
                  'The Middleware Layer'
                ],
                correctIndex: 0,
                topic: 'Service Layer Responsibility',
                explanation: 'The Service layer encapsulates business logic, while Controllers handle HTTP parsing and response status codes.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Modular Express Router',
            difficulty: 'Beginner',
            problemStatement: 'Write the boilerplate for an Express Router that handles `GET /` by returning `{ status: "ok" }` and exports the router.',
            instructions: 'Use express.Router(), router.get(), and module.exports.',
            requirements: ['const router = express.Router()', 'router.get("/", (req, res) => res.json({ status: "ok" }))', 'module.exports = router'],
            starterCode: `const express = require('express');\n// TODO: Implement router\n`,
            solutionCode: `const express = require('express');\nconst router = express.Router();\nrouter.get('/', (req, res) => res.json({ status: 'ok' }));\nmodule.exports = router;`,
            hints: ['Create router via express.Router(), attach GET handler, and export.']
          }
        },
        {
          lessonNumber: 10,
          title: 'Express Middleware, Request Validation & Centralized Error Handling',
          description: 'Build custom middleware pipelines, validate payloads with Zod, and implement global error handlers.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand Express middleware execution order and next() propagation',
            'Validate incoming request bodies using Zod schemas',
            'Implement centralized 4-argument error handling middleware `(err, req, res, next)`'
          ],
          introduction: `Middleware functions are functions that have access to the request object (\`req\`), response object (\`res\`), and the \`next\` function in the application’s request-response cycle. Structuring middleware pipelines ensures consistent validation, logging, and error handling.`,
          deepDiveSections: [
            {
              title: 'Centralized 4-Argument Error Middleware',
              explanation: `Express identifies error-handling middleware by its exact 4-argument signature: \`(err, req, res, next)\`.
When an error is thrown or passed via \`next(err)\`:
1. Express bypasses all regular route handlers.
2. Jumps directly to the error-handling middleware.
3. Formats a structured JSON error response with appropriate HTTP status codes and sanitized error messages.`,
              keyPoint: 'Error middleware MUST declare exactly 4 arguments `(err, req, res, next)` for Express to recognize it.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Ad-Hoc try/catch vs. Centralized Error Middleware',
            headers: ['Metric', 'Scattered try/catch per Route', 'Centralized Error Handling'],
            rows: [
              ['Code Duplication', 'High (Repeated 500 error handlers everywhere)', 'Zero (Single global handler)'],
              ['Response Consistency', 'Inconsistent JSON shapes across routes', 'Guaranteed uniform `{ success: false, error }` schema'],
              ['Logging & Alerts', 'Manual logging in every file', 'Single point for Sentry / Winston error telemetry']
            ]
          },
          coreConcepts: ['Middleware execution pipeline', 'Schema validation with Zod / Joi', 'Global 4-argument error handler'],
          syntax: `// Global Express Error Middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Zod Request Validation Middleware
const { z } = require('zod');

const createSkillSchema = z.object({
  name: z.string().min(3).max(100),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  estimatedHours: z.number().positive()
});

const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ success: false, errors: error.errors });
  }
};`,
              explanation: 'Reusable Zod validation middleware intercepting invalid request bodies.'
            }
          ],
          commonMistakes: ['Forgetting to call `next()` inside custom middleware, leaving client requests hanging indefinitely'],
          bestPractices: ['Always wrap async route handlers with an async wrapper or express-async-errors to forward exceptions automatically'],
          summary: `Clean middleware pipelines and centralized error handlers guarantee robust API validation and consistent error responses.`,
          resources: [{ title: 'Writing Express Middleware', url: 'https://expressjs.com/en/guide/writing-middleware.html', provider: 'Expressjs.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern10_q1',
                question: 'How does Express distinguish regular middleware from error-handling middleware?',
                options: [
                  'By checking if the middleware function declares exactly 4 arguments: (err, req, res, next)',
                  'By checking the filename',
                  'By using a special app.error() method',
                  'By looking for a try/catch block'
                ],
                correctIndex: 0,
                topic: 'Express Error Middleware Signature',
                explanation: 'Express inspects function arity (Function.length). Declaring exactly 4 arguments registers the function as an error handler.'
              }
            ]
          },
          practicalTask: {
            title: 'Write a Global Express Error Handler',
            difficulty: 'Intermediate',
            problemStatement: 'Write the 4-argument Express error middleware `(err, req, res, next)` that returns JSON `{ success: false, error: err.message }` with status `err.status || 500`.',
            instructions: 'Declare the 4 arguments and return res.status().json().',
            requirements: ['4 parameters: err, req, res, next', 'res.status(err.status || 500).json({ success: false, error: err.message })'],
            starterCode: `function errorHandler(err, req, res, next) {\n  // TODO: Send error response\n}`,
            solutionCode: `function errorHandler(err, req, res, next) {\n  const status = err.status || 500;\n  return res.status(status).json({ success: false, error: err.message });\n}`,
            hints: ['const status = err.status || 500; return res.status(status).json({ success: false, error: err.message });']
          }
        }
      ]
    },
    {
      title: 'Phase 4: MongoDB & Data Layer',
      order: 4,
      lessons: [
        {
          lessonNumber: 11,
          title: 'MongoDB BSON Model & Document Database Fundamentals',
          description: 'Understand the BSON binary JSON protocol, flexible schemas, document size limits (16MB), and MongoDB Atlas clustering.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand BSON data types (ObjectId, ISODate, Decimal128, Binary)',
            'Master the 16MB document size limit and BSON serialization',
            'Navigate MongoDB Atlas clusters, collections, and databases'
          ],
          introduction: `MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like BSON (Binary JSON) documents. Unlike tabular SQL databases with rigid schemas and expensive foreign key joins, MongoDB enables rich nested documents and rapid schema evolution.`,
          deepDiveSections: [
            {
              title: 'BSON Data Format & ObjectId Structure',
              explanation: `BSON extends JSON with additional data types like dates, binary data, and 64-bit integers.
Every document receives a unique 12-byte \`_id\` (ObjectId) composed of:
• 4 bytes: Unix timestamp (creation time).
• 5 bytes: Random value unique to machine and process.
• 3 bytes: Incremental counter starting at a random value.`,
              keyPoint: 'ObjectIds are sortable by creation time because their first 4 bytes encode a Unix timestamp.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: JSON vs. BSON',
            headers: ['Feature', 'Standard JSON', 'MongoDB BSON'],
            rows: [
              ['Format', 'Human-readable text string', 'Binary encoded byte stream'],
              ['Date Support', 'String only (e.g. ISO 8601 string)', 'Native 64-bit UTC DateTime integer'],
              ['Parsing Speed', 'Requires text lexical parsing', 'Fast binary traversal with length prefixes'],
              ['Size Limit', 'Arbitrary', 'Strict 16 MB maximum per document']
            ]
          },
          coreConcepts: ['BSON 12-byte ObjectId structure', '16MB single document limit', 'Embedded subdocuments vs references'],
          syntax: `# MongoDB Shell CRUD Commands
db.skills.insertOne({ name: "Docker", difficulty: "Intermediate" })
db.skills.find({ difficulty: "Intermediate" }).limit(10)
db.skills.updateOne({ name: "Docker" }, { $set: { hours: 25 } })
db.skills.deleteOne({ name: "Docker" })`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// MongoDB BSON Document structure
{
  "_id": ObjectId("665b12a8e4b0c7d4a1b2c3d4"),
  "name": "Full Stack MERN Architecture",
  "category": "Full Stack Web",
  "tags": ["React", "Node", "MongoDB", "Express"],
  "stats": {
    "enrolledStudents": 1420,
    "rating": 4.9
  },
  "createdAt": ISODate("2026-06-01T10:00:00.000Z")
}`,
              explanation: 'Typical MongoDB BSON document with nested subdocuments and arrays.'
            }
          ],
          commonMistakes: ['Designing unbounded growing arrays inside a document that eventually breach the 16MB BSON limit'],
          bestPractices: ['Embed data that is queried together; reference data that grows unbounded over time'],
          summary: `MongoDB BSON documents provide high-speed binary serialization and native support for rich data types.`,
          resources: [{ title: 'MongoDB BSON Specification', url: 'https://bsonspec.org/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern11_q1',
                question: 'What is the maximum allowed size for a single BSON document in MongoDB?',
                options: ['16 Megabytes (16 MB)', '64 Kilobytes (64 KB)', '1 Gigabyte (1 GB)', 'Unlimited'],
                correctIndex: 0,
                topic: 'BSON Document Limits',
                explanation: 'MongoDB enforces a strict 16MB limit per document to prevent excessive RAM consumption and guarantee high throughput.'
              }
            ]
          },
          practicalTask: {
            title: 'Query Documents with MongoDB Shell Syntax',
            difficulty: 'Beginner',
            problemStatement: 'Write the MongoDB query to find all documents in the `skills` collection where `category` is `"Cloud"` and sort them by `estimatedHours` descending (-1).',
            instructions: 'Use db.skills.find().sort().',
            requirements: ['db.skills.find({ category: "Cloud" }).sort({ estimatedHours: -1 })'],
            starterCode: `db.skills.find()`,
            solutionCode: `db.skills.find({ category: "Cloud" }).sort({ estimatedHours: -1 })`,
            hints: ['db.skills.find({ category: "Cloud" }).sort({ estimatedHours: -1 })']
          }
        },
        {
          lessonNumber: 12,
          title: 'Mongoose Schemas, Models & Validation Rules',
          description: 'Define strictly-typed Mongoose schemas, virtuals, custom validators, pre/post middleware hooks, and population.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Define strictly-typed Mongoose schemas with custom validators',
            'Implement pre-save middleware hooks for password hashing',
            'Utilize Mongoose virtual fields and populate references across collections'
          ],
          introduction: `Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It provides schema validation, type casting, business logic hooks, and query building to ensure data integrity across your application.`,
          deepDiveSections: [
            {
              title: 'Mongoose Middleware Hooks (Pre/Post)',
              explanation: `Mongoose middleware intercepts operations at the document or query level:
• \`pre('save')\`: Runs before document insertion (e.g. hashing passwords with bcrypt).
• \`pre('findOneAndUpdate')\`: Runs before updates (e.g. updating a \`updatedAt\` timestamp).
• \`post('save')\`: Runs after persistence (e.g. sending a welcome email).`,
              keyPoint: 'Pre-save hooks enable automated validation, data sanitation, and hashing prior to database writes.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Native MongoDB Driver vs. Mongoose ODM',
            headers: ['Feature', 'Native MongoDB Driver', 'Mongoose ODM'],
            rows: [
              ['Schema Enforcement', 'Schema-less (Any JSON allowed)', 'Strict schema typing and casting'],
              ['Validation', 'Manual validation in application code', 'Declarative schema rules and regex validators'],
              ['Middleware Hooks', 'None', 'Pre/Post save, update, and delete hooks'],
              ['Population', 'Manual `$lookup` aggregation stages', 'Clean `.populate("user")` method']
            ]
          },
          coreConcepts: ['Schema validation rules', 'Pre-save middleware for cryptography', 'Virtual getters and setters'],
          syntax: `// Mongoose Schema with validation
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  age: { type: Number, min: [18, 'Must be at least 18'] }
}, { timestamps: true });`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Pre-save hook for password hashing
const bcrypt = require('bcryptjs');

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});`,
              explanation: 'Automated password hashing hook in Mongoose.'
            }
          ],
          commonMistakes: ['Using arrow functions inside Mongoose pre-save hooks, which breaks the `this` binding to the document'],
          bestPractices: ['Always use standard `function(next)` syntax for Mongoose middleware to preserve `this` context'],
          summary: `Mongoose schemas enforce robust data integrity, automated validation, and middleware lifecycle hooks in Node.js.`,
          resources: [{ title: 'Mongoose Official Guide', url: 'https://mongoosejs.com/docs/guide.html', provider: 'Mongoosejs.com', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern12_q1',
                question: 'Why should you NOT use arrow functions when defining Mongoose pre-save middleware hooks?',
                options: [
                  'Arrow functions do not bind their own `this`, breaking access to the Mongoose document instance',
                  'Because Mongoose only supports ES5 syntax',
                  'Because arrow functions cannot be asynchronous',
                  'Because arrow functions delete database indexes'
                ],
                correctIndex: 0,
                topic: 'Mongoose Middleware this Binding',
                explanation: 'Mongoose injects the document being saved into `this`. Arrow functions lexically bind `this` to the outer scope, breaking document access.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a Mongoose Schema with Timestamps',
            difficulty: 'Beginner',
            problemStatement: 'Write a Mongoose schema definition for `Course` with required string `title` and number `credits` with `{ timestamps: true }`.',
            instructions: 'Use new mongoose.Schema() with options.',
            requirements: ['title: { type: String, required: true }', 'credits: { type: Number, required: true }', '{ timestamps: true }'],
            starterCode: `const mongoose = require('mongoose');\nconst courseSchema = new mongoose.Schema({\n  // TODO: Define fields\n}, {\n  // TODO: Options\n});`,
            solutionCode: `const mongoose = require('mongoose');\nconst courseSchema = new mongoose.Schema({\n  title: { type: String, required: true },\n  credits: { type: Number, required: true }\n}, { timestamps: true });`,
            hints: ['Define fields with type and required, add { timestamps: true } option.']
          }
        },
        {
          lessonNumber: 13,
          title: 'Database Indexing, Query Optimization & Aggregation Pipelines',
          description: 'Master B-tree indexes, compound indexes, executionStats explain plans, and multi-stage aggregation pipelines.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand B-Tree indexes, compound index prefix rules, and multikey indexes',
            'Analyze query performance using `explain("executionStats")` to eliminate COLLSCANs',
            'Construct complex multi-stage aggregation pipelines ($match, $group, $lookup, $unwind)'
          ],
          introduction: `Without indexes, MongoDB must perform a Collection Scan (COLLSCAN), inspecting every document on disk to satisfy a query. Creating optimal B-Tree indexes transforms queries from linear O(N) disk scans into sub-millisecond O(log N) index lookups.`,
          deepDiveSections: [
            {
              title: 'Understanding Query Execution Stats (COLLSCAN vs. IXSCAN)',
              explanation: `Running \`.explain("executionStats")\` reveals how MongoDB processes queries:
• COLLSCAN (Bad): MongoDB scanned the entire collection because no suitable index exists.
• IXSCAN (Good): MongoDB traversed a B-Tree index to pinpoint matching documents in memory.
• Covered Query (Best): All queried and projected fields exist within the index itself, avoiding any disk reads entirely!`,
              keyPoint: 'Aim for IXSCAN (Index Scan) and minimize totalDocsExamined vs nReturned.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: COLLSCAN vs. IXSCAN in MongoDB',
            headers: ['Metric', 'COLLSCAN (Collection Scan)', 'IXSCAN (Index Scan)'],
            rows: [
              ['Time Complexity', 'O(N) — Linear with total database size', 'O(log N) — Logarithmic B-tree lookup'],
              ['1M Documents Query Time', '500 ms – 3,000 ms (High CPU & disk I/O)', '0.5 ms – 2 ms (Instant in-memory lookup)'],
              ['RAM Usage', 'Loads all documents into RAM cache', 'Traverses compact index nodes only']
            ]
          },
          coreConcepts: ['B-Tree Indexing and Compound Prefix Rule (ESR rule: Equality, Sort, Range)', 'Aggregation framework pipeline stages', 'Covered queries'],
          syntax: `// Creating a compound index in Mongoose
skillSchema.index({ category: 1, difficulty: 1 });

// Aggregation Pipeline
const results = await Skill.aggregate([
  { $match: { isPublished: true } },
  { $group: { _id: "$category", total: { $sum: 1 }, avgHours: { $avg: "$estimatedHours" } } },
  { $sort: { total: -1 } }
]);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Multi-Stage Aggregation with $lookup and $unwind
const studentAnalytics = await User.aggregate([
  { $match: { yearOfStudy: 4 } },
  {
    $lookup: {
      from: 'academicrecords',
      localField: '_id',
      foreignField: 'user',
      as: 'academic'
    }
  },
  { $unwind: '$academic' },
  {
    $project: {
      name: 1,
      cgpa: '$academic.cgpa',
      isHonors: { $gte: ['$academic.cgpa', 8.5] }
    }
  }
]);`,
              explanation: 'Aggregates students with their academic records and computes honors status.'
            }
          ],
          commonMistakes: ['Creating too many indexes on high-write collections, which slows down insert and update performance'],
          bestPractices: ['Follow the ESR Rule (Equality, Sort, Range) when ordering fields in compound indexes'],
          summary: `B-Tree indexes and aggregation pipelines transform raw collections into high-performance analytical data pipelines.`,
          resources: [{ title: 'MongoDB Indexing Strategies', url: 'https://www.mongodb.com/docs/manual/indexes/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern13_q1',
                question: 'What does a query stage of `COLLSCAN` indicate in MongoDB explain execution statistics?',
                options: [
                  'MongoDB performed a full collection scan, checking every document because no index was used',
                  'The query was served from Redis cache',
                  'The database is corrupt',
                  'The query used a compound index'
                ],
                correctIndex: 0,
                topic: 'Query Execution Stats',
                explanation: 'COLLSCAN indicates that MongoDB had to inspect every single document on disk, meaning an index should be created.'
              }
            ]
          },
          practicalTask: {
            title: 'Construct an Aggregation Pipeline',
            difficulty: 'Intermediate',
            problemStatement: 'Write a MongoDB aggregation pipeline that matches `{ active: true }`, groups by `$category`, and counts documents with `total: { $sum: 1 }`.',
            instructions: 'Use $match and $group stages.',
            requirements: ['[{ $match: { active: true } }, { $group: { _id: "$category", total: { $sum: 1 } } }]'],
            starterCode: `const pipeline = [\n  // TODO: Add stages\n];`,
            solutionCode: `const pipeline = [\n  { $match: { active: true } },\n  { $group: { _id: '$category', total: { $sum: 1 } } }\n];`,
            hints: ['[{ $match: { active: true } }, { $group: { _id: "$category", total: { $sum: 1 } } }]']
          }
        }
      ]
    },
    {
      title: 'Phase 5: Authentication, Authorization & Security',
      order: 5,
      lessons: [
        {
          lessonNumber: 14,
          title: 'JWT Authentication & Refresh Token Rotation',
          description: 'Implement stateless JWT session tokens, cryptographically signed claims, refresh token rotation, and HttpOnly cookies.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand JWT structure (Header, Payload, HMAC SHA256 Signature)',
            'Implement access token (15m expiry) + refresh token (7d rotation) architectures',
            'Store authentication tokens securely using HttpOnly, SameSite cookies'
          ],
          introduction: `JSON Web Tokens (JWT) enable stateless authentication across distributed web architectures. Instead of storing session records in server memory, the server signs a cryptographic token containing user claims that the client presents on every HTTP request.`,
          deepDiveSections: [
            {
              title: 'JWT Anatomy & Refresh Token Rotation',
              explanation: `A JWT consists of three base64url-encoded parts separated by dots:
1. Header: Specifies the signing algorithm (\`{"alg": "HS256", "typ": "JWT"}\`).
2. Payload: Contains claims (e.g. \`{"userId": "123", "role": "student", "exp": 1718000000}\`).
3. Signature: Computed via \`HMACSHA256(base64Url(Header) + "." + base64Url(Payload), secret)\`.
In production:
• Access Token (Short-lived ~15 mins): Used in Authorization Bearer headers.
• Refresh Token (Long-lived ~7 days): Stored in an \`HttpOnly\`, \`Secure\`, \`SameSite=Strict\` cookie. When the access token expires, the client exchanges the refresh token for a new pair.`,
              keyPoint: 'Short-lived access tokens combined with HttpOnly refresh token rotation mitigate XSS and token theft risks.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: LocalStorage vs. HttpOnly Cookie Token Storage',
            headers: ['Security Dimension', 'localStorage Storage', 'HttpOnly Cookie Storage'],
            rows: [
              ['XSS Vulnerability', 'High (Any malicious script can read localStorage)', 'Immune to JavaScript XSS extraction'],
              ['CSRF Vulnerability', 'Immune to CSRF attacks', 'Mitigated using `SameSite=Strict` attribute'],
              ['SSR Compatibility', 'Not sent automatically on initial page load', 'Sent automatically in initial HTTP request headers']
            ]
          },
          coreConcepts: ['Stateless JWT verification with `jwt.verify()`', 'Refresh token rotation and family invalidation', 'HttpOnly and SameSite cookie security'],
          syntax: `// Signing a JWT in Node.js
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// JWT Authentication Middleware
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};`,
              explanation: 'Express middleware verifying JWTs and injecting req.user.'
            }
          ],
          commonMistakes: ['Storing sensitive passwords, credit cards, or API keys inside the unencrypted JWT payload'],
          bestPractices: ['Keep JWT payloads minimal (User ID, Role, Token Version) and use strong 256-bit secrets'],
          summary: `Stateless JWT authentication combined with refresh token rotation provides secure, scalable user session management.`,
          resources: [{ title: 'JWT Official Introduction', url: 'https://jwt.io/introduction', provider: 'Auth0', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern14_q1',
                question: 'Why is storing authentication refresh tokens in `HttpOnly` cookies more secure than `localStorage`?',
                options: [
                  'HttpOnly cookies cannot be accessed by client-side JavaScript, protecting tokens from Cross-Site Scripting (XSS) theft',
                  'Because cookies compress tokens with gzip',
                  'Because localStorage is deleted when closing the browser',
                  'Because cookies work without internet connection'
                ],
                correctIndex: 0,
                topic: 'HttpOnly Cookie Security',
                explanation: 'The `HttpOnly` flag prevents browser scripts from reading the cookie value, neutralizing XSS credential theft.'
              }
            ]
          },
          practicalTask: {
            title: 'Verify a Bearer JWT in Middleware',
            difficulty: 'Intermediate',
            problemStatement: 'Write the `jwt.verify` call that decodes `token` using `process.env.JWT_SECRET` and assigns the payload to `req.user`.',
            instructions: 'Use jwt.verify(token, process.env.JWT_SECRET).',
            requirements: ['req.user = jwt.verify(token, process.env.JWT_SECRET)'],
            starterCode: `const decoded = jwt.verify(\n// TODO: Complete\n);`,
            solutionCode: `const decoded = jwt.verify(token, process.env.JWT_SECRET);\nreq.user = decoded;`,
            hints: ['req.user = jwt.verify(token, process.env.JWT_SECRET);']
          }
        },
        {
          lessonNumber: 15,
          title: 'Role-Based Access Control (RBAC) & Protected Routes',
          description: 'Implement granular authorization policies, role hierarchies (Student, Instructor, Admin), and endpoint guards.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Differentiate Authentication (Who you are) from Authorization (What you can do)',
            'Implement reusable Role-Based Access Control (RBAC) middleware in Express',
            'Enforce resource ownership checks (Users can only edit their own profile)'
          ],
          introduction: `Authentication verifies a user's identity; Authorization determines their permissions. Role-Based Access Control (RBAC) enforces access policies ensuring students cannot modify course curricula and standard users cannot access administrative dashboards.`,
          deepDiveSections: [
            {
              title: 'Declarative RBAC Middleware Factory Pattern',
              explanation: `Instead of writing manual role checks in every route, create an RBAC middleware factory:
\`\`\`javascript
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  }
  next();
};
\`\`\`
Routes can then declaratively specify permissions:
\`router.delete('/skills/:id', authMiddleware, authorize('admin'), skillsController.deleteSkill);\``,
              keyPoint: 'RBAC middleware factories enforce role restrictions declaratively across route definitions.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Authentication vs. Authorization',
            headers: ['Dimension', 'Authentication (AuthN)', 'Authorization (AuthZ)'],
            rows: [
              ['Question Answered', '"Who are you?"', '"What actions are you permitted to perform?"'],
              ['Mechanism', 'Passwords, OAuth, Firebase, JWT Tokens', 'Roles (RBAC), Scopes, Access Control Lists (ACL)'],
              ['HTTP Status Failure', '401 Unauthorized', '403 Forbidden']
            ]
          },
          coreConcepts: ['RBAC role hierarchy', 'Resource ownership validation', 'Declarative route middleware guards'],
          syntax: `// Declarative route protection
router.post('/admin/seed', authMiddleware, requireRole('admin'), adminController.seed);`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Resource ownership verification middleware
const checkOwnership = (model) => async (req, res, next) => {
  const resource = await model.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Not found' });
  
  if (resource.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: You do not own this resource' });
  }
  
  req.resource = resource;
  next();
};`,
              explanation: 'Ensures users can only update their own notes or projects unless they are an admin.'
            }
          ],
          commonMistakes: ['Relying solely on frontend button hiding without enforcing backend RBAC route guards'],
          bestPractices: ['Always enforce authorization checks on the backend API regardless of frontend UI state'],
          summary: `Declarative RBAC middleware and resource ownership checks protect private endpoints and user data.`,
          resources: [{ title: 'NIST Role-Based Access Control Standard', url: 'https://csrc.nist.gov/projects/role-based-access-control', provider: 'NIST', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern15_q1',
                question: 'What is the correct HTTP status code to return when an authenticated user attempts to modify a resource owned by someone else without permission?',
                options: ['403 Forbidden', '401 Unauthorized', '500 Server Error', '302 Redirect'],
                correctIndex: 0,
                topic: 'Authorization Status Code',
                explanation: '403 Forbidden indicates the server understands the request and authenticated identity, but refuses to authorize the action.'
              }
            ]
          },
          practicalTask: {
            title: 'Build an RBAC Middleware Factory',
            difficulty: 'Intermediate',
            problemStatement: 'Write a middleware factory function `requireRole(...roles)` that checks if `req.user.role` is in `roles`. If not, returns 403 status with `{ error: "Forbidden" }`; otherwise calls `next()`.',
            instructions: 'Return a middleware (req, res, next) checking roles.includes(req.user.role).',
            requirements: ['Return (req, res, next) function', 'If !roles.includes(req.user.role) return res.status(403).json({ error: "Forbidden" })', 'Else next()'],
            starterCode: `const requireRole = (...roles) => (req, res, next) => {\n  // TODO: Check role\n};`,
            solutionCode: `const requireRole = (...roles) => (req, res, next) => {\n  if (!req.user || !roles.includes(req.user.role)) {\n    return res.status(403).json({ error: 'Forbidden' });\n  }\n  next();\n};`,
            hints: ['Check if !roles.includes(req.user.role) then return 403, otherwise next().']
          }
        },
        {
          lessonNumber: 16,
          title: 'Web Security: CORS, Helmet, Rate Limiting & Input Sanitization',
          description: 'Harden Express servers against XSS, NoSQL Injection, DDoS, and CSRF attacks using production security middleware.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Configure Cross-Origin Resource Sharing (CORS) with origin whitelists',
            'Secure HTTP headers using Helmet (HSTS, CSP, X-Frame-Options)',
            'Prevent NoSQL injection and sanitize user inputs with mongo-sanitize and rate-limiters'
          ],
          introduction: `Production web applications are subjected to continuous automated attacks. Securing an Express API requires defensive layers against NoSQL injection, Cross-Site Scripting (XSS), brute-force password guessing, and Cross-Origin abuse.`,
          deepDiveSections: [
            {
              title: 'NoSQL Injection & Prevention',
              explanation: `If an API accepts raw user input directly into a MongoDB query:
\`db.users.find({ username: req.body.username, password: req.body.password })\`
An attacker can submit \`{ "username": "admin", "password": { "$gt": "" } }\`, successfully bypassing authentication!
Prevention: Use \`express-mongo-sanitize\` to strip \`$\` and \`.\` characters from \`req.body\` and enforce strict schema validation via Zod.`,
              keyPoint: 'Never pass raw un-sanitized request objects into MongoDB query selectors.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Security Threats & Defenses in MERN',
            headers: ['Threat', 'Vulnerability Mechanism', 'MERN Defense'],
            rows: [
              ['NoSQL Injection', 'Submitting `$gt` or `$ne` operators in JSON body', 'Use `express-mongo-sanitize` + Zod schema validation'],
              ['Brute Force / DDoS', 'Spamming thousands of requests per second', 'Use `express-rate-limit` (e.g. 100 req / 15 mins)'],
              ['Clickjacking & MIME sniffing', 'Embedding site in iframe or overriding headers', 'Use `helmet()` to inject secure HTTP headers'],
              ['Cross-Origin Abuse', 'Unauthorized websites querying your API', 'Configure strict `cors({ origin: "https://zenscore.ai" })`']
            ]
          },
          coreConcepts: ['NoSQL injection sanitization', 'Helmet HTTP response headers', 'API rate limiting'],
          syntax: `// Production Security Suite in Express
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

app.use(helmet());
app.use(mongoSanitize());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Express production security middleware configuration
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed login attempts per window
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }
});

app.use('/api/auth/login', authLimiter);`,
              explanation: 'Strict rate limiter preventing brute-force password guessing on the login endpoint.'
            }
          ],
          commonMistakes: ['Configuring `cors({ origin: "*" })` while enabling `credentials: true`, which browsers reject for security'],
          bestPractices: ['Explicitly whitelist your production frontend domain in CORS and rate-limit sensitive endpoints'],
          summary: `Applying Helmet, CORS whitelisting, mongo-sanitize, and rate-limiting forms a hardened defense-in-depth security perimeter.`,
          resources: [{ title: 'OWASP Node.js Security Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html', provider: 'OWASP', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern16_q1',
                question: 'How does an attacker execute a NoSQL injection attack in a MongoDB application?',
                options: [
                  'By sending query operators like `{"$gt": ""}` in the request body to bypass password comparisons',
                  'By sending raw SQL SELECT statements',
                  'By overloading the CPU with infinite loops',
                  'By deleting CSS stylesheets'
                ],
                correctIndex: 0,
                topic: 'NoSQL Injection',
                explanation: 'MongoDB query operators like `$gt` (greater than) evaluate to true when compared with non-empty strings, bypassing authentication if un-sanitized.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Rate Limiter Middleware',
            difficulty: 'Intermediate',
            problemStatement: 'Write an express-rate-limit configuration object that restricts users to `100` requests per `15` minute window.',
            instructions: 'Use rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }).',
            requirements: ['windowMs: 15 * 60 * 1000', 'max: 100'],
            starterCode: `const rateLimit = require('express-rate-limit');\nconst limiter = rateLimit({\n  // TODO: Configure\n});`,
            solutionCode: `const rateLimit = require('express-rate-limit');\nconst limiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 100\n});`,
            hints: ['Set windowMs: 15 * 60 * 1000 and max: 100.']
          }
        }
      ]
    },
    {
      title: 'Phase 6: Production MERN & Performance',
      order: 6,
      lessons: [
        {
          lessonNumber: 17,
          title: 'Caching with Redis & Database Query Optimization',
          description: 'Implement in-memory caching with Redis, Cache-Aside patterns, TTL invalidation, and lean database queries.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement the Cache-Aside pattern using Redis in Node.js',
            'Set proper Time-To-Live (TTL) expiration and automated cache invalidation',
            'Use Mongoose `.lean()` to bypass hydration overhead for read-only queries'
          ],
          introduction: `Database disk reads are the primary bottleneck in web applications. Redis is an ultra-fast, in-memory key-value data store that caches frequently queried database results, reducing response times from 150ms down to 2ms.`,
          deepDiveSections: [
            {
              title: 'The Cache-Aside (Lazy Loading) Pattern',
              explanation: `How Cache-Aside functions:
1. Client requests data: API checks Redis for \`skill:full-stack-mern\`.
2. Cache Hit: Redis returns cached JSON instantly (2ms).
3. Cache Miss: API queries MongoDB (80ms), writes result to Redis with a TTL (\`SETEX skill:full-stack-mern 3600 <data>\`), and returns data to client.
4. Mutation: When an admin updates the skill, the API invalidates the key via \`redis.del("skill:full-stack-mern")\`.`,
              keyPoint: 'Cache-Aside serves reads from fast memory and invalidates cache keys upon database mutations.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Direct Database Query vs. Redis In-Memory Cache',
            headers: ['Metric', 'Direct MongoDB Query', 'Redis In-Memory Cache'],
            rows: [
              ['Read Latency', '20 ms – 150 ms (Disk I/O and BSON hydration)', '0.5 ms – 3 ms (Pure RAM lookup)'],
              ['Throughput', '~1,000 queries / sec per database replica', '~100,000 queries / sec per Redis instance'],
              ['Database Load', 'High CPU and disk saturation', 'Database shielded from repetitive read traffic']
            ]
          },
          coreConcepts: ['Cache-Aside pattern', 'TTL (Time-To-Live) cache expiration', 'Mongoose `.lean()` query optimization'],
          syntax: `// Redis Cache-Aside Pattern
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const data = await Skill.findById(id).lean();
await redis.setex(cacheKey, 3600, JSON.stringify(data));
return data;`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Express Caching Middleware
const getOrSetCache = async (redisClient, key, ttlSeconds, fetchCb) => {
  const cachedData = await redisClient.get(key);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  const freshData = await fetchCb();
  await redisClient.setex(key, ttlSeconds, JSON.stringify(freshData));
  return freshData;
};`,
              explanation: 'Reusable helper function implementing the Cache-Aside pattern.'
            }
          ],
          commonMistakes: ['Forgetting to set a TTL on cache keys, causing stale data to persist indefinitely'],
          bestPractices: ['Always set a TTL and use Mongoose `.lean()` for high-volume read queries'],
          summary: 'In-memory caching with Redis and .lean() database queries supercharges MERN application throughput.',
          resources: [{ title: 'Redis Official Node.js Client Guide', url: 'https://redis.io/docs/connect/clients/nodejs/', provider: 'Redis.io', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern17_q1',
                question: 'What is the primary benefit of adding `.lean()` to a Mongoose query (e.g. `Skill.find().lean()`) for read-only endpoints?',
                options: [
                  'It returns plain JavaScript objects instead of heavy Mongoose Documents, speeding up queries by 3x and saving memory',
                  'It converts the database to PostgreSQL',
                  'It automatically deletes duplicate rows',
                  'It encrypts the response'
                ],
                correctIndex: 0,
                topic: 'Mongoose Lean Queries',
                explanation: '`.lean()` skips Mongoose document hydration (getters, setters, change tracking), returning plain JS objects with massive memory and CPU savings.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement a Lean Mongoose Query',
            difficulty: 'Beginner',
            problemStatement: 'Write the Mongoose query to fetch all published skills in category `"Web"` as plain JavaScript objects using `.lean()`.',
            instructions: 'Use Skill.find({ category: "Web", isPublished: true }).lean().',
            requirements: ['Skill.find({ category: "Web", isPublished: true }).lean()'],
            starterCode: `const skills = await Skill.find()`,
            solutionCode: `const skills = await Skill.find({ category: 'Web', isPublished: true }).lean();`,
            hints: ['Skill.find({ category: "Web", isPublished: true }).lean();']
          }
        },
        {
          lessonNumber: 18,
          title: 'Production Environment Configuration & Logging with Morgan/Winston',
          description: 'Configure multi-stage environment profiles, structured JSON logging with Winston, and request tracing with Morgan.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Manage isolated environment configurations (.env.development, .env.production)',
            'Implement structured JSON logging with Winston and Log levels (error, warn, info)',
            'Trace incoming HTTP requests and latency with Morgan'
          ],
          introduction: `Relying on \`console.log\` in production is an anti-pattern. Structured logging libraries like Winston and Morgan format logs as structured JSON, record timestamps and error stack traces, and route logs to centralized collectors like Datadog or CloudWatch.`,
          deepDiveSections: [
            {
              title: 'Structured JSON Logging vs. Plaintext console.log',
              explanation: `Winston formats logs as structured JSON objects:
\`{"level":"error","message":"DB Connection failed","timestamp":"2026-06-01T12:00:00Z","service":"api","traceId":"a8f3b"}\`
Centralized log aggregators can parse and index JSON fields instantly, enabling real-time alerting on error spikes.`,
              keyPoint: 'Structured JSON logging allows cloud log analyzers to search and trigger alerts on error metrics.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: console.log vs. Winston Logger',
            headers: ['Feature', 'console.log', 'Winston Structured Logger'],
            rows: [
              ['Log Levels', 'None (All logs treated identically)', 'Strict levels: error, warn, info, debug'],
              ['Formatting', 'Unstructured plaintext strings', 'Structured JSON with metadata and timestamps'],
              ['Transports', 'Stdout only', 'File rotation, Stdout, CloudWatch, Datadog, Papertrail']
            ]
          },
          coreConcepts: ['Log level hierarchies (error > warn > info > debug)', 'Structured JSON logging', 'Morgan HTTP access logging'],
          syntax: `// Winston Logger configuration
const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Morgan + Winston Integration in Express
const morgan = require('morgan');

app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));`,
              explanation: 'Routes Morgan HTTP access logs through Winston.'
            }
          ],
          commonMistakes: ['Logging sensitive passwords, auth tokens, or credit cards in application log files'],
          bestPractices: ['Sanitize and mask all sensitive credentials before writing to log streams'],
          summary: `Structured logging with Winston and Morgan provides clear observability into production application health.`,
          resources: [{ title: 'Winston Logger Guide', url: 'https://github.com/winstonjs/winston', provider: 'GitHub', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'mern18_q1',
                question: 'Why is structured JSON logging preferred over plain `console.log` in production microservices?',
                options: [
                  'JSON logs can be automatically indexed, queried, and filtered by centralized monitoring platforms like Datadog and CloudWatch',
                  'JSON logs take zero bytes of space',
                  'console.log causes Node.js to shut down',
                  'JSON logs compile faster'
                ],
                correctIndex: 0,
                topic: 'Structured Logging',
                explanation: 'Structured JSON logs allow automated log processors to filter by level, error code, and timestamp.'
              }
            ]
          },
          practicalTask: {
            title: 'Log an Error with Winston',
            difficulty: 'Beginner',
            problemStatement: 'Write the statement to log an error with message `"Database connection timeout"` and metadata `{ service: "auth" }` using `logger.error()`.',
            instructions: 'Use logger.error(message, metadata).',
            requirements: ['logger.error("Database connection timeout", { service: "auth" })'],
            starterCode: `logger.error()`,
            solutionCode: `logger.error('Database connection timeout', { service: 'auth' });`,
            hints: ['logger.error("Database connection timeout", { service: "auth" });']
          }
        },
        {
          lessonNumber: 19,
          title: 'Automated Testing: Jest, Supertest & React Testing Library',
          description: 'Write unit and integration tests across backend Express endpoints (Supertest) and frontend React components (RTL).',
          estimatedMinutes: 35,
          learningObjectives: [
            'Test Express REST APIs end-to-end using Jest and Supertest',
            'Test React component user interactions using React Testing Library',
            'Mock database calls and external HTTP APIs'
          ],
          introduction: `Automated testing guarantees that new code changes do not break existing functionality. Full-stack testing combines backend API integration tests (Supertest) with frontend component interaction tests (React Testing Library).`,
          deepDiveSections: [
            {
              title: 'The Testing Pyramid in MERN',
              explanation: `A balanced testing strategy:
1. Unit Tests (Fast & Cheap): Tests isolated helper functions and pure services.
2. Integration Tests (Medium): Tests Express routes with an in-memory MongoDB instance (\`mongodb-memory-server\`) via Supertest.
3. Component Tests: Tests React components from the user's perspective via React Testing Library (\`fireEvent.click\`, \`screen.getByRole\`).`,
              keyPoint: 'Test user behavior and API contracts rather than implementation details.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Supertest vs. React Testing Library',
            headers: ['Tool', 'Target Layer', 'Focus', 'Example Assertion'],
            rows: [
              ['Supertest + Jest', 'Backend Express API', 'HTTP Status Codes, Headers, JSON Schema', '`expect(res.status).toBe(201)`'],
              ['React Testing Library', 'Frontend React UI', 'DOM elements, User Clicks, Accessibility', '`expect(screen.getByText("Active")).toBeInTheDocument()`']
            ]
          },
          coreConcepts: ['API Integration testing with Supertest', 'User-centric component testing with RTL', 'In-memory database mocking'],
          syntax: `// Supertest API Integration Test
const request = require('supertest');
const app = require('../server');

test('GET /api/skills returns 200', async () => {
  const res = await request(app).get('/api/skills');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// React Testing Library Component Test
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter';

test('increments counter when button is clicked', () => {
  render(<Counter />);
  const button = screen.getByRole('button', { name: /increment/i });
  expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  
  fireEvent.click(button);
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});`,
              explanation: 'Tests component user interaction from the perspective of an end user.'
            }
          ],
          commonMistakes: ['Testing component internal state variables instead of what the user actually sees on screen'],
          bestPractices: ['Query elements by accessible ARIA roles (`getByRole`) in React Testing Library'],
          summary: `Automated testing with Jest, Supertest, and React Testing Library ensures unbreakable full-stack code quality.`,
          resources: [{ title: 'React Testing Library Documentation', url: 'https://testing-library.com/docs/react-testing-library/intro/', provider: 'Testing Library', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern19_q1',
                question: 'What is the guiding philosophy of React Testing Library?',
                options: [
                  'The more your tests resemble the way your software is used, the more confidence they can give you',
                  'Always test internal state variables directly',
                  'Only test CSS styling',
                  'Never test button clicks'
                ],
                correctIndex: 0,
                topic: 'Testing Philosophy',
                explanation: 'React Testing Library focuses on testing user-visible behavior and accessibility rather than component implementation internals.'
              }
            ]
          },
          practicalTask: {
            title: 'Write an Express Supertest Case',
            difficulty: 'Intermediate',
            problemStatement: 'Write a Jest test using `supertest(app)` that sends a `GET /health` request and asserts that `res.status` is `200`.',
            instructions: 'Use request(app).get("/health") and expect(res.status).toBe(200).',
            requirements: ['const res = await request(app).get("/health")', 'expect(res.status).toBe(200)'],
            starterCode: `test('health check returns 200', async () => {\n  // TODO: Implement test\n});`,
            solutionCode: `test('health check returns 200', async () => {\n  const res = await request(app).get('/health');\n  expect(res.status).toBe(200);\n});`,
            hints: ['const res = await request(app).get("/health"); expect(res.status).toBe(200);']
          }
        }
      ]
    },
    {
      title: 'Phase 7: Full-Stack MERN Capstone',
      order: 7,
      lessons: [
        {
          lessonNumber: 20,
          title: 'Full-Stack Architecture Design & State Management',
          description: 'Design the end-to-end data flow, REST API contracts, global state hydration, and optimistic UI updates.',
          estimatedMinutes: 40,
          learningObjectives: [
            'Architect seamless end-to-end state hydration between React client and Express API',
            'Implement optimistic UI updates for instant perceived performance',
            'Design scalable database indexes and API error boundaries'
          ],
          introduction: `In this capstone phase, we will architect and implement a complete production MERN application. We will design the database schemas, configure the REST API endpoints, implement client-side global state hydration, and apply optimistic UI updates for a high-performance user experience.`,
          deepDiveSections: [
            {
              title: 'Optimistic UI Updates Architecture',
              explanation: `Optimistic UI updates improve perceived speed by updating the client UI immediately before waiting for the backend server response:
1. User clicks "Complete Lesson": React updates local state immediately (UI turns green).
2. React dispatches background API call: \`POST /api/skills/:id/complete\`.
3. If Success: State remains confirmed.
4. If Error: React rolls back the optimistic update and displays a toast notification alert.`,
              keyPoint: 'Optimistic UI updates give users instant feedback while maintaining background database consistency.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Pessimistic UI vs. Optimistic UI Updates',
            headers: ['Dimension', 'Pessimistic UI (Standard)', 'Optimistic UI (Modern)'],
            rows: [
              ['Perceived Latency', 'High (User waits for server roundtrip ~200ms)', 'Zero (Instant 0ms visual update)'],
              ['Error Handling', 'Easy (Only update on HTTP 200 response)', 'Requires rollback logic on network failure'],
              ['User Satisfaction', 'Feels sluggish over slow mobile networks', 'Feels instantaneous and native-like']
            ]
          },
          coreConcepts: ['Optimistic UI state rollbacks', 'Global state hydration', 'Full-stack contract validation'],
          syntax: `// Optimistic UI state update pattern in React
const handleComplete = async (lessonId) => {
  const previousState = completedLessons;
  setCompletedLessons(prev => [...prev, lessonId]); // Optimistic update

  try {
    await api.post(\`/skills/\${skillId}/lessons/\${lessonId}/complete\`);
  } catch (err) {
    setCompletedLessons(previousState); // Rollback on error
    toast.error('Failed to save progress');
  }
};`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Complete MERN Controller Implementation
exports.completeLesson = async (req, res, next) => {
  try {
    const { skillId, lessonId } = req.params;
    const userId = req.user.id;
    
    const progress = await SkillsService.markLessonComplete(userId, skillId, lessonId);
    return res.status(200).json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
};`,
              explanation: 'Standardized Express controller passing exceptions to centralized error middleware.'
            }
          ],
          commonMistakes: ['Forgetting to save the previous state before performing an optimistic update, making rollback impossible'],
          bestPractices: ['Always store previous state and implement automated rollback in optimistic UI handlers'],
          summary: `Designing unified data contracts and optimistic UI state management elevates MERN applications to enterprise standards.`,
          resources: [{ title: 'Full Stack MERN Architecture Patterns', url: 'https://www.mongodb.com/mern-stack', provider: 'MongoDB.com', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'mern20_q1',
                question: 'What must a client application do if an optimistic UI update fails on the backend server?',
                options: [
                  'Roll back the client state to the previous snapshot and notify the user of the failure',
                  'Reload the entire operating system',
                  'Ignore the server error completely',
                  'Log out the user immediately'
                ],
                correctIndex: 0,
                topic: 'Optimistic UI Rollbacks',
                explanation: 'If the server returns an error, the client must revert the optimistic state to the saved snapshot to maintain data integrity.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement an Optimistic State Updater',
            difficulty: 'Intermediate',
            problemStatement: 'Write the function `toggleBookmarkOptimistic(items, id)` that adds `id` to the array if absent, or removes it if present, returning a new array.',
            instructions: 'Use items.includes(id) to add or filter out the item.',
            requirements: ['If items.includes(id) return items.filter(x => x !== id)', 'Else return [...items, id]'],
            starterCode: `function toggleBookmarkOptimistic(items, id) {\n  // TODO: Return updated array\n}`,
            solutionCode: `function toggleBookmarkOptimistic(items, id) {\n  return items.includes(id) ? items.filter(x => x !== id) : [...items, id];\n}`,
            hints: ['return items.includes(id) ? items.filter(x => x !== id) : [...items, id];']
          }
        },
        {
          lessonNumber: 21,
          title: 'End-to-End MERN Deployment with Docker & Cloud Hosting',
          description: 'Deploy the complete production MERN application to cloud infrastructure with MongoDB Atlas, Docker Compose, and SSL termination.',
          estimatedMinutes: 45,
          learningObjectives: [
            'Configure production environment variables for cloud hosting',
            'Connect backend APIs securely to MongoDB Atlas via TLS connection strings',
            'Deploy the full-stack container stack with automatic restart policies and HTTPS'
          ],
          introduction: `Congratulations on completing the Full Stack MERN Architecture curriculum! In this capstone lesson, we will deploy our full-stack application to production cloud servers with MongoDB Atlas database clusters, Docker multi-stage containers, and SSL certificate termination.`,
          deepDiveSections: [
            {
              title: 'Production Cloud Deployment Architecture',
              explanation: `A production MERN cloud deployment architecture:
1. DNS & CDN (Cloudflare): DDoS protection, caching, and SSL termination.
2. Host VPS (Ubuntu Linux): Runs Docker Compose managing Nginx reverse proxy, React client, and Express API.
3. Database (MongoDB Atlas): Managed multi-node replica set with automated backups, encryption at rest, and IP access whitelisting.`,
              keyPoint: 'Managed cloud databases (MongoDB Atlas) paired with containerized application tiers provide high availability and scalability.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Local Development vs. Production MERN Cloud Hosting',
            headers: ['Dimension', 'Local Development', 'Production Cloud Hosting'],
            rows: [
              ['Database', 'Local single-node MongoDB instance', 'MongoDB Atlas 3-node Replica Set with failover'],
              ['Frontend Delivery', 'Vite dev server with HMR', 'Compiled static assets served via Alpine Nginx with Gzip'],
              ['Security', 'Plain HTTP on localhost', 'Enforced HTTPS with automated Let\'s Encrypt SSL certificates'],
              ['Process Management', 'Nodemon terminal process', 'Docker Compose with `restart: unless-stopped`']
            ]
          },
          coreConcepts: ['MongoDB Atlas connection strings with TLS', 'Production Docker Compose deployment', 'Cloud DNS and HTTPS termination'],
          syntax: `# Production MongoDB Atlas Connection String
mongodb+srv://admin:<password>@cluster0.mongodb.net/zenscore_prod?retryWrites=true&w=majority`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Production Database Connection in Express
const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      wtimeoutMS: 2500,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB Atlas connected securely.');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}`,
              explanation: 'Production MongoDB Atlas connection with connection pool limits.'
            }
          ],
          commonMistakes: ['Whitelisting 0.0.0.0/0 in MongoDB Atlas indefinitely instead of restricting to specific production server IPs'],
          bestPractices: ['Restrict MongoDB Atlas IP whitelists to the elastic IP of your production application servers'],
          summary: `You have mastered the Full Stack MERN Architecture from JavaScript foundations and React components to production cloud deployment!`,
          resources: [{ title: 'MongoDB Atlas Production Best Practices', url: 'https://www.mongodb.com/docs/atlas/', provider: 'MongoDB.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'mern21_q1',
                question: 'What is the purpose of `retryWrites=true&w=majority` in a MongoDB Atlas connection string?',
                options: [
                  'Guarantees write operations automatically retry on transient network failures and are acknowledged by a majority of replica set nodes',
                  'Disables all security checks',
                  'Limits the database to 1 user',
                  'Converts documents to SQL tables'
                ],
                correctIndex: 0,
                topic: 'MongoDB Atlas Reliability',
                explanation: '`retryWrites=true` and `w=majority` ensure that write operations survive temporary primary failovers and are safely persisted across replicas.'
              }
            ]
          },
          practicalTask: {
            title: 'Verify Database Connection String Format',
            difficulty: 'Beginner',
            problemStatement: 'Write a valid MongoDB Atlas SRV URI string for user `zenscore_user` with password `secretpass` on host `cluster0.abc.mongodb.net` for database `production_db`.',
            instructions: 'Use the mongodb+srv:// protocol format.',
            requirements: ['mongodb+srv://zenscore_user:secretpass@cluster0.abc.mongodb.net/production_db?retryWrites=true&w=majority'],
            starterCode: `const URI = "mongodb+srv://";`,
            solutionCode: `const URI = "mongodb+srv://zenscore_user:secretpass@cluster0.abc.mongodb.net/production_db?retryWrites=true&w=majority";`,
            hints: ['mongodb+srv://<user>:<password>@<host>/<database>?retryWrites=true&w=majority']
          }
        }
      ]
    }
  ]
}

module.exports = { mernCurriculum }
