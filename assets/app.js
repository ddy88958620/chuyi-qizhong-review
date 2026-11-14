/* 初一上 · 期中在线复习 —— 纯前端，无构建、无网络依赖 */
(function () {
  'use strict';

  var REPO_URL = 'https://github.com/Enzo-River/chuyi-qizhong-review';
  var ORDER = ['bio', 'his', 'df', 'geo', 'zh', 'math', 'eng'];
  var D = window.REVIEW_DATA || {};
  var SUBJECTS = ORDER.map(function (k) { return D[k]; }).filter(Boolean);
  var STORE = 'chu1_review_v1';

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || '{}');
      return { done: s.done || {}, quiz: s.quiz || {}, theme: s.theme || null };
    } catch (e) { return { done: {}, quiz: {}, theme: null }; }
  }
  function saveState() {
    try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* 隐私模式下忽略 */ }
  }
  var S = loadState();

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function rich(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  function el(id) { return document.getElementById(id); }
  function sectionsOf(sub) { return sub.sections; }
  function firstSection(sub, test, fallback) {
    var sections = sectionsOf(sub), found = null;
    sections.forEach(function (sec) { if (!found && test(sec)) found = sec; });
    return found || fallback || sections[0];
  }
  function learningPath(sub) {
    var sections = sectionsOf(sub);
    var core = firstSection(sub, function (sec) { return /-pep-core$/.test(sec.id); }) ||
      firstSection(sub, function (sec) { return sec.kind === 'notes' && !sec.legacy; });
    var remember = firstSection(sub, function (sec) { return (sec.kind === 'cards' || sec.kind === 'fill') && !sec.hot && !sec.legacy; }) ||
      firstSection(sub, function (sec) { return sec.kind === 'cards' || sec.kind === 'fill'; });
    var practice = firstSection(sub, function (sec) { return sec.hot && (sec.kind === 'mcq' || sec.kind === 'cards'); }) ||
      firstSection(sub, function (sec) { return sec.kind === 'mcq'; });
    var review = firstSection(sub, function (sec) { return sec.kind === 'qa'; }) ||
      firstSection(sub, function (sec) { return sec.kind === 'mcq' && sec !== practice; }) || remember || core;
    return [
      { id: core.id, label: '先懂', icon: '🌱', hint: '知识要点' },
      { id: (remember || core).id, label: '会记', icon: '🧠', hint: '抽背与自测' },
      { id: (practice || remember || core).id, label: '会做', icon: '🎯', hint: '少量练习' },
      { id: (review || practice || core).id, label: '复盘', icon: '✨', hint: '答案与掌握' }
    ];
  }
  function byId(sub, sec) {
    for (var i = 0; i < SUBJECTS.length; i++) {
      if (SUBJECTS[i].id === sub) {
        var sections = sectionsOf(SUBJECTS[i]);
        for (var j = 0; j < sections.length; j++) {
          if (sections[j].id === sec) return sections[j];
        }
      }
    }
    return null;
  }
  function itemId(sub, sec, i) { return sub + '/' + sec + '/' + i; }

  /* ---------------- 进度统计 ---------------- */
  function stats(subjectId) {
    var total = 0, done = 0, quizTotal = 0, cards = 0, fills = 0;
    SUBJECTS.forEach(function (sub) {
      if (subjectId && sub.id !== subjectId) return;
      sectionsOf(sub).forEach(function (sec) {
        if (sec.kind === 'cards' || sec.kind === 'fill' || sec.kind === 'qa') {
          sec.items.forEach(function (_, i) {
            total++;
            if (S.done[itemId(sub.id, sec.id, i)]) done++;
            if (sec.kind === 'cards') cards++;
            if (sec.kind === 'fill') fills++;
          });
        } else if (sec.kind === 'mcq') {
          sec.items.forEach(function (it, i) {
            total++; quizTotal++;
            if (S.done[itemId(sub.id, sec.id, i)]) done++;
          });
        }
      });
    });
    return { total: total, done: done, quizTotal: quizTotal, cards: cards, fills: fills };
  }
  function progressBar(st) {
    var pct = st.total ? Math.round(st.done / st.total * 100) : 0;
    return '<div class="progress-card">' +
      '<div class="progress-top"><strong>我的复习进度</strong>' +
      '<span class="progress-num">' + st.done + ' / ' + st.total + '　·　' + pct + '%</span></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<p class="progress-hint">在抽背卡片、填空自测、答案对照里点「✓ 已掌握」，或把选择题做对，就会记入进度。进度只存在这台设备的浏览器里。</p>' +
      '</div>';
  }

  /* ---------------- 首页 ---------------- */
  function renderHome() {
    var st = stats();
    var h = '<div class="wrap"><section class="hero">' +
      '<h1>初一上 · 期中在线复习</h1>' +
      '<p class="lead">生物 · 历史 · 道法 · 地理 · 语文 · 数学 · 英语　七科资料分门别类，边看边测，随时抽背。</p>' +
      '<p class="meta">语文（统编版·人教社）/ 数学 / 英语按人教版 2022 课标修订版（2024 秋启用，2026 年七年级在用）自主整理；历史 / 地理 / 生物 / 道法已接入新版人教版/统编版知识主线与专项题型，旧资料保留并标注待迁移　·　共 ' + SUBJECTS.length + ' 科 · 每科 4 步学习路径</p>' +
      '</section>' + progressBar(st);

    h += '<div class="grid">';
    SUBJECTS.forEach(function (sub) {
      var s = stats(sub.id), mcq = 0, notes = 0, quizCards = 0;
      sectionsOf(sub).forEach(function (sec) {
        if (sec.kind === 'mcq') mcq += sec.items.length;
        if (sec.kind === 'notes') notes += sec.groups.length;
        if (sec.kind === 'cards') quizCards += sec.items.length;
      });
      var third = mcq ? '<span><b>' + mcq + '</b> 道选择题</span>'
        : '<span><b>' + quizCards + '</b> 张抽背卡</span>';
      h += '<a class="subject-card" style="--sub-color:' + esc(sub.color) + '" href="#/' + sub.id + '">' +
        '<span class="sc-emoji">' + sub.emoji + '</span>' +
        '<h2>' + esc(sub.name) + '</h2>' +
        '<p class="sc-sub">' + esc(sub.sub) + '</p>' +
        '<p class="sc-desc">' + esc(sub.desc) + '</p>' +
        '<div class="sc-stats"><span><b>4</b> 步学习路径</span>' +
        '<span><b>' + notes + '</b> 组知识要点</span>' + third +
        '<span>已掌握 <b>' + s.done + '/' + s.total + '</b></span></div></a>';
    });
    h += '</div>';

    h += '<section class="howto"><h3>推荐学习方式</h3><ol>' +
      '<li><b>先懂</b>：每科先打开“先懂”，一次只学一个小组；需要记忆时再点“遮罩速记”。</li>' +
      '<li><b>会记</b>：用抽背卡或填空把刚学的内容说出来，答案只在需要时展开。</li>' +
      '<li><b>会做</b>：先做少量高频样式题，答错后看解析和关联知识点，不连续刷大量题。</li>' +
      '<li><b>复盘</b>：标记“已掌握”，下次从未掌握内容开始；旧资料、配套 PDF 和全部原有板块放在“更多内容”。</li>' +
      '</ol></section></div>';
    return h;
  }

  /* ---------------- 原卷配图 ---------------- */
  function figLink(f, showCap) {
    return '<a class="fig-link" href="' + esc(f.src) + '" target="_blank" rel="noopener" ' +
      'title="点击在新标签打开原图，可放大查看">' +
      '<img src="' + esc(f.src) + '" alt="' + esc(f.cap || '原卷配图') + '" loading="lazy">' +
      (showCap && f.cap ? '<span class="fig-cap">' + esc(f.cap) + '</span>' : '') + '</a>';
  }

  function qFigs(imgs) {
    if (!imgs || !imgs.length) return '';
    return '<div class="q-figs"><div class="fig-label">🖼 原卷配图 · 点击放大</div>' +
      '<div class="fig-grid">' + imgs.map(function (f) { return figLink(f, false); }).join('') + '</div></div>';
  }
  function auditLine(it) {
    var a = it && it.audit;
    if (!a) return '';
    var status = a.status === 'verified' ? '已核验' : (a.status === 'textbook_exact_page_mapped_pending_official_exam_check' ? '教材页码已匹配，官方题号待核验' : (a.status === 'textbook_unit_mapped_pending_exact_page_and_official_exam_check' ? '可用于学习｜教材章节已映射，精确页码/官方题号待核验' : '待逐题核验'));
    var badge = a.status === 'verified' ? '✓' : 'ⓘ';
    var link = a.source_url ? ' · <a href="' + esc(a.source_url) + '" target="_blank" rel="noopener">查看试题来源</a>' : '';
    var textbookLink = a.textbook_source_url ? ' · <a href="' + esc(a.textbook_source_url) + '" target="_blank" rel="noopener">打开教材平台</a>' : '';
    var indexLink = a.textbook_page_index_url ? ' · <a href="' + esc(a.textbook_page_index_url) + '" target="_blank" rel="noopener">查看页码索引</a>' : '';
    var freq = a.frequency_source_count ? ' · 高频样式来源池：' + esc(a.frequency_source_count) + ' 个（非官方频次）' : '';
    var region = a.region_scope ? ' · 地区范围：' + esc(a.region_scope) : '';
    var evidence = a.textbook_evidence || {};
    var textbookEvidence = evidence.anchor_printed_page ? ' · 教材对照页：第' + esc(evidence.anchor_printed_page) + '页（电子教材页脚' + (evidence.pdf_footer_page_match ? '已匹配' : '待核对') + '；纸质印次待复核）' : '';
    var pageImage = evidence.page_image ? ' <a class="audit-page-link" href="' + esc(evidence.page_image) + '" target="_blank" rel="noopener"><img loading="lazy" src="' + esc(evidence.page_image) + '" alt="教材第' + esc(evidence.anchor_printed_page || '') + '页预览">查看教材页图</a>' : '';
    var pool = Array.isArray(a.frequency_source_urls) && a.frequency_source_urls.length ? '<details class="audit-sources"><summary>展开来源池</summary><ul>' + a.frequency_source_urls.map(function (u) { return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u) + '</a></li>'; }).join('') + '</ul></details>' : '';
    return '<details class="audit-corner" title="查看核验信息"><summary aria-label="查看核验信息">' + badge + '</summary><div class="audit-detail">核验状态：' + esc(status) + ' · 教材：' + esc(a.edition) + ' · 教材定位：' + esc(a.textbook_ref || '待补录') + ' · 纸质页码：' + esc(a.paper_page || '待补录') + textbookEvidence + pageImage + ' · 题源证据：' + esc(a.exam_evidence_level || '待补录') + region + freq + ' · 官方题号：' + esc(a.official_exam_question_no || '待补录') + ' · 官方数据库：' + esc(a.official_database_status || '待检索') + ' · ' + esc(a.exam_source) + textbookLink + indexLink + link + pool + '</div></details>';
  }

  function figureStrip(figures) {
    if (!figures || !figures.items || !figures.items.length) return '';
    return '<details class="group fig-strip"><summary>' + esc(figures.title) + '</summary>' +
      '<div class="group-body"><div class="fig-grid wide">' +
      figures.items.map(function (f) { return figLink(f, true); }).join('') +
      '</div><p class="muted slide-tip">以上为原始 Word 文档内嵌配图，按原文顺序排列；点开可放大。</p></div></details>';
  }

  /* ---------------- 各类板块渲染 ---------------- */
  function renderNotes(sec, sub) {
    var h = '<div class="section-tools">' +
      '<button class="btn small" data-act="expand">全部展开</button>' +
      '<button class="btn small" data-act="collapse">全部折叠</button>' +
      '<button class="btn small" data-act="mask" id="maskBtn">🫧 遮罩速记</button>' +
      '</div><div class="notes-root">';
    sec.groups.forEach(function (g, gi) {
      h += '<details class="group" ' + (gi === 0 ? 'open' : '') + '><summary>' + esc(g.title) + '</summary><div class="group-body">';
      g.blocks.forEach(function (b) {
        if (b.t === 'p') h += '<p class="maskable">' + rich(b.text) + '</p>';
        else if (b.t === 'table') {
          h += '<div class="tbl-wrap"><table>';
          b.rows.forEach(function (row, ri) {
            h += '<tr>' + row.map(function (c) {
              return ri === 0 ? '<th>' + rich(c) + '</th>' : '<td class="maskable">' + rich(c) + '</td>';
            }).join('') + '</tr>';
          });
          h += '</table></div>';
        } else if (b.t === 'note') h += '<p><span class="note-line">' + rich(b.text) + '</span></p>';
        else if (b.t === 'img') h += '<figure class="inline-fig">' + figLink(b, true) + '</figure>';
      });
      h += '</div></details>';
    });
    return h + '</div>';
  }

  function fillFull(it) {
    var parts = esc(it.q).split('＿＿＿＿'), out = '';
    for (var i = 0; i < parts.length - 1; i++) {
      out += parts[i] + '<b style="color:var(--accent)">' + esc(it.a[i] || '') + '</b>';
    }
    return out + parts[parts.length - 1];
  }

  function renderFill(sec, sub) {
    var groups = {}, order = [];
    sec.items.forEach(function (it, i) {
      var g = it.group || '要点';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push({ it: it, i: i });
    });
    var h = '<div class="section-tools">' +
      '<button class="btn small primary" data-act="focus" data-mode="fill">🎲 随机抽背</button>' +
      '<button class="btn small" data-act="expand">全部展开</button>' +
      '<button class="btn small" data-act="collapse">全部折叠</button>' +
      '<span class="source-tag">共 ' + sec.items.length + ' 空</span></div>';
    order.forEach(function (g, gi) {
      h += '<details class="group" ' + (gi === 0 ? 'open' : '') + '><summary>' + esc(g.length > 48 ? g.slice(0, 48) + '…' : g) +
        ' <span class="badge">' + groups[g].length + ' 题</span></summary><div class="group-body">';
      groups[g].forEach(function (o) {
        var id = itemId(sub.id, sec.id, o.i), ok = !!S.done[id];
        var q = rich(o.it.q).replace(/＿＿＿＿/g, '<span class="blank">?</span>');
        h += '<div class="card ' + (ok ? 'mastered' : '') + '" data-card="' + esc(id) + '">' +
          '<div class="card-head"><div class="q-text">' + q + '</div>' + auditLine(o.it) + '</div>' +
          '<div class="answers hidden">' + o.it.a.map(function (a) {
            return '<span class="answer-chip">' + esc(a) + '</span>';
          }).join('') + '</div>' +
          '<div class="answer-full hidden">' + fillFull(o.it) + '</div>' +
          (o.it.knowledge ? '<details class="knowledge-tip"><summary>关联知识点讲解</summary><div>' + esc(o.it.knowledge) + '</div></details>' : '') +
          '<div class="card-actions">' +
          '<button class="btn small" data-act="reveal-fill">显示答案</button>' +
          '<button class="btn small ' + (ok ? 'on' : '') + '" data-act="master" data-id="' + esc(id) + '">' + (ok ? '✓ 已掌握' : '标记已掌握') + '</button>' +
          '</div></div>';
      });
      h += '</div></details>';
    });
    return h;
  }

  function renderMcq(sec, sub) {
    var answered = 0, correct = 0, hotCount = 0;
    sec.items.forEach(function (it, i) {
      var v = S.quiz[itemId(sub.id, sec.id, i)];
      if (v) { answered++; if (v === it.ans) correct++; } if (it.hot) hotCount++;
    });
    var h = '<div class="quiz-bar"><span>已答 <b>' + answered + '/' + sec.items.length + '</b>　答对 <b>' + correct + '</b></span>' +
      '<div class="bar"><i style="width:' + (sec.items.length ? Math.round(answered / sec.items.length * 100) : 0) + '%"></i></div>' +
      '<button class="btn small" data-act="quiz-filter" id="quizFilterBtn">只看错题</button>' + (hotCount ? '<button class="btn small" data-act="quiz-hot-filter" id="quizHotFilterBtn">只看高频</button>' : '') +
      '<button class="btn small" data-act="quiz-reset">重做本组</button></div><div class="quiz-root">';
    sec.items.forEach(function (it, i) {
      var id = itemId(sub.id, sec.id, i), chosen = S.quiz[id], ok = chosen === it.ans;
      h += '<div class="card quiz-card" data-no="' + it.no + '" data-wrong="' + (chosen && !ok ? '1' : '0') + '" data-hot="' + (it.hot ? '1' : '0') + '">' +
        '<div class="card-head"><div class="q-text"><b>第 ' + it.no + ' 题</b>　' + esc(it.q) + '</div>' +
        '<span class="badge ' + (ok ? 'ok' : '') + '">' + (chosen ? (ok ? '✓ 答对' : '✗ 答错') : '未作答') + '</span></div>' +
        qFigs(it.imgs) + auditLine(it) + '<div class="opts">';
      it.opts.forEach(function (o) {
        var cls = 'opt';
        if (chosen) {
          if (o.k === it.ans) cls += ' correct';
          else if (o.k === chosen) cls += ' wrong';
          else cls += ' dim';
        }
        h += '<button class="' + cls + '" data-act="answer" data-id="' + esc(id) + '" data-k="' + o.k +
          '" data-ans="' + it.ans + '"' + (chosen ? ' disabled' : '') + '><span class="k">' + o.k + '</span><span>' + esc(o.v) + '</span></button>';
      });
      h += '</div><div class="quiz-result ' + (chosen ? (ok ? 'ok' : 'no') : 'hidden') + '">' +
        (chosen ? (ok ? '✓ 回答正确' : '✗ 答错了，正确答案 ' + it.ans) : '') + '</div>' +
        (it.tip ? '<details class="quiz-tip"><summary>查看解析</summary><div>' + esc(it.tip) + '</div></details>' : '') +
        '</div>';
    });
    return h + '</div>';
  }

  function renderQa(sec, sub) {
    var h = '<div class="qa">';
    sec.items.forEach(function (it, i) {
      var id = itemId(sub.id, sec.id, i), ok = !!S.done[id];
      h += '<div class="qa-item' + (ok ? ' mastered' : '') + '">' +
        '<div class="qa-q">' + rich(it.q) + (ok ? '　<span class="badge ok">✓ 已掌握</span>' : '') + '</div>' +
        qFigs(it.imgs) + auditLine(it) +
        '<details class="qa-ans"><summary>展开参考答案</summary>' +
        '<div class="a-body">' + esc(it.a) +
        (it.knowledge ? '<div class="knowledge-tip"><b>关联知识点：</b>' + esc(it.knowledge) + '</div>' : '') +
        '<div class="card-actions"><button class="btn small ' + (ok ? 'on' : '') + '" data-act="master" data-id="' + esc(id) + '">' +
        (ok ? '✓ 已掌握' : '标记已掌握') + '</button></div></div></details></div>';
    });
    return h + '</div>';
  }

  function renderCards(sec, sub) {
    var groups = {}, order = [];
    sec.items.forEach(function (it, i) {
      var g = it.group || '卡片';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push({ it: it, i: i });
    });
    var h = '<div class="section-tools">' +
      '<button class="btn small primary" data-act="focus" data-mode="cards">🎲 随机抽背</button>' +
      '<button class="btn small" data-act="expand">全部展开</button>' +
      '<button class="btn small" data-act="collapse">全部折叠</button>' +
      '<span class="source-tag">共 ' + sec.items.length + ' 张</span></div>';
    order.forEach(function (g, gi) {
      h += '<details class="group" ' + (gi === 0 ? 'open' : '') + '><summary>' + esc(g) +
        ' <span class="badge">' + groups[g].length + ' 张</span></summary><div class="group-body">';
      groups[g].forEach(function (o) {
        var id = itemId(sub.id, sec.id, o.i), ok = !!S.done[id];
        h += '<div class="card ' + (ok ? 'mastered' : '') + '">' +
          '<div class="card-head"><div class="q-text">' + rich(o.it.q) + '</div>' + auditLine(o.it) +
          '<span class="badge ' + (ok ? 'ok' : '') + '">' + (ok ? '✓ 已掌握' : '待背') + '</span></div>' +
          '<div class="answer-full hidden">' + rich(o.it.a) + '</div>' +
          (o.it.knowledge ? '<details class="knowledge-tip"><summary>关联知识点讲解</summary><div>' + esc(o.it.knowledge) + '</div></details>' : '') +
          '<div class="card-actions"><button class="btn small" data-act="reveal-card">显示答案</button>' +
          '<button class="btn small ' + (ok ? 'on' : '') + '" data-act="master" data-id="' + esc(id) + '">' + (ok ? '✓ 已掌握' : '标记已掌握') + '</button>' +
          '</div></div>';
      });
      h += '</div></details>';
    });
    return h;
  }

  function renderTimeline(sec) {
    var h = '<pre class="poem">' + esc(sec.poem || '') + '</pre><div class="timeline">';
    sec.items.forEach(function (it) {
      h += '<div class="tl-item"><h3>' + esc(it.era) + '　<span class="yr">' + esc(it.year) + '</span></h3>' +
        '<div class="tg">' + esc(it.tag) + '</div></div>';
    });
    return h + '</div>';
  }

  function renderFiles(sec) {
    var h = '<div class="file-list">';
    sec.items.forEach(function (f) {
      if (f.available_online === false) { h += '<div class="file-item file-unavailable"><span class="file-name">📎 ' + esc(f.name) + '</span><span class="file-size">线上暂不可下载</span></div>'; return; }
      h += '<a class="file-item" href="' + esc(f.path) + '" download><span class="file-name">📎 ' + esc(f.name) + '</span>' +
        '<span class="file-size">' + esc(f.size) + '　下载 ⬇</span></a>';
    });
    return h + '</div><p class="muted" style="margin-top:14px;font-size:13px">提示：点击资料名即可下载；PDF 可用浏览器、平板或 PDF 阅读器打开。</p>';
  }

  function renderGallery(sec) {
    var h = '<div class="gallery">';
    sec.items.forEach(function (it) {
      h += '<figure class="slide-fig"><figcaption>' + esc(it.q) + '</figcaption>' +
        '<a class="slide-img-link" href="' + esc(it.src) + '" target="_blank" rel="noopener" title="点击在新标签查看原图">' +
        '<img src="' + esc(it.src) + '" alt="' + esc(it.alt || it.q) + '" loading="lazy"></a>' +
        '<p class="muted slide-tip">点击图片在新标签打开原图，可放大查看</p>';
      if (it.a) {
        h += '<details class="slide-text"><summary>文字要点（按原图逐字转录，可全站搜索）</summary>' +
          '<div class="slide-text-body">' + esc(it.a) + '</div></details>';
      }
      h += '</figure>';
    });
    return h + '</div>';
  }

  var RENDERERS = { notes: renderNotes, fill: renderFill, mcq: renderMcq, qa: renderQa,
                    cards: renderCards, timeline: renderTimeline, files: renderFiles,
                    gallery: renderGallery };

  /* ---------------- 学科页 ---------------- */
  function renderSubject(sub, sec) {
    var path = learningPath(sub);
    var pathIds = path.map(function (p) { return p.id; });
    var h = '<div class="wrap"><div class="sub-head"><a class="back-link" href="#/">← 返回学科总览</a>' +
      '<h1>' + sub.emoji + '　' + esc(sub.name) + '</h1><p>' + esc(sub.sub) + '</p>' +
      '<p class="learning-guide">按自己的节奏：先懂一个小知识点，再记住，再做少量题，最后复盘。</p></div>' +
      '<nav class="tabs path-tabs" aria-label="学习路径">';
    path.forEach(function (item) {
      var active = item.id === sec.id;
      h += '<a class="tab path-tab ' + (active ? 'active' : '') + '" href="#/' + sub.id + '/' + item.id + '"' +
        ' title="' + esc(item.hint) + '"><span>' + item.icon + ' ' + item.label + '</span><small>' + esc(item.hint) + '</small></a>';
    });
    h += '</nav><details class="more-sections"><summary>更多内容 <span>保留全部原有板块</span></summary><nav class="all-tabs" aria-label="全部板块">';
    sectionsOf(sub).forEach(function (s) {
      h += '<a class="all-tab ' + (s.id === sec.id ? 'active' : '') + '" href="#/' + sub.id + '/' + s.id + '">' +
        s.icon + (s.hot ? ' 🔥' : '') + (s.legacy ? ' ⚠️' : '') + ' ' + esc(s.title) + '</a>';
    });
    h += '</nav></details><div class="section-head"><h2>' + (sec.legacy ? '⚠️ ' : '') + esc(sec.title) + '</h2><p>' +
      (sec.legacy ? '<span class="legacy-warning">旧资料/其他版本：不纳入 2026 人教版复习范围，待逐题迁移</span>　' : '') + esc(sec.desc) +
      (sec.source ? '　<span class="source-tag">来源：' + esc(sec.source) + '</span>' : '') + '</p></div>';
    h += (RENDERERS[sec.kind] || function () { return '<p class="muted">暂不支持的板块类型</p>'; })(sec, sub);
    h += figureStrip(sec.figures);
    return h + '</div>';
  }

  /* ---------------- 路由 ---------------- */
  function currentRoute() {
    var raw = location.hash.replace(/^#\/?/, '');
    var parts = raw.split('/');
    var sub = null;
    SUBJECTS.forEach(function (s) { if (s.id === parts[0]) sub = s; });
    if (!sub) return { sub: null, sec: null };
    var sec = null;
    sectionsOf(sub).forEach(function (s) { if (s.id === parts[1]) sec = s; });
    return { sub: sub, sec: sec || byId(sub.id, learningPath(sub)[0].id) };
  }

  var view = { sub: null, sec: null, masked: false, quizFilter: 'all', focusList: [], focusIdx: 0, focusMode: 'cards' };

  function render() {
    var r = currentRoute();
    var routeKey = r.sub ? r.sub.id + '/' + r.sec.id : 'home';
    var oldKey = view.sub ? view.sub.id + '/' + view.sec.id : 'home';
    var sameRoute = routeKey === oldKey;
    var y = sameRoute ? window.scrollY : 0;
    view.sub = r.sub; view.sec = r.sec;
    if (!sameRoute) { view.masked = false; view.quizFilter = 'all'; }
    el('app').innerHTML = r.sub ? renderSubject(r.sub, r.sec) : renderHome();
    if (r.sub) {
      var activeTab = el('app').querySelector('.tab.active');
      if (activeTab && activeTab.scrollIntoView) activeTab.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    document.title = (r.sub ? r.sub.name + ' · ' + r.sec.title + ' · ' : '') + '初一上 · 期中在线复习';
    if (view.masked) {
      var ms = el('app').querySelectorAll('.maskable');
      for (var i = 0; i < ms.length; i++) ms[i].classList.add('masked');
      var mb = el('maskBtn');
      if (mb) { mb.classList.add('on'); mb.textContent = '👁 取消遮罩'; }
    }
    window.scrollTo(0, y);
    updateBackTop();
  }

  /* ---------------- 搜索 ---------------- */
  var SEARCH = [];
  function buildSearch() {
    SUBJECTS.forEach(function (sub) {
      sectionsOf(sub).forEach(function (sec) {
        var add = function (text) {
          if (text && String(text).trim()) SEARCH.push({ sub: sub.id, sec: sec.id,
            subName: sub.name, secTitle: sec.title, text: String(text).replace(/\s+/g, ' ').trim() });
        };
        if (sec.kind === 'notes') sec.groups.forEach(function (g) {
          add(g.title);
          g.blocks.forEach(function (b) {
            add(b.t === 'p' || b.t === 'note' || b.t === 'img' ? b.text || b.cap :
                (b.rows || []).map(function (r) { return r.join(' '); }).join(' '));
          });
        });
        else if (sec.items) sec.items.forEach(function (it) {
          if (it.q) add('第' + (it.no || '') + '题 ' + it.q);
          if (it.a) add(Array.isArray(it.a) ? it.a.join(' ') : it.a);
          if (it.opts) add(it.opts.map(function (o) { return o.k + '.' + o.v; }).join(' '));
          if (it.tip) add(it.tip);
          if (it.era) add(it.era + ' ' + it.year + ' ' + it.tag);
          if (it.name) add(it.name);
          (it.imgs || []).forEach(function (f) { add(f.cap); });
        });
        if (sec.figures) (sec.figures.items || []).forEach(function (f) { add(f.cap); });
        if (sec.poem) add(sec.poem);
      });
    });
  }
  function highlight(text, q) {
    var s = esc(text);
    if (!q) return s;
    var parts = s.split(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'));
    return parts.map(function (p, i) { return i % 2 ? '<mark>' + p + '</mark>' : p; }).join('');
  }
  function runSearch(q) {
    q = q.trim();
    var box = el('searchResults');
    if (!q) { box.innerHTML = '<p class="muted">输入关键词，例如「显微镜」「分封制」「友谊」「经纬网」。</p>'; return; }
    var low = q.toLowerCase(), hits = [];
    for (var i = 0; i < SEARCH.length && hits.length < 50; i++) {
      if (SEARCH[i].text.toLowerCase().indexOf(low) >= 0) hits.push(SEARCH[i]);
    }
    if (!hits.length) { box.innerHTML = '<p class="muted">没有找到「' + esc(q) + '」，换个关键词试试。</p>'; return; }
    box.innerHTML = hits.map(function (h) {
      var pos = Math.max(0, h.text.toLowerCase().indexOf(low) - 40);
      var snip = (pos ? '…' : '') + h.text.slice(pos, pos + 190) + (h.text.length > pos + 190 ? '…' : '');
      return '<a class="search-hit" href="#/' + h.sub + '/' + h.sec + '" data-close-search="1">' +
        '<div class="hit-top">' + esc(h.subName) + ' · ' + esc(h.secTitle) + '</div>' +
        '<div class="hit-txt">' + highlight(snip, q) + '</div></a>';
    }).join('');
  }

  /* ---------------- 抽背浮层 ---------------- */
  function openFocus(mode) {
    var sec = view.sec, sub = view.sub;
    if (!sec || !sub) return;
    view.focusMode = mode;
    view.focusList = sec.items.map(function (it, i) { return { it: it, id: itemId(sub.id, sec.id, i) }; });
    if (!view.focusList.length) return;
    view.focusIdx = Math.floor(Math.random() * view.focusList.length);
    el('focusTitle').textContent = sub.name + ' · ' + sec.title + '（' + view.focusList.length + ' 张）';
    el('focusOverlay').classList.remove('hidden');
    paintFocus(false);
  }
  function paintFocus(reveal) {
    var o = view.focusList[view.focusIdx];
    if (!o) return;
    var q = rich(o.it.q).replace(/＿＿＿＿/g, '<span class="blank">?</span>');
    var a = esc(Array.isArray(o.it.a) ? o.it.a.join('　/　') : o.it.a);
    var ok = !!S.done[o.id];
    el('focusBody').innerHTML = '<div class="fq">' + q + '</div>' +
      '<div class="fa ' + (reveal ? '' : 'hidden') + '" id="focusAnswer">' + a + '</div>' +
      '<div class="card-actions"><button class="btn small ' + (ok ? 'on' : '') + '" data-act="master" data-id="' + esc(o.id) + '">' +
      (ok ? '✓ 已掌握' : '标记已掌握') + '</button><span class="muted" style="align-self:center;font-size:13px">' +
      (view.focusIdx + 1) + ' / ' + view.focusList.length + '</span></div>';
    el('focusReveal').textContent = reveal ? '隐藏答案' : '显示答案';
    el('focusReveal').dataset.shown = reveal ? '1' : '';
  }
  function closeFocus() { el('focusOverlay').classList.add('hidden'); }

  /* ---------------- 事件 ---------------- */
  function updateBackTop() { el('backTop').classList.toggle('show', window.scrollY > 400); }

  function onAction(act, node, ev) {
    var card, id, ans, k, all;
    switch (act) {
      case 'expand':
      case 'collapse':
        all = el('app').querySelectorAll('details.group, .qa details');
        for (var i = 0; i < all.length; i++) all[i].open = (act === 'expand');
        return;
      case 'mask':
        view.masked = !view.masked;
        var ms = el('app').querySelectorAll('.maskable');
        for (var j = 0; j < ms.length; j++) {
          ms[j].classList.toggle('masked', view.masked);
          ms[j].classList.remove('revealed');
        }
        node.classList.toggle('on', view.masked);
        node.textContent = view.masked ? '👁 取消遮罩' : '🫧 遮罩速记';
        return;
      case 'reveal-fill':
        card = node.closest('.card');
        var ansBox = card.querySelector('.answers');
        var full = card.querySelector('.answer-full');
        var show = ansBox.classList.contains('hidden');
        ansBox.classList.toggle('hidden', !show);
        full.classList.toggle('hidden', !show);
        node.textContent = show ? '收起答案' : '显示答案';
        return;
      case 'reveal-card':
        card = node.closest('.card');
        var aBox = card.querySelector('.answer-full');
        var on = aBox.classList.contains('hidden');
        aBox.classList.toggle('hidden', !on);
        node.textContent = on ? '收起答案' : '显示答案';
        return;
      case 'master':
        id = node.dataset.id;
        if (S.done[id]) delete S.done[id]; else S.done[id] = 1;
        saveState();
        var y = window.scrollY;
        render();
        window.scrollTo(0, y);
        if (!el('focusOverlay').classList.contains('hidden')) paintFocus(el('focusReveal').dataset.shown === '1');
        return;
      case 'answer':
        id = node.dataset.id; k = node.dataset.k; ans = node.dataset.ans;
        if (S.quiz[id]) return;
        S.quiz[id] = k;
        if (k === ans) S.done[id] = 1; else delete S.done[id];
        saveState();
        var y2 = window.scrollY;
        render();
        window.scrollTo(0, y2);
        return;
      case 'quiz-filter':
        view.quizFilter = view.quizFilter === 'all' ? 'wrong' : 'all';
        var cards = el('app').querySelectorAll('.quiz-card');
        for (var m = 0; m < cards.length; m++) {
          cards[m].style.display = (view.quizFilter === 'all' || cards[m].dataset.wrong === '1') ? '' : 'none';
        }
        node.textContent = view.quizFilter === 'all' ? '只看错题' : '显示全部';
        node.classList.toggle('on', view.quizFilter === 'wrong');
        return;
      case 'quiz-hot-filter':
        var hotCards = el('app').querySelectorAll('.quiz-card');
        var hotOn = node.classList.toggle('on');
        for (var hm = 0; hm < hotCards.length; hm++) hotCards[hm].style.display = (!hotOn || hotCards[hm].dataset.hot === '1') ? '' : 'none';
        node.textContent = hotOn ? '显示全部' : '只看高频';
        return;
      case 'quiz-reset':
        if (!confirm('确定清空本组选择题的作答记录吗？')) return;
        var sec = view.sec, sub = view.sub;
        sec.items.forEach(function (_, i) { delete S.quiz[itemId(sub.id, sec.id, i)]; delete S.done[itemId(sub.id, sec.id, i)]; });
        saveState(); render();
        return;
      case 'focus':
        openFocus(node.dataset.mode || 'cards');
        return;
    }
  }

  document.addEventListener('click', function (ev) {
    var n = ev.target.closest('[data-act]');
    if (n) { ev.preventDefault(); onAction(n.dataset.act, n, ev); return; }
    var m = ev.target.closest('.maskable.masked');
    if (m) { m.classList.remove('masked'); m.classList.add('revealed'); return; }
    var hit = ev.target.closest('[data-close-search]');
    if (hit) { el('searchOverlay').classList.add('hidden'); return; }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('scroll', updateBackTop, { passive: true });

  el('searchBtn').addEventListener('click', function () {
    el('searchOverlay').classList.remove('hidden');
    el('searchInput').value = ''; runSearch(''); el('searchInput').focus();
  });
  el('searchClose').addEventListener('click', function () { el('searchOverlay').classList.add('hidden'); });
  el('searchOverlay').addEventListener('click', function (e) { if (e.target === this) this.classList.add('hidden'); });
  el('searchInput').addEventListener('input', function () { runSearch(this.value); });
  el('themeBtn').addEventListener('click', function () {
    var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(t); S.theme = t; saveState();
  });
  el('githubLink').href = REPO_URL;
  el('backTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  el('focusClose').addEventListener('click', closeFocus);
  el('focusOverlay').addEventListener('click', function (e) { if (e.target === this) closeFocus(); });
  el('focusReveal').addEventListener('click', function () {
    var a = el('focusAnswer'); if (!a) return;
    var show = a.classList.contains('hidden');
    a.classList.toggle('hidden', !show);
    this.textContent = show ? '隐藏答案' : '显示答案';
    this.dataset.shown = show ? '1' : '';
  });
  el('focusNext').addEventListener('click', function () {
    view.focusIdx = (view.focusIdx + 1) % view.focusList.length; paintFocus(false);
  });
  el('focusPrev').addEventListener('click', function () {
    view.focusIdx = (view.focusIdx - 1 + view.focusList.length) % view.focusList.length; paintFocus(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { el('searchOverlay').classList.add('hidden'); closeFocus(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); el('searchBtn').click(); }
  });

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    el('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙';
  }
  applyTheme(S.theme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  buildSearch();
  render();
})();
