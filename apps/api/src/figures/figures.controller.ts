import { Controller, Get, Param, Query } from '@nestjs/common';
import { Figure } from '../database/entities/index.js';
import { FiguresService } from './figures.service.js';

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

@Controller('figures')
export class FiguresController {
  constructor(private readonly figures: FiguresService) {}

  /** GET /api/figures?material=sycamore-fig&site=asyut&period=...&objectType=...&collection=...&q=... */
  @Get()
  list(@Query() query: Record<string, unknown>): Promise<Figure[]> {
    return this.figures.list({
      material: text(query.material),
      objectType: text(query.objectType),
      period: text(query.period),
      site: text(query.site),
      collection: text(query.collection),
      q: text(query.q),
    });
  }

  /** GET /api/figures/WF-0001 */
  @Get(':inventoryNumber')
  get(@Param('inventoryNumber') inventoryNumber: string): Promise<Figure> {
    return this.figures.get(inventoryNumber);
  }
}
