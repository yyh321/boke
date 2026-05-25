# 博客系统接口文档

## 基础信息

- **基础URL**: `http://localhost:4321/api`
- **Content-Type**: `application/json`
- **鉴权方式**: Cookie-Based Session（管理后台）

---

## 文章接口

### 1. 获取文章列表

```
GET /api/posts
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 否 | 按 ID 获取单篇文章 |
| `filter` | string | 否 | `published` - 仅返回已发布文章 |

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "文章标题",
      "content": "文章内容 (Markdown)",
      "description": "文章摘要",
      "category": "技术",
      "tags": ["Astro", "TypeScript"],
      "coverImage": "",
      "status": "published",
      "scheduledDate": null,
      "publishDate": "2025-12-15T00:00:00.000Z",
      "createdAt": "2025-12-15T00:00:00.000Z",
      "updatedAt": "2025-12-15T00:00:00.000Z",
      "slug": "article-slug",
      "seoTitle": "文章标题 | 个人博客",
      "seoDescription": "文章SEO描述",
      "author": "博主",
      "readingTime": 5,
      "commentCount": 3
    }
  ]
}
```

### 2. 创建文章

```
POST /api/posts
```

**请求体:**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 文章标题（2-200字符） |
| `content` | string | 是 | Markdown 内容（10-50000字符） |
| `description` | string | 否 | 摘要，自动生成 |
| `category` | string | 否 | 分类，默认"未分类" |
| `tags` | string[] | 否 | 标签数组 |
| `coverImage` | string | 否 | 封面图 URL |
| `status` | string | 否 | `draft` / `published` / `scheduled` |
| `scheduledDate` | string | 否 | 定时发布时间 (ISO 8601) |
| `slug` | string | 否 | 自定义链接，自动生成 |

**响应:**
```json
// 201 Created
{
  "success": true,
  "data": { "...文章对象..." }
}

// 400 Bad Request
{
  "success": false,
  "error": "文章内容至少需要 10 个字符; 内容包含敏感词: ***"
}
```

### 3. 更新文章

```
PUT /api/posts
```

**请求体:** 同创建文章，额外需要 `id` 字段

### 4. 删除文章

```
DELETE /api/posts
```

**请求体:**
```json
{ "id": "uuid" }
```

---

## 评论接口

### 1. 获取评论

```
GET /api/comments
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 否 | 按 ID 获取单条评论 |
| `postId` | string | 否 | 获取某篇文章的评论（仅已审核） |
| `filter` | string | 否 | `pending` / `stats` |

### 2. 提交评论

```
POST /api/comments
```

**请求体:**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `postId` | string | 是 | 文章 ID / Slug |
| `author` | string | 是 | 昵称（1-50字符） |
| `email` | string | 否 | 邮箱 |
| `content` | string | 是 | 评论内容（1-2000字符） |
| `parentId` | string | 否 | 父评论 ID（回复时） |
| `replyTo` | string | 否 | 被回复者昵称 |
| `isGuest` | boolean | 否 | 是否游客，默认 true |

**频率限制:** 每个 IP 每分钟最多 5 条评论

**内容校验:**
- 敏感词过滤（自动替换为 `***`）
- 垃圾信息检测（URL 滥用、重复字符等）
- HTML 标签安全过滤
- XSS 防护（script 标签、事件处理器）

**响应:**
```json
// 201 Created
{
  "success": true,
  "data": { "...评论对象..." },
  "message": "评论已提交，等待审核"
}

// 429 Too Many Requests
{
  "success": false,
  "error": "操作过于频繁，请稍后再试"
}
```

### 3. 审核/管理评论

```
PUT /api/comments
```

**请求体:**
```json
{
  "id": "uuid",
  "action": "approve | reject | pin | reply"
}
```

| action | 说明 |
|--------|------|
| `approve` | 审核通过 |
| `reject` | 拒绝评论 |
| `pin` | 置顶/取消置顶切换 |
| `reply` | 博主回复（需传 `content` 字段） |

### 4. 删除评论

```
DELETE /api/comments
```

```json
{ "id": "uuid" }
```

---

## 认证接口

### 1. 登录

```
POST /api/auth
```

```json
{ "username": "admin", "password": "admin123" }
```

### 2. 退出

```
DELETE /api/auth
```

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 参数错误/校验失败 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

---

## 接口调用示例

```bash
# 创建文章
curl -X POST http://localhost:4321/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"测试文章","content":"正文内容...","category":"技术","status":"published"}'

# 提交评论
curl -X POST http://localhost:4321/api/comments \
  -H 'Content-Type: application/json' \
  -d '{"postId":"article-slug","author":"访客","content":"好文章！"}'

# 审核评论
curl -X PUT http://localhost:4321/api/comments \
  -H 'Content-Type: application/json' \
  -d '{"id":"comment-uuid","action":"approve"}'
```
