import { Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';

@Injectable()
export class ParseJsonOutputService extends BaseService {
  private retries: number;

  parse<T>(rawJson: string, retries = 0): T | null {
    this.retries = retries;
    try {
      const parsed = this.parseJsonOutput(rawJson) as T;
      return parsed;
    } catch (e) {
      this.logger.log(rawJson);
      this.logger.error(e);

      if (this.retries) {
        return this.retryParsing<T>();
      }

      return null;
    }
  }

  private retryParsing<T>(): T | null {
    this.retries--;
    // TODO: retry with AI
    return null;
  }

  private parseJsonOutput(raw: string) {
    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  }
}
