import { config } from '../config.js';
import { createContext } from './context.js';

/** Converts the relational data to CIDOC-CRM and loads it into Oxigraph, replacing what was there. */
const { dataSource, rdf, sparql } = await createContext();
const sent = await rdf.loadIntoTriplestore();
const check = await sparql.select('SELECT (COUNT(*) AS ?triples) WHERE { ?s ?p ?o }');
const stored = check.results.bindings[0]?.triples?.value;
console.log(`Sent ${sent} triples to ${config.sparqlEndpoint}; the store now holds ${stored}`);
await dataSource.destroy();
