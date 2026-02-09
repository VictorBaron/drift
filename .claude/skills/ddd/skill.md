---
name: ddd
description: Domain-Driven Design patterns for backend architecture
allowed-tools: Read, Write, Edit, Glob, Grep
context: inherit
agent: backend-architect
---

# Domain-Driven Design (DDD)

## When to Apply

Use DDD when:

- Building a new domain module or feature
- Refactoring existing code to be more domain-centric
- Designing aggregates, entities, or value objects
- Implementing domain events or domain services

## Project Structure

```
src/
└── [module]/
    ├── domain/                 # Pure domain logic (no framework dependencies)
    │   ├── entities/           # Entities with identity
    │   ├── value-objects/      # Immutable value objects
    │   ├── aggregates/         # Aggregate roots
    │   ├── events/             # Domain events
    │   ├── services/           # Domain services
    │   └── repositories/       # Repository interfaces (ports)
    ├── application/            # Use cases / Application services
    │   ├── commands/           # Command handlers (write operations)
    │   ├── queries/            # Query handlers (read operations)
    │   └── dto/                # Data transfer objects
    ├── infrastructure/         # Framework & external dependencies
    │   ├── persistence/        # Repository implementations (adapters)
    │   ├── mappers/            # Entity <-> ORM model mappers
    │   └── services/           # External service adapters
    └── [module].module.ts      # NestJS module definition
```

## Core Building Blocks

### 1. Value Objects

Immutable objects defined by their attributes, not identity.

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    if (!value || !value.includes("@")) {
      throw new Error("Invalid email format");
    }
    return new Email(value.toLowerCase().trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

```typescript
// domain/value-objects/money.vo.ts
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0) throw new Error("Amount cannot be negative");
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot add different currencies");
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  getAmount(): number {
    return this.amount;
  }
  getCurrency(): string {
    return this.currency;
  }
}
```

### 2. Entities

Objects with a unique identity that persists over time.

```typescript
// domain/entities/user.entity.ts
export class User {
  private constructor(
    private readonly id: string,
    private email: Email,
    private name: string,
    private readonly createdAt: Date
  ) {}

  static create(props: { id: string; email: Email; name: string }): User {
    return new User(props.id, props.email, props.name, new Date());
  }

  static reconstitute(props: {
    id: string;
    email: Email;
    name: string;
    createdAt: Date;
  }): User {
    return new User(props.id, props.email, props.name, props.createdAt);
  }

  updateName(name: string): void {
    if (!name || name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }
    this.name = name;
  }

  getId(): string {
    return this.id;
  }
  getEmail(): Email {
    return this.email;
  }
  getName(): string {
    return this.name;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
}
```

### 3. Aggregates

Cluster of entities and value objects with a root entity.

```typescript
// domain/aggregates/order.aggregate.ts
export class Order {
  private constructor(
    private readonly id: string,
    private readonly customerId: string,
    private items: OrderItem[],
    private status: OrderStatus,
    private readonly createdAt: Date
  ) {}

  static create(id: string, customerId: string): Order {
    const order = new Order(id, customerId, [], OrderStatus.DRAFT, new Date());
    order.addDomainEvent(new OrderCreatedEvent(id, customerId));
    return order;
  }

  // Domain events collection
  private domainEvents: DomainEvent[] = [];

  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  // Business logic encapsulated in the aggregate
  addItem(productId: string, quantity: number, price: Money): void {
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error("Cannot modify a submitted order");
    }
    const existingItem = this.items.find((i) => i.productId === productId);
    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      this.items.push(new OrderItem(productId, quantity, price));
    }
  }

  submit(): void {
    if (this.items.length === 0) {
      throw new Error("Cannot submit an empty order");
    }
    this.status = OrderStatus.SUBMITTED;
    this.addDomainEvent(new OrderSubmittedEvent(this.id));
  }

  getTotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getSubtotal()),
      Money.create(0, "EUR")
    );
  }
}
```

### 4. Repository Interface (Port)

```typescript
// domain/repositories/order.repository.ts
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
}

export const ORDER_REPOSITORY = Symbol("OrderRepository");
```

### 5. Repository Implementation (Adapter)

```typescript
// infrastructure/persistence/order.repository.prisma.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderRepository } from "../../domain/repositories/order.repository";
import { Order } from "../../domain/aggregates/order.aggregate";
import { OrderMapper } from "../mappers/order.mapper";

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return data ? OrderMapper.toDomain(data) : null;
  }

  async save(order: Order): Promise<void> {
    const data = OrderMapper.toPersistence(order);
    await this.prisma.order.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    // Publish domain events
    const events = order.pullDomainEvents();
    await this.eventPublisher.publishAll(events);
  }
}
```

```typescript
// infrastructure/persistence/order.repository.inmemory.ts
import { OrderRepository } from "../../domain/repositories/order.repository";
import { Order } from "../../domain/aggregates/order.aggregate";

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order>;
  constructor() {
    this.orders = new Map();
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.orders.get(id);
    return order ? OrderMapper.toDomain(order) : null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.getId(), order);
  }
}
```

### 6. Domain Events

```typescript
// domain/events/order-created.event.ts
export abstract class DomainEvent {
  readonly occurredOn: Date = new Date();
  abstract readonly eventName: string;
}

export class OrderCreatedEvent extends DomainEvent {
  readonly eventName = "order.created";

  constructor(
    readonly orderId: string,
    readonly customerId: string
  ) {
    super();
  }
}
```

### 7. Application Service (Use Case)

```typescript
// application/commands/create-order.handler.ts
import { Injectable, Inject } from "@nestjs/common";
import { Order } from "../../domain/aggregates/order.aggregate";
import {
  OrderRepository,
  ORDER_REPOSITORY,
} from "../../domain/repositories/order.repository";
import { EventPublisher } from "../../infrastructure/events/event-publisher";

export class CreateOrderCommand {
  constructor(
    readonly customerId: string,
    readonly items: { productId: string; quantity: number; price: number }[]
  ) {}
}

@Injectable()
export class CreateOrderHandler {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const orderId = crypto.randomUUID();
    const order = Order.create(orderId, command.customerId);

    for (const item of command.items) {
      order.addItem(
        item.productId,
        item.quantity,
        Money.create(item.price, "EUR")
      );
    }

    await this.orderRepo.save(order);

    return orderId;
  }
}
```

### 8. Domain Service

Use when logic doesn't belong to a single aggregate.

```typescript
// domain/services/pricing.service.ts
export class PricingService {
  calculateDiscount(order: Order, customer: Customer): Money {
    const total = order.getTotal();

    if (customer.isVip()) {
      return total.multiply(0.1); // 10% VIP discount
    }

    if (total.getAmount() > 100) {
      return total.multiply(0.05); // 5% bulk discount
    }

    return Money.create(0, total.getCurrency());
  }
}
```

## Module Wiring (NestJS)

```typescript
// orders.module.ts
import { Module } from "@nestjs/common";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository";
import { PrismaOrderRepository } from "./infrastructure/persistence/prisma-order.repository";
import { CreateOrderHandler } from "./application/commands/create-order.handler";
import { OrdersController } from "./orders.controller";

@Module({
  controllers: [OrdersController],
  providers: [
    CreateOrderHandler,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
  ],
})
export class OrdersModule {}
```

## Checklist

### When Creating a New Domain Module

- [ ] Identify the aggregate root(s)
- [ ] Define value objects for domain concepts (Email, Money, Address, etc.)
- [ ] Keep domain layer free of framework dependencies
- [ ] Define repository interface in domain, implementation in infrastructure
- [ ] Encapsulate business rules in entities/aggregates, not services
- [ ] Use factory methods (`create`, `reconstitute`) instead of public constructors
- [ ] Emit domain events for significant state changes

### Anti-Patterns to Avoid

```typescript
// BAD: Anemic domain model (logic in service, not entity)
class OrderService {
  addItem(order: Order, item: Item) {
    if (order.status !== "draft") throw new Error("...");
    order.items.push(item); // Direct mutation!
  }
}

// GOOD: Rich domain model (logic in entity)
class Order {
  addItem(item: Item) {
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error("Cannot modify a submitted order");
    }
    this.items.push(item);
  }
}
```

```typescript
// BAD: Exposing internals
class Order {
  public items: Item[] = []; // Direct access!
}

// GOOD: Encapsulation
class Order {
  private items: Item[] = [];

  getItems(): ReadonlyArray<Item> {
    return [...this.items];
  }
}
```

## Quick Reference

| Concept             | Purpose                 | Example                 |
| ------------------- | ----------------------- | ----------------------- |
| Value Object        | Immutable, no identity  | Email, Money, Address   |
| Entity              | Has identity, mutable   | User, Product           |
| Aggregate           | Consistency boundary    | Order (with OrderItems) |
| Repository          | Persistence abstraction | OrderRepository         |
| Domain Service      | Cross-entity logic      | PricingService          |
| Domain Event        | Record state changes    | OrderCreatedEvent       |
| Application Service | Orchestrates use cases  | CreateOrderHandler      |
