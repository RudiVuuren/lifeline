# Lifeline

Lifeline is a sequence diagram builder that stores everything as YAML. Diagrams are split into **flows**, and any step or participant can link to another flow so readers can drill down from an overview into detail.

**Open it:** https://rudivuuren.github.io/lifeline/

## Features

- Three views: **YAML** (Monaco editor), **Design** (drag to build) and **Preview** (read-only, single-click links).
- In Design, double-click a step or participant (or press Enter) to edit its text on the canvas, and Ctrl+click (Cmd+click on Mac) a linked one to open its flow.
- Flows sit side by side. Linked steps and participants are drawn as hyperlinks that open the target flow.
- Each item has notes. Steps can also carry **badges**: `request`/`response` payloads (YAML) and `<entity>: <status>` markers.
- The diagram saves in the browser. **File → Open file…** opens a `.yaml` file, and in Chrome and Edge every edit is saved straight back to it (the chip next to the title shows the save state). **Save as…** links the diagram to a new file, and **Download** saves a copy in any browser.
- **File → Copy YAML** and **Copy share link** take the diagram elsewhere.

## Open a diagram from a link

`/open/` loads a diagram straight from the URL and shows it in Preview:

```
https://rudivuuren.github.io/lifeline/open/#yaml=<percent-encoded YAML>
https://rudivuuren.github.io/lifeline/open/#z=<raw DEFLATE, base64url>
https://rudivuuren.github.io/lifeline/open/?src=<percent-encoded URL of a raw YAML file>
```

Optional: `&tab=preview|design|yaml` and `&flow=<flow id>`.

Opening a link replaces the diagram that was open. **File → Restore previous diagram** brings it back.

## Generating diagrams with an AI

[`skill/lifeline/`](skill/lifeline/) is an Agent Skill that teaches an AI to write Lifeline diagrams:

- `SKILL.md`: the format, badge conventions, design rules, link building and a checklist
- `references/example.yaml`: a complete example with linked flows and badges
- `scripts/lifeline.py`: checks a diagram and prints a link that opens it (`python lifeline.py diagram.yaml`)

To add it to Claude, zip the `lifeline` folder and upload it as a skill. For other AIs, give them `SKILL.md`; the example and script are optional extras.

## Files

| Path | What it is |
|------|------------|
| `index.html` | The whole app: one self-contained page, with libraries loaded from jsDelivr |
| `open/index.html` | The `/open/` route; it forwards the link's diagram to the app |
| `skill/lifeline/` | Agent Skill for AIs that generate Lifeline diagrams and links |

## Hosting

GitHub Pages serves the `main` branch from the repository root (**Settings → Pages → Deploy from a branch → main / root**). There is no build step.
