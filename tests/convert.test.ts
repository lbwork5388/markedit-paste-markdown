import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

import { escapeMarkdown, htmlToMarkdown } from '../src/convert';

const fixture = (name: string) => readFileSync(resolve(process.cwd(), 'tests/fixtures', name), 'utf8');

describe('htmlToMarkdown', () => {
  test('converts a list copied from Cursor chat', () => {
    expect(htmlToMarkdown(fixture('cursor-list.html'))).toBe([
      '- Updated the parser so empty lines are kept. Behavior is otherwise unchanged. In total: 12 files changed, 3 tests added.',
      '- Ran the build with `npm_install`. The entry point is `src/utils/index.ts`.',
      '- Validation: all checks pass, so the output now matches the snapshot.',
      '- Removed an unused helper in my_module from code (`a1b2c3d`). It was never called.',
      '- Opened branch `feature/paste_markdown` (`d4e5f60`). It fixes the issue on main_branch. Pending review.',
    ].join('\n'));
  });

  test('ignores HTML without structure, like code copied from an editor', () => {
    const html = '<meta charset="utf-8"><div style="font-family: Menlo"><div><span style="color: red">const</span> a = 1;</div></div>';
    expect(htmlToMarkdown(html)).toBeUndefined();
    expect(htmlToMarkdown('   ')).toBeUndefined();
  });

  test('converts headings, emphasis, links and nested lists', () => {
    const html = '<h2>Title</h2><p>Some <strong>bold</strong> and <em>italic</em> with <a href="https://example.com">a link</a>.</p>'
      + '<ol start="3"><li>three<ul><li>nested</li></ul></li><li>four</li></ol>';
    expect(htmlToMarkdown(html)).toBe([
      '## Title',
      '',
      'Some **bold** and *italic* with [a link](https://example.com).',
      '',
      '3. three',
      '   - nested',
      '4. four',
    ].join('\n'));
  });

  test('converts code blocks with language and safe fences', () => {
    const html = '<pre><code class="language-ts">const a = `x`;\nconst b = "```";\n</code></pre>';
    expect(htmlToMarkdown(html)).toBe('````ts\nconst a = `x`;\nconst b = "```";\n````');
  });

  test('converts GFM tables and strikethrough', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td><del>2</del></td></tr></tbody></table>';
    expect(htmlToMarkdown(html)).toBe([
      '| A   | B   |',
      '| --- | --- |',
      '| 1   | ~~2~~ |',
    ].join('\n'));
  });

  test('does not bold Google Docs wrappers', () => {
    const html = '<b style="font-weight:normal;" id="docs-internal-guid-1"><p><span>Hello</span></p></b>';
    expect(htmlToMarkdown(html)).toBe('Hello');
  });
});

describe('escapeMarkdown', () => {
  test('keeps intraword underscores readable', () => {
    expect(escapeMarkdown('MY_CONST-NAME_V2')).toBe('MY_CONST-NAME_V2');
    expect(escapeMarkdown('_emphasis_')).toBe('\\_emphasis\\_');
  });

  test('escapes syntax that would change meaning', () => {
    expect(escapeMarkdown('# not a heading')).toBe('\\# not a heading');
    expect(escapeMarkdown('- not a list')).toBe('\\- not a list');
    expect(escapeMarkdown('1. not a list')).toBe('1\\. not a list');
    expect(escapeMarkdown('a *b* [c] `d` <div>')).toBe('a \\*b\\* \\[c\\] \\`d\\` \\<div>');
    expect(escapeMarkdown('192.168.0.0/16, v1.2-beta')).toBe('192.168.0.0/16, v1.2-beta');
  });
});
