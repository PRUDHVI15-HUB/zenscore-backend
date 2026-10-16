#!/usr/bin/env python3
"""
ocr_accuracy_test.py
Evaluation Script for Transcript Ingestion Pipeline (Reviewer Response R2-2)

Analyzes field-by-field accuracy:
  - Subject Code
  - Subject Name
  - Credits
  - Grade
  - Result
  - Overall Row Accuracy

Compares:
  1. Full ZenScore Pipeline with Groq Fallback ON
  2. Full ZenScore Pipeline with Groq Fallback OFF (Pure Deterministic Rule Engine)
  3. Reviewer R2-2 Request: Accuracy on Low-Confidence / Degraded Rows ONLY
  4. Baseline: Plain Tesseract OCR + Naive Regex Parser
"""

import json
import os
import sys

def main():
    results_path = os.path.join(os.path.dirname(__file__), 'data', 'ocr_eval_results.json')
    if not os.path.exists(results_path):
        print(f"Error: {results_path} not found. Please run scripts/run_transcript_eval.js first.")
        sys.exit(1)

    with open(results_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("=" * 80)
    print("      ZENSCRORE AI — TRANSCRIPT OCR & INGESTION ACCURACY EVALUATION")
    print("=" * 80)
    
    summary = data.get('summary', {})
    print(f"Total Transcripts Evaluated: {summary.get('totalTranscripts')}")
    print(f"Total Academic Subject Rows: {summary.get('totalRows')}")
    print(f"Low-Confidence / Degraded Rows (R2-2): {summary.get('lowConfidenceRows')}\n")

    fields = ['subjectCode', 'subjectName', 'credits', 'grade', 'result', 'overallRowAccuracy']
    header = f"{'Metric / Field':<24} | {'Baseline (Tesseract+Regex)':<26} | {'ZenScore (Groq OFF)':<20} | {'ZenScore (Groq ON)':<20}"
    print(header)
    print("-" * len(header))

    p_base = data.get('baselinePlainTesseract', {})
    p_off = data.get('pipelineWithoutGroq', {})
    p_on = data.get('pipelineWithGroq', {})

    field_labels = {
        'subjectCode': 'Subject Code',
        'subjectName': 'Subject Name',
        'credits': 'Credits',
        'grade': 'Final Grade',
        'result': 'Status / Result',
        'overallRowAccuracy': 'OVERALL ROW EXACT'
    }

    for fld in fields:
        label = field_labels.get(fld, fld)
        b_val = p_base.get(fld, 'N/A')
        off_val = p_off.get(fld, 'N/A')
        on_val = p_on.get(fld, 'N/A')
        print(f"{label:<24} | {b_val:<26} | {off_val:<20} | {on_val:<20}")

    print("-" * len(header))
    print("\n" + "=" * 80)
    print("      REVIEWER 2 (COMMENT R2-2) SPECIFIC ANALYSIS: LOW-CONFIDENCE ROWS ONLY")
    print("=" * 80)
    r2_2 = data.get('reviewerR2_2_LowConfidenceSubset', {})
    print(f"Total Low-Confidence Rows Evaluated:   {r2_2.get('totalLowConfidenceRows')}")
    print(f"Pure Rule Parser Accuracy (Groq OFF):  {r2_2.get('withoutGroqAccuracy')}")
    print(f"With Groq Surgical Fallback (Groq ON): {r2_2.get('withGroqAccuracy')}")
    print(f"Groq Recovery Impact (Delta):          {r2_2.get('groqRecoveryDelta')}")
    print("=" * 80 + "\n")

if __name__ == '__main__':
    main()
