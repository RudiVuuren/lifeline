---
name: lifeline-diagrams
description: Create, review, and edit Lifeline workspaces - folders of YAML sequence-diagram flows (one flow per file) and Markdown documents that together describe how a system behaves. Use for sequence diagrams, system interactions, user journeys, service behaviour, or Lifeline YAML files.
---

# Lifeline workspaces

Lifeline is a browser-based planner at https://rudivuuren.github.io/lifeline/. A **workspace** is a folder. Each `.yaml` file in it holds exactly **one flow** (a sequence diagram); each `.md` file is a document. Subfolders group related files. Steps and participants link to other flows and documents by workspace-relative path, so a reader can drill down from a journey into the services behind it, and an AI can work from a flow plus everything it links to.

## Workflow

1. **Plan the files.** Decide which flows exist and which folder each belongs in. Behaviour that other flows reuse gets its own flow; detail used once stays inside its flow as a `group`.
2. **Write each flow** in the format below, one file per flow. Aim for roughly 4-8 participants and 6-20 steps per flow.
3. **Validate.** Run `node bin/lifeline.mjs validate <folder>` from the Lifeline repository when available, or check against the checklist below. Every link must resolve to a file in the workspace.
4. **Deliver** the files and tell the user to open the folder through **Workspace -> Open folder...** in Lifeline.

## Flow format

```yaml
name: Checkout
notes: |-
  A signed-in customer pays for their basket by card.

  **Outcomes**
  - On approval the customer sees a receipt.
participants:
  - id: customer
    name: Customer
    type: actor
  - id: web
    name: Web shop
  - id: payments
    name: Payments API
    link: services/authorise-payment
steps:
  - id: s0
    from: customer
    to: web
    label: Sign in
    link: journeys/sign-in
    notes: Prerequisite covered by the linked flow.
  - id: s1
    from: web
    to: payments
    label: POST /payments
    link: services/authorise-payment
    badges:
      - name: request
        type: yaml
        color: blue
        content: |-
          amount: 124900
          currency: ZAR
  - alt:
      - when: approved
        steps:
          - id: s2
            from: payments
            to: web
            label: 201 Created
            kind: reply
            badges:
              - name: "payment: authorised"
                color: orange
                content: Funds are held on the card.
      - when: declined
        steps:
          - id: s3
            from: payments
            to: web
            label: 402 Payment declined
            kind: reply
    id: f1
```

### Flow keys

A flow file has exactly these keys; any other key is reported and ignored.

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | Display name of the flow. |
| `notes` | no | Markdown shown below the diagram: purpose, outcomes, rules and constraints. Markdown links to other files work. |
| `participants` | yes | List of `id`, `name`, optional `type`, `link`, `notes`. |
| `steps` | yes | Ordered list of steps and frames. |

### Participants

`type` is `participant` (default, omit it), `actor`, `database`, `queue` or `external`. A participant may `link` to the flow that explains its internals.

### Steps

| Key | Meaning |
|---|---|
| `id` | Unique within the flow, for example `s1`. Keep ids stable once others cite them. |
| `from`, `to` | Participant ids in this flow. The same id in both makes a self-call (internal processing). |
| `label` | Short action, endpoint or response, for example `POST /payments` or `402 Payment declined`. |
| `kind` | Omit for a synchronous request. `reply` draws a dashed response; `async` draws an open arrowhead for events and queues. |
| `link` | A flow or document that expands this step. |
| `notes` | Markdown: purpose, constraint or outcome of this step. Do not repeat the label. Shown when hovering the step. |
| `badges` | Chips under the step. Each has `name`, `color`, optional `type: yaml`, and `content` (Markdown unless `type: yaml`). Shown when hovering the badge. |

### Badges

- **Payloads:** `type: yaml`, a short name such as `request`, `response`, `event`, `query`, `result` or `write`, and believable YAML content. Prefer `blue` for requests, `teal` for responses, `gray` for queries and results, `purple` for writes and events.
- **States:** a quoted name such as `"payment: authorised"`, no `type`, and a sentence in `content` explaining the state. Keep an entity's colour consistent; use `red` for failures.

Colours are `blue`, `green`, `orange`, `red`, `purple`, `teal` and `gray`. Aim for at most three badges per step.

### Frames

A frame is a step that contains steps. Give each frame an `id` (for example `f1`).

- `group: <name>` with `steps` - a named block of internal detail. Readers can collapse it.
- `opt: <condition>` with `steps` - steps that happen only when the condition holds.
- `loop: <condition>` with `steps` - steps that repeat.
- `alt:` - a list of cases, each `when: <condition>` with `steps`. Use it for success and failure branches; every consequential request should show its error responses.

Frames nest. In the app, Shift+drag over steps wraps them in a new frame.

## Prerequisites

A prerequisite is an ordinary step that links to the flow covering it, usually the first step: for example `label: Sign in` with `link: journeys/sign-in`. Do not repeat the prerequisite's steps.

## Links and paths

- A link is a workspace-relative path. Omit `.yaml` for flows (`services/authorise-payment`); keep the extension for documents (`docs/glossary.md`).
- Paths are exact. Keep file names unique and lowercase kebab-case.
- Inside Markdown (documents and flow notes), use normal relative links, for example `[Checkout](../journeys/checkout.yaml)`.
- Unresolved links show red in the diagram, appear in the Problems panel, and are drawn as missing nodes on the Map.

## Structuring a workspace

- One flow per user-visible journey, describing what the person does, the UI and API boundary, and what they observe.
- One flow per service operation (for example one API endpoint), describing validation, persistence, calls to other systems, events and every response including errors. Journey steps link to these.
- Reusable behaviour used by several operations gets its own flow. Detail used once stays as a `group` in its parent.
- Reference material that is not an interaction (glossary, constraints that apply everywhere) is a Markdown document.

## Complete example workspace

`references/` is a complete workspace. Read it before generating a new one:

- `README.md` - how the workspace is organised.
- `docs/glossary.md` - a document linked from flows.
- `journeys/sign-in.yaml` - a prerequisite journey with an `alt` for valid and invalid credentials.
- `journeys/checkout.yaml` - a prerequisite step, Markdown notes with outcomes and rules, an `alt` with a nested `opt`, and links into a service.
- `services/authorise-payment.yaml` - a complete service operation with query, write and event badges, state badges, an async event, and success and failure branches.
- `services/fraud-scoring.yaml` - a collapsible `group` of self-calls and one **deliberately unresolved** link (`services/manual-review`) that demonstrates missing references. Do not treat it as an accidental error.
- `operations/settlement.yaml` - queue delivery and a `loop`.

## Checklist

- [ ] Each `.yaml` file has only `name`, `notes`, `participants` and `steps`; there is no `flows:` key.
- [ ] Every step's `from` and `to` are participant ids in the same file.
- [ ] Step and frame ids are unique within the file.
- [ ] Every `link` resolves to a file in the workspace, except deliberate placeholders that are called out.
- [ ] Prerequisites are steps linking to their flows, not repeated steps.
- [ ] Every consequential request has its responses, including failure cases in an `alt`.
- [ ] Flow notes state the outcomes and rules that apply.
- [ ] Step notes explain purpose or constraints instead of repeating labels.
