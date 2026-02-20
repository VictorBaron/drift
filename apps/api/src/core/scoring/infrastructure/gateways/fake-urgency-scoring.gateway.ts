import { randomInt } from 'crypto';
import type { UrgencyScoringGateway, UrgencyScoringInput, UrgencyScoringResult } from '@/scoring/domain/gateways';

export class FakeUrgencyScoringGateway implements UrgencyScoringGateway {
  private fixedScore = 3;
  private fixedReasoning = 'Controlled reasoning';
  private lastInput: UrgencyScoringInput | null = null;

  setScore(score: number, reasoning = 'Controlled reasoning'): void {
    this.fixedScore = score;
    this.fixedReasoning = reasoning;
  }

  async scoreMessage(input: UrgencyScoringInput, random = false): Promise<UrgencyScoringResult> {
    this.lastInput = input;
    if (random) return this.scoreMessageAtRandom(input);

    return { score: this.fixedScore, reasoning: this.fixedReasoning, confidenceScore: 0.8 };
  }

  private async scoreMessageAtRandom(input: UrgencyScoringInput): Promise<UrgencyScoringResult> {
    const fakeMessageAnalysis: UrgencyScoringResult[] = [
      {
        score: 1,
        reasoning: 'Noise',
        confidenceScore: 0.8,
      },
      {
        score: 2,
        reasoning: 'FYI New customer signed (Google)',
        confidenceScore: 0.8,
      },
      {
        score: 3,
        reasoning: "Your boss asked you how it's going",
        confidenceScore: 0.8,
      },
      {
        score: 4,
        reasoning: 'Michel needs help for his feature',
        confidenceScore: 0.8,
      },
      {
        score: 5,
        reasoning: 'Prod is down',
        confidenceScore: 0.8,
      },
    ];

    return fakeMessageAnalysis[randomInt(5)];
  }

  getLastInput(): UrgencyScoringInput {
    if (!this.lastInput) throw new Error('scoreMessage has not been called');
    return this.lastInput;
  }
}
