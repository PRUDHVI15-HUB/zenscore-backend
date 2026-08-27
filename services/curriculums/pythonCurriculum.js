/**
 * Python & AI Engineering Master Curriculum
 * 7 Phases, 21 Comprehensive Engineering Lessons
 */

const pythonCurriculum = {
  title: 'Python & AI Engineering',
  category: 'AI & Data Science',
  description: 'Master Python runtime internals, NumPy matrix mathematics, Pandas data pipelines, Scikit-Learn machine learning, LLM prompt engineering, and RAG vector search pipelines.',
  modules: [
    {
      title: 'Phase 1: Python Foundations & Core Mechanics',
      order: 1,
      lessons: [
        {
          lessonNumber: 1,
          title: 'Python Execution Model: Bytecode, CPython & The GIL',
          description: 'Explore the CPython interpreter, .pyc bytecode compilation, memory management, reference counting, and the Global Interpreter Lock (GIL).',
          estimatedMinutes: 30,
          learningObjectives: [
            'Understand how Python source code compiles to bytecode (.pyc) and executes on the CPython Virtual Machine',
            'Master reference counting and the cyclic garbage collector (gc module)',
            'Understand the Global Interpreter Lock (GIL) and its impact on multi-threading'
          ],
          introduction: `Python is an interpreted, high-level, dynamically typed language. Under the hood, CPython (the standard implementation written in C) compiles human-readable Python code into intermediate Bytecode, which is then executed by the CPython stack-based Virtual Machine.`,
          deepDiveSections: [
            {
              title: 'The Global Interpreter Lock (GIL) & Memory Management',
              explanation: `CPython uses two memory management systems:
1. Reference Counting: Every Python object contains an internal counter (\`ob_refcnt\`). When a variable references an object, the counter increments; when it goes out of scope, it decrements. When \`ob_refcnt == 0\`, memory is instantly deallocated.
2. Cyclic Garbage Collector: Detects reference cycles (Object A references B, and B references A) using generational heuristics (Gen 0, Gen 1, Gen 2).
3. The GIL (Global Interpreter Lock): A mutex that prevents multiple native threads from executing Python bytecodes simultaneously. CPU-bound multi-threaded Python scripts run on one core; true multi-core CPU parallelism requires multiprocessing!`,
              keyPoint: 'The GIL restricts Python thread execution to a single core; CPU parallelism requires the multiprocessing module.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Python Concurrency Models',
            headers: ['Model', 'Threading Type', 'GIL Impact', 'Best Workload'],
            rows: [
              ['threading module', 'Native OS threads', 'Locked by GIL (1 core active at a time)', 'I/O-bound tasks (Network requests, file downloads)'],
              ['multiprocessing', 'Separate OS processes (Independent GIL per process)', 'Bypasses GIL (Utilizes all CPU cores)', 'CPU-bound computation (ML training, image processing)'],
              ['asyncio', 'Single-threaded event loop (Coroutines)', 'Single core', 'High-concurrency network microservices']
            ]
          },
          coreConcepts: ['CPython stack-based virtual machine', 'Reference counting and cyclic GC', 'Global Interpreter Lock (GIL) restrictions'],
          syntax: `# Inspecting Bytecode in Python
import dis

def add_elements(a, b):
    return a + b

dis.dis(add_elements)`,
          codeExamples: [
            {
              language: 'python',
              code: `import sys
import gc

# Inspecting object reference counts
data = [1, 2, 3]
print(f"Reference count: {sys.getrefcount(data) - 1}")  # 1

alias = data
print(f"Reference count after alias: {sys.getrefcount(data) - 1}")  # 2

del alias
print(f"Reference count after deletion: {sys.getrefcount(data) - 1}")  # 1`,
              explanation: 'Demonstrates Python reference counting and memory tracking.'
            }
          ],
          commonMistakes: ['Using standard Python `threading` for CPU-intensive mathematical operations, expecting multi-core speedup'],
          bestPractices: ['Use `multiprocessing.Pool` or NumPy C-extensions for heavy parallel mathematical computations'],
          summary: `CPython compiles code to bytecode and manages memory via reference counting and the Global Interpreter Lock.`,
          resources: [{ title: 'Python Memory Management Internals', url: 'https://docs.python.org/3/c-api/memory.html', provider: 'Python.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'py1_q1',
                question: 'Why does the Python `threading` module fail to utilize multiple CPU cores for heavy mathematical calculations in CPython?',
                options: [
                  'Because the Global Interpreter Lock (GIL) allows only one thread to execute Python bytecode at a time',
                  'Because Python only supports 32-bit processors',
                  'Because Python disables multi-core chips',
                  'Because threads cannot access RAM'
                ],
                correctIndex: 0,
                topic: 'CPython GIL',
                explanation: 'The GIL prevents multi-threaded Python code from executing bytecodes concurrently on multiple CPU cores.'
              }
            ]
          },
          practicalTask: {
            title: 'Inspect Object Reference Count',
            difficulty: 'Beginner',
            problemStatement: 'Write a Python function `get_true_ref_count(obj)` that imports `sys` and returns `sys.getrefcount(obj) - 1` (compensating for the reference created by passing obj into getrefcount).',
            instructions: 'Import sys and return sys.getrefcount(obj) - 1.',
            requirements: ['import sys', 'return sys.getrefcount(obj) - 1'],
            starterCode: `import sys\n\ndef get_true_ref_count(obj):\n    # TODO: Return reference count\n    pass`,
            solutionCode: `import sys\n\ndef get_true_ref_count(obj):\n    return sys.getrefcount(obj) - 1`,
            hints: ['return sys.getrefcount(obj) - 1']
          }
        },
        {
          lessonNumber: 2,
          title: 'Advanced Data Structures: Dict Internals, Sets & Collections',
          description: 'Explore Python hash tables, collision resolution with open addressing, defaultdict, Counter, deque, and namedtuple.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand Python dictionary hash tables, sparse arrays, and hash collision resolution',
            'Master specialized data structures from the `collections` module (defaultdict, Counter, deque)',
            'Optimize algorithmic complexity using O(1) Set lookups instead of O(N) List scans'
          ],
          introduction: `Dictionaries and Sets are the powerhouses of Python. In modern Python (3.7+), dictionaries are compact, preserve insertion order, and execute lookups in average O(1) time using an optimized compact hash table representation.`,
          deepDiveSections: [
            {
              title: 'Python Compact Hash Table Architecture',
              explanation: `How Python 3.7+ dicts achieve 30% memory reduction and guaranteed insertion order:
1. Indices Array (Hash Table): A sparse array storing small integer indices (e.g. \`[-1, 0, -1, 1]\`).
2. Entries Array: A dense array storing \`[hash, key_ptr, value_ptr]\` in exact insertion order.
When accessing \`d["key"]\`: Python computes \`hash(key)\`, looks up the index in the sparse table, and retrieves the value from the dense entries array in O(1) time.`,
              keyPoint: 'Python dictionaries combine a sparse hash index array with a dense entries array to guarantee insertion order.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Python Built-in Collections Complexity',
            headers: ['Data Structure', 'Access by Key/Index', 'Search / Membership (in)', 'Append / Insert'],
            rows: [
              ['list', 'O(1) by index', 'O(N) linear scan', 'O(1) amortized append / O(N) insert at index 0'],
              ['deque (Double-ended queue)', 'O(N) by index', 'O(N)', 'O(1) at BOTH left and right ends'],
              ['dict', 'O(1) average by key', 'O(1) average by key', 'O(1) average insert'],
              ['set', 'N/A (Unindexed)', 'O(1) average membership check', 'O(1) average add']
            ]
          },
          coreConcepts: ['Compact hash table representation', 'collections.deque vs list performance', 'collections.Counter frequency analysis'],
          syntax: `# High-Performance Collections
from collections import defaultdict, Counter, deque

counts = Counter(['apple', 'banana', 'apple'])
grouped = defaultdict(list)
queue = deque(maxlen=1000)`,
          codeExamples: [
            {
              language: 'python',
              code: `from collections import Counter, defaultdict

# Text Frequency Analysis
text = "ai machine learning neural network deep learning machine ai ai"
word_counts = Counter(text.split())

print("Top 2 keywords:", word_counts.most_common(2))
# [('ai', 3), ('learning', 2)]

# Grouping words by length
grouped_by_len = defaultdict(list)
for word in word_counts:
    grouped_by_len[len(word)].append(word)`,
              explanation: 'Uses Counter and defaultdict for high-speed text processing and grouping.'
            }
          ],
          commonMistakes: ['Using `list.pop(0)` in queues, which triggers an expensive O(N) memory shift of all elements; use `deque.popleft()` for O(1) performance'],
          bestPractices: ['Always use `collections.deque` for FIFO queues and `set` for membership testing'],
          summary: `Mastery of Python hash table internals and specialized collection modules optimizes memory and algorithmic runtime.`,
          resources: [{ title: 'Python Collections Module Documentation', url: 'https://docs.python.org/3/library/collections.html', provider: 'Python.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'py2_q1',
                question: 'Why is `collections.deque.popleft()` significantly faster than `list.pop(0)` for FIFO queues in Python?',
                options: [
                  '`deque.popleft()` executes in O(1) constant time, whereas `list.pop(0)` requires shifting all N elements in memory (O(N) time)',
                  '`deque` is written in assembly',
                  '`list.pop(0)` deletes the variable',
                  'There is no performance difference'
                ],
                correctIndex: 0,
                topic: 'Data Structure Complexity',
                explanation: 'Lists are contiguous arrays where removing the first element forces memory reallocation and shifting of all remaining elements (O(N)).'
              }
            ]
          },
          practicalTask: {
            title: 'Find Top N Common Words with Counter',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `get_top_words(words_list, n)` that uses `collections.Counter` to return the `n` most common words as a list of tuples.',
            instructions: 'Import Counter from collections and return Counter(words_list).most_common(n).',
            requirements: ['from collections import Counter', 'return Counter(words_list).most_common(n)'],
            starterCode: `from collections import Counter\n\ndef get_top_words(words_list, n):\n    # TODO: Return top n words\n    pass`,
            solutionCode: `from collections import Counter\n\ndef get_top_words(words_list, n):\n    return Counter(words_list).most_common(n)`,
            hints: ['return Counter(words_list).most_common(n)']
          }
        },
        {
          lessonNumber: 3,
          title: 'Functional Python: List Comprehensions, Lambdas & Generators',
          description: 'Master memory-efficient generators with yield, generator expressions, map/filter, itertools, and lazy evaluation.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand lazy evaluation and memory savings with Generators (`yield`)',
            'Master List, Dict, and Set Comprehensions for clean transformations',
            'Stream gigabyte-scale datasets using `itertools` and generator pipelines'
          ],
          introduction: `Creating a list with 10 million items consumes over 800MB of RAM. A Generator, however, calculates values on the fly using lazy evaluation (\`yield\`), consuming only 128 bytes of memory regardless of whether it processes 10 items or 10 billion items.`,
          deepDiveSections: [
            {
              title: 'How Generators & the Iterator Protocol Work Internally',
              explanation: `When a function contains the \`yield\` keyword:
1. Python compiles it into a generator function. Calling it returns a Generator Object without executing code.
2. Calling \`next(gen)\` runs the function until it encounters \`yield\`, returns the value, and **freezes its execution frame** in memory (preserving all local variables and instruction pointer).
3. Subsequent \`next(gen)\` calls resume execution immediately after the \`yield\` statement until \`StopIteration\` is raised.`,
              keyPoint: 'Generators pause and resume execution state on demand, enabling stream processing with near-zero memory footprint.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: List Comprehension vs. Generator Expression',
            headers: ['Metric', 'List Comprehension `[x for x in data]`', 'Generator Expression `(x for x in data)`'],
            rows: [
              ['Evaluation Style', 'Eager (Calculates and allocates all elements in RAM)', 'Lazy (Calculates one item at a time on demand)'],
              ['Memory Footprint', 'Proportional to dataset size (800MB for 10M ints)', 'Constant 128 bytes (Never grows)'],
              ['Indexing', 'Supports indexing (`list[5]`) and `len()`', 'Cannot be indexed; single-pass iteration only']
            ]
          },
          coreConcepts: ['Iterator Protocol (`__iter__` and `__next__`)', 'Lazy stream evaluation with `yield`', 'Memory-efficient `itertools` chaining'],
          syntax: `# Generator expression vs List comprehension
squares_list = [x**2 for x in range(1000)] # Eager List (Memory allocated)
squares_gen  = (x**2 for x in range(1000)) # Lazy Generator (128 bytes)`,
          codeExamples: [
            {
              language: 'python',
              code: `import sys

# Streaming massive CSV files line-by-line with 0 memory spikes
def stream_large_dataset(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        header = f.readline().strip().split(',')
        for line in f:
            values = line.strip().split(',')
            yield dict(zip(header, values))

# Pipeline processing: Filter and transform on the fly!
data_stream = stream_large_dataset('massive_training_data.csv')
cleaned_stream = (row for row in data_stream if float(row.get('confidence', 0)) > 0.8)`,
              explanation: 'Streams and filters gigabytes of training data with constant low memory usage.'
            }
          ],
          commonMistakes: ['Loading an entire 10GB dataset into a list before processing, crashing the Python process with Out-Of-Memory (OOM)'],
          bestPractices: ['Use generator pipelines `(x for x in ...)` when processing large files, datasets, or infinite streams'],
          summary: `Generators and comprehensions provide idiomatic, memory-efficient data stream processing in Python.`,
          resources: [{ title: 'Python Generators Wiki Guide', url: 'https://wiki.python.org/moin/Generators', provider: 'Python.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'py3_q1',
                question: 'What is the primary memory advantage of a generator function using `yield` compared to returning a list of values?',
                options: [
                  'Generators produce items one at a time on demand using lazy evaluation, consuming constant low RAM regardless of dataset size',
                  'Generators compress data into zip files',
                  'Generators execute on the GPU',
                  'Generators bypass Python syntax checks'
                ],
                correctIndex: 0,
                topic: 'Generators & Lazy Evaluation',
                explanation: 'Generators yield items lazily, avoiding allocating large lists in memory.'
              }
            ]
          },
          practicalTask: {
            title: 'Create an Infinite Fibonacci Generator',
            difficulty: 'Intermediate',
            problemStatement: 'Write a generator function `fibonacci_gen()` that yields an infinite sequence of Fibonacci numbers starting with `0, 1, 1, 2, 3, 5, ...`.',
            instructions: 'Use a while True loop with a, b = b, a + b and yield a.',
            requirements: ['def fibonacci_gen():', 'while True:', 'yield a', 'a, b = b, a + b'],
            starterCode: `def fibonacci_gen():\n    # TODO: Yield infinite fibonacci sequence\n    pass`,
            solutionCode: `def fibonacci_gen():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b`,
            hints: ['a, b = 0, 1; while True: yield a; a, b = b, a + b']
          }
        },
        {
          lessonNumber: 4,
          title: 'Object-Oriented Python: Dunder Methods, Inheritance & Dataclasses',
          description: 'Master Python object model, magic dunder methods (__repr__, __eq__, __getitem__), slots optimization, and @dataclass.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master Python data model special methods (__str__, __repr__, __len__, __getitem__, __call__)',
            'Reduce object memory footprints by 60% using `__slots__`',
            'Implement clean, boilerplate-free data models using `@dataclass`'
          ],
          introduction: `Everything in Python is an object. Python's data model uses special "dunder" (double underscore) methods to define how objects interact with built-in language operations like iteration, string representation, arithmetic, and equality.`,
          deepDiveSections: [
            {
              title: '__slots__ Memory Optimization & @dataclass',
              explanation: `By default, Python stores instance attributes in a dynamic dictionary (\`self.__dict__\`). This allows adding attributes at runtime, but adds ~150 bytes of overhead per object instance.
Using \`__slots__\`:
\`\`\`python
class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y
\`\`\`
Python replaces \`__dict__\` with a compact C-style struct array, slashing memory consumption by 60% when instantiating millions of objects!`,
              keyPoint: '__slots__ eliminates __dict__ overhead, optimizing memory when creating millions of data objects.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Standard Class vs. @dataclass vs. __slots__',
            headers: ['Feature', 'Standard Class', '@dataclass', 'Class with `__slots__`'],
            rows: [
              ['Boilerplate', 'High (Manual `__init__`, `__repr__`, `__eq__`)', 'Zero (Auto-generated by decorator)', 'Medium'],
              ['Memory Overhead', 'High (~150 bytes per instance)', 'High by default (`slots=True` in 3.10+)', 'Minimal (~50 bytes per instance)'],
              ['Dynamic Attributes', 'Allowed (`obj.custom = 1`)', 'Allowed', 'Restricted to declared slots']
            ]
          },
          coreConcepts: ['Dunder method polymorphism', 'Memory reduction with `__slots__`', 'Modern `@dataclass` generation'],
          syntax: `from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class Vector3D:
    x: float
    y: float
    z: float`,
          codeExamples: [
            {
              language: 'python',
              code: `from dataclasses import dataclass, field
from typing import List

@dataclass
class SkillCurriculum:
    title: str
    difficulty: str
    lessons: List[str] = field(default_factory=list)
    is_published: bool = False

    def __len__(self):
        return len(self.lessons)

    def __getitem__(self, index):
        return self.lessons[index]

course = SkillCurriculum("Python AI", "Intermediate", ["Bytecode", "NumPy", "PyTorch"])
print(f"Total lessons: {len(course)}") # 3
print(f"First lesson: {course[0]}")     # Bytecode`,
              explanation: 'Dataclass implementing __len__ and __getitem__ for native Python indexing.'
            }
          ],
          commonMistakes: ['Using mutable default arguments (like `def __init__(self, items=[])`) which share the same list instance across all class objects'],
          bestPractices: ['Always use `field(default_factory=list)` for mutable defaults inside `@dataclass` models'],
          summary: `Dunder methods and dataclasses create idiomatic, expressive, and memory-optimized Python classes.`,
          resources: [{ title: 'Python Data Model Reference', url: 'https://docs.python.org/3/reference/datamodel.html', provider: 'Python.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py4_q1',
                question: 'What is the primary benefit of defining `__slots__` on a Python class that will be instantiated millions of times?',
                options: [
                  'It prevents the creation of an internal `__dict__` per instance, reducing memory consumption by up to 60%',
                  'It compiles the class into C++',
                  'It makes the class run in parallel threads',
                  'It encrypts the class fields'
                ],
                correctIndex: 0,
                topic: '__slots__ Optimization',
                explanation: '`__slots__` stores attributes in fixed-size arrays instead of dynamic dictionaries, saving massive amounts of RAM.'
              }
            ]
          },
          practicalTask: {
            title: 'Create an Immutable Slots Dataclass',
            difficulty: 'Beginner',
            problemStatement: 'Write a dataclass `Point2D` with attributes `x: float` and `y: float` decorated with `@dataclass(frozen=True, slots=True)`.',
            instructions: 'Import dataclass and define Point2D with float types.',
            requirements: ['@dataclass(frozen=True, slots=True)', 'class Point2D:', 'x: float', 'y: float'],
            starterCode: `from dataclasses import dataclass\n\n# TODO: Implement Point2D dataclass\n`,
            solutionCode: `from dataclasses import dataclass\n\n@dataclass(frozen=True, slots=True)\nclass Point2D:\n    x: float\n    y: float`,
            hints: ['@dataclass(frozen=True, slots=True) class Point2D: x: float y: float']
          }
        }
      ]
    },
    {
      title: 'Phase 2: Advanced Python & Systems Programming',
      order: 2,
      lessons: [
        {
          lessonNumber: 5,
          title: 'Python Decorators, Closures & Metaclasses',
          description: 'Master higher-order functions, parameterized decorators, functools.wraps, and class creation interceptors with Metaclasses.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand lexical closures and variable binding in nested scopes',
            'Build parameterized function decorators preserving metadata with `@functools.wraps`',
            'Intercept and validate class creation using Metaclasses and `__init_subclass__`'
          ],
          introduction: `Decorators allow developers to modify or extend the behavior of functions and classes without modifying their source code. They are extensively used in AI engineering for telemetry, caching, timing, and API routing.`,
          deepDiveSections: [
            {
              title: 'Decorator Mechanics & functools.wraps',
              explanation: `A decorator is a higher-order function that takes a function as input and returns a replacement wrapper function.
Why \`@functools.wraps(func)\` is mandatory:
Without \`@wraps\`, the decorated function loses its original \`__name__\`, \`__doc__\`, and type annotations, replacing them with the generic name \`wrapper\`. \`@functools.wraps\` copies all original metadata back to the wrapper function.`,
              keyPoint: 'Always use @functools.wraps on wrapper functions to preserve original function docstrings, names, and signatures.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Function Decorators vs. Metaclasses',
            headers: ['Technique', 'Target', 'Execution Timing', 'Typical Use Case'],
            rows: [
              ['Function Decorator', 'Individual functions / methods', 'When the function is defined at import time', 'Execution timing, logging, authentication, caching'],
              ['Class Decorator', 'Individual classes', 'When the class is defined at import time', 'Adding helper methods, registering classes in registries'],
              ['Metaclass (`type`)', 'The class constructor itself', 'During class creation / module parsing', 'Strict schema enforcement, ORM model construction']
            ]
          },
          coreConcepts: ['Lexical closures and free variables', '`@functools.wraps` metadata preservation', 'Class creation lifecycle (`type.__new__`)'],
          syntax: `import functools
import time

def timing_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} executed in {time.perf_counter() - start:.4f}s")
        return result
    return wrapper`,
          codeExamples: [
            {
              language: 'python',
              code: `import functools
import time

# Parameterized Retry Decorator for Flaky AI APIs
def retry(max_attempts=3, delay=1.0):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts == max_attempts:
                        raise e
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def call_llm_api(prompt):
    # Simulated API call
    return f"Response for {prompt}"`,
              explanation: 'Parameterized decorator implementing automated retry logic with backoff.'
            }
          ],
          commonMistakes: ['Forgetting `@functools.wraps(func)`, breaking inspection and documentation tools like Sphinx and FastAPI auto-docs'],
          bestPractices: ['Always apply `@functools.wraps(func)` inside custom decorator wrapper functions'],
          summary: `Decorators and closures provide clean, reusable aspect-oriented programming across Python systems.`,
          resources: [{ title: 'Primer on Python Decorators', url: 'https://realpython.com/primer-on-python-decorators/', provider: 'Real Python', type: 'Article', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py5_q1',
                question: 'What is the primary purpose of applying `@functools.wraps(func)` inside a custom decorator wrapper function?',
                options: [
                  'To preserve the original function\'s identity, docstring, name, and type annotations on the wrapper',
                  'To speed up the function by 2x',
                  'To make the function asynchronous',
                  'To prevent exceptions from being raised'
                ],
                correctIndex: 0,
                topic: 'Decorator Metadata Preservation',
                explanation: '`@functools.wraps` copies `__name__`, `__doc__`, and metadata from the original function to the wrapper function.'
              }
            ]
          },
          practicalTask: {
            title: 'Build an Execution Timer Decorator',
            difficulty: 'Intermediate',
            problemStatement: 'Write a decorator `measure_time(func)` using `@functools.wraps` that records start time with `time.time()`, executes `func(*args, **kwargs)`, and returns the result.',
            instructions: 'Use functools.wraps and time.time().',
            requirements: ['import functools, time', '@functools.wraps(func)', 'def wrapper(*args, **kwargs):', 'return result'],
            starterCode: `import functools\nimport time\n\ndef measure_time(func):\n    # TODO: Implement decorator\n    pass`,
            solutionCode: `import functools\nimport time\n\ndef measure_time(func):\n    @functools.wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        return result\n    return wrapper`,
            hints: ['Define wrapper(*args, **kwargs) with @functools.wraps(func) and return wrapper.']
          }
        },
        {
          lessonNumber: 6,
          title: 'Asynchronous Python: asyncio, Event Loops & coroutines',
          description: 'Master async/await syntax, asyncio event loops, Tasks, Gather, Queues, and asynchronous network concurrency.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand the asyncio event loop and cooperative multitasking',
            'Execute parallel asynchronous tasks using `asyncio.gather()` and `asyncio.TaskGroup`',
            'Prevent blocking the asyncio event loop with synchronous calls'
          ],
          introduction: `Traditional synchronous Python blocks the thread on every HTTP call or database query. The \`asyncio\` library provides a single-threaded cooperative multitasking event loop that can manage tens of thousands of concurrent network connections using non-blocking coroutines (\`async\`/\`await\`).`,
          deepDiveSections: [
            {
              title: 'How Asyncio Achieves High Concurrency',
              explanation: `How coroutines execute:
1. When a function is declared \`async def\`, calling it returns a Coroutine object.
2. When the coroutine hits \`await asyncio.sleep(1)\` or an async HTTP request, it yields control back to the central Event Loop.
3. The Event Loop processes other ready coroutines while the network I/O is in flight.
4. When the OS kernel signals that the network packet has arrived, the Event Loop resumes the paused coroutine.`,
              keyPoint: 'Coroutines cooperatively yield control back to the event loop on every await statement.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Synchronous Requests vs. Asyncio HTTP Fetching',
            headers: ['Metric', 'requests library (Synchronous)', 'httpx / aiohttp (Asynchronous)'],
            rows: [
              ['1,000 HTTP API Calls Time', '~100 seconds (Sequential execution)', '~2.5 seconds (Concurrent async pipeline)'],
              ['Threads Required', '1000 threads (High memory) or 1 thread (Sequential)', '1 single thread (Near-zero RAM overhead)'],
              ['CPU Utilization', '99% idle waiting for network packets', 'Optimal event loop multiplexing']
            ]
          },
          coreConcepts: ['Asyncio Event Loop', 'Coroutines and Tasks (`asyncio.create_task`)', 'Parallel execution with `asyncio.gather`'],
          syntax: `import asyncio

async def fetch_data(url):
    await asyncio.sleep(0.1) # Non-blocking I/O
    return f"Data from {url}"

async def main():
    results = await asyncio.gather(
        fetch_data("https://api.zenscore.ai/skills"),
        fetch_data("https://api.zenscore.ai/careers")
    )

asyncio.run(main())`,
          codeExamples: [
            {
              language: 'python',
              code: `import asyncio
import httpx

# High-Speed Parallel LLM Embeddings Fetcher
async def embed_text(client, text):
    response = await client.post("https://api.openai.com/v1/embeddings", json={"input": text})
    return response.json()

async def batch_embed_all(texts):
    async with httpx.AsyncClient() as client:
        tasks = [embed_text(client, t) for t in texts]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results`,
              explanation: 'Fetches hundreds of vector embeddings concurrently over an async HTTP connection pool.'
            }
          ],
          commonMistakes: ['Calling blocking synchronous functions (e.g. `time.sleep()` or `requests.get()`) inside coroutines, freezing the entire asyncio loop for all users'],
          bestPractices: ['Always use `asyncio.sleep()` and `httpx.AsyncClient` inside coroutines; offload blocking code with `asyncio.to_thread()`'],
          summary: `Asyncio enables high-throughput non-blocking I/O pipelines for modern Python APIs and AI services.`,
          resources: [{ title: 'Python Asyncio Documentation', url: 'https://docs.python.org/3/library/asyncio.html', provider: 'Python.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py6_q1',
                question: 'What happens if you execute a blocking synchronous function like `time.sleep(5)` inside an `async def` coroutine?',
                options: [
                  'It blocks the single asyncio event loop thread for 5 seconds, freezing all other concurrent tasks from running',
                  'Asyncio automatically converts it to a thread',
                  'It speeds up the event loop',
                  'It throws a syntax error'
                ],
                correctIndex: 0,
                topic: 'Event Loop Blocking',
                explanation: '`time.sleep()` blocks the entire OS thread, stopping the event loop from scheduling any other pending coroutines.'
              }
            ]
          },
          practicalTask: {
            title: 'Execute Tasks in Parallel with asyncio.gather',
            difficulty: 'Intermediate',
            problemStatement: 'Write an async function `run_parallel(task_a, task_b)` that executes both coroutines in parallel using `asyncio.gather` and returns the results list.',
            instructions: 'Use await asyncio.gather(task_a, task_b).',
            requirements: ['return await asyncio.gather(task_a, task_b)'],
            starterCode: `import asyncio\n\nasync def run_parallel(task_a, task_b):\n    # TODO: Execute with gather\n    pass`,
            solutionCode: `import asyncio\n\nasync def run_parallel(task_a, task_b):\n    return await asyncio.gather(task_a, task_b)`,
            hints: ['return await asyncio.gather(task_a, task_b)']
          }
        },
        {
          lessonNumber: 7,
          title: 'Concurrency: Multithreading vs Multiprocessing vs Async',
          description: 'Select the optimal concurrency model for CPU-bound vs I/O-bound AI workloads using ProcessPoolExecutor and ThreadPoolExecutor.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master the Concurrency Decision Matrix (Async vs Threads vs Processes)',
            'Utilize `concurrent.futures.ProcessPoolExecutor` for multi-core CPU parallel processing',
            'Manage shared memory across processes with `multiprocessing.shared_memory`'
          ],
          introduction: `Choosing the wrong concurrency model will cripple application performance. I/O-bound tasks (API querying, web scraping) thrive on \`asyncio\` or \`ThreadPoolExecutor\`, while CPU-bound tasks (image transformation, matrix math, model training) require \`ProcessPoolExecutor\` to utilize all physical CPU cores.`,
          deepDiveSections: [
            {
              title: 'The Python Concurrency Decision Matrix',
              explanation: `How to choose:
1. I/O Bound with 10,000+ connections: Use \`asyncio\` (Lightest memory, single thread).
2. I/O Bound with legacy synchronous libraries: Use \`ThreadPoolExecutor\` (Native threads, blocked by GIL for CPU but non-blocking for I/O).
3. CPU Bound (NumPy, Image transforms, ML tokenization): Use \`ProcessPoolExecutor\` (Bypasses GIL, forks independent OS processes per core).`,
              keyPoint: 'Use asyncio for high-connection I/O; use ProcessPoolExecutor for CPU-intensive data transformations.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Asyncio vs. ThreadPool vs. ProcessPool',
            headers: ['Model', 'Memory Overhead', 'Multi-Core CPU Parallelism', 'Best Use Case'],
            rows: [
              ['asyncio', 'Minimal (~2 KB per task)', 'No (Single thread / 1 core)', 'High-concurrency microservices, WebSockets, API fetchers'],
              ['ThreadPoolExecutor', 'Medium (~10 KB per thread)', 'No (Restricted by GIL for CPU code)', 'I/O operations using legacy blocking libraries'],
              ['ProcessPoolExecutor', 'High (~30 MB per process fork)', 'Yes (100% utilization across all CPU cores)', 'Heavy math, dataset preprocessing, image rendering']
            ]
          },
          coreConcepts: ['ProcessPoolExecutor multi-core allocation', 'Inter-Process Communication (IPC)', 'Concurrency selection matrix'],
          syntax: `from concurrent.futures import ProcessPoolExecutor

with ProcessPoolExecutor() as executor:
    results = list(executor.map(cpu_heavy_function, dataset))`,
          codeExamples: [
            {
              language: 'python',
              code: `from concurrent.futures import ProcessPoolExecutor
import os
import math

def cpu_heavy_prime_check(n):
    if n < 2: return False
    for i in range(2, int(math.isqrt(n)) + 1):
        if n % i == 0: return False
    return True

# Parallelizing across all available CPU cores
numbers = [1000000007, 1000000009, 1000000021, 1000000033]

if __name__ == '__main__':
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as executor:
        results = list(executor.map(cpu_heavy_prime_check, numbers))
        print("Prime results across CPU cores:", results)`,
              explanation: 'Distributes CPU-bound prime calculations across all physical processor cores.'
            }
          ],
          commonMistakes: ['Spawning thousands of OS processes with ProcessPoolExecutor, exhausting server RAM with process fork overhead'],
          bestPractices: ['Set `max_workers=os.cpu_count()` for ProcessPoolExecutor to match physical CPU cores'],
          summary: `Selecting between asyncio, threads, and processes maximizes throughput for both I/O and CPU workloads.`,
          resources: [{ title: 'Python concurrent.futures Guide', url: 'https://docs.python.org/3/library/concurrent.futures.html', provider: 'Python.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py7_q1',
                question: 'Which concurrency tool should you use to preprocess and resize 100,000 images across an 8-core CPU server?',
                options: [
                  'concurrent.futures.ProcessPoolExecutor',
                  'asyncio.gather()',
                  'time.sleep()',
                  'Standard for loop'
                ],
                correctIndex: 0,
                topic: 'CPU Parallelism',
                explanation: 'Image processing is CPU-bound; `ProcessPoolExecutor` forks processes across all 8 CPU cores to bypass the GIL.'
              }
            ]
          },
          practicalTask: {
            title: 'Map a Function with ProcessPoolExecutor',
            difficulty: 'Intermediate',
            problemStatement: 'Write a function `parallel_compute(fn, items)` using `concurrent.futures.ProcessPoolExecutor` as a context manager that returns `list(executor.map(fn, items))`.',
            instructions: 'Use with ProcessPoolExecutor() as executor: return list(executor.map(fn, items)).',
            requirements: ['from concurrent.futures import ProcessPoolExecutor', 'return list(executor.map(fn, items))'],
            starterCode: `from concurrent.futures import ProcessPoolExecutor\n\ndef parallel_compute(fn, items):\n    # TODO: Execute in parallel\n    pass`,
            solutionCode: `from concurrent.futures import ProcessPoolExecutor\n\ndef parallel_compute(fn, items):\n    with ProcessPoolExecutor() as executor:\n        return list(executor.map(fn, items))`,
            hints: ['with ProcessPoolExecutor() as executor: return list(executor.map(fn, items))']
          }
        }
      ]
    },
    {
      title: 'Phase 3: NumPy & Vectorized Computation',
      order: 3,
      lessons: [
        {
          lessonNumber: 8,
          title: 'NumPy N-Dimensional Arrays (ndarray) & Memory Layout',
          description: 'Explore contiguous C vs Fortran memory order, strides, data types (dtype), and vectorized SIMD CPU operations.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand NumPy `ndarray` contiguous memory buffers and Strides',
            'Differentiate C-contiguous (Row-major) vs Fortran-contiguous (Column-major) memory layouts',
            'Leverage CPU SIMD vector instructions for 100x speedups over Python loops'
          ],
          introduction: `Standard Python lists store arrays of pointers to individual boxed integer objects scattered across RAM. NumPy replaces this with contiguous C-allocated memory blocks (\`ndarray\`), executing calculations via hardware CPU SIMD (Single Instruction, Multiple Data) vector instructions at near-C speeds.`,
          deepDiveSections: [
            {
              title: 'NumPy Memory Strides & Zero-Copy Views',
              explanation: `An \`ndarray\` consists of:
1. Data Pointer: Contiguous block of raw C memory bytes.
2. Shape: Dimensions tuple (e.g. \`(1000, 500)\`).
3. Strides: Number of bytes to step in memory to advance one element along each dimension.
Zero-Copy Slicing: Slicing \`arr[::2]\` or transposing \`arr.T\` does NOT copy data in memory; it simply updates the strides tuple, executing instantaneously in O(1) time!`,
              keyPoint: 'NumPy array slicing creates zero-copy memory views by adjusting stride byte pointers.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Python List vs. NumPy ndarray',
            headers: ['Metric', 'Python List (`[1, 2, 3]` )', 'NumPy ndarray (`np.array([1, 2, 3])`)'],
            rows: [
              ['Memory Layout', 'Array of 64-bit pointers to heap objects (~28 bytes/int)', 'Contiguous unboxed raw binary buffer (4 bytes/int32)'],
              ['Memory Overhead', '~800% higher memory consumption', 'Minimal, compact C-array storage'],
              ['10M Math Operations', '~1,500 ms (Interpreted type-checking per loop)', '~12 ms (Vectorized SIMD C-kernel execution)']
            ]
          },
          coreConcepts: ['Contiguous memory allocation', 'Strides and Zero-Copy views', 'SIMD CPU vectorization'],
          syntax: `import numpy as np

# Creating typed ndarrays
arr = np.zeros((1000, 1000), dtype=np.float32)
print("Strides:", arr.strides) # (4000, 4) bytes
print("Memory footprint:", arr.nbytes / 1024 / 1024, "MB") # 3.81 MB`,
          codeExamples: [
            {
              language: 'python',
              code: `import numpy as np

# Demonstrating Vectorization Speedup
size = 10_000_000
np_arr = np.ones(size, dtype=np.float64)

# Vectorized operation (Runs in compiled C via SIMD)
result = np_arr * 5.0 + 10.0`,
              explanation: 'Executes 10 million mathematical operations in milliseconds via vectorized C loops.'
            }
          ],
          commonMistakes: ['Iterating over NumPy arrays with standard Python `for x in arr:` loops, which destroys vectorization performance'],
          bestPractices: ['Always use native NumPy vectorized functions and operators instead of manual loops'],
          summary: `NumPy ndarrays store contiguous memory buffers that harness CPU vectorization for extreme computational performance.`,
          resources: [{ title: 'NumPy Internals Reference', url: 'https://numpy.org/doc/stable/reference/internals.html', provider: 'NumPy.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py8_q1',
                question: 'Why are NumPy vectorized operations up to 100x faster than standard Python `for` loops?',
                options: [
                  'They execute pre-compiled C loops over contiguous memory blocks using CPU SIMD (Single Instruction Multiple Data) instructions without interpreter overhead',
                  'They convert Python code to JavaScript',
                  'They disable floating point numbers',
                  'They delete unused variables'
                ],
                correctIndex: 0,
                topic: 'NumPy Vectorization',
                explanation: 'NumPy executes compiled C routines over contiguous memory, bypassing dynamic type checking on every iteration.'
              }
            ]
          },
          practicalTask: {
            title: 'Create a 2D Float32 Identity Matrix',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `create_identity(n)` that returns an `n x n` identity matrix with `dtype=np.float32` using `np.eye()`.',
            instructions: 'Import numpy as np and return np.eye(n, dtype=np.float32).',
            requirements: ['import numpy as np', 'return np.eye(n, dtype=np.float32)'],
            starterCode: `import numpy as np\n\ndef create_identity(n):\n    # TODO: Return identity matrix\n    pass`,
            solutionCode: `import numpy as np\n\ndef create_identity(n):\n    return np.eye(n, dtype=np.float32)`,
            hints: ['return np.eye(n, dtype=np.float32)']
          }
        },
        {
          lessonNumber: 9,
          title: 'Vectorization, Broadcasting & Array Slicing',
          description: 'Master NumPy broadcasting rules, multi-dimensional array slicing, boolean masking, and fancy indexing.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master the 2 NumPy Broadcasting Rules for multi-dimensional operations',
            'Filter and mutate arrays conditionally using Boolean Masking',
            'Select and reorder multi-dimensional tensors using Fancy Indexing'
          ],
          introduction: `Broadcasting is NumPy's ability to perform arithmetic operations on arrays of different shapes without making redundant copies of data in memory. Understanding broadcasting rules is fundamental for deep learning and matrix transformations.`,
          deepDiveSections: [
            {
              title: 'The 2 Fundamental NumPy Broadcasting Rules',
              explanation: `When operating on two arrays, NumPy compares their shapes element-wise from right to left (trailing dimensions first):
Two dimensions are compatible when:
1. They are equal, OR
2. One of them is 1.
Example: Array A \`(4, 1, 5)\` + Array B \`(3, 5)\` -> Array B is treated as \`(1, 3, 5)\`. Both broadcast seamlessly to resulting shape \`(4, 3, 5)\` without duplicating data!`,
              keyPoint: 'Broadcasting allows arithmetic on differing shapes without allocating redundant memory copies.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Indexing Techniques in NumPy',
            headers: ['Technique', 'Syntax', 'Result Type', 'Memory Behavior'],
            rows: [
              ['Basic Slicing', '`arr[1:5, :]`', 'ndarray view', 'Zero-copy (Mutating slice mutates original array)'],
              ['Boolean Masking', '`arr[arr > 0.5]`', '1D ndarray', 'Copies data matching boolean mask'],
              ['Fancy Indexing', '`arr[[0, 2, 4]]`', 'ndarray copy', 'Copies data for selected index list']
            ]
          },
          coreConcepts: ['Broadcasting dimension alignment rules', 'Zero-copy slicing vs Fancy index copying', 'Boolean conditional masks (`arr[arr > 0]`)'],
          syntax: `# Broadcasting Example: Centering a Dataset
X = np.random.randn(100, 5) # 100 samples, 5 features
mean = np.mean(X, axis=0)    # Shape: (5,)
X_centered = X - mean        # Broadcasts (100, 5) - (5,)`,
          codeExamples: [
            {
              language: 'python',
              code: `import numpy as np

# Normalizing image batch with Broadcasting
# batch shape: (32, 224, 224, 3) -> 32 images of 224x224 RGB
batch = np.random.randint(0, 256, (32, 224, 224, 3), dtype=np.uint8)

mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Broadcasts mean and std across all 32 images and pixels simultaneously!
normalized_batch = (batch / 255.0 - mean) / std`,
              explanation: 'Normalizes 32 images across 3 color channels in a single broadcasted operation.'
            }
          ],
          commonMistakes: ['Assuming boolean indexing creates a view; boolean masking always returns a copy of the filtered data'],
          bestPractices: ['Use `np.where(condition, x, y)` for vectorized ternary operations on arrays'],
          summary: `Broadcasting and boolean masking allow concise, high-speed vector calculations on complex multidimensional arrays.`,
          resources: [{ title: 'NumPy Broadcasting Rules Guide', url: 'https://numpy.org/doc/stable/user/basics.broadcasting.html', provider: 'NumPy.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'py9_q1',
                question: 'Can an array of shape `(5, 1)` be broadcasted with an array of shape `(1, 4)` in NumPy?',
                options: [
                  'Yes, they broadcast to a resulting shape of (5, 4)',
                  'No, because the dimensions are unequal',
                  'Only if both arrays contain zeros',
                  'It throws a ShapeError'
                ],
                correctIndex: 0,
                topic: 'NumPy Broadcasting',
                explanation: 'Because both dimensions contain 1s, NumPy expands dimension 1 across rows and columns to yield shape (5, 4).'
              }
            ]
          },
          practicalTask: {
            title: 'Normalize Features with Broadcasting',
            difficulty: 'Intermediate',
            problemStatement: 'Write a function `standardize_matrix(X)` that subtracts the column mean `np.mean(X, axis=0)` and divides by column standard deviation `np.std(X, axis=0)` using broadcasting.',
            instructions: 'Compute mean and std along axis=0 and return (X - mean) / std.',
            requirements: ['mean = np.mean(X, axis=0)', 'std = np.std(X, axis=0)', 'return (X - mean) / std'],
            starterCode: `import numpy as np\n\ndef standardize_matrix(X):\n    # TODO: Standardize\n    pass`,
            solutionCode: `import numpy as np\n\ndef standardize_matrix(X):\n    mean = np.mean(X, axis=0)\n    std = np.std(X, axis=0)\n    return (X - mean) / std`,
            hints: ['mean = np.mean(X, axis=0); std = np.std(X, axis=0); return (X - mean) / std']
          }
        },
        {
          lessonNumber: 10,
          title: 'Linear Algebra with NumPy: Dot Products, Matrix Operations & Inverses',
          description: 'Master dot products (np.dot, @ operator), matrix multiplication, eigenvalues, singular value decomposition (SVD), and cosine similarity.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Master matrix multiplication using the `@` operator and `np.matmul`',
            'Compute Cosine Similarity between vector embeddings for AI semantic search',
            'Decompose matrices using Singular Value Decomposition (SVD) and Principal Component Analysis (PCA)'
          ],
          introduction: `Linear algebra is the mathematical language of Artificial Intelligence. Neural network forward passes, transformer attention mechanisms, and vector database similarity searches are all composed of dot products and matrix multiplications.`,
          deepDiveSections: [
            {
              title: 'Vector Dot Product & Cosine Similarity in AI',
              explanation: `Cosine similarity measures the semantic similarity between two embedding vectors regardless of their magnitude:
\`\`\`
CosineSimilarity(A, B) = (A • B) / (||A|| * ||B||)
\`\`\`
1. Dot Product (A • B): Measures directional alignment (\`np.dot(A, B)\`).
2. Euclidean Norms (||A||, ||B||): Computed via \`np.linalg.norm()\`.
If vectors are pre-normalized to unit length (||A|| = 1), cosine similarity simplifies to a simple, high-speed dot product: \`A @ B.T\`!`,
              keyPoint: 'Vector similarity search in LLM vector databases is fundamentally a normalized matrix dot product.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: NumPy Linear Algebra Operators',
            headers: ['Operation', 'NumPy Syntax', 'Mathematical Notation', 'Dimension Requirement'],
            rows: [
              ['Element-wise Multiply', '`A * B`', 'Hadamard Product (A ⊙ B)', 'Shapes must match or broadcast'],
              ['Matrix Multiplication', '`A @ B` or `np.matmul(A, B)`', 'Matrix Product (A × B)', 'Columns of A must equal Rows of B (`(M, K) @ (K, N) -> (M, N)`)'],
              ['Vector Dot Product', '`np.dot(u, v)`', 'Scalar Product (u • v)', 'Vectors must have identical length']
            ]
          },
          coreConcepts: ['Matrix multiplication with `@` operator', 'Cosine similarity embedding math', 'Singular Value Decomposition (`np.linalg.svd`)'],
          syntax: `import numpy as np

# Matrix Multiplication in Python 3.5+
A = np.random.randn(10, 512)  # 10 queries, 512 embedding dims
B = np.random.randn(100, 512) # 100 documents, 512 dims
similarity_matrix = A @ B.T   # Shape: (10, 100)`,
          codeExamples: [
            {
              language: 'python',
              code: `import numpy as np

def compute_cosine_similarity(query_vec, doc_vectors):
    """
    query_vec: shape (D,)
    doc_vectors: shape (N, D)
    Returns: similarity scores shape (N,)
    """
    # 1. Normalize query vector
    q_norm = query_vec / np.linalg.norm(query_vec)
    
    # 2. Normalize document vectors along axis 1
    doc_norms = doc_vectors / np.linalg.norm(doc_vectors, axis=1, keepdims=True)
    
    # 3. Vectorized matrix-vector multiplication
    return doc_norms @ q_norm`,
              explanation: 'High-speed cosine similarity engine used in AI vector retrieval.'
            }
          ],
          commonMistakes: ['Using `*` (element-wise multiplication) when intending to compute a matrix multiplication `@`'],
          bestPractices: ['Always use the `@` operator for matrix multiplication and normalize embeddings before cosine search'],
          summary: `Vector dot products and matrix operations power modern AI embeddings and deep learning architectures.`,
          resources: [{ title: 'NumPy Linear Algebra (numpy.linalg)', url: 'https://numpy.org/doc/stable/reference/routines.linalg.html', provider: 'NumPy.org', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py10_q1',
                question: 'Which Python operator performs true matrix multiplication between two 2D NumPy arrays `A` and `B`?',
                options: [
                  'A @ B',
                  'A * B',
                  'A ** B',
                  'A & B'
                ],
                correctIndex: 0,
                topic: 'Matrix Multiplication Syntax',
                explanation: '`@` is the official Python 3.5+ matrix multiplication operator (equivalent to `np.matmul(A, B)`).'
              }
            ]
          },
          practicalTask: {
            title: 'Compute Cosine Similarity of Two Vectors',
            difficulty: 'Intermediate',
            problemStatement: 'Write a function `cosine_sim(u, v)` that computes and returns the cosine similarity `np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))`.',
            instructions: 'Use np.dot and np.linalg.norm.',
            requirements: ['return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))'],
            starterCode: `import numpy as np\n\ndef cosine_sim(u, v):\n    # TODO: Return cosine similarity\n    pass`,
            solutionCode: `import numpy as np\n\ndef cosine_sim(u, v):\n    return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))`,
            hints: ['return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))']
          }
        }
      ]
    },
    {
      title: 'Phase 4: Pandas & Data Engineering',
      order: 4,
      lessons: [
        {
          lessonNumber: 11,
          title: 'Pandas DataFrames, Series & Indexing Mechanics',
          description: 'Master Series, DataFrames, positional indexing (.iloc) vs label indexing (.loc), and memory optimization with categorical types.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand Pandas DataFrames backed by 2D NumPy array blocks',
            'Master label-based indexing (`.loc`) vs integer-based indexing (`.iloc`)',
            'Reduce DataFrame memory by up to 80% using categorical data types'
          ],
          introduction: `Pandas is the premier data manipulation and analysis library in Python. It provides fast, flexible tabular data structures (\`DataFrame\` and \`Series\`) designed for relational data munging, feature engineering, and statistical modeling.`,
          deepDiveSections: [
            {
              title: '.loc vs. .iloc Indexing Rules',
              explanation: `How to avoid indexing bugs in Pandas:
• \`.loc[row_label, col_label]\`: Strictly LABEL-BASED. Both start and stop bounds are **inclusive** (\`df.loc['2026-01':'2026-06']\` includes June!).
• \`.iloc[row_idx, col_idx]\`: Strictly INTEGER POSITION-BASED (0 to N-1). Follows standard Python slicing rules where stop bound is **exclusive** (\`df.iloc[0:5]\` returns rows 0, 1, 2, 3, 4).`,
              keyPoint: 'Use .loc for explicit label lookups (inclusive stop); use .iloc for numerical integer indices (exclusive stop).'
            }
          ],
          comparisonTable: {
            title: 'Comparison: .loc vs. .iloc vs. Chained Indexing',
            headers: ['Indexing Method', 'Lookup Type', 'Slice Bounds', 'SettingWithCopyWarning Risk'],
            rows: [
              ['`df.loc["a":"c", "col"]`', 'Label based', 'Inclusive of end label', 'Safe for assignments'],
              ['`df.iloc[0:3, 1]`', 'Integer position based', 'Exclusive of stop index', 'Safe for assignments'],
              ['`df["col"][0]`', 'Chained indexing', 'Mixed', 'High Risk (`SettingWithCopyWarning`)']
            ]
          },
          coreConcepts: ['DataFrames and Series architecture', 'Label `.loc` vs positional `.iloc` indexing', 'Categorical dtype memory compression'],
          syntax: `import pandas as pd

# Creating and indexing DataFrames
df = pd.DataFrame({
    'student_id': [101, 102, 103],
    'gpa': [3.8, 3.2, 3.9],
    'major': ['CS', 'EE', 'CS']
})

# Memory optimization with category dtype
df['major'] = df['major'].astype('category')`,
          codeExamples: [
            {
              language: 'python',
              code: `import pandas as pd

# Memory optimization audit
df = pd.read_csv('students.csv')
print("Initial memory:", df.memory_usage(deep=True).sum() / 1024, "KB")

# Convert low-cardinality text columns to categorical
for col in df.select_dtypes(include='object'):
    if df[col].nunique() / len(df) < 0.5:
        df[col] = df[col].astype('category')

print("Optimized memory:", df.memory_usage(deep=True).sum() / 1024, "KB")`,
              explanation: 'Reduces DataFrame RAM usage by converting repetitive strings to categorical types.'
            }
          ],
          commonMistakes: ['Using chained assignment like `df[df["score"] > 80]["status"] = "Pass"`, triggering `SettingWithCopyWarning`'],
          bestPractices: ['Always use `.loc[condition, "column"] = value` for conditional column assignments'],
          summary: `Pandas DataFrames provide high-performance tabular data structures with strict .loc and .iloc indexing semantics.`,
          resources: [{ title: 'Pandas User Guide: Indexing and Selecting Data', url: 'https://pandas.pydata.org/docs/user_guide/indexing.html', provider: 'Pandas.pydata.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'py11_q1',
                question: 'Which Pandas indexer should be used to select data using exact row and column names (labels)?',
                options: [
                  '.loc',
                  '.iloc',
                  '.ix',
                  '.at_pos'
                ],
                correctIndex: 0,
                topic: 'Pandas Indexing',
                explanation: '`.loc` is strictly label-based, while `.iloc` is strictly integer-position based.'
              }
            ]
          },
          practicalTask: {
            title: 'Filter DataFrame with .loc',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `get_high_achievers(df)` that uses `.loc` to return all rows where `df["cgpa"] >= 3.8` projecting columns `["name", "cgpa"]`.',
            instructions: 'Use df.loc[df["cgpa"] >= 3.8, ["name", "cgpa"]].',
            requirements: ['return df.loc[df["cgpa"] >= 3.8, ["name", "cgpa"]]'],
            starterCode: `def get_high_achievers(df):\n    # TODO: Filter with .loc\n    pass`,
            solutionCode: `def get_high_achievers(df):\n    return df.loc[df['cgpa'] >= 3.8, ['name', 'cgpa']]`,
            hints: ['return df.loc[df["cgpa"] >= 3.8, ["name", "cgpa"]]']
          }
        },
        {
          lessonNumber: 12,
          title: 'Data Cleaning: Missing Values, Type Coercion & Duplicates',
          description: 'Handle NaN/None values with dropna, fillna, interpolate, coerce dirty strings to numeric types, and detect outliers.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Detect and remediate missing data (NaN/None) using fillna, dropna, and bfill/ffill',
            'Coerce dirty string columns to numeric formats with `pd.to_numeric(errors="coerce")`',
            'Deduplicate records and remove statistical outliers using the Interquartile Range (IQR)'
          ],
          introduction: `Real-world data is dirty: sensor readings drop out (NaN), price strings contain dollar signs (\`"$49.99"\`), and dates arrive in mixed formats. Data cleaning is 80% of an AI engineer's workflow before models can be trained.`,
          deepDiveSections: [
            {
              title: 'Handling Missing Values & Imputation Strategies',
              explanation: `Strategies for missing data:
1. Deletion (\`dropna\`): Safe only when missing data is less than 2% and completely random.
2. Statistical Imputation: Replace numerical NaNs with the \`median()\` (robust to outliers) or \`mean()\`.
3. Forward/Backward Fill (\`ffill\` / \`bfill\`): Essential for Time-Series data to propagate the last known valid sensor measurement forward.`,
              keyPoint: 'Use median imputation for skewed numerical data; use forward-fill (ffill) for time-series sequences.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Missing Value Imputation Techniques',
            headers: ['Technique', 'Pandas Method', 'Best Use Case', 'Risk'],
            rows: [
              ['Drop Rows', '`df.dropna()`', 'High data volume with minimal missingness (< 2%)', 'Loss of statistical sample size'],
              ['Median Imputation', '`df["val"].fillna(df["val"].median())`', 'Skewed numerical data with extreme outliers', 'Reduces feature variance'],
              ['Forward Fill', '`df.ffill()`', 'Time-series sensor readings and stock prices', 'Propagates stale values if gap is long']
            ]
          },
          coreConcepts: ['Safe type coercion (`pd.to_numeric`)', 'Time-series interpolation', 'IQR outlier trimming'],
          syntax: `# Safe Numeric Coercion
df['price'] = df['price'].str.replace('$', '', regex=False)
df['price'] = pd.to_numeric(df['price'], errors='coerce')
df['price'] = df['price'].fillna(df['price'].median())`,
          codeExamples: [
            {
              language: 'python',
              code: `import pandas as pd
import numpy as np

def clean_academic_dataset(df):
    # 1. Deduplicate by student ID keeping latest
    df = df.drop_duplicates(subset=['student_id'], keep='last')
    
    # 2. Coerce CGPA to float, invalid strings become NaN
    df['cgpa'] = pd.to_numeric(df['cgpa'], errors='coerce')
    
    # 3. Impute missing CGPA with median
    df['cgpa'] = df['cgpa'].fillna(df['cgpa'].median())
    
    # 4. Remove statistical outliers (IQR method)
    q1 = df['cgpa'].quantile(0.25)
    q3 = df['cgpa'].quantile(0.75)
    iqr = q3 - q1
    return df[(df['cgpa'] >= q1 - 1.5 * iqr) & (df['cgpa'] <= q3 + 1.5 * iqr)]`,
              explanation: 'Comprehensive pipeline deduplicating, coercing types, and removing outliers.'
            }
          ],
          commonMistakes: ['Imputing missing test set values using test set statistics, causing Data Leakage; always fit imputers on the training set only!'],
          bestPractices: ['Calculate imputation metrics (mean/median) exclusively from training data to prevent data leakage'],
          summary: `Robust data cleaning and statistical imputation prepare clean, high-signal datasets for machine learning.`,
          resources: [{ title: 'Working with Missing Data in Pandas', url: 'https://pandas.pydata.org/docs/user_guide/missing_data.html', provider: 'Pandas.pydata.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'py12_q1',
                question: 'What does `pd.to_numeric(df["price"], errors="coerce")` do when it encounters an invalid string like `"N/A"`?',
                options: [
                  'Converts the invalid string to `NaN` (Not a Number) without throwing an exception',
                  'Throws a ValueError and crashes',
                  'Converts the string to 0',
                  'Deletes the entire column'
                ],
                correctIndex: 0,
                topic: 'Type Coercion',
                explanation: '`errors="coerce"` safely transforms unparseable values into `NaN`, allowing downstream `fillna` or `dropna` cleaning.'
              }
            ]
          },
          practicalTask: {
            title: 'Coerce and Fill Missing Column Values',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `clean_scores(df)` that coerces `df["score"]` to numeric with `errors="coerce"` and fills resulting `NaN` values with `0`.',
            instructions: 'Use pd.to_numeric(df["score"], errors="coerce").fillna(0).',
            requirements: ['df["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0)', 'return df'],
            starterCode: `import pandas as pd\n\ndef clean_scores(df):\n    # TODO: Clean score column\n    pass`,
            solutionCode: `import pandas as pd\n\ndef clean_scores(df):\n    df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)\n    return df`,
            hints: ['df["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0); return df']
          }
        },
        {
          lessonNumber: 13,
          title: 'GroupBy, Aggregations, Merging & Reshaping Datasets',
          description: 'Master Split-Apply-Combine with .groupby(), multi-table merges (inner, left, outer), pivot tables, and melt reshaping.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Apply the Split-Apply-Combine paradigm using `.groupby()` and custom aggregations',
            'Merge relational DataFrames using inner, left, and full outer joins (`pd.merge`)',
            'Reshape wide and long datasets with `pivot_table` and `melt`'
          ],
          introduction: `Data analysis requires aggregating metrics across business groups (e.g. average grade by academic department) and joining disparate datasets. The Split-Apply-Combine strategy in Pandas enables high-speed multi-dimensional data aggregation.`,
          deepDiveSections: [
            {
              title: 'The Split-Apply-Combine Pattern',
              explanation: `How .groupby() processes data:
1. Split: Partitions the DataFrame into distinct groups based on keys (e.g. \`department\`).
2. Apply: Computes statistical functions (mean, sum, count, custom lambda) independently on each chunk.
3. Combine: Concatenates the aggregated results back into a single structured DataFrame.
Using \`.agg()\`:
\`\`\`python
df.groupby('department').agg(
    avg_gpa=('cgpa', 'mean'),
    student_count=('student_id', 'count'),
    max_credits=('credits', 'max')
)
\`\`\``,
              keyPoint: 'Named aggregations in .agg() allow computing multiple custom metrics across columns in a single pass.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Join Types in pd.merge',
            headers: ['Join Type', 'SQL Equivalent', 'Behavior'],
            rows: [
              ['`how="inner"`', 'INNER JOIN', 'Keeps only rows with matching keys in BOTH DataFrames'],
              ['`how="left"`', 'LEFT OUTER JOIN', 'Keeps all rows from left DataFrame; fills missing right values with NaN'],
              ['`how="outer"`', 'FULL OUTER JOIN', 'Keeps all rows from both DataFrames; fills missing values with NaN']
            ]
          },
          coreConcepts: ['Split-Apply-Combine paradigm', 'Relational DataFrame merges (`pd.merge`)', 'Reshaping with `pd.melt()` and `pivot_table`'],
          syntax: `# Relational Merge in Pandas
merged_df = pd.merge(students_df, grades_df, on='student_id', how='left')`,
          codeExamples: [
            {
              language: 'python',
              code: `import pandas as pd

# Multi-Metric Department Analytics Pipeline
analytics = students_df.groupby('department').agg(
    total_students=('student_id', 'count'),
    mean_cgpa=('cgpa', 'mean'),
    median_cgpa=('cgpa', 'median'),
    honors_count=('cgpa', lambda x: (x >= 3.8).sum())
).reset_index()

# Pivot Table: Year of Study vs Department CGPA
pivot = students_df.pivot_table(
    values='cgpa',
    index='department',
    columns='year_of_study',
    aggfunc='mean'
)`,
              explanation: 'Calculates department aggregations and builds a multi-dimensional pivot table.'
            }
          ],
          commonMistakes: ['Performing Cartesian product merges when joining on duplicate keys without unique constraints, causing memory explosions'],
          bestPractices: ['Verify key uniqueness before merging datasets using `validate="1:m"` in `pd.merge()`'],
          summary: `GroupBy aggregations and relational merges transform raw data tables into insightful analytical summaries.`,
          resources: [{ title: 'Pandas GroupBy: Split-Apply-Combine Guide', url: 'https://pandas.pydata.org/docs/user_guide/groupby.html', provider: 'Pandas.pydata.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py13_q1',
                question: 'Which join type in `pd.merge(df1, df2, how=...)` retains all rows from `df1` regardless of whether a match exists in `df2`?',
                options: [
                  'how="left"',
                  'how="inner"',
                  'how="cross"',
                  'how="right"'
                ],
                correctIndex: 0,
                topic: 'Pandas Merges',
                explanation: 'A left join (`how="left"`) preserves all records from the left DataFrame and populates missing right-hand columns with `NaN`.'
              }
            ]
          },
          practicalTask: {
            title: 'Aggregate Department Statistics',
            difficulty: 'Intermediate',
            problemStatement: 'Write a function `get_dept_summary(df)` that groups `df` by `"department"` and calculates the mean of `"cgpa"` returning a DataFrame with `.reset_index()`.',
            instructions: 'Use df.groupby("department")["cgpa"].mean().reset_index().',
            requirements: ['return df.groupby("department")["cgpa"].mean().reset_index()'],
            starterCode: `def get_dept_summary(df):\n    # TODO: Group and calculate mean\n    pass`,
            solutionCode: `def get_dept_summary(df):\n    return df.groupby('department')['cgpa'].mean().reset_index()`,
            hints: ['return df.groupby("department")["cgpa"].mean().reset_index()']
          }
        }
      ]
    },
    {
      title: 'Phase 5: Machine Learning Fundamentals',
      order: 5,
      lessons: [
        {
          lessonNumber: 14,
          title: 'Supervised vs Unsupervised Learning & Feature Engineering',
          description: 'Master Supervised (Regression/Classification) vs Unsupervised (Clustering/PCA), StandardScaler, OneHotEncoder, and train_test_split.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Differentiate Supervised learning (labeled targets) from Unsupervised learning (pattern discovery)',
            'Encode categorical variables using `OneHotEncoder` and scale numeric features with `StandardScaler`',
            'Build leak-free feature pipelines using Scikit-Learn `Pipeline` and `ColumnTransformer`'
          ],
          introduction: `Machine Learning algorithms learn mathematical decision boundaries from data. Supervised learning predicts labeled targets (e.g. predicting student job placement), while Unsupervised learning discovers hidden clusters. Feature engineering transforms raw text and numbers into standardized numerical vectors.`,
          deepDiveSections: [
            {
              title: 'Preventing Data Leakage with Scikit-Learn Pipelines',
              explanation: `What is Data Leakage?
If you fit a scaler (\`scaler.fit(X)\`) on your entire dataset before splitting into Train and Test sets, the test set's mean and variance "leak" into the training phase, artificially inflating accuracy!
Solution: Use Scikit-Learn \`Pipeline\`:
\`\`\`python
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression())
])
pipeline.fit(X_train, y_train) # Scaler fits ONLY on training data!
\`\`\``,
              keyPoint: 'Feature transformers must be fitted strictly on training data to prevent catastrophic data leakage.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Supervised vs. Unsupervised Machine Learning',
            headers: ['Dimension', 'Supervised Learning', 'Unsupervised Learning'],
            rows: [
              ['Training Data', 'Features (X) + Ground Truth Labels (y)', 'Features (X) with NO ground truth labels'],
              ['Primary Tasks', 'Classification (Spam/Not Spam), Regression (House Price)', 'Clustering (K-Means), Dimensionality Reduction (PCA)'],
              ['Evaluation Metric', 'Accuracy, Precision, Recall, F1-Score, RMSE', 'Silhouette Score, Inertia, Explained Variance']
            ]
          },
          coreConcepts: ['Data leakage prevention', 'One-Hot Encoding vs Ordinal Encoding', 'Scikit-Learn `ColumnTransformer` pipelines'],
          syntax: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test) # Transform only!`,
          codeExamples: [
            {
              language: 'python',
              code: `from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

# End-to-End Leak-Free ML Pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['age', 'cgpa', 'completed_hours']),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['major', 'gender'])
    ]
)

model_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', LogisticRegression())
])`,
              explanation: 'Standard Scikit-Learn pipeline encapsulating feature preprocessing and classification.'
            }
          ],
          commonMistakes: ['Calling `.fit_transform()` on the test dataset instead of calling `.transform()`'],
          bestPractices: ['Always use `Pipeline` and `ColumnTransformer` to automate leak-free preprocessing'],
          summary: `Feature engineering pipelines transform raw multimodal data into standardized numerical inputs without data leakage.`,
          resources: [{ title: 'Scikit-Learn Pipeline Guide', url: 'https://scikit-learn.org/stable/modules/compose.html', provider: 'Scikit-Learn.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py14_q1',
                question: 'Why must you call `scaler.transform(X_test)` instead of `scaler.fit_transform(X_test)` on the test dataset?',
                options: [
                  'To prevent data leakage by ensuring the scaler uses only the mean and standard deviation learned from the training data',
                  'Because fit_transform deletes test rows',
                  'Because transform converts data to integers',
                  'There is no difference'
                ],
                correctIndex: 0,
                topic: 'Data Leakage Prevention',
                explanation: 'Fitting the scaler on test data leaks statistical distribution metrics from the test set into the model evaluation.'
              }
            ]
          },
          practicalTask: {
            title: 'Split Dataset with train_test_split',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `split_data(X, y)` that splits features `X` and targets `y` into train and test sets with `test_size=0.2` and `random_state=42`.',
            instructions: 'Import train_test_split and return train_test_split(X, y, test_size=0.2, random_state=42).',
            requirements: ['from sklearn.model_selection import train_test_split', 'return train_test_split(X, y, test_size=0.2, random_state=42)'],
            starterCode: `from sklearn.model_selection import train_test_split\n\ndef split_data(X, y):\n    # TODO: Split dataset\n    pass`,
            solutionCode: `from sklearn.model_selection import train_test_split\n\ndef split_data(X, y):\n    return train_test_split(X, y, test_size=0.2, random_state=42)`,
            hints: ['return train_test_split(X, y, test_size=0.2, random_state=42)']
          }
        },
        {
          lessonNumber: 15,
          title: 'Scikit-Learn Classifiers: Logistic Regression, Random Forests & SVM',
          description: 'Train and evaluate Logistic Regression, Decision Trees, Random Forest ensembles, Support Vector Machines (SVM), and Gradient Boosting (XGBoost).',
          estimatedMinutes: 35,
          learningObjectives: [
            'Train linear (Logistic Regression) vs non-linear ensemble (Random Forest, XGBoost) models',
            'Understand decision trees, entropy, Gini impurity, and ensemble bagging mechanics',
            'Tune hyperparameters using `GridSearchCV` and `RandomizedSearchCV`'
          ],
          introduction: `Machine learning classifiers identify patterns to assign labels to input data. From interpretable linear models like Logistic Regression to powerful non-linear tree ensembles like Random Forests and XGBoost, selecting the right algorithm balances accuracy with inference latency.`,
          deepDiveSections: [
            {
              title: 'Random Forest Ensembles & Bagging Mechanics',
              explanation: `Why Random Forests outperform individual Decision Trees:
1. Bootstrap Aggregating (Bagging): Trains N individual decision trees on random bootstrap subsets of the training data.
2. Feature Subsampling: At each split node, only a random subset of features (e.g. \`sqrt(total_features)\`) is evaluated.
3. Variance Reduction: Combining predictions from 100 decorrelated trees via majority voting drastically reduces overfitting and variance compared to a single deep decision tree.`,
              keyPoint: 'Random Forests ensemble hundreds of decorrelated decision trees to eliminate overfitting and maximize generalization.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Machine Learning Classifiers',
            headers: ['Algorithm', 'Model Type', 'Interpretability', 'Best For'],
            rows: [
              ['Logistic Regression', 'Linear probabilistic model', 'High (Weights represent feature odds)', 'Fast baseline, linearly separable data, low latency APIs'],
              ['Random Forest', 'Non-linear ensemble (Bagging)', 'Medium (Feature importance rankings)', 'Tabular datasets, resilient to outliers without scaling'],
              ['Support Vector Machine (SVM)', 'Maximum margin hyperplane', 'Low', 'High-dimensional data (Text classification, genomics)'],
              ['Gradient Boosting (XGBoost)', 'Sequential ensemble (Boosting)', 'Medium', 'Winning competitive tabular ML benchmarks']
            ]
          },
          coreConcepts: ['Bias-Variance tradeoff', 'Random Forest ensemble bagging', 'Cross-validated hyperparameter grid search'],
          syntax: `from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV

rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)
predictions = rf.predict(X_test)`,
          codeExamples: [
            {
              language: 'python',
              code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV

# Hyperparameter tuning with 5-Fold Cross Validation
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, None],
    'min_samples_split': [2, 5]
}

grid_search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_grid=param_grid,
    cv=5,
    scoring='f1_weighted',
    n_jobs=-1 # Utilize all CPU cores
)

grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_`,
              explanation: 'Automated 5-fold cross-validated hyperparameter tuning using all CPU cores.'
            }
          ],
          commonMistakes: ['Training a deep single Decision Tree without setting `max_depth`, leading to 100% training accuracy but disastrous test set overfitting'],
          bestPractices: ['Always regularize trees with `max_depth` and evaluate models using 5-fold cross-validation'],
          summary: `Ensemble algorithms like Random Forests combine multiple weak learners into highly accurate, generalized predictive models.`,
          resources: [{ title: 'Scikit-Learn Supervised Models', url: 'https://scikit-learn.org/stable/supervised_learning.html', provider: 'Scikit-Learn.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py15_q1',
                question: 'How does a Random Forest model reduce the variance and overfitting of individual decision trees?',
                options: [
                  'By training multiple decorrelated trees on random bootstrap samples of data and feature subsets, then averaging their votes',
                  'By deleting 50% of the training data',
                  'By running only on linear datasets',
                  'By converting all numbers to integers'
                ],
                correctIndex: 0,
                topic: 'Ensemble Learning',
                explanation: 'Bagging and feature subsampling decorrelate the trees, so when their predictions are averaged, individual errors cancel out.'
              }
            ]
          },
          practicalTask: {
            title: 'Train a Random Forest Classifier',
            difficulty: 'Intermediate',
            problemStatement: 'Write a function `train_rf(X_train, y_train)` that instantiates `RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)`, fits it on the training data, and returns the trained model.',
            instructions: 'Import RandomForestClassifier from sklearn.ensemble, fit and return model.',
            requirements: ['RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)', 'model.fit(X_train, y_train)', 'return model'],
            starterCode: `from sklearn.ensemble import RandomForestClassifier\n\ndef train_rf(X_train, y_train):\n    # TODO: Train and return model\n    pass`,
            solutionCode: `from sklearn.ensemble import RandomForestClassifier\n\ndef train_rf(X_train, y_train):\n    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)\n    model.fit(X_train, y_train)\n    return model`,
            hints: ['model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42); model.fit(X_train, y_train); return model']
          }
        },
        {
          lessonNumber: 16,
          title: 'Model Evaluation: Precision, Recall, F1-Score & ROC-AUC',
          description: 'Evaluate machine learning models using Confusion Matrices, Precision vs Recall tradeoffs, F1-Score, and ROC-AUC curves.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand Confusion Matrices (True Positives, False Positives, True Negatives, False Negatives)',
            'Master the trade-off between Precision (exactness) and Recall (completeness)',
            'Evaluate class-imbalanced datasets using F1-Score and Area Under ROC Curve (ROC-AUC)'
          ],
          introduction: `Accuracy is a dangerous metric on imbalanced datasets. If 99% of transactions are legitimate and 1% are fraudulent, a naive model that predicts "Legitimate" 100% of the time achieves 99% accuracy while catching zero fraud. Comprehensive model evaluation requires Precision, Recall, and ROC-AUC.`,
          deepDiveSections: [
            {
              title: 'Precision vs. Recall & The F1-Score',
              explanation: `Understanding the trade-off:
• Precision (\`TP / (TP + FP)\`): "Of all items predicted positive, how many were actually positive?" (Critical in Spam filters where you cannot afford False Positives sending important emails to spam).
• Recall (\`TP / (TP + FN)\`): "Of all actual positive items, how many did we catch?" (Critical in Cancer / Fraud detection where a False Negative is fatal).
• F1-Score: Harmonic mean balancing Precision and Recall: \`2 * (Precision * Recall) / (Precision + Recall)\`.`,
              keyPoint: 'F1-Score provides a balanced harmonic mean of Precision and Recall on imbalanced datasets.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Machine Learning Evaluation Metrics',
            headers: ['Metric', 'Formula', 'Best Use Case', 'Weakness'],
            rows: [
              ['Accuracy', '`(TP + TN) / Total`', 'Balanced classes (50/50 split)', 'Misleading on imbalanced data'],
              ['Precision', '`TP / (TP + FP)`', 'When False Positives are expensive (Spam detection)', 'Ignores missed positive cases (False Negatives)'],
              ['Recall (Sensitivity)', '`TP / (TP + FN)`', 'When False Negatives are critical (Medical diagnosis)', 'Can be gamed by predicting positive for everything'],
              ['ROC-AUC', 'Area under TPR vs FPR curve', 'Evaluating classifier ranking across all decision thresholds', 'Can be optimistic on extreme skew']
            ]
          },
          coreConcepts: ['Confusion Matrix anatomy', 'Precision-Recall tradeoff curves', 'ROC-AUC threshold evaluation'],
          syntax: `from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

print(classification_report(y_test, y_pred))
auc = roc_auc_score(y_test, y_pred_proba[:, 1])`,
          codeExamples: [
            {
              language: 'python',
              code: `from sklearn.metrics import classification_report, confusion_matrix

# Comprehensive Classification Evaluation
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:\n", cm)

# Generates Precision, Recall, F1-Score per class
report = classification_report(y_test, y_pred, target_names=['Failed', 'Passed'])
print("Classification Report:\n", report)`,
              explanation: 'Generates confusion matrix and complete classification report.'
            }
          ],
          commonMistakes: ['Relying on plain Accuracy score when evaluating rare-event datasets like fraud or defect detection'],
          bestPractices: ['Always inspect the Confusion Matrix and report both Precision, Recall, and F1-Score on test datasets'],
          summary: `Precision, Recall, F1-Score, and ROC-AUC provide honest, robust performance evaluation for real-world ML models.`,
          resources: [{ title: 'Scikit-Learn Model Evaluation Guide', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', provider: 'Scikit-Learn.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py16_q1',
                question: 'In a medical disease diagnostic model where failing to detect a sick patient (False Negative) is life-threatening, which metric must be maximized?',
                options: [
                  'Recall (Sensitivity)',
                  'Precision',
                  'Specificity',
                  'Accuracy'
                ],
                correctIndex: 0,
                topic: 'Evaluation Metrics',
                explanation: 'Recall measures the percentage of actual positive cases successfully identified, minimizing dangerous False Negatives.'
              }
            ]
          },
          practicalTask: {
            title: 'Calculate F1-Score in Scikit-Learn',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `calculate_f1(y_true, y_pred)` that returns `f1_score(y_true, y_pred, average="weighted")`.',
            instructions: 'Import f1_score from sklearn.metrics and return f1_score(y_true, y_pred, average="weighted").',
            requirements: ['from sklearn.metrics import f1_score', 'return f1_score(y_true, y_pred, average="weighted")'],
            starterCode: `from sklearn.metrics import f1_score\n\ndef calculate_f1(y_true, y_pred):\n    # TODO: Calculate F1\n    pass`,
            solutionCode: `from sklearn.metrics import f1_score\n\ndef calculate_f1(y_true, y_pred):\n    return f1_score(y_true, y_pred, average='weighted')`,
            hints: ['return f1_score(y_true, y_pred, average="weighted")']
          }
        }
      ]
    },
    {
      title: 'Phase 6: LLM Engineering & Embeddings',
      order: 6,
      lessons: [
        {
          lessonNumber: 17,
          title: 'Transformer Architecture & Attention Mechanism Fundamentals',
          description: 'Explore Scaled Dot-Product Self-Attention, Multi-Head Attention, positional encodings, and autoregressive next-token prediction.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Understand the Transformer architecture (Encoder vs Decoder models)',
            'Master the Scaled Dot-Product Self-Attention formula: `Softmax(Q @ K.T / sqrt(d_k)) @ V`',
            'Understand autoregressive Next-Token generation and temperature sampling'
          ],
          introduction: `The Transformer architecture (introduced in "Attention Is All You Need") powers all modern Large Language Models (LLMs) like GPT-4, Claude, and Gemini. By replacing sequential RNNs with parallel Self-Attention mechanisms, Transformers process massive context windows across complex language tokens.`,
          deepDiveSections: [
            {
              title: 'The Scaled Dot-Product Attention Formula',
              explanation: `How Self-Attention relates tokens in a sentence:
Every input token is projected into three vectors:
1. Query (Q): What this token is looking for.
2. Key (K): What information this token contains.
3. Value (V): The actual representation payload of the token.
Mathematical Attention Equation:
\`\`\`
Attention(Q, K, V) = Softmax( (Q @ K.T) / sqrt(d_k) ) @ V
\`\`\`
• \`Q @ K.T\`: Computes attention similarity scores between every pair of words.
• \`/ sqrt(d_k)\`: Scaling factor preventing gradients from vanishing on large dimensions.
• \`Softmax\`: Normalizes attention scores into probability weights (summing to 1.0).
• \`@ V\`: Produces the contextualized output embedding.`,
              keyPoint: 'Self-Attention dynamically computes contextual relationships between all words in a sentence simultaneously.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Transformer Model Families',
            headers: ['Architecture', 'Model Examples', 'Mechanism', 'Best For'],
            rows: [
              ['Encoder-Only', 'BERT, RoBERTa', 'Bidirectional attention across entire context', 'Text classification, entity extraction, embeddings'],
              ['Decoder-Only', 'GPT-4, Llama 3, Gemini, Mistral', 'Causal masked autoregressive next-token generation', 'Text generation, code synthesis, conversational AI'],
              ['Encoder-Decoder', 'T5, BART', 'Encodes input text, decodes translation', 'Translation, long-form summarization']
            ]
          },
          coreConcepts: ['Scaled Dot-Product Attention equation', 'Queries, Keys, and Values (Q, K, V)', 'Causal attention masking in decoder LLMs'],
          syntax: `# Scaled Dot-Product Attention in NumPy
import numpy as np

def attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = (Q @ K.T) / np.sqrt(d_k)
    weights = np.exp(scores) / np.sum(np.exp(scores), axis=-1, keepdims=True) # Softmax
    return weights @ V`,
          codeExamples: [
            {
              language: 'python',
              code: `import numpy as np

# Simple Self-Attention Demonstration
tokens = 4      # Sequence length: "The cat sat down"
dim = 8         # Embedding dimension

Q = np.random.randn(tokens, dim)
K = np.random.randn(tokens, dim)
V = np.random.randn(tokens, dim)

# Scaled dot-product attention
d_k = Q.shape[-1]
attention_scores = (Q @ K.T) / np.sqrt(d_k)
attention_weights = np.exp(attention_scores) / np.sum(np.exp(attention_scores), axis=-1, keepdims=True)
contextual_output = attention_weights @ V

print("Contextual output shape:", contextual_output.shape) # (4, 8)`,
              explanation: 'Computes raw multi-token self-attention representation.'
            }
          ],
          commonMistakes: ['Confusing Encoder-only models (like BERT used for embeddings) with Decoder-only models (like GPT used for text generation)'],
          bestPractices: ['Use Decoder-only models for generative conversational AI and specialized Encoder models for vector embeddings'],
          summary: `Self-Attention enables Transformers to compute global contextual representations across all sequence tokens in parallel.`,
          resources: [{ title: 'Attention Is All You Need (Original Paper)', url: 'https://arxiv.org/abs/1706.03762', provider: 'arXiv.org', type: 'Paper', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'py17_q1',
                question: 'What is the purpose of dividing by `sqrt(d_k)` in the Transformer Scaled Dot-Product Attention formula `Softmax( (Q @ K.T) / sqrt(d_k) ) @ V`?',
                options: [
                  'To scale down large dot product values, preventing the Softmax function from saturating and causing vanishing gradients',
                  'To convert floats to integers',
                  'To delete negative numbers',
                  'To calculate the square root of sequence length'
                ],
                correctIndex: 0,
                topic: 'Scaled Dot-Product Attention',
                explanation: 'On high dimensions, dot products grow large, pushing Softmax into regions with extremely small gradients; scaling by `sqrt(d_k)` stabilizes training.'
              }
            ]
          },
          practicalTask: {
            title: 'Implement Softmax Function in NumPy',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `softmax(x)` that computes and returns `np.exp(x) / np.sum(np.exp(x), axis=-1, keepdims=True)`.',
            instructions: 'Use np.exp and np.sum with keepdims=True.',
            requirements: ['return np.exp(x) / np.sum(np.exp(x), axis=-1, keepdims=True)'],
            starterCode: `import numpy as np\n\ndef softmax(x):\n    # TODO: Softmax calculation\n    pass`,
            solutionCode: `import numpy as np\n\ndef softmax(x):\n    exp_x = np.exp(x - np.max(x, axis=-1, keepdims=True))\n    return exp_x / np.sum(exp_x, axis=-1, keepdims=True)`,
            hints: ['exp_x = np.exp(x - np.max(x, axis=-1, keepdims=True)); return exp_x / np.sum(exp_x, axis=-1, keepdims=True)']
          }
        },
        {
          lessonNumber: 18,
          title: 'Vector Embeddings, Cosine Similarity & Vector Databases (Chroma/Pinecone)',
          description: 'Generate dense vector embeddings, build approximate nearest neighbor (HNSW) indexes, and query ChromaDB / Pinecone vector stores.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Generate dense semantic vector embeddings using OpenAI / Sentence-Transformers models',
            'Understand Approximate Nearest Neighbor (ANN) indexing algorithms (HNSW, IVF)',
            'Store, index, and query vector databases (ChromaDB, Pinecone, Qdrant)'
          ],
          introduction: `Vector embeddings transform unstructured text into dense 1536-dimensional vectors of real numbers. Words and sentences with similar semantic meanings map to nearby geometric coordinates in vector space, enabling semantic search and Retrieval-Augmented Generation (RAG).`,
          deepDiveSections: [
            {
              title: 'Approximate Nearest Neighbor (ANN) & HNSW Indexing',
              explanation: `Searching through 10 million vectors:
• Exact KNN Search (Brute Force): Computes cosine similarity against all 10 million vectors. Takes seconds and high CPU.
• Hierarchical Navigable Small World (HNSW): Builds a multi-layer graph of vector clusters (similar to skip lists). Traverses coarse upper layers before narrowing down to the exact neighborhood in sub-5ms!`,
              keyPoint: 'Vector databases use HNSW graphs to perform approximate nearest neighbor similarity searches in sub-millisecond time.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Vector Databases',
            headers: ['Vector Database', 'Architecture', 'Hosting', 'Best For'],
            rows: [
              ['ChromaDB', 'Embedded SQLite + HNSW engine', 'Local in-process / Docker', 'Fast local development, lightweight RAG pipelines'],
              ['Pinecone', 'Cloud-native serverless vector index', 'Managed Cloud (AWS/GCP)', 'Production enterprise SaaS with zero infrastructure management'],
              ['Qdrant / Milvus', 'High-performance Rust/Go distributed store', 'Self-hosted or Cloud', 'Large-scale on-premise vector search with advanced filtering']
            ]
          },
          coreConcepts: ['Dense semantic vector embeddings', 'HNSW approximate nearest neighbor search', 'Metadata filtering in vector stores'],
          syntax: `# ChromaDB Vector Database Query in Python
import chromadb

client = chromadb.Client()
collection = client.create_collection("engineering_docs")

collection.add(
    documents=["Docker isolation via namespaces", "React Virtual DOM reconciliation"],
    ids=["doc_1", "doc_2"]
)

results = collection.query(query_texts=["How do containers isolate processes?"], n_results=1)`,
          codeExamples: [
            {
              language: 'python',
              code: `import chromadb

# Vector Database Ingestion and Semantic Query Engine
def build_vector_store():
    client = chromadb.EphemeralClient()
    collection = client.get_or_create_collection(name="skills_curriculum")

    # Ingest text chunks with metadata
    collection.add(
        documents=[
            "Docker uses Linux kernel namespaces for process isolation and cgroups for resource constraints.",
            "MongoDB WiredTiger storage engine uses write-ahead logging and document-level locking.",
            "React Fiber reconciliation breaks updates into render and commit phases."
        ],
        metadatas=[
            {"skill": "Docker", "category": "DevOps"},
            {"skill": "MongoDB", "category": "Databases"},
            {"skill": "React", "category": "Frontend"}
        ],
        ids=["d1", "d2", "d3"]
    )

    # Query with semantic search and metadata filter
    results = collection.query(
        query_texts=["How does Docker prevent a container from using 100% of RAM?"],
        where={"category": "DevOps"},
        n_results=1
    )
    return results['documents'][0][0]`,
              explanation: 'Stores documents in ChromaDB and retrieves relevant context via semantic vector similarity.'
            }
          ],
          commonMistakes: ['Chunking text into pieces that are too large (10,000 words), diluting semantic vector precision, or too small (5 words), losing context'],
          bestPractices: ['Chunk text into 300–600 token segments with 10–20% token overlap for optimal RAG retrieval accuracy'],
          summary: `Dense vector embeddings and vector databases power modern semantic search and AI context retrieval engines.`,
          resources: [{ title: 'ChromaDB Getting Started Guide', url: 'https://docs.trychroma.com/', provider: 'ChromaDB.org', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 20 }],
          assessment: {
            questions: [
              {
                id: 'py18_q1',
                question: 'Why do vector databases utilize Approximate Nearest Neighbor (HNSW) indexing instead of exact KNN brute-force search on large datasets?',
                options: [
                  'HNSW traverses multi-layer graphs to find semantically similar vectors in sub-millisecond time without scanning every vector in the database',
                  'HNSW deletes duplicate vectors',
                  'HNSW encrypts embeddings',
                  'Exact search only works with strings'
                ],
                correctIndex: 0,
                topic: 'Vector Search Indexing',
                explanation: 'Exact brute-force search scales linearly O(N), becoming too slow on millions of vectors; HNSW enables sub-millisecond logarithmic search.'
              }
            ]
          },
          practicalTask: {
            title: 'Query a ChromaDB Collection',
            difficulty: 'Intermediate',
            problemStatement: 'Write a function `query_similar_docs(collection, query, top_k)` that calls `collection.query(query_texts=[query], n_results=top_k)` and returns the results.',
            instructions: 'Call collection.query with query_texts and n_results.',
            requirements: ['return collection.query(query_texts=[query], n_results=top_k)'],
            starterCode: `def query_similar_docs(collection, query, top_k=3):\n    # TODO: Query collection\n    pass`,
            solutionCode: `def query_similar_docs(collection, query, top_k=3):\n    return collection.query(query_texts=[query], n_results=top_k)`,
            hints: ['return collection.query(query_texts=[query], n_results=top_k)']
          }
        },
        {
          lessonNumber: 19,
          title: 'Prompt Engineering, Function Calling & Structured JSON Extraction',
          description: 'Master System/User/Assistant prompt hierarchies, Few-Shot prompting, chain-of-thought, tool calling, and Pydantic structured output extraction.',
          estimatedMinutes: 35,
          learningObjectives: [
            'Design production prompts using System prompts, Few-Shot examples, and Chain-of-Thought (CoT)',
            'Enforce guaranteed structured JSON outputs using Pydantic schemas and instructor / OpenAI function calling',
            'Implement Tool/Function calling enabling LLMs to query external databases and APIs'
          ],
          introduction: `Prompt engineering has evolved from conversational text tweaking into structured software engineering. Modern LLM applications use Pydantic schemas to force language models to return valid, type-safe JSON objects, and Function Calling to enable AI agents to execute tools in the real world.`,
          deepDiveSections: [
            {
              title: 'Guaranteed Structured JSON Extraction with Pydantic',
              explanation: `Why regex parsing of LLM outputs fails:
LLMs often prepend commentary like \`"Here is your JSON:"\` or hallucinate extra markdown backticks, crashing standard \`json.loads()\`.
Structured Output Solution:
Pass a Pydantic model into the LLM API (via OpenAI \`response_format: { type: "json_object" }\` or \`instructor\` library). The LLM's token logits are constrained directly by context-free grammar (CFG) decoding, mathematically guaranteeing that output strictly matches the Pydantic schema!`,
              keyPoint: 'Grammar-constrained decoding forces LLMs to generate 100% valid JSON strictly matching Pydantic schemas.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Prompting Techniques',
            headers: ['Technique', 'Mechanism', 'Best Use Case'],
            rows: [
              ['Zero-Shot Prompting', 'Direct instruction without examples', 'Simple classification, summarization'],
              ['Few-Shot Prompting', 'Provides 2–3 input/output examples in prompt', 'Enforcing strict formatting, niche domain terminology'],
              ['Chain-of-Thought (CoT)', '"Think step by step" before answering', 'Mathematical reasoning, code debugging, complex logic'],
              ['Function / Tool Calling', 'Model outputs JSON with tool name and arguments', 'AI Agents querying databases, executing code, calling APIs']
            ]
          },
          coreConcepts: ['System prompt steering', 'Grammar-constrained Pydantic extraction', 'LLM Function/Tool calling protocol'],
          syntax: `from pydantic import BaseModel, Field
from typing import List

class QuizQuestion(BaseModel):
    question: str = Field(description="The multiple choice question text")
    options: List[str] = Field(min_items=4, max_items=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str`,
          codeExamples: [
            {
              language: 'python',
              code: `from pydantic import BaseModel, Field
from typing import List
import json

class SkillCurriculumOutput(BaseModel):
    skill_name: str
    difficulty: str
    key_topics: List[str] = Field(description="List of 3 core concepts")
    estimated_hours: int

# System prompt enforcing role and format
system_prompt = "You are an expert curriculum engineer. Output strictly structured JSON conforming to schema."
user_prompt = "Generate a curriculum outline for Docker Containerization."

# Simulated LLM Structured Output Response
simulated_json = '''
{
  "skill_name": "Docker & Containerization",
  "difficulty": "Intermediate",
  "key_topics": ["Namespaces", "Multi-stage Dockerfiles", "Docker Compose"],
  "estimated_hours": 25
}
'''
curriculum = SkillCurriculumOutput.model_validate_json(simulated_json)
print(f"Validated Skill: {curriculum.skill_name} ({curriculum.estimated_hours}h)")`,
              explanation: 'Validates and casts LLM JSON responses into strongly-typed Pydantic models.'
            }
          ],
          commonMistakes: ['Asking the LLM to return JSON in the user prompt without providing a strict schema or using structured outputs, resulting in unparseable markdown formatting'],
          bestPractices: ['Always use Pydantic models with `response_format` or Function Calling for production API integrations'],
          summary: `Pydantic structured outputs and Function Calling bridge probabilistic language models with deterministic software engineering.`,
          resources: [{ title: 'OpenAI Structured Outputs Guide', url: 'https://platform.openai.com/docs/guides/structured-outputs', provider: 'OpenAI', type: 'Documentation', difficulty: 'Intermediate', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py19_q1',
                question: 'What is the primary benefit of using Pydantic with LLM Structured Outputs compared to manual string regex parsing?',
                options: [
                  'It guarantees that the LLM output is 100% valid, strictly-typed JSON conforming to the defined schema without parsing crashes',
                  'It reduces API costs by 90%',
                  'It trains a new model',
                  'It converts English to Spanish'
                ],
                correctIndex: 0,
                topic: 'Structured LLM Outputs',
                explanation: 'Constrained decoding forces the LLM to adhere to the Pydantic schema, eliminating JSON syntax errors.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a Pydantic Model for Quiz Questions',
            difficulty: 'Beginner',
            problemStatement: 'Write a Pydantic `BaseModel` class `QuestionSchema` with string `question`, list of strings `options`, and integer `correct_index`.',
            instructions: 'Import BaseModel and List from typing.',
            requirements: ['class QuestionSchema(BaseModel):', 'question: str', 'options: List[str]', 'correct_index: int'],
            starterCode: `from pydantic import BaseModel\nfrom typing import List\n\n# TODO: Implement QuestionSchema\n`,
            solutionCode: `from pydantic import BaseModel\nfrom typing import List\n\nclass QuestionSchema(BaseModel):\n    question: str\n    options: List[str]\n    correct_index: int`,
            hints: ['class QuestionSchema(BaseModel): question: str; options: List[str]; correct_index: int']
          }
        }
      ]
    },
    {
      title: 'Phase 7: RAG & AI Application Capstone',
      order: 7,
      lessons: [
        {
          lessonNumber: 20,
          title: 'Building a Complete Retrieval-Augmented Generation (RAG) Pipeline',
          description: 'Construct an end-to-end RAG system: Document chunking, vector embedding, similarity retrieval, prompt augmenting, and hallucination reduction.',
          estimatedMinutes: 40,
          learningObjectives: [
            'Architect the complete RAG lifecycle (Ingestion -> Chunking -> Embedding -> Retrieval -> Generation)',
            'Implement Reciprocal Rank Fusion (RRF) and Hybrid Search (Keyword BM25 + Dense Vectors)',
            'Mitigate LLM Hallucinations by grounding answers with cited source chunk metadata'
          ],
          introduction: `LLMs are limited by their training cutoff dates and lack access to private organizational knowledge. Retrieval-Augmented Generation (RAG) dynamically searches a knowledge base for relevant document chunks and injects them into the prompt context, grounding the LLM in verified facts.`,
          deepDiveSections: [
            {
              title: 'The End-to-End RAG Architecture Pipeline',
              explanation: `How RAG generates hallucination-free answers:
1. Ingestion Phase: Ingests documents (PDFs, Markdown), splits into 500-token chunks with 50-token overlap, generates vector embeddings, and stores in a Vector DB.
2. Retrieval Phase: User asks "What are Linux cgroups?". System embeds query, runs Cosine Similarity search in Vector DB, and retrieves the top 3 matching text chunks.
3. Augmentation Phase: Injects retrieved chunks into the LLM System Prompt:
   \`"Answer the user question using ONLY the following context. If unknown, say 'I don't know'. Context: [Chunks...]"\`
4. Generation Phase: LLM synthesizes a grounded answer citing the exact source chunks.`,
              keyPoint: 'RAG grounds LLMs in verified external facts, eliminating hallucinations and enabling real-time private data search.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Fine-Tuning vs. Retrieval-Augmented Generation (RAG)',
            headers: ['Dimension', 'Model Fine-Tuning', 'RAG (Retrieval-Augmented Generation)'],
            rows: [
              ['Knowledge Updates', 'Requires expensive re-training and GPU hours', 'Instantaneous (Add new document to Vector DB in 10ms)'],
              ['Hallucination Risk', 'Higher (Model can hallucinate memorized facts)', 'Near-Zero (Strictly grounded in provided context)'],
              ['Source Citations', 'Cannot cite exact source paragraphs', 'Provides exact document file and paragraph citations'],
              ['Best For', 'Teaching the model a specific style, tone, or syntax', 'Dynamic knowledge bases, documentation search, private enterprise data']
            ]
          },
          coreConcepts: ['RAG pipeline architecture', 'Hybrid search (BM25 keyword + Dense vector)', 'Context injection and citation formatting'],
          syntax: `# RAG Context Augmentation Prompt Pattern
prompt = f"""Use ONLY the following context to answer the question.
Context:
{retrieved_chunks}

Question: {user_query}
Answer:"""`,
          codeExamples: [
            {
              language: 'python',
              code: `class RAGPipeline:
    def __init__(self, vector_collection, llm_client):
        self.collection = vector_collection
        self.llm = llm_client

    def answer_query(self, user_question):
        # 1. Retrieve top 2 most relevant document chunks
        results = self.collection.query(query_texts=[user_question], n_results=2)
        retrieved_texts = "\\n---\\n".join(results['documents'][0])
        sources = [m['skill'] for m in results['metadatas'][0]]

        # 2. Construct augmented prompt
        system_prompt = "You are ZenScore AI assistant. Answer using ONLY provided context."
        user_prompt = f"Context:\\n{retrieved_texts}\\n\\nQuestion: {user_question}\\nAnswer:"

        # 3. Generate grounded response
        response = self.llm.generate(system=system_prompt, prompt=user_prompt)
        return {
            "answer": response,
            "sources": sources
        }`,
              explanation: 'Complete production RAG pipeline retrieving context and generating grounded answers.'
            }
          ],
          commonMistakes: ['Stuffing 50 chunks into the prompt, triggering the "Lost in the Middle" attention degradation phenomenon'],
          bestPractices: ['Retrieve only the top 3–5 most relevant high-density chunks and re-rank with a Cross-Encoder'],
          summary: `RAG pipelines bridge private knowledge stores with LLM reasoning to deliver accurate, cited AI responses.`,
          resources: [{ title: 'Retrieval Augmented Generation Guide', url: 'https://www.anthropic.com/news/contextual-retrieval', provider: 'Anthropic', type: 'Article', difficulty: 'Advanced', estimatedMinutes: 25 }],
          assessment: {
            questions: [
              {
                id: 'py20_q1',
                question: 'Why is RAG preferred over model fine-tuning when an organization needs an AI assistant to query frequently updating internal company documents?',
                options: [
                  'New documents can be added to the vector database instantly without expensive model retraining, and answers can cite exact source files',
                  'Fine-tuning deletes the model weights',
                  'RAG runs without electricity',
                  'Fine-tuning only works with English'
                ],
                correctIndex: 0,
                topic: 'RAG vs Fine-Tuning',
                explanation: 'RAG updates knowledge dynamically in milliseconds by writing to the vector database, eliminating costly GPU retraining.'
              }
            ]
          },
          practicalTask: {
            title: 'Construct an Augmented RAG Prompt',
            difficulty: 'Beginner',
            problemStatement: 'Write a function `build_rag_prompt(context_text, question)` that returns a formatted prompt string injecting `context_text` under `"Context:\\n"` and `question` under `"\\nQuestion:\\n"`.',
            instructions: 'Format string using f"Context:\\n{context_text}\\nQuestion:\\n{question}\\nAnswer:".',
            requirements: ['return f"Context:\\n{context_text}\\nQuestion:\\n{question}\\nAnswer:"'],
            starterCode: `def build_rag_prompt(context_text, question):\n    # TODO: Return formatted prompt\n    pass`,
            solutionCode: `def build_rag_prompt(context_text, question):\n    return f"Context:\\n{context_text}\\nQuestion:\\n{question}\\nAnswer:"`,
            hints: ['return f"Context:\\n{context_text}\\nQuestion:\\n{question}\\nAnswer:"']
          }
        },
        {
          lessonNumber: 21,
          title: 'Deploying an AI REST API with FastAPI, Streaming & LangChain',
          description: 'Capstone project: Deploy an asynchronous high-throughput AI microservice with FastAPI, Server-Sent Events (SSE) token streaming, and Docker.',
          estimatedMinutes: 45,
          learningObjectives: [
            'Build high-performance asynchronous AI microservices using FastAPI and Pydantic v2',
            'Stream LLM token responses in real-time to web clients using Server-Sent Events (SSE)',
            'Deploy the AI service in a production Docker container with uvicorn workers'
          ],
          introduction: `Congratulations on reaching the final capstone lesson of Python & AI Engineering! In this lesson, we will package our RAG and LLM systems into a high-performance, production-grade FastAPI microservice that streams real-time token responses to client frontends via Server-Sent Events (SSE).`,
          deepDiveSections: [
            {
              title: 'Server-Sent Events (SSE) Streaming vs. WebSocket for AI',
              explanation: `Why SSE is the industry standard for LLM token streaming:
1. Unidirectional Efficiency: LLM chat responses flow from server to client token-by-token. SSE is lightweight HTTP/1.1 or HTTP/2 streaming, requiring no complex WebSocket handshake or socket protocols.
2. Built-in Reconnection: Browsers natively reconnect if the connection drops.
3. Native FastAPI Support: Yield tokens from an \`async generator\` wrapped in \`fastapi.responses.StreamingResponse(..., media_type="text/event-stream")\`.`,
              keyPoint: 'Server-Sent Events (SSE) stream AI tokens to web frontends with standard HTTP simplicity.'
            }
          ],
          comparisonTable: {
            title: 'Comparison: Standard JSON Response vs. SSE Token Streaming',
            headers: ['Dimension', 'Standard Blocking JSON Response', 'Server-Sent Events (SSE) Streaming'],
            rows: [
              ['Time to First Token (TTFT)', '5,000 ms – 15,000 ms (User stares at blank loading spinner)', '150 ms (User sees words appear immediately in real-time)'],
              ['Perceived Latency', 'Sluggish and unresponsive', 'Instantaneous, engaging, and interactive'],
              ['Protocol', 'Standard `application/json`', 'Streaming `text/event-stream`']
            ]
          },
          coreConcepts: ['FastAPI asynchronous route handlers', 'Server-Sent Events (`StreamingResponse`)', 'Production Uvicorn worker clustering'],
          syntax: `from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI(title="ZenScore AI Engine")

async def token_generator():
    for word in ["ZenScore", "AI", "Engine", "is", "Operational."]:
        yield f"data: {word} \\n\\n"
        await asyncio.sleep(0.05)

@app.get("/api/v1/chat/stream")
async def stream_chat():
    return StreamingResponse(token_generator(), media_type="text/event-stream")`,
          codeExamples: [
            {
              language: 'python',
              code: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI(title="ZenScore AI Capstone API", version="1.0.0")

class ChatRequest(BaseModel):
    prompt: str
    skill_context: str = "general"

async def mock_llm_stream(prompt: str):
    tokens = f"Answering your question about '{prompt}': Master Python, NumPy, Vector Databases, and FastAPI for production AI systems.".split()
    for token in tokens:
        yield f"data: {token} \\n\\n"
        await asyncio.sleep(0.04)
    yield "data: [DONE]\\n\\n"

@app.post("/api/v1/ai/generate")
async def generate_ai_response(request: ChatRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    return StreamingResponse(
        mock_llm_stream(request.prompt),
        media_type="text/event-stream"
    )`,
              explanation: 'Complete production FastAPI microservice streaming LLM tokens via SSE.'
            }
          ],
          commonMistakes: ['Buffering all tokens in memory before returning the response, completely defeating the purpose of streaming'],
          bestPractices: ['Always yield formatted `data: <token>\\n\\n` chunks in real-time using `StreamingResponse`'],
          summary: `You have mastered Python & AI Engineering from CPython runtime mechanics to high-performance vectorized NumPy math and production RAG streaming APIs!`,
          resources: [{ title: 'FastAPI Streaming Responses Documentation', url: 'https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse', provider: 'FastAPI', type: 'Documentation', difficulty: 'Advanced', estimatedMinutes: 30 }],
          assessment: {
            questions: [
              {
                id: 'py21_q1',
                question: 'Which HTTP media type header must be set when streaming LLM tokens using Server-Sent Events (SSE) in FastAPI?',
                options: [
                  'text/event-stream',
                  'application/json',
                  'text/html',
                  'application/octet-stream'
                ],
                correctIndex: 0,
                topic: 'Server-Sent Events',
                explanation: '`text/event-stream` informs client browsers to keep the HTTP connection open and parse incoming chunks as live events.'
              }
            ]
          },
          practicalTask: {
            title: 'Define a FastAPI Streaming Route',
            difficulty: 'Intermediate',
            problemStatement: 'Write a FastAPI route `@app.get("/stream")` that returns a `StreamingResponse(async_gen(), media_type="text/event-stream")`.',
            instructions: 'Use @app.get("/stream") and return StreamingResponse(async_gen(), media_type="text/event-stream").',
            requirements: ['@app.get("/stream")', 'return StreamingResponse(async_gen(), media_type="text/event-stream")'],
            starterCode: `from fastapi import FastAPI\nfrom fastapi.responses import StreamingResponse\n\napp = FastAPI()\n\n# TODO: Implement stream endpoint\n`,
            solutionCode: `from fastapi import FastAPI\nfrom fastapi.responses import StreamingResponse\n\napp = FastAPI()\n\n@app.get('/stream')\nasync def stream_endpoint():\n    return StreamingResponse(async_gen(), media_type='text/event-stream')`,
            hints: ['@app.get("/stream") async def stream_endpoint(): return StreamingResponse(async_gen(), media_type="text/event-stream")']
          }
        }
      ]
    }
  ]
}

module.exports = { pythonCurriculum }
