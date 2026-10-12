import { BadRequestException, Body, Controller, Get, Header, HttpCode, Param, Post, Query } from '@nestjs/common';
import { RdfService } from './rdf.service.js';
import type { ShaclReport } from './shacl.js';

const TURTLE = 'text/turtle; charset=utf-8';

@Controller()
export class RdfController {
  constructor(private readonly rdf: RdfService) {}

  /** GET /api/figures/WF-0001/rdf returns the figure's triples, read from the triplestore. */
  @Get('figures/:inventoryNumber/rdf')
  @Header('Content-Type', TURTLE)
  figure(@Param('inventoryNumber') inventoryNumber: string): Promise<string> {
    return this.rdf.figureTurtle(inventoryNumber);
  }

  /** GET /api/rdf/export returns the whole data set as Turtle, converted from the relational database. */
  @Get('rdf/export')
  @Header('Content-Type', TURTLE)
  export(): Promise<string> {
    return this.rdf.exportTurtle();
  }

  /** GET /api/rdf/shapes returns the SHACL shapes; `?vocabulary=true` appends the vocabulary instances. */
  @Get('rdf/shapes')
  @Header('Content-Type', TURTLE)
  shapes(@Query('vocabulary') vocabulary?: string): Promise<string> {
    return vocabulary === 'true' ? this.rdf.shapesWithVocabulary() : this.rdf.shapesTurtle();
  }

  /** POST /api/rdf/validate with { "turtle": "..." } returns a SHACL validation report. Nothing is stored. */
  @Post('rdf/validate')
  @HttpCode(200)
  validate(@Body() body: { turtle?: unknown }): Promise<ShaclReport> {
    if (typeof body?.turtle !== 'string' || body.turtle.trim() === '') {
      throw new BadRequestException('Send a JSON body with a non-empty "turtle" string');
    }
    return this.rdf.validate(body.turtle);
  }
}
