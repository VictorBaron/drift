export const URGENCY_SCORING_GATEWAY = 'URGENCY_SCORING_GATEWAY';

export interface UrgencyScoringResult {
  score: number;
  reasoning: string;
  confidenceScore: number;
}

export interface MessageAnalysis {
  category: MessageCategory;
  requiresAction: boolean;
  blocking: boolean;
  scope: Scope;
  confidence: number;
}

export enum Scope {
  Personal, // my task, my schedule
  TeamCoordination, // planning, handoffs, alignment
  Execution, // doing the work (PRs, docs, designs)
  Production, // incidents, outages, on-call
  Customer, // support tickets, escalations, contracts
  Security, // vuln, access, suspicious activity
  People, // hiring, HR, conflict, wellbeing
  FinanceLegal, // invoices, legal review, compliance
  ExternalPartners, // vendors, agencies, dependencies
  MetaProcess, // policies, how we work, rituals
}

export enum BlastRadius {
  Self,
  OneOtherPerson,
  SmallTeam,
  MultipleTeams,
  OrgWide,
  CustomerImpacting,
  Public,
}

export enum MessageCategory {
  // True interrupts
  Incident,
  Escalation,
  BlockedDependency,

  // Work progression
  Request, // “can you…?”
  DecisionNeeded, // needs a call/choice
  Approval, // “LGTM?”, “approve budget?”
  Review, // PR/doc/design review
  Coordination, // scheduling, handoff, “who’s on it?”

  // Info
  FYI,
  Update,
  Announcement,

  // Social / noise
  ChitChat,
  Kudos,
  BotNoise,
}

export enum MessageCategory2 {
  ProductionIncident,
  CustomerEscalation,
  // Risk
  RevenueRisk,
  SecurityRisk,
  LegalOrComplianceRisk,

  BlockingDependency,
  DecisionNeeded,
  ApprovalNeeded,
  Coordination,
  FYI,
  Noise,
}

export enum MessageIntent {
  Inform,
  Ask,
  Decide,
  Approve,
  Coordinate,
  Resolve,
}

export interface MessageAnalysisBis {
  category: MessageCategory;
  scope: Scope;

  // “absolute-ish”
  timeSensitivity: TimeSensitivity; // minutes/hours/today/week
  impact: 'Impact'; // TODO;
  blocking: boolean;
  escalation: 'Escalation'; // TODO

  // “relative to people”
  primaryOwners: OwnerGroup[];
  observers: OwnerGroup[];

  // “relative to me”
  needsMyRoleSpecifically: boolean;
  isDirectlyAssignedToMe: boolean;
  interruptPriority: InterruptPriority;

  confidence: number;
  rationale: string;
}

type InterruptPriority = 'now' | 'soon' | 'next_breakpoint' | 'digest';
type TimeSensitivity = 'minutes' | 'hours' | 'today' | 'this_week';

type OwnerGroup =
  | 'Engineering'
  | 'Product'
  | 'Sales'
  | 'Marketing'
  | 'Ops'
  | 'Finance'
  | 'HR'
  | 'Customer Success'
  | 'Security';

export enum OwnerGroupFromChatGPT {
  Engineer,
  EngineerOnCall,
  ProductManager,
  SalesRep,
  SupportAgent,
  CustomerSuccess,
  Marketing,
  Ops,
  Finance,
  HR,
  Security,
  Exec,
}

export enum MemberRole {
  IC,
  TeamLead,
  Exec,
}

/*
interruptScore =
f(timeSensitivity, impact, blocking, escalation)
+ ownerMatchBoost
+ directMentionBoost
+ roleModifier
*/
