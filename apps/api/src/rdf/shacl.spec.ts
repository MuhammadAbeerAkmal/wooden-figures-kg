import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { DataFactory, Store } from 'n3';
import type { Quad } from 'n3';
import type { DataSource } from 'typeorm';
import { config } from '../config.js';
import { Figure } from '../database/entities/index.js';
import { FiguresService } from '../figures/figures.service.js';
import { createTestDatabase } from '../testing/test-database.js';
import { VocabService } from '../vocab/vocab.service.js';
import { datasetQuads } from './mapper.js';
import { crm, uri } from './namespaces.js';
import { parseTurtle, validateShacl } from './shacl.js';

const { quad, literal } = DataFactory;

describe('SHACL shapes', () => {
  let dataSource: DataSource;
  let dataset: Quad[];
  const shapes = parseTurtle(fs.readFileSync(config.shapesPath, 'utf8'));
  const figure = uri('fig', 'WF-0001');

  /** Validates a copy of the data set after applying one deliberate mistake. */
  const validateWith = async (breakIt: (store: Store) => void) => {
    const store = new Store(dataset);
    breakIt(store);
    return validateShacl(store.getQuads(null, null, null, null), shapes);
  };

  before(async () => {
    dataSource = await createTestDatabase();
    const figures = await new FiguresService(dataSource.getRepository(Figure)).listForExport();
    dataset = datasetQuads(figures, await new VocabService(dataSource).all());
  });
  after(() => dataSource.destroy());

  it('accepts the exported data set', async () => {
    const report = await validateShacl(dataset, shapes);
    assert.deepEqual(report.results, []);
    assert.equal(report.conforms, true);
  });

  it('rejects a figure without a material', async () => {
    const report = await validateWith((store) =>
      store.removeQuads(store.getQuads(figure, crm('P45_consists_of'), null, null)),
    );
    assert.equal(report.conforms, false);
    assert.ok(report.results.some((r) => r.focusNode === figure.value && r.path === crm('P45_consists_of').value));
  });

  it('rejects a height that is not greater than zero', async () => {
    const height = uri('dim', 'WF-0001-height');
    const report = await validateWith((store) => {
      store.removeQuads(store.getQuads(height, crm('P90_has_value'), null, null));
      store.addQuad(quad(height, crm('P90_has_value'), literal('-3', uri('xsd', 'decimal'))));
    });
    assert.equal(report.conforms, false);
    assert.ok(report.results.some((r) => r.constraint === 'MinExclusiveConstraintComponent'));
  });

  it('rejects an inventory number in the wrong format', async () => {
    const identifier = uri('id', 'WF-0001');
    const report = await validateWith((store) => {
      store.removeQuads(store.getQuads(identifier, crm('P190_has_symbolic_content'), null, null));
      store.addQuad(quad(identifier, crm('P190_has_symbolic_content'), literal('figure one')));
    });
    assert.equal(report.conforms, false);
    assert.ok(report.results.some((r) => r.constraint === 'PatternConstraintComponent'));
  });

  it('rejects a condition term used as the object type', async () => {
    const report = await validateWith((store) => {
      store.removeQuads(store.getQuads(figure, crm('P2_has_type'), null, null));
      store.addQuad(quad(figure, crm('P2_has_type'), uri('type', 'condition-good')));
    });
    assert.equal(report.conforms, false);
    assert.ok(report.results.some((r) => r.focusNode === figure.value && r.constraint === 'HasValueConstraintComponent'));
  });

  it('rejects a figure without a height', async () => {
    const height = uri('dim', 'WF-0001-height');
    const report = await validateWith((store) =>
      store.removeQuads(store.getQuads(figure, crm('P43_has_dimension'), height, null)),
    );
    assert.equal(report.conforms, false);
    assert.ok(report.results.some((r) => r.constraint === 'QualifiedMinCountConstraintComponent'));
  });

  it('rejects a link to a material that is not declared (no dangling references)', async () => {
    const report = await validateWith((store) => {
      store.removeQuads(store.getQuads(figure, crm('P45_consists_of'), null, null));
      store.addQuad(quad(figure, crm('P45_consists_of'), uri('mat', 'plastic')));
    });
    assert.equal(report.conforms, false);
    assert.ok(report.results.some((r) => r.constraint === 'ClassConstraintComponent'));
  });
});
