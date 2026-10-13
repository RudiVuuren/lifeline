# Lifeline

Lifeline is a sequence diagram builder that stores everything as YAML. Diagrams are split into **flows**, and any step or participant can link to another flow so readers can drill down from an overview into detail.

**Open it:** https://rudivuuren.github.io/lifeline/

## Features

- Three views: **YAML** (Monaco editor), **Design** (drag to build) and **Preview** (read-only, single-click links).
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

Give [`docs/ai-guide.md`](docs/ai-guide.md) to the AI. It covers the YAML format, design rules, a full example, a checklist and how to build `/open/` links.

## Files

| Path | What it is |
|------|------------|
| `index.html` | The whole app: one self-contained page, with libraries loaded from jsDelivr |
| `open/index.html` | The `/open/` route; it forwards the link's diagram to the app |
| `docs/ai-guide.md` | Instructions for AIs that generate Lifeline YAML and links |

## Hosting

GitHub Pages serves the `main` branch from the repository root (**Settings → Pages → Deploy from a branch → main / root**). There is no build step.
