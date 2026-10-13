# Lifeline

Lifeline is a sequence diagram builder that stores diagrams as YAML. Each YAML file contains one or more **flows**. Messages and participants can reference other flows, letting readers drill down from an overview into the details—even across multiple files.

**Open Lifeline:** https://rudivuuren.github.io/lifeline/

## Features

- **YAML, Design, and Preview:** Edit source YAML, build a diagram visually, or explore it in read-only mode. The file/flow sidebar remains available while editing YAML, so you can switch between files.
- **Map:** Open the separate **Map** view to see flows across loaded files and directed connections between them. Select a flow to open it in Design. Hovering highlights the selected flow at 100% opacity, directly connected flows and links at 80%, and unrelated items at 25%.
- **Visual editing:** Add and rearrange participants and messages. Double-click an item (or press Enter) to edit text directly on the canvas. Ctrl+click (Cmd+click on macOS) a linked item in Design to follow its reference; in Preview, click it directly.
- **Linked flows:** Reference a flow in the same YAML file or in another file using a quoted cross-file reference such as `link: "refunds#refund-detail"`. Missing references remain red and underlined; selecting one shows an explanatory toast.
- **Multi-file workspace:** Open a YAML file or an entire folder. The sidebar groups flows beneath their file headings and provides controls to create files, add flows to a specific file, and switch between files.
- **Notes and badges:** Add notes to flows, participants, and messages. Messages can also carry YAML payload badges (such as `request` and `response`) and status badges (such as `"payment: authorised"`).
- **Canvas navigation:** Scroll to zoom; drag an empty area (or hold Space and drag) to pan. YAML files or folders can also be dropped into the app to open them.
- **File syncing:** In supported browsers, file-backed changes save to disk when syncing is enabled. A folder-level sync control manages the folder, while each file has its own matching sync toggle. Per-file sync preferences persist across reloads. External changes can be reloaded when syncing is enabled.
- **File actions:** Create browser-only YAML files, link them to disk through the file control, or delete browser-only files. A disk-backed file can have its sync disabled without deleting it from disk. Use **Save as…** when available to choose a destination, or **Download** to export YAML.

## Opening and saving diagrams

On startup, Lifeline restores an existing browser draft when available. Otherwise, choose to open a **folder**, open a **file**, or work with **browser storage**. The example diagram is only loaded when you select **File → Load example**.

Use **File → Open file…** to open a `.yaml` or `.yml` file, or **Open folder…** to load YAML files from a folder. In browsers supporting the File System Access API, such as Chrome and Edge, Lifeline can retain file and folder handles across reloads using IndexedDB. The browser may ask you to grant access again.

Browser-only drafts are stored locally in the browser. File-backed diagrams are saved to their files instead of being duplicated into localStorage. The folder sync toggle acts as a master switch; individual files can remain visible with their own syncing paused. Re-enabling folder sync re-scans the folder.

Use **File → Copy YAML** to copy the currently selected diagram's YAML. Download a `.yaml` copy when direct filesystem access is unavailable or when you want an independent export.

> Lifeline does not provide URL-based diagram loading or share-link generation. To share a diagram, share the YAML file (and any referenced YAML files), then open them in Lifeline.

## YAML structure

```yaml
title: Card payments
flows:
  card-payment:
    name: Card payment
    participants:
      - id: customer
        name: Customer
        type: actor
      - id: payments
        name: Payments API
    messages:
      - id: m1
        from: customer
        to: payments
        label: Submit payment
        link: "fraud#fraud-scoring"
        badges:
          - name: request
            type: yaml
            color: blue
            content: |-
              amount: 124900
              currency: ZAR
```

The `id` fields are part of the YAML format, but are hidden from the ordinary visual editing interface. Use raw YAML when you need to inspect or edit IDs. For cross-file references, load both files into the workspace; quoted links use the target filename without its `.yaml` extension, followed by `#` and the flow ID.

## Generating diagrams with AI

The **Lifeline Diagrams** Agent Skill teaches AI assistants to generate Lifeline-compatible YAML, including linked flows, notes, payload badges, and status badges.

The skill package contains:

- `SKILL.md` — YAML format, conventions, workflow, and validation checklist.
- `references/` — example YAML files demonstrating multi-file references and application features.

Upload the packaged skill to a compatible AI assistant, or provide its `SKILL.md` as guidance. The output is YAML files that you open directly in Lifeline. No helper scripts or special URL routes are required.

## Project files

| Path | Purpose |
| --- | --- |
| `index.html` | Lifeline application (HTML, CSS, and JavaScript in one page; dependencies loaded from CDNs). |
| `skill/lifeline/` | Lifeline Diagrams Agent Skill and example YAML references, if included in the repository. |

## Hosting

Host `index.html` as a static site. For GitHub Pages, configure **Settings → Pages → Deploy from a branch → main / root**. No build step is required.

Direct file and folder access requires a supported browser and an appropriate secure context. Browser permission prompts and handle restoration are managed by the browser.
