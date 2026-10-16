# Automated Test Suite Coverage Summary

**Execution Timestamp:** 2026-10-15T18:33:50Z  
**Command:** `npm run test:coverage` (`jest --runInBand --coverage`)  
**Environment:** Node.js v20.18.0, Jest v30.5.2, Supertest v7.3.1  
**Status:** All 12 test suites passed, 78 tests passed, 0 failed.

---

## 1. Test Suite Execution Summary

| Metric | Result |
| :--- | :--- |
| **Test Suites** | **12 passed**, 12 total |
| **Tests** | **78 passed**, 78 total |
| **Snapshots** | 0 total |
| **Execution Time** | 80.28 seconds |

### Covered Test Suites:
1. `tests/api/apiEndpoints.test.js`: Supertest REST endpoints (health, 401 missing tokens, 404 route handling).
2. `tests/unit/readinessEngine.test.js`: Career Readiness Index 6-pillar score, classification, and strict **98% cap**.
3. `tests/unit/jobProviderFallback.test.js`: Job provider factory and automatic fallback to `MockProvider`.
4. `tests/unit/authMiddleware.test.js`: Auth middleware token validation (`missing`, `invalid`, `expired`, `valid`, `adminOnly`).
5. `tests/unit/riskEngine.test.js`: Academic Risk Engine bounded components ($R_a$, $R_g$, $R_c$), exact boundary values ($g=6.0 \to 100, g=8.5 \to 0, credits=9 \to 100, a=75 \to 100, a=85 \to 0$), and grid property testing ($0 \le \text{Risk} \le 100$).
6. `tests/unit/predictionEngine.test.js`: SGPA/CGPA prediction, credit weighting, velocity formula, and **scenario projection** (low/expected/high with sample SD, insufficient history flag, remaining credits 0 edge case, 10.0 clamping).
7. `tests/unit/recommendationEngine.test.js`: Rule-based priority recommendations (critical attendance $<80\%$, risk $>70$, high-credit subjects).
8. `tests/integration/transcriptPipeline.test.js`: 14-Stage transcript ingestion pipeline end-to-end integration test.
9. `tests/unit/insightEngine.test.js`: Academic insight trends, best/worst course detection, velocity direction.
10. `tests/unit/groqGuardrail.test.js`: LLM Guardrail refusing fabricated CGPA, attendance, grades, and hallucinated courses.
11. `tests/unit/healthScoreEngine.test.js`: Academic health score and semester progression analysis.
12. `tests/unit/atsScoring.test.js`: ATS resume scoring ($0-100$, category caps, keyword & section penalties).

---

## 2. Code Coverage Table

```
-------------------------------|---------|----------|---------|---------|-----------------------------------------------------------------------------------------------------------------------------------
File                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                                                                                 
-------------------------------|---------|----------|---------|---------|-----------------------------------------------------------------------------------------------------------------------------------
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
  documentQualityAnalyzer.js   |   79.74 |    53.12 |     100 |   81.81 | 116,130,158,161,164,167,174,177-182                                                                                               
  fingerprint.js               |      50 |     37.5 |      50 |      50 | 20,35-56                                                                                                                          
  gradeMappingService.js       |   31.81 |     17.3 |      25 |    36.2 | 21-22,34,45-53,65-75,87-96,108-129,159-161                                                                                        
  groqFallback.js              |    9.73 |        0 |       0 |   11.11 | 27-34,64-84,93-108,116-117,120-121,134-182,193-221,235-259                                                                        
  profileDetector.js           |   87.09 |    78.94 |     100 |   86.66 | 21-22,63-64                                                                                                                       
  ruleParser.js                |    58.4 |    43.44 |   58.82 |    65.2 | 55-61,143,173-175,189-195,208,232-259,266-270,321-326,344-347,373-374,449-473,478-479,488-509,532,540,565-570,586-589,593,611-622 
  subjectConfidence.js         |   68.18 |     56.6 |   66.66 |   71.05 | 30-31,45-46,51,54,57,60,85-87                                                                                                     
  tableIsolator.js             |   70.49 |    56.66 |    87.5 |   73.58 | 39-46,61-64,114,148-149,155                                                                                                       
  validationLayer.js           |   76.59 |    62.19 |     100 |   77.64 | 19-25,29,44-50,53,68-74,94-100,104-110,114,129,144-147,157,175                                                                    
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
  resumeAnalysisService.js     |      75 |     60.2 |      75 |   74.73 | 71-72,84-85,90-91,99-100,168-230                                                                                                  
 utils                         |   95.23 |       75 |     100 |     100 |                                                                                                                                   
  gpaUtils.js                  |   95.23 |       75 |     100 |     100 | 18,32-45                                                                                                                          
-------------------------------|---------|----------|---------|---------|-----------------------------------------------------------------------------------------------------------------------------------
```
