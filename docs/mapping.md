# Mapping: relational schema to CIDOC-CRM

This table documents how every relational column becomes RDF. The mapping is
implemented in [`apps/api/src/rdf/mapper.ts`](../apps/api/src/rdf/mapper.ts) and
follows **CIDOC-CRM 7.1.3**. Every class and property name below is checked
against the official RDFS file by a unit test
([`crm-terms.spec.ts`](../apps/api/src/rdf/crm-terms.spec.ts)).

All data is fictional.

## Prefixes

| Prefix | Namespace | Used for |
| --- | --- | --- |
| `crm:` | `http://www.cidoc-crm.org/cidoc-crm/` | CIDOC-CRM classes and properties |
| `rdfs:` | `http://www.w3.org/2000/01/rdf-schema#` | `rdfs:label` |
| `skos:` | `http://www.w3.org/2004/02/skos/core#` | `skos:altLabel` (one use) |
| `fig:` `id:` `prod:` `acq:` `cond:` `dim:` | `https://example.org/wfkg/figure/` etc. | one figure and the nodes that belong to it |
| `period:` `ts:` `place:` `mat:` `type:` `actor:` `unit:` | `https://example.org/wfkg/period/` etc. | shared vocabulary nodes |

URIs are built from stable keys (inventory number, vocabulary `slug`), never
from auto-increment ids.

## Classes used

Eight core classes carry the model. Four supporting classes are needed because
CIDOC-CRM does not allow the shortcut that the relational column takes.

| Class | Role here | Core or supporting |
| --- | --- | --- |
| `E22 Human-Made Object` | the wooden figure | core |
| `E12 Production` | the event that made the figure; carries the dating | core |
| `E52 Time-Span` | a period, an acquisition year, an assessment date | core |
| `E53 Place` | find sites and the regions they fall within | core |
| `E57 Material` | wood species | core |
| `E55 Type` | object type, condition term, kind of dimension, kind of identifier | core |
| `E8 Acquisition` | the transfer from the previous owner to the museum | core |
| `E3 Condition State` | one condition report | core |
| `E42 Identifier` | the inventory number | supporting |
| `E39 Actor` | previous owner, and the museum | supporting |
| `E54 Dimension` | height, width, depth | supporting |
| `E58 Measurement Unit` | centimetre | supporting |

## Table `figure`

`?fig` is `fig:{inventory_number}`, typed `crm:E22_Human-Made_Object`.

| Column | CIDOC-CRM path | Reason |
| --- | --- | --- |
| (row) | `?fig a crm:E22_Human-Made_Object` | A figure is a physical object made on purpose by people. E22 is the standard class for museum objects. |
| `id` | not mapped | A surrogate key has no meaning outside this database. The inventory number identifies the object. |
| `inventory_number` | `?fig crm:P48_has_preferred_identifier ?id` . `?id a crm:E42_Identifier ; crm:P190_has_symbolic_content "WF-0001" ; crm:P2_has_type type:inventory-number` | CRM treats an identifier as a thing of its own, so it can have a type and an object can have several (old numbers, loan numbers). P48 marks the preferred one. |
| `title` | `?fig rdfs:label "..."` | The CRM RDFS guidelines recommend `rdfs:label` for a plain display name. The full CRM form is `P102 has title` to an `E35 Title`; that adds a class without adding information here. |
| `description` | `?fig crm:P3_has_note "..."` | P3 is the property for free text about any entity. |
| `object_type_id` | `?fig crm:P2_has_type type:{slug}` | Classification by a controlled term is exactly what P2 and E55 are for. |
| `material_id` | `?fig crm:P45_consists_of mat:{slug}` | P45 links a physical thing to the material it is made of. |
| `site_id` | `?fig crm:P53_has_former_or_current_location place:{slug}` | P53 says the object was at this place at some time, which is true of a find site. See the note below: it does not say "was found at". No triple when the column is NULL. |
| `period_id` | `?fig crm:P108i_was_produced_by ?prod` . `?prod a crm:E12_Production ; crm:P4_has_time-span period:{slug}` | In CRM an object has no date. The event that produced it has a time-span. This is the central idea of the event-centric model. |
| `collection_id` | `?fig crm:P24i_changed_ownership_through ?acq` . `?acq a crm:E8_Acquisition ; crm:P23_transferred_title_from actor:{slug} ; crm:P22_transferred_title_to actor:museum` | "Previous owner" is a statement about a change of ownership. E8 records who gave up title and who received it. No acquisition node when both this column and `acquisition_year` are NULL. |
| `acquisition_year` | `?acq crm:P4_has_time-span ts:{year}` . `ts:{year} a crm:E52_Time-Span ; crm:P82a_begin_of_the_begin "1923"^^xsd:gYear ; crm:P82b_end_of_the_end "1923"^^xsd:gYear` | The year belongs to the acquisition event, not to the object. In the table it is a figure column only because each figure has one acquisition. |
| `height_cm` `width_cm` `depth_cm` | `?fig crm:P43_has_dimension ?dim` . `?dim a crm:E54_Dimension ; crm:P2_has_type type:height ; crm:P90_has_value "18.4"^^xsd:decimal ; crm:P91_has_unit unit:cm` | A number alone is not a measurement. E54 keeps the value, the unit and the kind of dimension together. The column name carries this in SQL (`height_cm`). One node per non-NULL column. |

## Table `condition_report`

`?cond` is `cond:{inventory_number}-{assessed_on}`, typed `crm:E3_Condition_State`.

| Column | CIDOC-CRM path | Reason |
| --- | --- | --- |
| (row) | `?cond a crm:E3_Condition_State` | E3 is the state of an object over a period of time. |
| `id` | not mapped | Surrogate key. The URI uses inventory number and date. |
| `figure_id` | `?fig crm:P44_has_condition ?cond` | The foreign key becomes a link from the object to its condition state. |
| `condition` | `?cond crm:P2_has_type type:condition-{value}` | The condition is a controlled term, so it is a type. The CHECK constraint becomes an `sh:in` list in SHACL. |
| `note` | `?cond crm:P3_has_note "..."` | Free text. |
| `assessed_on` | `?cond crm:P4_has_time-span ts:{date}` . `ts:{date} a crm:E52_Time-Span ; crm:P82a_begin_of_the_begin "2019-03-12"^^xsd:date ; crm:P82b_end_of_the_end "2019-03-12"^^xsd:date` | The state is known to hold on the day it was observed. See the note below about E14 Condition Assessment. |

## Vocabulary tables

| Table and column | CIDOC-CRM path | Reason |
| --- | --- | --- |
| `material` (row) | `mat:{slug} a crm:E57_Material` | E57 is the class for kinds of material. |
| `material.name` | `rdfs:label` | Display name. |
| `material.scientific_name` | `skos:altLabel` | An alternative name for the same concept. CRM has no light-weight property for this; SKOS is the usual companion vocabulary for thesauri. |
| `object_type` (row) | `type:{slug} a crm:E55_Type ; crm:P127_has_broader_term type:object-type` | The broader term groups the object types, so that a condition term cannot be used as an object type (checked in SHACL). |
| `object_type.name` | `rdfs:label` | Display name. |
| `period` (row) | `period:{slug} a crm:E52_Time-Span` | The period is used here only as a date range for the production. See the note below about E4 Period. |
| `period.name` | `rdfs:label` | Display name. |
| `period.start_year` | `crm:P82a_begin_of_the_begin "-2055"^^xsd:gYear` | Earliest possible start of the time-span. |
| `period.end_year` | `crm:P82b_end_of_the_end "-1650"^^xsd:gYear` | Latest possible end of the time-span. |
| `site` (row) | `place:{slug} a crm:E53_Place` | E53 is an extent in space. |
| `site.name` | `rdfs:label` | Display name. |
| `site.parent_id` | `crm:P89_falls_within place:{parent slug}` | The self-referencing foreign key becomes a containment link between places. |
| `collection` (row) | `actor:{slug} a crm:E39_Actor` | A previous owner can be a person, a family or a firm. E39 covers all of them. |
| `collection.name` | `rdfs:label` | Display name. |
| every `slug` | part of the URI | Stable key for the URI. Not repeated as a literal. |
| every `id` | not mapped | Surrogate key. |

## Nodes with no relational column

| Node | Why it exists |
| --- | --- |
| `actor:museum` (`E39 Actor`) | An acquisition needs a receiver. In the table this is implicit: every row belongs to the museum. |
| `unit:cm` (`E58 Measurement Unit`) | The unit is implicit in the column names `height_cm` etc. |
| `type:height`, `type:width`, `type:depth` | Kind of dimension, implicit in the column names. |
| `type:condition-good` etc. | The values allowed by the CHECK constraint on `condition_report.condition`. |
| `type:inventory-number` | Says what kind of identifier `WF-0001` is. |
| `type:object-type`, `type:condition`, `type:dimension` | Broader terms that group the types. |

## Known simplifications

These are deliberate. Each is also listed in [decisions.md](decisions.md).

1. **Find site as P53.** `P53 has former or current location` is true but weaker
   than "was found at". Base CIDOC-CRM has no find event. The precise model is an
   encounter event from the CRMsci extension (`S19 Encounter Event`) or an
   `E7 Activity` typed as "find". P53 was kept to stay inside base CRM and the
   class budget.
2. **Period as E52 Time-Span, not E4 Period.** A cultural period such as the
   Middle Kingdom is properly an `E4 Period` with its own time-span, and the
   production `P10 falls within` it. Here the period is only used as a date
   range, so one class is saved.
3. **Condition state without E14 Condition Assessment.** The assessment (who
   looked, when) is an `E14` that `P35 has identified` the `E3`. Here the
   date is attached directly to the state.
4. **Years as `xsd:gYear`.** `-2055` means 2055 BCE, as in the SQL column. XSD
   1.1 would read `-2055` as 2056 BCE because it has a year zero. With
   approximate period dates the one-year difference does not matter, but it must
   be decided before exchanging data with others.
5. **No inverse triples.** Only one direction is stored (for example
   `P108i was produced by`, object to event). Oxigraph does no inference, so
   queries must use the stored direction.
