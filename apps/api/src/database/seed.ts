import type { DataSource } from 'typeorm';
import {
  Collection,
  ConditionReport,
  Figure,
  Material,
  ObjectType,
  Period,
  Site,
} from './entities/index.js';
import { COLLECTIONS, FIGURES, MATERIALS, OBJECT_TYPES, PERIODS, SITES } from './seed-data.js';

function bySlug<T extends { slug: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.slug, row]));
}

function lookup<T>(map: Map<string, T>, slug: string, kind: string): T {
  const row = map.get(slug);
  if (!row) throw new Error(`Seed data refers to unknown ${kind} "${slug}"`);
  return row;
}

/**
 * Inserts the fictional data set in one transaction. Does nothing when the
 * database already holds figures, so it is safe to call on every start.
 * Returns the number of figures inserted.
 */
export async function seedDatabase(dataSource: DataSource): Promise<number> {
  if ((await dataSource.getRepository(Figure).count()) > 0) return 0;

  await dataSource.transaction(async (manager) => {
    const materials = bySlug(await manager.save(Material, MATERIALS));
    const objectTypes = bySlug(await manager.save(ObjectType, OBJECT_TYPES));
    const periods = bySlug(await manager.save(Period, PERIODS));
    const collections = bySlug(await manager.save(Collection, COLLECTIONS));

    // Parents are listed before children, so each parent already has an id.
    const sites = new Map<string, Site>();
    for (const { slug, name, parent } of SITES) {
      const site = manager.create(Site, {
        slug,
        name,
        parent: parent ? lookup(sites, parent, 'site') : null,
      });
      sites.set(slug, await manager.save(site));
    }

    for (const seed of FIGURES) {
      const [heightCm, widthCm, depthCm] = seed.size;
      const figure = await manager.save(
        manager.create(Figure, {
          inventoryNumber: seed.inventoryNumber,
          title: seed.title,
          description: seed.description,
          heightCm,
          widthCm,
          depthCm,
          acquisitionYear: seed.acquisitionYear,
          objectType: lookup(objectTypes, seed.objectType, 'object type'),
          material: lookup(materials, seed.material, 'material'),
          period: lookup(periods, seed.period, 'period'),
          site: seed.site ? lookup(sites, seed.site, 'site') : null,
          collection: seed.collection ? lookup(collections, seed.collection, 'collection') : null,
        }),
      );
      await manager.save(
        ConditionReport,
        seed.reports.map((report) => ({ ...report, figure })),
      );
    }
  });

  return FIGURES.length;
}
