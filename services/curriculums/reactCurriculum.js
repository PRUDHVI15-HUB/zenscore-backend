/**
 * React.js & Next.js Ecosystem Master Curriculum
 * 7 Phases, 21 Comprehensive Engineering Lessons
 */

const reactCurriculum = {
  title: 'React.js & Next.js Ecosystem',
  category: 'Frontend Engineering',
  description: 'Master React 18 component trees, Fiber reconciliation, hooks, TanStack Query, Next.js 14 App Router, Server Components (RSC), and Server Actions.',
  modules: [
    {
      title: 'Phase 1: React Foundations & Virtual DOM',
      order: 1,
      lessons: [
        {
          lessonNumber: 1,
          title: 'React Component Model & JSX Transpilation',
          description: 'Understand JSX transpilation into React.createElement calls, React elements vs DOM nodes, component purity, and the component tree.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand how Babel / SWC transpiles JSX into React.createElement calls',
            'Differentiate React Elements (immutable descriptors) from live browser DOM nodes',
            'Enforce pure component rendering without side effects during the render phase'
          ],
          introduction: `React revolutionizes user interface development by modeling UIs as pure functions of state. Instead of writing imperative DOM manipulation scripts (\`document.getElementById\`), developers write declarative JSX syntax that describes what the UI should look like for a given state.`,
          deepDiveSections: [
            {
              title: 'JSX Transpilation & React Element Objects',
              explanation: `JSX is not HTML; it is syntactic sugar for JavaScript functions:
\`\`\`jsx
const badge = <span className="highlight">ZenScore</span>;
\`\`\`
Babel or SWC compiles this JSX into:
\`\`\`javascript
const badge = React.createElement('span', { className: 'highlight' }, 'ZenScore');
\`\`\`
Calling \`React.createElement\` returns a plain, lightweight JavaScript object (a React Element Descriptor):
\`{ type: 'span', props: { className: 'highlight', children: 'ZenScore' } }\`.
Because React Elements are plain in-memory objects, React can create and compare thousands of them in milliseconds with zero DOM reflow overhead.`,
              keyPoint: 'JSX compiles into React.createElement() calls returning plain JavaScript descriptor objects.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Direct DOM Elements vs. React Virtual Elements',
            headers: ['Attribute', 'Real Browser DOM Node', 'React Virtual Element Object'],
            rows: [
              ['Type', 'Heavy C++ browser interface (`HTMLDivElement`)', 'Lightweight plain JavaScript object (`{ type, props }`)'],
              ['Memory Overhead', 'Contains 200+ properties and event listener slots', 'Contains ~5 properties (type, props, key, ref)'],
              ['Creation Speed', 'Slow (Triggers browser layout recalculations)', 'Instantaneous (Microsecond in-memory object instantiation)']
            ]
          },
          coreConcepts: ['JSX compilation pipeline (Babel/SWC)', 'React element descriptor objects', 'Component purity invariants'],
          syntax: `// React Functional Component with TypeScript Props
interface UserCardProps {
  name: string;
  role: 'student' | 'instructor';
}

export function UserCard({ name, role }: UserCardProps) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <span className="role">{role}</span>
    </div>
  );
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Pure Component Rendering Pattern
export default function SkillProgressCard({ title, percentage, onResume }) {
  const isMastered = percentage === 100;

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white">
      <h4 className="font-bold text-slate-900">{title}</h4>
      <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
        <div 
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: \`\${percentage}%\` }}
        />
      </div>
      <button 
        onClick={onResume}
        className="mt-3 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-100"
      >
        {isMastered ? 'Review Skill' : 'Resume Lesson'}
      </button>
    </div>
  );
}`,
              explanation: 'Pure React UI component cleanly translating props into declarative markup.'
            }
          ],
          commonMistakes: ['Mutating props or global variables directly inside the component body during rendering'],
          bestPractices: ['Keep components strictly pure; treat props and state as immutable data structures'],
          summary: `React JSX compiles to lightweight object descriptors, enabling fast, declarative UI composition.`,
          resources: [{ title: 'Describing the UI: React Official Docs', url: 'https://react.dev/learn/describing-the-ui', provider: 'React.dev', type: 'Documentation', difficulty: 'Beginner', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'rc1_q1',
                question: 'What does a JSX tag like `<h1 className="title">Hello</h1>` transpile into in standard JavaScript?',
                options: [
                  'React.createElement("h1", { className: "title" }, "Hello")',
                  'document.createElement("h1")',
                  'HTML.parse("<h1>Hello</h1>")',
                  'A binary byte buffer'
                ],
                correctIndex: 0,
                topic: 'JSX Compilation',
                explanation: 'Babel and SWC compilers convert JSX tags directly into `React.createElement` function calls.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Declarative Badge Component',
            difficulty: 'Beginner',
            problemStatement: 'Write a React component `MasteryTag({ score })` that renders `<span className="mastered">Mastered</span>` if `score >= 80` and `<span className="learning">In Progress</span>` otherwise.',
            instructions: 'Use ternary conditional rendering inside the component.',
            requirements: ['if score >= 80 render <span className="mastered">Mastered</span>', 'else render <span className="learning">In Progress</span>'],
            starterCode: `export default function MasteryTag({ score }) {\n  // TODO: Render conditional badge\n}`,
            solutionCode: `export default function MasteryTag({ score }) {\n  return score >= 80 ? (\n    <span className="mastered">Mastered</span>\n  ) : (\n    <span className="learning">In Progress</span>\n  );\n}`,
            hints: ['return score >= 80 ? <span className="mastered">Mastered</span> : <span className="learning">In Progress</span>;']
          }
        },
        {
          lessonNumber: 2,
          title: 'Virtual DOM vs Real DOM & Fiber Reconciliation Algorithm',
          description: 'Explore the React 18 Fiber tree, workLoopConcurrent, time-slicing, and heuristic O(N) diffing rules.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand the React 18 Fiber Node data structure (child, sibling, return pointers)',
            'Master the Heuristic O(N) Diffing Algorithm assumptions',
            'Leverage time-slicing and interruptible rendering in React 18 Concurrent Mode'
          ],
          introduction: `Before React 16, React used a recursive Stack Reconciler that could not be paused once started, causing frame drops and input lag on heavy UIs. React Fiber completely rewrote the core engine into a linked-list work loop that allows React to pause, prioritize, and resume rendering work.`,
          deepDiveSections: [
            {
              title: 'React Fiber Linked List & The Double Buffering Pattern',
              explanation: `Fiber structures the UI as a mutable singly-linked list of Fiber Nodes:
• \`child\`: Pointer to first child node.
• \`sibling\`: Pointer to adjacent sibling node.
• \`return\`: Pointer back to parent node.
Double Buffering Pattern:
React maintains two Fiber trees in memory simultaneously:
1. Current Tree: Represents the nodes currently visible on the screen.
2. WorkInProgress Tree: An in-memory draft tree where new state updates and diffs are computed asynchronously.
When work completes, React swaps a single top-level pointer (\`root.current = workInProgress\`), committing changes to the real DOM instantaneously!`,
              keyPoint: 'React Fiber uses double buffering and linked lists to compute UI diffs without blocking user interactions.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Stack Reconciler (Legacy) vs. Fiber Reconciler (Modern)',
            headers: ['Feature', 'Legacy Stack Reconciler (React < 16)', 'Fiber Reconciler (React 16–18+)'],
            rows: [
              ['Execution Model', 'Synchronous recursion (Uninterruptible)', 'Asynchronous cooperative work loop (Interruptible)'],
              ['High Priority Events', 'Blocked until deep component trees finish', 'Can interrupt background renders to handle user clicks immediately'],
              ['Concurrency', 'Single-threaded blocking execution', 'Concurrent Mode with time-slicing and Suspense transitions']
            ]
          },
          coreConcepts: ['Fiber node linked-list architecture', 'Double buffering draft tree swapping', 'Heuristic reconciliation assumptions'],
          syntax: `# Heuristic Diffing Assumptions:
1. Two elements of different types will produce different trees (destroy old, mount new).
2. The developer can hint at stable element identity across renders using the 'key' prop.`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Stable Key Usage in Dynamic Lists
export function SkillList({ skills, onSelect }) {
  return (
    <ul className="space-y-2">
      {skills.map((skill) => (
        // KEY RULE: Always use stable, unique IDs (never index!) as keys
        <li key={skill.id} className="p-3 border rounded-lg flex justify-between">
          <span>{skill.title}</span>
          <button onClick={() => onSelect(skill.id)}>Start</button>
        </li>
      ))}
    </ul>
  );
}`,
              explanation: 'Uses unique, persistent skill.id keys to allow Fiber to reuse existing DOM nodes.'
            }
          ],
          commonMistakes: ['Using array index as key (`key={index}`) in dynamic lists, causing input focus bugs and broken animations when items are reordered or deleted'],
          bestPractices: ['Always use unique database IDs or UUIDs as list keys'],
          summary: `React Fiber provides interruptible, concurrent rendering with sub-frame responsiveness.`,
          resources: [{ title: 'Inside Fiber: In-depth Overview of React Reconciliation', url: 'https://github.com/acdlite/react-fiber-architecture', provider: 'Andrew Clark (React Core Team)', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc2_q1',
                question: 'Why does React Fiber use a double-buffering architecture with a `workInProgress` tree?',
                options: [
                  'To prepare and compute complex UI diffs asynchronously in memory without affecting the live screen until ready to commit in one instant swap',
                  'To store backup files on disk',
                  'To enable 3D rendering',
                  'To bypass browser security'
                ],
                correctIndex: 0,
                topic: 'Fiber Double Buffering',
                explanation: 'Double buffering allows React to build the new UI state in memory and commit it in a single synchronous operation, preventing partial UI glitches.'
              }
            ]
          },
          practicalTask: {
            title: 'Render an Optimally Keyed List',
            difficulty: 'Beginner',
            problemStatement: 'Write a React component `ItemList({ items })` that renders a `<ul>` where each item maps to `<li key={item.id}>{item.name}</li>`.',
            instructions: 'Map items to <li> with key={item.id}.',
            requirements: ['items.map(item => <li key={item.id}>{item.name}</li>)'],
            starterCode: `export default function ItemList({ items = [] }) {\n  // TODO: Render keyed list\n}`,
            solutionCode: `export default function ItemList({ items = [] }) {\n  return (\n    <ul>\n      {items.map(item => (\n        <li key={item.id}>{item.name}</li>\n      ))}\n    </ul>\n  );\n}`,
            hints: ['<ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>']
          }
        },
        {
          lessonNumber: 3,
          title: 'Component Lifecycle & Render Cycles',
          description: 'Master Mount, Update, and Unmount lifecycles, functional hook equivalents, render waterfalls, and strict mode double-invocations.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Map Class component lifecycles (componentDidMount, componentDidUpdate) to Hooks',
            'Understand why React 18 Strict Mode mounts, unmounts, and re-mounts components in development',
            'Identify and eliminate accidental Render Cascades and waterfalls'
          ],
          introduction: `Every React component undergoes three distinct lifecycle phases: Mounting (birth), Updating (growth/state changes), and Unmounting (death). In modern React, functional components manage these lifecycles through the \`useEffect\` hook and render scheduling.`,
          deepDiveSections: [
            {
              title: 'Why React 18 Strict Mode Renders Twice in Development',
              explanation: `In development mode inside \`<React.StrictMode>\`:
React intentionally mounts every component, immediately unmounts it, and re-mounts it again.
Why?
To help developers catch missing cleanup functions! If your \`useEffect\` sets an interval without clearing it in the return function, the Strict Mode double-invocation will immediately reveal the bug during development before it causes memory leaks in production.`,
              keyPoint: 'Strict Mode double-rendering in development guarantees that side-effect cleanup functions are properly implemented.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Class Lifecycles vs. Functional Hook Equivalents',
            headers: ['Class Component Lifecycle', 'Functional Hook Equivalent', 'Timing'],
            rows: [
              ['`componentDidMount`', '`useEffect(() => { ... }, [])`', 'Runs once after initial DOM mount'],
              ['`componentDidUpdate`', '`useEffect(() => { ... }, [dep])`', 'Runs when specified dependency values change'],
              ['`componentWillUnmount`', '`useEffect(() => { return () => cleanup() }, [])`', 'Runs immediately before component is destroyed from DOM']
            ]
          },
          coreConcepts: ['Mount -> Update -> Unmount lifecycle', 'Strict Mode double-invocation diagnostics', 'Render waterfall elimination'],
          syntax: `// Lifecycle Pattern in Functional React
useEffect(() => {
  // 1. Mount / Update logic
  const timer = setInterval(tick, 1000);

  // 2. Unmount cleanup logic
  return () => clearInterval(timer);
}, []); // Empty array = Mount only`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Resilient Timer Component with Lifecycle Cleanup
import React, { useState, useEffect } from 'react';

export default function AssessmentTimer({ durationSeconds, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    // Mandatory Cleanup: Clears interval on unmount or tick change!
    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp]);

  return (
    <div className="font-mono text-sm font-bold text-slate-800">
      Time Remaining: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
    </div>
  );
}`,
              explanation: 'Functional component implementing clean lifecycle interval management.'
            }
          ],
          commonMistakes: ['Leaving active event listeners or intervals un-cleaned, creating memory leaks when components unmount'],
          bestPractices: ['Always return a cleanup function from `useEffect` whenever establishing subscriptions, sockets, or timers'],
          summary: `Functional hooks encapsulate component lifecycles with built-in cleanup guarantees.`,
          resources: [{ title: 'Synchronizing with Effects: React Docs', url: 'https://react.dev/learn/synchronizing-with-effects', provider: 'React.dev', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'rc3_q1',
                question: 'Why does React 18 execute `useEffect` callbacks twice when running in development under `<React.StrictMode>`?',
                options: [
                  'To stress-test and verify that your effect cleanup functions work properly and prevent memory leaks',
                  'Because of a bug in React',
                  'To double the frame rate',
                  'To test the user\'s internet speed'
                ],
                correctIndex: 0,
                topic: 'Strict Mode Double Invocation',
                explanation: 'Strict Mode mounts, unmounts, and re-mounts components in development to expose missing cleanup logic.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement an Unmount Event Listener Cleanup',
            difficulty: 'Intermediate',
            problemStatement: 'Write a `useEffect` hook that listens to the `window` `"scroll"` event with function `handleScroll` and removes the listener in its cleanup return function.',
            instructions: 'Use window.addEventListener and window.removeEventListener in the cleanup return.',
            requirements: ['window.addEventListener("scroll", handleScroll)', 'return () => window.removeEventListener("scroll", handleScroll)', 'dependency array []'],
            starterCode: `useEffect(() => {\n  // TODO: Add and clean up scroll listener\n}, []);`,
            solutionCode: `useEffect(() => {\n  window.addEventListener('scroll', handleScroll);\n  return () => window.removeEventListener('scroll', handleScroll);\n}, []);`,
            hints: ['window.addEventListener("scroll", handleScroll); return () => window.removeEventListener("scroll", handleScroll);']
          }
        }
      ]
    },
    {
      title: 'Phase 2: State Management & Hooks Mastery',
      order: 2,
      lessons: [
        {
          lessonNumber: 4,
          title: 'useState & Complex State Patterns',
          description: 'Master functional state updates, atomic batching, managing complex nested state objects, and avoiding stale closures.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master React 18 Automatic Batching across promises and event handlers',
            'Update complex nested state immutably using shallow copies and spread operators',
            'Diagnose and fix Stale Closure bugs using functional state updaters'
          ],
          introduction: `\`useState\` is the core hook for managing local component state. In React 18, all state updates are automatically batched together into single render passes, minimizing DOM churn. Managing complex objects and avoiding stale closure traps is essential for senior React engineers.`,
          deepDiveSections: [
            {
              title: 'Stale Closures & The Functional State Updater Fix',
              explanation: `How stale closures occur:
When an asynchronous callback (e.g. \`setTimeout\` or \`fetch\`) captures the variable \`count\`:
\`\`\`javascript
const [count, setCount] = useState(0);
setTimeout(() => {
  setCount(count + 1); // Stale! 'count' is captured as 0 even if state changed!
}, 3000);
\`\`\`
The Fix: Use a Functional Updater:
\`setCount(prev => prev + 1)\`
React passes the most current, up-to-date pending state into the updater function, completely immune to stale closures!`,
              keyPoint: 'Always use functional state updaters `setState(prev => ...)` when computing new state from previous state.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Direct State Setter vs. Functional State Setter',
            headers: ['Feature', 'Direct Setter `setCount(count + 1)`', 'Functional Setter `setCount(prev => prev + 1)`'],
            rows: [
              ['Consecutive Updates', 'Overwrites previous calls in same batch', 'Queues and accumulates all sequential updates'],
              ['Async Closures', 'Vulnerable to capturing stale variables', 'Always receives fresh current state'],
              ['Best Use Case', 'Setting static non-dependent values', 'Counters, toggle switches, array additions']
            ]
          },
          coreConcepts: ['React 18 automatic batching', 'Immutable nested object updates', 'Functional state updater callbacks'],
          syntax: `// Immutable Nested State Update
setUser(prev => ({
  ...prev,
  preferences: {
    ...prev.preferences,
    theme: 'dark'
  }
}));`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Multi-Step Quiz Answer State Handler
import React, { useState } from 'react';

export default function AssessmentState() {
  const [answers, setAnswers] = useState({});

  const selectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  return (
    <div>
      <button onClick={() => selectOption('q1', 2)}>Select Option C</button>
      <pre>{JSON.stringify(answers, null, 2)}</pre>
    </div>
  );
}`,
              explanation: 'Immutably updates dynamic keys in nested answer state objects.'
            }
          ],
          commonMistakes: ['Mutating nested arrays with `state.items.push()` instead of `[...state.items, newItem]`'],
          bestPractices: ['Treat all state structures as strictly read-only and return new copies on every update'],
          summary: `Functional state updaters and immutable updates guarantee glitch-free state transitions in React.`,
          resources: [{ title: 'Updating Objects in State: React Docs', url: 'https://react.dev/learn/updating-objects-in-state', provider: 'React.dev', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'rc4_q1',
                question: 'If you call `setCount(count + 1)` three times consecutively inside a single button click handler where initial `count = 0`, what will the final count be?',
                options: [
                  '1 (Because all three calls capture count as 0 during that render cycle)',
                  '3',
                  '0',
                  'NaN'
                ],
                correctIndex: 0,
                topic: 'State Batching',
                explanation: 'Direct state setters capture the snapshot value from the current render; to achieve 3, you must use functional updaters `setCount(prev => prev + 1)`.'
              }
            ]
          },
          practicalTask: {
            title: 'Immutably Append to an Array State',
            difficulty: 'Beginner',
            problemStatement: 'Write the functional state update call `setItems(prev => ...)` that appends `newItem` to the end of the array state.',
            instructions: 'Use setItems(prev => [...prev, newItem]).',
            requirements: ['setItems(prev => [...prev, newItem])'],
            starterCode: `setItems(prev => `,
            solutionCode: `setItems(prev => [...prev, newItem]);`,
            hints: ['setItems(prev => [...prev, newItem]);']
          }
        },
        {
          lessonNumber: 5,
          title: 'useEffect: Dependencies, Cleanup & Race Condition Handling',
          description: 'Master dependency arrays, referential equality triggers, AbortController cancellation, and race condition prevention.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master the rules of the `useEffect` Dependency Array and referential identity',
            'Cancel in-flight network requests using `AbortController` in cleanup handlers',
            'Prevent asynchronous race condition state overwrites'
          ],
          introduction: `Effects let you step outside of React to synchronize your components with external systems like non-React widgets, network sockets, or browser APIs. Misunderstanding dependency arrays and ignoring network race conditions causes severe UI bugs.`,
          deepDiveSections: [
            {
              title: 'Network Race Conditions & AbortController Solution',
              explanation: `What is a Network Race Condition?
1. User clicks "Docker" tab: React launches API request 1 (slow, takes 2000ms).
2. User clicks "Python" tab: React launches API request 2 (fast, takes 300ms).
3. Request 2 finishes first: UI displays Python data.
4. Request 1 finishes late: UI gets overwritten with stale Docker data while the user is looking at Python!
Solution with AbortController:
\`\`\`javascript
useEffect(() => {
  const controller = new AbortController();
  fetchSkill(skillId, { signal: controller.signal })
    .then(data => setSkill(data))
    .catch(err => { if (err.name !== 'AbortError') setError(err); });

  return () => controller.abort(); // Cancels request 1 immediately on skillId change!
}, [skillId]);
\`\`\``,
              keyPoint: 'AbortController cleanup cancels obsolete in-flight requests, completely eliminating network race conditions.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: useEffect Dependency Configurations',
            headers: ['Dependency Array', 'When Effect Runs', 'Typical Use Case'],
            rows: [
              ['No dependency array `useEffect(fn)`', 'After EVERY single render', 'Rare (Global DOM logging, custom canvas sync)'],
              ['Empty array `useEffect(fn, [])`', 'Once after initial mount only', 'Initial API bootstrap, establishing persistent WebSockets'],
              ['With variables `useEffect(fn, [id, search])`', 'On mount + when any dependency changes', 'Data fetching based on URL params, debounced search']
            ]
          },
          coreConcepts: ['Referential equality in dependency arrays', '`AbortController` network cancellation', 'Synchronizing with external systems'],
          syntax: `// Production useEffect with AbortController
useEffect(() => {
  let isMounted = true;
  const abortCtrl = new AbortController();

  async function loadData() {
    try {
      const res = await api.get(\`/skills/\${skillId}\`, { signal: abortCtrl.signal });
      if (isMounted) setSkill(res.data);
    } catch (e) {
      if (e.name !== 'CanceledError') setError(e);
    }
  }

  loadData();
  return () => {
    isMounted = false;
    abortCtrl.abort();
  };
}, [skillId]);`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Resilient Debounced Search Hook
import { useState, useEffect } from 'react';

export function useDebounce(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Cancels previous timer if user types another character before delay expires!
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}`,
              explanation: 'Custom debounce hook utilizing timer cleanups.'
            }
          ],
          commonMistakes: ['Passing non-memoized object literals directly into dependency arrays, causing infinite render loops due to new object references on every render'],
          bestPractices: ['Pass primitive strings/numbers in dependency arrays or wrap objects with `useMemo`'],
          summary: `Proper dependency management and AbortController cleanups ensure rock-solid effect synchronization without race conditions.`,
          resources: [{ title: 'You Might Not Need an Effect: React Docs', url: 'https://react.dev/learn/you-might-not-need-an-effect', provider: 'React.dev', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc5_q1',
                question: 'Why does passing an un-memoized object `{ id: 1 }` directly in a `useEffect` dependency array cause an infinite render loop?',
                options: [
                  'Because JavaScript objects are compared by reference; a new object reference is created on every render, triggering the effect repeatedly',
                  'Because React prohibits objects in effects',
                  'Because the browser runs out of memory',
                  'There is no infinite loop'
                ],
                correctIndex: 0,
                topic: 'Dependency Referential Equality',
                explanation: 'React compares dependencies using `Object.is()`. New object literals have different memory addresses on every render.'
              }
            ]
          },
          practicalTask: {
            title: 'Build an AbortController Fetch Cleanup',
            difficulty: 'Intermediate',
            problemStatement: 'Write the cleanup return function in a `useEffect` that calls `controller.abort()` on an `AbortController` instance `controller`.',
            instructions: 'Return () => controller.abort().',
            requirements: ['return () => controller.abort()'],
            starterCode: `useEffect(() => {\n  const controller = new AbortController();\n  // ... fetch\n  // TODO: Return cleanup\n}, [url]);`,
            solutionCode: `useEffect(() => {\n  const controller = new AbortController();\n  return () => controller.abort();\n}, [url]);`,
            hints: ['return () => controller.abort();']
          }
        },
        {
          lessonNumber: 6,
          title: 'Advanced Hooks: useContext, useReducer, useRef & useImperativeHandle',
          description: 'Master Redux-style state machines with useReducer, mutable DOM refs without re-rendering (useRef), and Context API.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Manage complex multi-action state transitions with `useReducer` and action dispatchers',
            'Store mutable values and DOM node handles without triggering re-renders using `useRef`',
            'Expose imperative child component methods to parent components using `useImperativeHandle`'
          ],
          introduction: `When local state logic grows complex with multiple interdependent sub-values, \`useReducer\` provides a structured, Redux-like state machine pattern. Combined with \`useRef\` for mutable references and \`useContext\` for global distribution, these hooks handle enterprise application state.`,
          deepDiveSections: [
            {
              title: 'useReducer State Machine Architecture',
              explanation: `How useReducer structures complex state:
1. State Object: \`{ status: 'idle', data: null, error: null, stepIndex: 0 }\`.
2. Action Objects: Plain objects with descriptive types: \`{ type: 'FETCH_SUCCESS', payload: data }\`.
3. Pure Reducer Function: \`(state, action) => newState\`. Given current state and an action, computes next state deterministically.
Benefits: All state transition logic is centralized in one pure function outside of UI components, making it 100% unit-testable without rendering any DOM!`,
              keyPoint: 'useReducer centralizes complex state transitions into a pure, testable reducer function.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: useState vs. useReducer vs. useRef',
            headers: ['Hook', 'Triggers Re-render on Change?', 'Best For'],
            rows: [
              ['`useState`', 'Yes (Triggers component re-render)', 'Simple independent values (strings, booleans, counters)'],
              ['`useReducer`', 'Yes (Triggers component re-render)', 'Complex state machines with multiple interdependent action types'],
              ['`useRef`', 'No (Silent mutable reference update)', 'DOM node handles, timer IDs, tracking previous render values']
            ]
          },
          coreConcepts: ['Deterministic state reducers', 'Mutable values without re-rendering (`useRef`)', 'Imperative child handles (`useImperativeHandle`)'],
          syntax: `// useReducer pattern
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'SUBMIT_ANSWER', payload: { qId: 'q1', ans: 2 } });`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Complete Lesson Assessment Reducer
import React, { useReducer } from 'react';

const initialState = { status: 'idle', score: 0, currentQuestion: 0, error: null };

function assessmentReducer(state, action) {
  switch (action.type) {
    case 'START_QUIZ':
      return { ...state, status: 'in_progress', score: 0, currentQuestion: 0 };
    case 'ANSWER_QUESTION':
      const isCorrect = action.payload.isCorrect;
      return {
        ...state,
        score: isCorrect ? state.score + 1 : state.score,
        currentQuestion: state.currentQuestion + 1
      };
    case 'FINISH_QUIZ':
      return { ...state, status: 'completed' };
    default:
      return state;
  }
}`,
              explanation: 'Deterministic assessment state machine handling quiz transitions.'
            }
          ],
          commonMistakes: ['Using `useState` to store timer IDs or previous render values, causing unnecessary re-renders on every tick'],
          bestPractices: ['Use `useRef` for timer references, socket instances, and DOM focus handles'],
          summary: `useReducer and useRef provide structured state transitions and zero-re-render mutable references.`,
          resources: [{ title: 'Extracting State Logic into a Reducer: React Docs', url: 'https://react.dev/learn/extracting-state-logic-into-a-reducer', provider: 'React.dev', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc6_q1',
                question: 'Does mutating `ref.current` (e.g. `timerRef.current = 101`) trigger a component re-render in React?',
                options: [
                  'No, mutating a ref is a silent in-memory update that does NOT trigger a re-render',
                  'Yes, it immediately re-renders the whole page',
                  'Only if the ref contains an integer',
                  'It throws an error'
                ],
                correctIndex: 0,
                topic: 'useRef Mechanics',
                explanation: '`useRef` returns a plain mutable object whose `.current` property can be modified without triggering re-renders.'
              }
            ]
          },
          practicalTask: {
            title: 'Focus an Input with useRef',
            difficulty: 'Beginner',
            problemStatement: 'Write a React component `FocusInput()` that creates an `inputRef = useRef(null)` and a button that calls `inputRef.current.focus()` on click.',
            instructions: 'Use useRef, attach ref={inputRef} to input, and call focus on click.',
            requirements: ['const inputRef = useRef(null)', '<input ref={inputRef} />', 'onClick={() => inputRef.current.focus()}'],
            starterCode: `import React, { useRef } from 'react';\n\nexport default function FocusInput() {\n  // TODO: Implement focus ref\n}`,
            solutionCode: `import React, { useRef } from 'react';\n\nexport default function FocusInput() {\n  const inputRef = useRef(null);\n  return (\n    <div>\n      <input ref={inputRef} type="text" />\n      <button onClick={() => inputRef.current?.focus()}>Focus</button>\n    </div>\n  );\n}`,
            hints: ['const inputRef = useRef(null); <input ref={inputRef} /> <button onClick={() => inputRef.current?.focus()}>Focus</button>']
          }
        },
        {
          lessonNumber: 7,
          title: 'Custom React Hooks & Code Reusability',
          description: 'Extract reusable stateful logic into custom hooks: useLocalStorage, useMediaQuery, useKeyPress, and useOnlineStatus.',
          estimatedMinutes: 30,
          learningObjectives: [
            'Extract cross-cutting stateful logic into pure custom React hooks',
            'Compose multiple built-in hooks (useState, useEffect, useCallback) inside custom hooks',
            'Publish and maintain clean, strongly-typed custom hook libraries'
          ],
          introduction: `Custom hooks allow you to extract component logic into reusable functions. If multiple components need to synchronize state with \`localStorage\`, listen to browser media queries, or check online network connectivity, custom hooks share stateful logic without duplicating code.`,
          deepDiveSections: [
            {
              title: 'Custom Hook Composition & Contract Rules',
              explanation: `Rules of Custom Hooks:
1. Naming Convention: Custom hooks MUST start with the prefix \`use\` (e.g. \`useAuth\`, \`useDarkMode\`). This allows React's linter to enforce the Rules of Hooks.
2. Independent State: Every component that calls a custom hook receives its own completely isolated copy of state. Custom hooks share stateful *logic*, not state data itself!`,
              keyPoint: 'Custom hooks share stateful execution logic across components while maintaining independent state instances.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Custom Hooks vs. Higher-Order Components (HOCs)',
            headers: ['Technique', 'Code Structure', 'Wrapper Hell Risk', 'TypeScript Typings'],
            rows: [
              ['Custom Hook', 'Direct functional call inside component (`const data = useData()`)', 'Zero (No extra DOM wrapper components)', 'Clean, direct return type inference'],
              ['HOC (`withRouter(Component)`)', 'Wraps component in another component', 'High (Deep nested wrapper trees in React DevTools)', 'Complex generic props typing']
            ]
          },
          coreConcepts: ['Custom hook naming rules', 'Stateful logic reuse without DOM wrappers', 'Composing hooks (useLocalStorage)'],
          syntax: `// Custom Hook Declaration
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Production useLocalStorage Hook with JSON Serialization
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(\`Error saving to localStorage key "\${key}":\`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}`,
              explanation: 'Custom hook synchronizing state with browser localStorage seamlessly.'
            }
          ],
          commonMistakes: ['Calling custom hooks conditionally inside if/else blocks, violating the fundamental Rules of Hooks'],
          bestPractices: ['Always call custom hooks at the top level of React functional components'],
          summary: `Custom hooks provide clean, composable abstractions for sharing stateful logic across components.`,
          resources: [{ title: 'Reusing Logic with Custom Hooks: React Docs', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks', provider: 'React.dev', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'rc7_q1',
                question: 'When two different components call the same custom hook `useCounter()`, do they share the exact same state value or independent state instances?',
                options: [
                  'Each component gets its own completely independent state instance',
                  'They share a single global state value',
                  'React throws an error',
                  'Only the first component can update state'
                ],
                correctIndex: 0,
                topic: 'Custom Hook State Isolation',
                explanation: 'Custom hooks share stateful logic, but every component calling the hook initializes its own isolated state variables.'
              }
            ]
          },
          practicalTask: {
            title: 'Build a useToggle Custom Hook',
            difficulty: 'Beginner',
            problemStatement: 'Write a custom hook `useToggle(initial = false)` that returns `[value, toggle]` where `toggle` is a function that negates the current boolean value.',
            instructions: 'Use useState and a toggle callback calling setValue(prev => !prev).',
            requirements: ['const [value, setValue] = useState(initial)', 'const toggle = () => setValue(prev => !prev)', 'return [value, toggle]'],
            starterCode: `import { useState } from 'react';\n\nexport function useToggle(initial = false) {\n  // TODO: Return [value, toggle]\n}`,
            solutionCode: `import { useState } from 'react';\n\nexport function useToggle(initial = false) {\n  const [value, setValue] = useState(initial);\n  const toggle = () => setValue(prev => !prev);\n  return [value, toggle];\n}`,
            hints: ['const [value, setValue] = useState(initial); const toggle = () => setValue(prev => !prev); return [value, toggle];']
          }
        }
      ]
    },
    {
      title: 'Phase 3: Component Patterns & Architecture',
      order: 3,
      lessons: [
        {
          lessonNumber: 8,
          title: 'Compound Components & Render Props Patterns',
          description: 'Build flexible UI component libraries using Compound Components (Tabs, Accordions), React.Children, and Context.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Implement the Compound Component pattern used by Radix UI and Headless UI',
            'Share implicit state between parent and child components via internal Context',
            'Build highly customizable component interfaces with inversion of control'
          ],
          introduction: `Building flexible UI libraries (like Accordions, Modals, and Dropdowns) requires component composition. The Compound Component pattern allows components like \`<Tabs>\`, \`<Tabs.List>\`, and \`<Tabs.Panel>\` to share implicit state behind the scenes while giving the developer complete freedom over layout markup.`,
          deepDiveSections: [
            {
              title: 'Compound Component Architecture with Context',
              explanation: `How Compound Components work:
1. Parent Container (\`<Accordion>\`): Holds active panel state and provides an internal \`AccordionContext\`.
2. Child Trigger (\`<Accordion.Trigger>\`): Consumes context to toggle open/closed state on click.
3. Child Content (\`<Accordion.Content>\`): Consumes context to conditionally render markup.
Benefits: No "prop drilling"! The consumer can wrap triggers and content in arbitrary \`<div>\` grids or cards without breaking state coordination.`,
              keyPoint: 'Compound components communicate via an internal Context, providing flexible layout composition.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Prop-Heavy Monolith vs. Compound Components',
            headers: ['Dimension', 'Prop-Heavy Monolith (`<Tabs items={[...]} />`)', 'Compound Components (`<Tabs><Tabs.List>...`)'],
            rows: [
              ['Custom Layout', 'Rigid (Cannot change internal HTML without new props)', 'Complete freedom to place icons, wrappers, and cards anywhere'],
              ['Prop Complexity', 'Dozens of complex configuration props (`tabHeaderClass`, `renderIcon`)', 'Clean, self-describing declarative subcomponents'],
              ['Maintainability', 'High component complexity with many if/else branches', 'Small, focused subcomponents with single responsibilities']
            ]
          },
          coreConcepts: ['Compound component pattern', 'Implicit state sharing via internal context', 'Inversion of Control in UI design'],
          syntax: `// Compound Component Usage
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="curriculum">Curriculum</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview"><SkillOverview /></Tabs.Panel>
  <Tabs.Panel value="curriculum"><CurriculumTree /></Tabs.Panel>
</Tabs>`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Complete Compound Toggle Implementation
import React, { useState, createContext, useContext } from 'react';

const ToggleContext = createContext();

export function Toggle({ children, onToggle }) {
  const [on, setOn] = useState(false);

  const toggle = () => {
    setOn(prev => {
      onToggle && onToggle(!prev);
      return !prev;
    });
  };

  return (
    <ToggleContext.Provider value={{ on, toggle }}>
      {children}
    </ToggleContext.Provider>
  );
}

Toggle.On = function ToggleOn({ children }) {
  const { on } = useContext(ToggleContext);
  return on ? children : null;
};

Toggle.Off = function ToggleOff({ children }) {
  const { on } = useContext(ToggleContext);
  return on ? null : children;
};

Toggle.Button = function ToggleButton(props) {
  const { toggle } = useContext(ToggleContext);
  return <button onClick={toggle} {...props} />;
};`,
              explanation: 'Compound Toggle component exposing Toggle.On, Toggle.Off, and Toggle.Button.'
            }
          ],
          commonMistakes: ['Trying to clone and inject props via `React.cloneElement`, which breaks when child elements are wrapped in intermediary `<div>` elements; use React Context instead!'],
          bestPractices: ['Always use an internal React Context to coordinate state across compound subcomponents'],
          summary: `Compound components deliver clean, declarative, and highly flexible component APIs for modern design systems.`,
          resources: [{ title: 'Compound Components Pattern Guide', url: 'https://kentcdodds.com/blog/compound-components-with-react-hooks', provider: 'Kent C. Dodds', type: 'Article', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc8_q1',
                question: 'What is the primary mechanism used by modern Compound Components to share state between parent and child elements across arbitrary DOM nesting?',
                options: [
                  'An internal React Context provider',
                  'Global window variables',
                  'DOM class name scanning',
                  'Direct DOM manipulation'
                ],
                correctIndex: 0,
                topic: 'Compound Components',
                explanation: 'React Context allows parent compound components to provide state to all descendants regardless of how many nested divs surround them.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Context-Driven Compound Subcomponent',
            difficulty: 'Intermediate',
            problemStatement: 'Write a subcomponent `Card.Title({ children })` that consumes `CardContext` using `useContext` and renders `<h3 className="card-title">{children}</h3>`.',
            instructions: 'Use useContext(CardContext) and render <h3>.',
            requirements: ['Card.Title = function({ children })', 'render <h3 className="card-title">{children}</h3>'],
            starterCode: `const CardContext = React.createContext();\n\nfunction CardTitle({ children }) {\n  // TODO: Render title\n}`,
            solutionCode: `const CardContext = React.createContext();\n\nfunction CardTitle({ children }) {\n  const context = React.useContext(CardContext);\n  return <h3 className="card-title">{children}</h3>;\n}`,
            hints: ['return <h3 className="card-title">{children}</h3>;']
          }
        },
        {
          lessonNumber: 9,
          title: 'Performance Optimization: React.memo, useMemo & useCallback',
          description: 'Profile rendering performance with React DevTools Profiler, eliminate unnecessary re-renders, and memoize computations.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Identify unnecessary component re-renders using the React DevTools Profiler',
            'Prevent child re-renders using `React.memo` and shallow prop comparison',
            'Preserve function reference equality with `useCallback` and cache heavy operations with `useMemo`'
          ],
          introduction: `By default in React, when a parent component re-renders, ALL of its child components re-render recursively. On complex pages with thousands of DOM nodes (like code editors or live dashboards), unnecessary re-renders cause UI stutter and high CPU usage.`,
          deepDiveSections: [
            {
              title: 'When to Memoize (and When NOT to Memoize)',
              explanation: `Memoization is not free; \`useMemo\` and \`useCallback\` consume memory and add runtime comparison overhead on every render!
When to use \`React.memo\`:
1. The component re-renders frequently with the EXACT SAME props.
2. The component contains heavy computation or renders large DOM subtrees.
3. You pass callback functions wrapped in \`useCallback\` to preserve referential equality (\`prevCallback === nextCallback\`).`,
              keyPoint: 'React.memo prevents child re-renders only when passed props maintain referential equality (via useCallback and useMemo).'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Memoization Tools in React',
            headers: ['Tool', 'Wraps', 'Prevents', 'Comparison Mechanism'],
            rows: [
              ['`React.memo`', 'Component Function', 'Re-rendering of child component if props haven\'t changed', 'Shallow equality (`prevProps[key] === nextProps[key]`)'],
              ['`useMemo`', 'Calculation Result Value', 'Re-calculating expensive mathematical/filtering operations', 'Dependency array equality (`Object.is`)'],
              ['`useCallback`', 'Callback Function Reference', 'Re-creating new function memory pointers on each render', 'Dependency array equality (`Object.is`)']
            ]
          },
          coreConcepts: ['React DevTools Profiler flamegraphs', 'Shallow prop comparison in `React.memo`', 'Referential equality stability with `useCallback`'],
          syntax: `// Memoized Pure Component
const MemoizedSkillRow = React.memo(function SkillRow({ skill, onSelect }) {
  return <div onClick={() => onSelect(skill.id)}>{skill.title}</div>;
});`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Complete Performance Optimization Pattern
import React, { useState, useMemo, useCallback } from 'react';

export default function SkillsDashboard({ allSkills }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // 1. Memoize expensive filter/sort calculation
  const filteredSkills = useMemo(() => {
    return allSkills.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
  }, [allSkills, query]);

  // 2. Memoize callback reference so MemoizedRow doesn't re-render!
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {filteredSkills.map(skill => (
        <MemoizedSkillRow key={skill.id} skill={skill} onSelect={handleSelect} />
      ))}
    </div>
  );
}`,
              explanation: 'Combines useMemo, useCallback, and React.memo for high-performance list rendering.'
            }
          ],
          commonMistakes: ['Wrapping a component in `React.memo` while passing an inline arrow function (`onSelect={() => ...}`), which creates a new reference on every render and breaks memoization!'],
          bestPractices: ['Always wrap callbacks in `useCallback` when passing them to `React.memo` child components'],
          summary: `React.memo, useMemo, and useCallback eliminate redundant render cascades and keep UI interactions silky smooth.`,
          resources: [{ title: 'useMemo and useCallback Guide: React Docs', url: 'https://react.dev/reference/react/useMemo', provider: 'React.dev', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc9_q1',
                question: 'Why does passing an inline arrow function `<Child onClick={() => doSomething()} />` defeat `React.memo(Child)` optimization?',
                options: [
                  'A new function reference is instantiated in memory on every parent render, causing shallow prop comparison to evaluate to false',
                  'Inline functions cause React to crash',
                  'React.memo only works on strings',
                  'Inline functions are converted to class components'
                ],
                correctIndex: 0,
                topic: 'Referential Equality in Memoization',
                explanation: 'Inline arrow functions create fresh object instances on every render, failing shallow equality tests in `React.memo`.'
              }
            ]
          },
          practicalTask: {
            title: 'Memoize a Computation with useMemo',
            difficulty: 'Intermediate',
            problemStatement: 'Write the `useMemo` call that computes `items.filter(x => x.active)` only when `items` changes.',
            instructions: 'Use useMemo(() => items.filter(x => x.active), [items]).',
            requirements: ['useMemo(() => items.filter(x => x.active), [items])'],
            starterCode: `const activeItems = useMemo(\n  // TODO: Filter and dependencies\n);`,
            solutionCode: `const activeItems = useMemo(() => items.filter(x => x.active), [items]);`,
            hints: ['useMemo(() => items.filter(x => x.active), [items]);']
          }
        },
        {
          lessonNumber: 10,
          title: 'Form Architecture with React Hook Form & Zod Validation',
          description: 'Build uncontrolled high-performance forms with React Hook Form, resolver validation with Zod, and accessible field errors.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand why uncontrolled forms (React Hook Form) outperform controlled forms on large forms',
            'Integrate runtime schema validation using `zod` and `@hookform/resolvers/zod`',
            'Handle form submission state (isSubmitting, errors, isDirty, isValid)'
          ],
          introduction: `In traditional controlled React forms (\`useState\`), typing a single letter in an input re-renders the entire form and all surrounding components. React Hook Form isolates re-renders at the individual field level using uncontrolled inputs and native refs, delivering 10x faster typing performance.`,
          deepDiveSections: [
            {
              title: 'Uncontrolled Forms & Zod Resolver Integration',
              explanation: `Why React Hook Form is the enterprise standard:
1. Micro-Re-renders: Subscribes only to field states that change, eliminating form-wide re-renders during typing.
2. Zod Resolver (\`zodResolver(schema)\`): Validates user inputs against a strongly-typed Zod schema at runtime, populating \`formState.errors\` automatically.
3. Native HTML5 Accessibility: Integrates seamlessly with \`aria-invalid\` and \`aria-describedby\` for accessible screen readers.`,
              keyPoint: 'React Hook Form uses uncontrolled native refs for high-speed typing and integrates with Zod for schema validation.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: useState Controlled Forms vs. React Hook Form',
            headers: ['Metric', 'useState Controlled Form', 'React Hook Form (Uncontrolled)'],
            rows: [
              ['Re-renders per Keystroke', 'Entire Form component re-renders on every character', '0 component re-renders (Native DOM input update)'],
              ['Form with 50 Inputs Performance', 'Noticeable typing lag / input delay', 'Instantaneous, silky-smooth 60fps typing'],
              ['Schema Validation', 'Manual conditional validation in onSubmit', 'Declarative Zod / Yup resolver integration']
            ]
          },
          coreConcepts: ['Uncontrolled form registration (`register`)', 'Zod schema resolver validation', '`formState.isSubmitting` lifecycle'],
          syntax: `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Production React Hook Form + Zod Component
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const studentProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cgpa: z.number().min(0).max(10),
  graduationYear: z.number().int().min(2024).max(2030)
});

export default function StudentForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(studentProfileSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold">Full Name</label>
        <input {...register('name')} className="border p-2 rounded w-full" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <button disabled={isSubmitting} className="px-4 py-2 bg-purple-600 text-white rounded">
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}`,
              explanation: 'Type-safe accessible form with automated Zod validation.'
            }
          ],
          commonMistakes: ['Not using `valueAsNumber: true` in `register()` for numeric inputs, causing numbers to be validated as strings'],
          bestPractices: ['Use `zodResolver` with React Hook Form and provide clear inline error messages'],
          summary: `React Hook Form and Zod provide blazing-fast, type-safe form validation with minimal component re-renders.`,
          resources: [{ title: 'React Hook Form Documentation', url: 'https://react-hook-form.com/get-started', provider: 'React Hook Form', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc10_q1',
                question: 'Why does React Hook Form achieve higher typing performance than traditional `useState` controlled forms on large forms?',
                options: [
                  'It utilizes uncontrolled inputs backed by native DOM refs, avoiding re-rendering the entire form component on every keystroke',
                  'It compiles forms into WebAssembly',
                  'It stores inputs in the cloud',
                  'It deletes invalid keystrokes'
                ],
                correctIndex: 0,
                topic: 'React Hook Form Architecture',
                explanation: 'By registering inputs as native uncontrolled refs, user keystrokes update the DOM directly without triggering component re-renders.'
              }
            ]
          },
          practicalTask: {
            title: 'Register an Input with React Hook Form',
            difficulty: 'Beginner',
            problemStatement: 'Write an `<input>` element that spreads the `register("email")` return object from React Hook Form.',
            instructions: 'Use <input {...register("email")} />.',
            requirements: ['<input {...register("email")} />'],
            starterCode: `<input `,
            solutionCode: `<input {...register('email')} />`,
            hints: ['<input {...register("email")} />']
          }
        }
      ]
    },
    {
      title: 'Phase 4: Global State & Data Fetching',
      order: 4,
      lessons: [
        {
          lessonNumber: 11,
          title: 'Global State: Context API vs Zustand vs Redux Toolkit',
          description: 'Compare React Context API, Zustand atomic stores, and Redux Toolkit, evaluating render performance and boilerplate.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Evaluate the Context API vs Zustand vs Redux Toolkit decision matrix',
            'Understand why Context API causes re-render cascades on high-frequency state updates',
            'Implement high-performance atomic global stores with Zustand selectors'
          ],
          introduction: `As React applications scale, sharing state across distant component trees requires global state management. While Context API is built into React, high-frequency updates trigger re-renders across all consuming components. Modern architectures favor lightweight atomic stores like Zustand.`,
          deepDiveSections: [
            {
              title: 'Context API Re-render Trap vs. Zustand Selectors',
              explanation: `The Context API Re-render Problem:
When a Context Value object changes (\`{ user, theme, cart }\`), EVERY component that calls \`useContext(AppContext)\` MUST re-render, even if that component only cares about \`theme\`!
Zustand Selector Solution:
Zustand allows components to subscribe to exact atomic state slices:
\`\`\`javascript
const theme = useAppStore(state => state.theme);
\`\`\`
If \`user\` or \`cart\` changes, components subscribing only to \`theme\` do NOT re-render!`,
              keyPoint: 'Zustand selector subscriptions eliminate re-renders by updating components only when their specific state slice changes.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Global State Management Solutions',
            headers: ['Dimension', 'React Context API', 'Zustand', 'Redux Toolkit (RTK)'],
            rows: [
              ['Bundle Size', '0 KB (Built into React)', '~1 KB (Ultra lightweight)', '~12 KB (Heavier)'],
              ['Selector Subscriptions', 'No (All consumers re-render on any context change)', 'Yes (Subscribes to exact atomic slices)', 'Yes (`useSelector`)'],
              ['Boilerplate', 'Medium (Providers, Custom Hooks)', 'Minimal (Single `create()` function)', 'Higher (Slices, Reducers, Actions, Store)'],
              ['Best For', 'Low-frequency global state (Theme, Auth user)', 'Modern scalable web apps, rapid development', 'Large enterprise teams with strict action audit requirements']
            ]
          },
          coreConcepts: ['Context API re-render cascade mechanism', 'Zustand atomic state slices and selectors', 'Global store decoupling from React tree'],
          syntax: `// Zustand Store Creation
import { create } from 'zustand';

export const useSkillStore = create((set) => ({
  activeSkillId: null,
  setActiveSkill: (id) => set({ activeSkillId: id })
}));`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Zustand Store with Persistence and Atomic Selectors
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserPreferences = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme })
    }),
    { name: 'zenscore-preferences' }
  )
);

// Component subscribes ONLY to sidebarOpen!
export function SidebarButton() {
  const sidebarOpen = useUserPreferences(state => state.sidebarOpen);
  const toggle = useUserPreferences(state => state.toggleSidebar);
  return <button onClick={toggle}>{sidebarOpen ? 'Collapse' : 'Expand'}</button>;
}`,
              explanation: 'Zustand store with automatic localStorage persistence and selective subscriptions.'
            }
          ],
          commonMistakes: ['Placing high-frequency data (like mouse coordinates or real-time counters) into React Context, causing massive UI performance degradation'],
          bestPractices: ['Use Context for low-frequency data (Auth User, Theme) and Zustand for dynamic application state'],
          summary: `Zustand provides lightweight, boilerplate-free global state management with fine-grained atomic selector subscriptions.`,
          resources: [{ title: 'Zustand Documentation', url: 'https://docs.pmnd.rs/zustand/getting-started/introduction', provider: 'Poimandres', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'rc11_q1',
                question: 'Why does subscribing to state with Zustand selectors (e.g. `const theme = useStore(state => state.theme)`) prevent unnecessary re-renders?',
                options: [
                  'Zustand performs strict equality checks on the selected slice, re-rendering the component ONLY when `theme` itself changes',
                  'Zustand deletes unrendered components',
                  'Zustand disables React reconciliation',
                  'There is no difference from Context API'
                ],
                correctIndex: 0,
                topic: 'Zustand Selectors',
                explanation: 'Selectors ensure components only re-render when their specific subscribed slice of state changes.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a Zustand Store',
            difficulty: 'Beginner',
            problemStatement: 'Write a Zustand store `useCounterStore` using `create` containing `count: 0` and action `increment: () => set(state => ({ count: state.count + 1 }))`.',
            instructions: 'Import create from zustand and define store.',
            requirements: ['create((set) => ({ count: 0, increment: () => set(state => ({ count: state.count + 1 })) }))'],
            starterCode: `import { create } from 'zustand';\n\nexport const useCounterStore = create(\n  // TODO: Define count and increment\n);`,
            solutionCode: `import { create } from 'zustand';\n\nexport const useCounterStore = create((set) => ({\n  count: 0,\n  increment: () => set((state) => ({ count: state.count + 1 }))\n}));`,
            hints: ['create((set) => ({ count: 0, increment: () => set(state => ({ count: state.count + 1 })) }))']
          }
        },
        {
          lessonNumber: 12,
          title: 'Server State & Caching with TanStack Query (React Query)',
          description: 'Master asynchronous server state, automatic caching, background refetching on window focus, optimistic updates, and mutations.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Differentiate Client State (UI toggles, forms) from Server State (Remote async data)',
            'Master TanStack Query cache keys, staleTime, and gcTime (garbage collection)',
            'Implement instant Optimistic Updates with automatic rollback upon mutation failure'
          ],
          introduction: `Server State is fundamentally different from Client State: it is persisted remotely, shared across multiple users, requires asynchronous fetching, and can become out of date (stale). TanStack Query (React Query) is the industry standard for fetching, caching, synchronizing, and updating server state.`,
          deepDiveSections: [
            {
              title: 'Stale-While-Revalidate & Cache Lifecycle',
              explanation: `How TanStack Query manages data:
1. Cache Hit (Instant): Component renders cached data immediately with 0ms loading spinners.
2. Background Revalidation: TanStack Query fetches fresh data in the background if \`staleTime\` has elapsed.
3. Window Focus Refetching: If a user switches tabs and returns to the app, TanStack Query automatically refetches data to keep it synchronized with the backend.
Key Settings:
• \`staleTime\`: How long data is considered fresh before background refetching (e.g. 5 minutes).
• \`gcTime\` (Garbage Collection Time): How long inactive query data remains in memory.`,
              keyPoint: 'TanStack Query eliminates loading spinners by serving cached data while fetching fresh data in the background.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Manual useEffect Fetching vs. TanStack Query',
            headers: ['Feature', 'Manual `useEffect` + `useState`', 'TanStack Query (`useQuery`)'],
            rows: [
              ['Automatic In-Memory Caching', 'No (Refetches on every component remount)', 'Yes (Instant cached rendering across components)'],
              ['Request Deduplication', 'No (Multiple components trigger multiple HTTP calls)', 'Yes (Deduplicates identical queries into a single HTTP call)'],
              ['Refetch on Window Focus', 'Requires manual browser focus event listeners', 'Built-in automatic background synchronization'],
              ['Optimistic Mutations', 'Complex manual state rollback code', 'Structured `onMutate` and `onError` rollback pipeline']
            ]
          },
          coreConcepts: ['Stale-While-Revalidate caching pattern', 'Hierarchical Query Keys (`["skills", skillId]`)', 'Optimistic mutation rollbacks'],
          syntax: `// TanStack Query Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['skills', skillId],
  queryFn: () => api.getSkill(skillId),
  staleTime: 5 * 60 * 1000 // 5 minutes
});`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Optimistic Mutation with Automatic Rollback
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCompleteLesson(skillId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId) => api.completeLesson(skillId, lessonId),
    // When mutation is triggered:
    onMutate: async (lessonId) => {
      await queryClient.cancelQueries({ queryKey: ['skills', skillId] });
      const previousSkill = queryClient.getQueryData(['skills', skillId]);

      // Optimistically update cache immediately!
      queryClient.setQueryData(['skills', skillId], (old) => ({
        ...old,
        completedLessons: [...old.completedLessons, lessonId]
      }));

      return { previousSkill }; // Return context for rollback
    },
    // If mutation fails, roll back to snapshot!
    onError: (err, lessonId, context) => {
      queryClient.setQueryData(['skills', skillId], context.previousSkill);
    },
    // Always refetch in background after settling:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', skillId] });
    }
  });
}`,
              explanation: 'Enterprise mutation pipeline with instant optimistic cache updates and rollback.'
            }
          ],
          commonMistakes: ['Treating TanStack Query as just a data fetcher instead of an asynchronous state cache, and copying query data into local `useState`'],
          bestPractices: ['Consume `useQuery` data directly in components without copying to local `useState`'],
          summary: `TanStack Query provides robust server state synchronization, background revalidation, and optimistic updates.`,
          resources: [{ title: 'TanStack Query Official Overview', url: 'https://tanstack.com/query/latest/docs/framework/react/overview', provider: 'TanStack.com', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc12_q1',
                question: 'What is the purpose of `staleTime` in TanStack Query?',
                options: [
                  'Specifies the duration during which cached data is considered fresh, preventing background refetches on remount or window focus',
                  'Sets the timeout for the server to shut down',
                  'Deletes data from the browser history',
                  'Controls animation speeds'
                ],
                correctIndex: 0,
                topic: 'TanStack Query Caching',
                explanation: 'During `staleTime`, TanStack Query will return data directly from memory without triggering background network requests.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a useQuery Hook',
            difficulty: 'Intermediate',
            problemStatement: 'Write a `useQuery` invocation with queryKey `["profile", userId]`, queryFn `() => fetchProfile(userId)`, and `staleTime: 60000`.',
            instructions: 'Pass queryKey, queryFn, and staleTime to useQuery.',
            requirements: ['useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), staleTime: 60000 })'],
            starterCode: `const { data } = useQuery({\n  // TODO: Configure query\n});`,
            solutionCode: `const { data } = useQuery({\n  queryKey: ['profile', userId],\n  queryFn: () => fetchProfile(userId),\n  staleTime: 60000\n});`,
            hints: ['queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), staleTime: 60000']
          }
        },
        {
          lessonNumber: 13,
          title: 'Error Boundaries, Suspense & Code Splitting (React.lazy)',
          description: 'Catch rendering crashes with Error Boundaries, load async chunks with React.lazy and Suspense, and optimize initial bundle sizes.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Catch JavaScript runtime crashes in child trees using React Error Boundaries',
            'Code-split route components into separate lazy-loaded chunks using `React.lazy`',
            'Display fallback loading skeletons with `<Suspense fallback={<Skeleton />}>`'
          ],
          introduction: `A JavaScript error in one small part of the UI should not crash the entire application for the user. Error Boundaries catch rendering errors in component subtrees and display fallback error screens, while React.lazy and Suspense split monolithic JavaScript bundles into lightweight on-demand chunks.`,
          deepDiveSections: [
            {
              title: 'Error Boundary Class Architecture',
              explanation: `Error Boundaries MUST be Class components because they implement special lifecycle methods:
1. \`static getDerivedStateFromError(error)\`: Updates component state (\`{ hasError: true }\`) to render fallback UI on the next render pass.
2. \`componentDidCatch(error, errorInfo)\`: Catches the error and logs stack traces to telemetry services like Sentry.
Placing Error Boundaries around discrete modules (e.g. around the Skill Viewer, Chart widgets) ensures a crash in one widget leaves the rest of the navigation and dashboard fully interactive!`,
              keyPoint: 'Error Boundaries catch rendering exceptions in subtrees, preventing white-screen crashes.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Monolithic Single Bundle vs. Suspense Code Splitting',
            headers: ['Metric', 'Single Monolithic Bundle', 'Code-Split Route Chunks (`React.lazy`)'],
            rows: [
              ['Initial Download Size', '2.5 MB (Loads all pages and libraries at once)', '180 KB (Loads only the active homepage chunk)'],
              ['First Contentful Paint (FCP)', '2,800 ms on mobile 4G', '350 ms (Instant initial load)'],
              ['Route Transitions', 'Instant (Already in memory)', 'Streams route chunk with Suspense fallback skeleton']
            ]
          },
          coreConcepts: ['Class-based Error Boundary lifecycles', 'Dynamic route code-splitting with `React.lazy`', 'Declarative loading skeletons with `<Suspense>`'],
          syntax: `// Route-level Code Splitting with Suspense
import React, { Suspense, lazy } from 'react';

const SkillDetail = lazy(() => import('./pages/SkillDetail'));

function App() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <SkillDetail />
    </Suspense>
  );
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Production Error Boundary Class Component
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center border border-red-200 bg-red-50 rounded-xl">
          <h3 className="font-bold text-red-900">Something went wrong</h3>
          <p className="text-sm text-red-600 mt-1">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}`,
              explanation: 'Reusable Error Boundary catching rendering crashes with retry functionality.'
            }
          ],
          commonMistakes: ['Expecting Error Boundaries to catch async errors in `setTimeout` or event handlers; Error Boundaries only catch errors during component rendering and lifecycle methods'],
          bestPractices: ['Wrap major route layouts and complex interactive widgets in independent Error Boundaries'],
          summary: `Error Boundaries and Suspense code splitting ensure crash-resilient UIs with minimal initial bundle load times.`,
          resources: [{ title: 'Catching Rendering Errors with Error Boundaries: React Docs', url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary', provider: 'React.dev', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc13_q1',
                question: 'Which errors are caught by a React Error Boundary component?',
                options: [
                  'Errors that occur during rendering, in lifecycle methods, and in constructors of child components',
                  'Errors inside asynchronous setTimeout callbacks',
                  'Errors inside button onClick event handlers',
                  'Errors on the backend Express server'
                ],
                correctIndex: 0,
                topic: 'Error Boundary Scope',
                explanation: 'Error boundaries catch errors thrown during component rendering and lifecycle tree traversal.'
              }
            ]
          },
          practicalTask: {
            title: 'Wrap a Component with React.lazy and Suspense',
            difficulty: 'Intermediate',
            problemStatement: 'Write a React component `LazySkillPage()` that lazy loads `./SkillPage` using `React.lazy` and renders it wrapped in `<Suspense fallback={<div>Loading...</div>}>`.',
            instructions: 'Use const SkillPage = React.lazy(...) and wrap inside Suspense.',
            requirements: ['const SkillPage = React.lazy(() => import("./SkillPage"))', '<Suspense fallback={<div>Loading...</div>}><SkillPage /></Suspense>'],
            starterCode: `import React, { Suspense, lazy } from 'react';\n\n// TODO: Implement LazySkillPage\n`,
            solutionCode: `import React, { Suspense, lazy } from 'react';\n\nconst SkillPage = lazy(() => import('./SkillPage'));\n\nexport default function LazySkillPage() {\n  return (\n    <Suspense fallback={<div>Loading...</div>}>\n      <SkillPage />\n    </Suspense>\n  );\n}`,
            hints: ['const SkillPage = lazy(() => import("./SkillPage")); return <Suspense fallback={<div>Loading...</div>}><SkillPage /></Suspense>;']
          }
        }
      ]
    },
    {
      title: 'Phase 5: Next.js Architecture & Server Components',
      order: 5,
      lessons: [
        {
          lessonNumber: 14,
          title: 'Next.js 14 App Router vs Pages Router Architecture',
          description: 'Master the App Router directory structure (app/), layout hierarchies (layout.tsx, template.tsx), loading.tsx, and error.tsx.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand the Next.js 14 App Router file-system routing conventions',
            'Build nested layout hierarchies with persistent state preservation in `layout.tsx`',
            'Handle streaming skeletons with `loading.tsx` and error recovery with `error.tsx`'
          ],
          introduction: `Next.js 14 introduces the App Router built natively on React Server Components (RSC). Moving beyond the legacy Pages Router (\`pages/\`), the App Router (\`app/\`) supports nested layouts, streaming server rendering, and zero-bundle-size server components.`,
          deepDiveSections: [
            {
              title: 'App Router File System Conventions',
              explanation: `Special reserved filenames in Next.js 14:
• \`layout.tsx\`: Shared UI that wraps child routes. Persists state and does NOT re-render on navigation!
• \`page.tsx\`: The unique public view for the route.
• \`loading.tsx\`: Instant loading skeleton wrapped in React Suspense automatically.
• \`error.tsx\`: Client-side Error Boundary wrapping the route segment.
• \`not-found.tsx\`: Custom 404 UI rendered when \`notFound()\` is thrown.`,
              keyPoint: 'Next.js layout.tsx files preserve state across route navigations, eliminating page layout flashing.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Pages Router vs. Next.js 14 App Router',
            headers: ['Feature', 'Legacy Pages Router (`pages/`)', 'Modern App Router (`app/`)'],
            rows: [
              ['Default Component Type', 'Client Components (All JS sent to browser)', 'React Server Components (0 KB JS sent to browser)'],
              ['Layout Nesting', 'Manual custom `getLayout` patterns', 'Automatic recursive `layout.tsx` nesting'],
              ['Data Fetching', '`getServerSideProps` / `getStaticProps`', 'Native async/await directly inside Server Components'],
              ['Streaming UI', 'Not supported natively', 'Built-in streaming with `loading.tsx` and Suspense']
            ]
          },
          coreConcepts: ['App Router directory hierarchy', 'Nested `layout.tsx` persistence', 'Streaming with `loading.tsx`'],
          syntax: `// Next.js 14 Nested Route Layout (app/skills/layout.tsx)
export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <SkillsSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Server Component fetching data directly with async/await (app/skills/page.tsx)
import { db } from '@/lib/db';
import SkillCard from '@/components/SkillCard';

export default async function SkillsPage() {
  // Queries database directly on the server with 0 client API waterfalls!
  const skills = await db.skills.findMany({ where: { isPublished: true } });

  return (
    <div className="grid grid-cols-3 gap-4">
      {skills.map(skill => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}`,
              explanation: 'Server component querying the database directly with zero client bundle overhead.'
            }
          ],
          commonMistakes: ['Putting `"use client"` at the top of every file out of habit, losing all Server Component performance and SEO benefits'],
          bestPractices: ['Default to Server Components; add `"use client"` only when components need `useState`, `useEffect`, or browser event listeners'],
          summary: `The Next.js 14 App Router provides nested layouts, streaming server rendering, and zero-bundle-size React Server Components.`,
          resources: [{ title: 'Next.js App Router Documentation', url: 'https://nextjs.org/docs/app', provider: 'Nextjs.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc14_q1',
                question: 'What is the default component rendering mode for all components created inside the Next.js 14 `app/` directory?',
                options: [
                  'React Server Components (RSC)',
                  'Client Components',
                  'Static HTML only',
                  'WebAssembly'
                ],
                correctIndex: 0,
                topic: 'Next.js Server Components',
                explanation: 'In the App Router, all components are React Server Components by default unless explicitly marked with `"use client"`.'
              }
            ]
          },
          practicalTask: {
            title: 'Define an App Router Layout Component',
            difficulty: 'Beginner',
            problemStatement: 'Write a Next.js layout component `RootLayout({ children })` that returns an `<html><body><nav>ZenScore</nav>{children}</body></html>` tree.',
            instructions: 'Export default function RootLayout({ children }).',
            requirements: ['export default function RootLayout({ children })', 'return <html><body><nav>ZenScore</nav>{children}</body></html>'],
            starterCode: `export default function RootLayout({ children }) {\n  // TODO: Return root HTML\n}`,
            solutionCode: `export default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        <nav>ZenScore</nav>\n        {children}\n      </body>\n    </html>\n  );\n}`,
            hints: ['<html><body><nav>ZenScore</nav>{children}</body></html>']
          }
        },
        {
          lessonNumber: 15,
          title: 'React Server Components (RSC) vs Client Components (\'use client\')',
          description: 'Understand the RSC wire protocol, when to use Server vs Client components, composition boundaries, and passing server props.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand the React Server Component (RSC) execution model and serialization wire format',
            'Master the boundary rules between Server and Client Components (`"use client"`)',
            'Pass non-serializable Server Components as `children` to Client Components'
          ],
          introduction: `React Server Components (RSC) execute exclusively on the server and NEVER download JavaScript to the client browser. Client Components (\`"use client"\`) run on both server (during SSR) and client, providing interactivity like click handlers and state.`,
          deepDiveSections: [
            {
              title: 'The Interleaving Pattern (Passing Server Components to Client Components)',
              explanation: `A Client Component CANNOT directly import a Server Component (because the server component would get pulled into the client JavaScript bundle!).
The Solution: Pass the Server Component as \`children\`!
\`\`\`jsx
// Client Component
'use client';
export function ModalWrapper({ children }) {
  const [open, setOpen] = useState(false);
  return open ? <div className="modal">{children}</div> : null;
}

// Server Component (Parent)
export default function Page() {
  return (
    <ModalWrapper>
      <HeavyServerDatabaseViewer /> {/* Stays 100% on server! */}
    </ModalWrapper>
  );
}
\`\`\``,
              keyPoint: 'Pass Server Components as children to Client Components to preserve zero client bundle size.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: React Server Components vs. Client Components',
            headers: ['Dimension', 'Server Component (Default)', 'Client Component (`"use client"`)'],
            rows: [
              ['JavaScript Bundle Size', '0 KB (Zero bytes sent to browser)', 'Included in client JavaScript bundle'],
              ['Direct Database / Secret Access', 'Yes (Can read database, env secrets)', 'No (Exposes code to browser)'],
              ['React Hooks (`useState`, `useEffect`)', 'No (Cannot use interactive hooks)', 'Yes (Full access to state and lifecycle)'],
              ['Browser Event Handlers (`onClick`)', 'No', 'Yes']
            ]
          },
          coreConcepts: ['RSC serialization wire format', '`"use client"` directive boundaries', 'Component interleaving with `children`'],
          syntax: `'use client'; // Marks component boundary for client bundle

import { useState } from 'react';

export function InteractiveButton() {
  const [likes, setLikes] = useState(0);
  return <button onClick={() => setLikes(l => l + 1)}>Likes: {likes}</button>;
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Composing Server and Client Components Cleanly
// 1. Client Component for interactive search bar
'use client';
export function SearchInput({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

// 2. Server Component reading database directly
import { db } from '@/lib/db';
export async function SkillsList({ query }) {
  const skills = await db.skills.findMany({
    where: { title: { contains: query, mode: 'insensitive' } }
  });
  return <div>{skills.map(s => <p key={s.id}>{s.title}</p>)}</div>;
}`,
              explanation: 'Clean separation between interactive client input and server-side data component.'
            }
          ],
          commonMistakes: ['Importing server-only secrets (like database credentials) inside a file marked `"use client"`, leaking secrets to the browser'],
          bestPractices: ['Install `import "server-only"` in server utility files to catch accidental client imports at build time'],
          summary: `Mastering the boundary between Server and Client components unlocks zero-bundle performance with rich interactivity.`,
          resources: [{ title: 'Next.js Server and Client Components Guide', url: 'https://nextjs.org/docs/app/building-your-application/rendering/server-components', provider: 'Nextjs.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc15_q1',
                question: 'Can a React Server Component (RSC) directly access database models and private server environment variables without an API endpoint?',
                options: [
                  'Yes, because Server Components execute exclusively on the server and their code is never sent to the browser',
                  'No, all React components run in the browser',
                  'Only if the database is in MySQL',
                  'Only during unit tests'
                ],
                correctIndex: 0,
                topic: 'RSC Capabilities',
                explanation: 'Server Components execute only on the server, allowing direct database queries and secure environment access.'
              }
            ]
          },
          practicalTask: {
            title: 'Mark a Component for Client-Side Execution',
            difficulty: 'Beginner',
            problemStatement: 'Write the directive string that must be placed on the first line of a file to declare it as a Next.js Client Component.',
            instructions: 'Declare "use client"; on line 1.',
            requirements: ['"use client";'],
            starterCode: `// Line 1:\n`,
            solutionCode: `'use client';`,
            hints: ['\'use client\';']
          }
        },
        {
          lessonNumber: 16,
          title: 'Server-Side Rendering (SSR), Static Site Generation (SSG) & ISR',
          description: 'Master Static Generation, Dynamic Server Rendering, Incremental Static Regeneration (revalidate), and on-demand tag caching.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand Dynamic SSR vs Static SSG vs Incremental Static Regeneration (ISR)',
            'Implement time-based revalidation (`export const revalidate = 60`)',
            'Trigger on-demand cache invalidation using `revalidateTag()` and `revalidatePath()`'
          ],
          introduction: `Next.js provides hybrid rendering strategies: Static Site Generation (SSG) generates HTML at build time for instant CDN delivery, while Server-Side Rendering (SSR) generates fresh HTML on every request. Incremental Static Regeneration (ISR) combines the best of both worlds by updating static pages in the background without rebuilding the entire site.`,
          deepDiveSections: [
            {
              title: 'Incremental Static Regeneration (ISR) & on-demand revalidateTag',
              explanation: `How ISR functions in production:
1. Static CDN Delivery (0ms): Millions of users load pre-rendered static HTML from Cloudflare edge caches instantly.
2. Background Revalidation: Next.js checks \`revalidate = 3600\` (1 hour). When a user visits after 1 hour, Next.js serves the cached page while rebuilding a fresh version in the background.
3. On-Demand Invalidation: When an instructor updates a lesson in the database, the backend calls \`revalidateTag('skills')\`. The static cache is invalidated immediately worldwide without waiting for the timer!`,
              keyPoint: 'ISR enables static CDN speed for millions of users with automated and on-demand cache revalidation.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Rendering Strategies in Next.js',
            headers: ['Strategy', 'HTML Generation Timing', 'Speed (TTFB)', 'Data Freshness'],
            rows: [
              ['Static Generation (SSG)', 'Build time (npm run build)', 'Fastest (~20 ms via CDN edge cache)', 'Static until next deployment'],
              ['Incremental Static Regeneration (ISR)', 'Build time + Background rebuild per `revalidate` interval', 'Fastest (~20 ms via CDN edge cache)', 'Fresh within revalidation window or on-demand tag'],
              ['Server-Side Rendering (SSR)', 'On EVERY incoming user request', 'Medium (~150 ms – 500 ms)', '100% Real-time on every page refresh']
            ]
          },
          coreConcepts: ['Incremental Static Regeneration (`revalidate`)', 'On-demand `revalidateTag` cache purging', 'Dynamic vs Static rendering route segment configs'],
          syntax: `// Time-based ISR in Next.js (Revalidate every 60 seconds)
export const revalidate = 60;

// Fetch caching options
const res = await fetch('https://api.zenscore.ai/skills', {
  next: { tags: ['skills'], revalidate: 3600 }
});`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Server Action triggering on-demand cache revalidation
'use server';

import { revalidateTag } from 'next/cache';

export async function updateSkillCurriculum(skillId, formData) {
  await db.skills.update({ where: { id: skillId }, data: formData });
  
  // Instantly purges cached static pages worldwide!
  revalidateTag('skills');
  revalidateTag(\`skill-\${skillId}\`);
}`,
              explanation: 'Server Action mutating database and purging ISR static cache tags.'
            }
          ],
          commonMistakes: ['Calling `cookies()` or `headers()` inside a static page, which automatically forces Next.js to switch the page to Dynamic SSR rendering'],
          bestPractices: ['Use ISR with `revalidateTag` for high-traffic content (courses, blogs, documentation)'],
          summary: `Incremental Static Regeneration delivers sub-millisecond edge CDN performance with real-time data freshness.`,
          resources: [{ title: 'Next.js Data Fetching and Caching Guide', url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating', provider: 'Nextjs.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc16_q1',
                question: 'What happens when a user visits an Incremental Static Regeneration (ISR) page after its `revalidate = 3600` timer has expired?',
                options: [
                  'Next.js serves the cached static page instantly, while triggering a background re-render to update the cache for future visitors',
                  'The user receives a 504 Gateway Timeout',
                  'The server crashes and reboots',
                  'The page is deleted'
                ],
                correctIndex: 0,
                topic: 'ISR Mechanics',
                explanation: 'ISR uses Stale-While-Revalidate: the current visitor gets the fast cached page while a fresh version is generated in the background.'
              }
            ]
          },
          practicalTask: {
            title: 'Set Time-Based Revalidation in Next.js',
            difficulty: 'Beginner',
            problemStatement: 'Write the route segment export statement that sets the static revalidation interval to `3600` seconds.',
            instructions: 'Export const revalidate = 3600.',
            requirements: ['export const revalidate = 3600;'],
            starterCode: `// Export revalidate\n`,
            solutionCode: `export const revalidate = 3600;`,
            hints: ['export const revalidate = 3600;']
          }
        }
      ]
    },
    {
      title: 'Phase 6: Full-Stack Next.js Engineering',
      order: 6,
      lessons: [
        {
          lessonNumber: 17,
          title: 'Route Handlers (API Routes) & Server Actions',
          description: 'Build backend REST endpoints with Route Handlers (route.ts), type-safe form mutations with Server Actions, and optimistic updates.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Build backend REST API endpoints using Next.js Route Handlers (`app/api/.../route.ts`)',
            'Implement type-safe RPC mutations using Server Actions (`"use server"`)',
            'Handle form feedback and optimistic transitions with `useFormStatus` and `useOptimistic`'
          ],
          introduction: `Next.js 14 unifies frontend and backend in a single framework. Route Handlers (\`route.ts\`) provide traditional REST endpoints for external clients, while Server Actions (\`"use server"\`) enable frontend forms to invoke backend server functions directly without writing boilerplate API routes.`,
          deepDiveSections: [
            {
              title: 'Server Actions vs. Traditional Route Handlers',
              explanation: `How Server Actions revolutionize full-stack development:
• Traditional Way: Write API route \`POST /api/skills\` -> write fetch in React -> manage loading state -> parse JSON response.
• Server Actions Way: Define an async function with \`"use server"\`. Pass it directly to \`<form action={createSkillAction}>\`!
Next.js handles the POST request, serialization, security tokens, and cache revalidation automatically under the hood, even working with JavaScript disabled (Progressive Enhancement)!`,
              keyPoint: 'Server Actions execute backend mutations directly from client forms without manual API boilerplate.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Route Handlers vs. Server Actions',
            headers: ['Feature', 'Route Handlers (`route.ts`)', 'Server Actions (`"use server"`)'],
            rows: [
              ['Target Client', 'Public webhooks, mobile apps, third-party consumers', 'Integrated Next.js frontend UI components and forms'],
              ['Protocol', 'Standard REST HTTP verbs (GET, POST, DELETE)', 'Type-safe Remote Procedure Call (RPC) over HTTP POST'],
              ['Progressive Enhancement', 'Requires client-side JavaScript', 'Works natively with HTML forms even if JS fails to load']
            ]
          },
          coreConcepts: ['Route Handlers (`GET`, `POST`, `PATCH`, `DELETE`)', 'Server Actions (`"use server"`)', 'Form status hooks (`useFormStatus`, `useFormState`)'],
          syntax: `// Server Action Definition (app/actions.ts)
'use server';

import { revalidatePath } from 'next/cache';

export async function completeLessonAction(formData: FormData) {
  const lessonId = formData.get('lessonId');
  await db.completeLesson(lessonId);
  revalidatePath('/skills');
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// Route Handler (app/api/v1/skills/route.ts)
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  const skills = await db.skills.findMany({
    where: category ? { category } : {}
  });

  return NextResponse.json({ success: true, data: skills });
}

export async function POST(request) {
  const body = await request.json();
  const newSkill = await db.skills.create({ data: body });
  return NextResponse.json({ success: true, data: newSkill }, { status: 201 });
}`,
              explanation: 'Standard REST Route Handler implementing GET and POST endpoints in Next.js.'
            }
          ],
          commonMistakes: ['Forgetting that Server Actions can be invoked directly by malicious users; always validate permissions inside the Server Action function!'],
          bestPractices: ['Always authenticate the user and validate inputs with Zod inside Server Actions'],
          summary: `Route Handlers serve external REST requests, while Server Actions streamline full-stack React form mutations.`,
          resources: [{ title: 'Next.js Server Actions Guide', url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', provider: 'Nextjs.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc17_q1',
                question: 'What directive must be placed at the top of an async function or file to designate it as a Next.js Server Action?',
                options: [
                  '"use server";',
                  '"use backend";',
                  '"use action";',
                  '"use api";'
                ],
                correctIndex: 0,
                topic: 'Server Actions Syntax',
                explanation: '`"use server";` tells Next.js to treat the function as a secure backend RPC endpoint.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a Next.js GET Route Handler',
            difficulty: 'Beginner',
            problemStatement: 'Write an exported async function `GET()` in a Next.js route handler that returns `NextResponse.json({ status: "healthy" })`.',
            instructions: 'Import NextResponse from next/server and export async function GET().',
            requirements: ['import { NextResponse } from "next/server"', 'export async function GET()', 'return NextResponse.json({ status: "healthy" })'],
            starterCode: `import { NextResponse } from 'next/server';\n\n// TODO: Implement GET handler\n`,
            solutionCode: `import { NextResponse } from 'next/server';\n\nexport async function GET() {\n  return NextResponse.json({ status: 'healthy' });\n}`,
            hints: ['export async function GET() { return NextResponse.json({ status: "healthy" }); }']
          }
        },
        {
          lessonNumber: 18,
          title: 'Next.js Middleware, Authentication & Protected Routes',
          description: 'Implement edge middleware (middleware.ts), JWT session decoding, cookie inspection, dynamic route guards, and geo-routing.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Write Next.js Edge Middleware running on V8 Edge Workers before route execution',
            'Protect private routes by inspecting authentication cookies and redirecting unauthenticated visitors',
            'Rewrite URLs and modify request headers using `NextResponse.next()` and `NextResponse.redirect()`'
          ],
          introduction: `Next.js Middleware runs code before a request is completed. Executing on lightweight V8 Edge Workers worldwide, middleware intercepts requests in sub-5ms to verify authentication tokens, rewrite URLs, and enforce security policies before rendering page components.`,
          deepDiveSections: [
            {
              title: 'Edge Middleware Execution Flow & Matcher Config',
              explanation: `How Next.js Middleware protects routes:
1. User requests \`/dashboard/settings\`.
2. \`middleware.ts\` intercepts the request at the edge.
3. Decodes session token from \`request.cookies.get('token')\`.
4. If missing/invalid: Returns \`NextResponse.redirect(new URL('/login', request.url))\`.
5. If valid: Injects user metadata headers (\`request.headers.set('x-user-id', user.id)\`) and proceeds to page render via \`NextResponse.next()\`.`,
              keyPoint: 'Edge middleware guards private routes in milliseconds before any server page rendering takes place.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Client Route Guards vs. Next.js Edge Middleware',
            headers: ['Dimension', 'Client-Side Route Guard (SPA)', 'Next.js Edge Middleware (`middleware.ts`)'],
            rows: [
              ['Execution Location', 'Browser client after downloading JS bundle', 'Cloud edge server before request hits origin server'],
              ['Visual Flashing', 'Flash of unauthorized content or blank screen', 'Zero flashing (Redirect happens at HTTP level)'],
              ['Security Boundary', 'Client-side bypassable', 'Enforced at the network edge']
            ]
          },
          coreConcepts: ['Edge runtime execution', 'Middleware matcher regex filtering', 'Request header mutation (`x-user-id`)'],
          syntax: `// Next.js Middleware Matcher Configuration
export const config = {
  matcher: ['/dashboard/:path*', '/skills/:path*/workspace']
};`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// Complete Next.js Edge Middleware (middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/skills');

  // 1. Redirect unauthenticated users to login
  if (isProtectedPage && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect logged-in users away from login page
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/skills/:path*', '/login']
};`,
              explanation: 'Production edge middleware managing authentication guards and redirects.'
            }
          ],
          commonMistakes: ['Running heavy Node.js libraries (like bcrypt or fs) inside `middleware.ts`, which fails because Edge Middleware runs in a restricted V8 Edge Worker runtime'],
          bestPractices: ['Keep middleware lightweight; perform fast JWT verification and cookie checks only'],
          summary: `Next.js Edge Middleware delivers sub-millisecond route protection and header manipulation across global edge networks.`,
          resources: [{ title: 'Next.js Middleware Documentation', url: 'https://nextjs.org/docs/app/building-your-application/routing/middleware', provider: 'Nextjs.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc18_q1',
                question: 'Why can you NOT use standard Node.js modules like `fs` or native C-bindings inside Next.js `middleware.ts`?',
                options: [
                  'Because Next.js Middleware executes on the lightweight V8 Edge Runtime rather than a full Node.js server environment',
                  'Because Next.js disables files',
                  'Because middleware only runs on Windows',
                  'There is no limitation'
                ],
                correctIndex: 0,
                topic: 'Edge Runtime Constraints',
                explanation: 'Edge Runtime is a lightweight V8 environment optimized for sub-millisecond startup, omitting full Node.js OS modules like `fs`.'
              }
            ]
          },
          practicalTask: {
            title: 'Write a Middleware Redirect Response',
            difficulty: 'Intermediate',
            problemStatement: 'Write the statement inside a Next.js middleware that returns a redirect to `"/login"` using `NextResponse.redirect(new URL("/login", request.url))`.',
            instructions: 'Use NextResponse.redirect(new URL("/login", request.url)).',
            requirements: ['return NextResponse.redirect(new URL("/login", request.url))'],
            starterCode: `return NextResponse.redirect(`,
            solutionCode: `return NextResponse.redirect(new URL('/login', request.url));`,
            hints: ['return NextResponse.redirect(new URL("/login", request.url));']
          }
        },
        {
          lessonNumber: 19,
          title: 'Image Optimization, SEO Metadata & OpenGraph Protocols',
          description: 'Optimize Core Web Vitals with next/image, automated WebP/AVIF compression, dynamic generateMetadata, and OpenGraph social cards.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Eliminate Cumulative Layout Shift (CLS) using the `next/image` component with automatic WebP/AVIF optimization',
            'Generate dynamic SEO metadata and canonical URLs with `generateMetadata()`',
            'Create dynamic social share cards using Next.js `@vercel/og` Image Generation'
          ],
          introduction: `Search Engine Optimization (SEO) and Core Web Vitals dictate web application visibility. Next.js automates image optimization (converting heavy JPEGs to modern AVIF/WebP on the fly) and provides type-safe metadata APIs for rich OpenGraph social previews.`,
          deepDiveSections: [
            {
              title: 'next/image Core Web Vitals Optimization',
              explanation: `Why <img> tags harm web vitals:
Standard \`<img src="photo.jpg">\` downloads massive raw files, causes Cumulative Layout Shift (CLS) as images pop in, and slows down page rendering.
\`next/image\` Features:
1. Zero CLS: Enforces explicit \`width\` and \`height\` or \`fill\` with automatic aspect ratio preservation.
2. Modern Formats: Automatically transcodes images into AVIF (50% smaller than JPEG) and WebP on the fly.
3. Lazy Loading: Images outside the viewport are deferred until the user scrolls near them.`,
              keyPoint: 'next/image automatically prevents layout shifts, transcodes to AVIF/WebP, and lazy loads non-critical images.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Standard <img> vs. Next.js <Image>',
            headers: ['Feature', 'Standard HTML `<img>`', 'Next.js `<Image>` Component'],
            rows: [
              ['Format Conversion', 'Serves original format (e.g. 2.4 MB PNG)', 'Automatically converts to ~60 KB AVIF / WebP'],
              ['Layout Shift (CLS)', 'High (Content jumps when image finishes downloading)', 'Zero CLS (Reserves exact aspect ratio in DOM)'],
              ['Responsive Resizing', 'Requires manual `srcset` configurations', 'Automatically generates responsive device widths']
            ]
          },
          coreConcepts: ['AVIF and WebP image transcoding', 'Dynamic `generateMetadata` SEO function', 'OpenGraph protocol social cards'],
          syntax: `// Dynamic SEO Metadata in Next.js (app/skills/[id]/page.tsx)
export async function generateMetadata({ params }): Promise<Metadata> {
  const skill = await db.getSkill(params.id);
  return {
    title: \`\${skill.title} | ZenScore AI\`,
    description: skill.description,
    openGraph: {
      title: skill.title,
      images: [skill.coverImageUrl]
    }
  };
}`,
          codeExamples: [
            {
              language: 'jsx',
              code: `// High-Performance next/image Usage
import Image from 'next/image';

export function SkillBanner({ bannerUrl, title }) {
  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-900">
      <Image
        src={bannerUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority // Preloads banner for Largest Contentful Paint (LCP) optimization
        className="object-cover"
      />
    </div>
  );
}`,
              explanation: 'Uses next/image with fill and priority for optimal LCP.'
            }
          ],
          commonMistakes: ['Omitting the `priority` prop on above-the-fold hero images, delaying Largest Contentful Paint (LCP)'],
          bestPractices: ['Add `priority` to above-the-fold hero images and use dynamic `generateMetadata` on all public routes'],
          summary: `Automatic image optimization and dynamic SEO metadata maximize search engine rankings and Core Web Vitals scores.`,
          resources: [{ title: 'Next.js Image Optimization Guide', url: 'https://nextjs.org/docs/app/building-your-application/optimizing/images', provider: 'Nextjs.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc19_q1',
                question: 'What is the effect of adding the `priority` prop to a Next.js `<Image>` component on an above-the-fold hero banner?',
                options: [
                  'It instructs Next.js to preload the image with high priority, improving the Largest Contentful Paint (LCP) Core Web Vital score',
                  'It makes the image full screen',
                  'It converts the image to monochrome',
                  'It deletes the image after 5 seconds'
                ],
                correctIndex: 0,
                topic: 'LCP Image Optimization',
                explanation: '`priority` preloads high-importance hero images immediately, preventing delays in Largest Contentful Paint.'
              }
            ]
          },
          practicalTask: {
            title: 'Define Static Metadata in Next.js',
            difficulty: 'Beginner',
            problemStatement: 'Write the static `metadata` export object setting `title: "ZenScore AI - Skills Hub"` and `description: "Master engineering skills".',
            instructions: 'Export const metadata: Metadata = { title: "...", description: "..." }.',
            requirements: ['export const metadata = { title: "ZenScore AI - Skills Hub", description: "Master engineering skills" };'],
            starterCode: `export const metadata = {\n  // TODO: Metadata\n};`,
            solutionCode: `export const metadata = {\n  title: 'ZenScore AI - Skills Hub',\n  description: 'Master engineering skills'\n};`,
            hints: ['title: "ZenScore AI - Skills Hub", description: "Master engineering skills"']
          }
        }
      ]
    },
    {
      title: 'Phase 7: Production Frontend Capstone',
      order: 7,
      lessons: [
        {
          lessonNumber: 20,
          title: 'End-to-End Performance Auditing (Core Web Vitals & Bundle Analyzer)',
          description: 'Audit production bundles using @next/bundle-analyzer, eliminate heavy dependencies, and achieve 95+ Google Lighthouse scores.',
          estimatedMinutes: 40,
          learningObjectives: [
            'Inspect and eliminate bloated JavaScript packages using `@next/bundle-analyzer`',
            'Optimize the 3 Core Web Vitals: LCP (< 2.5s), INP (< 200ms), and CLS (< 0.1)',
            'Achieve 95+ Performance, Accessibility, and SEO scores on Google Lighthouse'
          ],
          introduction: `Building a feature-rich web application is only half the battle; ensuring it loads in under 1 second on mobile networks requires rigorous performance engineering. In this lesson, we will analyze production bundle footprints and optimize Core Web Vitals.`,
          deepDiveSections: [
            {
              title: 'The 3 Google Core Web Vitals Metrics',
              explanation: `1. Largest Contentful Paint (LCP < 2.5s): Measures loading performance. How long until the main content (hero image/headline) is visible?
2. Interaction to Next Paint (INP < 200ms): Measures page responsiveness. How long between a user clicking a button and the UI updating on screen?
3. Cumulative Layout Shift (CLS < 0.1): Measures visual stability. Do buttons or text shift unexpectedly as fonts or ads load?`,
              keyPoint: 'Optimizing LCP, INP, and CLS guarantees top Google search rankings and exceptional user retention.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Common Heavy Packages vs. Lightweight Alternatives',
            headers: ['Bloated Dependency', 'Size', 'Modern Lightweight Alternative', 'Alternative Size'],
            rows: [
              ['Moment.js', '288 KB (Full locale bloat)', 'Day.js / date-fns', '2 KB (Modular tree-shakeable)'],
              ['Lodash (Full import)', '72 KB', 'Lodash-es or native ES6+ methods', '0 KB (Native JS) / 2 KB'],
              ['Lottie Animation Player', '350 KB', 'CSS / SVG Keyframe Animations', '4 KB']
            ]
          },
          coreConcepts: ['Bundle tree-shaking analysis', 'Core Web Vitals metrics (LCP, INP, CLS)', 'Font preloading with `next/font`'],
          syntax: `# Run Bundle Analyzer in Next.js
ANALYZE=true npm run build`,
          codeExamples: [
            {
              language: 'javascript',
              code: `// next.config.js with Bundle Analyzer and Image Optimization
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  compress: true,
  poweredByHeader: false,
});`,
              explanation: 'Production Next.js configuration enabling AVIF image compression and bundle analyzer.'
            }
          ],
          commonMistakes: ['Importing entire icon libraries like `import { LucideIcon } from "lucide-react"` without tree-shaking, bloating bundles by megabytes'],
          bestPractices: ['Import specific icons (`import { BookOpen } from "lucide-react"`) and use `next/font` for zero-layout-shift Google fonts'],
          summary: `Bundle optimization and Core Web Vitals auditing ensure blazing fast, highly accessible web applications.`,
          resources: [{ title: 'Google Web Vitals Documentation', url: 'https://web.dev/vitals/', provider: 'Google', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'rc20_q1',
                question: 'What does the Interaction to Next Paint (INP) Core Web Vital measure?',
                options: [
                  'The latency between a user interaction (click, tap, keypress) and the next visual frame update on screen',
                  'The time taken to download CSS files',
                  'The number of colors in an image',
                  'The database query execution speed'
                ],
                correctIndex: 0,
                topic: 'Core Web Vitals',
                explanation: 'INP measures overall responsiveness by tracking the latency of user interactions across the page lifecycle.'
              }
            ]
          },
          practicalTask: {
            title: 'Configure Next/Font for Zero CLS',
            difficulty: 'Beginner',
            problemStatement: 'Write the code to import `Inter` from `next/font/google` and instantiate `const inter = Inter({ subsets: ["latin"] })`.',
            instructions: 'Import Inter and instantiate with subsets: ["latin"].',
            requirements: ['import { Inter } from "next/font/google"', 'const inter = Inter({ subsets: ["latin"] })'],
            starterCode: `import { Inter } from 'next/font/google';\n\n// TODO: Instantiate font\n`,
            solutionCode: `import { Inter } from 'next/font/google';\n\nconst inter = Inter({ subsets: ['latin'] });`,
            hints: ['const inter = Inter({ subsets: ["latin"] });']
          }
        },
        {
          lessonNumber: 21,
          title: 'Full-Stack Next.js Production SaaS Deployment on Vercel/Docker',
          description: 'Capstone project: Deploy a production full-stack Next.js application with Docker standalone output, Vercel edge networks, and monitoring.',
          estimatedMinutes: 45,
          learningObjectives: [
            'Configure Next.js standalone output mode (`output: "standalone"`) for lightweight Docker containers',
            'Deploy to Vercel global edge networks with automated CI/CD preview environments',
            'Configure production telemetry and error logging with Sentry'
          ],
          introduction: `Congratulations on reaching the final capstone lesson of React.js & Next.js Ecosystem! In this lesson, we will package our full-stack Next.js application into a production-hardened standalone Docker container and deploy it to cloud infrastructure with global CDN caching and telemetry monitoring.`,
          deepDiveSections: [
            {
              title: 'Next.js Standalone Output Mode for Docker',
              explanation: `How \`output: "standalone"\` works:
By default, running \`node_modules\` in a Docker container requires copying the entire 500MB+ node_modules folder.
With \`output: "standalone"\` in \`next.config.js\`:
Next.js analyzes your code and copies ONLY the exact files and dependencies required to run the server into \`.next/standalone\`.
The final container size drops from 1.2GB down to 80MB!`,
              keyPoint: 'output: "standalone" creates a minimal self-contained Node.js server build, slashing container size by 90%.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Vercel Serverless vs. Self-Hosted Docker Standalone',
            headers: ['Dimension', 'Vercel Serverless Platform', 'Self-Hosted Docker Standalone'],
            rows: [
              ['Infrastructure Management', 'Zero (Fully managed serverless edge functions)', 'Requires Linux VPS / Kubernetes cluster management'],
              ['Cold Starts', 'Occasional 200ms cold starts on inactive routes', 'Zero cold starts (Persistent Node.js container process)'],
              ['Cost Scaling', 'Pay-per-request / bandwidth tiering', 'Fixed predictable server hardware cost']
            ]
          },
          coreConcepts: ['Next.js standalone build mode', 'Multi-stage Dockerfile for Next.js', 'Vercel preview and production deployments'],
          syntax: `// next.config.js standalone build option
module.exports = {
  output: 'standalone',
};`,
          codeExamples: [
            {
              language: 'dockerfile',
              code: `# Multi-Stage Dockerfile for Production Next.js Standalone Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Create unprivileged system user
RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nextjs

# Copy minimal standalone server artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
              explanation: 'Production multi-stage Dockerfile for Next.js standalone server.'
            }
          ],
          commonMistakes: ['Forgetting to copy `.next/static` to `.next/standalone/.next/static` in the Dockerfile runner stage, causing CSS and images to fail with 404s'],
          bestPractices: ['Always copy both `public/` and `.next/static/` alongside the standalone output in Docker builds'],
          summary: `You have mastered the React.js & Next.js Ecosystem from Virtual DOM reconciliation to full-stack Server Actions and production standalone cloud deployments!`,
          resources: [{ title: 'Deploying Next.js with Docker', url: 'https://nextjs.org/docs/app/building-your-application/deploying#docker-image', provider: 'Nextjs.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'rc21_q1',
                question: 'What is the purpose of `output: "standalone"` in `next.config.js` when containerizing a Next.js application?',
                options: [
                  'It generates a minimal standalone folder containing only necessary production dependencies, slashing Docker container size from 1GB+ down to ~80MB',
                  'It converts the app into an Electron desktop app',
                  'It disables CSS styling',
                  'It removes all images'
                ],
                correctIndex: 0,
                topic: 'Next.js Standalone Build',
                explanation: 'Standalone output traces dependencies and bundles a minimal self-contained server for ultra-lightweight Docker images.'
              }
            ]
          },
          practicalTask: {
            title: 'Enable Standalone Build in Next.js Config',
            difficulty: 'Beginner',
            problemStatement: 'Write the `next.config.js` export object setting `output: "standalone"`.',
            instructions: 'Export module.exports = { output: "standalone" }.',
            requirements: ['module.exports = { output: "standalone" };'],
            starterCode: `// next.config.js\nmodule.exports = {\n  // TODO: Output mode\n};`,
            solutionCode: `module.exports = {\n  output: 'standalone'\n};`,
            hints: ['module.exports = { output: "standalone" };']
          }
        }
      ]
    }
  ]
}

module.exports = { reactCurriculum }
