import { Controller, Get, Param } from '@nestjs/common';
import { CompareService } from './compare.service.js';
import type { Comparison, QuestionSummary } from './compare.service.js';

@Controller('compare')
export class CompareController {
  constructor(private readonly compare: CompareService) {}

  /** GET /api/compare lists the competency questions. */
  @Get()
  list(): QuestionSummary[] {
    return this.compare.list();
  }

  /** GET /api/compare/cq1 runs the question on both models and returns queries, rows and timings. */
  @Get(':questionId')
  run(@Param('questionId') questionId: string): Promise<Comparison> {
    return this.compare.compare(questionId);
  }
}
