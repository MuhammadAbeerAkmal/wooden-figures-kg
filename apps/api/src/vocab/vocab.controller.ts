import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { VocabService } from './vocab.service.js';
import type { Vocabularies } from './vocab.service.js';

@Controller('vocab')
export class VocabController {
  constructor(private readonly vocab: VocabService) {}

  /** GET /api/vocab returns every vocabulary in one response (used for the filter dropdowns). */
  @Get()
  all(): Promise<Vocabularies> {
    return this.vocab.all();
  }

  /** GET /api/vocab/materials | objectTypes | periods | sites | collections */
  @Get(':name')
  async one(@Param('name') name: string): Promise<Vocabularies[keyof Vocabularies]> {
    const all = await this.vocab.all();
    if (!Object.hasOwn(all, name)) {
      throw new NotFoundException(`Unknown vocabulary "${name}". Use one of: ${Object.keys(all).join(', ')}`);
    }
    return all[name as keyof Vocabularies];
  }
}
