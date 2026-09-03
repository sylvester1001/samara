<div align="center">

# Samara

一个所见即所得的学术表格编辑器。可视化地设计表格，然后一键导出为 LaTeX 代码或高清图片，不用再手写 `tabular` 命令。

![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white&style=flat-square)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![Rust](https://img.shields.io/badge/Rust-1.77-000000?logo=rust&logoColor=white&style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop-3b82f6?style=flat-square)

**[English](README.en.md)**

</div>

---

## 功能特性

| | | |
|---|---|---|
| **学术样式** | **实时预览** | **公式编辑** |
| 内置 `Booktabs`、`Bordered`、`Minimal` 预设，也可以逐项调整边框、字体、间距。 | 右侧预览面板实时渲染表格效果，支持缩放和平移。 | 基于 MathLive 的可视化公式编辑器，配合 KaTeX 渲染 LaTeX 公式。 |
| **高级编辑** | **智能导入** | **多种导出** |
| 合并/拆分单元格、多行表头、自定义规则线、行列尺寸锁定、撤销/重做历史。 | 支持导入 **CSV、TSV、XLSX、XLS**，或直接从 Excel / 网页粘贴表格数据。 | 导出 **LaTeX**（带或不带样式）、**PNG**（96–600 DPI）或 **SVG**。 |

## 截图

![Samara 界面截图](static/UI-screenshot.png)

## 快速开始

### 浏览器（仅 Web）

```bash
# 1. 安装依赖
npm install        # 或: pnpm install / yarn

# 2. 启动开发服务器
npm run dev
```

打开 <http://localhost:5173>（或终端中显示的地址）。

### 桌面应用（Tauri）

Samara 也以桌面应用的形式提供。使用前请先安装 [Tauri 环境依赖](https://v2.tauri.app/start/prerequisites/)（Rust 工具链及平台工具）。

```bash
# 以开发模式运行桌面应用
npm run tauri:dev

# 构建桌面安装包
npm run tauri:build
```

## 使用方法

1. **导入或新建** — 点击 **导入** 加载 CSV/XLSX 文件，或点击 **新建** 创建空白表格。
2. **编辑单元格** — 点击单元格输入，拖拽选择多个单元格，再用编辑工具栏设置加粗、斜体、对齐、文字/背景色以及合并。
3. **设置样式** — 通过左侧栏选择预设、字体、字号、内边距、边框规则、表头行数与画布尺寸。
4. **导出** — 点击 **导出图片**（按所选 DPI 导出 PNG/SVG）或 **导出 LaTeX**（带或不带样式）。

## 开发

### 项目结构

```
samara/
├── src/                     # Svelte 5 前端
│   ├── lib/
│   │   ├── components/      # UI 及表格编辑组件
│   │   │   ├── table/       # AcademicTable、单元格、行列缩放
│   │   │   ├── math/        # MathLive 公式对话框
│   │   │   └── ui/          # shadcn-svelte 风格 UI 组件
│   │   ├── stores/          # 中央表格状态及撤销/重做历史
│   │   ├── utils/           # LaTeX 处理、导入、导出工具
│   │   └── types.ts         # 核心数据模型（Cell、TableData、样式等）
│   └── routes/              # SvelteKit 路由（落地页 + 编辑器）
├── src-tauri/               # Tauri（Rust）桌面壳
├── static/                  # 静态资源（图标、截图）
├── svelte.config.js         # SvelteKit（adapter-static）配置
├── vite.config.ts           # Vite + Tailwind CSS 配置
├── components.json          # shadcn-svelte 配置
└── package.json
```

### 核心架构

编辑逻辑集中在单一的响应式 Store — [`src/lib/stores/table.svelte.ts`](src/lib/stores/table.svelte.ts) — 负责表格数据、样式、选区以及完整的撤销/重做历史。编辑器与预览区都渲染自同一份数据。

- **渲染** — [`AcademicTable.svelte`](src/lib/components/table/AcademicTable.svelte) 根据所选样式（字体、边框、内边距、规则线）绘制表格。
- **LaTeX 导出** — [`export-latex.ts`](src/lib/utils/export-latex.ts) 生成 `tabular` 代码，把视觉样式映射为 `\toprule`、`\midrule`、`\bottomrule`、`\multirow`、`\multicolumn`、`\makecell` 等命令。
- **导入 / 粘贴** — [`import.ts`](src/lib/utils/import.ts) 解析 CSV/TSV/Excel/HTML 表格剪贴板数据。
- **公式** — [`FormulaDialog.svelte`](src/lib/components/math/FormulaDialog.svelte) 提供可视化公式编辑器，向单元格插入 `$…$` LaTeX。

### 常用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建静态生产包 |
| `npm run preview` | 本地预览生产构建 |
| `npm run check` | 使用 `svelte-check` 进行类型检查 |
| `npm run tauri:dev` | 开发模式运行 Tauri 桌面应用 |
| `npm run tauri:build` | 构建 Tauri 桌面应用 |

## 技术栈

- **[Svelte 5](https://svelte.dev)** — 基于 Runes 的响应式前端框架
- **[SvelteKit](https://kit.svelte.dev)** — 使用 `adapter-static` 的元框架
- **[Tauri 2](https://v2.tauri.app)** — 轻量桌面外壳（Rust 后端）
- **[Tailwind CSS 4](https://tailwindcss.com)** — 样式
- **[shadcn-svelte](https://www.shadcn-svelte.com)** — UI 组件
- **[MathLive](https://cortexjs.io/mathlive/)** + **[KaTeX](https://katex.org)** — 公式编辑与渲染
- **[PapaParse](https://www.papaparse.com)** / **[SheetJS](https://sheetjs.com)** — CSV / Excel 解析
- **[html-to-image](https://github.com/bubkoo/html-to-image)** — PNG / SVG 导出

## 路线图

- [x] 表格创建、编辑与单元格合并
- [x] 学术样式预设（Booktabs / Bordered / Minimal）
- [x] LaTeX 导出（普通 + 带样式）
- [x] PNG / SVG 图片导出
- [x] CSV / Excel 导入与粘贴
- [x] 公式插入（MathLive）
- [ ] 原生文件保存 / 打开（`.samara`）
- [ ] 样式历史的撤销 / 重做
- [ ] 更多画布预设与对齐参考线

## 参与贡献

欢迎提交 [issue](../../issues) 或 [pull request](../../pulls)。

1. Fork 本仓库。
2. 创建功能分支：`git checkout -b feat/my-feature`。
3. 提交更改：`git commit -m 'feat: add my feature'`。
4. 推送到分支并提交 PR。

## License

采用 MIT 许可证。详见 [`LICENSE`](LICENSE)。
