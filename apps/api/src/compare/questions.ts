import type { DataSource, SelectQueryBuilder } from 'typeorm';
import { Figure } from '../database/entities/index.js';
import { sparqlPrefixes } from '../rdf/namespaces.js';

/**
 * The six competency questions. Each one is answered twice:
 *  - `sql`    built with the TypeORM query builder, run on SQLite
 *  - `sparql` run on the CIDOC-CRM graph in Oxigraph
 * Both versions must return the same columns in the same order, so the
 * comparison engine can check that the two models agree.
 */

export interface SqlQuery {
  sql: string;
  parameters: unknown[];
}

export type Verdict = 'relational' | 'graph' | 'similar';

export interface Question {
  id: string;
  title: string;
  /** The question in plain language. */
  question: string;
  columns: string[];
  sql: (dataSource: DataSource) => SqlQuery;
  sparql: string;
  /** Which model made this question easier to ask, and why. */
  verdict: Verdict;
  note: string;
}

type Builder = SelectQueryBuilder<Figure>;

const figures = (dataSource: DataSource, alias: string): Builder =>
  dataSource.getRepository(Figure).createQueryBuilder(alias);

const built = (builder: Builder): SqlQuery => {
  const [sql, parameters] = builder.getQueryAndParameters();
  return { sql, parameters };
};

/** Path from a figure to its inventory number literal, used in most queries. */
const INVENTORY_NUMBER = 'crm:P48_has_preferred_identifier/crm:P190_has_symbolic_content';

export const QUESTIONS: Question[] = [
  {
    id: 'cq1',
    title: 'Material and find site',
    question: 'Which figures are made of sycamore fig and come from Asyut?',
    columns: ['inventoryNumber', 'title'],
    sql: (dataSource) =>
      built(
        figures(dataSource, 'f')
          .select('f.inventoryNumber', 'inventoryNumber')
          .addSelect('f.title', 'title')
          .innerJoin('f.material', 'm')
          .innerJoin('f.site', 's')
          .where('m.slug = :material', { material: 'sycamore-fig' })
          .andWhere('s.slug = :site', { site: 'asyut' })
          .orderBy('f.inventoryNumber'),
      ),
    sparql: `${sparqlPrefixes('crm', 'rdfs', 'mat', 'place')}

SELECT ?inventoryNumber ?title
WHERE {
  ?figure a crm:E22_Human-Made_Object ;
          crm:P45_consists_of mat:sycamore-fig ;
          crm:P53_has_former_or_current_location place:asyut ;
          ${INVENTORY_NUMBER} ?inventoryNumber ;
          rdfs:label ?title .
}
ORDER BY ?inventoryNumber`,
    verdict: 'similar',
    note: 'A filter on two directly linked things. SQL needs two joins to reach the vocabulary tables; SPARQL names the two terms directly. Both are short and easy to read.',
  },
  {
    id: 'cq2',
    title: 'Period, material and height',
    question: 'Which figures are dated to the Middle Kingdom, what are they made of, and how tall are they?',
    columns: ['inventoryNumber', 'title', 'material', 'heightCm'],
    sql: (dataSource) =>
      built(
        figures(dataSource, 'f')
          .select('f.inventoryNumber', 'inventoryNumber')
          .addSelect('f.title', 'title')
          .addSelect('m.name', 'material')
          .addSelect('f.heightCm', 'heightCm')
          .innerJoin('f.material', 'm')
          .innerJoin('f.period', 'p')
          .where('p.slug = :period', { period: 'middle-kingdom' })
          .orderBy('f.inventoryNumber'),
      ),
    sparql: `${sparqlPrefixes('crm', 'rdfs', 'period', 'type')}

SELECT ?inventoryNumber ?title ?material ?heightCm
WHERE {
  ?figure crm:P108i_was_produced_by/crm:P4_has_time-span period:middle-kingdom ;
          crm:P45_consists_of/rdfs:label ?material ;
          crm:P43_has_dimension ?height ;
          ${INVENTORY_NUMBER} ?inventoryNumber ;
          rdfs:label ?title .
  ?height crm:P2_has_type type:height ;
          crm:P90_has_value ?heightCm .
}
ORDER BY ?inventoryNumber`,
    verdict: 'relational',
    note: 'The height is one column in SQL. In CIDOC-CRM it is a dimension node with a type, a value and a unit, so the query needs three extra triple patterns, and the dating goes through a production event. The graph is more explicit, but a simple attribute costs more to ask for.',
  },
  {
    id: 'cq3',
    title: 'Same previous owner',
    question: 'Which pairs of figures came from the same previous owner?',
    columns: ['previousOwner', 'figureA', 'figureB'],
    sql: (dataSource) =>
      built(
        figures(dataSource, 'a')
          .select('c.name', 'previousOwner')
          .addSelect('a.inventoryNumber', 'figureA')
          .addSelect('b.inventoryNumber', 'figureB')
          .innerJoin('a.collection', 'c')
          .innerJoin(Figure, 'b', 'b.collection_id = c.id AND a.inventory_number < b.inventory_number')
          .orderBy('c.name')
          .addOrderBy('a.inventoryNumber')
          .addOrderBy('b.inventoryNumber'),
      ),
    sparql: `${sparqlPrefixes('crm', 'rdfs')}

SELECT ?previousOwner ?figureA ?figureB
WHERE {
  ?a crm:P24i_changed_ownership_through/crm:P23_transferred_title_from ?owner ;
     ${INVENTORY_NUMBER} ?figureA .
  ?b crm:P24i_changed_ownership_through/crm:P23_transferred_title_from ?owner ;
     ${INVENTORY_NUMBER} ?figureB .
  ?owner rdfs:label ?previousOwner .
  FILTER (?figureA < ?figureB)
}
ORDER BY ?previousOwner ?figureA ?figureB`,
    verdict: 'similar',
    note: 'A self-join in SQL, and the same variable used twice in SPARQL. Reusing ?owner reads naturally as "the same owner". The SQL needs the join condition written by hand, because the ORM has no relation from figure to figure.',
  },
  {
    id: 'cq4',
    title: 'Count per material and period',
    question: 'How many figures are there for each combination of material and period?',
    columns: ['material', 'period', 'figures'],
    sql: (dataSource) =>
      built(
        figures(dataSource, 'f')
          .select('m.name', 'material')
          .addSelect('p.name', 'period')
          .addSelect('COUNT(f.id)', 'figures')
          .innerJoin('f.material', 'm')
          .innerJoin('f.period', 'p')
          .groupBy('m.name')
          .addGroupBy('p.name')
          .orderBy('m.name')
          .addOrderBy('p.name'),
      ),
    sparql: `${sparqlPrefixes('crm', 'rdfs')}

SELECT ?material ?period (COUNT(?figure) AS ?figures)
WHERE {
  ?figure a crm:E22_Human-Made_Object ;
          crm:P45_consists_of/rdfs:label ?material ;
          crm:P108i_was_produced_by/crm:P4_has_time-span/rdfs:label ?period .
}
GROUP BY ?material ?period
ORDER BY ?material ?period`,
    verdict: 'relational',
    note: 'Aggregation is home ground for SQL: fixed columns, GROUP BY, done. SPARQL can do the same and the query is not longer, but counting is safe only because SHACL guarantees one material and one production per figure. Without that guarantee a figure with two materials would be counted twice, and nothing in the graph itself would prevent it.',
  },
  {
    id: 'cq5',
    title: 'Place hierarchy, any depth',
    question: 'Which figures were found anywhere within Upper Egypt, at any level of the place hierarchy?',
    columns: ['inventoryNumber', 'title', 'site'],
    sql: (dataSource) =>
      built(
        figures(dataSource, 'f')
          // The query builder cannot express recursion, so the CTE body is raw SQL.
          .addCommonTableExpression(
            `SELECT root.id FROM site root WHERE root.slug = :region
             UNION ALL
             SELECT child.id FROM site child INNER JOIN place_tree parent ON child.parent_id = parent.id`,
            'place_tree',
            { recursive: true, columnNames: ['id'] },
          )
          .select('f.inventoryNumber', 'inventoryNumber')
          .addSelect('f.title', 'title')
          .addSelect('s.name', 'site')
          .innerJoin('f.site', 's')
          .innerJoin('place_tree', 't', 't.id = s.id')
          .setParameter('region', 'upper-egypt')
          .orderBy('f.inventoryNumber'),
      ),
    sparql: `${sparqlPrefixes('crm', 'rdfs', 'place')}

SELECT ?inventoryNumber ?title ?site
WHERE {
  ?figure crm:P53_has_former_or_current_location ?place ;
          ${INVENTORY_NUMBER} ?inventoryNumber ;
          rdfs:label ?title .
  ?place crm:P89_falls_within* place:upper-egypt ;
         rdfs:label ?site .
}
ORDER BY ?inventoryNumber`,
    verdict: 'graph',
    note: 'The hierarchy has no fixed depth (Deir el-Bahri is within Thebes, which is within Upper Egypt). SPARQL follows it with one character: the * after the property. SQL needs a recursive common table expression, which the TypeORM query builder cannot build, so part of the query is a raw SQL string.',
  },
  {
    id: 'cq6',
    title: 'Connections of one figure',
    question: 'Which other figures are connected to WF-0017 through a shared find site, period, material or previous owner, and what do they share?',
    columns: ['inventoryNumber', 'sharedWith'],
    sql: (dataSource) => {
      // One query per kind of link. The query builder has no UNION,
      // so the four generated statements are joined as text.
      const link = (relation: 'site' | 'period' | 'material' | 'collection'): SqlQuery =>
        built(
          figures(dataSource, 'a')
            .select('b.inventoryNumber', 'inventoryNumber')
            .addSelect('shared.name', 'sharedWith')
            .innerJoin(`a.${relation}`, 'shared')
            .innerJoin(Figure, 'b', `b.${relation}_id = shared.id AND b.id <> a.id`)
            .where('a.inventoryNumber = :figure', { figure: 'WF-0017' }),
        );
      const parts = [link('site'), link('period'), link('material'), link('collection')];
      return {
        sql: `${parts.map((part) => part.sql).join(' UNION ALL ')} ORDER BY "inventoryNumber", "sharedWith"`,
        parameters: parts.flatMap((part) => part.parameters),
      };
    },
    sparql: `${sparqlPrefixes('crm', 'rdfs', 'fig')}

SELECT ?inventoryNumber ?sharedWith
WHERE {
  fig:WF-0017 ( crm:P53_has_former_or_current_location
              | crm:P108i_was_produced_by/crm:P4_has_time-span
              | crm:P45_consists_of
              | crm:P24i_changed_ownership_through/crm:P23_transferred_title_from ) ?shared .
  ?other ( crm:P53_has_former_or_current_location
         | crm:P108i_was_produced_by/crm:P4_has_time-span
         | crm:P45_consists_of
         | crm:P24i_changed_ownership_through/crm:P23_transferred_title_from ) ?shared ;
         ${INVENTORY_NUMBER} ?inventoryNumber .
  ?shared rdfs:label ?sharedWith .
  FILTER (?other != fig:WF-0017)
}
ORDER BY ?inventoryNumber ?sharedWith`,
    verdict: 'graph',
    note: 'The question treats site, period, material and owner alike: as things two figures can share. In the graph they are all nodes, so one pattern with alternative paths covers them. In SQL each kind of link is a different foreign key to a different table, so it takes four queries glued together with UNION ALL, and a fifth would be needed for every new kind of link.',
  },
];
