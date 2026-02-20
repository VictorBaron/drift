import { Module } from '@nestjs/common';
import { ParseJsonOutputService } from './parse-json-output.service';

@Module({
  providers: [ParseJsonOutputService],
  exports: [ParseJsonOutputService],
})
export class AiModule {}
