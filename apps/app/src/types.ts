export type Project = {
  id: number;
  name: string;
  emoji: string;
  health: Health;
  healthLabel: string;
  pmLead: string;
  techLead: string;
  team: string;
  period: string;
  progress: number;
  prevProgress: number;
  targetDate: string;
  daysToTarget: number;
  sources: SourceCounts;
  objective: Objective;
  narrative: string;
  decisions: Decision[];
  drift: Drift;
  blockers: Blocker[];
  delivery: Delivery;
  threads: Thread[];
};

export type Health = 'on-track' | 'at-risk' | 'off-track';
export type DriftLevel = 'none' | 'low' | 'high';

export type SourceCounts = {
  slack: number;
  linear: number;
  notion: number;
};

export type Drift = {
  level: DriftLevel;
  label: string;
  details: string;
};
export type Decision = {
  text: string;
  tradeoff: string;
  who: string;
  where: string;
  when: string;
  alignedWithIntent: boolean | 'partial';
};

export type Severity = 'high' | 'medium' | 'low';

export type Blocker = {
  text: string;
  owner: string;
  severity: Severity;
  since: string;
  impact: string;
};

export type Thread = {
  title: string;
  participants: string[];
  messages: number;
  outcome: string;
  channel: string;
};

export type KeyResult = {
  text: string;
  done: boolean;
};

export type Objective = {
  goal: string;
  origin: string;
  keyResults: KeyResult[];
};

export type Delivery = {
  merged: number;
  inReview: number;
  blocked: number;
  created: number;
  velocity: string;
  velocityLabel: string;
};
