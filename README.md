# MarkEdit Paste Markdown

A [MarkEdit](https://github.com/MarkEdit-app/MarkEdit) extension that converts rich text on the clipboard into Markdown when you paste, similar to Obsidian.

MarkEdit normally pastes only the `text/plain` flavor, so lists, inline code, links and headings copied from browsers, chat apps (Cursor, VS Code Copilot Chat, ...) or docs are lost. This extension reads the `text/html` flavor instead and converts it with [Turndown](https://github.com/mixmark-io/turndown) + GFM (tables, strikethrough, task lists).

## Behavior

- Converts only HTML with real structure (lists, paragraphs, headings, code, links, emphasis, tables, ...).
- Falls back to normal plain-text paste when:
  - the clipboard has no HTML, or the HTML is only styled `<span>`/`<div>` (e.g. code copied from an editor);
  - the cursor is inside a code block or inline code;
  - the clipboard contains files/images;
  - the converted Markdown is identical to the plain text.
- Escaping is intentionally light: identifiers like `MY_CONST` are kept as-is instead of `MY\_CONST`.
- Paste is a single undo step.

## Install

1. Download `markedit-paste-markdown.js` from the [latest release](https://github.com/lbwork5388/markedit-paste-markdown/releases/latest).
2. Move it into `~/Library/Containers/app.cyan.markedit/Data/Documents/scripts/`.
3. Restart MarkEdit.

To uninstall, delete the file and restart MarkEdit.

## Build from source

```sh
npm install
npm run build      # typecheck, build, and copy to MarkEdit's scripts folder
npm run reload     # restart MarkEdit to load the extension
```

`npm run build:dist` builds into `dist/` without installing. `npm run uninstall` removes the installed script.

## Development

```sh
npm test
npm run typecheck
```

## Releasing

Bump `version` in `package.json`, push, then publish a GitHub release tagged `v<version>` (e.g. `v0.1.0`). The [Release workflow](.github/workflows/release.yml) runs the tests, builds the script, and attaches `markedit-paste-markdown.js` to the release.
