import { config } from '../config.js';
import { createContext } from './context.js';

/**
 * Validates the CIDOC-CRM export against shapes/figure.shacl.ttl.
 * Exits with code 1 when the data does not conform, so it can gate a build.
 */
const { dataSource, rdf } = await createContext();
const report = await rdf.validateDataset();
await dataSource.destroy();

if (report.conforms) {
  console.log(`Conforms: the export satisfies every shape in ${config.shapesPath}`);
} else {
  console.error(`Does not conform: ${report.results.length} violation(s)`);
  for (const result of report.results) {
    console.error(`- ${result.focusNode}\n    path: ${result.path}\n    ${result.constraint}: ${result.message}`);
  }
  process.exitCode = 1;
}
