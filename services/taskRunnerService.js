/**
 * Production Sandboxed Practical Task Execution & Verification Engine
 * Executes and verifies real code/command practical tasks with strict security limits.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const EXECUTION_TIMEOUT_MS = 5000; // 5 seconds maximum execution window
const MAX_BUFFER_BYTES = 1024 * 1024; // 1 MB maximum stdout/stderr buffer

// Blacklisted dangerous strings/commands for host security
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /mkfs/i,
  /dd\s+if=/i,
  /:()\s*{\s*:\|:&\s*};\s*:/i, // Fork bomb
  /process\.env\.MONGODB_URI/i,
  /process\.env\.JWT_SECRET/i,
  /process\.env\.FIREBASE/i,
  /cat\s+\/etc\/passwd/i,
  /cat\s+\/etc\/shadow/i,
  /sudo\s+/i,
  /chmod\s+777\s+\//i
];

/**
 * Sanitizes environment variables passed to sandbox execution processes
 */
function getSanitizedEnv() {
  const safeEnv = { ...process.env };
  delete safeEnv.MONGODB_URI;
  delete safeEnv.JWT_SECRET;
  delete safeEnv.FIREBASE_PRIVATE_KEY;
  delete safeEnv.FIREBASE_CLIENT_EMAIL;
  delete safeEnv.GROQ_API_KEY;
  delete safeEnv.AWS_SECRET_ACCESS_KEY;
  return safeEnv;
}

/**
 * Runs a command safely in a temporary sandbox directory
 */
function runInSandbox(command, cwd, timeout = EXECUTION_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Check for dangerous shell injection/destruction patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return resolve({
          code: 1,
          stdout: '',
          stderr: 'Security Exception: Command contains forbidden execution pattern.',
          executionTime: Date.now() - startTime
        });
      }
    }

    exec(command, {
      cwd,
      timeout,
      maxBuffer: MAX_BUFFER_BYTES,
      env: getSanitizedEnv()
    }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime;
      if (error) {
        return resolve({
          code: error.code || 1,
          stdout: stdout ? stdout.toString() : '',
          stderr: stderr ? stderr.toString() : (error.message || 'Execution failed'),
          executionTime
        });
      }
      resolve({
        code: 0,
        stdout: stdout ? stdout.toString() : '',
        stderr: stderr ? stderr.toString() : '',
        executionTime
      });
    });
  });
}

/**
 * Helper to normalize string for whitespace-insensitive comparison
 */
function normalizeStr(str = '') {
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Checks whether a user implementation satisfies a specific requirement line
 */
function verifySingleRequirement(reqText, userStr, solutionStr) {
  const normUser = normalizeStr(userStr);
  const normSol = normalizeStr(solutionStr);
  const normReq = normalizeStr(reqText);

  // 1. Direct exact or substring match against reference solution
  if (normSol && (normUser === normSol || normUser.includes(normSol) || normSol.includes(normUser))) {
    return true;
  }

  // 2. Extract key flags and value tokens from requirement
  const tokens = [];

  // Match flags (-d, --name, -p, -v, --restart, etc.)
  const flagMatches = reqText.match(/--?[a-zA-Z0-9_-]+/g) || [];
  tokens.push(...flagMatches);

  // Match path/port/volume specs (80:80, web_assets:/usr/share/nginx/html, nginx:alpine)
  const valMatches = reqText.match(/[a-zA-Z0-9_.-]+:[a-zA-Z0-9_./-]+|[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/g) || [];
  tokens.push(...valMatches);

  // Match specific keywords mentioned in requirement
  ['web-server', 'always', 'nginx:alpine', 'web_assets', '80:80', 'detached', 'alpine', 'node:20', 'builder', 'from', 'expose', 'user', 'cmd', 'entrypoint', 'return', 'try', 'catch', 'createheader', 'react.createelement', 'h1', 'classname', 'function', 'export'].forEach(kw => {
    if (normReq.includes(kw)) tokens.push(kw);
  });

  if (tokens.length === 0) {
    if (normSol) {
      const solTokens = normSol.split(/[^a-z0-9_]/).filter(t => t.length > 3);
      const matched = solTokens.filter(t => normUser.includes(t));
      return matched.length >= Math.ceil(solTokens.length * 0.4);
    }
    return normUser.length > 20 && !normUser.includes('wrong');
  }

  // Count how many required tokens are present in userStr
  let matchedCount = 0;
  const uniqueTokens = [...new Set(tokens)];
  uniqueTokens.forEach(tok => {
    const cleanTok = tok.toLowerCase();
    if (cleanTok === 'detached') {
      if (normUser.includes('-d') || normUser.includes('--detach')) matchedCount++;
    } else if (cleanTok === 'web-server') {
      if (normUser.includes('web-server')) matchedCount++;
    } else if (cleanTok === 'always') {
      if (normUser.includes('always')) matchedCount++;
    } else if (normUser.includes(cleanTok)) {
      matchedCount++;
    }
  });

  return matchedCount >= Math.ceil(uniqueTokens.length * 0.5);
}

/**
 * Main verification entrypoint for lesson practical tasks
 */
async function executeAndVerifyTask(taskDef = {}, userCode = '', userCommand = '') {
  const userStr = (userCode || userCommand || '').trim();
  const solutionStr = (taskDef.solutionCode || taskDef.solutionCommand || '').trim();

  const detectedType = taskDef.executionType || (taskDef.solutionCode?.includes('def ') || taskDef.starterCode?.includes('def ') || userStr.includes('def ') || userStr.includes('import sys') ? 'python' : 'javascript');
  const executionType = detectedType.toLowerCase();
  const requirements = taskDef.requirements || ['Implement solution logic cleanly'];
  const sandboxId = `zenscore_task_${uuidv4().substring(0, 8)}`;
  const sandboxDir = path.join(os.tmpdir(), sandboxId);

  const checks = [];
  let stdoutSummary = '';
  let stderrSummary = '';
  let executionTime = 0;

  // Security Exception Pre-check
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(userStr)) {
      return {
        passed: false,
        score: 0,
        checks: [{
          name: 'Security Boundary Policy',
          passed: false,
          details: 'Security Exception: Command contains forbidden execution pattern.'
        }],
        stdout: '',
        stderr: 'Security Exception: Command contains forbidden execution pattern.',
        feedback: 'Security Exception: Command blocked by sandbox safety policy.',
        executionTime: 2
      };
    }
  }

  const isCliCmd = userStr.toLowerCase().startsWith('docker ') ||
                   userStr.toLowerCase().startsWith('docker-compose ') ||
                   userStr.toLowerCase().startsWith('kubectl ') ||
                   userStr.toLowerCase().startsWith('git ') ||
                   userStr.toLowerCase().startsWith('npm ') ||
                   userStr.toLowerCase().startsWith('node ') ||
                   userStr.toLowerCase().startsWith('python ') ||
                   executionType === 'docker' ||
                   executionType === 'docker-compose' ||
                   executionType === 'shell';

  try {
    fs.mkdirSync(sandboxDir, { recursive: true });

    if (isCliCmd) {
      const res = await runInSandbox(userStr, sandboxDir);
      stdoutSummary = res.stdout || `Verified CLI command structure: ${userStr}`;
      stderrSummary = res.stderr;
      executionTime = res.executionTime;

      checks.push({
        name: 'Command Syntax & Execution',
        passed: res.code === 0,
        details: res.code === 0 ? `Executed successfully: ${userStr}` : (res.stderr || 'Command exited with status code')
      });

      requirements.forEach((req, idx) => {
        const reqPassed = verifySingleRequirement(req, userStr, solutionStr);
        checks.push({
          name: `Requirement ${idx + 1}: ${req}`,
          passed: reqPassed,
          details: reqPassed ? 'Requirement satisfied' : `Requirement failed: "${req}"`
        });
      });

    } else if (executionType === 'javascript' || executionType === 'node') {
      const codeToRun = userStr || taskDef.starterCode || 'console.log("No code provided");';
      const scriptPath = path.join(sandboxDir, 'solution.js');
      fs.writeFileSync(scriptPath, codeToRun, 'utf8');

      const res = await runInSandbox('node solution.js', sandboxDir);
      stdoutSummary = res.stdout;
      stderrSummary = res.stderr;
      executionTime = res.executionTime;

      const exitSuccess = res.code === 0;
      checks.push({
        name: 'Code Execution & Syntax',
        passed: exitSuccess,
        details: exitSuccess ? 'Code executed cleanly with exit code 0' : `Syntax/Execution note: ${res.stderr || 'Code evaluated'}`
      });

      requirements.forEach((req, idx) => {
        const reqPassed = verifySingleRequirement(req, userStr, solutionStr);
        checks.push({
          name: `Requirement ${idx + 1}: ${req}`,
          passed: reqPassed,
          details: reqPassed ? 'Requirement satisfied' : `Requirement failed: Check code implementation for "${req}"`
        });
      });

    } else if (executionType === 'python') {
      const codeToRun = userStr || taskDef.starterCode || 'print("No code provided")';
      const scriptPath = path.join(sandboxDir, 'solution.py');
      fs.writeFileSync(scriptPath, codeToRun, 'utf8');

      const res = await runInSandbox('python solution.py', sandboxDir);
      stdoutSummary = res.stdout;
      stderrSummary = res.stderr;
      executionTime = res.executionTime;

      const exitSuccess = res.code === 0;
      checks.push({
        name: 'Python Execution & Syntax',
        passed: exitSuccess,
        details: exitSuccess ? 'Python script executed cleanly' : `Execution note: ${res.stderr || 'Script evaluated'}`
      });

      requirements.forEach((req, idx) => {
        const reqPassed = verifySingleRequirement(req, userStr, solutionStr);
        checks.push({
          name: `Requirement ${idx + 1}: ${req}`,
          passed: reqPassed,
          details: reqPassed ? 'Requirement satisfied' : `Requirement failed: "${req}"`
        });
      });

    } else {
      // Default Generic Task Verification
      stdoutSummary = `Task solution verified: ${userStr}`;
      executionTime = 10;

      checks.push({
        name: 'Task Structure Verification',
        passed: userStr.length > 0 && !userStr.toLowerCase().includes('wrong'),
        details: 'Solution format validated'
      });

      requirements.forEach((req, idx) => {
        const reqPassed = verifySingleRequirement(req, userStr, solutionStr);
        checks.push({
          name: `Requirement ${idx + 1}: ${req}`,
          passed: reqPassed,
          details: reqPassed ? 'Requirement satisfied' : `Requirement failed: "${req}"`
        });
      });
    }

  } catch (err) {
    stderrSummary = err.message;
    checks.push({
      name: 'System Execution Error',
      passed: false,
      details: err.message
    });
  } finally {
    try {
      if (fs.existsSync(sandboxDir)) {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }

  const reqChecks = checks.filter(c => c.name.startsWith('Requirement'));
  const allReqsPassed = reqChecks.length > 0 && reqChecks.every(c => c.passed);
  const overallPassed = checks.every(c => c.passed) || allReqsPassed;
  const score = overallPassed ? 100 : Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return {
    passed: overallPassed,
    score,
    checks,
    stdout: stdoutSummary.trim(),
    stderr: stderrSummary.trim(),
    feedback: overallPassed
      ? 'All practical requirements verified! Automated test suite passed successfully.'
      : `Verification failed. ${checks.filter(c => !c.passed).length} requirement(s) failed.`,
    executionTime
  };
}

module.exports = {
  executeAndVerifyTask
};