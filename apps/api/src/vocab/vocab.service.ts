import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Collection, Material, ObjectType, Period, Site } from '../database/entities/index.js';

export interface Vocabularies {
  materials: Material[];
  objectTypes: ObjectType[];
  periods: Period[];
  sites: Site[];
  collections: Collection[];
}

@Injectable()
export class VocabService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async all(): Promise<Vocabularies> {
    const repo = this.dataSource.getRepository.bind(this.dataSource);
    const [materials, objectTypes, periods, sites, collections] = await Promise.all([
      repo(Material).find({ order: { name: 'ASC' } }),
      repo(ObjectType).find({ order: { name: 'ASC' } }),
      repo(Period).find({ order: { startYear: 'ASC' } }),
      // Ordered by id so that parents come before their children.
      repo(Site).find({ relations: { parent: true }, order: { id: 'ASC' } }),
      repo(Collection).find({ order: { name: 'ASC' } }),
    ]);
    return { materials, objectTypes, periods, sites, collections };
  }
}
