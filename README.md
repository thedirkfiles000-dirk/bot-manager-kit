# Bot Manager Desktop

A free, open-source desktop app for building roleplay chatbot profiles for **PolyBuzz**. No accounts, no cloud, no telemetry — your bots stay on your machine.

If you've ever tried to write a bot prompt from scratch in a text box, you know the pain: no structure, no validation, no way to manage variants, no idea why the LLM keeps breaking character. Bot Manager Desktop gives you a structured editor that produces clean, consistent prompts.

<!-- ![Screenshot](docs/screenshot.png) -->

## Download

**[Download the latest Windows installer (.msi)](https://github.com/thedirkfiles000-dirk/bot-manager-desktop/releases/latest)**

No install prerequisites — just download, run, and start building bots.

---

## Features

**Structured bot editor** — Every aspect of a bot profile has its own section: characters, world-building, scenario, RP rules, boundaries, and more. Navigate the tree, fill in what matters, skip what doesn't.

**Characters** — Full profiles with appearance, personality, backstory, relationships, skills, behavior rules, dialog examples, pet names, and progression phases. As many characters per bot as you need, subject to space limitations imposed by PolyBuzz. 

**Variants** — Maintain alternate versions of a bot (different scenarios, tonal shifts, tweaked personalities) without duplicating everything. A variant stores only what differs from the base.

**Progression Phases** — Soft instructions that tell the LLM how the character should evolve over the course of a conversation. Phase shifts, narrative shifts, tone shifts — with configurable windows.

**Copy Station** — One-click export to clipboard, field by field, formatted for PolyBuzz. Supports Markdown, YAML, and JSON output. CAPS_KEYS mode for LLMs that respond better to uppercase labels.

**Mask Sections** — Binary-search tool for isolating content that triggers platform policy violations. Mask a section, re-upload, check if the flag clears. No data is changed — just temporarily hidden from the export.

**Consistency checker** — Flags structural issues before you export: orphaned relationship references, duplicate progression phases, dialog speakers that don't match the cast, and more.

**Lean schema** — Only name, intro, and greeting are required. Everything else is optional. Fill in what matters to your story — empty fields are automatically stripped from the export so they don't dilute the LLM's attention. If you're interested in the full schema structure, you can find it in the src/assets folder. See scheme-example.json at the project root for an example of what a filled out bot looks like.

**Import/Export** — Move bots between machines via JSON. Full schema validation on import.

**Image management** — Upload and manage bot profile images alongside the profile data.

---

## How it works

You build a bot as a structured tree of sections. When you're ready to publish, open the Copy Station, copy each field to your clipboard, and paste it into PolyBuzz's form. The app handles formatting, empty-field stripping, and variant merging — you just paste.

Empty fields are intentionally omitted from exports. An early discovery: exporting empty appearance fields (e.g. `Hair Color:`, `Eye Color:`) caused the LLM to ignore the values that *were* filled in. Removing the empties made the specified values rock solid. The practical rule: fill in a field only if it matters to your story.

---

## Data storage

Bots are stored as local JSON files:

| OS      | Path |
|---------|------|
| Windows | `%LOCALAPPDATA%\com.dirk.bot-manager-desktop\Bot Manager Desktop\bots\` |

Each bot is a folder containing `bot.json` and any associated images. Everything stays on your machine.

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
- [Vite](https://vite.dev/) — build tooling

---

## Contributing

Bug reports and feature requests are welcome — [open an issue](https://github.com/thedirkfiles-000/bot-manager-desktop/issues). If you want to submit a PR, open an issue first to discuss the change.

---

## License

[MIT](LICENSE)
