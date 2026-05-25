---
title: '从零开始搭建个人博客'
description: '使用 Astro 框架构建一个高性能、SEO 友好的个人博客网站，记录技术成长与生活感悟'
pubDate: 2025-12-15
updatedDate: 2025-12-20
category: '技术'
tags: ['Astro', '前端', '博客']
featured: true
---

## 为什么选择 Astro

Astro 是一个现代化的静态站点生成器，它提供了出色的开发体验和用户体验。

### 岛屿架构

Astro 的岛屿架构（Islands Architecture）允许我们按需加载交互组件，这意味着页面的大部分内容都是静态 HTML，只有需要交互的部分才会加载 JavaScript。

### 内容集合

Content Collections 提供了类型安全的内容管理方式，让我们可以轻松管理 Markdown 和 MDX 文章。

## 快速开始

```bash
# 创建项目
npm create astro@latest

# 启动开发服务器
npm run dev
```

### 项目结构

```
src/
  content/    # 文章内容
  layouts/    # 布局组件
  components/ # 可复用组件
  pages/      # 页面文件
```

## 性能优化

Astro 默认生成为静态 HTML，这使得首屏加载极快。配合以下优化策略，可以获得更好的性能：

1. **图片优化** - 使用 Astro 内置的 Image 组件
2. **代码分割** - 岛屿架构自动完成
3. **预加载** - 智能预加载关键资源

> Astro 的目标是让 Web 更快，而它确实做到了。

### Lighthouse 评分

优化后的 Astro 网站通常可以达到 100 分的 Lighthouse 性能评分，包括最佳实践和 SEO 类别。
