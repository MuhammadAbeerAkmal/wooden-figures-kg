import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Parser, Store } from 'n3';
import type { DataSource } from 'typeorm';
import { Figure } from '../database/entities/index.js';
import { FiguresService } from '../figures/figures.service.js';
import { createTestDatabase } from '../testing/test-database.js';
import { VocabService } from '../vocab/vocab.service.js';
import { datasetQuads, figureQuads, gYear, toTurtle } from './mapper.js';
import { PREFIXES } from './namespaces.js';

const CRM = PREFIXES.crm;
const RDF_TYPE = `${PREFIXES.rdf}type`;

describe('CIDOC-CRM mapping', () => {
  let dataSource: DataSource;
  let figures: Figure[];
  let store: Store;

  /** Objects of (subject, predicate) as plain strings. */
  const values = (subject: string, predicate: string): string[] =>
    store.getObjects(subject, predicate, null).map((term) => term.value);

  before(async () => {
    dataSource = await createTestDatabase();
    figures = await new FiguresService(dataSource.getRepository(Figure)).listForExport();
    store = new Store(datasetQuads(figures, await new VocabService(dataSource).all()));
  });
  after(() => dataSource.destroy());

  it('maps a figure to an E22 Human-Made Object with type, material and place', () => {
    const fig = `${PREFIXES.fig}WF-0002`;
    assert.deepEqual(values(fig, RDF_TYPE), [`${CRM}E22_Human-Made_Object`]);
    assert.deepEqual(values(fig, `${PREFIXES.rdfs}label`), ['Offering bearer with basket']);
    assert.deepEqual(values(fig, `${CRM}P2_has_type`), [`${PREFIXES.type}offering-bearer`]);
    assert.deepEqual(values(fig, `${CRM}P45_consists_of`), [`${PREFIXES.mat}sycamore-fig`]);
    assert.deepEqual(values(fig, `${CRM}P53_has_former_or_current_location`), [`${PREFIXES.place}asyut`]);
  });

  it('puts the dating on a production event, not on the object', () => {
    const fig = `${PREFIXES.fig}WF-0002`;
    const [production] = values(fig, `${CRM}P108i_was_produced_by`);
    assert.deepEqual(values(production, RDF_TYPE), [`${CRM}E12_Production`]);
    assert.deepEqual(values(production, `${CRM}P4_has_time-span`), [`${PREFIXES.period}middle-kingdom`]);
    assert.deepEqual(values(fig, `${CRM}P4_has_time-span`), []);
  });

  it('maps the previous owner through an acquisition event', () => {
    const [acquisition] = values(`${PREFIXES.fig}WF-0002`, `${CRM}P24i_changed_ownership_through`);
    assert.deepEqual(values(acquisition, `${CRM}P23_transferred_title_from`), [`${PREFIXES.actor}hartwell`]);
    assert.deepEqual(values(acquisition, `${CRM}P22_transferred_title_to`), [`${PREFIXES.actor}museum`]);
    assert.deepEqual(values(acquisition, `${CRM}P4_has_time-span`), [`${PREFIXES.ts}1923`]);
  });

  it('creates one condition state per condition report', () => {
    assert.equal(values(`${PREFIXES.fig}WF-0002`, `${CRM}P44_has_condition`).length, 2);
  });

  it('leaves out what the relational row does not know (NULL becomes no triple)', () => {
    const unknown = figures.find((f) => f.inventoryNumber === 'WF-0023')!;
    const predicates = new Set(figureQuads(unknown).map((q) => q.predicate.value));
    assert.ok(!predicates.has(`${CRM}P53_has_former_or_current_location`));
    assert.ok(!predicates.has(`${CRM}P24i_changed_ownership_through`));
    // Height and width are recorded, depth is NULL.
    assert.equal(values(`${PREFIXES.fig}WF-0023`, `${CRM}P43_has_dimension`).length, 2);
  });

  it('maps the site hierarchy to P89 falls within', () => {
    assert.deepEqual(values(`${PREFIXES.place}deir-el-bahri`, `${CRM}P89_falls_within`), [`${PREFIXES.place}thebes`]);
    assert.deepEqual(values(`${PREFIXES.place}egypt`, `${CRM}P89_falls_within`), []);
  });

  it('formats years as xsd:gYear with four digits', () => {
    assert.equal(gYear(-2055).value, '-2055');
    assert.equal(gYear(-664).value, '-0664');
    assert.equal(gYear(1923).value, '1923');
  });

  it('serialises to Turtle that parses back to the same number of triples', async () => {
    const turtle = await toTurtle(store.getQuads(null, null, null, null));
    assert.match(turtle, /@prefix crm: <http:\/\/www\.cidoc-crm\.org\/cidoc-crm\/>/);
    assert.equal(new Parser().parse(turtle).length, store.size);
  });
});
