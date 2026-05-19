# What Is This Tool?

Bot Manager is a desktop app for authoring roleplay chatbot profiles. You build a structured description of your bot — its world, its characters, their personalities and behaviors — then export it as a formatted prompt you paste into **PolyBuzz**.

The goal is to give the LLM a clear, unambiguous brief so it plays its role consistently without drifting, forgetting context, or misreading your intent.

---

# Bot Structure

Every bot is a tree of sections. You navigate them in the left-hand panel when editing.

**Bot Info**

Top-level identity: name, intro (used as the search-listing description on the platform), greeting message, global RP rules, and usage hints (internal notes — never exported).

**Background**

The world the story takes place in. Divided into:

- **Setting** — Physical and atmospheric world details. **Location** is the primary field: put the full where-and-when picture there (e.g. "Small snowy town in Vermont, present day"). **Era**, **City/Region**, and **Specific Location** are optional refinements — use them only when you need finer-grained control over those aspects as separate values. Don't fill all four if Location already covers the ground.
- **Scenario** — The premise, ongoing dynamic, and the user's starting relationship to the scene.
- **Anchors & Triggers** — Persistent facts the LLM must never contradict, plus conditionals that fire on specific inputs.
- **Cohort** — Supporting cast who appear in the world but aren't main characters. Each entry has four fields:
  - **Name** (required) — how the character is referred to.
  - **Role** — their function: "bartender", "rival", "mentor". A name + role is the minimum useful entry — the LLM can construct a plausible portrayal from that alone.
  - **Signature Trait** — one vivid physical or behavioral detail: "always cleaning a glass", "never makes eye contact". Optional but effective — a single concrete anchor helps the LLM portray a minor character consistently.
  - **Notes** — contextual details the LLM needs: backstory, how they relate to the story, any behavioral quirks. More is better, but not required if role and signature carry enough.

  A cohort member with only a name and no other fields will trigger a consistency warning. If a cohort member's relationship to the protagonist becomes complex enough to need its own emotional texture, consider promoting them to a full character.
- **Lorebook** — World-building glossary. Keyword + content pairs the LLM can reference.
- **Boundaries & Meta** — Allowed/disallowed content, fourth-wall rules, continuity handling.

**Characters**

One or more main characters the LLM gives voice to. Each has its own sub-tree (see below).

---

# Variants

A variant is an alternate version of a bot that differs from the base in any way you choose — a different character name, a different greeting, a tweaked personality detail, or an entirely different scenario. The change can be as small or as sweeping as you need.

The **base** holds the default values. A variant stores only the fields that differ from it. When you export, the app merges the active variant's values on top of the base. Fields carrying a variant value are marked with a badge in the editor.

Editing a field while a variant is active writes only to that variant's layer — the base is untouched. Fields that aren't overridden simply inherit the base value.

> **Variants cannot change the cast.** Adding, removing, or replacing characters is a base-level operation — the character roster is shared across all variants. If you need a fundamentally different set of characters, that's a new bot.

---

# Character Sections

**Basic Info** — Name, full name, nickname, archetype (e.g. "The Reluctant Guardian"), age, gender, orientation, role, and overview — a short paragraph the LLM uses as its primary reference for who this person is.

**Appearance** — Physical description: height, build, hair, eyes, notable features, style. Concrete and brief — the LLM uses this to describe the character when the story calls for it.

**Personality** — Traits, motivations, fears, values. Arrays of concise descriptors work best here.

**Backstory** — A prose summary of the character's history. Third person. Kept to what the LLM needs to stay consistent — not a novel.

**Relationships** — Named relationships to other characters or the user. Each entry has a name, role, and notes. Exported as key-value pairs so the LLM can reference them without ambiguity.

This is distinct from the Cohort. Cohort describes who exists in the world; Relationships describe how *this character* feels about someone — the emotional texture, history, and dynamic from their perspective. The LLM can often infer a simple relationship from context, but explicit entries pay off when the relationship is complex or asymmetric.

Asymmetry is the key use case: Alice is quietly devoted to Bob, who treats her as a useful acquaintance. That gap between what Alice feels and what Bob returns is exactly the kind of thing the LLM will flatten into mutual warmth if you don't specify it. Put it in Relationships and it holds.

If a cohort member has a relationship complex enough to need this treatment, that's a signal they should be promoted to a full character. The cohort is for background presence; a character with a rich, specific dynamic with the protagonist deserves their own section.

**Skills & Abilities** — Expertise, hobbies, strengths, limitations. Prevents the LLM from having the character do things outside their established competence.

**Story Hooks** — Current conflict and goals. Gives the LLM narrative direction — what the character is actively working toward or struggling with.

**Drive & Viewpoint** — **Core Drive**: the deep internal motivation shaping all decisions. **User Viewpoint**: how this character perceives the in-world "you." These two fields have outsized impact on how the LLM voices the character moment-to-moment.

**Character RP Rules** — Free-form roleplay instructions specific to this character: things it always or never does, how it handles escalation, narrative voice preferences.

**Behavior Rules** — Structured behavioral constraints: speech style, dialect or accent, pacing preference, content boundaries, and thematic focus. The guardrails that keep the character in-lane across a long conversation. **Romantic Availability** is optional — fill it for characters where romantic or sexual engagement is part of their arc; leave it blank for NPCs or non-romantic roles.

**Pet Names** — Terms of address this character uses for the user. Each entry has the term and an optional condition (e.g. "When angry", "Always", "Only in private").

**Dialog Examples** — Up to four example exchanges. These carry the most weight for voice consistency — the LLM learns the character's diction, rhythm, and tone directly from how you write them. Write at least two that show the character under different emotional conditions.

---

# Progression Phases

Progression phases are instructions that tell the LLM to evolve something — the character's attitude, the story's tone, or the scene conditions — as the conversation deepens. They are **soft targets**, not a hard state machine.

> The LLM doesn't count messages like a program. It re-evaluates the entire prompt context every turn. These entries give it a *target window* and a description of what should shift — the LLM uses narrative judgment to find the right moment.

**Each phase has:**

- **Shift Type** — What kind of change this is: Phase Shift (broad behavioral change), Narrative Shift (plot or scene evolution), Tone Shift (emotional register adjustment).
- **From Message** — When the LLM should start looking for a natural opportunity to initiate the shift. Not a hard trigger — a target.
- **Abandon After (optional)** — If the shift hasn't happened organically by this point, stop pushing for it. Omit for an open-ended window.

**Persistence:** Once a shift lands it **persists**. The abandon point does not end or undo the shift — it only marks when to stop trying to initiate it. The character stays in the new state until another phase or trigger overrides it.

**Example sequence — a guarded werewolf enforcer:**

| Shift | Window | Description |
|-------|--------|-------------|
| Phase | 0–15 | Kaelen is cold and professional. Minimal words. Physical distance. Eyes that assess rather than connect. |
| Tone | 15–30 | Warmth begins to leak through — a held gaze that lasts a beat too long, a softened edge to his voice when alone with you. |
| Narrative | 30–50 | The pack politics shift. Kaelen begins positioning himself between you and threats without acknowledging it. |
| Phase | 50+ | Protective instinct has taken hold. He no longer pretends the distance. Acts on it — guardedly, with no vocabulary for what it means. |

Each entry is self-contained. The LLM doesn't need to infer where one phase ends — you've told it what to do and approximately when. Overlapping windows are intentional and can create layered effects.

---

# Copy Station (Export)

The Copy Station is a dedicated export page, separate from the editor. Navigate to it via the export button on a bot card (home page) or in the editor app bar. The editor auto-saves before navigating.

The page is a single scrollable view. Shared settings at the top, then a section for the PolyBuzz Regular Template. The section has its own variant selector, masking controls, consistency check, and a list of copy buttons — one per field PolyBuzz expects. Click **Copy** to put that field's content on your clipboard, then paste it into the platform's form.

**PolyBuzz — Regular Template** — Up to five fields: Bot Name, Intro (search-listing description), Greeting, Background, and Dialog Examples. Background and Dialog Examples only appear when the bot has content for them. Headings use H1/H2/H3. Background and dialog are exported as separate fields to match PolyBuzz's form layout.

**Variant selection** — The section has its own variant dropdown. You can export a specific variant without changing your editor state.

**Empty fields are omitted** — Any field with no value is silently dropped from the export. This is intentional. A prompt full of empty keys — `Hair Color:`, `Eye Color:`, `Build:` — does real damage: the LLM treats the presence of a key as a signal that the concept matters, and when the value is missing it fills the gap itself, often contradicting what you did specify elsewhere.

This was discovered empirically. An early version of the app exported all appearance fields regardless of whether they were filled in. A character was given green hair and nothing else in the appearance section. The LLM consistently ignored the green hair and generated a brunette or blonde. Once the empty fields were removed from the export — leaving only `Hair: green` — the green hair became rock solid across conversations. The empty fields were diluting the signal.

The practical rule: **fill in a field only if it matters to your story.** A focused prompt with ten fields the LLM can act on will outperform a comprehensive one where half the values are generic filler. More fields is not better — more *relevant* fields is better. If a detail wouldn't affect how the character behaves or how the scene plays out, leave it blank and let the LLM fill the gap on its own terms.

**Output formats:**

- **Markdown** — Formatted document. This is what you paste into most platforms.
- **YAML** — Structured, human-readable. Good for debugging.
- **JSON** — Strict structure. Useful if the platform accepts JSON.

**CAPS_KEYS mode** *(Markdown only)* — Renders structural field labels as `UPPER_SNAKE_CASE` (e.g. `CORE_DRIVE`, `PHASE_SHIFT`). Section headings and data values are unaffected — only the label keys in bullet lists change. Some LLMs respond better to this convention.

---

# Consistency Check

Consistency checks appear in two places: the editor's navigation drawer (below the tree, pinned at the bottom) and inside each target section on the Copy Station.

In the editor, the check runs against the base bot and updates live as you edit. On the Copy Station, each target section runs its own check against that target's selected variant — so switching variants may change the results.

Checks cover things the schema can't catch: internal cross-references, structural problems, and patterns that are technically valid but likely to cause LLM confusion. For example, if a character's Relationships list mentions "Theo" but Theo doesn't appear anywhere in the character roster or supporting cast, the check will flag it with a suggestion to add him as a cohort member — so the LLM actually knows who that name refers to.

**Errors** flag things that are definitely broken (e.g. a progression phase where the abandon point is set earlier than the start). **Warnings** flag likely problems. **Suggestions** are informational — often worth acting on, but sometimes intentional. Export is never blocked regardless of what the check finds.

---

# Mask Sections — Violation Isolation

The Masker is the original reason this tool was built.

PolyBuzz runs an AI filter that evaluates bot background content for policy violations. When a bot is flagged, it becomes inaccessible — but the platform never tells you *what* triggered the flag. No line number, no quoted text, no explanation. Just a violation status. The Discord community has a running game called **"Guess the Violation"** for exactly this reason.

The standard approach — manually editing prose and re-uploading until the violation clears — is slow and imprecise. The Masker turns it into a structured binary search.

**How it works:** On the Copy Station, each target section has a collapsible *Mask Sections* tree showing the export's sections and subsections — mirroring the structure the platform will receive, not the internal schema. Checking a section removes it from the exported output entirely. **No data is changed.** Uncheck and it comes back. Mask state is saved per target so you don't lose your place between sessions.

**The isolation strategy:**

1. Start with a top-level section masked — e.g. mask the entire Characters block. Re-export, re-upload, check if the violation clears.
2. If the violation clears, the problem is somewhere inside that section. Unmask it, then mask its subsections one at a time to narrow down which one.
3. If the violation doesn't clear, the problem is in a different top-level section. Unmask and try the next one.
4. Keep drilling down until you've isolated the smallest section that triggers the flag. Read it carefully — the offending phrase is rarely obvious.

> The filter is an AI, not a keyword list. It can flag metaphor, implication, or contextual combination of phrases that seem innocent in isolation. When in doubt, try rephrasing rather than deleting — sometimes the content is fine but the phrasing pattern isn't.

---

# Home Page

The home page shows all your bots as cards. Each card displays the bot's name, CID, variant count, character count, last-modified date, and a truncated UUID. Click anywhere on a valid card to open it in the editor.

**Card actions:**

- **Export (Copy Station)** — Opens the Copy Station for this bot. Disabled for invalid bots.
- **Raw JSON** — Opens a read-only view of the bot's raw JSON file. Useful for inspecting the data structure or grabbing a copy to share or import elsewhere.
- **Duplicate** — Creates a copy of the bot with a new UUID and a "(Copy)" suffix. The duplicate appears immediately in the list and can be opened independently.
- **Delete** — Permanently removes the bot and all its associated images. Requires confirmation. This cannot be undone.
- **Status** — Sets the bot's publishing status: *Draft* (not yet published), *Public* (live and searchable), or *Unlisted* (live but hidden from search). Saved immediately without opening the editor.

**Sorting and filtering:** Use the filter field to search by name or CID. The sort icon in the filter field toggles between alphabetical (A-Z) and most-recently-modified order.

---

# The Editor

Opening a bot takes you to the editor. The left-hand panel is a navigation tree — click any node to load its form in the main area. Folder nodes (Bot, Background, each Character) expand to reveal their sub-sections.

**App bar:**

- **Home button** — Returns to the home page. If you have unsaved changes you'll be prompted to save or discard before leaving.
- **File menu** — Contains *Save* and *Reload* (see below).
- **Export** — Auto-saves and navigates to the Copy Station for this bot.
- **Profile Tree / Images toggle** — The paired buttons at the top right switch between the profile editor and the image manager. The Images button shows the current image count when images are present.
- **Variant selector** — Shown at the top of the navigation drawer. Switches the active variant. "Base" means you're editing the canonical version.

**Save:** Writes the current state to disk. The app validates the bot against its schema before saving — if validation fails, no file is written and an error is shown. Any redundant variant overrides (fields that now match the base) are silently cleaned up on save.

**Reload:** Discards all unsaved in-memory changes and reloads the bot from the last saved file on disk. If there are unsaved changes you'll be asked to confirm before reloading.

---

# Images

Switch to the Images panel using the Images button in the top-right of the app bar. Each bot has its own image folder stored alongside its JSON file.

**Panel actions:**

- **Upload** — Opens a file picker. Multiple files can be selected at once. Any image format is accepted.
- **Copy folder path** — Copies the bot's images folder path to the clipboard. The primary use is when uploading an image to a chatbot platform — paste the path into your file manager to navigate directly to where the images are stored, then select the file from there. Also handy for dropping new files into the folder manually.
- **Sync from disk** — Re-scans the images folder and updates the gallery. Use this after dropping files in manually.

**Gallery:** Click a thumbnail to preview it full-size on the right. The image highlighted in the primary color is the current profile image — the one shown on the home page card.

**Setting the profile image:** Click an image to select it, then use the *Set as Profile* button in the preview panel. Clicking the same image again deselects it (returns to no profile image). The profile image is saved with the bot — no separate save step needed.

---

# Importing a Bot (Advanced)

> Import requires knowledge of the bot JSON schema. If you don't have the schema, use **View Raw JSON** on any existing bot card to see a working example of the expected structure.

Use **Import Bot JSON** on the home screen to paste a raw JSON profile. The app will:

- Assign a new UUID and character IDs — no collision with existing bots.
- Merge imported values over a clean default template — unknown or extra fields are discarded.
- Validate against the schema before saving — invalid JSON is rejected with an error.
- Open the bot in the editor immediately on success.

Images are not imported via JSON. Add them manually after import using the Images panel.

---

# Tips

- **Dialog Examples are the most important field.** The LLM learns voice, rhythm, and diction directly from them. Write at least two that show the character under different emotional conditions.
- **Be explicit everywhere.** Don't put data inside headings or rely on the LLM to infer structure. The exporter uses key-value pairs throughout for this reason.
- **Anchors vs. Behavior Rules.** Anchors are facts that must never be contradicted (permanent world state). Behavior Rules are instructions about how the character acts. Keep them in the right place — an LLM handles them differently.
- **Use variants instead of duplicate bots.** If two versions of a bot differ in only a handful of fields, a variant is far easier to maintain than two separate bot files that diverge over time.
- **Write phases behaviorally, not evaluatively.** "He avoids eye contact and answers in monosyllables" is more useful than "He is uncomfortable." Show the LLM what to do — it'll figure out why.
