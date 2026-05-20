# What Is This Tool?

Bot Manager Kit is a JSON-Schema-driven editor for character profiles you'll
paste into a chat-bot platform. The shape of a bot is whatever the active
schema says it is — the editor tree, the form panels, and the Copy Station
outputs all read directly off that schema. The kit ships with a small
**Starter** schema you can use as-is or customize.

---

# The Stages

## 1. Pick (or create) a schema

The picker is the app's home page. Each card is one schema, listed from
`appLocalDataDir/BotSchemas/<name>/`. Click **Open** to enter a schema —
its bots and Library page load. The active schema parameterizes everything
that follows.

The page is also where you manage schemas:

- **New Schema** (top-right) — Creates a new folder under `BotSchemas/`
  with a minimal annotated template. You can edit `schema.json` from there.
- **Per-card menu** (three dots) — *Duplicate* copies the schema only (not
  the bots inside). *Rename* renames the folder. *Reveal in file manager*
  opens the schema's folder in your OS file explorer. *Delete* removes the
  folder and all its bots after a confirmation that quotes the bot count.

> If you ever empty out `BotSchemas/` entirely, the kit re-seeds the bundled
> Starter schema on next launch.

---

## 2. The Library

After picking a schema you land on its Library — a grid of bot cards. New
bot, duplicate, delete, raw-JSON view, and Copy Station are reachable from
each card. **Switch Schema** in the header returns you to the picker.

---

## 3. Edit a bot

The editor is a tree on the left, a single form panel on the right. The
tree is built from the active schema's `properties`:

- A field's `x-ui-section` puts it under a folder of that name.
- A field's `x-ui-panel` (text, textarea, number, stringList,
  dialogExamples) picks the form widget.
- A field's `x-ui-order` controls position within its section.
- A property with `x-ui-panel: "hidden"` (or no `x-ui-panel`) is skipped.

Save (File menu, or auto-save on Export) writes the bot to
`BotSchemas/<schema>/bots/<botId>/bot.json`. The active schema's validator
runs first; invalid bots aren't written. Reload discards in-memory changes
and re-reads from disk.

The **Images** toggle at the top right switches the editor to an image
manager — uploads, deletions, and the profile image used for the Library
card thumbnail. Images live alongside the bot in
`BotSchemas/<schema>/bots/<botId>/images/`.

---

## 4. Copy Station

The Copy Station is the export step. It shows four output cards — **Intro**,
**Greeting**, **Background**, **Dialog Examples** — corresponding to the
fields most chat-bot platforms expect on their bot-creation forms. Each
card collects fields the schema has tagged with the matching
`x-export-target`, sorts them by `x-export-order`, and renders markdown:

- *text* / *number* fields → `**Label:** value`
- *textarea* fields → labeled section
- *stringList* fields → bullet list
- *dialogExamples* fields → numbered `## Example N` blocks

Click any field's chip to toggle masking — masked fields are hidden from
that card's output. The markdown preview updates live. **Copy** puts the
card's markdown on the clipboard.

Mask state is session-scoped; it resets when you navigate away.

---

## 5. Raw JSON view

Reachable from each Library card. Read-only view of the bot's JSON file
with an option to paste in a full replacement (validated against the
active schema before save). Useful for inspecting structure, copying a
bot to share, or fixing something the editor doesn't expose.

---

# Customizing a Schema

Each schema's `schema.json` is heavily commented. To make your own schema:
**reveal an existing schema in the file manager, open `schema.json` in your
editor, and read the `$comment` blocks** — they explain what every kit
keyword does and how to extend the schema. The kit's editor and Copy
Station pick up schema changes automatically on next launch; no kit code
change is needed.

The kit-recognized custom keywords are:

| Keyword            | What it does                                              |
|--------------------|-----------------------------------------------------------|
| `x-ui-panel`       | Which form widget to render (or `hidden` to skip)         |
| `x-ui-section`     | Folder name in the editor tree                            |
| `x-ui-order`       | Sort order within a section                               |
| `x-ui-label`       | Override the field's displayed title                      |
| `x-ui-helper`      | Optional helper text shown under the field                |
| `x-export-target`  | One of Intro, Greeting, Background, Dialog Examples       |
| `x-export-order`   | Sort order within the export bucket                       |
| `x-export-label`   | Override the field's exported label                       |

Standard JSON Schema (`required`, `default`, `enum`, `minimum`, `maxLength`,
`items`, `$ref`, etc.) works alongside these. The kit validates each bot
against the schema on save, so `additionalProperties: false` will catch
typos.

---

# Tips

- **One field, one purpose.** The schema controls layout, but the LLM still
  reads it as a prompt. Fields that overlap (two ways to say the same thing)
  dilute the signal.
- **Leave empty fields empty.** The Copy Station skips fields whose values
  are blank. Forcing placeholder text — *"Hair: (unspecified)"* — actively
  confuses LLMs; they treat the presence of a label as evidence the concept
  matters.
- **Dialog Examples carry the most weight for voice.** Two or three short
  examples beat a wall of prose every time.
