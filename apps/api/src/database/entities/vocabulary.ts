import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';

/**
 * Controlled vocabularies. Every row has a `slug`: a stable, human-readable key
 * that survives re-seeding. The RDF mapping builds URIs from it, so URIs never
 * depend on auto-increment ids.
 */

@Entity('material')
export class Material {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug!: string;

  /** Common name of the wood species, e.g. "Sycamore fig". */
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'scientific_name', type: 'varchar', length: 120, nullable: true })
  scientificName!: string | null;
}

@Entity('object_type')
export class ObjectType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
}

@Entity('period')
@Check('period_start_before_end', '"start_year" < "end_year"')
export class Period {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  /** Astronomical year numbering is NOT used: -2055 means 2055 BCE. */
  @Column({ name: 'start_year', type: 'integer' })
  startYear!: number;

  @Column({ name: 'end_year', type: 'integer' })
  endYear!: number;
}

/**
 * Places form a hierarchy (country > region > site > part of a site) through
 * the self-referencing `parent_id`.
 */
@Entity('site')
export class Site {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @ManyToOne(() => Site, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parent_id' })
  parent!: Relation<Site> | null;
}

/** Previous owner or collection the museum acquired a figure from. */
@Entity('collection')
export class Collection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;
}
