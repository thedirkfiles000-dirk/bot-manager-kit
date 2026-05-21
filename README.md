# Bot Manager Kit

A free, open-source desktop app for designing your own roleplay chatbot profile structure and authoring bots against it. You write a JSON Schema describing the fields your bots have; the app builds the editor and Copy Station from it. No accounts, no cloud, no telemetry — your schemas and bots stay on your machine.

If you've used **Bot Manager Desktop**, the Kit is its schema-driven cousin: same idea, but you're in charge of the bot's shape. Have a different mental model for werewolf bots than for Mafia bots? Make a schema for each. The app keeps their libraries and exports separate.

<!-- ![Screenshot](docs/screenshot.png) -->

## Download

**[Download the latest Windows installer (.msi)](https://github.com/thedirkfiles000-dirk/bot-manager-kit/releases/latest)**

No install prerequisites — just download, run, pick the bundled Starter schema (or write your own), and start building.

---

## How it differs from Bot Manager Desktop

| | **Bot Manager Desktop** | **Bot Manager Kit** |
|--|--|--|
| Schema | Fixed — designed for PolyBuzz | Yours — any JSON Schema |
| Editor tree | Hardcoded sections | Generated from your schema |
| Copy Station | PolyBuzz-shaped | 4 buckets (Intro, Greeting, Background, Dialog Examples) populated from schema annotations |
| Best for | Authoring PolyBuzz bots without thinking about structure | Authoring bots for any platform, or running multiple bot types side-by-side |

Both apps store everything locally and have no network calls.

---

## Features

**Schema picker** — Each schema is a folder under `BotSchemas/`. The picker lists them on launch; you choose one per session. Create, duplicate, rename, delete, or reveal a schema's folder in the OS file manager, all from the picker page.

**Schema-driven editor** — The editor tree builds itself from your schema's `properties`. A field's `x-ui-panel` annotation picks the form widget (text, textarea, number, string-list, dialog-examples); `x-ui-section` groups related fields; `x-ui-order` sets the order. Add a field to `schema.json` and it appears in the editor on next launch — no code change needed.

**Copy Station** — Four output cards (Intro, Greeting, Background, Dialog Examples) corresponding to the fields most chat-bot platforms ask for on their bot-creation forms. Each field's `x-export-target` annotation assigns it to a bucket; the app renders markdown shaped by the field's panel type. Per-field mask toggles let you hide individual fields from the export.

**Lifecycle GUI** — No need to touch the AppData folder. New, duplicate, rename, delete, and reveal-in-file-manager are all on the picker.

**Schema validation** — AJV validates each bot on save against the active schema. Typos in property names are caught (`additionalProperties: false`); required fields are enforced. Malformed schemas show a warning in the picker rather than crashing the app.

**Image management** — Upload and manage bot profile images. The bot's `profileImage` field is used for the Library card thumbnail.

**Raw JSON view** — Inspect the underlying bot file. Paste a full replacement to fix something the editor doesn't expose; the replacement is schema-validated before save.

**Bundled Starter schema** — Heavily commented example schema, demonstrating every kit annotation. Copy it as your starting point or read the comments to learn the conventions.

---

## Designing your schema

The bundled Starter schema's `$comment` blocks document every kit-recognized keyword. The full set:

| Keyword | What it does |
|---|---|
| `x-ui-panel` | Form widget: `text`, `textarea`, `number`, `stringList`, `dialogExamples`, `hidden` |
| `x-ui-section` | Folder name in the editor tree |
| `x-ui-order` | Sort order within a section |
| `x-ui-label` | Override the field's displayed title |
| `x-ui-helper` | Helper text shown under the field |
| `x-export-target` | One of `Intro`, `Greeting`, `Background`, `Dialog Examples` |
| `x-export-order` | Sort order within the export bucket |
| `x-export-label` | Override the field's exported label |

Standard JSON Schema keywords (`required`, `default`, `enum`, `minimum`, `maxLength`, `items`, `$ref`, etc.) work alongside these.

### Asking an AI to write or extend your schema

The kit's annotations are simple enough that any modern LLM (Claude, GPT, Gemini) handles them well:

- **To extend a schema:** paste your `schema.json` and describe the change. *"Add a BIRTHPLACE field under AGE. Text field. Show me the updated schema."*
- **To adopt an existing template:** hand the AI the bundled Starter schema as a conventions reference plus one or two examples of bots you already write by hand. Ask for a schema in the same style. *"Use `x-ui-section` to group related fields, and map exported fields onto the four output buckets."*

Paste the result back into the schema's folder and reload. The kit validates on load, so a malformed schema shows a warning rather than crashing — safe to iterate.

---

## Data storage

Each schema lives in its own folder, alongside the bots that conform to it:

| OS | Path |
|---|---|
| Windows | `%LOCALAPPDATA%\com.dirk.bot-manager-kit\BotSchemas\<schema-name>\` |

Inside a schema folder:

```
BotSchemas/
  Starter/
    schema.json
    bots/
      <uuid>/
        bot.json
        images/
          profile.jpg
          ...
```

Schemas and bots are plain JSON — version-control them, sync them between machines via Dropbox/Drive/etc., share them by zipping the folder.

---

## Building from source

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- Tauri prerequisites — see [Tauri v2 Prerequisites](https://tauri.app/start/prerequisites/)

### Development

```bash
pnpm install
pnpm tauri dev
```

### Production build

```bash
pnpm tauri build
```

The MSI installer is output to `src-tauri/target/release/bundle/msi/`.

---

## Built with

- [Tauri 2](https://tauri.app/) — Rust-backed desktop runtime
- [Vue 3](https://vuejs.org/) + [Vuetify](https://vuetifyjs.com/) — UI framework
- [Pinia](https://pinia.vuejs.org/) — state management
- [AJV](https://ajv.js.org/) — JSON Schema validation
- [Vite](https://vite.dev/) — build tooling

---

## Contributing

Bug reports and feature requests are welcome — [open an issue](https://github.com/thedirkfiles000-dirk/bot-manager-kit/issues). If you want to submit a PR, open an issue first to discuss the change.

---

## License

[MIT](LICENSE)
