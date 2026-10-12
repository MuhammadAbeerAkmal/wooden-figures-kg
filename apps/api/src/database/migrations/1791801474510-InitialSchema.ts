import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial relational schema.
 *
 * Generated with `npm run migration:generate` and then tidied by hand: the
 * generator creates each SQLite table twice (once without and once with its
 * foreign keys). The final schema is the same. Constraint and index names are
 * the ones TypeORM derives from the entities; keep them, or the next
 * `migration:generate` reports false differences.
 */
/**
 * Collapses the whitespace of a formatted statement. TypeORM compares the DDL
 * that SQLite stores with the DDL it would generate itself, so the stored text
 * must be on one line.
 */
const ddl = (strings: TemplateStringsArray): string =>
  strings.join('').replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();

export class InitialSchema1791801474510 implements MigrationInterface {
  name = 'InitialSchema1791801474510';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(ddl`
      CREATE TABLE "material" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "slug" varchar(64) NOT NULL,
        "name" varchar(120) NOT NULL,
        "scientific_name" varchar(120),
        CONSTRAINT "UQ_2e27d9ae5bd024f12fd35af717a" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(ddl`
      CREATE TABLE "object_type" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "slug" varchar(64) NOT NULL,
        "name" varchar(120) NOT NULL,
        CONSTRAINT "UQ_2311a91aa50e05e2b8591acf4b0" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(ddl`
      CREATE TABLE "period" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "slug" varchar(64) NOT NULL,
        "name" varchar(120) NOT NULL,
        "start_year" integer NOT NULL,
        "end_year" integer NOT NULL,
        CONSTRAINT "UQ_ae99b39fce0ab26e18bc31337dc" UNIQUE ("slug"),
        CONSTRAINT "period_start_before_end" CHECK ("start_year" < "end_year")
      )
    `);
    await queryRunner.query(ddl`
      CREATE TABLE "site" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "slug" varchar(64) NOT NULL,
        "name" varchar(120) NOT NULL,
        "parent_id" integer,
        CONSTRAINT "UQ_5a6595eb819d99507fc9817c7c1" UNIQUE ("slug"),
        CONSTRAINT "FK_10b452c4873d9004e709a55e197" FOREIGN KEY ("parent_id") REFERENCES "site" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(ddl`
      CREATE TABLE "collection" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "slug" varchar(64) NOT NULL,
        "name" varchar(160) NOT NULL,
        CONSTRAINT "UQ_75a6fd6eedd7fa7378de400b0aa" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(ddl`
      CREATE TABLE "figure" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "inventory_number" varchar(16) NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "height_cm" real NOT NULL,
        "width_cm" real,
        "depth_cm" real,
        "acquisition_year" integer,
        "object_type_id" integer NOT NULL,
        "material_id" integer NOT NULL,
        "period_id" integer NOT NULL,
        "site_id" integer,
        "collection_id" integer,
        CONSTRAINT "UQ_5eb720356c853aa4337734136d7" UNIQUE ("inventory_number"),
        CONSTRAINT "figure_dimensions_positive" CHECK (
          "height_cm" > 0
          AND ("width_cm" IS NULL OR "width_cm" > 0)
          AND ("depth_cm" IS NULL OR "depth_cm" > 0)
        ),
        CONSTRAINT "FK_06687852b3939b3348c160c1008" FOREIGN KEY ("object_type_id") REFERENCES "object_type" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_72e858a56aa63f8149f3537e52d" FOREIGN KEY ("material_id") REFERENCES "material" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_c3d09e1fec0f8248143531ba560" FOREIGN KEY ("period_id") REFERENCES "period" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_1fe70ece869805ea86bfa815c5d" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_0ebad35461a3a4b510483550599" FOREIGN KEY ("collection_id") REFERENCES "collection" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_06687852b3939b3348c160c100" ON "figure" ("object_type_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_72e858a56aa63f8149f3537e52" ON "figure" ("material_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_c3d09e1fec0f8248143531ba56" ON "figure" ("period_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_1fe70ece869805ea86bfa815c5" ON "figure" ("site_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_0ebad35461a3a4b51048355059" ON "figure" ("collection_id")`);
    await queryRunner.query(ddl`
      CREATE TABLE "condition_report" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "assessed_on" date NOT NULL,
        "condition" varchar(16) NOT NULL,
        "note" text NOT NULL,
        "figure_id" integer NOT NULL,
        CONSTRAINT "condition_report_condition" CHECK (
          "condition" IN ('good', 'fair', 'poor', 'fragmentary')
        ),
        CONSTRAINT "FK_db28dc53f6e401bdb01eefa9351" FOREIGN KEY ("figure_id") REFERENCES "figure" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_db28dc53f6e401bdb01eefa935" ON "condition_report" ("figure_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['condition_report', 'figure', 'collection', 'site', 'period', 'object_type', 'material']) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
  }
}
