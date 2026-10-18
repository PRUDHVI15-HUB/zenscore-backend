# ZenScore AI — Transcript Ingestion Evaluation Report

**Benchmark Status**: **PRELIMINARY (n = 12)**  
**Execution Timestamp**: 2026-10-18T07:15:20.225Z  
**Git Commit Hash**: `3c3cb1c98c402f33c99f8549940318d5bc8c18f1`  
**Parser Architecture**: 2.0.0 (14-stage modular pipeline)  
**OCR Engine**: Tesseract.js ^7.0.0 (LSTM eng.traineddata)  
**Groq Fallback Model**: openai/gpt-oss-120b  

---

## 1. Dataset & Ground-Truth Verification

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Verified Mark Sheets (Evaluated)** | **12** | All confirmed with `"verified": true` by human evaluator |
| **Excluded Sheets (Unverified)** | **0** | Excluded per HARD RULE (never simulate or estimate ground truth) |
| **Total Ground-Truth Subjects** | **113** | Evaluated across all verified sheets |
| **Universities Represented** | **2** | JNTUH, Osmania University |
| **Image Quality Breakdown** | Clean: 12, Avg: 0, Poor: 0 | Human visual assessment |

> [!NOTE]
> **Preliminary Notice**: Less than 20 verified sheets or 3 profiles are currently present. Results are labeled PRELIMINARY (n = 12) and will be updated as more verified sheets are added.


---

## 2. Ingestion Evaluation Results (Both Modes)

Matching Rule: Match predicted subjects to ground-truth by **subject code** first; fallback to **normalized name** (lowercase, punctuation stripped, Levenshtein distance $\le 2$). Unmatched predictions are false positives; unmatched ground-truth subjects are false negatives. Confidence intervals are 95% Wilson score intervals.

### Overall Performance Comparison
| Metric | Rule Parser Only (Mode a) | Full Pipeline w/ Groq (Mode b) | Status |
| :--- | :--- | :--- | :--- |
| **Subject Name Precision** | 71.62% | 71.62% | MEASURED (n = 113) |
| **Subject Name Recall** | 46.90% | 46.90% | MEASURED (n = 113) |
| **Subject Name F1 Score** | 56.68% | 56.68% | MEASURED (n = 113) |
| **Credits F1 Score** | 42.78% | 42.78% | MEASURED (n = 113) |
| **Grade F1 Score** | 42.78% | 42.78% | MEASURED (n = 113) |
| **Attendance F1 Score** | NOT APPLICABLE (not on sheets) | NOT APPLICABLE (not on sheets) | NOT APPLICABLE |
| **Subject Exact Match Rate** | **27.43% [20.05%, 36.30%]** | **27.43% [20.05%, 36.30%]** | MEASURED (n = 113) |
| **Sheet Exact Match Rate** | **0.00% [0.00%, 24.25%]** | **0.00% [0.00%, 24.25%]** | MEASURED (n = 12) |
| **OCR CER (Character Error Rate)** | 66.20% | 66.20% | MEASURED (n = 4) |
| **OCR WER (Word Error Rate)** | 99.56% | 99.56% | MEASURED (n = 4) |

---

## 3. Fallback & Operational Routing Diagnostics

| Metric | Result | Description |
| :--- | :--- | :--- |
| **Rows Routed to Groq Fallback** | **0.00% (0/74 rows)** | Low-confidence subjects (<55) or uncertain table structures |
| **Sheets Sent to Manual Review** | Mode a: **2** (16.7%) | Mode b: **2** (16.7%) | Decision = MANUAL_REVIEW or confidence < 70 |
| **Mean Sheet Latency** | Mode a: **19 ms** | Mode b: **6 ms** | Mean end-to-end processing time |
| **Median Sheet Latency** | Mode a: **5 ms** | Mode b: **3 ms** | Median end-to-end processing time |
| **Max Sheet Latency** | Mode a: **182 ms** | Mode b: **36 ms** | Maximum processing time observed |

### Fallback Value Impact Log (Mode b)
_No field values were modified by the Groq fallback during this run._


---

## 4. University / Profile Breakdown (Full Pipeline)

| University / Profile | Sheets | Subjects | Subject Exact Match | Sheet Exact Match | Name F1 | Credits F1 | Grade F1 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| JNTUH (JNTUH R22) | 10 | 94 | 32.98% [24.31%, 42.99%] | 0.00% [0.00%, 27.75%] | 63.1% | 47.6% | 47.6% |
| Osmania University (OU CBCS / Autonomous) | 2 | 19 | 0.00% [0.00%, 16.82%] | 0.00% [0.00%, 65.76%] | 0.0% | 0.0% | 0.0% |

---

## 5. Confidence Score vs. Error Correlation

A total of **216** field extraction errors occurred across all runs.
- **Mean Confidence on Erroneous Fields**: 39.8 / 100
See [`results/ingestion_errors.md`](./ingestion_errors.md) for the complete failure audit.
