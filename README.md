# 于云浩技术博客

一个基于 **Astro** 构建的高性能、SEO 友好的个人技术博客系统。支持 Markdown/MDX 内容管理、后台管理面板、评论系统、全文搜索，以及持久化数据存储。

**在线访问：** [https://blogs-ten-theta.vercel.app](https://blogs-ten-theta.vercel.app)

---

## 📋 目录

- [项目功能](#-项目功能)
- [技术架构](#-技术架构)
- [项目结构](#-项目结构)
- [本地开发](#-本地开发)
- [部署方案](#-部署方案)
- [API 接口](#-api-接口)
- [数据库设计](#-数据库设计)
- [测试](#-测试)
- [许可证](#-许可证)

---

## ✨ 项目功能

- **内容管理**：Markdown/MDX 内容合集 + 管理后台所见即所得编辑器，支持草稿、定时发布
- **评论系统**：游客/博主双身份评论、多层嵌套回复、敏感词过滤、防刷限流、审核流程
- **管理后台**：仪表盘数据概览、文章 CRUD、评论审核/置顶/回复
- **SEO 优化**：自动生成 sitemap、RSS、Open Graph 标签、结构化数据
- **全文搜索**：实时搜索文章标题、描述、标签
- **分类与标签**：按分类/标签聚合归档，动态统计
- **响应式设计**：Tailwind CSS 深色主题、移动端适配
- **持久化存储**：Upstash Redis 作为数据持久层，数据不因部署丢失

---

## 🏗 技术架构

### 架构拓扑图

```
┌─────────────────────────────────────────────────────────┐
│                        客户端                            │
│  浏览器 (SSR 首屏 + CSR 交互)                             │
│  Tailwind CSS + 渐进增强 + 深色/浅色主题                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                     Vercel Edge                          │
│  ┌─────────────┐  ┌──────────────────────────────────┐  │
│  │  静态资源    │  │  Serverless Functions             │  │
│  │  HTML/CSS   │  │  ┌───────────┬─────────────────┐ │  │
│  │  JS/图片    │  │  │ API 路由  │ SSR 页面渲染     │ │  │
│  │             │  │  │ /api/auth │ /blog/[...slug] │ │  │
│  │             │  │  │ /api/posts│ /categories     │ │  │
│  │             │  │  │ /api/comms│ /tags           │ │  │
│  └─────────────┘  │  └───────────┴─────────────────┘ │  │
│                   └──────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    数据存储层                             │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ Upstash Redis   │  │ Content Collections          │  │
│  │ (KV 持久化)     │  │ (Markdown/MDX 本地文件)      │  │
│  │ - 文章数据      │  │ - 静态博客文章                │  │
│  │ - 评论数据      │  │ - Git 版本控制               │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│  ┌─────────────────┐                                    │
│  │ /tmp 文件存储    │  ← 后备方案（无 Redis 时使用）     │
│  │ - 临时读写       │                                    │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

### 前端技术栈

| 分类 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **框架** | [Astro](https://astro.build) | ^5.5 | 静态站点生成 + SSR，Islands 架构 |
| **CSS** | [Tailwind CSS](https://tailwindcss.com) | ^3.4 | 原子化 CSS，深色主题 |
| **内容** | Content Collections (MDX) | — | 本地 Markdown/RMDX 内容管理 |
| **图标** | SVG 内联 | — | 无额外图标库依赖 |
| **脚本** | TypeScript | ^5.7 | 类型安全 |
| **Markdown 高亮** | Shiki (github-dark) | — | 代码块语法高亮 |

**核心依赖：**

| 包名 | 用途 |
|------|------|
| `@astrojs/mdx` | MDX 内容集成 |
| `@astrojs/rss` | RSS Feed 生成 |
| `@astrojs/sitemap` | XML Sitemap 生成 |
| `@astrojs/tailwind` | Tailwind CSS 集成 |
| `@upstash/redis` | Redis 客户端（持久化存储） |

### 后端技术栈

| 分类 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **运行环境** | Vercel Serverless | — | 自动扩缩容，全球 CDN |
| **适配器** | `@astrojs/vercel` | ^8.1 | Astro + Vercel 集成 |
| **渲染模式** | SSR (`output: 'server'`) | — | 服务端渲染 + API 路由 |
| **数据库** | Upstash Redis (KV) | — | 键值存储，数据持久化 |
| **缓存** | 内存缓存 (请求级) | — | 单次请求内复用数据 |
| **认证** | Cookie Session | — | 管理后台登录鉴权 |
| **安全** | XSS 过滤 / 速率限制 / 敏感词过滤 | — | 自研校验层 |

**API 设计规范：** RESTful JSON API，统一响应格式：

```json
{
  "success": true,
  "data": { /* ... */ },
  "message": "可选提示信息"
}
```

### 核心中间件 / 工具层

| 模块 | 文件路径 | 功能 |
|------|---------|------|
| **数据存储** | `src/lib/db/storage.ts` | 文件读写抽象层（/tmp + .data/） |
| **文章 CRUD** | `src/lib/db/posts.ts` | Redis + 文件双写，冷启动自动恢复 |
| **评论 CRUD** | `src/lib/db/comments.ts` | 评论 Redis + 文件持久化 |
| **数据校验** | `src/lib/validation.ts` | XSS 过滤、敏感词、垃圾检测、限流 |
| **SEO 生成** | `src/lib/seo.ts` | Slug / SEO 标题 / 描述 / 阅读时长自动生成 |
| **通知推送** | `src/lib/notification.ts` | 评论通知（日志 + 邮件占位） |

---

## 📁 项目结构

```
boke/
├── .data/                          # 数据存储（Git 仓库内种子数据）
│   ├── comments.json               #   评论种子数据
│   └── posts.json                  #   文章种子数据
├── .vercel/                        # Vercel 构建产物（自动生成）
├── dist/                           # 构建输出目录
├── docs/                           # 项目文档
│   ├── api.md                      #   API 接口文档
│   └── database.md                 #   数据库设计文档
├── public/                         # 静态资源
│   └── favicon.svg
├── scripts/                        # 脚本工具
│   └── load-test.mjs               #   压力测试脚本
├── src/
│   ├── components/                 # 可复用组件
│   │   ├── ArticleCard.astro       #   文章卡片
│   │   ├── BackToTop.astro         #   回到顶部
│   │   ├── Comment.astro           #   评论区（含嵌套回复）
│   │   ├── Footer.astro            #   底部导航
│   │   ├── Header.astro            #   顶部导航
│   │   ├── SearchClient.astro      #   全文搜索
│   │   └── ToC.astro              #   文章目录
│   ├── content/                    # Astro Content Collections
│   │   ├── blog/                   #   博客文章 (.md)
│   │   └── config.ts              #   Content Schema 定义
│   ├── layouts/                    # 页面布局
│   │   ├── AdminLayout.astro       #   管理后台布局
│   │   ├── BaseLayout.astro        #   基础布局（SEO/结构化数据）
│   │   └── BlogLayout.astro        #   文章详情页布局
│   ├── lib/                        # 工具库
│   │   ├── db/                     #   数据存取层
│   │   │   ├── comments.ts
│   │   │   ├── posts.ts
│   │   │   ├── storage.ts
│   │   │   └── types.ts
│   │   ├── notification.ts         #   通知机制
│   │   ├── seo.ts                  #   SEO 生成器
│   │   ├── utils.ts               #   通用工具函数
│   │   └── validation.ts          #   校验/过滤/限流
│   ├── pages/                      # 路由页面
│   │   ├── admin/                  #   管理后台
│   │   │   ├── comments/index.astro
│   │   │   ├── posts/
│   │   │   ├── index.astro         #     仪表盘
│   │   │   └── login.astro         #     登录
│   │   ├── api/                    #   API 路由 (SSR)
│   │   │   ├── auth/index.ts       #     登录/登出
│   │   │   ├── comments/index.ts   #     评论 CRUD
│   │   │   ├── posts/              #     文章 CRUD + debug
│   │   │   └── db-status.ts       #     Redis 状态检测
│   │   ├── blog/[...slug].astro   #   文章详情页 (SSR)
│   │   ├── categories/             #   分类归档
│   │   ├── tags/                   #   标签归档
│   │   ├── index.astro            #   首页 (SSR)
│   │   ├── about.astro            #   关于页
│   │   ├── search.astro           #   搜索页
│   │   ├── rss.xml.js             #   RSS Feed
│   │   └── 404.astro              #   404 页面
│   └── styles/
│       └── global.css              #   全局样式（Tailwind）
├── astro.config.mjs                # Astro 配置文件
├── package.json
├── tailwind.config.mjs             # Tailwind CSS 配置
├── vercel.json                     # Vercel 部署配置
├── tsconfig.json                   # TypeScript 配置
└── .gitignore
```

---

## 💻 本地开发

### 环境要求

- **Node.js** >= 18（推荐 20/22 LTS）
- **npm** >= 9

### 安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/yyh321/boke.git
cd boke

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
# 访问 http://localhost:4321

# 4. 构建生产版本
npm run build

# 5. 预览构建结果
npm run preview
```

### 管理后台

```bash
# 本地访问管理后台
http://localhost:4321/admin/login

# 默认账号
用户名：admin
密码：admin123
```

### 环境变量

在项目根目录创建 `.env` 文件（本地开发可选，Vercel 部署时自动注入）：

```bash
# Redis 持久化（本地开发时不配置则使用 /tmp 文件存储）
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=your_token
```

### 可用脚本

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器（热重载） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm run astro` | Astro CLI |
| `npm test` | 运行 Playwright E2E 测试 |
| `node scripts/load-test.mjs` | 运行压力测试（需先启动服务） |

---

## 🚀 部署方案

### 生产环境部署（Vercel，推荐）

**一键部署：**

1. Fork 或克隆本仓库到 GitHub
2. 在 [Vercel](https://vercel.com) 导入仓库
3. 框架自动识别为 Astro，无需额外配置
4. 在 Vercel Dashboard → Storage → **创建 Upstash Redis**（免费版）
5. 部署后访问

**Vercel 配置特点：**

- 自动全球 CDN 分发
- 自动 HTTPS
- 自动 CI/CD：Git Push → 自动构建部署
- Serverless Functions 处理 API 路由和 SSR 页面
- 环境变量自动注入 Redis 凭据

**vercel.json 安全头配置：**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### 其他平台部署

**Netlify：**

```bash
# Build command
npm run build

# Publish directory
dist

# 需要添加 netlify.toml 重定向规则以支持 API 路由
```

**自托管 / Docker 部署：**

```dockerfile
# Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  blog:
    build: .
    ports:
      - "4321:4321"
    environment:
      - KV_REST_API_URL=${KV_REST_API_URL}
      - KV_REST_API_TOKEN=${KV_REST_API_TOKEN}
    restart: unless-stopped
```

### CI/CD 流水线

项目使用 Vercel 内置 CI/CD，无需额外配置：

```
Git Push (main) → GitHub Webhook → Vercel Build
                                      ├── npm install
                                      ├── npx astro build
                                      ├── Serverless Functions 打包
                                      └── 静态资源分发全球 CDN
```

---

## 📡 API 接口

完整 API 文档见 [docs/api.md](docs/api.md)

### 核心端点一览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/posts` | GET | 文章列表（支持 id、filter 参数） |
| `/api/posts` | POST | 创建文章 |
| `/api/posts` | PUT | 更新文章 |
| `/api/posts` | DELETE | 删除文章 |
| `/api/comments` | GET | 评论列表（支持 postId、filter 参数） |
| `/api/comments` | POST | 提交评论 |
| `/api/comments` | PUT | 审核/置顶/回复评论 |
| `/api/comments` | DELETE | 删除评论 |
| `/api/auth` | POST | 管理后台登录 |
| `/api/auth` | DELETE | 管理后台登出 |
| `/api/db-status` | GET | Redis 连接状态检测 |
| `/api/posts/debug` | GET | Redis 读写测试 |
| `/api/posts/fix-slugs` | GET | 修复中文 slug |

**频率限制：** 评论接口 5 次/分钟/IP

---

## 🗄 数据库设计

### 文章表 (posts)

核心字段：`id`, `title`, `content`, `slug`, `status`(draft/published/scheduled), `category`, `tags`, `coverImage`, `seoTitle`, `seoDescription`, `author`, `readingTime`, `commentCount`, 时间戳系列

### 评论表 (comments)

核心字段：`id`, `postId`, `parentId`(嵌套回复), `author`, `email`, `content`, `status`(pending/approved/rejected), `isPinned`, `isGuest`, `replyTo`

详细设计见 [docs/database.md](docs/database.md)

### 存储策略

| 层级 | 存储介质 | 持久性 | 说明 |
|------|---------|--------|------|
| L1 | **Upstash Redis** | ✅ 持久 | 主存储，写入时双锁 |
| L2 | `/tmp` 文件 | ❌ 临时 | 后备方案，冷启动丢失 |
| L3 | `.data/` 仓库种子 | ✅ 持久 | Content Collections 文章自动恢复 |

**读策略：** Redis → `/tmp` 文件 → `.data/` 种子（逐级回退）

**写策略：** 同时写入 Redis + `/tmp` 文件（双保险）

---

## 🧪 测试

### E2E 测试

```bash
# 安装 Playwright 浏览器
npx playwright install

# 运行测试
npm test
```

### 压力测试

```bash
# 启动开发服务器后运行
node scripts/load-test.mjs

# 自定义目标
BASE_URL=https://your-domain.com node scripts/load-test.mjs
```

覆盖：文章 CRUD、并发请求（20并发）、频率限制、边界用例（空值/超长/垃圾信息/不存在资源）

---

## 📄 许可证

MIT License

---

> 如有问题，欢迎提 [GitHub Issue](https://github.com/yyh321/boke/issues)
