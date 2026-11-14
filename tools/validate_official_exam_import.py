#!/usr/bin/env python3
"""Validate official-exam evidence before any question can be marked verified."""
import csv, hashlib, pathlib, sys

REQUIRED = {
    'subject','section','item_no','official_exam_name','region','school',
    'academic_year','semester','edition','book_printing','paper_question_no',
    'source_url','source_file_sha256','question_image_path','textbook_exact_page',
    'textbook_section','reviewer','review_date','verification_status','notes'
}
ALLOWED = {'pending','verified'}
EXPECTED_EDITION = {
    'zh': '统编版', 'math': '人教版', 'eng': '人教版',
    'his': '统编版', 'geo': '人教版', 'bio': '人教版', 'df': '统编版',
}

def main(path: str) -> int:
    p = pathlib.Path(path)
    with p.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        fields = set(reader.fieldnames or [])
        missing = REQUIRED - fields
        if missing:
            print('missing columns:', ', '.join(sorted(missing)))
            return 2
        errors = []
        count = 0
        for line, row in enumerate(reader, 2):
            count += 1
            for field in REQUIRED:
                if not row.get(field, '').strip():
                    errors.append(f'{line}: empty {field}')
            status = row['verification_status'].strip()
            if status not in ALLOWED:
                errors.append(f'{line}: invalid verification_status={status}')
            if status == 'verified':
                subject = row['subject'].strip()
                edition = row['edition'].strip()
                region = row['region'].strip()
                if subject not in EXPECTED_EDITION:
                    errors.append(f'{line}: verified row has unsupported subject={subject}')
                elif EXPECTED_EDITION[subject] not in edition:
                    errors.append(f'{line}: verified row edition must contain {EXPECTED_EDITION[subject]}')
                if '河北' not in region and '三河' not in region:
                    errors.append(f'{line}: verified row region must be Hebei or Sanhe')
                if not row['source_url'].startswith(('http://','https://')):
                    errors.append(f'{line}: verified row needs source_url')
                digest = row['source_file_sha256'].strip().lower()
                if len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
                    errors.append(f'{line}: verified row needs 64-char source_file_sha256')
                if not row['paper_question_no'].strip().isdigit():
                    errors.append(f'{line}: verified row needs numeric paper_question_no')
                if not row['textbook_exact_page'].strip().isdigit():
                    errors.append(f'{line}: verified row needs numeric textbook_exact_page')
                if not row['question_image_path'].strip():
                    errors.append(f'{line}: verified row needs question_image_path')
        if errors:
            print('\n'.join(errors))
            return 1
        print(f'official exam import template valid: {count} rows')
        return 0

if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else 'docs/official-exam-import-template.csv'))
