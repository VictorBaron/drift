import { z } from 'zod';

export const MessageAnalysisSchema = z.object({
  intent: z.enum(['inform', 'ask', 'decide', 'approve', 'coordinate', 'resolve', 'unknown']),

  category: z.enum([
    'incident',
    'security_risk',
    'customer_escalation',
    'revenue_risk',
    'legal_compliance_risk',
    'blocked_dependency',
    'decision_needed',
    'approval_needed',
    'coordination',
    'fyi_broadcast',
    'social_noise',
    'unknown',
  ]),

  scope: z.enum([
    'personal',
    'team_coord',
    'execution',
    'production',
    'customer',
    'security',
    'people',
    'finance_legal',
    'external',
    'meta_process',
    'unknown',
  ]),

  timeSensitivity: z.enum(['minutes', 'hours', 'today', 'this_week', 'whenever', 'unknown']),
  deadlineAtIso: z.string().datetime().nullable(),

  blocking: z.boolean(),
  requiresAction: z.boolean(),

  impact: z.enum(['low', 'medium', 'high', 'critical', 'unknown']),
  blastRadius: z.enum([
    'self',
    'one_other_person',
    'small_team',
    'multiple_teams',
    'org_wide',
    'customer_impacting',
    'public',
    'unknown',
  ]),

  escalation: z.enum(['none', 'brewing', 'active', 'escalated', 'unknown']),

  primaryOwners: z.array(
    z.enum([
      'Engineer',
      'EngineerOnCall',
      'ProductManager',
      'SalesRep',
      'SupportAgent',
      'CustomerSuccess',
      'Marketing',
      'Ops',
      'Finance',
      'HR',
      'Security',
      'Exec',
      'Unknown',
    ]),
  ),

  observers: z.array(
    z.enum([
      'Engineer',
      'EngineerOnCall',
      'ProductManager',
      'SalesRep',
      'SupportAgent',
      'CustomerSuccess',
      'Marketing',
      'Ops',
      'Finance',
      'HR',
      'Security',
      'Exec',
      'Unknown',
    ]),
  ),

  isDirectlyAssignedToMe: z.boolean(),
  needsMyRoleSpecifically: z.boolean(),

  signals: z.object({
    explicitAsk: z.boolean(),
    containsDeadlineLanguage: z.boolean(),
    containsUrgencyLanguage: z.boolean(),
    containsIncidentLanguage: z.boolean(),
    containsSecurityLanguage: z.boolean(),
    containsMoneyLanguage: z.boolean(),
    containsCustomerPain: z.boolean(),
    containsBlockingLanguage: z.boolean(),
    coordinationScheduling: z.boolean(),
  }),

  missingContext: z.object({
    threadHistoryNeeded: z.boolean(),
    ownerUnclear: z.boolean(),
    deadlineUnclear: z.boolean(),
  }),

  confidence: z.number().min(0).max(1),

  rationale: z.array(z.string()).max(8),
});

export type MessageAnalysis = z.infer<typeof MessageAnalysisSchema>;
