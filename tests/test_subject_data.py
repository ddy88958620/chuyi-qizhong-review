import json, pathlib, re, csv as csvmod
root=pathlib.Path(__file__).parents[1]
required={'notes','cards','fill','mcq','qa'}
for key in ('zh','math','eng','his','geo','bio','df'):
    text=(root/'data'/f'{key}.js').read_text(encoding='utf-8')
    assert text.startswith('window.REVIEW_DATA = window.REVIEW_DATA || {};'), (key, 'data initializer')
    data=json.loads(re.search(rf"window\.REVIEW_DATA\['{key}'\]\s*=\s*(.*);\s*$", text, re.S).group(1))
    assert data['id']==key and data['sections'], key
    kinds={s['kind'] for s in data['sections']}
    if key in {'zh','math','eng'}: assert required <= kinds, (key,kinds)
    if key in {'his','geo','bio','df'}:
        question_items=[item for sec in data['sections'] if sec['kind'] in {'cards','fill','mcq','qa'} for item in sec['items']]
        assert all({'edition','textbook_ref','paper_page','textbook_source_url','textbook_page_index_url','textbook_match_confidence','exam_evidence_level','exam_source','official_database_status','official_exam_question_no','source_url','region_scope','frequency_source_urls','frequency_source_count','frequency_method','status'} <= set(item.get('audit',{})) for item in question_items), (key, 'audit fields')
        assert all(item['audit']['exam_evidence_level'] in {'regional_public_same_version','public_same_version_baseline_region_pending','internal_or_derived_no_public_question_id'} for item in question_items), (key, 'evidence level')
        assert all(item['audit']['official_database_status'] == 'no_public_official_question_index_found' for item in question_items), (key, 'database status')
        assert all(item['audit']['frequency_source_count'] == len(item['audit']['frequency_source_urls']) for item in question_items), (key, 'frequency source count')
        assert all(item['audit']['frequency_source_count'] > 0 for item in question_items if item.get('hot')), (key, 'hot frequency sources')
        assert all(not item['audit']['textbook_ref'].startswith('待') and not item['audit']['paper_page'].startswith('待') for item in question_items), (key, 'textbook mapping')
        assert all(item['audit']['status'] in {'textbook_unit_mapped_pending_exact_page_and_official_exam_check','textbook_exact_page_mapped_pending_official_exam_check'} for item in question_items), (key, 'audit status')
        assert all({'source_kind','source_url','pdf_sha256','anchor_printed_page','anchor_pdf_page','match_method','paper_print_status'} <= set(item['audit'].get('textbook_evidence',{})) for item in question_items), (key, 'textbook evidence')
        assert all(isinstance(item['audit']['textbook_evidence'].get('pdf_footer_page_match'), bool) for item in question_items), (key, 'pdf footer match')
        assert all(item['audit']['textbook_evidence']['paper_print_status'].startswith('待用学生手中纸质教材') for item in question_items), (key, 'paper print status')
        assert all(item['audit']['textbook_ref'] != '待按纸质教材单元/章/节/栏目或页码补录' for item in question_items if item.get('hot')), (key, 'hot textbook refs')
        assert all(item['audit']['status'] != 'verified' or (
            '非官方' not in item['audit']['exam_source']
            and '待核' not in item['audit']['textbook_ref']
            and '待复核' not in item['audit']['paper_page']
            and '待取得' not in item['audit']['official_exam_question_no']
            and item['audit']['official_database_status'] != 'no_public_official_question_index_found'
        ) for item in question_items), (key, 'verified gate')
    else: assert 'notes' in kinds and bool(kinds & {'cards','fill','mcq','qa'}), (key,kinds)
    for sec in data['sections']:
        if sec['kind'] in {'cards','fill','mcq','qa'}:
            assert sec.get('items'), (key,sec['id'])
    if key in {'zh','math','eng','his','geo'}: assert ('高频' in text or '易错' in text), key
    if key in {'zh','math','eng'}:
        for sec in data['sections']:
            if sec['kind'] in {'cards','fill','qa'}:
                assert all(item.get('knowledge') for item in sec['items']), (key, sec['id'], 'knowledge explanation')
        hot_section=next(sec for sec in data['sections'] if sec['id'].endswith('-hot'))
        assert hot_section.get('frequency_source_count') == len(hot_section.get('frequency_source_urls', [])) >= 3, (key, 'frequency sources')
        assert all({'edition','textbook_ref','paper_page','exam_source','official_database_status','frequency_source_urls','frequency_source_count','status'} <= set(item.get('audit',{})) for item in hot_section['items']), (key, 'hot audit fields')
        assert all(item['audit'].get('textbook_page_index_url','').startswith(('http','docs/')) for item in hot_section['items']), (key, 'page index URL')
    if key in {'his','geo','bio','df'}:
        assert any(sec['id'].endswith('-pep-core') for sec in data['sections']), (key, 'pep core')
        assert any('pep.com.cn' in sec.get('source','') for sec in data['sections'] if sec['id'].endswith('-scope') or sec['id'].endswith('-core')), (key, 'official source')
        assert all(sec.get('legacy') is False for sec in data['sections'] if sec['id'].endswith('-pep-scope') or sec['id'].endswith('-pep-core')), (key, 'pep section legacy flag')
        assert all(sec.get('legacy') is True for sec in data['sections'] if not (sec['id'].endswith('-pep-scope') or sec['id'].endswith('-pep-core') or sec['id'].endswith('-pep-hot'))), (key, 'legacy section filter')
        assert all(sec.get('legacy') is False for sec in data['sections'] if sec['id'].endswith('-pep-hot')), (key, 'pep hot section flag')
        if key == 'geo':
            hot=next(sec for sec in data['sections'] if sec['id']=='geo-pep-hot')
            assert '向海拔较高处凸出' in hot['items'][1]['q'] and hot['items'][1]['ans'] == 'B', (key, 'valley contour rule')
    mcqs=[s for s in data['sections'] if s['kind']=='mcq']
    if mcqs: assert sum(1 for sec in mcqs for item in sec['items'] if item.get('hot')) >= 5, (key, 'hot mcq')
    def check_bold(value):
        if isinstance(value, str):
            assert value.count('**') % 2 == 0, (key, 'unbalanced bold markers', value[:100])
        elif isinstance(value, list):
            for v in value: check_bold(v)
        elif isinstance(value, dict):
            for v in value.values(): check_bold(v)
    check_bold(data)
eng=json.loads(re.search(r"window\.REVIEW_DATA\['eng'\]\s*=\s*(.*);\s*$", (root/'data/eng.js').read_text(encoding='utf-8'), re.S).group(1))
eng_outline=next(s for s in eng['sections'] if s['id']=='eng-outline')
assert any(g['title'].startswith('资料拆解·同步语法速记') for g in eng_outline['groups'])
eng_files=next(s for s in eng['sections'] if s['id']=='eng-materials')
assert eng_files['items'][0]['path'].endswith('.pdf') and eng_files['items'][0]['sha256'] == '356789da354e390e2c11ff2bb06f642761feb977c805754ee4f155d200eda4b'
assert (root/'docs/english-material-sync-2026.md').exists()
for key in ('his','geo','bio','df'):
    d=json.loads(re.search(rf"window\.REVIEW_DATA\['{key}'\]\s*=\s*(.*);\s*$", (root/'data'/f'{key}.js').read_text(encoding='utf-8'), re.S).group(1))
    evidence=[it.get('audit',{}).get('textbook_evidence',{}) for sec in d['sections'] for it in sec.get('items',[]) if isinstance(it,dict)]
    images=[e.get('page_image') for e in evidence if e.get('page_image')]
    assert images, (key, 'textbook page images')
    assert all((root/p).exists() for p in images), (key, 'missing textbook page image')
html=(root/'index.html').read_text(encoding='utf-8')
for key in ('zh','math','eng','his','geo','bio','df'):
    assert f"data/{key}.js" in html
app=(root/'assets/app.js').read_text(encoding='utf-8')
assert "['bio', 'his', 'df', 'geo', 'zh', 'math', 'eng']" in app
assert 'function sectionsOf(sub) { return sub.sections; }' in app
assert '教材定位：' in app and '核验状态：' in app
assert '地区范围：' in app
assert '打开教材平台' in app and '查看页码索引' in app
assert '关联知识点讲解' in app and 'knowledge-tip' in app
assert 'audit-sources' in app and '展开来源池' in app
assert 'audit-corner' in app and 'audit-detail' in app
csv=(root/'docs/question-audit-2026.csv').read_text(encoding='utf-8-sig').splitlines()[0]
assert 'region_scope' in csv and 'textbook_page_index_url' in csv and 'exam_evidence_level' in csv and 'frequency_source_count' in csv
freq=(root/'docs/frequency-summary-2026.csv').read_text(encoding='utf-8-sig').splitlines()
assert len(freq) > 1 and 'source_pool_count' in freq[0]
page_index=json.loads((root/'docs/textbook-page-index-2026.json').read_text(encoding='utf-8'))
assert page_index['books']['geo']['public_pdf_url'].endswith('/pdf.pdf')
preview=json.loads((root/'docs/public-exam-preview-registry-2026.json').read_text(encoding='utf-8'))
assert {r['subject'] for r in preview['records']} == {'his','geo','bio','df'}
assert all(r['same_version_pool'] == (r['edition'] in {'统编版','人教版'}) for r in preview['records'])
assert all(r['preview_image_urls'] and r['total_pages'] >= r['preview_pages'] for r in preview['records'])
for bad in ('https://www.21cnjy.com/H/10/49126/27051677.shtml','https://www.21cnjy.com/H/11/49151/27026428.shtml'):
    assert all(bad not in text for text in [ (root/'data/geo.js').read_text(encoding='utf-8'), (root/'data/bio.js').read_text(encoding='utf-8') ])
template=(root/'docs/official-exam-import-template.csv').read_text(encoding='utf-8-sig').splitlines()[0]
for field in ('paper_question_no','source_file_sha256','question_image_path','textbook_exact_page','verification_status'):
    assert field in template
assert (root/'tools/validate_official_exam_import.py').exists()
check=(root/'docs/textbook-question-check-2026.csv').read_text(encoding='utf-8-sig').splitlines()
assert len(check) >= 400 and 'anchor_printed_page' in check[0] and 'paper_print_status' in check[0]
paper_check=(root/'docs/paper-textbook-verification-2026.csv').read_text(encoding='utf-8-sig').splitlines()
assert len(paper_check) >= 400 and 'physical_visual_check' in paper_check[0] and 'pdf_footer_page_match' in paper_check[0]
assert any('教材页眉/目录关键词命中' in row for row in check[1:]) and any('页内关键词未命中' in row for row in check[1:])
exam=(root/'docs/exam-evidence-log-2026.csv').read_text(encoding='utf-8-sig').splitlines()
assert len(exam) >= 10 and 'official_database_status' in exam[0]
assert (root/'docs/official-database-search-log-2026.md').exists()
assert (root/'docs/current-evidence-snapshot-2026.md').exists()
exam_rows=list(csvmod.DictReader((root/'docs/exam-evidence-log-2026.csv').open(encoding='utf-8-sig')))
assert {'2024-2025','2025-2026','2026-2027'} <= {r['academic_year'] for r in exam_rows}, 'three academic years evidence'
print('subject data checks passed')
