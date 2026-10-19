# Lifeline

Lifeline is a planner for describing systems as linked sequence diagrams. A **workspace** is a folder: each `.yaml` file holds one flow, each `.md` file is a document, and subfolders group related files. Flows reference each other by path, so a journey can link to its prerequisites and drill down into the services behind each step. Together the files form a requirements specification that people can review and AI assistants can implement from.

**Open Lifeline:** https://rudivuuren.github.io/lifeline/

## Features

- **Folder workspaces:** Open a folder and Lifeline reads and saves its `.yaml` and `.md` files in place, including subfolders. External edits are picked up automatically. In Chrome and Edge the folder is remembered across reloads; the browser may ask for access again.
- **Source, Design and Preview:** Edit a file's source, build a flow visually, or read it. Markdown documents show a side-by-side editor and preview in Design.
- **File tree:** Files appear by name with their extension, grouped by folder. Double-click a file to rename it; links to it are updated across the workspace.
- **Flow notes:** Each flow's `notes` is Markdown shown in a box below the diagram. Double-click the box to edit it.
- **Frames:** `group`, `opt`, `loop` and `alt` frames show internal detail, optional steps, repetition and branches. Shift+drag over steps to wrap them in a frame. Frames can be collapsed on the canvas.
- **Notes and badges:** Notes on steps, participants and frames are Markdown. Steps carry coloured badges for example payloads and entity states, with Markdown or YAML content. Hover a step or badge on the canvas to read its notes or content.
- **Links:** Steps and participants link to flows or documents by workspace-relative path, for example `services/authorise-payment` or `docs/glossary.md`. A prerequisite is a step that links to its flow. Ctrl+click in Design, or click in Preview, to drill down; the breadcrumb shows the path taken.
- **Map:** Shows every flow and document grouped by folder, with links as edges and unresolved references as missing nodes.
- **Problems:** Lists files that fail to parse, steps with unknown participants, and unresolved links.
- **Copy flow with dependencies:** Copies a flow and every flow or document it links to as one Markdown bundle, ready to give an AI assistant.
- **Example workspace:** **Workspace -> Load example workspace** opens the example in memory; **Save to folder...** writes it to disk.

## Flow format

```yaml
name: Checkout
notes: |-
  A signed-in customer pays by card.

  **Outcome:** on approval the customer sees a receipt.
participants:
  - id: customer
    name: Customer
    type: actor
  - id: payments
    name: Payments API
steps:
  - id: s0
    from: customer
    to: payments
    label: Sign in
    link: journeys/sign-in
  - id: s1
    from: customer
    to: payments
    label: POST /payments
    link: services/authorise-payment
    badges:
      - name: request
        type: yaml
        color: blue
        content: "amount: 124900"
  - alt:
      - when: approved
        steps:
          - id: s2
            from: payments
            to: customer
            label: 201 Created
            kind: reply
      - when: declined
        steps:
          - id: s3
            from: payments
            to: customer
            label: 402 Payment declined
            kind: reply
    id: f1
```

The full reference is in [`skill/lifeline/SKILL.md`](skill/lifeline/SKILL.md), and [`skill/lifeline/references/`](skill/lifeline/references/) is a complete example workspace.

## Command line

The validator and bundler use the same model as the app.

```sh
npm install
node bin/lifeline.mjs validate path/to/workspace
node bin/lifeline.mjs bundle path/to/workspace journeys/checkout
```

`validate` exits with status 1 when a workspace has errors, so it can run in CI.

## AI assistants

The **Lifeline Diagrams** Agent Skill in `skill/lifeline/` teaches assistants the workspace format, conventions and validation checklist. Give an assistant `SKILL.md`, or upload the packaged skill, and ask for YAML and Markdown files to place in the workspace folder.

## Project files

| Path | Purpose |
| --- | --- |
| `index.html` | The Lifeline application. Dependencies load from CDNs. |
| `lifeline-model.js` | Flow parsing, serialisation, validation and bundling, shared by the app and the command line. |
| `bin/lifeline.mjs` | Command-line `validate` and `bundle`. |
| `skill/lifeline/` | Agent Skill and the example workspace. |

## Hosting

Host the repository root as a static site; no build step is required. For GitHub Pages, configure **Settings -> Pages -> Deploy from a branch -> main / root**. Folder access requires Chrome or Edge on a secure origin (https or localhost). Other browsers open folders as read-only copies.
