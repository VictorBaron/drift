import type { Member } from '@/accounts/domain';

export const URGENCY_SCORING_GATEWAY = 'URGENCY_SCORING_GATEWAY';

export interface UrgencyScoringInput {
  text: string;
  recipients: Member[];
}

export interface UrgencyScoringResult {
  score: number;
  reasoning: string;
  confidenceScore: number;
}

export interface UrgencyScoringGateway {
  scoreMessage(input: UrgencyScoringInput): Promise<UrgencyScoringResult>;
}
