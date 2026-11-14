import csv
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).parents[1]
header = [
    'subject','section','item_no','official_exam_name','region','school',
    'academic_year','semester','edition','book_printing','paper_question_no',
    'source_url','source_file_sha256','question_image_path','textbook_exact_page',
    'textbook_section','reviewer','review_date','verification_status','notes'
]
base = {
    'subject':'geo','section':'geo-pep-hot','item_no':'1','official_exam_name':'样本',
    'region':'河北省三河市','school':'样本学校','academic_year':'2025-2026','semester':'上',
    'edition':'人教版2024七年级上册','book_printing':'2024年12月第1次印刷',
    'paper_question_no':'1','source_url':'https://example.com/paper.pdf',
    'source_file_sha256':'a'*64,'question_image_path':'images/q1.png','textbook_exact_page':'27',
    'textbook_section':'第二章地图','reviewer':'复核人','review_date':'2026-11-14',
    'verification_status':'verified','notes':'纸质教材与原卷逐题核对'
}

with tempfile.NamedTemporaryFile('w', suffix='.csv', encoding='utf-8-sig', newline='', delete=False) as f:
    csv.DictWriter(f, fieldnames=header).writeheader()
    csv.DictWriter(f, fieldnames=header).writerow(base)
    good = f.name
result = subprocess.run(['python3', 'tools/validate_official_exam_import.py', good], cwd=root, capture_output=True, text=True)
assert result.returncode == 0, result.stdout + result.stderr

bad = dict(base, edition='湘教版2024七年级上册')
with tempfile.NamedTemporaryFile('w', suffix='.csv', encoding='utf-8-sig', newline='', delete=False) as f:
    csv.DictWriter(f, fieldnames=header).writeheader()
    csv.DictWriter(f, fieldnames=header).writerow(bad)
    wrong = f.name
result = subprocess.run(['python3', 'tools/validate_official_exam_import.py', wrong], cwd=root, capture_output=True, text=True)
assert result.returncode == 1 and 'edition must contain 人教版' in result.stdout, result.stdout
print('official import edition gate passed')
