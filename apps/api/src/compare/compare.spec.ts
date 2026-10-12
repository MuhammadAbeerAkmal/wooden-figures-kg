import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { DataSource } from 'typeorm';
import { config } from '../config.js';
import { Figure } from '../database/entities/index.js';
import { FiguresService } from '../figures/figures.service.js';
import { RdfService } from '../rdf/rdf.service.js';
import { SparqlClient } from '../rdf/sparql.client.js';
import { createTestDatabase } from '../testing/test-database.js';
import { VocabService } from '../vocab/vocab.service.js';
import { CompareService, sameRows } from './compare.service.js';
import { formatSql } from './format-sql.js';
import { QUESTIONS } from './questions.js';

describe('comparison engine', () => {
  let dataSource: DataSource;
  let service: CompareService;
  let triplestoreIsUp = false;

  before(async () => {
    dataSource = await createTestDatabase();
    const sparql = new SparqlClient(config.sparqlEndpoint);
    service = new CompareService(dataSource, sparql);

    // The SPARQL half needs a running Oxigraph. Load the same data into it when it is there.
    try {
      const figures = new FiguresService(dataSource.getRepository(Figure));
      await new RdfService(figures, new VocabService(dataSource), sparql).loadIntoTriplestore();
      triplestoreIsUp = true;
    } catch {
      triplestoreIsUp = false;
    }
  });
  after(() => dataSource.destroy());

  it('defines six questions with unique ids', () => {
    assert.equal(QUESTIONS.length, 6);
    assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 6);
  });

  const run = async (id: string) => (await service.runSql(service.find(id))).rows;

  it('cq1 (SQL): sycamore fig figures from Asyut', async () => {
    assert.deepEqual((await run('cq1')).map((r) => r.inventoryNumber), ['WF-0001', 'WF-0002', 'WF-0003', 'WF-0024']);
  });

  it('cq2 (SQL): Middle Kingdom figures with material and height', async () => {
    const rows = await run('cq2');
    assert.equal(rows.length, 12);
    assert.deepEqual(rows[0], {
      inventoryNumber: 'WF-0001',
      title: 'Servant grinding grain',
      material: 'Sycamore fig',
      heightCm: 18.4,
    });
  });

  it('cq3 (SQL): pairs with the same previous owner, each pair once', async () => {
    const rows = await run('cq3');
    assert.equal(rows.length, 38);
    assert.ok(rows.every((r) => String(r.figureA) < String(r.figureB)));
  });

  it('cq4 (SQL): counts add up to the figures that have a material and a period', async () => {
    const rows = await run('cq4');
    assert.equal(rows.reduce((sum, r) => sum + Number(r.figures), 0), 25);
  });

  it('cq5 (SQL): recursive CTE finds sites one and two levels below Upper Egypt', async () => {
    const rows = await run('cq5');
    assert.deepEqual(new Set(rows.map((r) => r.site)), new Set(['Thebes', 'Deir el-Bahri']));
    assert.equal(rows.length, 6);
  });

  it('cq6 (SQL): connections of WF-0017 through four kinds of link', async () => {
    const rows = await run('cq6');
    assert.equal(rows.length, 11);
    assert.deepEqual(
      rows.filter((r) => r.inventoryNumber === 'WF-0025').map((r) => r.sharedWith),
      ["Christ's thorn", 'Deir el-Bahri'],
    );
  });

  it('rejects an unknown question id', () => {
    assert.throws(() => service.find('cq99'), /Unknown question/);
  });

  it('formats SQL for display with the parameters written in', () => {
    const formatted = formatSql('SELECT "f"."title" AS "title" FROM "figure" "f" WHERE "f"."id" = ? AND "f"."title" = ?', [7, "it's"]);
    assert.equal(formatted, "SELECT f.title AS title\nFROM figure f\nWHERE f.id = 7\n  AND f.title = 'it''s'");
  });

  it('compares rows regardless of order', () => {
    const a = [{ x: 1, y: 'a' }, { x: 2, y: 'b' }];
    assert.equal(sameRows(a, [...a].reverse(), ['x', 'y']), true);
    assert.equal(sameRows(a, [{ x: 1, y: 'a' }], ['x', 'y']), false);
  });

  // The key claim of the project: both models give the same answers.
  for (const { id } of QUESTIONS) {
    it(`${id}: SQL and SPARQL return the same rows (needs Oxigraph)`, async (t) => {
      if (!triplestoreIsUp) return t.skip(`Oxigraph is not reachable at ${config.sparqlEndpoint}`);
      const comparison = await service.compare(id);
      assert.ok(comparison.sql.rows.length > 0);
      assert.deepEqual(comparison.sparql.rows, comparison.sql.rows);
      assert.equal(comparison.resultsMatch, true);
    });
  }
});
