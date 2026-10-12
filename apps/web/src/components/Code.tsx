import type { ReactNode } from 'react';

/**
 * A very small syntax highlighter for the three languages this app shows.
 * It is a tokenizer built from one regular expression per language, which is
 * enough for display and avoids a highlighting library.
 */

export type Language = 'sql' | 'sparql' | 'turtle';

const SQL_KEYWORDS =
  'WITH RECURSIVE|UNION ALL|INNER JOIN|LEFT JOIN|GROUP BY|ORDER BY|SELECT|FROM|WHERE|AND|OR|ON|AS|COUNT|ASC|DESC|NOT|NULL|IS|IN';
const SPARQL_KEYWORDS =
  'GROUP BY|ORDER BY|PREFIX|SELECT|CONSTRUCT|WHERE|FILTER|OPTIONAL|UNION|BIND|COUNT|DISTINCT|AS|NOT EXISTS';

// Named groups become CSS classes (tok-comment, tok-string, ...). Order matters: first match wins.
const GRAMMARS: Record<Language, RegExp> = {
  sql: new RegExp(
    [
      `(?<string>'(?:[^']|'')*')`,
      `(?<keyword>\\b(?:${SQL_KEYWORDS})\\b)`,
      `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
    ].join('|'),
    'g',
  ),
  sparql: new RegExp(
    [
      `(?<comment>#[^\\n]*)`,
      `(?<iri><[^>\\s]*>)`,
      `(?<string>"(?:[^"\\\\]|\\\\.)*")`,
      `(?<variable>\\?[A-Za-z_][A-Za-z0-9_]*)`,
      `(?<keyword>\\b(?:${SPARQL_KEYWORDS})\\b|(?<=\\s)a(?=\\s))`,
      `(?<name>[A-Za-z][A-Za-z0-9_-]*:[A-Za-z0-9_][A-Za-z0-9_.-]*[A-Za-z0-9_-]|[A-Za-z][A-Za-z0-9_-]*:(?=\\s))`,
    ].join('|'),
    'g',
  ),
  turtle: new RegExp(
    [
      `(?<comment>#[^\\n]*)`,
      `(?<iri><[^>\\s]*>)`,
      `(?<string>"(?:[^"\\\\]|\\\\.)*")`,
      `(?<keyword>@prefix\\b|(?<=\\s)a(?=\\s))`,
      `(?<name>[A-Za-z][A-Za-z0-9_-]*:[A-Za-z0-9_][A-Za-z0-9_.-]*[A-Za-z0-9_-]|[A-Za-z][A-Za-z0-9_-]*:(?=\\s))`,
      `(?<number>(?<=\\s)-?\\d+(?:\\.\\d+)?(?=[\\s;,.]))`,
    ].join('|'),
    'g',
  ),
};

function highlight(code: string, language: Language): ReactNode[] {
  const parts: ReactNode[] = [];
  let position = 0;
  for (const match of code.matchAll(GRAMMARS[language])) {
    const kind = Object.entries(match.groups ?? {}).find(([, value]) => value !== undefined)?.[0];
    if (match.index > position) parts.push(code.slice(position, match.index));
    parts.push(
      <span key={match.index} className={`tok-${kind}`}>
        {match[0]}
      </span>,
    );
    position = match.index + match[0].length;
  }
  parts.push(code.slice(position));
  return parts;
}

interface CodeProps {
  code: string;
  language: Language;
  /** Accessible name of the code block, e.g. "SQL query". */
  label: string;
}

export function Code({ code, language, label }: CodeProps) {
  // tabIndex makes the scrollable block reachable and scrollable with the keyboard.
  return (
    <pre className="code" tabIndex={0} role="region" aria-label={label} data-language={language}>
      <code>{highlight(code, language)}</code>
    </pre>
  );
}
