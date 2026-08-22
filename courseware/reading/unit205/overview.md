# Unit 5 Web Courseware v1 — Correction Summary

## What was done
All Chinese text in the Unit 5 reading & writing web courseware was replaced with English equivalents sourced from the two teacher's edition markdown files.

## Source files (authoritative)
- `读写Unit_5_课本教师版.md` — textbook content (Texts 1-5, Q1-47, Writing, etc.)
- `读写Unit_5_skill_builder_教师版.md` — Skill Builder content (diagnostic article, Q1-12, Grammar, Language Practice, Writing)

## Target file
- `预备班_Unit5_网页课件_v1/index.html` — 1341 lines, 48 slides

## Changes applied (total: 430+ replacements across 2 phases)

### Phase 1 (bulk script — 298 replacements)
- All 6 reading passage blocks (Text 1 §1-10, Text 2 §1-5, Text 3 §1-6, Text 4, Text 5, SB article §1-11)
- ~47 question stems and MCQ options
- All cloze data-answer attributes (removed Chinese parenthetical translations)
- All matching table content
- All explanations and section labels
- Grammar explanations (conditionals 0-3, other expressions)
- Writing instructions and model answer labels
- Summary section content

### Phase 2 (line-by-line fix — 125 replacements)
- 10 remaining Chinese passage blocks (Text 1 §8, Text 2 §2-4, SB article §2/§4/§5/§7/§8/§10)
- 21 remaining Chinese question stems (Q1, Q4, Q8, Q10, Q17, Q20 table, Q21, Q23 table, Q24 table, Q26, Q28, Q41, Q42, SB Q1-Q7, SB Q9)
- All data-title attributes (sidebar navigation labels) translated to English
- All data-part attributes translated to English
- All h1-en bilingual span labels translated to English
- Cover page text, teacher badge, meta cards, timeline labels
- A2 exercise labels ("Overall tone:", "Negative language:")
- Method badge descriptions (Text intros for Part A and Part B1)

## Validation results
- **HTML tag balance**: All tags balanced (section: 49/49, div: 526/526, table: 15/15, span: 480/480, p: 161/161)
- **Duplicate IDs**: None (112 unique IDs)
- **data-answer attributes**: 212 intact
- **HTML entities**: No broken entities
- **Chinese characters remaining**: 0
- **Chinese punctuation remaining**: Only `＿` (fullwidth underscore, used as cloze blank placeholder — intentional)

## Date
2026-07-30
