import { randomInt } from 'crypto';
import type { UrgencyScoringGateway, UrgencyScoringInput, UrgencyScoringResult } from '@/scoring/domain/gateways';

export class FakeUrgencyScoringGateway implements UrgencyScoringGateway {
  private lastInput: UrgencyScoringInput | null = null;

  async scoreMessage(input: UrgencyScoringInput): Promise<UrgencyScoringResult> {
    this.lastInput = input;

    const fakeScores: UrgencyScoringResult[] = [
      {
        score: 1,
        reasoning: 'Noise',
        confidenceScore: 100,
      },
      {
        score: 2,
        reasoning: 'FYI New customer signed (Google)',
        confidenceScore: 100,
      },
      {
        score: 3,
        reasoning: "Your boss asked you how it's going",
        confidenceScore: 100,
      },
      {
        score: 4,
        reasoning: 'Michel needs help for his feature',
        confidenceScore: 100,
      },
      {
        score: 5,
        reasoning: 'Prod is down',
        confidenceScore: 100,
      },
    ];
    const randomScore = fakeScores[randomInt(5)];
    return randomScore;
  }

  getLastInput(): UrgencyScoringInput {
    if (!this.lastInput) throw new Error('scoreMessage has not been called');
    return this.lastInput;
  }
}
