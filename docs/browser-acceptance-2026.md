# 浏览器与响应式验收记录

验收日期：2026-11-14

## 实际加载路由

使用本机 Google Chrome headless 加载本地服务 `http://127.0.0.1:8766/`：

- `#/his/his-pep-core`：历史新版统编核心板块
- `#/geo/geo-pep-core`：地理人教版核心板块
- `#/bio/bio-pep-core`：生物人教版核心板块
- `#/df/df-pep-core`：道德与法治统编核心板块

七条路由均返回页面标题、`main#app`、`nav[aria-label="学科板块"]` 和对应 tab 内容：

- `#/zh/zh-outline`
- `#/math/math-outline`
- `#/math/math-materials`：数学配套资料下载
- `#/eng/eng-outline`
- `#/his/his-pep-core`
- `#/geo/geo-pep-core`
- `#/bio/bio-pep-core`
- `#/df/df-pep-core`
- `#/his/his-pep-hot`
- `#/geo/geo-pep-hot`
- `#/bio/bio-pep-hot`
- `#/df/df-pep-hot`

## 视口检查

- 390 × 844：移动端 tab 栏可横向滚动，正文没有被固定宽度裁断。
- 768 × 1024：iPad 尺寸下 tab、知识卡片和按钮保持可用间距。
- 1440 × 900：PC 尺寸下内容居中，章节卡片和来源信息正常展开。
- 历史、地理、生物、道德与法治的旧校内/旧版本板块标为 `legacy`，继续保留在导航中并显示待迁移提示。

## 复核边界

这是本地静态页面的加载和布局验收，不代表线上部署、真实设备触控和官方试卷数据库已完成核验。逐题纸质教材精确页码、官方题号仍由题目审计状态控制。

- `#/eng/eng-materials`：英语 2024 新人教版复习资料下载
- `#/zh/zh-materials`：语文文言文资料下载
- `#/math/math-materials`：数学配套资料下载
- `#/eng/eng-materials`：英语配套资料下载
