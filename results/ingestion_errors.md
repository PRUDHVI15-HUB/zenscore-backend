# ZenScore Transcript Ingestion — Field Error Audit

This document logs every incorrect field extraction across all evaluated sheets.
Pipeline failures are never hidden or obscured.

| Sheet ID | Mode | Field | Predicted Value | Expected Value | Confidence | Likely Failing Stage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cmr_237R1A05AD_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EC104ES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22ME105ES COMPUTER AIDED ENGINEERING GRAPHICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CH106BS ENGINEERING CHEMISTRY LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **subject_detection** | `J0ECI0MES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING bs BK` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **subject_detection** | `22MEI05ES COMPUTER AIDED ENGINEERING GRAPHICS alo` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **credits** | `6` | `4` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **credits** | `3` | `4` | 87 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **grade** | `A (pts: 8)` | `A+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem1` | `rule_only` | **credits** | `5` | `1` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EC104ES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22ME105ES COMPUTER AIDED ENGINEERING GRAPHICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CH106BS ENGINEERING CHEMISTRY LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **subject_detection** | `J0ECI0MES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING bs BK` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **subject_detection** | `22MEI05ES COMPUTER AIDED ENGINEERING GRAPHICS alo` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **credits** | `6` | `4` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **credits** | `3` | `4` | 87 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **grade** | `A (pts: 8)` | `A+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem1` | `full_pipeline` | **credits** | `5` | `1` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22MA201BS ORDINARY DIFFERENTIAL EQUATIONS AND VECTOR CALCULUS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22PH202BS APPLIED PHYSICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS203ES DATA STRUCTURES` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EN204HS ENGLISH FOR SKILL ENHANCEMENT` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS205ES IT WORKSHOP` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22PH206BS APPLIED PHYSICS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS207ES DATA STRUCTURES LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EN208HS ENGLISH LANGUAGE AND COMMUNICATION SKILLS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS209ES BASIC ELEMENTS OF ENGINEERING AND TECHNOLOGY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `22EN20045 ENGLISH FOR SIL ENHANCEMENT mls fos jE` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `2amiaoees AppuED PHYSICS LABORATORY PN` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `22c520765 oATA STRUCTURES LABORATORY alse` | `NONE_SPURIOUS` | 92 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `226N208HS ENGLISH LANGUAGE AND COMMUNICATION SKILLS Co TT` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `rule_only` | **subject_detection** | `22C5205E5 BASIC ELEMENTS OF ENGINEERING AND TECHNOLOGY PI I I` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22MA201BS ORDINARY DIFFERENTIAL EQUATIONS AND VECTOR CALCULUS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22PH202BS APPLIED PHYSICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS203ES DATA STRUCTURES` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EN204HS ENGLISH FOR SKILL ENHANCEMENT` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS205ES IT WORKSHOP` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22PH206BS APPLIED PHYSICS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS207ES DATA STRUCTURES LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EN208HS ENGLISH LANGUAGE AND COMMUNICATION SKILLS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS209ES BASIC ELEMENTS OF ENGINEERING AND TECHNOLOGY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `22EN20045 ENGLISH FOR SIL ENHANCEMENT mls fos jE` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `2amiaoees AppuED PHYSICS LABORATORY PN` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `22c520765 oATA STRUCTURES LABORATORY alse` | `NONE_SPURIOUS` | 92 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `226N208HS ENGLISH LANGUAGE AND COMMUNICATION SKILLS Co TT` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem2` | `full_pipeline` | **subject_detection** | `22C5205E5 BASIC ELEMENTS OF ENGINEERING AND TECHNOLOGY PI I I` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22MA301BS COMPUTER ORIENTED STATISTICAL METHODS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EC302ES DIGITAL ELECTRONICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS306PC PYTHON LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **subject_detection** | `226caozes oiomas evecrronics Atlee` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **subject_detection** | `2zcss0sec pyion Lag` | `NONE_SPURIOUS` | 87 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **credits** | `2` | `3` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **grade** | `A (pts: 8)` | `A+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **credits** | `2` | `3` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **credits** | `2` | `3` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **grade** | `A (pts: 8)` | `A+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem3` | `rule_only` | **grade** | `F (pts: 0)` | `O` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22MA301BS COMPUTER ORIENTED STATISTICAL METHODS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EC302ES DIGITAL ELECTRONICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS306PC PYTHON LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **subject_detection** | `226caozes oiomas evecrronics Atlee` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **subject_detection** | `2zcss0sec pyion Lag` | `NONE_SPURIOUS` | 87 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **credits** | `2` | `3` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **grade** | `A (pts: 8)` | `A+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **credits** | `2` | `3` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **credits** | `2` | `3` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **grade** | `A (pts: 8)` | `A+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem3` | `full_pipeline` | **grade** | `F (pts: 0)` | `O` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS405PC SOFTWARE ENGINEERING` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS408PC DATA VISUALIZATION - R PROGRAMMING/POWER BI` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS409PC REAL TIME RESEARCH PROJECT/SOCIETAL RELATED PROJECTS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EN410MC CONSTITUTION OF INDIA` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `22cs40spc sortware encinesring` | `NONE_SPURIOUS` | 92 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `22cse0spc oama visuaLZATION R PROGRAMMING POWER` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `2acsaoppc REAL IME RESEARCH PROJECT SOCIETAL RELATED` | `NONE_SPURIOUS` | 92 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **subject_detection** | `z2enat0mc consTTUTION OF NDIA Be` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `rule_only` | **credits** | `2` | `3` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS405PC SOFTWARE ENGINEERING` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS408PC DATA VISUALIZATION - R PROGRAMMING/POWER BI` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS409PC REAL TIME RESEARCH PROJECT/SOCIETAL RELATED PROJECTS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EN410MC CONSTITUTION OF INDIA` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `22cs40spc sortware encinesring` | `NONE_SPURIOUS` | 92 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `22cse0spc oama visuaLZATION R PROGRAMMING POWER` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `2acsaoppc REAL IME RESEARCH PROJECT SOCIETAL RELATED` | `NONE_SPURIOUS` | 92 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **subject_detection** | `z2enat0mc consTTUTION OF NDIA Be` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05AD_sem4` | `full_pipeline` | **credits** | `2` | `3` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS501PC DESIGN AND ANALYSIS OF ALGORITHMS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS502PC DEVOPS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem5` | `rule_only` | **credits** | `1` | `0` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem5` | `rule_only` | **grade** | `A (pts: 8)` | `A+` | 87 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem5` | `rule_only` | **grade** | `A (pts: 8)` | `A+` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem5` | `rule_only` | **credits** | `3` | `1` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS501PC DESIGN AND ANALYSIS OF ALGORITHMS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS502PC DEVOPS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05AD_sem5` | `full_pipeline` | **credits** | `1` | `0` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05AD_sem5` | `full_pipeline` | **grade** | `A (pts: 8)` | `A+` | 87 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem5` | `full_pipeline` | **grade** | `A (pts: 8)` | `A+` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05AD_sem5` | `full_pipeline` | **credits** | `3` | `1` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CH102BS ENGINEERING CHEMISTRY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS103ES PROGRAMMING FOR PROBLEM SOLVING` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CH106BS ENGINEERING CHEMISTRY LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS107ES PROGRAMMING FOR PROBLEM SOLVING LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CH109MC ENVIRONMENTAL SCIENCE` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **subject_detection** | `2ciuoevc environmenTaL scence GH plo` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **grade** | `P (pts: 4)` | `A` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **credits** | `3` | `4` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem1` | `rule_only` | **grade** | `A (pts: 8)` | `B` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CH102BS ENGINEERING CHEMISTRY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS103ES PROGRAMMING FOR PROBLEM SOLVING` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CH106BS ENGINEERING CHEMISTRY LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS107ES PROGRAMMING FOR PROBLEM SOLVING LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CH109MC ENVIRONMENTAL SCIENCE` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **subject_detection** | `2ciuoevc environmenTaL scence GH plo` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **grade** | `P (pts: 4)` | `A` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **credits** | `3` | `4` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem1` | `full_pipeline` | **grade** | `A (pts: 8)` | `B` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22MA201BS ORDINARY DIFFERENTIAL EQUATIONS AND VECTOR CALCULUS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS203ES DATA STRUCTURES` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EN204HS ENGLISH FOR SKILL ENHANCEMENT` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22PH206BS APPLIED PHYSICS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS207ES DATA STRUCTURES LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EN208HS ENGLISH LANGUAGE AND COMMUNICATION SKILLS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `2zewaoms ENGUSH FOR SKILL ENHANCEMENT ARC ROH` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **subject_detection** | `226a08Hs {ENGLISH LANGUAGE AND COMMUNICATION SKILLS slo fe)` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **grade** | `P (pts: 4)` | `B+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **credits** | `3` | `1` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem2` | `rule_only` | **grade** | `A (pts: 8)` | `A+` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22MA201BS ORDINARY DIFFERENTIAL EQUATIONS AND VECTOR CALCULUS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS203ES DATA STRUCTURES` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EN204HS ENGLISH FOR SKILL ENHANCEMENT` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22PH206BS APPLIED PHYSICS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS207ES DATA STRUCTURES LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EN208HS ENGLISH LANGUAGE AND COMMUNICATION SKILLS LABORATORY` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `2zewaoms ENGUSH FOR SKILL ENHANCEMENT ARC ROH` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **subject_detection** | `226a08Hs {ENGLISH LANGUAGE AND COMMUNICATION SKILLS slo fe)` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **grade** | `P (pts: 4)` | `B+` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **credits** | `3` | `1` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem2` | `full_pipeline` | **grade** | `A (pts: 8)` | `A+` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS304PC COMPUTER ORGANIZATION AND ARCHITECTURE` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem3` | `rule_only` | **credits** | `1` | `1.5` | 87 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS304PC COMPUTER ORGANIZATION AND ARCHITECTURE` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem3` | `full_pipeline` | **credits** | `1` | `1.5` | 87 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem4` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS409PC REAL TIME RESEARCH PROJECT/SOCIETAL RELATED PROJECTS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem4` | `rule_only` | **grade** | `A (pts: 8)` | `B` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem4` | `rule_only` | **credits** | `3` | `1` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem4` | `rule_only` | **grade** | `A (pts: 8)` | `A+` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem4` | `rule_only` | **credits** | `6` | `0` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem4` | `rule_only` | **grade** | `A (pts: 8)` | `B` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem4` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS409PC REAL TIME RESEARCH PROJECT/SOCIETAL RELATED PROJECTS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem4` | `full_pipeline` | **grade** | `A (pts: 8)` | `B` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem4` | `full_pipeline` | **credits** | `3` | `1` | 92 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem4` | `full_pipeline` | **grade** | `A (pts: 8)` | `A+` | 92 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem4` | `full_pipeline` | **credits** | `6` | `0` | 97 | Stage 12 (Credit Calculator / Parser) |
| `cmr_237R1A05BR_sem4` | `full_pipeline` | **grade** | `A (pts: 8)` | `B` | 97 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS501PC DESIGN AND ANALYSIS OF ALGORITHMS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS503PC COMPUTER NETWORKS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS513PE DATA ANALYTICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS505PC COMPUTER NETWORKS LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22EN506HS ADVANCED ENGLISH COMMUNICATION SKILLS LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `22CS508MC INTELLECTUAL PROPERTY RIGHTS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `z2css03C coupuTER NETWORKS Alles` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `21CSS1IPE DATA ANALYTICS FE oT` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `22ENSOSHS ADVANCED ENGLISH COMMUNICATION SKILLS LAB Ant Ae Ee` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **subject_detection** | `22CSSOBNC INTELLECTUAL PROPERTY RIGHTS wl e` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **name** | `NATURAL LANGUAGE PROCESSING str` | `NATURAL LANGUAGE PROCESSING` | 67 | Stage 9 (Rule Parser - Name Extraction) |
| `cmr_237R1A05BR_sem5` | `rule_only` | **grade** | ` (pts: null)` | `B+` | 67 | Stage 10 (Grade Mapping / Regex) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS501PC DESIGN AND ANALYSIS OF ALGORITHMS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS503PC COMPUTER NETWORKS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS513PE DATA ANALYTICS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS505PC COMPUTER NETWORKS LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22EN506HS ADVANCED ENGLISH COMMUNICATION SKILLS LAB` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `22CS508MC INTELLECTUAL PROPERTY RIGHTS` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `z2css03C coupuTER NETWORKS Alles` | `NONE_SPURIOUS` | 67 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `21CSS1IPE DATA ANALYTICS FE oT` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `22ENSOSHS ADVANCED ENGLISH COMMUNICATION SKILLS LAB Ant Ae Ee` | `NONE_SPURIOUS` | 82 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **subject_detection** | `22CSSOBNC INTELLECTUAL PROPERTY RIGHTS wl e` | `NONE_SPURIOUS` | 97 | Stage 9 (Rule Parser - Spurious Row) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **name** | `NATURAL LANGUAGE PROCESSING str` | `NATURAL LANGUAGE PROCESSING` | 67 | Stage 9 (Rule Parser - Name Extraction) |
| `cmr_237R1A05BR_sem5` | `full_pipeline` | **grade** | ` (pts: null)` | `B+` | 67 | Stage 10 (Grade Mapping / Regex) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `HS301CMU23 Finance and Accounting` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `ES303ECU23 Basic Electronics` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `ES304ECU23 Digital Electronics` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `ES301ITU23 Python Programming` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `ES352ECU23 Basic Electronics Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `ES351ITU23 Python Programming Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `HS301EGU23 Effective Technical Communication In English` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC302ITU23 Database Systems` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC303ITU23 Discrete Mathematics` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC352ITU23 Database Systems Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `HS301CMU23 Finance and Accounting` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `ES303ECU23 Basic Electronics` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `ES304ECU23 Digital Electronics` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `ES301ITU23 Python Programming` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `ES352ECU23 Basic Electronics Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `ES351ITU23 Python Programming Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `HS301EGU23 Effective Technical Communication In English` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC302ITU23 Database Systems` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC303ITU23 Discrete Mathematics` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem3` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC352ITU23 Database Systems Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC508ITU23 Principles of Programming Languages` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC509ITU23 Artificial Intelligence` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC510ITU23 Operating Systems` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC511ITU23 Software Engineering` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC512ITU23 Full Stack Development` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PE501ITU23 Object oriented Analysis and Design` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC556ITU23 Artificial Intelligence Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC557ITU23 Operating System Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `rule_only` | **subject_detection** | `MISSED_BY_PARSER` | `PC558ITU23 Full Stack Development Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC508ITU23 Principles of Programming Languages` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC509ITU23 Artificial Intelligence` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC510ITU23 Operating Systems` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC511ITU23 Software Engineering` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC512ITU23 Full Stack Development` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PE501ITU23 Object oriented Analysis and Design` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC556ITU23 Artificial Intelligence Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC557ITU23 Operating System Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
| `matrusri_160823737070_sem5` | `full_pipeline` | **subject_detection** | `MISSED_BY_PARSER` | `PC558ITU23 Full Stack Development Lab` | 0 | Stage 7/9 (Table Isolation or Rule Parser) |
