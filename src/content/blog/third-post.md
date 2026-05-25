---
title: 'CSS 现代布局完全指南'
description: '从 Flexbox 到 Grid，再到 Container Queries，掌握现代 CSS 布局方案'
pubDate: 2025-10-10
category: '技术'
tags: ['CSS', '前端', '布局']
featured: false
---

## Flexbox 布局

Flexbox 是一维布局方案，适合处理行或列方向的排列。

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}
```

### 常见场景

- 导航栏布局
- 卡片排列
- 垂直居中

## CSS Grid 布局

Grid 是二维布局方案，同时处理行和列：

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
```

### 命名区域

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}
```

## Container Queries

容器查询让组件可以根据容器大小调整样式：

```css
@container (min-width: 600px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

### 最佳实践

- 优先使用 Grid 进行整体页面布局
- 组件内部使用 Flexbox
- Container Queries 用于可复用组件
