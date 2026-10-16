# ZenScore AI — GPA Prediction Engine Backtest Report

**Generated**: 2026-10-15T18:23:21.270Z
**Total Registered Users in Database**: 7
**Students with >= 3 Semesters History**: 1

> [!WARNING]
> **Status**: NOT MEASURED (Insufficient Sample Size)
> **Reason**: There are currently only n = 1 real student(s) in the production database with >= 3 completed semesters of history. A reliable statistical backtest requires a larger longitudinal cohort (n >= 20).

### Prediction Error by Confidence Level

| Confidence Level | History Semesters Threshold | n (Predictions) | MAE (SGPA Points) | RMSE (SGPA Points) |
| :--- | :--- | :--- | :--- | :--- |
| **Low** | < 2 semesters | 0 | N/A | N/A |
| **Medium** | 2–3 semesters | 2 | 1.1100 | 1.1188 |
| **High** | >= 4 semesters | 1 | 0.4000 | 0.4000 |
| **Overall** | Combined | 3 | 0.8733 | 0.9422 |

### Detailed Walk-Forward Logs

| Student | Target Semester | Prior History Count | Confidence | Predicted SGPA | Actual SGPA | Error |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Student_1 | Semester 3 | 2 sem | Medium | 7.8 | 9.05 | -1.25 |
| Student_1 | Semester 4 | 3 sem | Medium | 8.43 | 9.4 | -0.97 |
| Student_1 | Semester 5 | 4 sem | High | 8.8 | 8.4 | +0.4 |

