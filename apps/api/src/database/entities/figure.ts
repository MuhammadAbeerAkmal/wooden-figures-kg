import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Collection, Material, ObjectType, Period, Site } from './vocabulary.js';

export const CONDITIONS = ['good', 'fair', 'poor', 'fragmentary'] as const;
export type Condition = (typeof CONDITIONS)[number];

@Entity('figure')
@Check('figure_dimensions_positive', '"height_cm" > 0 AND ("width_cm" IS NULL OR "width_cm" > 0) AND ("depth_cm" IS NULL OR "depth_cm" > 0)')
export class Figure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'inventory_number', type: 'varchar', length: 16, unique: true })
  inventoryNumber!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'height_cm', type: 'real' })
  heightCm!: number;

  @Column({ name: 'width_cm', type: 'real', nullable: true })
  widthCm!: number | null;

  @Column({ name: 'depth_cm', type: 'real', nullable: true })
  depthCm!: number | null;

  @ManyToOne(() => ObjectType, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'object_type_id' })
  @Index()
  objectType!: Relation<ObjectType>;

  @ManyToOne(() => Material, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  @Index()
  material!: Relation<Material>;

  @ManyToOne(() => Period, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'period_id' })
  @Index()
  period!: Relation<Period>;

  /** Find site. NULL when the find spot is not recorded. */
  @ManyToOne(() => Site, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'site_id' })
  @Index()
  site!: Relation<Site> | null;

  /** Previous owner or collection. NULL when the provenance is not recorded. */
  @ManyToOne(() => Collection, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'collection_id' })
  @Index()
  collection!: Relation<Collection> | null;

  /** Year the museum acquired the figure. */
  @Column({ name: 'acquisition_year', type: 'integer', nullable: true })
  acquisitionYear!: number | null;

  @OneToMany(() => ConditionReport, (report) => report.figure)
  conditionReports!: Relation<ConditionReport>[];
}

/** One figure can be assessed many times, so condition is a separate table. */
@Entity('condition_report')
@Check('condition_report_condition', `"condition" IN (${CONDITIONS.map((c) => `'${c}'`).join(', ')})`)
export class ConditionReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Figure, (figure) => figure.conditionReports, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'figure_id' })
  @Index()
  figure!: Relation<Figure>;

  /** ISO date (YYYY-MM-DD) of the assessment. */
  @Column({ name: 'assessed_on', type: 'date' })
  assessedOn!: string;

  /** One of CONDITIONS, enforced by the CHECK constraint above. */
  @Column({ type: 'varchar', length: 16 })
  condition!: Condition;

  @Column({ type: 'text' })
  note!: string;
}
