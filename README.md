# FormatPass

毕业论文/期刊论文格式检测工具 — 在浏览器内一键检测 Word 文档格式是否符合学术规范。

**在线体验：** [https://formatpass.vercel.app](https://formatpass.vercel.app)

---

## ✨ 功能特性

### 阶段一（当前版本）

- **📄 上传论文**：支持拖拽或点击上传 `.docx` 格式文件（限制 30MB）
- **📝 填写规则**：通过表单手动设置页面设置、正文格式、标题格式规则
- **🔍 格式检测**：浏览器内实时解析 docx，检测格式合规性
- **📊 检测报告**：分类展示合格/不合格项，支持定位到具体段落
- **📥 导出报告**：一键导出 HTML 或 DOCX 格式的检测报告
- **🔄 重新检测**：支持修改规则后重新检测，无需重新上传文件

### 后续阶段规划

- **阶段二**：上传标准模板自动提取规则、预置常见高校/期刊格式标准库、页面级红绿视觉标注
- **阶段三**：一键自动修正格式问题、导出修改后的 Word/PDF
- **阶段四**：支持 `.doc` 老格式、图表/公式/参考文献格式检测

---

## 🛠 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 14 (App Router) + TypeScript |
| 样式 | Tailwind CSS |
| 解压解析 | JSZip + DOMParser |
| 报告生成 | docx (npm) |
| 测试 | Jest + jsdom |
| 部署 | Vercel (静态导出) |

**架构特点：** 纯前端处理，所有计算在浏览器内完成，零后端服务器成本。

---

## 📁 项目结构

```
app/
├── page.tsx              # 首页 / 上传页
├── rules/page.tsx        # 规则填写页
├── report/page.tsx       # 检测报告页
├── components/           # UI 组件
│   ├── UploadZone.tsx
│   ├── RuleForm.tsx
│   ├── RuleAccordion.tsx
│   ├── ReportView.tsx
│   └── ReportExport.tsx
├── lib/
│   ├── parser/           # docx 解析
│   │   ├── docx-unzip.ts
│   │   ├── xml-extractor.ts
│   │   └── style-resolver.ts
│   ├── engine/           # 规则引擎
│   │   ├── rule-types.ts
│   │   ├── rule-builder.ts
│   │   └── rule-checker.ts
│   ├── exporter/         # 报告导出
│   │   ├── html-exporter.ts
│   │   ├── docx-exporter.ts
│   │   └── format-value.ts
│   └── context/          # 全局状态
│       └── AppContext.tsx
__tests__/                # 测试文件（80+ 测试用例）
```

---

## 🚀 本地开发

```bash
# 克隆项目
git clone git@github.com:Tunnello/FormatPass.git
cd FormatPass

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 生产构建
npm run build
```

---

## 🌐 部署

本项目已配置为静态导出，可直接部署到 Vercel：

```bash
npm run build
npx vercel --prod
```

---

## 🧪 测试覆盖

- **7 个测试套件，80+ 测试用例**
- 单位转换器、规则构建器、XML 提取器、样式解析器、规则检测器、HTML/DOCX 导出器全覆盖

---

## 🎨 设计

UI 设计参考 [Clay Design](https://clay.com) 风格：
- 温暖的奶油白底色（`#fffaf0`）
- 深青色（`#1a3a2a`）作为主按钮色
- 圆角卡片、简洁排版、低认知负担

---

## 📄 License

MIT
