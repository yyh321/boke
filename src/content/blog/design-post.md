---
title: '设计模式在前端开发中的应用'
description: '探索常见设计模式在前端开发中的实际应用场景，提升代码可维护性和可扩展性'
pubDate: 2025-09-15
category: '技术'
tags: ['设计模式', '前端', '架构']
featured: false
---

## 单例模式

单例模式确保一个类只有一个实例：

```typescript
class Store {
  private static instance: Store

  private constructor() {}

  static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store()
    }
    return Store.instance
  }
}
```

### 在前端中的应用

- 状态管理 Store
- 全局配置对象
- 缓存管理

## 观察者模式

观察者模式定义了一对多的依赖关系：

```typescript
interface Observer {
  update(data: unknown): void
}

class Subject {
  private observers: Observer[] = []

  subscribe(observer: Observer): void {
    this.observers.push(observer)
  }

  notify(data: unknown): void {
    this.observers.forEach((o) => o.update(data))
  }
}
```

### 在前端中的应用

- 事件系统
- 响应式数据绑定
- WebSocket 消息处理

## 工厂模式

工厂模式封装了对象创建的逻辑：

```typescript
interface Component {
  render(): void
}

class Button implements Component {
  render() { /* ... */ }
}

class Input implements Component {
  render() { /* ... */ }
}

class ComponentFactory {
  static create(type: string): Component {
    switch (type) {
      case 'button': return new Button()
      case 'input': return new Input()
      default: throw new Error('Unknown component')
    }
  }
}
```

## 策略模式

策略模式定义了一系列可互换的算法：

```typescript
interface ValidationStrategy {
  validate(value: string): boolean
}

class EmailValidation implements ValidationStrategy {
  validate(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }
}

class PhoneValidation implements ValidationStrategy {
  validate(value: string): boolean {
    return /^\d{11}$/.test(value)
  }
}
```

### 最佳实践

- 合理使用设计模式，不要过度设计
- 优先考虑组合而非继承
- 结合实际业务场景选择合适的设计模式
