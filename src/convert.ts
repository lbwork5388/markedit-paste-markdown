import TurndownService from 'turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';

// Only convert HTML that carries real structure; styled spans/divs (e.g. code copied
// from VS Code / Cursor editors) are better served by the plain-text flavor.
const structuralSelector = [
  'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'pre', 'code', 'blockquote', 'a[href]', 'strong', 'b', 'em', 'i',
  'del', 's', 'table', 'img', 'hr',
].join(',');

let service: TurndownService | undefined;

export function htmlToMarkdown(html: string): string | undefined {
  if (html.trim().length === 0) {
    return undefined;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (doc.body.querySelector(structuralSelector) === null) {
    return undefined;
  }

  const markdown = getService()
    .turndown(doc.body)
    .replace(/\u00a0/g, ' ')
    .trim();

  return markdown.length > 0 ? markdown : undefined;
}

function getService(): TurndownService {
  if (service !== undefined) {
    return service;
  }

  service = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });

  service.escape = escapeMarkdown;
  service.remove(['meta', 'style', 'script', 'title', 'head']);

  // GitHub-flavored tables, strikethrough and task lists
  service.use(gfm);

  service.addRule('listItem', {
    filter: 'li',
    replacement(content, node) {
      const parent = node.parentNode as HTMLElement | null;
      let prefix = '- ';
      if (parent?.nodeName === 'OL') {
        const start = Number.parseInt(parent.getAttribute('start') ?? '1', 10);
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = `${(Number.isNaN(start) ? 1 : start) + index}. `;
      }

      const isParagraph = /\n$/.test(content);
      const body = content.replace(/^\n+/, '').replace(/\n+$/, '') + (isParagraph ? '\n' : '');
      const indented = body.replace(/\n(?!\n|$)/g, '\n' + ' '.repeat(prefix.length));
      return prefix + indented + (node.nextSibling ? '\n' : '');
    },
  });

  service.addRule('codeBlock', {
    filter: 'pre',
    replacement(_content, node) {
      const pre = node as HTMLElement;
      const code = (pre.textContent ?? '').replace(/\n$/, '');
      const language = detectLanguage(pre);
      const longestRun = Math.max(2, ...(code.match(/`+/g) ?? []).map(run => run.length));
      const fence = '`'.repeat(longestRun + 1);
      return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
    },
  });

  // Google Docs wraps the whole selection in <b style="font-weight:normal">
  service.addRule('nonBoldB', {
    filter: node => node.nodeName === 'B' && /font-weight:\s*(normal|[1-4]00)\b/i.test(node.getAttribute('style') ?? ''),
    replacement: content => content,
  });

  return service;
}

function detectLanguage(pre: HTMLElement): string {
  const candidates = [pre, pre.querySelector('code'), pre.parentElement];
  for (const element of candidates) {
    const className = element?.getAttribute('class') ?? '';
    const match = /(?:^|\s)(?:language|lang|highlight-source)-([\w+#-]+)/.exec(className);
    if (match !== null) {
      return match[1];
    }

    const dataLanguage = element?.getAttribute('data-language') ?? element?.getAttribute('data-lang');
    if (dataLanguage) {
      return dataLanguage;
    }
  }

  return '';
}

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{N}]/u.test(char);
}

// Lighter than Turndown's default escaping: identifiers like MY_CONST stay readable
// while text that would otherwise turn into Markdown syntax is still escaped.
export function escapeMarkdown(text: string): string {
  return text
    .replace(/\\(?=[!-/:-@[-`{-~])/g, '\\\\')
    .replace(/[*`[\]]/g, '\\$&')
    .replace(/_/g, (match, offset: number, source: string) => {
      return isWordChar(source[offset - 1]) && isWordChar(source[offset + 1]) ? match : '\\_';
    })
    .replace(/~~/g, '\\~\\~')
    .replace(/<(?=[A-Za-z/!?])/g, '\\<')
    .replace(/^(\s*)(#{1,6})(?=\s|$)/gm, '$1\\$2')
    .replace(/^(\s*)>/gm, '$1\\>')
    .replace(/^(\s*)([-+])(?=\s|-)/gm, '$1\\$2')
    .replace(/^(\s*)(=+)(?=\s*$)/gm, '$1\\$2')
    .replace(/^(\s*\d+)([.)])(?=\s)/gm, '$1\\$2');
}
