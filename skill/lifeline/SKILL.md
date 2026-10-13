---
name: lifeline-diagrams
description: Create, review, and edit YAML sequence diagrams for Lifeline, with multiple flows, cross-file references, message payload and status badges. Use for sequence diagrams, system interactions, workflow breakdowns, or Lifeline YAML files.
---

# Lifeline diagrams

Lifeline is a browser-based YAML sequence-diagram editor at https://rudivuuren.github.io/lifeline/. Each YAML file contains one or more **flows**. Messages and participants can link to other flows in the same file or another loaded YAML file. The app also offers a **Map** view of flow references.

## Workflow

1. **Plan the flows.** Put a readable overview first. Give complex steps their own flows and link to them; aim for roughly 4–8 participants and 6–15 messages per flow.
2. **Produce valid YAML** in the format below. Save it as `<diagram-name>.yaml` when file creation is available, otherwise provide a YAML code block. When the user needs several files, create separate YAML files with cross-file links.
3. **Check the YAML** for syntax, unique IDs, valid participant references, and flow references using the checklist below. Validate by parsing YAML where available.
4. **Deliver** the YAML file(s) and instruct the user to open them through **File → Open file…** or **File → Open folder…** in Lifeline.

## Format

```yaml
title: Card payments
flows:
  card-payment:
    name: Card payment
    notes: End-to-end payment overview.
    participants:
      - id: customer
        name: Customer
        type: actor
      - id: checkout
        name: Checkout UI
      - id: payments
        name: Payments API
    messages:
      - id: m1
        from: customer
        to: checkout
        label: Submit payment
      - id: m2
        from: checkout
        to: payments
        label: POST /payments
        link: payment-processing
        badges:
          - name: request
            type: yaml
            color: blue
            content: |-
              orderId: ORD-20931
              amount: 124900
              currency: ZAR
      - id: m3
        from: payments
        to: checkout
        label: 201 Created
        kind: reply
  payment-processing:
    name: Payment processing
    participants:
      - id: payments
        name: Payments API
      - id: ledger
        name: Ledger
        type: database
    messages:
      - id: m1
        from: payments
        to: ledger
        label: Post hold
```

**Schema:** `title` is the overall document title; `flows` maps internal flow IDs to objects with `name`, optional `notes`, `participants`, and `messages`. Participants have `id`, `name`, optional `type`, `link`, `notes`. Messages have `id`, `from`, `to`, `label`, optional `kind`, `link`, `notes`, `badges`.

**Participant shapes:** `participant` (default), `actor`, `database`, `queue`, `external`.

**Message styles:** omit `kind` (equivalent to `sync`) for a solid request; use `reply` for a dashed response, or `async` for an asynchronous message with an open arrowhead.

## Complete example workspace

The three files in `references/` form one comprehensive, multi-file example. When generating a rich example or checking the available features, read these together:

- `references/payment-overview.yaml` — overview, sibling flow, all main participant shapes, participant and message drill-down links, notes, YAML request/response/event payloads, status badges, solid/dashed/asynchronous arrows.
- `references/payment-processing.yaml` — several linked detail flows, self-calls, risk checks, ledger updates, cross-file navigation, more badge colours.
- `references/payment-operations.yaml` — queue-to-worker delivery, return link to another file, and one **deliberately unresolved** reference (`future-integrations#risk-review`) to demonstrate red missing hyperlinks, explanatory toast and a missing node on the Map. Do not treat that deliberate link as an unintentional validation error.

Open the three `.yaml` files together using **File → Open folder…** to enable cross-file references. Example files represent YAML content, not browser UI settings: file creation, sync toggles, per-file sync persistence, Map hovering, and local-storage behaviour are application features rather than YAML properties. Do not invent YAML keys for them.

## References and links

- For a flow in the same file, use `link: flow-id`.
- For a flow in another loaded file, use `link: "other-file#flow-id"` (file name without `.yaml` is supported). Quote the value.
- A message or participant can link to a flow. Don't confuse the visible flow name with its internal ID in YAML.
- Unresolved references remain red, underlined, and clickable in the app. Clicking one displays an explanation; it does not create the missing flow. When authoring, check that linked targets exist in the intended set of files.
- The **Map** view draws flows across loaded files and their directed references; missing targets are shown separately. Use it to inspect connectivity.

## Badges

Badges belong on messages, not participants or flows. Prefer these two uses:

1. **Payloads:** use `type: yaml`, a short name such as `request`, `response`, `event`, or `webhook`, and believable YAML content. Prefer `blue` for requests and `teal` for responses.
2. **Statuses:** use a quoted name such as `"payment: authorised"`, omit `type`, and explain the state in `content`. Keep an entity's color consistent; use `red` for failures.

Available colors are `blue`, `green`, `orange`, `red`, `purple`, `teal`, and `gray`. Put contextual explanation outside these two categories in `notes`. Aim for at most three badges per step.

## Authoring rules

- Every message's `from` and `to` must be IDs of participants in the **same flow**. Repeat participants when needed in different flows.
- Flow and participant IDs should contain letters, digits, `.`, `-`, `_`; use kebab-case. Message IDs should be unique within their flow, e.g. `m1`, `m2`.
- Put the overview flow first; do not add a `root` key. Keep flows focused.
- Omit empty optional properties. Use two-space indentation and `|-` for multiline text.
- Quote YAML strings where needed, particularly cross-file references containing `#` and values containing `: `.
- Arrange participants left to right by interaction order; favor concise, meaningful message labels. Pair consequential requests with responses.
- A linked drill-down flow should explain the step it expands, rather than simply repeat its parent flow.
- IDs are implementation details: the normal Lifeline interface hides ID editing, but the raw YAML tab shows and permits editing IDs.

## Working in Lifeline

- YAML, Design, and Preview show the currently selected file/flow; the files-and-flows sidebar remains available in the YAML view for switching files.
- **File → Open file…** loads a YAML file. **File → Open folder…** loads a set of YAML files and enables cross-file references. New YAML files can also be created within the app.
- The folder has a master sync toggle; each disk-backed file has its own matching sync toggle. Per-file sync preferences persist across refreshes where browser storage and file access permit. Browser-only files instead have a Delete action.
- File-backed workspace handles are restored where supported, but the browser may request access permission again. File-backed diagrams are not also persisted as browser-local drafts; browser-only diagrams use browser storage.
- Opening the app restores an existing browser draft when available, otherwise offers workspace choices. The example diagram loads only through **File → Load example**.
- The detached **Map** button switches to a flow-reference map. Hovering highlights the selected flow at 100% opacity, direct connections at 80%, and unrelated items at 25%.

## Checklist

- [ ] YAML parses as a top-level mapping with a `title` and nonempty `flows` mapping.
- [ ] Overview flow is first; no `root` key.
- [ ] Each message's endpoints refer to participants in its flow.
- [ ] Internal IDs are unique and stable; cross-file references are quoted.
- [ ] All intended linked flows exist in the delivered YAML files, or are explicitly identified as missing (as in the comprehensive example).
- [ ] Message styles and payload/status badges are appropriate.
- [ ] All YAML files required to inspect the diagram in the Map and drill-down views are included.
