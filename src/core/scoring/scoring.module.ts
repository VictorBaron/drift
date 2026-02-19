import { Module } from '@nestjs/common';
import { AiModule } from '@/ai/ai.module';
import { URGENCY_SCORING_GATEWAY } from '@/scoring/domain/gateways';
import { AnthropicUrgencyScoringGateway, FakeUrgencyScoringGateway } from '@/scoring/infrastructure/gateways';

@Module({
  imports: [AiModule],
  providers: [
    {
      provide: URGENCY_SCORING_GATEWAY,
      useClass: FakeUrgencyScoringGateway,
    },
  ],
  exports: [URGENCY_SCORING_GATEWAY],
})
export class ScoringModule {}
