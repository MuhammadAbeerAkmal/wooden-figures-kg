import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { REPO_ROOT } from '../config.js';
import { CRM_CLASSES, CRM_PROPERTIES } from './namespaces.js';

/**
 * Guards against misspelled or invented CIDOC-CRM terms: every class and
 * property this project uses must be declared in the official RDFS file of
 * CIDOC-CRM 7.1.3 (vendored unchanged in /vocab).
 */
describe('CIDOC-CRM terms', () => {
  const rdfs = fs.readFileSync(path.join(REPO_ROOT, 'vocab/CIDOC_CRM_v7.1.3.rdf'), 'utf8');

  for (const term of CRM_CLASSES) {
    it(`class ${term} exists in CIDOC-CRM 7.1.3`, () => {
      assert.ok(rdfs.includes(`<rdfs:Class rdf:about="${term}">`));
    });
  }

  for (const term of CRM_PROPERTIES) {
    it(`property ${term} exists in CIDOC-CRM 7.1.3`, () => {
      assert.ok(rdfs.includes(`<rdf:Property rdf:about="${term}">`));
    });
  }

  it('the SHACL shapes only use declared CIDOC-CRM terms', () => {
    const shapes = fs.readFileSync(path.join(REPO_ROOT, 'shapes/figure.shacl.ttl'), 'utf8');
    const used = new Set([...shapes.matchAll(/crm:([A-Za-z0-9_-]+)/g)].map((match) => match[1]));
    const declared = new Set<string>([...CRM_CLASSES, ...CRM_PROPERTIES]);
    assert.deepEqual([...used].filter((term) => !declared.has(term)), []);
  });
});
