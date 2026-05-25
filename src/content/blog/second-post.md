---
title: '深入理解 TypeScript 高级类型'
description: '探索 TypeScript 中的条件类型、映射类型、模板字面量类型等高级特性，提升代码类型安全性'
pubDate: 2025-11-20
category: '技术'
tags: ['TypeScript', '前端', '编程语言']
featured: true
---

## 条件类型

条件类型可以根据条件选择不同的类型，类似于 JavaScript 中的三元运算符。

```typescript
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'> // true
type B = IsString<42>       // false
```

### 分布式条件类型

当条件类型作用于联合类型时，它会自动分布到联合类型的每个成员：

```typescript
type ToArray<T> = T extends any ? T[] : never
type Result = ToArray<string | number> // string[] | number[]
```

## 映射类型

映射类型可以基于已有类型创建新的类型：

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

type Partial<T> = {
  [P in keyof T]?: T[P]
}
```

## 模板字面量类型

TypeScript 4.1 引入了模板字面量类型：

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`
type ClickEvent = EventName<'click'> // 'onClick'
```

### 实用技巧

1. 使用 `infer` 关键字在条件类型中推断类型
2. 结合 `as const` 断言获取精确的字面量类型
3. 使用 `satisfies` 操作符进行类型验证

> 类型系统是 TypeScript 最强大的特性之一，掌握它能让你的代码更加健壮。
