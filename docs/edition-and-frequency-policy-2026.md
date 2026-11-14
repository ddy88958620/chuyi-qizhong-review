# 2026 七年级教材与高频题型口径

## 四科教材版本

历史使用统编《义务教育教科书·历史》七年级上册，地理和生物使用人教版 2024 秋修订教材，道德与法治使用统编版 2024 秋修订教材。教育部 2024 国家课程教学用书目录与人民教育出版社教材介绍是版本上位依据。

站内 `*-pep-scope` 和 `*-pep-core` 板块按官方目录与教材介绍整理；旧校内资料或旧版本资料保留时必须在学科副标题、来源和审核文档中标注迁移状态。

## 逐题核验字段

历史、地理、生物、道德与法治的题目保留：`edition`、`textbook_ref`、`paper_page`、`textbook_source_url`、`textbook_page_index_url`、`exam_source`、`exam_evidence_level`、`official_database_status`、`official_exam_question_no`、`source_url`、`region_scope`、`frequency_source_urls`、`frequency_source_count`、`frequency_method`、`status`。题目显示“待逐题核验”时，不得在产品文案中写成已完成教材对照或官方统计。

## 高频题型

“近三年公开试卷样式高频题型”表示对 2024—2026 年公开可见的七年级上册期中、期末、月考和同步题中常见命题形式做归纳；来源范围包括河北省内使用同一教材版本的地区和学校。每道 `hot:true` 题目都记录来源池和来源数量，来源池只用于复核样式，不代表出现次数、官方频次或真实试题命中。公开学校试卷来源和版本门槛见 `docs/official-source-registry-2026.md`。

## 已核验状态门槛

`status: verified` 只有在同一题同时具备纸质教材精确页码、可复核试卷原件题号、明确版本证据和官方数据库状态时才允许使用。章节起始页、“待复核”页码、公开教辅题号或“未找到官方数据库”均不能升级为已核验；测试脚本会拦截这些状态。

## 内容结构约束

四科必须保留以下板块类型，才能接入现有渲染、判分和掌握情况逻辑：

- `notes`：知识要点
- `cards`：抽背卡或高频题型卡
- `fill`：填空自测
- `mcq`：选择题即时判分
- `qa`：答案或解答对照

任何新增内容先通过 `tests/test_subject_data.py`，再进行静态资源检查和浏览器端答题回归测试。
