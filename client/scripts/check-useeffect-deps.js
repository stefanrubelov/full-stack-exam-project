/**
 * Checks that every useEffect call in src/ has a dependency array (2nd argument).
 * Exits with code 1 and prints violations if any are found.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else if (['.ts', '.tsx'].includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Walks the call arguments of a useEffect( starting at the opening paren.
 * Returns true if a second top-level argument (the dep array) is present.
 */
function hasDepArray(content, openParenIndex) {
  let depth = 0;
  let topLevelCommas = 0;

  for (let i = openParenIndex; i < content.length; i++) {
    const ch = content[i];

    // Skip strings to avoid false commas inside them
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\') i++; // skip escaped char
        i++;
      }
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) break; // end of useEffect(...)
    } else if (ch === ',' && depth === 1) {
      topLevelCommas++;
      if (topLevelCommas >= 1) return true; // found the deps argument separator
    }
  }

  return false;
}

function findViolations(content, filePath) {
  const violations = [];
  const hook = 'useEffect(';
  let pos = 0;

  while (true) {
    const idx = content.indexOf(hook, pos);
    if (idx === -1) break;

    const openParen = idx + hook.length - 1; // index of '('
    const line = content.substring(0, idx).split('\n').length;

    if (!hasDepArray(content, openParen)) {
      violations.push(`  ${filePath}:${line}`);
    }

    pos = idx + hook.length;
  }

  return violations;
}

const srcDir = new URL('../src', import.meta.url).pathname;
const files = collectFiles(srcDir);
const allViolations = [];

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  allViolations.push(...findViolations(content, file));
}

if (allViolations.length > 0) {
  console.error('ERROR: useEffect hooks missing dependency array:\n');
  allViolations.forEach(v => console.error(v));
  console.error(`\n${allViolations.length} violation(s) found.`);
  process.exit(1);
} else {
  console.log(`OK: All useEffect hooks in ${files.length} file(s) have a dependency array.`);
}
