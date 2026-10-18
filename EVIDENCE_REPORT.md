# ZenScore AI — Conference Rebuttal Empirical Evidence Report

**Generated Date:** October 16, 2026  
**Document Classification:** Rebuttal & Implementation Evidence  
**Author:** ZenScore AI Engineering Team  
**Evaluation Standard:** Strictly Empirical (No Simulated, Fake, or Imputed Data)

---

## Executive Summary

In response to the conference paper reviewer's critique, this report provides formal mathematical bounds, algorithmic extensions, evaluation harnesses, automated test suites, user-study tooling, and publication-ready assets for ZenScore AI.

Every numeric metric reported below was directly produced from an executed script against real database records or deterministic rule engines. Where data is insufficient to compute an empirical sample metric without synthetic fabrication, it is explicitly classified as **NOT MEASURED** with the operational justification.

| Task | Component | Metric Status | Primary Finding / Value |
| :--- | :--- | :--- | :--- |
| **Task 1** | Subject Risk Engine | **MEASURED** | Formulas bounded to $[0, 100]$. Old code was **NOT bounded** ($R_c$ reached 150 for 9 credits). 21/21 unit & property tests passed. |
| **Task 2** | Graduation CGPA Projection | **MEASURED** | Scenario projections (low/expected/high) implemented using student SGPA standard deviation. 14/14 unit tests passed. |
| **Task 3** | Prediction Confidence & Backtest | **NOT MEASURED** | Insufficient history ($n=1$ student with $\ge 3$ semesters; $n=3$ total walk-forward predictions). Thresholds centralized: low=1, medium=2, high=4. |
| **Task 4** | Ingestion Evaluation Harness | **PRELIMINARY (n = 12)** | Real 14-stage empirical evaluation on 12 verified mark sheets across 2 universities. See Section 11. |
| **Task 5** | Automated Test Suite & Coverage | **MEASURED** | 12/12 test suites passed, 78/78 tests passed. Rule engine coverage: 93.37% statements, 95.38% lines. Groq guardrails verified. |
| **Task 6** | SUS & Likert User Study Tooling | **NOT MEASURED** | Tooling and API completed. Production response count $n=0$ ($<5$ threshold). Script outputs `NOT ENOUGH RESPONSES`. |
| **Task 7** | Paper Publication Assets | **MEASURED** | 4 high-resolution cropped PNGs generated via Playwright ($1440 \times 900$, 2x DPR) with demo account in `paper_assets/`. |

---

## 1. System & Environment Inventory

All runs and measurements were conducted in the following real software environment:

| Tool / Library | Version | Role in Architecture |
| :--- | :--- | :--- |
| **Node.js** | `v24.14.0` | Backend runtime & evaluation script execution engine |
| **npm** | `11.19.1` | Package management |
| **Express.js** | `^4.18.2` | REST API framework (`zenscore-backend`) |
| **Mongoose** | `^8.23.0` | Object Data Modeling (MongoDB Atlas Cluster) |
| **Jest** | `^30.5.2` | Unit and integration test runner |
| **Supertest** | `^7.3.1` | HTTP integration test harness |
| **Playwright** | `^1.64.1` | Browser automation & retina screenshot capture (Chromium v1248) |
| **Tesseract.js** | `^7.0.0` | OCR character and text recognition pipeline |
| **Groq SDK** | `^0.37.0` | LLM client (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`) |
| **React** | `^18.2.0` | Frontend user interface framework (`zenscore-ai`) |
| **Vite** | `^5.1.0` (v5.4.21) | Frontend build tool and development server |
| **Firebase Admin / Client** | `^12.0.0` / `^10.14.1` | Identity verification & session tokens |

---

## 2. Task 1 — Bounded Subject Risk Formulas

### 2.1 File Changes
- `zenscore-backend/services/intelligence/engines/riskEngine.js`
- `zenscore-backend/services/intelligence/engines/recommendationEngine.js`
- `zenscore-backend/tests/unit/riskEngine.test.js`

### 2.2 Mathematical Definition
The subject risk formula combines attendance, grade, and credit load:
$$\text{Risk} = 0.40 R_a + 0.40 R_g + 0.20 R_c$$

The components are defined as:
- **Attendance Risk ($R_a$):**
  $$R_a = \begin{cases} 100 & \text{if } a < 75 \\ 100 \times \frac{85 - a}{10} & \text{if } 75 \le a \le 85 \\ 0 & \text{if } a > 85 \end{cases}$$
- **Grade Risk ($R_g$):**
  $$R_g = \begin{cases} 100 & \text{if } g < 6.0 \\ 100 \times \frac{8.5 - g}{2.5} & \text{if } 6.0 \le g < 8.5 \\ 0 & \text{if } g \ge 8.5 \end{cases}$$
- **Credit Risk ($R_c$):**
  $$R_c = \min\left(100, 100 \times \frac{\text{credits}}{6}\right)$$
- **Clamping:**
  $$\text{Risk}_{\text{final}} = \min(100, \max(0, \text{Risk}))$$

### 2.3 Bounding Analysis: Old vs. New Code

```diff
--- Old Risk Engine Implementation
+++ New Bounded Risk Engine Implementation
- const attendanceRisk = attendance < 75 ? 100 : Math.max(0, (85 - attendance) * 10)
- const gradeRisk = grade < 6.0 ? 100 : Math.max(0, (8.5 - grade) * 20)
- const creditRisk = (credits / 6) * 100
- const rawScore = 0.40 * attendanceRisk + 0.40 * gradeRisk + 0.20 * creditRisk
- return Math.round(rawScore)

+ const computeAttendanceRisk = (attendance) => {
+   if (attendance == null || isNaN(attendance)) return 0
+   const a = Number(attendance)
+   if (a < 75) return 100
+   if (a <= 85) return Math.min(100, Math.max(0, 100 * (85 - a) / 10))
+   return 0
+ }
+
+ const computeGradeRisk = (finalGrade) => {
+   if (finalGrade == null || isNaN(finalGrade)) return 0
+   const g = Number(finalGrade)
+   if (g < 6.0) return 100
+   if (g < 8.5) return Math.min(100, Math.max(0, 100 * (8.5 - g) / 2.5))
+   return 0
+ }
+
+ const computeCreditRisk = (credits) => {
+   if (credits == null || isNaN(credits) || Number(credits) <= 0) return 0
+   return Math.min(100, Math.max(0, 100 * Number(credits) / 6))
+ }
+
+ const rawScore = (0.40 * Ra) + (0.40 * Rg) + (0.20 * Rc)
+ const boundedScore = Math.min(100, Math.max(0, rawScore))
```

#### Reviewer Finding: Was the old code already bounded?
**NO. The old code was NOT bounded.**
1. **Unbounded Credits:** The previous formula was `creditRisk = (credits / 6) * 100`. In real university curricula (e.g. capstone projects, comprehensive vivas, or industrial internships), course modules frequently carry 8, 9, or 12 credits. For a 9-credit project, the old code yielded $R_c = (9/6) \times 100 = 150$, violating the $[0, 100]$ component bound.
2. **Incorrect Slope:** For grade risk, the old code used $(8.5 - g) \times 20$. At $g = 6.0$, it produced $(8.5 - 6.0) \times 20 = 50$, instead of the specified $100$ risk ceiling at the 6.0 threshold.
3. **Missing Clamping:** The final sum lacked an outer clamping function, allowing total risk to exceed 100 (e.g., reaching 110+ on high-credit subjects).

### 2.4 Test Verification
Command executed: `npx jest tests/unit/riskEngine.test.js`
- $g = 6.0 \implies R_g = 100$ (**Passed**)
- $g = 8.5 \implies R_g = 0$ (**Passed**)
- $\text{credits} = 9 \implies R_c = 100$ (**Passed**)
- $a = 75 \implies R_a = 100$ (**Passed**)
- $a = 85 \implies R_a = 0$ (**Passed**)
- Property test grid ($11 \times 11 \times 11 = 1,331$ parameter combinations): $0 \le \text{Risk} \le 100$ (**Passed**)

---

## 3. Task 2 — Graduation CGPA Scenario Projection

### 3.1 File Changes
- `zenscore-backend/services/intelligence/engines/predictionEngine.js`
- `zenscore-backend/constants/academicConstants.js`
- `zenscore-backend/tests/unit/predictionEngine.test.js`
- `zenscore-ai/src/constants/academicConstants.js`
- `zenscore-ai/src/components/academics/AcademicAnalytics.jsx`
- `zenscore-ai/src/pages/academics/Performance.jsx`

### 3.2 Methodology
The baseline graduation projection remains:
$$\text{CGPA}_{\text{pred}} = \frac{C_{\text{cur}} \cdot E_{\text{comp}} + \text{SGPA}_{\text{next}} \cdot E_{\text{rem}}}{160}$$

To account for historical volatility, a 3-scenario projection is calculated using the sample standard deviation ($s$) of past SGPAs:
$$s = \sqrt{\frac{1}{n-1} \sum_{i=1}^n (\text{SGPA}_i - \overline{\text{SGPA}})^2}$$
- $\text{SGPA}_{\text{expected}} = \text{SGPA}_{\text{next}}$ (baseline velocity model)
- $\text{SGPA}_{\text{low}} = \max(0.0, \min(10.0, \text{SGPA}_{\text{next}} - s))$
- $\text{SGPA}_{\text{high}} = \max(0.0, \min(10.0, \text{SGPA}_{\text{next}} + s))$

For remaining semesters:
$$\text{CGPA}_{\text{scenario}} = \min\left(10.0, \max\left(0.0, \frac{C_{\text{cur}} \cdot E_{\text{comp}} + \text{SGPA}_{\text{scenario}} \cdot E_{\text{rem}}}{160}\right)\right)$$

**Edge Cases Handled:**
1. **$n < 2$ Semesters:** Returns the baseline value for all scenarios, flags `"insufficient history"`, sets `hasHistory: false`, and provides a guidance prompt.
2. **$E_{\text{rem}} = 0$ (Degree Completed):** Returns current CGPA for all scenarios.
3. **Clamping:** Both SGPA and final projected CGPA are strictly clamped to $[0.0, 10.0]$.

### 3.3 Test Verification
Command executed: `npx jest tests/unit/predictionEngine.test.js` (14/14 tests passed).

---

## 4. Task 3 — Prediction Confidence Thresholds & Walk-Forward Backtest

### 4.1 Centralized Thresholds
Located in `constants/academicConstants.js`:
```javascript
const CONFIDENCE_THRESHOLDS = {
  low: 1,      // 1 data-rich semester: single snapshot, Low confidence
  medium: 2,   // 2-3 data-rich semesters: velocity trend model, Medium confidence
  high: 4,     // >= 4 data-rich semesters: longitudinal multi-semester regression, High confidence
  details: {
    low: { label: 'Low', minSemesters: 1, maxSemesters: 1 },
    medium: { label: 'Medium', minSemesters: 2, maxSemesters: 3 },
    high: { label: 'High', minSemesters: 4, maxSemesters: 8 }
  }
}
```

### 4.2 Walk-Forward Backtest Execution
**Command executed:** `node scripts/backtest_prediction.js`  
**Execution Timestamp:** 2026-10-15T18:18:23Z  
**Database Evaluated:** MongoDB Atlas production cluster (`ac-xhkc71i-shard-00-00.9dyvigf.mongodb.net`)  
**Results Saved:** `results/backtest_prediction.csv` and `results/backtest_prediction.md`

#### Backtest Metric Table

| Confidence Level | Required History ($k$) | Eligible Students ($n$) | Evaluated Predictions ($n_{\text{preds}}$) | MAE | RMSE | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Low** | 1 sem | 0 | 0 | NOT MEASURED | NOT MEASURED | Insufficient sample |
| **Medium** | 2–3 sem | 1 | 2 | 1.1100 | 1.1270 | NOT MEASURED ($n < 5$) |
| **High** | $\ge 4$ sem | 1 | 1 | 0.4000 | 0.4000 | NOT MEASURED ($n < 5$) |
| **Overall** | $\ge 3$ sem | **1** | **3** | **0.8733** | **0.9422** | **NOT MEASURED** |

**Metric Classification:** **NOT MEASURED**  
**Justification:** The live production database currently contains 17 user records, 7 academic records, and only **1 student** with $\ge 3$ semesters of academic history (Student `6a869cb032ae3175536eac65`, with 5 semesters). A sample size of $n = 1$ is statistically underpowered. Adhering strictly to the paper guideline (*"If there is not enough real data, the report must say NOT MEASURED"*), this is marked NOT MEASURED until additional student cohorts complete 3+ terms.

---

## 5. Task 4 — Transcript Ingestion Evaluation Harness

### 5.1 Harness Architecture
- `eval/transcripts/images/`: Destination for test PDF and image mark sheets.
- `eval/transcripts/ground_truth/`: Destination for verified ground-truth JSON files.
- `eval/transcripts/template.json`: Standardized ground-truth format.
- `eval/transcripts/README.md`: Instruction guide for transcript annotators.
- `scripts/eval_ingestion.js`: Execution script executing the 14-stage pipeline:
  1. Upload Buffer Validation
  2. Fingerprint Hashing
  3. Classification
  4. Text Ingestion
  5. Text Cleaning
  6. Quality Analysis
  7. Table Isolation
  8. University Profile Detection
  9. Deterministic Rule Parsing
  10. Grade Mapping
  11. Confidence Scoring
  12. Credit Calculation
  13. Contract Validation
  14. Decision Engine & Fallback Routing

### 5.2 Real Evaluation Run
**Command executed:** `node scripts/eval_ingestion.js`  
**Execution Timestamp:** 2026-10-15T18:24:19Z  
**Results Saved:** `results/ingestion_eval.csv` and `results/ingestion_eval.md`

#### Ingestion Metrics Table

| Metric | Target Value | Empirical Result | Status |
| :--- | :--- | :--- | :--- |
| **Dataset Size (Mark Sheets)** | $\ge 20$ sheets | 0 | **NOT MEASURED** |
| **Institutions Represented** | $\ge 3$ universities | 0 | **NOT MEASURED** |
| **Subject Name Precision / Recall / F1** | Publication benchmark | NOT MEASURED | No test mark sheets present |
| **Credits Precision / Recall / F1** | Publication benchmark | NOT MEASURED | No test mark sheets present |
| **Grade Precision / Recall / F1** | Publication benchmark | NOT MEASURED | No test mark sheets present |
| **Attendance Precision / Recall / F1** | Publication benchmark | NOT MEASURED | No test mark sheets present |
| **Subject Exact-Match Rate** | Publication benchmark | NOT MEASURED | No test mark sheets present |
| **OCR CER / WER** | Baseline character error | NOT MEASURED | Raw text ground truth unavailable |
| **Groq LLM Fallback Routing %** | Audit routing rate | NOT MEASURED | No test mark sheets present |
| **Manual Review Sent Count** | Edge-case review rate | 0 | **NOT MEASURED** |

**Metric Classification:** **NOT MEASURED**  
**Justification:** The directory `eval/transcripts/images/` currently contains 0 benchmark documents. Per the hard rules, no fake mark sheets were seeded. The evaluation harness is fully operational and ready to process real PDFs as soon as university cohorts are collected.

---

## 6. Task 5 — Automated Test Suite & Coverage

### 6.1 Test Suite Structure
Supertest integration and Jest unit tests cover:
1. `tests/api/apiEndpoints.test.js`: Health endpoint, 401 unauthenticated middleware guards, 404 handler.
2. `tests/unit/riskEngine.test.js`: Bounded risk engine, boundary conditions, and property grid test.
3. `tests/unit/predictionEngine.test.js`: GPA calculations, velocity model, scenario projections, and edge cases.
4. `tests/unit/readinessEngine.test.js`: Placement readiness index across 6 pillars and strict 98% cap.
5. `tests/unit/atsScoring.test.js`: ATS resume scoring ($0-100$), category ceilings, and penalty deductions.
6. `tests/unit/authMiddleware.test.js`: Missing, invalid, expired token rejection, and admin-only guards.
7. `tests/unit/jobProviderFallback.test.js`: `ProviderFactory` resilience and automatic fallback to `MockProvider`.
8. `tests/unit/recommendationEngine.test.js`: Critical attendance risk recommendations and priority sorting.
9. `tests/unit/insightEngine.test.js`: Trend direction detection and subject strength analysis.
10. `tests/unit/healthScoreEngine.test.js`: Academic health progression and semester comparison.
11. `tests/integration/transcriptPipeline.test.js`: Full 14-stage deterministic parser integration test.
12. `tests/unit/groqGuardrail.test.js`: AI Guardrail test with mocked Groq client asserting that hallucinated numeric grades, CGPA, and attendance are refused by `validateResponse`.

### 6.2 Test Execution Summary
**Command executed:** `npm run test:coverage`  
**Execution Timestamp:** 2026-10-15T18:33:50Z  
**Results Saved:** `results/coverage.md`

```
Test Suites: 12 passed, 12 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        80.28 s
```

### 6.3 Real Code Coverage Table

```
-------------------------------|---------|----------|---------|---------|------------------------------------
File                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                  
-------------------------------|---------|----------|---------|---------|------------------------------------
All files                      |   66.79 |    50.74 |   70.13 |   69.76 |                                    
 services                      |   24.52 |    24.78 |    5.55 |   22.91 |                                    
  careerIntelligenceService.js |   24.52 |    24.78 |    5.55 |   22.91 | 25-78,148-353                      
 services/intelligence/engines |   93.37 |       75 |     100 |   95.38 |                                    
  healthScoreEngine.js         |   92.03 |    72.72 |     100 |   92.66 | 148-149,166-169,190,204            
  insightEngine.js             |   87.75 |    70.47 |     100 |   92.04 | 83-84,100-101,168,178-179          
  predictionEngine.js          |   93.49 |    72.72 |     100 |   97.29 | 257,293,303                        
  recommendationEngine.js      |    97.7 |    78.75 |     100 |   97.56 | 30,232                             
  riskEngine.js                |     100 |     87.5 |     100 |     100 | 14,21,50,59,79-80                  
 services/parser               |   58.44 |    42.71 |   63.15 |   62.23 |                                    
  creditCalculator.js          |      80 |    57.44 |     100 |      80 | 31,62-64,72-77                     
  decisionEngine.js            |   90.19 |    70.45 |     100 |      92 | 43,48,53,92                        
  documentClassifier.js        |   22.22 |        0 |       0 |   22.22 | 16-26,45-81                        
  documentQualityAnalyzer.js   |   79.74 |    53.12 |     100 |   81.81 | 116,130,158,161,164,167,174...     
  fingerprint.js               |      50 |     37.5 |      50 |      50 | 20,35-56                           
  gradeMappingService.js       |   31.81 |     17.3 |      25 |    36.2 | 21-22,34,45-53,65-75...            
  groqFallback.js              |    9.73 |        0 |       0 |   11.11 | 27-34,64-84,93-108...              
  profileDetector.js           |   87.09 |    78.94 |     100 |   86.66 | 21-22,63-64                        
  ruleParser.js                |    58.4 |    43.44 |   58.82 |    65.2 | 55-61,143,173-175...               
  subjectConfidence.js         |   68.18 |     56.6 |   66.66 |   71.05 | 30-31,45-46,51,54,57...            
  tableIsolator.js             |   70.49 |    56.66 |    87.5 |   73.58 | 39-46,61-64,114,148-149            
  validationLayer.js           |   76.59 |    62.19 |     100 |   77.64 | 19-25,29,44-50,53...               
 services/parser/profiles      |   73.68 |        0 |       0 |   82.35 |                                    
  AUTONOMOUS.js                |     100 |      100 |     100 |     100 |                                    
  JNTUH_R18.js                 |     100 |      100 |     100 |     100 |                                    
  JNTUH_R22.js                 |     100 |      100 |     100 |     100 |                                    
  profileRegistry.js           |   61.53 |        0 |       0 |   72.72 | 26,34,42                           
 services/parser/utils         |   47.36 |    17.91 |   88.88 |   49.29 |                                    
  cleanText.js                 |    90.9 |       50 |     100 |     100 | 9                                  
  constants.js                 |     100 |      100 |     100 |     100 |                                    
  layoutDetector.js            |       0 |        0 |       0 |       0 | 1-89                               
  regex.js                     |     100 |      100 |     100 |     100 |                                    
  subjectFactory.js            |   94.11 |       55 |     100 |     100 | 15,32-56                           
 services/resume               |      75 |     60.2 |      75 |   74.73 |                                    
  resumeAnalysisService.js     |      75 |     60.2 |      75 |   74.73 | 71-72,84-85,90-91...               
 utils                         |   95.23 |       75 |     100 |     100 |                                    
  gpaUtils.js                  |   95.23 |       75 |     100 |     100 | 18,32-45                           
-------------------------------|---------|----------|---------|---------|------------------------------------
```

---

## 7. Task 6 — Student Feedback & User Study Tooling

### 7.1 Architecture & Implementation
- **Schema (`models/Feedback.js`):**
  - Demographics: `institution`, `yearOfStudy`
  - 10 System Usability Scale (SUS) items (scored 1 to 5)
  - 5 Platform Likert items (1 to 5):
    1. Dashboard clarity
    2. Recommendation usefulness
    3. Transcript import time savings
    4. Readiness score comprehensibility
    5. Intention for continued usage
  - Free-text qualitative commentary
  - Automatic 0–100 SUS score calculation on save:
    $$\text{SUS} = 2.5 \times \left( \sum_{i \in \text{odd}} (q_i - 1) + \sum_{j \in \text{even}} (5 - q_j) \right)$$
  - Compound unique index `{ user: 1, round: 1 }` to enforce single submission per user per round.
- **API Endpoints (`routes/feedbackRoutes.js`):**
  - `POST /api/feedback/submit`: Authenticated submission with duplicate guard.
  - `GET /api/feedback/status`: Check current round submission status.
  - `GET /api/feedback/export/csv`: Admin-only CSV export.
- **Frontend Page (`zenscore-ai/src/pages/Feedback.jsx`):**
  - Complete accessible UI with interactive Likert buttons, live SUS indicator, and single-round enforcement.

### 7.2 Empirical Feedback Analysis
**Command executed:** `node scripts/analyze_feedback.js`  
**Execution Timestamp:** 2026-10-15T18:27:04Z  
**Results Saved:** `results/feedback_analysis.csv` and `results/feedback_analysis.md`

```
Total Responses (n): 0
Institutions Represented: 0
NOT ENOUGH RESPONSES (Minimum 5 required for statistical analysis)
```

**Metric Classification:** **NOT MEASURED**  
**Justification:** Zero survey submissions exist in the production database ($n=0$). In compliance with the anti-fabrication mandate (*"Do not seed fake feedback to produce metrics. If n < 5, print NOT ENOUGH RESPONSES"*), SUS statistics and Likert means are marked NOT MEASURED until empirical student sessions are run.

---

## 8. Task 7 — High-Resolution Publication Screenshots

### 8.1 Capture Methodology
- **Script:** `scripts/capture_screens.js` using Playwright Chromium
- **Viewport:** $1440 \times 900$ pixels
- **Device Pixel Ratio (DPR):** `deviceScaleFactor: 2` (produces high-DPI retina assets suitable for IEEE two-column printing)
- **Account State:** Authenticated with Demo Account (`PRUDHVI CHINTHAPALLI`, real student ID `6a869cb032ae3175536eac65` with 5 terms of logged transcripts and target CGPA 9.00).
- **Cropping:** Component bounding box locators (`element.screenshot()`), tightly cropped to eliminate extraneous browser chrome and ensure readability at half-column width.

### 8.2 Captured Assets Inventory

| Asset Name | Target Component | File Location | Resolution / Size | Status |
| :--- | :--- | :--- | :--- | :--- |
| **(a) Dashboard Summary** | `#dashboard-summary-cards` | `paper_assets/dashboard_summary_cards.png` | 2x DPR (57.5 KB) | **MEASURED** |
| **(b) Academic Snapshot** | `#academic-snapshot-cards` | `paper_assets/academic_snapshot_cards.png` | 2x DPR (63.5 KB) | **MEASURED** |
| **(c) Resume Center ATS** | `#resume-ats-cards` | `paper_assets/resume_center_ats_cards.png` | 2x DPR (54.3 KB) | **MEASURED** |
| **(d) Jobs Summary** | `#jobs-summary-cards` | `paper_assets/jobs_summary_cards.png` | 2x DPR (57.6 KB) | **MEASURED** |

**Verification:** Assets exist in both `zenscore-backend/paper_assets/` and `zenscore-ai/paper_assets/`.

---

## 9. Full Summary of File Modifications

### Backend (`zenscore-backend`)
1. `constants/academicConstants.js`: Centralized `CONFIDENCE_THRESHOLDS`, total credit ceilings, and grading scales.
2. `services/intelligence/engines/riskEngine.js`: Exact piecewise formulas for $R_a, R_g, R_c$, clamped to $[0, 100]$.
3. `services/intelligence/engines/recommendationEngine.js`: Aligned subject risk calculation with bounded components.
4. `services/intelligence/engines/predictionEngine.js`: Sample standard deviation scenario projections (low/expected/high), insufficient history guards, and remaining credit edge cases.
5. `services/ai/responseFormatter.js`: Deterministic anti-fabrication validator refusing hallucinated CGPA, grades, or attendance.
6. `models/Feedback.js`: Mongoose model for SUS and Likert user studies with compound unique round index.
7. `controllers/feedbackController.js`: Survey submission and admin CSV export handler.
8. `routes/feedbackRoutes.js`: Feedback API routing.
9. `controllers/authController.js`: Added demo login handler.
10. `routes/authRoutes.js`: Exposed `/api/auth/demo-login`.
11. `server.js`: Mounted feedback routes.
12. `scripts/backtest_prediction.js`: Walk-forward prediction backtest script.
13. `scripts/eval_ingestion.js`: 14-Stage transcript ingestion evaluation script.
14. `scripts/analyze_feedback.js`: SUS & Likert statistical aggregation script.
15. `scripts/capture_screens.js`: Playwright screenshot capture script.
16. `tests/unit/riskEngine.test.js`: Boundary and 1,331-point grid property tests.
17. `tests/unit/predictionEngine.test.js`: Projection and scenario scenario tests.
18. `tests/unit/insightEngine.test.js`: Academic insight tests.
19. `tests/unit/recommendationEngine.test.js`: Recommendation priority tests.
20. `tests/unit/authMiddleware.test.js`: Auth middleware verification tests.
21. `tests/unit/jobProviderFallback.test.js`: Provider fallback resilience tests.
22. `tests/unit/groqGuardrail.test.js`: LLM guardrail refusal tests.

### Frontend (`zenscore-ai`)
1. `src/constants/academicConstants.js`: Frontend mirror of confidence thresholds and degree defaults.
2. `src/services/api.js`: Added `submitFeedback`, `getFeedbackStatus`, and demo token persistence.
3. `src/context/AuthContext.jsx`: Supported demo user session persistence across reloads.
4. `src/components/academics/AcademicAnalytics.jsx`: Rendered scenario projection range (low/expected/high) and standard deviation indicator.
5. `src/pages/Feedback.jsx`: Added comprehensive SUS & Likert student survey page.
6. `src/App.jsx`: Added protected route for `/feedback`.
7. `src/pages/Dashboard.jsx`: Added `id="dashboard-summary-cards"` for component capture.
8. `src/pages/Academics.jsx`: Added `id="academic-snapshot-cards"` for component capture.
9. `src/components/careers/resume/ResumeCenter.jsx`: Added `id="resume-ats-cards"` for component capture.
10. `src/components/jobs/JobsHero.jsx`: Added `id="jobs-summary-cards"` for component capture.

---

## 10. Conclusion & Reviewer Takeaway

All seven tasks requested by the conference paper reviewer have been implemented and validated in the codebase:
1. The subject risk formula is bounded to $[0, 100]$ and verified by mathematical proof and property tests.
2. Scenario CGPA projections are operational and exposed across the API and frontend.
3. Prediction confidence thresholds are centralized, with a fully functioning walk-forward backtest script.
4. The transcript ingestion evaluation harness is ready for empirical datasets without synthetic mock data.
5. The automated test suite covers all 5 academic engines, readiness score caps, ATS constraints, auth security, and Groq guardrails (12/12 suites passed, 78/78 tests passed, 93.37% rule engine coverage).
6. Standard SUS and platform Likert survey tooling is implemented with single-submission enforcement and admin export.
7. Publication-ready, high-resolution cropped component screenshots have been generated at 2x DPR retina quality.


---

## 11. Task 4 Empirical Evidence — 14-Stage Transcript Ingestion Evaluation (PRELIMINARY (n = 12))

**Execution Command:** `node scripts/eval_ingestion.js`  
**Execution Timestamp:** 2026-10-18T05:25:54.739Z  
**Git Commit Hash:** `e8cad38536567cd0ff616231b1f0937f60ca904f`  
**Parser Architecture:** 2.0.0 (14-stage modular pipeline)  
**OCR Engine:** Tesseract.js ^7.0.0 (LSTM eng.traineddata)  
**Groq Fallback Model:** openai/gpt-oss-120b  
**Benchmark Classification:** **PRELIMINARY (n = 12)** (Empirical evaluation on 12 verified mark sheets; fewer than 20 sheets / 3 profiles present, classified as PRELIMINARY per protocol).

### 11.1 Ground-Truth Verification & Dataset Composition
Every metric below was evaluated strictly against human-certified ground truth. Unverified sheets are strictly excluded.

| Metric | Value | Protocol Notes |
| :--- | :--- | :--- |
| **Verified Mark Sheets (Evaluated)** | **12** | Certified with `"verified": true` by human reviewer |
| **Excluded Mark Sheets** | **0** | None (all candidate sheets certified by human evaluator) |
| **Total Ground-Truth Subjects** | **113** | Complete subject modules evaluated |
| **Universities Represented** | **2** | JNTUH, Osmania University |
| **Curriculum Profiles** | **2** | JNTUH R22, OU CBCS / Autonomous |
| **Image-Quality Mix** | Clean: 12, Average: 0, Poor: 0 | Human visual assessment |

### 11.2 Evaluation Results: Mode (a) Rule-Only vs. Mode (b) Full Pipeline
Matching algorithm: Exact normalized **subject code** match first; fallback to **normalized name** (edit distance $\le 2$). Unmatched predictions = false positives; unmatched ground truth = false negatives. Confidence intervals are 95% Wilson score intervals:
$$CI_{95} = \frac{\hat{p} + \frac{z^2}{2n} \pm z\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}, \quad z = 1.96$$

| Metric | Mode (a): Rule Parser Only | Mode (b): Full Pipeline w/ Groq | Status |
| :--- | :--- | :--- | :--- |
| **Subject Name Precision** | 71.62% | 71.62% | MEASURED (n = 113) |
| **Subject Name Recall** | 46.90% | 46.90% | MEASURED (n = 113) |
| **Subject Name F1 Score** | 56.68% | 56.68% | MEASURED (n = 113) |
| **Credits F1 Score** | 42.78% | 42.78% | MEASURED (n = 113) |
| **Grade F1 Score** | 42.78% | 42.78% | MEASURED (n = 113) |
| **Attendance F1 Score** | NOT APPLICABLE (not printed) | NOT APPLICABLE (not printed) | NOT APPLICABLE |
| **Subject Exact Match Rate** | **27.43% [20.05%, 36.30%]** | **27.43% [20.05%, 36.30%]** | MEASURED (n = 113) |
| **Sheet Exact Match Rate** | **0.00% [0.00%, 24.25%]** | **0.00% [0.00%, 24.25%]** | MEASURED (n = 12) |
| **OCR CER (Character Error Rate)** | NOT MEASURED (no raw_text in GT) | NOT MEASURED (no raw_text in GT) | NOT MEASURED (no raw_text GT) |
| **OCR WER (Word Error Rate)** | NOT MEASURED (no raw_text in GT) | NOT MEASURED (no raw_text in GT) | NOT MEASURED (no raw_text GT) |

### 11.3 Fallback Routing & Operational Diagnostics
| Metric | Mode (a) Rule Only | Mode (b) Full Pipeline | Operational Meaning |
| :--- | :--- | :--- | :--- |
| **Rows Routed to Groq Fallback** | 0.00% (disabled) | **0.00% (0/74 rows)** | Low-confidence subjects (<55) or uncertain table structures |
| **Sheets Sent to Manual Review** | 2 (16.7%) | 2 (16.7%) | Decision = MANUAL_REVIEW or confidence < 70 |
| **Mean Sheet Latency** | 6 ms | 4 ms | End-to-end processing time |
| **Median Sheet Latency** | 4 ms | 4 ms | Median processing time |
| **Max Sheet Latency** | 28 ms | 7 ms | Maximum observed processing time |

### 11.4 Fallback Impact Audit (Rows Changed by Groq)
_No field values were altered by the Groq fallback on these verified sheets (rule engine provided deterministic output)._


### 11.5 Performance by University & Profile (Full Pipeline)
| University / Profile | Sheets | Subjects | Subject Exact Match (95% CI) | Sheet Exact Match (95% CI) | Name F1 | Credits F1 | Grade F1 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| JNTUH (JNTUH R22) | 10 | 94 | 32.98% [24.31%, 42.99%] | 0.00% [0.00%, 27.75%] | 63.1% | 47.6% | 47.6% |
| Osmania University (OU CBCS / Autonomous) | 2 | 19 | 0.00% [0.00%, 16.82%] | 0.00% [0.00%, 65.76%] | 0.0% | 0.0% | 0.0% |

### 11.6 Confidence Calibration & Error Audit
A total of **216** field extraction errors occurred across all runs. Mean confidence on erroneous fields: **39.8 / 100**.
See [`results/ingestion_errors.md`](./results/ingestion_errors.md) for the complete failure audit.
