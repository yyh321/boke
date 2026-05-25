# 数据库表结构设计说明

## 概述

系统采用 **JSON 文件存储** 方案，所有数据存储在 `.data/` 目录下。每个 JSON 文件对应一张数据表，数据结构定义如下。

---

## 1. 文章表 (posts.json)

### 表结构

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | 是 | 自动生成 | 主键，唯一标识 |
| `title` | string | 是 | - | 文章标题（2-200字符） |
| `content` | string | 是 | - | Markdown 正文（10-50000字符） |
| `description` | string | 否 | 自动生成 | 文章摘要/描述 |
| `category` | string | 是 | "未分类" | 文章分类 |
| `tags` | string[] | 否 | [] | 文章标签列表 |
| `coverImage` | string | 否 | "" | 封面图片 URL |
| `status` | enum | 是 | "draft" | 发布状态: `draft` / `published` / `scheduled` |
| `scheduledDate` | datetime | 否 | null | 定时发布时间 |
| `publishDate` | datetime | - | 发布时间 | 实际发布时间 |
| `createdAt` | datetime | 是 | 自动 | 创建时间 |
| `updatedAt` | datetime | 是 | 自动 | 更新时间 |
| `slug` | string | 是 | 自动生成 | URL 友好标识，唯一 |
| `seoTitle` | string | 否 | 自动生成 | SEO 标题（<60字符） |
| `seoDescription` | string | 否 | 自动生成 | SEO 描述（<160字符） |
| `author` | string | 否 | "博主" | 作者名称 |
| `readingTime` | number | 否 | 自动计算 | 预计阅读时间（分钟） |
| `commentCount` | number | 否 | 0 | 评论数量 |

### 索引设计

- `id` - 主键索引
- `slug` - 唯一索引（URL 查询）
- `status` - 状态索引（筛选已发布文章）
- `category` - 分类索引
- `tags` - 标签索引

### 数据示例

```json
{
  "id": "a1b2c3d4-...",
  "title": "从零开始搭建个人博客",
  "content": "## 为什么选择 Astro\n\nAstro 是一个现代化的静态站点生成器...",
  "description": "使用 Astro 框架构建一个高性能的博客网站",
  "category": "技术",
  "tags": ["Astro", "前端", "博客"],
  "coverImage": "",
  "status": "published",
  "scheduledDate": null,
  "publishDate": "2025-12-15T00:00:00.000Z",
  "createdAt": "2025-12-15T00:00:00.000Z",
  "updatedAt": "2025-12-15T00:00:00.000Z",
  "slug": "cong-ling-kai-shi-da-jian-ge-ren-bo-ke-lx5m2n",
  "seoTitle": "从零开始搭建个人博客 | 个人博客",
  "seoDescription": "使用 Astro 框架构建一个高性能的博客网站",
  "author": "博主",
  "readingTime": 5,
  "commentCount": 3
}
```

---

## 2. 评论表 (comments.json)

### 表结构

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | 是 | 自动生成 | 主键，唯一标识 |
| `postId` | string | 是 | - | 关联文章 Slug/ID |
| `parentId` | string | 否 | null | 父评论 ID（回复关系） |
| `author` | string | 是 | - | 评论者昵称（1-50字符） |
| `email` | string | 否 | "" | 评论者邮箱 |
| `content` | string | 是 | - | 评论内容（1-2000字符） |
| `status` | enum | 是 | "pending" | 审核状态: `pending` / `approved` / `rejected` |
| `isPinned` | boolean | 否 | false | 是否置顶 |
| `isGuest` | boolean | 否 | true | 是否游客（false 表示博主） |
| `replyTo` | string | 否 | null | 被回复者昵称（显示用） |
| `createdAt` | datetime | 是 | 自动 | 创建时间 |
| `updatedAt` | datetime | 是 | 自动 | 更新时间 |

### 索引设计

- `id` - 主键索引
- `postId` - 关联索引（按文章获取评论）
- `status` - 状态索引（筛选待审核评论）
- `parentId` - 关联索引（评论回复树）

### 数据示例

```json
{
  "id": "comment-uuid-1",
  "postId": "first-post",
  "parentId": null,
  "author": "访客小明",
  "email": "xiaoming@example.com",
  "content": "写得非常好，学到了很多！",
  "status": "approved",
  "isPinned": false,
  "isGuest": true,
  "replyTo": null,
  "createdAt": "2025-12-16T10:30:00.000Z",
  "updatedAt": "2025-12-16T10:30:00.000Z"
}
```

---

## 3. Content Collections（内容集合）

系统同时使用 Astro 原生 Content Collections 管理静态文章，数据存储在 `src/content/blog/` 目录下。

### Schema

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 文章标题 |
| `description` | string | 是 | 文章描述 |
| `pubDate` | date | 是 | 发布日期 |
| `updatedDate` | date | 否 | 更新日期 |
| `heroImage` | image | 否 | 封面图 |
| `category` | string | 是 | 分类 |
| `tags` | string[] | 是 | 标签 |
| `draft` | boolean | 否 | 是否草稿 |
| `featured` | boolean | 否 | 是否精选 |
| `readingTime` | number | 否 | 阅读时长 |

---

## 4. 数据关联关系

```
Post (文章) 1 ──── * Comment (评论)
  │                      │
  │                      └── parentId (自关联回复树)
  │
  └── Content Collections: src/content/blog/*.md
  └── Database: .data/posts.json
```

## 5. 数据文件存储路径

```
.data/
  ├── posts.json              # 文章数据
  ├── comments.json           # 评论数据
  └── notifications.log       # 通知日志（运行时生成）
```

## 6. 数据安全说明

- 所有用户输入经过 **XSS 防护**（过滤 script 标签和事件处理器）
- 评论内容通过 **敏感词过滤** 和 **垃圾信息检测**
- 评论提交限制 **5 次/分钟/IP**
- 评论默认为 **pending 状态**，需管理员审核通过后展示
