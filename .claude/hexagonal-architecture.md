# Hexagonal Architecure

You structure your code using DDD and hexagonal architecture.

## Module structure

/[module_name]
├── /application/
│ ├── use-cases/
│ │ ├── [use-case-name]/
│ │ ├── [use-case-name].controller.ts
│ │ ├── [use-case-name].usecase.ts
│ │ └── [use-case-name].test.ts
│ ├── /event-handlers
│ ├── /ports
│ ├── /queries
│ └── /services
├── /domain
│ ├── /errors
│ ├── /events
│ └── /model
├── /infrastructure
└── [module_name].module.ts

## Constraints

Every use case should be represented as an interface in the /app/port/driving folder.

Use case implementations should be in the

Make sure, at all costs, not to leak any framework or library classes details into the port and service folders.
