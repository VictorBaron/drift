# Drift V1 — Spécifications Techniques & Plan de Build

## Table des Matières

- [0. Contexte Produit](#0-contexte-produit)
- [1. Architecture Technique](#1-architecture-technique)
- [2. Modèle de Données](#2-modèle-de-données)
- [3. Plan de Build — Étapes Claude Code](#3-plan-de-build)
  - [Étape 1: Initialisation du Projet](#étape-1-initialisation-du-projet)
  - [Étape 2: Modèle de Données & Migrations](#étape-2-modèle-de-données--migrations)
  - [Étape 3: Authentification & Onboarding Slack](#étape-3-authentification--onboarding-slack)
  - [Étape 4: Ingestion Slack](#étape-4-ingestion-slack)
  - [Étape 5: Intégration Linear (OAuth + Ingestion)](#étape-5-intégration-linear)
  - [Étape 6: Intégration Notion (Lecture page spec)](#étape-6-intégration-notion)
  - [Étape 7: Pipeline LLM — Génération du Status](#étape-7-pipeline-llm)
  - [Étape 8: Delivery — Envoi du rapport Slack](#étape-8-delivery-slack)
  - [Étape 9: Dashboard Web (Prototype → App)](#étape-9-dashboard-web)
  - [Étape 10: Onboarding Self-Serve (App Home Slack)](#étape-10-onboarding-self-serve)
- [4. Prompt LLM — Spécification Complète](#4-prompt-llm)
- [5. Structure JSON du Rapport Généré](#5-structure-json-du-rapport)
- [Annexe A: API Reference par Intégration](#annexe-a-api-reference)
- [Annexe B: Prototype UI Reference](#annexe-b-prototype-ui-reference)

---

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

---

## 3. Plan de Build — Étapes Claude Code

Chaque étape est un bloc autonome. Le prompt Claude Code correspondant est encadré. Les critères de validation sont listés à la fin de chaque étape.

---

### Étape 1: Initialisation du Projet

**Durée estimée** : 2-3h

**Prompt Claude Code** :

```
Initialise un monorepo pour le projet "Drift" avec la structure suivante :

BACKEND (apps/api/) :
- NestJS avec TypeScript strict
- MikroORM comme ORM avec PostgreSQL
- Configuration : @nestjs/config avec .env
- Modules à créer (vides pour l'instant) : AuthModule, ProjectsModule, IntegrationsModule, ReportsModule, PipelineModule, SchedulerModule
- Health check endpoint GET /health
- CORS configuré pour localhost:3001

FRONTEND (apps/app/) :
- Vite + React 18 + TypeScript
- Tailwind CSS
- React Router v6
- React Query (TanStack Query)
- Layout de base avec une page d'accueil simple
- Port de dev : 3001

PACKAGES (packages/shared/) :
- Package TypeScript avec les types partagés entre API et App

Configuration :
- Biome pour lint et formatting
- docker-compose.yml avec PostgreSQL 16
- .env.example avec toutes les variables nécessaires
- README.md avec les instructions de setup

Variables d'environnement attendues :
DATABASE_URL, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET,
LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET, NOTION_INTEGRATION_TOKEN,
ANTHROPIC_API_KEY, APP_URL (http://localhost:3000 en dev), WEB_URL (http://localhost:3001 en dev)
```

**Validation** :
- [ ] `docker-compose up -d` lance PostgreSQL
- [ ] `cd apps/api && pnpm dev` → API démarre sur :3000
- [ ] `cd apps/app && pnpm dev` → App démarre sur :3001
- [ ] GET /health retourne 200
- [ ] `npx mikro-orm migration:up` s'exécute sans erreur

---

### Étape 2: Modèle de Données & Migrations

**Durée estimée** : 2-3h

**Prompt Claude Code** :

```
Implémente le modèle de données pour Drift en suivant l'architecture hexagonale du projet.

Pour chaque entité, créer :
1. Le domain aggregate (plain TypeScript class avec business logic, extends AggregateRoot)
2. Le MikroORM model (*.mikroORM.ts, persistence only, extends PersistenceEntity)
3. Le mapper (toDomain / toPersistence)
4. Le repository port interface (abstract class)
5. L'implémentation MikroORM du repository

Entités à créer :
- Organization (slackTeamId, slackBotToken, slackUserTokens, linearAccessToken)
- Member (email, name, slackUserId, avatarUrl, role: 'admin'|'member', organizationId)
- Project (name, emoji, organizationId, pmLeadName, techLeadName, teamName, targetDate, weekNumber, slackChannelIds[], linearProjectId, linearTeamId, notionPageId, productObjective, objectiveOrigin, keyResults[], isActive)
- SlackMessage (organizationId, projectId, channelId, messageTs, threadTs, userId, userName, text, isBot, hasFiles, reactionCount, replyCount, isFiltered, ingestedAt)
- LinearTicketSnapshot (organizationId, projectId, linearIssueId, identifier, title, description, stateName, stateType, priority, assigneeName, labelNames[], commentCount, snapshotDate, snapshotWeekStart)
- Report (projectId, weekStart, weekEnd, weekNumber, periodLabel, content: ReportContent JSON, health, driftLevel, progress, prevProgress, slackMessageCount, linearTicketCount, notionPagesRead, modelUsed, promptTokens, completionTokens, generationTimeMs, generatedAt, slackDeliveredAt, slackMessageTs)

Créer la migration initiale avec :
npx mikro-orm migration:create --name init

Créer un seed script (src/database/seed.ts) qui insère :
- 1 Organization de test ("Acme Corp", slackTeamId: "T_TEST")
- 1 Member admin (CTO)
- 3 Projects avec des données réalistes (Checkout Revamp, Search Rewrite, Onboarding V2)
  incluant les product objectives et key results
```

**Validation** :
- [ ] `npx mikro-orm migration:create --name init` crée la migration
- [ ] `npx mikro-orm migration:up` applique le schéma en DB
- [ ] `npx ts-node src/database/seed.ts` insère les données de test
- [ ] Les domain aggregates sont injectables dans les command handlers
- [ ] Les mappers `toDomain` et `toPersistence` fonctionnent sans erreur

---

### Étape 3: Authentification & Onboarding Slack

**Durée estimée** : 4-6h

**Prompt Claude Code** :

```
Implémente l'authentification Slack OAuth pour Drift.

CONTEXTE :
- Drift est une Slack App. L'utilisateur clique "Add to Slack" sur le site web.
- Le OAuth flow installe l'app sur le workspace ET authentifie l'utilisateur.
- On a besoin du bot token (pour lire les channels) et du user token (pour accès aux channels privés si nécessaire).

FLOW :
1. GET /auth/slack → redirige vers Slack OAuth avec scopes
2. GET /auth/slack/callback → échange le code, crée/update Organization + Member
3. Redirige vers le dashboard web avec un JWT session token

SCOPES SLACK NÉCESSAIRES (Bot Token) :
- channels:history (lire messages channels publics)
- channels:read (lister les channels)
- groups:history (lire messages channels privés où le bot est invité)
- groups:read (lister les channels privés)
- users:read (résoudre les noms des users)
- chat:write (envoyer les rapports en DM)
- im:write (ouvrir des DMs)

SCOPES SLACK NÉCESSAIRES (User Token) :
- identity.basic, identity.email (identifier l'utilisateur)

IMPLÉMENTATION :
- Module : apps/api/src/auth/
- AuthModule avec AuthController et AuthService
- Utiliser @nestjs/jwt pour les sessions (JWT stocké en httpOnly cookie)
- Guard JwtAuthGuard sur les routes protégées
- Endpoint GET /auth/me → retourne l'utilisateur courant + son organization
- Stocker le bot token chiffré (utiliser crypto.createCipheriv avec une clé depuis .env)
- Utiliser les repositories Organization et Member (injection via NestJS DI)

SÉCURITÉ :
- Vérifier le state parameter pour CSRF
- Chiffrer les tokens avant stockage
- httpOnly + secure cookies en production
```

**Validation** :
- [ ] Cliquer "Add to Slack" redirige vers Slack OAuth
- [ ] Après autorisation, l'Organization est créée en DB avec le bot token
- [ ] Le Member est créé avec son slackUserId
- [ ] Le JWT cookie est set et le guard fonctionne
- [ ] GET /auth/me retourne l'user connecté
- [ ] Les tokens stockés sont chiffrés en DB

---

### Étape 4: Ingestion Slack

**Durée estimée** : 6-8h

**Prompt Claude Code** :

```
Implémente le module d'ingestion Slack pour Drift.

CONTEXTE :
- Chaque Project a un tableau slackChannelIds qui contient les IDs des channels à surveiller.
- On ingère les messages de ces channels à intervalle régulier.
- Les messages sont stockés via le SlackMessageRepository.
- Un filtrage heuristique marque les messages non-pertinents (isFiltered = true).

MODULE : apps/api/src/core/integrations/slack/
Suivre l'architecture hexagonale du projet : domain → application → infrastructure

COMPOSANTS À CRÉER :

1. SlackApiGateway (port interface dans domain/gateways/)
   - Méthodes :
     * getChannelHistory(token, channelId, oldest, latest) → messages[]
     * getThreadReplies(token, channelId, threadTs) → messages[]
     * listChannels(token) → channels[]
     * getUserInfo(token, userId) → user info
     * postMessage(token, channelId, blocks) → message
     * postDM(token, userId, blocks) → message
   - Implémentation (infrastructure/gateways/web-api-slack-channels.gateway.ts) avec @slack/web-api
   - Fake (infrastructure/gateways/fake-slack-api.gateway.ts) pour les tests
   - Gestion des rate limits (retry avec exponential backoff)
   - Cache des user info (Map en mémoire, TTL 1h)

2. IngestSlackMessagesCommand + handler (application/commands/)
   - Méthode principale : pour un projectId donné
     * Pour chaque channelId du projet :
       - Récupérer les messages depuis la dernière ingestion (ou 7 jours si première fois)
       - Pour chaque message avec replyCount > 0, récupérer le thread
       - Upsert dans SlackMessageRepository (sur channelId+messageTs)
       - Appliquer le filtre heuristique

3. SlackFilterService (domain service)
   - Filtre heuristique qui marque isFiltered = true sur les messages non-pertinents :
     * Messages de bots (sauf GitHub deploy notifications)
     * Messages très courts sans contexte : "ok", "done", "👍", "thanks", "+1", "lgtm"
       (SAUF s'ils sont une réponse dans un thread de décision)
     * Messages qui ne contiennent que des URLs sans texte
     * Messages qui ne contiennent que des réactions/emojis
     * Messages de type "channel_join", "channel_leave"
   - Conserver :
     * Tout message > 20 caractères d'un humain
     * Tout message avec > 2 réactions (signal de consensus)
     * Tout thread avec > 3 réponses (signal de discussion importante)

4. SlackIngestionCron (infrastructure/cron/)
   - Cron job : toutes les heures, de 8h à 20h UTC, du lundi au vendredi
   - Pattern : "0 8-20 * * 1-5"
   - Pour chaque Organization active, déclencher IngestSlackMessagesCommand pour tous les projets

IMPORTANT :
- Ne jamais appeler l'ORM directement depuis le handler — passer par SlackMessageRepository
- Logger le nombre de messages ingérés et filtrés par run
```

**Validation** :
- [ ] Avec un Slack workspace de test, les messages d'un channel sont ingérés
- [ ] Les threads sont récupérés
- [ ] Les messages de bots sont filtrés (isFiltered = true)
- [ ] Les messages courts sans contexte sont filtrés
- [ ] Le cron tourne et ingère automatiquement
- [ ] L'ingestion incrémentale ne crée pas de doublons
- [ ] Les rate limits Slack sont respectés (pas d'erreur 429)

---

### Étape 5: Intégration Linear

**Durée estimée** : 4-6h

**Prompt Claude Code** :

```
Implémente l'intégration Linear pour Drift (OAuth + ingestion de tickets).

CONTEXTE :
- Chaque Project est mappé à un Linear project ou team via linearProjectId/linearTeamId.
- On prend des "snapshots" des tickets à intervalles réguliers pour calculer la vélocité.
- L'API Linear utilise GraphQL.

MODULE : apps/api/src/core/integrations/linear/
Suivre l'architecture hexagonale.

COMPOSANTS À CRÉER :

1. LinearApiGateway (port interface dans domain/gateways/)
   - Client GraphQL pour l'API Linear (utiliser graphql-request)
   - Méthodes :
     * listTeams(token) → teams[]
     * listProjects(token, teamId?) → projects[]
     * getProjectIssues(token, projectId, since: Date) → issues[]
       GraphQL query incluant :
       - id, identifier, title, description (truncated 200 chars)
       - state { name, type }, priority, assignee { name }
       - createdAt, updatedAt, completedAt
       - labels { nodes { name } }
       - comments { nodes { body, user { name }, createdAt } } (limit 5 most recent)
     * getTeamIssues(token, teamId, since: Date) → issues[]
   - Fake gateway pour les tests

2. LinearAuthController (infrastructure/controllers/) + AuthService extension
   - GET /integrations/linear/connect → redirige vers Linear OAuth
   - GET /integrations/linear/callback → échange code, update Organization.linearAccessToken
   - Scopes : "read"

3. SnapshotLinearProjectCommand + handler (application/commands/)
   - Récupère les issues du projet Linear depuis le dernier snapshot (ou 7 jours)
   - Crée un LinearTicketSnapshot via le repository pour chaque issue
   - Calcule snapshotWeekStart (lundi de la semaine courante)

4. ComputeDeliveryStatsQuery (application/queries/)
   - Input : projectId, weekStart, weekEnd
   - Retourne :
     { merged, inReview, blocked, created, velocity: "+18%", velocityLabel: "vs last week" }

5. LinearIngestionCron
   - Cron : 2x par jour à 12h et 19h UTC ("0 12,19 * * 1-5")
   - Pour chaque Organization avec linearAccessToken, snapshot tous les projets
```

**Validation** :
- [ ] L'OAuth Linear fonctionne et stocke le token dans Organization
- [ ] listTeams et listProjects retournent les données depuis Linear
- [ ] Les issues sont snapshotées correctement via le repository
- [ ] ComputeDeliveryStatsQuery retourne les bons chiffres
- [ ] Le cron tourne et snapshote automatiquement
- [ ] Les commentaires des issues sont récupérés (max 5 par issue)

---

### Étape 6: Intégration Notion

**Durée estimée** : 3-4h

**Prompt Claude Code** :

```
Implémente l'intégration Notion pour Drift (lecture de page spec).

CONTEXTE :
- Drift utilise une Internal Integration Notion (pas OAuth pour V1).
- L'admin copie-colle l'ID d'une page Notion par projet.
- On lit le contenu de cette page pour extraire l'intent produit.
- On ne lit qu'UNE seule page par projet, pas un arbre entier.

MODULE : apps/api/src/core/integrations/notion/
Suivre l'architecture hexagonale.

COMPOSANTS À CRÉER :

1. NotionApiGateway (port interface dans domain/gateways/)
   - Utiliser @notionhq/client
   - Token : NOTION_INTEGRATION_TOKEN (un seul token par workspace en V1, depuis .env)
   - Méthodes :
     * getPage(pageId) → { title, lastEditedTime, lastEditedBy }
     * getPageContent(pageId) → string (texte extrait des blocks)
       - Récupérer tous les blocks de la page (pagination)
       - Extraire le texte de : paragraph, heading_1/2/3, bulleted_list_item,
         numbered_list_item, to_do, toggle, code, quote, callout, divider
       - Ignorer : image, video, embed, bookmark, file, table
       - Limiter à 8000 caractères
     * searchPages(query) → pages[] (pour l'onboarding)
   - Fake gateway pour les tests

2. ReadNotionPageQuery (application/queries/)
   - Input : pageId
   - Retourne le texte brut extrait (pour inclusion dans le prompt LLM)

3. HasNotionPageChangedQuery (application/queries/)
   - Compare le lastEditedTime de la page avec la date du dernier rapport généré
   - Retourne boolean (false = skip la re-lecture)

NOTE : Pas de cron pour Notion. On lit la page au moment de la génération du rapport.
```

**Validation** :
- [ ] Avec un token Notion d'une Integration de test, getPage retourne la metadata
- [ ] getPageContent extrait le texte de tous les types de blocks supportés
- [ ] Le contenu est truncaté à 8000 caractères
- [ ] HasNotionPageChangedQuery détecte correctement les modifications

---

### Étape 7: Pipeline LLM — Génération du Status

**Durée estimée** : 8-12h (l'étape la plus critique)

**Prompt Claude Code** :

```
Implémente le pipeline de génération de rapport Drift via Claude API.

CONTEXTE :
- C'est le cœur du produit. Ce module prend les données brutes (Slack messages, Linear tickets,
  Notion spec) et génère un rapport structuré en JSON via Claude.
- La qualité de ce rapport détermine si le produit fonctionne ou non.

MODULE : apps/api/src/core/pipeline/
Suivre l'architecture hexagonale.

COMPOSANTS À CRÉER :

1. GenerateReportCommand + handler (application/commands/)
   Orchestration via repositories et gateways (jamais d'ORM direct) :
   a) Récupérer le Project via ProjectRepository
   b) Récupérer les SlackMessages du projet pour la semaine (non filtrés uniquement)
   c) Récupérer les LinearTicketSnapshots du projet pour la semaine
   d) Calculer les delivery stats via ComputeDeliveryStatsQuery
   e) Lire le contenu Notion (si pageId configuré et page modifiée) via ReadNotionPageQuery
   f) Récupérer le rapport de la semaine précédente via ReportRepository
   g) Assembler le prompt via PromptBuilderService
   h) Appeler Claude API via LlmGateway
   i) Parser la réponse JSON via ReportParserService
   j) Créer et sauvegarder le Report aggregate via ReportRepository
   k) Retourner le reportId

2. PromptBuilderService (domain service)
   - Méthode : buildPrompt(data: PipelineData) → { systemPrompt, userPrompt }
   - Le prompt complet est décrit dans la Section 4.

3. LlmGateway (port interface dans domain/gateways/)
   - Méthode : generate(systemPrompt: string, userPrompt: string) → string
   - Implémentation utilisant @anthropic-ai/sdk :
     * model: "claude-sonnet-4-20250514"
     * max_tokens: 4096
     * temperature: 0.3
   - Retry avec backoff sur erreurs 429/500
   - Logger les tokens utilisés (input + output)
   - Fake gateway pour les tests

4. ReportParserService (domain service)
   - Méthode : parseReport(llmOutput: string) → ReportContent
   - Extraire le JSON du output LLM (gérer le cas où il est entouré de ```json```)
   - Valider le JSON contre le schéma ReportContent (voir Section 5)
   - Si la validation échoue, retry une fois avec un prompt de correction via LlmGateway

5. GenerationCronService (infrastructure/cron/)
   - Cron : lundi à 7h UTC ("0 7 * * 1")
   - Pour chaque Organization et chaque Project actif, déclencher GenerateReportCommand
   - En cas d'erreur sur un projet, logger et continuer avec le suivant

6. ReportsController (infrastructure/controllers/)
   - POST /reports/generate/:projectId → génération manuelle (admin only)
   - GET /reports/latest → dernier rapport de chaque projet actif de l'org
   - GET /reports/:id → rapport complet

IMPORTANT :
- Le prompt est le produit. Son contenu exact est détaillé dans la Section 4.
- Logger TOUT : durée de génération, tokens utilisés, erreurs de parsing.
```

**Validation** :
- [ ] Avec des données de test en DB, GenerateReportCommand produit un rapport valide
- [ ] Le JSON de sortie est conforme au schéma ReportContent (Section 5)
- [ ] Le rapport contient narrative, decisions, blockers, drift, delivery stats
- [ ] Les tokens sont loggués
- [ ] La génération manuelle fonctionne via POST /reports/generate/:projectId
- [ ] Si le LLM retourne du JSON invalide, le retry fonctionne
- [ ] Le cron du lundi déclenche la génération pour tous les projets

---

### Étape 8: Delivery — Envoi du Rapport Slack

**Durée estimée** : 4-5h

**Prompt Claude Code** :

```
Implémente l'envoi du rapport Drift par message Slack.

CONTEXTE :
- Après la génération du rapport, on l'envoie par DM Slack aux admins de l'organization.
- Le message utilise les Slack Block Kit pour un formatage riche.

MODULE : apps/api/src/core/integrations/slack/ (compléter le module existant)

COMPOSANTS À CRÉER :

1. SlackReportFormatterService (domain service)
   - Méthode : formatReport(report: ReportContent, project: Project) → SlackBlock[]
   - Formatage Block Kit du rapport :

   STRUCTURE DU MESSAGE :
   ┌─────────────────────────────────────────────┐
   │ 💳 *Checkout Revamp* — Week 7                │
   │ 🟢 On Track · Progress: 68% (+7%)            │
   │ PM: Julie P. · Tech: Marie D.                │
   ├─────────────────────────────────────────────┤
   │ *🎯 Objective*                                │
   │ Reduce cart abandonment rate from 18% to 12% │
   │ ✅ Stripe Connect integrated                  │
   │ ☐ Checkout flow < 3 steps                    │
   ├─────────────────────────────────────────────┤
   │ *📝 This Week*                                │
   │ Strong engineering velocity — 5 tickets...   │
   ├─────────────────────────────────────────────┤
   │ *⚡ Decisions*                                │
   │ • Stripe Connect over custom integration     │
   │   ↳ Aligned · Trade-off: Faster to ship...  │
   ├─────────────────────────────────────────────┤
   │ *⚠️ Intent Drift: Minor Drift*               │
   │ Guest checkout shortcut may be cut...        │
   ├─────────────────────────────────────────────┤
   │ *🚧 Blockers (1)*                            │
   │ 🟡 Figma handoff — Owner: Sarah K.           │
   ├─────────────────────────────────────────────┤
   │ *📊 Delivery*                                 │
   │ ✅ 5 merged · 🔄 2 in review · 🔴 1 blocked  │
   │ 📈 Velocity: +18% vs last week               │
   ├─────────────────────────────────────────────┤
   │ 🔗 View full report on Drift                 │
   └─────────────────────────────────────────────┘

2. DeliverReportCommand + handler (application/commands/)
   - Récupérer le Report et le Project via leurs repositories
   - Formater le rapport en Slack blocks
   - Envoyer par DM à chaque Member avec role 'admin' via SlackApiGateway
   - Stocker slackDeliveredAt et slackMessageTs dans le Report aggregate
   - Sauvegarder via ReportRepository

3. DeliverPortfolioSummaryCommand + handler
   - Générer un message résumé de tous les projets de la semaine
   - Envoyer par DM aux admins

4. Intégrer dans GenerationCronService :
   - Après GenerateReportCommand, déclencher DeliverReportCommand
   - Après tous les reports, déclencher DeliverPortfolioSummaryCommand
```

**Validation** :
- [ ] Le message Slack est correctement formaté
- [ ] Les DMs sont envoyés aux admins
- [ ] Le portfolio summary liste tous les projets
- [ ] slackDeliveredAt est mis à jour après l'envoi
- [ ] Si l'envoi échoue, l'erreur est loggée mais ne casse pas le reste

---

### Étape 9: Dashboard Web (Prototype → App)

**Durée estimée** : 8-12h

**Prompt Claude Code** :

```
Implémente le dashboard web Drift en React + Vite, basé sur le prototype existant (apps/app/src/App.tsx).

CONTEXTE :
- Le prototype est dans apps/app/src/App.tsx avec les données hardcodées.
- Il faut le transformer en application React connectée à l'API backend.
- Le design, les couleurs, les composants du prototype doivent être reproduits fidèlement.
- Les données viennent de l'API via React Query.

CONVENTIONS (apps/app/CLAUDE.md) :
- Named exports pour tous les composants
- Tailwind CSS, pas de style inline sauf valeurs dynamiques
- React Query pour le data fetching
- Services dans src/services/ (jamais de fetch direct dans les composants)
- Routing avec React Router v6

PAGES À CRÉER :

1. src/pages/LoginPage.tsx
   - Design simple : logo Drift, "Add to Slack" button, tagline
   - Le bouton redirige vers GET /auth/slack (API)
   - Redirect vers /dashboard si déjà authentifié

2. src/pages/DashboardPage.tsx
   - Header avec date, titre "Weekly pulse — Product × Engineering"
   - Subtitle avec source counts (depuis l'API)
   - Portfolio stats row (5 cards : Active Projects, Decisions, Blockers, Intent Drift, Avg Velocity)
   - "Needs attention" banner (si un projet a high drift)
   - Filter buttons (All, Drifting, At Risk, On Track)
   - Project cards list (depuis useLatestReports hook)
   - Footer avec génération metadata

3. src/features/reports/components/ProjectCard.tsx
   - État collapsed : emoji, nom, health badge, drift badge, PM/Tech lead, target date, progress bar, source pills, chevron
   - État expanded avec tabs :
     * Overview : Product Objective + KRs, Weekly Narrative, Drift Alert, Blockers
     * Decisions : Liste des décisions avec alignment badge + trade-offs
     * Delivery : Stats grid (merged, in review, blocked, created, velocity) + Timeline Risk
     * Key Threads : Slack threads avec participants, message count, outcome

4. src/features/reports/hooks/useLatestReports.ts
   - React Query hook : GET /reports/latest
   - Retourne { reports, isLoading, error }

5. src/services/api.ts
   - Base URL depuis import.meta.env.VITE_API_BASE_URL
   - Endpoints :
     * GET /reports/latest → Report[] (dernier rapport de chaque projet)
     * GET /reports/:reportId → Report complet
     * GET /projects → Project[]
     * POST /reports/generate/:projectId → déclencher génération manuelle
   - Credentials: 'include' pour le JWT cookie

6. src/routes/index.tsx
   - /login → LoginPage (public)
   - /dashboard → DashboardPage (protected)
   - / → redirect vers /dashboard
   - ProtectedRoute wrapper qui vérifie GET /auth/me

IMPORTANT : Le dashboard doit être IDENTIQUE visuellement au prototype.
- Fonts : DM Sans (body), Newsreader (headings), Source Serif 4 (narratives)
- Palette : bg #F5F3EF, cards #FFFFFF, borders #E8E6E1, text #1A1A1A, accent orange #FF6B35
- Nav bar dark : #1A1A1A
- Health badges : on-track (green #E8F5E9/#2E7D32), at-risk (orange), off-track (red)
```

**Validation** :
- [ ] Le dashboard affiche les rapports de la semaine depuis l'API
- [ ] Les project cards se déplient avec les 4 tabs
- [ ] Le filtre All/Drifting/At Risk/On Track fonctionne
- [ ] Le portfolio summary est correct (calculs des totaux)
- [ ] La page login fonctionne et redirige vers Slack OAuth
- [ ] Le design est fidèle au prototype (comparer visuellement)
- [ ] La route protégée redirige vers /login si non authentifié

---

### Étape 10: Onboarding Self-Serve (App Home Slack)

**Durée estimée** : 4-6h

**Prompt Claude Code** :

```
Implémente le flow d'onboarding self-serve pour Drift.

CONTEXTE :
- Après l'installation, l'admin doit configurer ses projets.
- Chaque projet a besoin : nom, channels Slack, projet Linear, page Notion (optionnel).

A. ONBOARDING WEB (apps/app/src/pages/OnboardingPage.tsx)

Page wizard en 3 steps (React Router avec query params pour l'étape courante) :

Step 1 : "Create your first project"
- Champ nom du projet
- Champ emoji
- Champs PM Lead et Tech Lead
- Champ Team name
- Champ Target date

Step 2 : "Connect your sources"
- Section Slack : liste des channels (GET /projects/channels via API), multiselect
- Section Linear (si connecté) : liste teams/projets (GET /integrations/linear/teams)
  * Si pas connecté → bouton "Connect Linear" (redirige vers /integrations/linear/connect)
- Section Notion (optionnel) : champ URL/ID + preview du titre de la page

Step 3 : "Set your product objective"
- Si Notion est connecté : extraction automatique via LLM (POST /integrations/notion/extract-objective)
- Sinon : saisie manuelle (textarea + key results dynamiques)
- Config delivery : jour et heure du rapport (défaut : Lundi 8h)

Après le wizard : redirect vers /dashboard avec CTA "Generate your first report now"

B. SLACK APP HOME

Quand l'utilisateur ouvre l'app dans Slack (event app_home_opened) :
- Si aucun projet configuré → message d'onboarding avec bouton vers le wizard web
- Si des projets existent → résumé avec liste des projets, health status, bouton "View dashboard"

Implémenter dans apps/api/src/core/integrations/slack/ :
- Event listener pour app_home_opened
- View publish avec Slack Block Kit
- Handler pour les button actions
- POST /slack/events (events Slack)
- POST /slack/interactions (boutons)
- Vérification de signature Slack sur ces endpoints
```

**Validation** :
- [ ] Le wizard web crée un projet avec ses sources mappées en DB
- [ ] La liste des channels Slack s'affiche et est sélectionnable
- [ ] La connexion Linear fonctionne depuis le wizard
- [ ] Le lien Notion est validé (preview du titre)
- [ ] L'App Home Slack affiche le résumé des projets
- [ ] Un nouveau user peut onboarder 3 projets en < 10 minutes

---

## 4. Prompt LLM — Spécification Complète

C'est le cœur du produit. Ce prompt doit être itéré intensivement avec des données réelles.

### System Prompt

```
You are Drift, an AI assistant that generates structured weekly project status reports for Product and Engineering leadership. You analyze raw data from Slack conversations, Linear tickets, and Notion specs to produce accurate, insightful project reports.

Your reports serve two audiences simultaneously:
- The CTO/VP Engineering: cares about delivery velocity, blockers, technical risks, team bandwidth
- The CPO/Head of Product: cares about alignment with product intent, decision traceability, scope drift, KR impact

CRITICAL RULES:
1. Only report facts you can verify from the provided data. Never invent or hallucinate information.
2. Distinguish clearly between DECISIONS MADE (someone explicitly committed to a course of action) vs DISCUSSIONS IN PROGRESS (options being explored, no commitment).
3. When you identify a decision, always note WHO made it, WHERE (which channel/tool), and the TRADE-OFF involved.
4. Be precise about blockers: what is blocked, who owns it, how long it's been blocked, and what's the impact.
5. For intent drift: compare what's being built/discussed against the Product Objective and Key Results provided. Flag any divergence, even subtle ones.
6. Progress percentage should reflect overall project completion based on KR status, ticket completion, and your assessment of remaining work — NOT just ticket count.
7. Health assessment must be justified by specific evidence from the data.
8. Write the narrative in a style that's informative but concise — like a senior PM briefing leadership. No fluff, no filler, every sentence carries information.
9. Your output MUST be valid JSON matching the exact schema provided. No markdown, no commentary outside the JSON.
```

### User Prompt Template

```
Generate a weekly project status report based on the following data.

## PROJECT INFO
- Name: {{project.name}}
- Team: {{project.teamName}}
- PM Lead: {{project.pmLeadName}}
- Tech Lead: {{project.techLeadName}}
- Week Number: {{project.weekNumber}}
- Target Date: {{project.targetDate}}
- Days to Target: {{computed.daysToTarget}}
- Previous Week Progress: {{previousReport.progress || "N/A (first report)"}}
- Previous Week Health: {{previousReport.health || "N/A"}}

## PRODUCT OBJECTIVE
Goal: {{project.productObjective}}
Origin: {{project.objectiveOrigin}}
Key Results:
{{#each project.keyResults}}
- [{{#if done}}x{{else}} {{/if}}] {{text}}
{{/each}}

## NOTION SPEC CONTENT (Product Intent Reference)
{{notionContent || "No Notion page configured for this project."}}

## SLACK CONVERSATIONS (last 7 days, filtered for relevance)
Channel: {{channelName}}
{{#each slackMessages}}
[{{timestamp}}] {{userName}}: {{text}}
{{#if threadMessages}}
  Thread replies:
  {{#each threadMessages}}
  ↳ [{{timestamp}}] {{userName}}: {{text}}
  {{/each}}
{{/if}}
{{/each}}

## LINEAR TICKETS (current state)
{{#each linearTickets}}
- {{identifier}}: {{title}}
  Status: {{stateName}} | Priority: {{priority}} | Assignee: {{assigneeName}}
  {{#if comments}}
  Recent comments:
  {{#each comments}}
    - {{user}}: {{body}}
  {{/each}}
  {{/if}}
{{/each}}

## DELIVERY METRICS (computed from Linear)
- Tickets merged this week: {{deliveryStats.merged}}
- In review: {{deliveryStats.inReview}}
- Blocked: {{deliveryStats.blocked}}
- Created this week: {{deliveryStats.created}}

## OUTPUT FORMAT
Respond with a single JSON object matching this exact schema. No markdown, no extra text — ONLY the JSON:

{
  "health": "on-track" | "at-risk" | "off-track",
  "healthLabel": "On Track" | "At Risk" | "Off Track",
  "progress": <number 0-100>,
  "narrative": "<2-4 sentence weekly summary>",
  "decisions": [
    {
      "text": "<what was decided>",
      "tradeoff": "<what's gained vs what's lost>",
      "who": "<person(s) who made the decision>",
      "where": "<Slack channel or Linear ticket>",
      "when": "<day of the week>",
      "alignedWithIntent": true | false | "partial"
    }
  ],
  "drift": {
    "level": "none" | "low" | "high",
    "label": "Aligned" | "Minor Drift" | "Significant Drift",
    "details": "<explanation of divergence, or 'Implementation matches original spec.' if none>"
  },
  "blockers": [
    {
      "text": "<what is blocked>",
      "owner": "<person responsible>",
      "severity": "high" | "medium" | "low",
      "since": "<duration>",
      "impact": "<consequence if not resolved>"
    }
  ],
  "keyResults": [
    { "text": "<KR text>", "done": <boolean> }
  ],
  "threads": [
    {
      "title": "<summary of the thread topic>",
      "participants": ["<name>", ...],
      "messages": <number>,
      "outcome": "<Decision: X | Open — needs Y | Investigation ongoing>",
      "channel": "<#channel-name>"
    }
  ],
  "delivery": {
    "merged": <number>,
    "inReview": <number>,
    "blocked": <number>,
    "created": <number>,
    "velocity": "<+X% or -X%>",
    "velocityLabel": "vs last week"
  },
  "sourceCounts": {
    "slack": <number of messages analyzed>,
    "linear": <number of tickets analyzed>,
    "notion": <0 or 1>
  }
}
```

---

## 5. Structure JSON du Rapport Généré

Le champ `content` du Report aggregate stocke ce JSON exact :

```typescript
// packages/shared/types/report.ts

export interface ReportContent {
  health: 'on-track' | 'at-risk' | 'off-track';
  healthLabel: string;
  progress: number; // 0-100

  narrative: string;

  decisions: {
    text: string;
    tradeoff: string;
    who: string;
    where: string;
    when: string;
    alignedWithIntent: boolean | 'partial';
  }[];

  drift: {
    level: 'none' | 'low' | 'high';
    label: string;
    details: string;
  };

  blockers: {
    text: string;
    owner: string;
    severity: 'high' | 'medium' | 'low';
    since: string;
    impact: string;
  }[];

  keyResults: {
    text: string;
    done: boolean;
  }[];

  threads: {
    title: string;
    participants: string[];
    messages: number;
    outcome: string;
    channel: string;
  }[];

  delivery: {
    merged: number;
    inReview: number;
    blocked: number;
    created: number;
    velocity: string;
    velocityLabel: string;
  };

  sourceCounts: {
    slack: number;
    linear: number;
    notion: number;
  };
}
```

---

## Annexe A: API Reference par Intégration

### Slack Web API

| Méthode | Usage Drift | Rate Limit |
|---------|-------------|------------|
| `conversations.history` | Lire messages d'un channel | Tier 3 (50+/min) |
| `conversations.replies` | Lire un thread | Tier 3 |
| `conversations.list` | Lister channels (onboarding) | Tier 2 (20/min) |
| `users.info` | Résoudre un user ID en nom | Tier 4 (100+/min) |
| `chat.postMessage` | Envoyer rapport | Tier 3 |
| `conversations.open` | Ouvrir DM | Tier 3 |
| `views.publish` | App Home | Tier 3 |

Documentation : https://api.slack.com/methods

### Linear GraphQL API

Endpoint : `https://api.linear.app/graphql`

Queries principales :
```graphql
# Lister les issues d'un projet
query ProjectIssues($projectId: String!, $after: String) {
  project(id: $projectId) {
    issues(first: 100, after: $after, orderBy: updatedAt) {
      nodes {
        id identifier title description
        state { name type }
        priority assignee { name }
        createdAt updatedAt completedAt
        labels { nodes { name } }
        comments(first: 5) { nodes { body user { name } createdAt } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}
```

Documentation : https://developers.linear.app/docs/graphql/working-with-the-graphql-api

### Notion API

| Endpoint | Usage Drift |
|----------|-------------|
| `GET /v1/pages/:id` | Metadata de page |
| `GET /v1/blocks/:id/children` | Contenu de page (blocks) |
| `POST /v1/search` | Recherche de pages (onboarding) |

Documentation : https://developers.notion.com/reference

---

## Annexe B: Prototype UI Reference

Le fichier `apps/app/src/App.tsx` sert de référence visuelle exacte pour le dashboard. Les données dans le prototype (PROJECTS array) sont le format cible que le pipeline LLM doit produire.

Éléments de design à reproduire exactement :
- La nav bar dark (#1A1A1A) avec logo "drift." et badge BETA orange
- Les portfolio stats cards
- Le "Needs attention" banner gradient
- Les filter buttons
- Les project cards avec expand/collapse
- Le système de tabs (Overview, Decisions, Delivery, Key Threads)
- Les health badges, drift badges, source tags
- Les decision cards avec alignment scoring
- Les blocker cards avec severity coloring
- Le footer avec génération metadata

---

## Ordre de Build Recommandé

```
Semaine 1:  Étapes 1-2 (Init + DB)               → Fondation
Semaine 2:  Étapes 3-4 (Auth Slack + Ingestion)   → Données Slack en DB
Semaine 3:  Étapes 5-6 (Linear + Notion)          → Toutes les sources
Semaine 4:  Étape 7   (Pipeline LLM)              → Premier rapport généré ⭐
Semaine 5:  Étape 8   (Delivery Slack)             → Premier rapport reçu par DM ⭐⭐
Semaine 6:  Étape 9   (Dashboard Web)              → Consultation web
Semaine 7:  Étape 10  (Onboarding)                 → Self-serve
Semaine 8:  Polish + bugs + itération prompt       → Prêt pour design partners
```

La ⭐ marque le moment où tu peux commencer à tester avec de vraies données.
Le ⭐⭐ marque le moment "magic moment" — le CTO reçoit son premier status automatique.

---

*Dernière mise à jour : 24 février 2026*
*Version : 1.1 (MikroORM + Vite)*
*Auteur : Victor L. + Claude (session de co-construction)*
