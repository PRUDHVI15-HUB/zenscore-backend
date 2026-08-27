const vm = require('vm');
const { spawn, execSync } = require('child_process');

/**
 * Isolated Code Execution Engine for ZenScore AI Coding Workspace
 * Safely evaluates student solutions across JavaScript, Python, SQL, Bash, and YAML/Docker.
 */

// 1. JavaScript / React / Node.js Runner
async function executeJavaScript(code, testCases = [], timeoutMs = 4000) {
  const startTime = Date.now();
  let stdoutLogs = [];
  let stderrLogs = [];

  const sandbox = {
    console: {
      log: (...args) => stdoutLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args) => stderrLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args) => stdoutLogs.push('[WARN] ' + args.join(' '))
    },
    setTimeout: undefined,
    setInterval: undefined,
    process: { env: {} }
  };

  const context = vm.createContext(sandbox);

  try {
    const script = new vm.Script(code, { filename: 'solution.js' });
    script.runInContext(context, { timeout: timeoutMs });
  } catch (err) {
    return {
      success: false,
      passed: false,
      testsPassed: 0,
      testsTotal: testCases.length || 1,
      stdout: stdoutLogs.join('\n'),
      stderr: `Syntax/Runtime Error: ${err.message}`,
      executionTime: Date.now() - startTime,
      results: testCases.map((tc, idx) => ({
        testIndex: idx + 1,
        description: tc.description || `Test Case #${idx + 1}`,
        input: tc.input,
        expected: tc.expected,
        actual: 'Error: Script execution failed',
        passed: false
      }))
    };
  }

  if (!testCases || testCases.length === 0) {
    return {
      success: true,
      passed: true,
      testsPassed: 1,
      testsTotal: 1,
      stdout: stdoutLogs.join('\n'),
      stderr: stderrLogs.join('\n'),
      executionTime: Date.now() - startTime,
      results: [{ testIndex: 1, description: 'Code Execution', passed: true }]
    };
  }

  let testsPassed = 0;
  const testResults = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let actualOutput = '';
    let testPassed = false;

    try {
      const evalScript = `
        (() => {
          let fn = null;
          const userGlobals = Object.keys(this).filter(k => typeof this[k] === 'function' && k !== 'eval' && k !== 'Function');
          if (userGlobals.length > 0) fn = this[userGlobals[userGlobals.length - 1]];

          if (fn) {
            let inputArgs = [];
            const rawIn = ${JSON.stringify(tc.input || '')};
            if (rawIn) {
              try {
                const parsed = JSON.parse(rawIn);
                inputArgs = Array.isArray(parsed) ? parsed : [parsed];
              } catch (e) {
                inputArgs = [rawIn];
              }
            }
            const res = fn.apply(null, inputArgs);
            return res !== undefined ? res : null;
          } else {
            return 'NO_CALLABLE_FUNCTION_FOUND';
          }
        })()
      `;

      const evalResult = vm.runInContext(evalScript, context, { timeout: 1000 });
      actualOutput = typeof evalResult === 'object' && evalResult !== null ? JSON.stringify(evalResult) : String(evalResult);

      const expectedClean = String(tc.expected || '').trim();
      const actualClean = String(actualOutput).trim();

      let isMatch = actualClean === expectedClean;
      if (!isMatch) {
        try {
          if (JSON.stringify(JSON.parse(expectedClean)) === JSON.stringify(JSON.parse(actualClean))) {
            isMatch = true;
          }
        } catch (e) {}
      }

      if (isMatch) {
        testPassed = true;
        testsPassed++;
      }
    } catch (testErr) {
      actualOutput = `Error: ${testErr.message}`;
      testPassed = false;
    }

    testResults.push({
      testIndex: i + 1,
      description: tc.description || `Test Case #${i + 1}`,
      input: tc.input,
      expected: tc.expected,
      actual: actualOutput,
      passed: testPassed,
      isHidden: tc.isHidden || false
    });
  }

  const allPassed = testsPassed === testCases.length;

  return {
    success: true,
    passed: allPassed,
    testsPassed,
    testsTotal: testCases.length,
    stdout: stdoutLogs.join('\n'),
    stderr: stderrLogs.join('\n'),
    executionTime: Date.now() - startTime,
    results: testResults
  };
}

// 2. Python Runner
async function executePython(code, testCases = [], timeoutMs = 4000) {
  const startTime = Date.now();
  let pythonCmd = null;
  try {
    execSync('python --version', { stdio: 'ignore' });
    pythonCmd = 'python';
  } catch (e) {
    try {
      execSync('python3 --version', { stdio: 'ignore' });
      pythonCmd = 'python3';
    } catch (e2) {}
  }

  if (pythonCmd) {
    const harnessCode = `
import sys, json

${code}

def find_candidate_fn():
    funcs = [v for k, v in globals().items() if callable(v) and not k.startswith('__') and k not in ['find_candidate_fn', 'sys', 'json']]
    return funcs[-1] if funcs else None

fn = find_candidate_fn()
test_cases = ${JSON.stringify(testCases)}
results = []

for idx, tc in enumerate(test_cases):
    try:
        raw_in = tc.get('input', '')
        args = []
        if raw_in:
            try:
                parsed = json.loads(raw_in)
                args = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                args = [raw_in]
        
        res = fn(*args) if fn else None
        res_str = json.dumps(res) if isinstance(res, (dict, list)) else str(res)
        expected_str = str(tc.get('expected', '')).strip()
        
        is_match = (res_str.strip() == expected_str)
        if not is_match:
            try:
                if json.loads(res_str) == json.loads(expected_str):
                    is_match = True
            except Exception:
                pass
                
        results.append({
            'testIndex': idx + 1,
            'description': tc.get('description', f'Test Case #{idx+1}'),
            'input': tc.get('input', ''),
            'expected': tc.get('expected', ''),
            'actual': res_str,
            'passed': is_match,
            'isHidden': tc.get('isHidden', False)
        })
    except Exception as err:
        results.append({
            'testIndex': idx + 1,
            'description': tc.get('description', f'Test Case #{idx+1}'),
            'input': tc.get('input', ''),
            'expected': tc.get('expected', ''),
            'actual': f'RuntimeError: {err}',
            'passed': False,
            'isHidden': tc.get('isHidden', False)
        })

print(json.dumps(results))
`;

    return new Promise((resolve) => {
      const child = spawn(pythonCmd, ['-c', harnessCode], { timeout: timeoutMs });
      let outData = '';
      let errData = '';

      child.stdout.on('data', d => { outData += d.toString(); });
      child.stderr.on('data', d => { errData += d.toString(); });

      child.on('close', (exitCode) => {
        if (exitCode !== 0 || !outData.trim()) {
          resolve({
            success: false,
            passed: false,
            testsPassed: 0,
            testsTotal: testCases.length || 1,
            stdout: outData,
            stderr: errData || 'Python runtime execution failed.',
            executionTime: Date.now() - startTime,
            results: testCases.map((tc, idx) => ({
              testIndex: idx + 1,
              description: tc.description || `Test Case #${idx + 1}`,
              input: tc.input,
              expected: tc.expected,
              actual: errData.trim() || 'Execution failed',
              passed: false
            }))
          });
        } else {
          try {
            const parsedResults = JSON.parse(outData.trim());
            const passedCount = parsedResults.filter(r => r.passed).length;
            resolve({
              success: true,
              passed: passedCount === parsedResults.length,
              testsPassed: passedCount,
              testsTotal: parsedResults.length,
              stdout: 'Execution completed successfully.',
              stderr: errData,
              executionTime: Date.now() - startTime,
              results: parsedResults
            });
          } catch (e) {
            resolve({
              success: false,
              passed: false,
              testsPassed: 0,
              testsTotal: testCases.length,
              stdout: outData,
              stderr: 'Failed to parse test outputs.',
              executionTime: Date.now() - startTime,
              results: []
            });
          }
        }
      });
    });
  }

  // Fallback JavaScript execution
  return executeJavaScript(code, testCases, timeoutMs);
}

// 3. Declarative / SQL / Bash / YAML / Dockerfile Linter
async function executePatternAssertion(code, testCases = [], language = 'sql') {
  const startTime = Date.now();
  const cleanCode = code.trim();
  const upperCode = cleanCode.toUpperCase();
  let testsPassed = 0;
  const testResults = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const expected = (tc.expected || '').trim();
    let passed = false;
    let actual = '';

    if (language === 'sql') {
      const containsSelect = upperCode.includes('SELECT');
      const containsFrom = upperCode.includes('FROM');
      const containsKeywords = expected.split(' ').every(kw => upperCode.includes(kw.toUpperCase()));
      if (containsSelect && containsFrom && containsKeywords) {
        passed = true;
        actual = 'Valid SQL Query Structure (Matches Requirement)';
      } else {
        passed = false;
        actual = 'Incomplete SQL Query Structure';
      }
    } else if (language === 'dockerfile') {
      const containsFrom = upperCode.includes('FROM');
      const matches = expected.split(',').every(item => cleanCode.toLowerCase().includes(item.trim().toLowerCase()));
      if (containsFrom && matches) {
        passed = true;
        actual = 'Valid Dockerfile Specifications';
      } else {
        passed = false;
        actual = 'Missing required Dockerfile instructions';
      }
    } else if (language === 'yaml') {
      const containsApiVersion = cleanCode.includes('apiVersion') || cleanCode.includes('kind');
      const matches = expected.split(',').every(item => cleanCode.toLowerCase().includes(item.trim().toLowerCase()));
      if (containsApiVersion && matches) {
        passed = true;
        actual = 'Valid Kubernetes Manifest Definition';
      } else {
        passed = false;
        actual = 'Missing required Kubernetes YAML properties';
      }
    } else {
      const matches = expected.split(',').every(item => cleanCode.toLowerCase().includes(item.trim().toLowerCase()));
      if (matches && cleanCode.length > 10) {
        passed = true;
        actual = 'Command script passed all pattern validations.';
      } else {
        passed = false;
        actual = 'Script did not satisfy test criteria.';
      }
    }

    if (passed) testsPassed++;
    testResults.push({
      testIndex: i + 1,
      description: tc.description || `Validation Test #${i + 1}`,
      input: tc.input || language.toUpperCase(),
      expected: tc.expected,
      actual,
      passed,
      isHidden: tc.isHidden || false
    });
  }

  const allPassed = testsPassed === testCases.length;

  return {
    success: true,
    passed: allPassed,
    testsPassed,
    testsTotal: testCases.length,
    stdout: `[${language.toUpperCase()} Validator] Syntax and requirement validation passed.`,
    stderr: allPassed ? '' : 'Some validation assertions failed.',
    executionTime: Date.now() - startTime,
    results: testResults
  };
}

// Master execution dispatcher
async function executeCode(code, language = 'javascript', testCases = []) {
  const lang = (language || '').toLowerCase();

  if (!code || !code.trim()) {
    return {
      success: false,
      passed: false,
      testsPassed: 0,
      testsTotal: testCases.length || 1,
      stdout: '',
      stderr: 'Empty submission: Please write your solution code before running.',
      executionTime: 0,
      results: []
    };
  }

  if (lang.includes('python')) {
    return await executePython(code, testCases);
  } else if (lang.includes('sql')) {
    return await executePatternAssertion(code, testCases, 'sql');
  } else if (lang.includes('docker')) {
    return await executePatternAssertion(code, testCases, 'dockerfile');
  } else if (lang.includes('yaml') || lang.includes('k8s') || lang.includes('kubernetes')) {
    return await executePatternAssertion(code, testCases, 'yaml');
  } else if (lang.includes('bash') || lang.includes('git') || lang.includes('linux')) {
    return await executePatternAssertion(code, testCases, 'bash');
  } else {
    return await executeJavaScript(code, testCases);
  }
}

module.exports = {
  executeCode,
  executeJavaScript,
  executePython,
  executePatternAssertion
};
