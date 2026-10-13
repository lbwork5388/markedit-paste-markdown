import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { MarkEdit } from 'markedit-api';

import { htmlToMarkdown } from './src/convert';

const codeNodeNames = new Set(['FencedCode', 'CodeBlock', 'CodeText', 'InlineCode', 'HTMLBlock', 'CommentBlock']);

if (window.__markeditPasteMarkdownInitialized__) {
  console.error('MarkEdit Paste Markdown has already been initialized.');
} else {
  window.__markeditPasteMarkdownInitialized__ = true;

  MarkEdit.addExtension(EditorView.domEventHandlers({
    paste(event, view) {
      const data = event.clipboardData;
      if (data === null || !data.types.includes('text/html')) {
        return false;
      }

      // Leave files/images to MarkEdit, and keep raw text inside code
      if (data.files.length > 0 || isInCode(view)) {
        return false;
      }

      const markdown = htmlToMarkdown(data.getData('text/html'));
      if (markdown === undefined || markdown === data.getData('text/plain').trim()) {
        return false;
      }

      event.preventDefault();
      view.dispatch({
        ...view.state.replaceSelection(markdown),
        scrollIntoView: true,
        userEvent: 'input.paste',
      });

      return true;
    },
  }));
}

function isInCode(view: EditorView): boolean {
  const pos = view.state.selection.main.head;
  for (let node: ReturnType<typeof syntaxTree>['topNode'] | null = syntaxTree(view.state).resolveInner(pos, -1); node !== null; node = node.parent) {
    if (codeNodeNames.has(node.name)) {
      return true;
    }
  }

  return false;
}
