import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { DataSource } from 'typeorm';
import { ConditionReport, Figure, Material } from '../database/entities/index.js';
import { seedDatabase } from '../database/seed.js';
import { createTestDatabase } from '../testing/test-database.js';
import { FiguresService } from './figures.service.js';

describe('relational model', () => {
  let dataSource: DataSource;
  let service: FiguresService;

  before(async () => {
    dataSource = await createTestDatabase();
    service = new FiguresService(dataSource.getRepository(Figure));
  });
  after(() => dataSource.destroy());

  it('seeds 25 figures and does not seed twice', async () => {
    assert.equal((await service.list()).length, 25);
    assert.equal(await seedDatabase(dataSource), 0);
    assert.equal((await service.list()).length, 25);
  });

  it('filters by vocabulary slugs', async () => {
    const figures = await service.list({ material: 'sycamore-fig', site: 'asyut' });
    assert.deepEqual(
      figures.map((f) => f.inventoryNumber),
      ['WF-0001', 'WF-0002', 'WF-0003', 'WF-0024'],
    );
  });

  it('searches title, inventory number and description', async () => {
    const figures = await service.list({ q: 'rower' });
    assert.ok(figures.length >= 3);
    assert.ok(figures.every((f) => /rower/i.test(`${f.title} ${f.description}`)));
  });

  it('loads one figure with its related rows', async () => {
    const figure = await service.get('WF-0002');
    assert.equal(figure.material.name, 'Sycamore fig');
    assert.equal(figure.site?.parent?.name, 'Middle Egypt');
    assert.deepEqual(
      figure.conditionReports.map((r) => r.condition),
      ['fair', 'good'],
    );
  });

  it('rejects an unknown inventory number', async () => {
    await assert.rejects(service.get('WF-9999'), /No figure/);
  });

  it('enforces foreign keys: a material in use cannot be deleted', async () => {
    await assert.rejects(dataSource.getRepository(Material).delete({ slug: 'cedar' }), /FOREIGN KEY/);
  });

  it('enforces the condition vocabulary with a CHECK constraint', async () => {
    const figure = await service.get('WF-0001');
    const report = dataSource.getRepository(ConditionReport).create({
      figure,
      assessedOn: '2024-01-01',
      condition: 'excellent' as never,
      note: 'Not an allowed value',
    });
    await assert.rejects(dataSource.getRepository(ConditionReport).save(report), /CHECK/);
  });
});
