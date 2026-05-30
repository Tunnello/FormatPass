# 毕业论文格式检测工具 — 阶段一实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并部署一个纯前端的 Next.js Web 应用，允许用户上传 `.docx` 论文、手动填写格式规则、在浏览器内完成解析与检测，并导出 HTML/DOCX 检测报告。

**Architecture:** 客户端处理全部逻辑（JSZip 解压 docx → DOMParser 解析 XML → 自定义引擎比对规则 → 生成报告），Vercel 仅做静态托管。状态通过 React Context 在三页之间共享。

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + jszip + docx + Jest (jsdom)

---

## 文件结构总览

```
app/
├── page.tsx                          # 首页 / 上传页
├── layout.tsx                        # 根布局（字体、全局样式、Context Provider）
├── globals.css                       # Tailwind + Clay 设计令牌
├── rules/
│   └── page.tsx                      # 规则填写页
├── report/
│   └── page.tsx                      # 检测报告页
├── components/
│   ├── UploadZone.tsx                # 拖拽上传区域
│   ├── RuleForm.tsx                  # 规则表单（三大折叠卡片）
│   ├── RuleAccordion.tsx             # 折叠卡片容器
│   ├── ReportView.tsx                # 报告展示
│   ├── ReportExport.tsx              # 导出按钮组（HTML / DOCX）
│   └── ProgressBar.tsx               # 解析进度条
├── lib/
│   ├── parser/
│   │   ├── docx-unzip.ts             # JSZip 解压
│   │   ├── xml-extractor.ts          # XML 提取与结构化
│   │   └── style-resolver.ts         # 样式继承解析
│   ├── engine/
│   │   ├── rule-types.ts             # 规则 TS 类型
│   │   ├── rule-builder.ts           # 表单 → 规则数组
│   │   └── rule-checker.ts           # 核心比对逻辑
│   ├── exporter/
│   │   ├── html-exporter.ts          # HTML 报告生成
│   │   └── docx-exporter.ts          # DOCX 报告生成
│   ├── utils/
│   │   └── unit-converter.ts         # twip/pt/cm 互转
│   └── context/
│       └── AppContext.tsx            # 全局状态（文件、规则、报告）
__tests__/
├── lib/
│   ├── utils/
│   │   └── unit-converter.test.ts
│   ├── parser/
│   │   ├── xml-extractor.test.ts
│   │   └── style-resolver.test.ts
│   ├── engine/
│   │   ├── rule-builder.test.ts
│   │   └── rule-checker.test.ts
│   └── exporter/
│       ├── html-exporter.test.ts
│       └── docx-exporter.test.ts
public/
next.config.js
tailwind.config.ts
postcss.config.mjs
tsconfig.json
jest.config.js
package.json
```

---

## Task 1: 项目初始化与配置

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `next.config.js`
- Create: `jest.config.js`
- Create: `next-env.d.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: 创建 package.json**

Write `package.json`:

```json
{
  "name": "formatpass",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "jszip": "^3.10.1",
    "docx": "^8.5.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.2.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: 创建 tsconfig.json**

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: 创建 Tailwind & PostCSS 配置**

Write `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#fffaf0',
        'surface-soft': '#faf5e8',
        'surface-card': '#f5f0e0',
        'surface-strong': '#ebe6d6',
        ink: '#0a0a0a',
        'body-text': '#3a3a3a',
        'body-strong': '#1a1a1a',
        muted: '#6a6a6a',
        'muted-soft': '#9a9a9a',
        accent: '#1a3a2a',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}
export default config
```

Write `postcss.config.mjs`:

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
export default config
```

- [ ] **Step 5: 创建 Next.js 与 Jest 配置**

Write `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
}
module.exports = nextConfig
```

Write `jest.config.js`:

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/'],
}
```

- [ ] **Step 6: 创建类型声明与根布局**

Write `next-env.d.ts`:

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

Write `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FormatPass - 毕业论文格式检测',
  description: '上传论文，一键排查格式问题',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-canvas text-ink`}>
        {children}
      </body>
    </html>
  )
}
```

Write `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased;
  }
}
```

- [ ] **Step 7: 验证开发服务器可启动**

Run: `npx next dev --port 3000`

Expected: Server starts, `Ready on http://localhost:3000` in output.
Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js project with Tailwind and Jest"
```

---

## Task 2: 单位转换器（TDD）

**Files:**
- Create: `lib/utils/unit-converter.ts`
- Create: `__tests__/lib/utils/unit-converter.test.ts`

- [ ] **Step 1: 编写失败测试**

Write `__tests__/lib/utils/unit-converter.test.ts`:

```typescript
import {
  twipToCm,
  cmToTwip,
  twipToPt,
  ptToTwip,
  halfPointToPt,
  ptToHalfPoint,
} from '@/lib/utils/unit-converter'

describe('unit-converter', () => {
  test('twipToCm converts 1440 twips to ~2.54 cm', () => {
    expect(twipToCm(1440)).toBeCloseTo(2.54, 4)
  })

  test('cmToTwip converts 2.54 cm to 1440 twips', () => {
    expect(cmToTwip(2.54)).toBe(1440)
  })

  test('twipToPt converts 240 twips to 12 pt', () => {
    expect(twipToPt(240)).toBe(12)
  })

  test('ptToTwip converts 12 pt to 240 twips', () => {
    expect(ptToTwip(12)).toBe(240)
  })

  test('halfPointToPt converts 24 half-points to 12 pt', () => {
    expect(halfPointToPt(24)).toBe(12)
  })

  test('ptToHalfPoint converts 12 pt to 24 half-points', () => {
    expect(ptToHalfPoint(12)).toBe(24)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest __tests__/lib/utils/unit-converter.test.ts -v`

Expected: FAIL, errors like "Cannot find module '@/lib/utils/unit-converter'"

- [ ] **Step 3: 实现最小代码**

Write `lib/utils/unit-converter.ts`:

```typescript
export function twipToCm(twip: number): number {
  return (twip * 2.54) / 1440
}

export function cmToTwip(cm: number): number {
  return Math.round((cm * 1440) / 2.54)
}

export function twipToPt(twip: number): number {
  return twip / 20
}

export function ptToTwip(pt: number): number {
  return Math.round(pt * 20)
}

export function halfPointToPt(hp: number): number {
  return hp / 2
}

export function ptToHalfPoint(pt: number): number {
  return Math.round(pt * 2)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest __tests__/lib/utils/unit-converter.test.ts -v`

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add unit converter for twip/pt/cm"
```

---

## Task 3: 规则引擎类型定义与规则构建器（TDD）

**Files:**
- Create: `lib/engine/rule-types.ts`
- Create: `lib/engine/rule-builder.ts`
- Create: `__tests__/lib/engine/rule-builder.test.ts`

- [ ] **Step 1: 编写规则类型**

Write `lib/engine/rule-types.ts`:

```typescript
export interface FormatRule {
  id: string
  category: 'page' | 'body' | 'heading'
  name: string
  target: RuleTarget
  expected: RuleValue
  actual?: RuleValue
  status: 'pending' | 'pass' | 'fail'
  location?: string
}

export type RuleTarget =
  | { type: 'page-margin'; side: 'top' | 'bottom' | 'left' | 'right' }
  | { type: 'page-size'; dimension: 'width' | 'height' }
  | { type: 'page-orientation' }
  | { type: 'font'; scope: 'body' | 'heading'; level?: number; script: 'ascii' | 'eastAsia' }
  | { type: 'font-size'; scope: 'body' | 'heading'; level?: number; script: 'ascii' | 'eastAsia' }
  | { type: 'paragraph-spacing'; scope: 'body' | 'heading'; level?: number; kind: 'before' | 'after' | 'line' }
  | { type: 'alignment'; scope: 'body' | 'heading'; level?: number }

export type RuleValue =
  | { kind: 'length'; value: number; unit: 'cm' | 'pt' | 'twip' }
  | { kind: 'string'; value: string }
  | { kind: 'enum'; value: string }
  | { kind: 'lineSpacing'; value: number; rule: 'auto' | 'exact' }

export interface RuleFormData {
  page: {
    marginTop: number
    marginBottom: number
    marginLeft: number
    marginRight: number
    paperSize: 'A4' | 'Letter' | 'A3'
    orientation: 'portrait' | 'landscape'
  }
  body: {
    fontCn: string
    fontEn: string
    fontSize: string
    lineSpacing: string
    spaceBefore: number
    spaceAfter: number
  }
  headings: {
    level: number
    font: string
    fontSize: string
    spaceBefore: number
    spaceAfter: number
    alignment: string
  }[]
}
```

- [ ] **Step 2: 编写失败测试**

Write `__tests__/lib/engine/rule-builder.test.ts`:

```typescript
import { buildRulesFromForm } from '@/lib/engine/rule-builder'
import { RuleFormData } from '@/lib/engine/rule-types'

describe('rule-builder', () => {
  const minimalForm: RuleFormData = {
    page: {
      marginTop: 2.54,
      marginBottom: 2.54,
      marginLeft: 3.17,
      marginRight: 3.17,
      paperSize: 'A4',
      orientation: 'portrait',
    },
    body: {
      fontCn: '宋体',
      fontEn: 'Times New Roman',
      fontSize: '12pt',
      lineSpacing: '1.5',
      spaceBefore: 0,
      spaceAfter: 0,
    },
    headings: [
      { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
    ],
  }

  test('builds rules from form data', () => {
    const rules = buildRulesFromForm(minimalForm)
    expect(rules.length).toBeGreaterThan(0)
    expect(rules.some((r) => r.category === 'page')).toBe(true)
    expect(rules.some((r) => r.category === 'body')).toBe(true)
    expect(rules.some((r) => r.category === 'heading')).toBe(true)
  })

  test('page margin rules have correct targets', () => {
    const rules = buildRulesFromForm(minimalForm)
    const topMargin = rules.find((r) => r.target.type === 'page-margin' && r.target.side === 'top')
    expect(topMargin).toBeDefined()
    expect(topMargin!.expected).toEqual({ kind: 'length', value: 2.54, unit: 'cm' })
  })

  test('heading rules include level in target', () => {
    const rules = buildRulesFromForm(minimalForm)
    const h1Font = rules.find(
      (r) => r.target.type === 'font' && r.target.scope === 'heading' && r.target.level === 1
    )
    expect(h1Font).toBeDefined()
    expect(h1Font!.expected).toEqual({ kind: 'string', value: '黑体' })
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npx jest __tests__/lib/engine/rule-builder.test.ts -v`

Expected: FAIL, module not found

- [ ] **Step 4: 实现规则构建器**

Write `lib/engine/rule-builder.ts`:

```typescript
import { FormatRule, RuleFormData } from './rule-types'

export function buildRulesFromForm(form: RuleFormData): FormatRule[] {
  const rules: FormatRule[] = []

  // Page rules
  rules.push(
    {
      id: 'page-margin-top',
      category: 'page',
      name: '页边距-上',
      target: { type: 'page-margin', side: 'top' },
      expected: { kind: 'length', value: form.page.marginTop, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-bottom',
      category: 'page',
      name: '页边距-下',
      target: { type: 'page-margin', side: 'bottom' },
      expected: { kind: 'length', value: form.page.marginBottom, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-left',
      category: 'page',
      name: '页边距-左',
      target: { type: 'page-margin', side: 'left' },
      expected: { kind: 'length', value: form.page.marginLeft, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-margin-right',
      category: 'page',
      name: '页边距-右',
      target: { type: 'page-margin', side: 'right' },
      expected: { kind: 'length', value: form.page.marginRight, unit: 'cm' },
      status: 'pending',
    },
    {
      id: 'page-orientation',
      category: 'page',
      name: '页面方向',
      target: { type: 'page-orientation' },
      expected: { kind: 'enum', value: form.page.orientation },
      status: 'pending',
    }
  )

  // Paper size expected dimensions
  const paperDimensions: Record<string, { width: number; height: number }> = {
    A4: { width: 21.0, height: 29.7 },
    Letter: { width: 21.59, height: 27.94 },
    A3: { width: 29.7, height: 42.0 },
  }
  const dim = paperDimensions[form.page.paperSize]
  if (dim) {
    rules.push(
      {
        id: 'page-size-width',
        category: 'page',
        name: '纸张宽度',
        target: { type: 'page-size', dimension: 'width' },
        expected: { kind: 'length', value: dim.width, unit: 'cm' },
        status: 'pending',
      },
      {
        id: 'page-size-height',
        category: 'page',
        name: '纸张高度',
        target: { type: 'page-size', dimension: 'height' },
        expected: { kind: 'length', value: dim.height, unit: 'cm' },
        status: 'pending',
      }
    )
  }

  // Body rules
  rules.push(
    {
      id: 'body-font-cn',
      category: 'body',
      name: '正文字体-中文',
      target: { type: 'font', scope: 'body', script: 'eastAsia' },
      expected: { kind: 'string', value: form.body.fontCn },
      status: 'pending',
    },
    {
      id: 'body-font-en',
      category: 'body',
      name: '正文字体-西文',
      target: { type: 'font', scope: 'body', script: 'ascii' },
      expected: { kind: 'string', value: form.body.fontEn },
      status: 'pending',
    },
    {
      id: 'body-font-size',
      category: 'body',
      name: '正文字号',
      target: { type: 'font-size', scope: 'body', script: 'eastAsia' },
      expected: { kind: 'length', value: parseFloat(form.body.fontSize), unit: 'pt' },
      status: 'pending',
    },
    {
      id: 'body-line-spacing',
      category: 'body',
      name: '正文行距',
      target: { type: 'paragraph-spacing', scope: 'body', kind: 'line' },
      expected: parseLineSpacing(form.body.lineSpacing),
      status: 'pending',
    },
    {
      id: 'body-space-before',
      category: 'body',
      name: '正文段前间距',
      target: { type: 'paragraph-spacing', scope: 'body', kind: 'before' },
      expected: { kind: 'length', value: form.body.spaceBefore, unit: 'pt' },
      status: 'pending',
    },
    {
      id: 'body-space-after',
      category: 'body',
      name: '正文段后间距',
      target: { type: 'paragraph-spacing', scope: 'body', kind: 'after' },
      expected: { kind: 'length', value: form.body.spaceAfter, unit: 'pt' },
      status: 'pending',
    }
  )

  // Heading rules
  for (const h of form.headings) {
    const prefix = `heading-${h.level}`
    rules.push(
      {
        id: `${prefix}-font`,
        category: 'heading',
        name: `${h.level}级标题字体`,
        target: { type: 'font', scope: 'heading', level: h.level, script: 'eastAsia' },
        expected: { kind: 'string', value: h.font },
        status: 'pending',
      },
      {
        id: `${prefix}-font-size`,
        category: 'heading',
        name: `${h.level}级标题字号`,
        target: { type: 'font-size', scope: 'heading', level: h.level, script: 'eastAsia' },
        expected: { kind: 'length', value: parseFloat(h.fontSize), unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-space-before`,
        category: 'heading',
        name: `${h.level}级标题段前间距`,
        target: { type: 'paragraph-spacing', scope: 'heading', level: h.level, kind: 'before' },
        expected: { kind: 'length', value: h.spaceBefore, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-space-after`,
        category: 'heading',
        name: `${h.level}级标题段后间距`,
        target: { type: 'paragraph-spacing', scope: 'heading', level: h.level, kind: 'after' },
        expected: { kind: 'length', value: h.spaceAfter, unit: 'pt' },
        status: 'pending',
      },
      {
        id: `${prefix}-alignment`,
        category: 'heading',
        name: `${h.level}级标题对齐方式`,
        target: { type: 'alignment', scope: 'heading', level: h.level },
        expected: { kind: 'enum', value: h.alignment },
        status: 'pending',
      }
    )
  }

  return rules
}

function parseLineSpacing(value: string) {
  if (value.startsWith('固定值')) {
    const num = parseFloat(value.replace('固定值', '').trim())
    return { kind: 'lineSpacing' as const, value: num, rule: 'exact' as const }
  }
  return { kind: 'lineSpacing' as const, value: parseFloat(value), rule: 'auto' as const }
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx jest __tests__/lib/engine/rule-builder.test.ts -v`

Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add rule types and rule builder from form data"
```

---

## Task 4: DOCX XML 提取器（TDD）

**Files:**
- Create: `lib/parser/xml-extractor.ts`
- Create: `__tests__/lib/parser/xml-extractor.test.ts`

- [ ] **Step 1: 编写失败测试**

Write `__tests__/lib/parser/xml-extractor.test.ts`:

```typescript
import { extractDocument, extractStyles } from '@/lib/parser/xml-extractor'

describe('xml-extractor', () => {
  const sampleDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
      <w:r><w:t>Hello world</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Chapter 1</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>
      <w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800"/>
    </w:sectPr>
  </w:body>
</w:document>`

  test('extracts paragraphs from document.xml', () => {
    const doc = extractDocument(sampleDocumentXml)
    expect(doc.paragraphs.length).toBe(2)
    expect(doc.paragraphs[0].text).toBe('Hello world')
    expect(doc.paragraphs[1].text).toBe('Chapter 1')
  })

  test('extracts page setup from sectPr', () => {
    const doc = extractDocument(sampleDocumentXml)
    expect(doc.pageSetup.width).toBe(11906)
    expect(doc.pageSetup.height).toBe(16838)
    expect(doc.pageSetup.orientation).toBe('portrait')
    expect(doc.pageSetup.marginTop).toBe(1440)
    expect(doc.pageSetup.marginRight).toBe(1800)
  })

  test('extracts heading style id', () => {
    const doc = extractDocument(sampleDocumentXml)
    expect(doc.paragraphs[0].styleId).toBe('Normal')
    expect(doc.paragraphs[1].styleId).toBe('Heading1')
  })

  const sampleStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="宋体"/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="黑体"/><w:sz w:val="32"/></w:rPr>
  </w:style>
</w:styles>`

  test('extracts styles from styles.xml', () => {
    const styles = extractStyles(sampleStylesXml)
    expect(styles.has('Normal')).toBe(true)
    expect(styles.has('Heading1')).toBe(true)
    const h1 = styles.get('Heading1')!
    expect(h1.basedOn).toBe('Normal')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest __tests__/lib/parser/xml-extractor.test.ts -v`

Expected: FAIL, module not found

- [ ] **Step 3: 实现 XML 提取器**

Write `lib/parser/xml-extractor.ts`:

```typescript
const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

export interface ParagraphData {
  text: string
  styleId?: string
  outlineLvl?: number
  pPr: Element | null
  rPr: Element | null
}

export interface StyleData {
  styleId: string
  name?: string
  type: string
  basedOn?: string
  isDefault?: boolean
  pPr: Element | null
  rPr: Element | null
}

export interface PageSetup {
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
}

export interface ExtractedDocument {
  paragraphs: ParagraphData[]
  pageSetup: PageSetup
  defaultStyles: {
    pPr: Element | null
    rPr: Element | null
  }
}

export function extractDocument(xmlString: string): ExtractedDocument {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  const body = doc.getElementsByTagNameNS(NS, 'body')[0]
  const paragraphs: ParagraphData[] = []

  if (body) {
    const pElements = body.getElementsByTagNameNS(NS, 'p')
    for (let i = 0; i < pElements.length; i++) {
      const p = pElements[i]
      paragraphs.push(parseParagraph(p))
    }
  }

  const sectPr = doc.getElementsByTagNameNS(NS, 'sectPr')[0]
  const pageSetup = parsePageSetup(sectPr)

  const docDefaults = doc.getElementsByTagNameNS(NS, 'docDefaults')[0]
  const defaultStyles = {
    pPr: docDefaults?.getElementsByTagNameNS(NS, 'pPrDefault')[0]?.getElementsByTagNameNS(NS, 'pPr')[0] ?? null,
    rPr: docDefaults?.getElementsByTagNameNS(NS, 'rPrDefault')[0]?.getElementsByTagNameNS(NS, 'rPr')[0] ?? null,
  }

  return { paragraphs, pageSetup, defaultStyles }
}

function parseParagraph(p: Element): ParagraphData {
  const pPr = p.getElementsByTagNameNS(NS, 'pPr')[0] ?? null
  const runs = p.getElementsByTagNameNS(NS, 'r')
  const texts: string[] = []
  let runRPr: Element | null = null

  for (let i = 0; i < runs.length; i++) {
    const r = runs[i]
    const tNodes = r.getElementsByTagNameNS(NS, 't')
    for (let j = 0; j < tNodes.length; j++) {
      texts.push(tNodes[j].textContent || '')
    }
    if (!runRPr) {
      runRPr = r.getElementsByTagNameNS(NS, 'rPr')[0] ?? null
    }
  }

  const styleId = pPr?.getElementsByTagNameNS(NS, 'pStyle')[0]?.getAttributeNS(NS, 'val') || undefined
  const outlineLvlNode = pPr?.getElementsByTagNameNS(NS, 'outlineLvl')[0]
  const outlineLvl = outlineLvlNode ? parseInt(outlineLvlNode.getAttributeNS(NS, 'val') || '0', 10) : undefined

  return {
    text: texts.join(''),
    styleId,
    outlineLvl,
    pPr,
    rPr: runRPr,
  }
}

function parsePageSetup(sectPr: Element | undefined): PageSetup {
  const defaultSetup: PageSetup = {
    width: 11906,
    height: 16838,
    orientation: 'portrait',
    marginTop: 1440,
    marginBottom: 1440,
    marginLeft: 1440,
    marginRight: 1440,
  }

  if (!sectPr) return defaultSetup

  const pgSz = sectPr.getElementsByTagNameNS(NS, 'pgSz')[0]
  const pgMar = sectPr.getElementsByTagNameNS(NS, 'pgMar')[0]

  if (pgSz) {
    defaultSetup.width = parseInt(pgSz.getAttributeNS(NS, 'w') || '11906', 10)
    defaultSetup.height = parseInt(pgSz.getAttributeNS(NS, 'h') || '16838', 10)
    const orient = pgSz.getAttributeNS(NS, 'orient')
    if (orient === 'landscape') defaultSetup.orientation = 'landscape'
  }

  if (pgMar) {
    defaultSetup.marginTop = parseInt(pgMar.getAttributeNS(NS, 'top') || '1440', 10)
    defaultSetup.marginBottom = parseInt(pgMar.getAttributeNS(NS, 'bottom') || '1440', 10)
    defaultSetup.marginLeft = parseInt(pgMar.getAttributeNS(NS, 'left') || '1440', 10)
    defaultSetup.marginRight = parseInt(pgMar.getAttributeNS(NS, 'right') || '1440', 10)
  }

  return defaultSetup
}

export function extractStyles(xmlString: string): Map<string, StyleData> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const styles = new Map<string, StyleData>()

  const styleElements = doc.getElementsByTagNameNS(NS, 'style')
  for (let i = 0; i < styleElements.length; i++) {
    const s = styleElements[i]
    const styleId = s.getAttributeNS(NS, 'styleId') || ''
    const type = s.getAttributeNS(NS, 'type') || ''
    const isDefault = s.hasAttributeNS(NS, 'default')
    const nameNode = s.getElementsByTagNameNS(NS, 'name')[0]
    const name = nameNode?.getAttributeNS(NS, 'val') || undefined
    const basedOn = s.getElementsByTagNameNS(NS, 'basedOn')[0]?.getAttributeNS(NS, 'val') || undefined
    const pPr = s.getElementsByTagNameNS(NS, 'pPr')[0] ?? null
    const rPr = s.getElementsByTagNameNS(NS, 'rPr')[0] ?? null

    styles.set(styleId, { styleId, name, type, basedOn, isDefault, pPr, rPr })
  }

  return styles
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest __tests__/lib/parser/xml-extractor.test.ts -v`

Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add DOCX XML extractor for document, styles and page setup"
```

---

## Task 5: 样式继承解析器（TDD）

**Files:**
- Create: `lib/parser/style-resolver.ts`
- Create: `__tests__/lib/parser/style-resolver.test.ts`

- [ ] **Step 1: 编写失败测试**

Write `__tests__/lib/parser/style-resolver.test.ts`:

```typescript
import { resolveEffectiveStyle } from '@/lib/parser/style-resolver'
import { StyleData } from '@/lib/parser/xml-extractor'

describe('style-resolver', () => {
  const mockStyles = new Map<string, StyleData>()

  beforeEach(() => {
    mockStyles.clear()
    const normalRPr = new DOMParser().parseFromString(
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:styleId="Normal"><w:rPr><w:sz w:val="24"/></w:rPr></w:style></w:styles>',
      'application/xml'
    ).getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'style')[0].getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'rPr')[0]

    mockStyles.set('Normal', {
      styleId: 'Normal',
      type: 'paragraph',
      name: 'Normal',
      rPr: normalRPr,
      pPr: null,
    })
  })

  test('resolves font size from paragraph rPr directly', () => {
    const pRPr = new DOMParser().parseFromString(
      '<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:sz w:val="28"/></w:rPr>',
      'application/xml'
    ).documentElement

    const result = resolveEffectiveStyle({ rPr: pRPr, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBe(28)
  })

  test('falls back to style rPr when paragraph has no direct formatting', () => {
    const result = resolveEffectiveStyle({ rPr: null, styleId: 'Normal' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBe(24)
  })

  test('returns null for missing properties', () => {
    const result = resolveEffectiveStyle({ rPr: null, styleId: 'Unknown' }, mockStyles, { pPr: null, rPr: null })
    expect(result.fontSize).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest __tests__/lib/parser/style-resolver.test.ts -v`

Expected: FAIL

- [ ] **Step 3: 实现样式解析器**

Write `lib/parser/style-resolver.ts`:

```typescript
import { StyleData } from './xml-extractor'

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

export interface EffectiveStyle {
  fontSize: number | null
  fontAscii: string | null
  fontEastAsia: string | null
  bold: boolean | null
  italic: boolean | null
  alignment: string | null
  spaceBefore: number | null
  spaceAfter: number | null
  lineSpacing: { value: number; rule: 'auto' | 'exact' } | null
}

export function resolveEffectiveStyle(
  paragraph: { rPr: Element | null; styleId?: string },
  styles: Map<string, StyleData>,
  docDefaults: { pPr: Element | null; rPr: Element | null }
): EffectiveStyle {
  return {
    fontSize: resolveNumericProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'sz'),
    fontAscii: resolveStringProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'rFonts', 'ascii'),
    fontEastAsia: resolveStringProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'rFonts', 'eastAsia'),
    bold: resolveBoolProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'b'),
    italic: resolveBoolProp(paragraph.rPr, styles.get(paragraph.styleId || '')?.rPr, docDefaults.rPr, 'i'),
    alignment: null, // resolved from pPr, not rPr
    spaceBefore: null,
    spaceAfter: null,
    lineSpacing: null,
  }
}

export function resolveParagraphStyle(
  pPr: Element | null,
  styleId: string | undefined,
  styles: Map<string, StyleData>,
  docDefaults: { pPr: Element | null }
): Pick<EffectiveStyle, 'alignment' | 'spaceBefore' | 'spaceAfter' | 'lineSpacing'> {
  const stylePPr = styles.get(styleId || '')?.pPr
  const defaultPPr = docDefaults.pPr

  const spacingNode =
    pPr?.getElementsByTagNameNS(NS, 'spacing')[0] ||
    stylePPr?.getElementsByTagNameNS(NS, 'spacing')[0] ||
    defaultPPr?.getElementsByTagNameNS(NS, 'spacing')[0] ||
    null

  let lineSpacing: { value: number; rule: 'auto' | 'exact' } | null = null
  if (spacingNode) {
    const line = spacingNode.getAttributeNS(NS, 'line')
    const lineRule = spacingNode.getAttributeNS(NS, 'lineRule')
    if (line) {
      lineSpacing = {
        value: parseInt(line, 10),
        rule: lineRule === 'exact' ? 'exact' : 'auto',
      }
    }
  }

  return {
    alignment:
      pPr?.getElementsByTagNameNS(NS, 'jc')[0]?.getAttributeNS(NS, 'val') ||
      stylePPr?.getElementsByTagNameNS(NS, 'jc')[0]?.getAttributeNS(NS, 'val') ||
      null,
    spaceBefore:
      resolveAttrFromChain(spacingNode, 'before') ||
      resolveAttrFromChain(stylePPr?.getElementsByTagNameNS(NS, 'spacing')[0], 'before') ||
      null,
    spaceAfter:
      resolveAttrFromChain(spacingNode, 'after') ||
      resolveAttrFromChain(stylePPr?.getElementsByTagNameNS(NS, 'spacing')[0], 'after') ||
      null,
    lineSpacing,
  }
}

function resolveNumericProp(
  direct: Element | null,
  style: Element | null | undefined,
  defaultVal: Element | null,
  tag: string
): number | null {
  const val =
    direct?.getElementsByTagNameNS(NS, tag)[0]?.getAttributeNS(NS, 'val') ||
    style?.getElementsByTagNameNS(NS, tag)[0]?.getAttributeNS(NS, 'val') ||
    defaultVal?.getElementsByTagNameNS(NS, tag)[0]?.getAttributeNS(NS, 'val')
  return val ? parseInt(val, 10) : null
}

function resolveStringProp(
  direct: Element | null,
  style: Element | null | undefined,
  defaultVal: Element | null,
  tag: string,
  attr: string
): string | null {
  const node =
    direct?.getElementsByTagNameNS(NS, tag)[0] ||
    style?.getElementsByTagNameNS(NS, tag)[0] ||
    defaultVal?.getElementsByTagNameNS(NS, tag)[0]
  return node?.getAttributeNS(NS, attr) || null
}

function resolveBoolProp(
  direct: Element | null,
  style: Element | null | undefined,
  defaultVal: Element | null,
  tag: string
): boolean | null {
  const node =
    direct?.getElementsByTagNameNS(NS, tag)[0] ||
    style?.getElementsByTagNameNS(NS, tag)[0] ||
    defaultVal?.getElementsByTagNameNS(NS, tag)[0]
  if (!node) return null
  const val = node.getAttributeNS(NS, 'val')
  if (val === '0' || val === 'false') return false
  return true // presence of tag means true in Word unless val=0
}

function resolveAttrFromChain(node: Element | null | undefined, attr: string): number | null {
  if (!node) return null
  const val = node.getAttributeNS(NS, attr)
  return val ? parseInt(val, 10) : null
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest __tests__/lib/parser/style-resolver.test.ts -v`

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add style resolver with inheritance chain support"
```

---

## Task 6: 规则检测引擎（TDD）

**Files:**
- Create: `lib/engine/rule-checker.ts`
- Create: `__tests__/lib/engine/rule-checker.test.ts`

- [ ] **Step 1: 编写失败测试**

Write `__tests__/lib/engine/rule-checker.test.ts`:

```typescript
import { checkRules } from '@/lib/engine/rule-checker'
import { FormatRule, ExtractedDocument, StyleData } from '@/lib/engine/rule-types'
import { ParagraphData } from '@/lib/parser/xml-extractor'

describe('rule-checker', () => {
  const mockDoc: ExtractedDocument = {
    paragraphs: [
      {
        text: '正文段落',
        styleId: 'Normal',
        pPr: null,
        rPr: null,
      } as ParagraphData,
      {
        text: '第一章',
        styleId: 'Heading1',
        pPr: null,
        rPr: null,
      } as ParagraphData,
    ],
    pageSetup: {
      width: 11906,
      height: 16838,
      orientation: 'portrait',
      marginTop: 1440,
      marginBottom: 1440,
      marginLeft: 1800,
      marginRight: 1800,
    },
    defaultStyles: { pPr: null, rPr: null },
  }

  const mockStyles = new Map<string, StyleData>()

  test('passes when page margin matches', () => {
    const rules: FormatRule[] = [
      {
        id: 'page-margin-top',
        category: 'page',
        name: '页边距-上',
        target: { type: 'page-margin', side: 'top' },
        expected: { kind: 'length', value: 2.54, unit: 'cm' },
        status: 'pending',
      },
    ]
    const result = checkRules(rules, mockDoc, mockStyles)
    expect(result[0].status).toBe('pass')
  })

  test('fails when page margin does not match', () => {
    const rules: FormatRule[] = [
      {
        id: 'page-margin-top',
        category: 'page',
        name: '页边距-上',
        target: { type: 'page-margin', side: 'top' },
        expected: { kind: 'length', value: 3.0, unit: 'cm' },
        status: 'pending',
      },
    ]
    const result = checkRules(rules, mockDoc, mockStyles)
    expect(result[0].status).toBe('fail')
    expect(result[0].actual).toBeDefined()
  })

  test('passes when orientation matches', () => {
    const rules: FormatRule[] = [
      {
        id: 'page-orientation',
        category: 'page',
        name: '页面方向',
        target: { type: 'page-orientation' },
        expected: { kind: 'enum', value: 'portrait' },
        status: 'pending',
      },
    ]
    const result = checkRules(rules, mockDoc, mockStyles)
    expect(result[0].status).toBe('pass')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest __tests__/lib/engine/rule-checker.test.ts -v`

Expected: FAIL

- [ ] **Step 3: 实现规则检测器**

Write `lib/engine/rule-checker.ts`:

```typescript
import { FormatRule, RuleValue } from './rule-types'
import { ExtractedDocument, StyleData } from '../parser/xml-extractor'
import { resolveEffectiveStyle, resolveParagraphStyle } from '../parser/style-resolver'
import { twipToCm, twipToPt } from '../utils/unit-converter'

export function checkRules(
  rules: FormatRule[],
  doc: ExtractedDocument,
  styles: Map<string, StyleData>
): FormatRule[] {
  return rules.map((rule) => checkSingleRule(rule, doc, styles))
}

function checkSingleRule(rule: FormatRule, doc: ExtractedDocument, styles: Map<string, StyleData>): FormatRule {
  const target = rule.target
  let actual: RuleValue | undefined
  let location: string | undefined

  if (target.type === 'page-margin') {
    const marginMap: Record<string, number> = {
      top: doc.pageSetup.marginTop,
      bottom: doc.pageSetup.marginBottom,
      left: doc.pageSetup.marginLeft,
      right: doc.pageSetup.marginRight,
    }
    const twip = marginMap[target.side]
    actual = { kind: 'length', value: parseFloat(twipToCm(twip).toFixed(2)), unit: 'cm' }
  }

  if (target.type === 'page-size') {
    const sizeMap: Record<string, number> = {
      width: doc.pageSetup.width,
      height: doc.pageSetup.height,
    }
    actual = { kind: 'length', value: parseFloat(twipToCm(sizeMap[target.dimension]).toFixed(2)), unit: 'cm' }
  }

  if (target.type === 'page-orientation') {
    actual = { kind: 'enum', value: doc.pageSetup.orientation }
  }

  if (target.type === 'font' || target.type === 'font-size' || target.type === 'alignment' || target.type === 'paragraph-spacing') {
    const paragraphs = getTargetParagraphs(doc, target.scope, target.level)
    if (paragraphs.length === 0) {
      return { ...rule, status: 'fail', actual: undefined, location: '未检测到目标段落' }
    }

    const firstP = paragraphs[0]
    const effectiveRPr = resolveEffectiveStyle(firstP, styles, doc.defaultStyles)
    const effectivePPr = resolveParagraphStyle(firstP.pPr, firstP.styleId, styles, doc.defaultStyles)

    if (target.type === 'font') {
      const font = target.script === 'eastAsia' ? effectiveRPr.fontEastAsia : effectiveRPr.fontAscii
      actual = font ? { kind: 'string', value: font } : undefined
      location = `第 1 个${target.scope === 'heading' ? target.level + '级标题' : '正文段落'}`
    }

    if (target.type === 'font-size') {
      const size = effectiveRPr.fontSize
      actual = size ? { kind: 'length', value: size / 2, unit: 'pt' } : undefined // half-points to pt
      location = `第 1 个${target.scope === 'heading' ? target.level + '级标题' : '正文段落'}`
    }

    if (target.type === 'alignment') {
      const align = effectivePPr.alignment
      actual = align ? { kind: 'enum', value: align } : undefined
      location = `第 1 个${target.scope === 'heading' ? target.level + '级标题' : '正文段落'}`
    }

    if (target.type === 'paragraph-spacing') {
      let val: number | null = null
      if (target.kind === 'before') val = effectivePPr.spaceBefore
      if (target.kind === 'after') val = effectivePPr.spaceAfter
      if (target.kind === 'line' && effectivePPr.lineSpacing) {
        if (effectivePPr.lineSpacing.rule === 'auto') {
          actual = { kind: 'lineSpacing', value: effectivePPr.lineSpacing.value / 240, rule: 'auto' }
        } else {
          actual = { kind: 'lineSpacing', value: twipToPt(effectivePPr.lineSpacing.value), rule: 'exact' }
        }
      }
      if (val !== null) {
        actual = { kind: 'length', value: twipToPt(val), unit: 'pt' }
      }
      location = `第 1 个${target.scope === 'heading' ? target.level + '级标题' : '正文段落'}`
    }
  }

  const status = compareValues(rule.expected, actual) ? 'pass' : 'fail'
  return { ...rule, status, actual, location }
}

function getTargetParagraphs(doc: ExtractedDocument, scope: string, level?: number) {
  if (scope === 'body') {
    return doc.paragraphs.filter((p) => {
      if (!p.styleId) return true
      const lower = p.styleId.toLowerCase()
      return !lower.includes('heading') && p.outlineLvl === undefined
    })
  }
  if (scope === 'heading' && level !== undefined) {
    return doc.paragraphs.filter((p) => {
      if (p.outlineLvl === level) return true
      const lower = (p.styleId || '').toLowerCase()
      return lower === `heading${level}` || lower === `heading ${level}` || lower === `标题${level}`
    })
  }
  return []
}

function compareValues(expected: RuleValue, actual: RuleValue | undefined): boolean {
  if (!actual) return false

  if (expected.kind === 'length' && actual.kind === 'length') {
    // Convert both to same unit for comparison
    const eVal = normalizeLength(expected.value, expected.unit)
    const aVal = normalizeLength(actual.value, actual.unit)
    const diff = Math.abs(eVal - aVal)
    if (expected.unit === 'cm') return diff < 0.06
    return diff < 0.6 // pt tolerance
  }

  if (expected.kind === 'string' && actual.kind === 'string') {
    return expected.value.toLowerCase().trim() === actual.value.toLowerCase().trim()
  }

  if (expected.kind === 'enum' && actual.kind === 'enum') {
    return expected.value === actual.value
  }

  if (expected.kind === 'lineSpacing' && actual.kind === 'lineSpacing') {
    if (expected.rule !== actual.rule) return false
    const diff = Math.abs(expected.value - actual.value)
    if (expected.rule === 'auto') return diff < 0.05
    return diff < 0.6 // pt tolerance
  }

  return false
}

function normalizeLength(value: number, unit: string): number {
  if (unit === 'cm') return value
  if (unit === 'pt') return value * 2.54 / 72
  if (unit === 'twip') return value * 2.54 / 1440
  return value
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest __tests__/lib/engine/rule-checker.test.ts -v`

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add rule checker engine for page, body and heading rules"
```

---

## Task 7: HTML 报告导出器（TDD）

**Files:**
- Create: `lib/exporter/html-exporter.ts`
- Create: `__tests__/lib/exporter/html-exporter.test.ts`

- [ ] **Step 1: 编写失败测试**

Write `__tests__/lib/exporter/html-exporter.test.ts`:

```typescript
import { generateHtmlReport } from '@/lib/exporter/html-exporter'
import { FormatRule } from '@/lib/engine/rule-types'

describe('html-exporter', () => {
  const sampleRules: FormatRule[] = [
    {
      id: 'page-margin-top',
      category: 'page',
      name: '页边距-上',
      target: { type: 'page-margin', side: 'top' },
      expected: { kind: 'length', value: 2.54, unit: 'cm' },
      actual: { kind: 'length', value: 2.54, unit: 'cm' },
      status: 'pass',
    },
    {
      id: 'body-font-cn',
      category: 'body',
      name: '正文字体-中文',
      target: { type: 'font', scope: 'body', script: 'eastAsia' },
      expected: { kind: 'string', value: '宋体' },
      actual: { kind: 'string', value: '黑体' },
      status: 'fail',
      location: '第 1 个正文段落',
    },
  ]

  test('generates HTML string containing report title', () => {
    const html = generateHtmlReport('test.docx', sampleRules)
    expect(html).toContain('格式检测报告')
    expect(html).toContain('test.docx')
  })

  test('includes passed rule in green', () => {
    const html = generateHtmlReport('test.docx', sampleRules)
    expect(html).toContain('页边距-上')
    expect(html).toContain('#22c55e')
  })

  test('includes failed rule in red', () => {
    const html = generateHtmlReport('test.docx', sampleRules)
    expect(html).toContain('正文字体-中文')
    expect(html).toContain('#ef4444')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest __tests__/lib/exporter/html-exporter.test.ts -v`

Expected: FAIL

- [ ] **Step 3: 实现 HTML 导出器**

Write `lib/exporter/html-exporter.ts`:

```typescript
import { FormatRule } from '../engine/rule-types'

export function generateHtmlReport(fileName: string, rules: FormatRule[]): string {
  const now = new Date().toLocaleString('zh-CN')
  const passedCount = rules.filter((r) => r.status === 'pass').length
  const failedCount = rules.filter((r) => r.status === 'fail').length

  const categories = [
    { key: 'page', label: '📄 页面设置' },
    { key: 'body', label: '✍️ 正文格式' },
    { key: 'heading', label: '📌 标题格式' },
  ]

  const categoryHtml = categories
    .map((cat) => {
      const catRules = rules.filter((r) => r.category === cat.key)
      if (catRules.length === 0) return ''
      const rows = catRules
        .map((rule) => {
          const isPass = rule.status === 'pass'
          const color = isPass ? '#22c55e' : '#ef4444'
          const icon = isPass ? '✅' : '❌'
          const detail = isPass
            ? formatValue(rule.actual)
            : `预期 ${formatValue(rule.expected)}，实际 ${formatValue(rule.actual)}`
          const location = rule.location ? `（${rule.location}）` : ''
          return `
            <div style="margin: 8px 0; color: ${isPass ? '#3a3a3a' : '#ef4444'};">
              <span style="color: ${color};">${icon}</span>
              <strong>${rule.name}</strong>：${detail}${location}
            </div>
          `
        })
        .join('')
      return `
        <div style="margin-bottom: 24px; padding: 16px; background: #faf5e8; border-radius: 16px;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0a0a0a;">${cat.label}</h3>
          ${rows}
        </div>
      `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>格式检测报告 - ${fileName}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; background: #fffaf0; color: #0a0a0a; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .meta { color: #6a6a6a; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; margin-bottom: 32px; }
    .summary-item { padding: 12px 20px; background: #f5f0e0; border-radius: 12px; }
  </style>
</head>
<body>
  <h1>📋 格式检测报告</h1>
  <div class="meta">
    <div>论文文件：${fileName}</div>
    <div>检测时间：${now}</div>
  </div>
  <div class="summary">
    <div class="summary-item" style="color: #22c55e;">✅ 合格 ${passedCount} 项</div>
    <div class="summary-item" style="color: #ef4444;">❌ 不合格 ${failedCount} 项</div>
  </div>
  ${categoryHtml}
</body>
</html>`
}

function formatValue(v: { kind: string; value: number | string; unit?: string; rule?: string } | undefined): string {
  if (!v) return '未检测到'
  if (v.kind === 'length') return `${v.value} ${v.unit}`
  if (v.kind === 'lineSpacing') return v.rule === 'auto' ? `${v.value} 倍` : `${v.value} 磅`
  return String(v.value)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest __tests__/lib/exporter/html-exporter.test.ts -v`

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add HTML report exporter"
```

---

## Task 8: DOCX 报告导出器（TDD）

**Files:**
- Create: `lib/exporter/docx-exporter.ts`
- Create: `__tests__/lib/exporter/docx-exporter.test.ts`

- [ ] **Step 1: 编写失败测试**

Write `__tests__/lib/exporter/docx-exporter.test.ts`:

```typescript
import { generateDocxReportBlob } from '@/lib/exporter/docx-exporter'
import { FormatRule } from '@/lib/engine/rule-types'

describe('docx-exporter', () => {
  const sampleRules: FormatRule[] = [
    {
      id: 'page-margin-top',
      category: 'page',
      name: '页边距-上',
      target: { type: 'page-margin', side: 'top' },
      expected: { kind: 'length', value: 2.54, unit: 'cm' },
      actual: { kind: 'length', value: 2.54, unit: 'cm' },
      status: 'pass',
    },
    {
      id: 'body-font-cn',
      category: 'body',
      name: '正文字体-中文',
      target: { type: 'font', scope: 'body', script: 'eastAsia' },
      expected: { kind: 'string', value: '宋体' },
      actual: { kind: 'string', value: '黑体' },
      status: 'fail',
    },
  ]

  test('generates a Blob without throwing', async () => {
    const blob = await generateDocxReportBlob('test.docx', sampleRules)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toContain('officedocument')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest __tests__/lib/exporter/docx-exporter.test.ts -v`

Expected: FAIL

- [ ] **Step 3: 实现 DOCX 导出器**

Write `lib/exporter/docx-exporter.ts`:

```typescript
import { FormatRule } from '../engine/rule-types'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  HeadingLevel,
  TextRun,
  ShadingType,
} from 'docx'

export async function generateDocxReportBlob(fileName: string, rules: FormatRule[]): Promise<Blob> {
  const now = new Date().toLocaleString('zh-CN')
  const passedCount = rules.filter((r) => r.status === 'pass').length
  const failedCount = rules.filter((r) => r.status === 'fail').length

  const categories = [
    { key: 'page' as const, label: '📄 页面设置' },
    { key: 'body' as const, label: '✍️ 正文格式' },
    { key: 'heading' as const, label: '📌 标题格式' },
  ]

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: '格式检测报告',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new TextRun(`论文文件：${fileName}`)] }),
    new Paragraph({ children: [new TextRun(`检测时间：${now}`)] }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: `✅ 合格 ${passedCount} 项`, color: '22c55e' }),
        new TextRun('    '),
        new TextRun({ text: `❌ 不合格 ${failedCount} 项`, color: 'ef4444' }),
      ],
    }),
    new Paragraph({ text: '' }),
  ]

  for (const cat of categories) {
    const catRules = rules.filter((r) => r.category === cat.key)
    if (catRules.length === 0) continue

    children.push(
      new Paragraph({
        text: cat.label,
        heading: HeadingLevel.HEADING_2,
      })
    )

    const tableRows = [
      new TableRow({
        children: ['规则名称', '预期值', '实际值', '结果'].map(
          (header) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
              shading: { fill: 'f5f0e0', type: ShadingType.CLEAR },
            })
        ),
      }),
      ...catRules.map((rule) => {
        const isPass = rule.status === 'pass'
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(rule.name)] }),
            new TableCell({ children: [new Paragraph(formatValue(rule.expected))] }),
            new TableCell({ children: [new Paragraph(formatValue(rule.actual))] }),
            new TableCell({
              children: [new Paragraph(isPass ? '通过' : '不通过')],
              shading: {
                fill: isPass ? '22c55e' : 'ef4444',
                type: ShadingType.CLEAR,
              },
            }),
          ],
        })
      }),
    ]

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    )

    children.push(new Paragraph({ text: '' }))
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  return await Packer.toBlob(doc)
}

function formatValue(v: { kind: string; value: number | string; unit?: string; rule?: string } | undefined): string {
  if (!v) return '未检测到'
  if (v.kind === 'length') return `${v.value} ${v.unit}`
  if (v.kind === 'lineSpacing') return v.rule === 'auto' ? `${v.value} 倍` : `${v.value} 磅`
  return String(v.value)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest __tests__/lib/exporter/docx-exporter.test.ts -v`

Expected: All 1 test PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add DOCX report exporter using docx library"
```

---

## Task 9: 全局状态管理（AppContext）

**Files:**
- Create: `lib/context/AppContext.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 实现 AppContext**

Write `lib/context/AppContext.tsx`:

```tsx
'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { FormatRule } from '../engine/rule-types'

interface AppState {
  fileName: string
  fileBuffer: ArrayBuffer | null
  rules: FormatRule[]
  report: FormatRule[] | null
  isProcessing: boolean
  error: string | null
}

type AppAction =
  | { type: 'SET_FILE'; fileName: string; fileBuffer: ArrayBuffer }
  | { type: 'SET_RULES'; rules: FormatRule[] }
  | { type: 'SET_REPORT'; report: FormatRule[] }
  | { type: 'START_PROCESSING' }
  | { type: 'STOP_PROCESSING' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' }

const initialState: AppState = {
  fileName: '',
  fileBuffer: null,
  rules: [],
  report: null,
  isProcessing: false,
  error: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, fileName: action.fileName, fileBuffer: action.fileBuffer, error: null }
    case 'SET_RULES':
      return { ...state, rules: action.rules }
    case 'SET_REPORT':
      return { ...state, report: action.report, isProcessing: false, error: null }
    case 'START_PROCESSING':
      return { ...state, isProcessing: true, error: null }
    case 'STOP_PROCESSING':
      return { ...state, isProcessing: false }
    case 'SET_ERROR':
      return { ...state, error: action.error, isProcessing: false }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

- [ ] **Step 2: 将 Provider 注入根布局**

Modify `app/layout.tsx` to wrap children with `AppProvider`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/lib/context/AppContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FormatPass - 毕业论文格式检测',
  description: '上传论文，一键排查格式问题',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-canvas text-ink`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add AppContext for global state management"
```

---

## Task 10: DOCX 解压模块

**Files:**
- Create: `lib/parser/docx-unzip.ts`

- [ ] **Step 1: 实现解压模块**

Write `lib/parser/docx-unzip.ts`:

```typescript
import JSZip from 'jszip'

export interface DocxFiles {
  documentXml: string
  stylesXml?: string
}

export async function unzipDocx(arrayBuffer: ArrayBuffer): Promise<DocxFiles> {
  const zip = await JSZip.loadAsync(arrayBuffer)

  const documentXml = await zip.file('word/document.xml')?.async('string')
  const stylesXml = await zip.file('word/styles.xml')?.async('string')

  if (!documentXml) {
    throw new Error('无法找到 word/document.xml，文件可能损坏或不是标准 docx 格式')
  }

  return { documentXml, stylesXml }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add docx unzip module using JSZip"
```

---

## Task 11: 上传组件（UploadZone）

**Files:**
- Create: `app/components/UploadZone.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 实现 UploadZone 组件**

Write `app/components/UploadZone.tsx`:

```tsx
'use client'

import React, { useCallback, useState } from 'react'
import { useApp } from '@/lib/context/AppContext'

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

export default function UploadZone() {
  const { dispatch } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.name.endsWith('.docx')) {
        setError('请上传 .docx 格式的文件')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('文件过大，建议拆分为章节分别检测（限制 30MB）')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer
        dispatch({ type: 'SET_FILE', fileName: file.name, fileBuffer: buffer })
      }
      reader.onerror = () => setError('文件读取失败')
      reader.readAsArrayBuffer(file)
    },
    [dispatch]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) validateAndSetFile(file)
    },
    [validateAndSetFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) validateAndSetFile(file)
    },
    [validateAndSetFile]
  )

  return (
    <div className="w-full max-w-lg">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-xl p-12
          transition-colors cursor-pointer
          ${isDragging ? 'border-accent bg-surface-soft' : 'border-hairline bg-surface-card'}
        `}
        style={{ borderColor: isDragging ? '#1a3a2a' : '#e5e5e5', backgroundColor: isDragging ? '#faf5e8' : '#f5f0e0' }}
      >
        <input
          type="file"
          accept=".docx"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-4xl mb-3">📄</div>
        <p className="text-lg font-medium text-ink">拖拽或点击上传</p>
        <p className="text-sm text-muted mt-1">支持 .docx 格式</p>
      </div>
      {error && (
        <p className="mt-3 text-sm text-error text-center">{error}</p>
      )}
    </div>
  )
}
```

Note: Since we're using Tailwind custom colors that may not be standard, add the color definitions inline where needed or rely on tailwind.config.ts. The component uses inline styles for dynamic drag state and Tailwind for static layout.

- [ ] **Step 2: 更新首页**

Write `app/page.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import UploadZone from './components/UploadZone'
import { useApp } from '@/lib/context/AppContext'

export default function Home() {
  const router = useRouter()
  const { state } = useApp()

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="h-16 flex items-center justify-between px-6" style={{ backgroundColor: '#fffaf0' }}>
        <div className="text-lg font-semibold">FormatPass</div>
        <div className="text-sm text-muted">关于</div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl font-medium tracking-tight text-center mb-3" style={{ color: '#0a0a0a', letterSpacing: '-1px' }}>
          毕业论文格式检测
        </h1>
        <p className="text-base text-center mb-10" style={{ color: '#3a3a3a' }}>
          上传论文，一键排查格式问题
        </p>

        <UploadZone />

        <button
          onClick={() => {
            if (state.fileBuffer) router.push('/rules')
          }}
          disabled={!state.fileBuffer}
          className="mt-8 px-5 py-3 rounded-md text-white font-semibold text-sm transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#1a3a2a', height: 44 }}
        >
          开始检测
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add UploadZone component and home page"
```

---

## Task 12: 规则表单组件（RuleForm + RuleAccordion）

**Files:**
- Create: `app/components/RuleAccordion.tsx`
- Create: `app/components/RuleForm.tsx`

- [ ] **Step 1: 实现折叠卡片容器**

Write `app/components/RuleAccordion.tsx`:

```tsx
'use client'

import React, { useState, ReactNode } from 'react'

interface RuleAccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function RuleAccordion({ title, children, defaultOpen = false }: RuleAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border mb-4 overflow-hidden" style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm"
        style={{ color: '#0a0a0a' }}
      >
        <span>{title}</span>
        <span className="text-lg transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}
```

- [ ] **Step 2: 实现规则表单**

Write `app/components/RuleForm.tsx`:

```tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { buildRulesFromForm } from '@/lib/engine/rule-builder'
import { RuleFormData } from '@/lib/engine/rule-types'
import { unzipDocx } from '@/lib/parser/docx-unzip'
import { extractDocument, extractStyles } from '@/lib/parser/xml-extractor'
import { checkRules } from '@/lib/engine/rule-checker'
import RuleAccordion from './RuleAccordion'
import ProgressBar from './ProgressBar'

const PAPER_OPTIONS = ['A4', 'Letter', 'A3']
const ORIENTATION_OPTIONS = [
  { value: 'portrait', label: '纵向' },
  { value: 'landscape', label: '横向' },
]
const FONT_CN_OPTIONS = ['宋体', '黑体', '仿宋', '楷体', '微软雅黑']
const FONT_EN_OPTIONS = ['Times New Roman', 'Arial', 'Calibri']
const FONT_SIZE_OPTIONS = ['小四 12pt', '四号 14pt', '五号 10.5pt', '12pt', '14pt', '16pt']
const LINE_SPACING_OPTIONS = ['1.0', '1.15', '1.5', '2.0', '固定值 20 磅', '固定值 24 磅']
const ALIGNMENT_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
]

export default function RuleForm() {
  const router = useRouter()
  const { state, dispatch } = useApp()
  const [progress, setProgress] = useState(0)

  const [form, setForm] = useState<RuleFormData>({
    page: { marginTop: 2.54, marginBottom: 2.54, marginLeft: 3.17, marginRight: 3.17, paperSize: 'A4', orientation: 'portrait' },
    body: { fontCn: '宋体', fontEn: 'Times New Roman', fontSize: '小四 12pt', lineSpacing: '1.5', spaceBefore: 0, spaceAfter: 0 },
    headings: [
      { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
      { level: 2, font: '黑体', fontSize: '14pt', spaceBefore: 18, spaceAfter: 6, alignment: 'left' },
      { level: 3, font: '黑体', fontSize: '12pt', spaceBefore: 12, spaceAfter: 6, alignment: 'left' },
    ],
  })

  const updatePage = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, page: { ...prev.page, [field]: value } }))
  const updateBody = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, body: { ...prev.body, [field]: value } }))
  const updateHeading = (index: number, field: string, value: string | number) =>
    setForm((prev) => {
      const next = [...prev.headings]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, headings: next }
    })

  const handleCheck = async () => {
    if (!state.fileBuffer) return
    dispatch({ type: 'START_PROCESSING' })
    setProgress(10)

    try {
      const { documentXml, stylesXml } = await unzipDocx(state.fileBuffer)
      setProgress(40)
      const doc = extractDocument(documentXml)
      const styles = stylesXml ? extractStyles(stylesXml) : new Map()
      setProgress(60)
      const rules = buildRulesFromForm(form)
      setProgress(80)
      const report = checkRules(rules, doc, styles)
      setProgress(100)
      dispatch({ type: 'SET_REPORT', report })
      router.push('/report')
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message || '检测失败' })
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium mb-1" style={{ color: '#0a0a0a' }}>填写格式规则</h2>
          <p className="text-sm text-muted">文件：{state.fileName}</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-sm underline"
          style={{ color: '#6a6a6a' }}
        >
          更换文件
        </button>
      </div>

      {state.isProcessing && <ProgressBar progress={progress} />}

      <RuleAccordion title="📄 页面设置" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          {['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].map((field) => (
            <label key={field} className="flex flex-col text-sm">
              <span className="mb-1 text-muted">页边距-{field.replace('margin', '').replace('Top','上').replace('Bottom','下').replace('Left','左').replace('Right','右')} (cm)</span>
              <input
                type="number"
                step={0.01}
                value={form.page[field as keyof typeof form.page] as number}
                onChange={(e) => updatePage(field, parseFloat(e.target.value))}
                className="px-3 py-2 rounded-md border text-sm"
                style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">纸张大小</span>
            <select
              value={form.page.paperSize}
              onChange={(e) => updatePage('paperSize', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {PAPER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">页面方向</span>
            <select
              value={form.page.orientation}
              onChange={(e) => updatePage('orientation', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {ORIENTATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </RuleAccordion>

      <RuleAccordion title="✍️ 正文格式" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">正文中文字体</span>
            <select
              value={form.body.fontCn}
              onChange={(e) => updateBody('fontCn', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {FONT_CN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">正文西文字体</span>
            <select
              value={form.body.fontEn}
              onChange={(e) => updateBody('fontEn', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {FONT_EN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">正文字号</span>
            <select
              value={form.body.fontSize}
              onChange={(e) => updateBody('fontSize', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {FONT_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">行距</span>
            <select
              value={form.body.lineSpacing}
              onChange={(e) => updateBody('lineSpacing', e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            >
              {LINE_SPACING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">段前间距 (pt)</span>
            <input
              type="number"
              value={form.body.spaceBefore}
              onChange={(e) => updateBody('spaceBefore', parseFloat(e.target.value))}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-muted">段后间距 (pt)</span>
            <input
              type="number"
              value={form.body.spaceAfter}
              onChange={(e) => updateBody('spaceAfter', parseFloat(e.target.value))}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
            />
          </label>
        </div>
      </RuleAccordion>

      <RuleAccordion title="📌 标题格式">
        {form.headings.map((h, idx) => (
          <div key={h.level} className="mb-6 pb-6 border-b" style={{ borderColor: '#f0f0f0' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: '#1a1a1a' }}>{h.level}级标题</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">字体</span>
                <select
                  value={h.font}
                  onChange={(e) => updateHeading(idx, 'font', e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                >
                  {FONT_CN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">字号</span>
                <select
                  value={h.fontSize}
                  onChange={(e) => updateHeading(idx, 'fontSize', e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                >
                  {FONT_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">段前间距 (pt)</span>
                <input
                  type="number"
                  value={h.spaceBefore}
                  onChange={(e) => updateHeading(idx, 'spaceBefore', parseFloat(e.target.value))}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">段后间距 (pt)</span>
                <input
                  type="number"
                  value={h.spaceAfter}
                  onChange={(e) => updateHeading(idx, 'spaceAfter', parseFloat(e.target.value))}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-muted">对齐方式</span>
                <select
                  value={h.alignment}
                  onChange={(e) => updateHeading(idx, 'alignment', e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44 }}
                >
                  {ALIGNMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        ))}
      </RuleAccordion>

      {state.error && <p className="my-4 text-sm text-center" style={{ color: '#ef4444' }}>{state.error}</p>}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handleCheck}
          disabled={state.isProcessing}
          className="flex-1 px-5 py-3 rounded-md text-white font-semibold text-sm transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#1a3a2a', height: 44 }}
        >
          {state.isProcessing ? '检测中…' : '开始检测'}
        </button>
        <button
          onClick={() => setForm({
            page: { marginTop: 2.54, marginBottom: 2.54, marginLeft: 3.17, marginRight: 3.17, paperSize: 'A4', orientation: 'portrait' },
            body: { fontCn: '宋体', fontEn: 'Times New Roman', fontSize: '小四 12pt', lineSpacing: '1.5', spaceBefore: 0, spaceAfter: 0 },
            headings: [
              { level: 1, font: '黑体', fontSize: '16pt', spaceBefore: 24, spaceAfter: 12, alignment: 'center' },
              { level: 2, font: '黑体', fontSize: '14pt', spaceBefore: 18, spaceAfter: 6, alignment: 'left' },
              { level: 3, font: '黑体', fontSize: '12pt', spaceBefore: 12, spaceAfter: 6, alignment: 'left' },
            ],
          })}
          className="px-5 py-3 rounded-md text-sm font-semibold border"
          style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44, color: '#0a0a0a' }}
        >
          重置规则
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add RuleForm and RuleAccordion components"
```

---

## Task 13: 进度条与规则页

**Files:**
- Create: `app/components/ProgressBar.tsx`
- Create: `app/rules/page.tsx`

- [ ] **Step 1: 实现 ProgressBar**

Write `app/components/ProgressBar.tsx`:

```tsx
'use client'

export default function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full rounded-full h-2 mb-6 overflow-hidden" style={{ backgroundColor: '#f0f0f0' }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${progress}%`, backgroundColor: '#1a3a2a' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: 实现规则页**

Write `app/rules/page.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RuleForm from '../components/RuleForm'
import { useApp } from '@/lib/context/AppContext'

export default function RulesPage() {
  const router = useRouter()
  const { state } = useApp()

  useEffect(() => {
    if (!state.fileBuffer) {
      router.replace('/')
    }
  }, [state.fileBuffer, router])

  if (!state.fileBuffer) return null

  return (
    <main className="min-h-screen">
      <nav className="h-16 flex items-center px-6" style={{ backgroundColor: '#fffaf0' }}>
        <div className="text-lg font-semibold">FormatPass</div>
      </nav>
      <RuleForm />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add progress bar and rules page"
```

---

## Task 14: 报告展示与导出组件

**Files:**
- Create: `app/components/ReportView.tsx`
- Create: `app/components/ReportExport.tsx`

- [ ] **Step 1: 实现 ReportView**

Write `app/components/ReportView.tsx`:

```tsx
'use client'

import { FormatRule } from '@/lib/engine/rule-types'

export default function ReportView({ rules }: { rules: FormatRule[] }) {
  const passed = rules.filter((r) => r.status === 'pass')
  const failed = rules.filter((r) => r.status === 'fail')

  const categories = [
    { key: 'page', label: '📄 页面设置' },
    { key: 'body', label: '✍️ 正文格式' },
    { key: 'heading', label: '📌 标题格式' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: '#f5f0e0' }}>
        <h2 className="text-xl font-semibold mb-2" style={{ color: '#0a0a0a' }}>检测完成</h2>
        <div className="flex gap-6">
          <span className="text-sm font-medium" style={{ color: '#22c55e' }}>✅ 合格 {passed.length} 项</span>
          <span className="text-sm font-medium" style={{ color: '#ef4444' }}>❌ 不合格 {failed.length} 项</span>
        </div>
      </div>

      {categories.map((cat) => {
        const catRules = rules.filter((r) => r.category === cat.key)
        if (catRules.length === 0) return null
        return (
          <div key={cat.key} className="rounded-xl p-5 mb-6" style={{ backgroundColor: '#faf5e8' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#0a0a0a' }}>{cat.label}</h3>
            <div className="space-y-3">
              {catRules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">{rule.status === 'pass' ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <span className="font-medium" style={{ color: rule.status === 'fail' ? '#ef4444' : '#3a3a3a' }}>
                      {rule.name}
                    </span>
                    {rule.status === 'pass' ? (
                      <span className="ml-2" style={{ color: '#6a6a6a' }}>{formatValue(rule.actual)}</span>
                    ) : (
                      <span className="ml-2" style={{ color: '#ef4444' }}>
                        预期 {formatValue(rule.expected)}，实际 {formatValue(rule.actual)}
                        {rule.location && <span className="ml-1" style={{ color: '#9a9a9a' }}>（{rule.location}）</span>}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatValue(v: { kind: string; value: number | string; unit?: string; rule?: string } | undefined): string {
  if (!v) return '未检测到'
  if (v.kind === 'length') return `${v.value} ${v.unit}`
  if (v.kind === 'lineSpacing') return v.rule === 'auto' ? `${v.value} 倍` : `${v.value} 磅`
  return String(v.value)
}
```

- [ ] **Step 2: 实现 ReportExport**

Write `app/components/ReportExport.tsx`:

```tsx
'use client'

import { useApp } from '@/lib/context/AppContext'
import { generateHtmlReport } from '@/lib/exporter/html-exporter'
import { generateDocxReportBlob } from '@/lib/exporter/docx-exporter'

export default function ReportExport() {
  const { state } = useApp()

  const handleExportHtml = () => {
    if (!state.report) return
    const html = generateHtmlReport(state.fileName, state.report)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `格式检测报告-${state.fileName.replace('.docx', '')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportDocx = async () => {
    if (!state.report) return
    try {
      const blob = await generateDocxReportBlob(state.fileName, state.report)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `格式检测报告-${state.fileName.replace('.docx', '')}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('DOCX 导出失败')
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-6 pb-12">
      <button
        onClick={handleExportHtml}
        className="px-5 py-3 rounded-md text-sm font-semibold border"
        style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44, color: '#0a0a0a' }}
      >
        导出 HTML 报告
      </button>
      <button
        onClick={handleExportDocx}
        className="px-5 py-3 rounded-md text-sm font-semibold border"
        style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0', height: 44, color: '#0a0a0a' }}
      >
        导出 DOCX 报告
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add ReportView and ReportExport components"
```

---

## Task 15: 报告页与端到端流程整合

**Files:**
- Create: `app/report/page.tsx`

- [ ] **Step 1: 实现报告页**

Write `app/report/page.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReportView from '../components/ReportView'
import ReportExport from '../components/ReportExport'
import { useApp } from '@/lib/context/AppContext'

export default function ReportPage() {
  const router = useRouter()
  const { state } = useApp()

  useEffect(() => {
    if (!state.report) {
      router.replace('/')
    }
  }, [state.report, router])

  if (!state.report) return null

  return (
    <main className="min-h-screen">
      <nav className="h-16 flex items-center justify-between px-6" style={{ backgroundColor: '#fffaf0' }}>
        <div className="text-lg font-semibold">FormatPass</div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/rules')}
            className="text-sm font-medium"
            style={{ color: '#1a3a2a' }}
          >
            ← 修改规则重新检测
          </button>
        </div>
      </nav>
      <ReportView rules={state.report} />
      <ReportExport />
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add report page with navigation and export"
```

---

## Task 16: 全局错误处理与边界情况

**Files:**
- Create: `app/components/ErrorBoundary.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 实现错误边界**

Write `app/components/ErrorBoundary.tsx`:

```tsx
'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#0a0a0a' }}>出错了</h2>
          <p className="text-sm text-muted mb-4">应用遇到意外错误，请刷新页面重试。</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-md text-white text-sm font-semibold"
            style={{ backgroundColor: '#1a3a2a', height: 44 }}
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: 将 ErrorBoundary 注入根布局**

Modify `app/layout.tsx` to wrap `AppProvider` children with `ErrorBoundary`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/lib/context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FormatPass - 毕业论文格式检测',
  description: '上传论文，一键排查格式问题',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen bg-canvas text-ink`}>
        <ErrorBoundary>
          <AppProvider>{children}</AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add error boundary for graceful error handling"
```

---

## Task 17: 构建验证与 Vercel 部署

**Files:**
- Modify: `package.json` scripts
- Modify: `next.config.js`

- [ ] **Step 1: 确保构建脚本正确**

Verify `package.json` scripts contain:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest"
}
```

Verify `next.config.js` has `output: 'export'` and `distDir: 'dist'`.

- [ ] **Step 2: 运行全部测试**

Run: `npm test`

Expected: All tests PASS (unit-converter, xml-extractor, style-resolver, rule-builder, rule-checker, html-exporter, docx-exporter)

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: Build succeeds, `dist/` directory created with static HTML/JS/CSS assets. No errors.

- [ ] **Step 4: 本地验证**

Run: `npx serve dist`

Open browser to `http://localhost:3000`. Verify:
1. 首页加载正常，可上传 docx
2. 规则页表单可填写
3. 检测流程运行到报告页
4. 导出按钮可下载文件

Stop with Ctrl+C.

- [ ] **Step 5: 部署到 Vercel**

Run:
```bash
npx vercel --prod
```

If first time:
```bash
npx vercel
# Follow prompts to link project
# Then:
npx vercel --prod
```

Expected: Deploy succeeds, URL returned (e.g., `https://formatpass.vercel.app`)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure build and verify Vercel deployment"
```

---

## 自检清单

### 1. 规格覆盖检查

| 规格要求 | 对应任务 |
|---|---|
| 上传并解析 `.docx` | Task 10 (解压), Task 11 (UploadZone) |
| 用户手动填写格式规则 | Task 12 (RuleForm) |
| 检测页面设置（页边距、纸张、方向） | Task 4 (XML 提取), Task 6 (Checker) |
| 检测正文格式（字体、字号、行距、间距） | Task 4, Task 5 (Resolver), Task 6 |
| 检测标题格式（1/2/3级） | Task 4, Task 5, Task 6 |
| 文字版检测报告 | Task 14 (ReportView) |
| 导出 HTML 报告 | Task 7 (html-exporter), Task 14 (ReportExport) |
| 导出 DOCX 报告 | Task 8 (docx-exporter), Task 14 (ReportExport) |
| 修改规则后重新检测 | Task 15 (report page nav) |
| 错误处理（文件损坏、大文件、非 docx） | Task 11 (UploadZone), Task 16 (ErrorBoundary) |
| Clay Design 风格 UI | Task 1 (Tailwind config), Task 11/12/13/14 (components) |
| Vercel 纯前端部署 | Task 1 (next.config.js static export), Task 17 |

### 2. Placeholder 扫描

计划内无 "TBD"、"TODO"、"implement later"、"fill in details"。每一步均包含完整代码或精确命令。

### 3. 类型一致性检查

- `FormatRule`、`RuleTarget`、`RuleValue`、`RuleFormData` 在 Task 3 定义，后续 Task 4/5/6/7/8/12 均引用同一类型
- `ExtractedDocument`、`ParagraphData`、`StyleData`、`PageSetup` 在 Task 4 定义，Task 5/6 引用同一类型
- `EffectiveStyle` 在 Task 5 定义，Task 6 引用同一结构
- `generateHtmlReport` 和 `generateDocxReportBlob` 签名在 Task 7/8 定义，Task 14 调用一致

---

## 执行交接

**Plan complete and saved to `docs/superpowers/plans/2026-05-30-paper-format-checker-phase1.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
