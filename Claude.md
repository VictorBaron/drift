## 0. Contexte Produit

### Qu'est-ce que Drift

Drift est un outil d'intelligence projet pour les duos CTO/CPO. Il lit automatiquement Slack, Linear et Notion pour générer un status hebdomadaire structuré de chaque projet — incluant les décisions prises, les blockers, l'avancement delivery, et surtout la détection de **drift** (divergence entre l'intention produit initiale et ce qui se construit réellement).

### Proposition de valeur

> "Drift lit vos conversations Slack, vos tickets Linear et vos specs Notion pour générer la vue projet que Product et Engineering partagent. Plus de 'on n'était pas alignés'. Plus de 'je croyais que c'était décidé'."

### Audience V1

- **Buyer principal** : CTO ou CPO de startups/scale-ups tech (20-80 personnes)
- **Co-bénéficiaire** : Le binôme CTO+CPO reçoit le même rapport comme source de vérité partagée
- **Stack requise** : Slack + Linear + Notion

### Ce que V1 fait

1. **Ingestion automatique** : Lit les messages Slack (channels sélectionnés), les tickets Linear (projet mappé), et une page Notion (spec/brief) par projet
2. **Synthèse LLM** : Génère un rapport structuré hebdomadaire par projet
3. **Détection de drift** : Compare ce qui se construit vs l'intention produit documentée
4. **Delivery** : Envoie le rapport par DM Slack + dashboard web consultable
5. **Portfolio view** : Vue agrégée de tous les projets pour le duo CTO/CPO

### Ce que V1 ne fait PAS

- Pas de write-back (on ne crée rien dans Slack/Linear/Notion)
- Pas de Jira/GitHub/Figma (V2+)
- Pas de multi-workspace Slack
- Pas de SSO/SAML
- Pas de billing automatique (Stripe V2)
- Pas d'historique long-terme / decision log (V2)

---

## 1. Architecture Technique

### Stack

| Composant | Techno | Justification |
|-----------|--------|---------------|
| Backend API | **NestJS** (TypeScript) | Existant, modulaire, DI native |
| Base de données | **PostgreSQL 16** | JSONB pour stocker les données brutes, full-text search |
| ORM | **MikroORM** | Migrations, type-safety, hexagonal architecture (domain ≠ persistence models) |
| LLM | **Claude API** (Sonnet 4) | Meilleur rapport qualité/coût pour la synthèse |
| Job scheduler | **@nestjs/schedule** (cron) | Simple, pas besoin de Redis/Bull pour V1 |
| Frontend | **Vite + React 18** | SPA, React Router v6, React Query |
| UI | **Tailwind CSS** | Styling utility-first, fidèle au prototype |
| Auth | **Slack OAuth** | L'user s'authentifie via Slack, c'est le point d'entrée |
| Hosting | **Railway** | Simple, PostgreSQL inclus, pas de DevOps |
| File storage | Pas nécessaire V1 | Les données brutes sont en JSONB dans PG |

### Diagramme Simplifié

```
┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Slack API  │     │  Linear API  │     │  Notion API │
│  (messages)  │     │  (tickets)   │     │   (pages)   │
└──────┬───────┘     └──────┬───────┘     └──────┬──────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                   INGESTION LAYER                    │
│  Cron: toutes les heures (Slack), 2x/jour (Linear)   │
│  On-demand (Notion au moment de la génération)       │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              │  (données brutes │
              │   + rapports)    │
              └────────┬─────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│               GENERATION PIPELINE (LLM)               │
│  Cron: lundi 7h (ou on-demand)                        │
│  1. Filtrage heuristique des messages                 │
│  2. Agrégation données Linear                         │
│  3. Lecture spec Notion                               │
│  4. Prompt structuré → Claude API                     │
│  5. Parsing JSON → stockage rapport                   │
└──────────────────────┬────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
   ┌──────────────┐      ┌──────────────┐
   │ Slack DM     │      │ Dashboard    │
   │ (rapport     │      │ Web (Vite)   │
   │  formaté)    │      │              │
   └──────────────┘      └──────────────┘
```

### Structure des Dossiers

```
drift/
├── apps/
│   ├── api/                    # NestJS backend (Hexagonal Architecture + DDD)
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── auth/           # Slack OAuth, sessions
│   │       └── core/
│   │           ├── accounts/       # Organization & Member aggregates
│   │           ├── projects/       # Project aggregate + source mapping
│   │           ├── reports/        # Report aggregate + génération
│   │           ├── integrations/
│   │           │   ├── slack/      # Slack ingestion + delivery
│   │           │   ├── linear/     # Linear ingestion
│   │           │   └── notion/     # Notion page reader
│   │           ├── pipeline/       # Orchestration LLM
│   │           ├── scheduler/      # Cron jobs
│   │           └── ai/             # LLM client (Claude API)
│   └── app/                    # React frontend (Vite)
│       └── src/
│           ├── pages/              # Route-level page components
│           ├── features/           # Feature modules (dashboard, projects, onboarding)
│           ├── components/         # Shared UI components
│           │   └── ui/             # Base primitives
│           ├── services/           # API client (fetch + React Query)
│           ├── routes/             # React Router route definitions
│           ├── store/              # Zustand global state
│           ├── types/              # Shared TypeScript types
│           └── lib/                # Utilities (cn, formatDate, etc.)
└── packages/
    └── shared/                 # Types partagés API ↔ App
        └── types/
```

---

## 2. Modèle de Données

### Architecture DDD

Le backend suit l'architecture hexagonale stricte. Chaque entité a :
- Un **domain aggregate** (plain TypeScript class, business logic)
- Un **MikroORM model** (`*.mikroORM.ts`, persistence only)
- Un **mapper** (`toDomain` / `toPersistence`)

### Domain Aggregates

```typescript
// apps/api/src/core/accounts/domain/aggregates/organization.aggregate.ts
export class Organization extends AggregateRoot {
  private name: string;
  private slackTeamId: string;
  private slackBotToken: string;          // encrypted
  private slackUserTokens: Record<string, string>; // { userId: token }
  private linearAccessToken: string | null;

  static create(props: CreateOrganizationProps): Organization { ... }
  static reconstitute(props: OrganizationProps): Organization { ... }

  updateSlackBotToken(token: string): void { ... }
  connectLinear(token: string): void { ... }
}

// apps/api/src/core/accounts/domain/aggregates/member.aggregate.ts
export class Member extends AggregateRoot {
  private email: string;
  private name: string;
  private slackUserId: string;
  private avatarUrl: string | null;
  private role: MemberRole;              // 'admin' | 'member'
  private organizationId: string;

  static create(props: CreateMemberProps): Member { ... }
  isAdmin(): boolean { ... }
}

// apps/api/src/core/projects/domain/aggregates/project.aggregate.ts
export class Project extends AggregateRoot {
  private name: string;
  private emoji: string;
  private organizationId: string;
  private pmLeadName: string | null;
  private techLeadName: string | null;
  private teamName: string | null;
  private targetDate: Date | null;
  private weekNumber: number;
  private slackChannelIds: string[];
  private linearProjectId: string | null;
  private linearTeamId: string | null;
  private notionPageId: string | null;
  private productObjective: string | null;
  private objectiveOrigin: string | null;
  private keyResults: KeyResult[];
  private isActive: boolean;

  static create(props: CreateProjectProps): Project { ... }
  addSlackChannel(channelId: string): void { ... }
  setLinearProject(projectId: string, teamId: string): void { ... }
  setNotionPage(pageId: string): void { ... }
  setProductObjective(objective: string, origin: string, krs: KeyResult[]): void { ... }
  deactivate(): void { ... }
}

// apps/api/src/core/integrations/slack/domain/aggregates/slack-message.aggregate.ts
export class SlackMessage extends AggregateRoot {
  private organizationId: string;
  private projectId: string | null;
  private channelId: string;
  private messageTs: string;             // Slack timestamp (unique per channel)
  private threadTs: string | null;
  private userId: string;
  private userName: string;
  private text: string;
  private isBot: boolean;
  private hasFiles: boolean;
  private reactionCount: number;
  private replyCount: number;
  private isFiltered: boolean;           // true = excluded by heuristic filter

  static ingest(props: IngestSlackMessageProps): SlackMessage { ... }
  markFiltered(): void { ... }
}

// apps/api/src/core/integrations/linear/domain/aggregates/linear-ticket-snapshot.aggregate.ts
export class LinearTicketSnapshot extends AggregateRoot {
  private organizationId: string;
  private projectId: string | null;
  private linearIssueId: string;
  private identifier: string;            // "CHK-89"
  private title: string;
  private description: string | null;
  private stateName: string;
  private stateType: string;             // "started" | "completed" | "canceled"
  private priority: number;             // 0=none, 1=urgent, 4=low
  private assigneeName: string | null;
  private labelNames: string[];
  private commentCount: number;
  private snapshotDate: Date;
  private snapshotWeekStart: Date;

  static snapshot(props: SnapshotProps): LinearTicketSnapshot { ... }
}

// apps/api/src/core/reports/domain/aggregates/report.aggregate.ts
export class Report extends AggregateRoot {
  private projectId: string;
  private weekStart: Date;
  private weekEnd: Date;
  private weekNumber: number;
  private periodLabel: string;           // "Week 7 · Feb 17–23"
  private content: ReportContent;        // JSON structuré — voir Section 5
  private health: ProjectHealth;         // 'on-track' | 'at-risk' | 'off-track'
  private driftLevel: DriftLevel;        // 'none' | 'low' | 'high'
  private progress: number;             // 0-100
  private prevProgress: number;
  private slackMessageCount: number;
  private linearTicketCount: number;
  private notionPagesRead: number;
  private modelUsed: string;
  private promptTokens: number;
  private completionTokens: number;
  private generationTimeMs: number;
  private slackDeliveredAt: Date | null;
  private slackMessageTs: string | null;

  static generate(props: GenerateReportProps): Report { ... }
  markDelivered(messageTs: string): void { ... }
}
```

### MikroORM Models

```typescript
// apps/api/src/core/accounts/infrastructure/persistence/mikro-orm/models/organization.mikroORM.ts
@Entity({ tableName: 'organization' })
export class OrganizationMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  name: string;

  @Property({ type: 'varchar', length: 255 })
  @Unique()
  slackTeamId: string;

  @Property({ type: 'text' })
  slackBotToken: string;

  @Property({ type: 'jsonb', nullable: true })
  slackUserTokens: Record<string, string> | null;

  @Property({ type: 'text', nullable: true })
  linearAccessToken: string | null;
}

// apps/api/src/core/accounts/infrastructure/persistence/mikro-orm/models/member.mikroORM.ts
@Entity({ tableName: 'member' })
export class MemberMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  @Unique()
  email: string;

  @Property({ type: 'varchar', length: 255 })
  name: string;

  @Property({ type: 'varchar', length: 255 })
  slackUserId: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Property({ type: 'varchar', length: 50 })
  role: string;                     // 'admin' | 'member'

  @ManyToOne(() => OrganizationMikroOrm, { fieldName: 'organization_id' })
  organization: OrganizationMikroOrm;

  @Index()
  @Property({ type: 'varchar', length: 255 })
  organizationId: string;
}

// apps/api/src/core/projects/infrastructure/persistence/mikro-orm/models/project.mikroORM.ts
@Entity({ tableName: 'project' })
export class ProjectMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  name: string;

  @Property({ type: 'varchar', length: 10 })
  emoji: string;

  @Property({ type: 'varchar', length: 255 })
  organizationId: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  pmLeadName: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  techLeadName: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  teamName: string | null;

  @Property({ type: 'timestamptz', nullable: true })
  targetDate: Date | null;

  @Property({ type: 'int' })
  weekNumber: number;

  @Property({ type: 'jsonb' })
  slackChannelIds: string[];

  @Property({ type: 'varchar', length: 255, nullable: true })
  linearProjectId: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  linearTeamId: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  notionPageId: string | null;

  @Property({ type: 'text', nullable: true })
  productObjective: string | null;

  @Property({ type: 'text', nullable: true })
  objectiveOrigin: string | null;

  @Property({ type: 'jsonb', nullable: true })
  keyResults: { text: string; done: boolean }[] | null;

  @Property({ type: 'boolean' })
  isActive: boolean;
}

// apps/api/src/core/integrations/slack/infrastructure/persistence/mikro-orm/models/slack-message.mikroORM.ts
@Entity({ tableName: 'slack_message' })
@UniqueConstraint({ properties: ['channelId', 'messageTs'] })
@Index({ properties: ['projectId', 'ingestedAt'] })
@Index({ properties: ['channelId', 'ingestedAt'] })
export class SlackMessageMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  organizationId: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  projectId: string | null;

  @Property({ type: 'varchar', length: 255 })
  channelId: string;

  @Property({ type: 'varchar', length: 255 })
  messageTs: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  threadTs: string | null;

  @Property({ type: 'varchar', length: 255 })
  userId: string;

  @Property({ type: 'varchar', length: 255 })
  userName: string;

  @Property({ type: 'text' })
  text: string;

  @Property({ type: 'boolean' })
  isBot: boolean;

  @Property({ type: 'boolean' })
  hasFiles: boolean;

  @Property({ type: 'int' })
  reactionCount: number;

  @Property({ type: 'int' })
  replyCount: number;

  @Property({ type: 'boolean' })
  isFiltered: boolean;

  @Property({ type: 'timestamptz' })
  ingestedAt: Date;
}

// apps/api/src/core/integrations/linear/infrastructure/persistence/mikro-orm/models/linear-ticket-snapshot.mikroORM.ts
@Entity({ tableName: 'linear_ticket_snapshot' })
@Index({ properties: ['projectId', 'snapshotWeekStart'] })
@Index({ properties: ['linearIssueId', 'snapshotDate'] })
export class LinearTicketSnapshotMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  organizationId: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  projectId: string | null;

  @Property({ type: 'varchar', length: 255 })
  linearIssueId: string;

  @Property({ type: 'varchar', length: 50 })
  identifier: string;

  @Property({ type: 'text' })
  title: string;

  @Property({ type: 'text', nullable: true })
  description: string | null;

  @Property({ type: 'varchar', length: 100 })
  stateName: string;

  @Property({ type: 'varchar', length: 50 })
  stateType: string;

  @Property({ type: 'int' })
  priority: number;

  @Property({ type: 'varchar', length: 255, nullable: true })
  assigneeName: string | null;

  @Property({ type: 'jsonb' })
  labelNames: string[];

  @Property({ type: 'int' })
  commentCount: number;

  @Property({ type: 'timestamptz' })
  snapshotDate: Date;

  @Property({ type: 'timestamptz' })
  snapshotWeekStart: Date;
}

// apps/api/src/core/reports/infrastructure/persistence/mikro-orm/models/report.mikroORM.ts
@Entity({ tableName: 'report' })
@UniqueConstraint({ properties: ['projectId', 'weekStart'] })
@Index({ properties: ['projectId', 'generatedAt'] })
export class ReportMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  projectId: string;

  @Property({ type: 'timestamptz' })
  weekStart: Date;

  @Property({ type: 'timestamptz' })
  weekEnd: Date;

  @Property({ type: 'int' })
  weekNumber: number;

  @Property({ type: 'varchar', length: 100 })
  periodLabel: string;

  @Property({ type: 'jsonb' })
  content: ReportContent;

  @Property({ type: 'varchar', length: 20 })
  health: string;                   // 'on-track' | 'at-risk' | 'off-track'

  @Property({ type: 'varchar', length: 20 })
  driftLevel: string;               // 'none' | 'low' | 'high'

  @Property({ type: 'int' })
  progress: number;

  @Property({ type: 'int' })
  prevProgress: number;

  @Property({ type: 'int' })
  slackMessageCount: number;

  @Property({ type: 'int' })
  linearTicketCount: number;

  @Property({ type: 'int' })
  notionPagesRead: number;

  @Property({ type: 'varchar', length: 100 })
  modelUsed: string;

  @Property({ type: 'int' })
  promptTokens: number;

  @Property({ type: 'int' })
  completionTokens: number;

  @Property({ type: 'int' })
  generationTimeMs: number;

  @Property({ type: 'timestamptz' })
  generatedAt: Date;

  @Property({ type: 'timestamptz', nullable: true })
  slackDeliveredAt: Date | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  slackMessageTs: string | null;
}
```
**Key Rules:**

- Every database read/write goes through a repository — never call the ORM directly from application or domain layer
- Every external API call goes through a gateway interface — never call Slack/Google/Claude APIs directly from application or domain layer
- Domain models and persistence models are separate classes — always use mappers to convert between them
- Aggregates enforce their own invariants — validation logic belongs on the aggregate, not in the service
- **Dependency injection is mandatory** for all services/repositories that access external systems (database, Slack API, Google Calendar API, Claude API, etc.) — define port interfaces in domain, inject implementations via NestJS DI

## Database / ORM

For MikroORM entities: avoid composite primary keys, use `rel()` helper for setting foreign key references without loading full entities, and be careful with circular barrel-file imports which cause undefined mapper errors at runtime.

## Commands

```bash
# Install dependencies (at root)
pnpm install

# Start development (all apps in watch mode via Turbo)
pnpm dev

# Build all apps
pnpm build

# API-specific commands (run from apps/api/)
pnpm dev              # Start NestJS in watch mode
pnpm build            # Compile TypeScript
pnpm start:prod       # Run compiled API

# Electron-specific commands (run from apps/electron/)
pnpm start            # Launch Electron app
```

## Constraints

- Do not use parent repositories in import paths:
  - Use relative imports if files are colocated, absolute imports if the file is in a parent repository
  - For absolute imports, core modules (modules inside src/core/) should be accessed through alias path @/.
    Example: @/users/domain


 ## Linting & Formatting
 
Use Biome for formatting and linting (not Prettier). 

