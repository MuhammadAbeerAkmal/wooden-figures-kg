# Relational model versus CIDOC-CRM graph: an evaluation

This document compares the two models of the same fictional data set: 25
wooden figures with their materials, find sites, periods, previous owners and
condition reports. It is limited to what this project actually built and
measured. It is not a general verdict on relational databases or knowledge
graphs.

## The two models in numbers

| | Relational (SQLite) | Graph (CIDOC-CRM in Oxigraph) |
| --- | --- | --- |
| Structure | 7 tables | 12 classes, 19 CRM properties, plus `rdfs:label` and `skos:altLabel` |
| Size | 84 rows | 1,360 triples |
| One figure | 1 row and 1 or 2 condition report rows | about 50 triples in about ten nodes |
| Constraints | in the schema: `NOT NULL`, `UNIQUE`, `CHECK`, foreign keys | outside the data: SHACL shapes, checked on demand |
| Unknown value | `NULL` | no triple |
| Query language | SQL, through the TypeORM query builder | SPARQL 1.1 |

The graph is about sixteen times larger in statements because CIDOC-CRM makes
things explicit that the table leaves implied: the production event behind a
dating, the unit behind `height_cm`, the museum as the receiver of an
acquisition.

## The six questions

Both versions of every question return identical rows. A test checks this
(`compare.spec.ts`), and the UI shows it for each question.

Query size is counted in lines as shown in the UI, without `PREFIX` lines.

| # | Question | SQL | SPARQL | Easier in |
| --- | --- | --- | --- | --- |
| 1 | Sycamore fig figures from Asyut | 8 lines, 2 joins | 9 lines | about the same |
| 2 | Middle Kingdom figures with material and height | 9 lines, 2 joins | 11 lines | SQL |
| 3 | Pairs with the same previous owner | 8 lines, self-join | 10 lines | about the same |
| 4 | Count per material and period | 8 lines, 2 joins | 8 lines | SQL |
| 5 | Figures found anywhere within Upper Egypt | 15 lines, recursive CTE | 9 lines | SPARQL |
| 6 | Connections of WF-0017 through site, period, material or owner | 32 lines, 8 joins, 3 `UNION ALL` | 15 lines | SPARQL |

### Where SQL was easier

**Question 2 (attributes).** The height is a column: `f.height_cm`. In the graph
it is a dimension node, so the query must find the dimension, check that its
type is "height" and read its value. The dating is similar: one join to
`period` in SQL, a two-step path through the production event in SPARQL.
CIDOC-CRM is more precise, and that precision is paid for in every query that
only wants a simple attribute.

**Question 4 (aggregation).** The two queries are the same length, but the SQL
one is safe by construction: `material_id` is one `NOT NULL` column, so each
figure is counted exactly once. In the graph nothing in the data model stops a
figure from having two materials, which would count it twice. The SPARQL count
is correct only because a SHACL shape limits `P45 consists of` to one value and
the data was validated. The guarantee exists, but it lives in a different file
from the data.

**Tooling.** The ORM gave typed entities, migrations and parameter binding. On
the SPARQL side the queries are plain strings, and a typo in a property name
does not fail: it returns zero rows. That is why this project checks every CRM
term against the official RDFS in a test.

### Where SPARQL was easier

**Question 5 (hierarchy of unknown depth).** `crm:P89_falls_within*` follows
the place hierarchy to any depth with one character. SQL can do it with a
recursive common table expression, and SQLite runs it well, but it is the
hardest SQL in the project to read. The TypeORM query builder cannot express
recursion, so the CTE body is a raw SQL string inside otherwise typed code.

**Question 6 (treating different links alike).** "What connects these
figures?" does not care whether the shared thing is a site, a period, a
material or an owner. In the graph they are all nodes, and one pattern with
alternative paths covers them. In the relational schema each is a different
foreign key to a different table, so the query is four separate self-joins
glued together with `UNION ALL`, and the query builder has no `UNION` at all.
A fifth kind of link means a fifth copy of the query in SQL and one more
alternative in the SPARQL path.

### Where it made little difference

**Questions 1 and 3.** A filter on two linked things, and a self-join. SPARQL
reads slightly more naturally, because naming a term (`mat:sycamore-fig`) or
reusing a variable (`?owner`) says directly what is meant, while SQL needs the
join spelled out. SQL is slightly more familiar. Neither is hard.

## Strengths and weaknesses for this data

### Relational model

Strengths

- **Integrity is built in.** A figure cannot point to a material that does not
  exist, a condition cannot be "excellent", a height cannot be negative. The
  database refuses the write.
- **Compact and predictable.** One row per figure. Anyone can read the table.
- **Simple attributes are simple to query.**
- **Mature tooling.** Migrations, an ORM, typed results, one file to back up.

Weaknesses

- **Meaning is implicit.** `period_id` on `figure` does not say whether the
  figure was made, used or buried in that period. `collection_id` does not say
  the figure was bought from that collection. The column name and a comment
  carry the meaning; the schema does not.
- **The schema is private.** Another museum's database has other table and
  column names. Combining the two needs a mapping written by hand.
- **Changes cost a migration.** A second material per figure, a second
  acquisition, or a date range for the find would each change the table
  structure.
- **Hierarchies and "any kind of link" questions are awkward** (questions 5
  and 6).

### CIDOC-CRM graph

Strengths

- **Meaning is explicit and shared.** `P108i was produced by` and
  `P23 transferred title from` are defined in a published standard that museums
  and other projects already use. Data from elsewhere that follows CIDOC-CRM
  can be loaded next to this data and queried together.
- **Events are first-class.** A second acquisition, or the person who carried
  out a condition assessment, is one more node. No structure changes.
- **Paths and hierarchies are natural to query.**
- **Missing data needs no special value.** There is simply no triple.

Weaknesses

- **Verbose.** About 50 triples for what is one row. Every query walks more
  steps.
- **No integrity by default.** A triplestore accepts any triple, including a
  misspelled property. SHACL closes the gap, but it must be written, kept in
  step with the mapping, and run. It reports problems; it does not prevent the
  write.
- **A steep learning curve.** Choosing between E52 Time-Span and E4 Period, or
  how to model a find site, takes reading and judgement. The relational column
  took a minute.
- **Weaker tooling in this stack.** Queries are strings, results are untyped
  JSON, and there is no migration tool.
- **Modelling choices are easy to get subtly wrong**, and a wrong choice still
  loads and still answers queries.

## Other observations

- **NULL versus absence.** In SQL, `site_id IS NULL` is a fact that can be
  queried directly. In SPARQL "has no find site" needs `FILTER NOT EXISTS`.
  Neither model distinguishes "unknown" from "does not apply" here.
- **Constraints say the same thing twice.** The CHECK constraint on `condition`
  and the `sh:in` list in the shapes hold the same four values. This project
  keeps them in step by hand and by tests. A real system should generate one
  from the other.
- **SHACL can also drive the UI.** The data entry form is generated from the
  shapes. There is no equivalent for the relational schema in this stack. One
  limit showed up: `sh:class crm:E55_Type` offers every type in the dropdown,
  including condition terms, because CIDOC-CRM types are instances, not
  classes. A separate shape then rejects the wrong choice on validation.
- **Timings prove little here.** SQL answers in well under a millisecond and
  SPARQL in a few milliseconds. SQLite runs inside the API process, and every
  SPARQL query is an HTTP request to another container, so the difference is
  mostly transport. With 25 figures neither engine does any real work. No
  conclusion about performance at scale should be drawn from these numbers.

## When to choose which, for data like this

- **A single institution managing its own records**, with a stable set of
  fields and forms for data entry: the relational model. It is smaller, safer
  and easier to staff.
- **Research data meant to be shared, combined with other sources, or asked
  questions nobody planned for**: the graph. The cost of the standard is paid
  once, and the data stays understandable outside the project that made it.
- **Both together**, as in this project: a relational database as the system of
  record, and a CIDOC-CRM export for publication and cross-collection queries.
  The price is the mapping, which must be maintained and tested.

## Lessons learned

1. The mapping is where the modelling happens. Writing down a reason for every
   column (see [mapping.md](mapping.md)) exposed what the relational schema
   only implied.
2. A column is often a hidden event. `period_id`, `collection_id` and
   `acquisition_year` all turned into events once the question "what does this
   actually say?" was asked.
3. A graph without validation is unsafe. SHACL shapes are not optional extras;
   they are the schema.
4. Checking results against each other finds bugs. Requiring the SQL and SPARQL
   versions to return identical rows forced both to be precise.
5. A standard has a cost in classes. The brief asked for six to eight CIDOC-CRM
   classes; twelve were needed to stay correct. See
   [decisions.md](decisions.md).

## Conclusion

For this data set neither model is better overall. Each is better at a
different job.

The relational model is the better **system of record**. It is far more
compact, it refuses bad data at the moment of writing, and four of the six
questions are as easy or easier to ask in SQL. For a museum that only needs to
manage its own figures, it is enough.

The CIDOC-CRM graph is the better **form for sharing and for research**. It
says what the table only implies: that a dating is the time of a production,
and that a previous owner is one side of an acquisition. It answered the two
questions about structure, the place hierarchy and the connections between
figures, in clearly less query text (9 lines against 15, and 15 against 32). Its vocabulary is a published
standard, so the data stays readable outside this project.

The graph's weakness is not querying but safety. Without the SHACL shapes it
would accept a figure with no material or a height of minus three centimetres,
and the count in question 4 would be wrong without any error. The shapes are
therefore part of the model, not an addition to it.

The design used here follows from that: one relational source of truth, one
tested mapping, and a validated graph derived from it. The cost is the mapping,
which is the place where most of the modelling decisions in this project were
made.

The result holds for 25 figures from one source. Two things would change the
balance in favour of the graph: a second data set with a different structure,
which would need its own mapping in SQL but could be loaded beside this one in
RDF, and links to external authorities for places, materials and types.
