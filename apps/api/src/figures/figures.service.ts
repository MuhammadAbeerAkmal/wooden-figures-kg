import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Figure } from '../database/entities/index.js';

/** All filters are vocabulary slugs, except `q` which is a free-text search. */
export interface FigureFilter {
  material?: string;
  objectType?: string;
  period?: string;
  site?: string;
  collection?: string;
  q?: string;
}

@Injectable()
export class FiguresService {
  constructor(@InjectRepository(Figure) private readonly figures: Repository<Figure>) {}

  list(filter: FigureFilter = {}): Promise<Figure[]> {
    const query = this.figures
      .createQueryBuilder('figure')
      .leftJoinAndSelect('figure.objectType', 'objectType')
      .leftJoinAndSelect('figure.material', 'material')
      .leftJoinAndSelect('figure.period', 'period')
      .leftJoinAndSelect('figure.site', 'site')
      .leftJoinAndSelect('figure.collection', 'collection')
      .orderBy('figure.inventoryNumber', 'ASC');

    // Values are always bound as parameters, never concatenated into the SQL.
    if (filter.material) query.andWhere('material.slug = :material', { material: filter.material });
    if (filter.objectType) query.andWhere('objectType.slug = :objectType', { objectType: filter.objectType });
    if (filter.period) query.andWhere('period.slug = :period', { period: filter.period });
    if (filter.site) query.andWhere('site.slug = :site', { site: filter.site });
    if (filter.collection) query.andWhere('collection.slug = :collection', { collection: filter.collection });
    if (filter.q?.trim()) {
      query.andWhere(
        '(figure.title LIKE :q OR figure.inventoryNumber LIKE :q OR figure.description LIKE :q)',
        { q: `%${filter.q.trim()}%` },
      );
    }
    return query.getMany();
  }

  /** One figure with every related row, including its condition reports. */
  async get(inventoryNumber: string): Promise<Figure> {
    const figure = await this.figures.findOne({
      where: { inventoryNumber },
      relations: {
        objectType: true,
        material: true,
        period: true,
        site: { parent: true },
        collection: true,
        conditionReports: true,
      },
      order: { conditionReports: { assessedOn: 'ASC' } },
    });
    if (!figure) throw new NotFoundException(`No figure with inventory number "${inventoryNumber}"`);
    return figure;
  }

  /** Everything the RDF export needs, in a stable order. */
  listForExport(): Promise<Figure[]> {
    return this.figures.find({
      relations: {
        objectType: true,
        material: true,
        period: true,
        site: true,
        collection: true,
        conditionReports: true,
      },
      order: { inventoryNumber: 'ASC', conditionReports: { assessedOn: 'ASC' } },
    });
  }
}
