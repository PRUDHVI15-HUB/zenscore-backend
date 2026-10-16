# ZenScore AI — Transcript Ingestion Evaluation Dataset Guide

This directory contains the ground truth and source files for evaluating the ZenScore AI 14-stage transcript ingestion pipeline.

## Directory Structure

```
eval/transcripts/
├── images/               # Raw marks card files: .png, .jpg, .jpeg, or .pdf
├── ground_truth/         # Corresponding Ground Truth JSON files (one per mark sheet)
├── template.json         # Reference schema template for new ground-truth files
└── README.md             # This instruction file
```

## Dataset Requirements for Conference Benchmarks

To establish statistically sound empirical claims for publication:
- **Minimum Dataset Size**: At least **20 mark sheets**.
- **Institutional Diversity**: Sourced from at least **3 distinct universities** (e.g., JNTUH, VTU, Anna University, Autonomous colleges).
- **Format Variety**: Scanned PDFs, mobile photos with mild perspective skew, and digital grade cards.

---

## How to Create Ground Truth JSONs

For each file in `images/` (e.g. `images/jntuh_sem4_memo.pdf`), create a corresponding JSON file in `ground_truth/` with the same base name (e.g. `ground_truth/jntuh_sem4_memo.json`):

```json
{
  "sheetId": "jntuh_sem4_01",
  "filename": "jntuh_sem4_memo.pdf",
  "university": "JNTUH",
  "semester": 4,
  "sgpa": 9.40,
  "cgpa": 8.51,
  "subjects": [
    {
      "code": "22CS401PC",
      "name": "DISCRETE MATHEMATICS",
      "credits": 3.0,
      "attendance": 85,
      "grade": "A",
      "gradePoints": 9
    },
    {
      "code": "22CS402PC",
      "name": "DATABASE MANAGEMENT SYSTEMS",
      "credits": 3.0,
      "attendance": 90,
      "grade": "A",
      "gradePoints": 8
    }
  ],
  "rawText": "Optional: Paste ground-truth OCR text here if measuring Character/Word Error Rate (CER/WER)"
}
```

### Field Definitions

| Field | Type | Description |
| :--- | :--- | :--- |
| `university` | String | Target university layout (`JNTUH`, `VTU`, `Anna University`, `AUTONOMOUS`) |
| `name` | String | Official course title as written on the grade card |
| `credits` | Number | Official credit weighting (e.g., `3.0`, `1.5`, `0.0`) |
| `attendance` | Number \| null | Course attendance percentage (if recorded on memo; otherwise null) |
| `grade` | String | Letter grade (e.g., `O`, `A+`, `A`, `B`, `F`) |
| `gradePoints` | Number | Numeric grade points on 10-point scale (e.g., `10`, `9`, `8`, `0`) |
| `rawText` | String \| optional | Ground-truth text for OCR character error rate (CER) benchmarking |

---

## Running the Evaluation Pipeline

Once mark sheets and ground truth JSONs are placed in `eval/transcripts/`, execute:

```bash
node scripts/eval_ingestion.js
```

This generates:
- `results/ingestion_eval.csv` — Precision, Recall, F1, exact-match rate, CER/WER, Groq fallback metrics
- `results/ingestion_eval.md` — Complete summary table ready for IEEE paper inclusion
- `results/ingestion_errors.json` — Detailed per-subject mismatch breakdown
