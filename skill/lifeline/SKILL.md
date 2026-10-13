---
name: lifeline-diagrams
description: Create sequence diagrams for Lifeline (rudivuuren.github.io/lifeline) as YAML, with linked flows, payload and status badges, and a link that opens the diagram. Use when asked for a sequence diagram, a flow between systems, or a Lifeline diagram.
---

# Lifeline diagrams

Lifeline is a sequence diagram tool that stores diagrams as YAML. A file holds several **flows**, and each flow is one sequence diagram. Any step or participant can **link** to another flow, so a reader can click from an overview into the detail. The app is hosted at https://rudivuuren.github.io/lifeline/.

## Workflow

1. **Plan the flows.** Start with an overview flow. Every step that hides real complexity gets its own flow, which the step links to. Keep each flow to about 4–8 participants and 6–15 steps.
2. **Write the YAML** following the format and rules below. Save it as `<diagram-name>.yaml` if you can create files.
3. **Check it.**
   - If you can run code, run `python scripts/lifeline.py <file>.yaml`. It reports errors and warnings, and when there are no errors it prints a link. Fix the errors and run it again.
   - If you can't run code, go through the checklist at the end of this file.
4. **Deliver:**
   - the `.yaml` file, or the YAML in a code block if you can't create files
   - a Lifeline link on its own line, built as described in [Links](#links)

   Tell the user they can open the file in Lifeline with **File → Open file…**. In Chrome or Edge, their edits then save back to that file.

## Format

```yaml
title: Card payments            # name of the whole diagram
flows:                          # the first flow listed opens first; put the overview first
  card-payment:                 # flow id
    name: Card payment          # display name
    notes: Optional plain text.
    participants:               # left-to-right order
      - id: customer            # unique within this flow
        name: Customer
        type: actor             # optional, see shapes
        link: <flow id>         # optional: clicking the participant opens that flow
        notes: Optional plain text.
    messages:                   # top-to-bottom order; these are the steps
      - id: m1                  # unique within this flow: m1, m2, m3…
        from: customer          # participant id in this flow
        to: checkout            # participant id in this flow; equal to from for a self-call
        label: Pay R 1 249.00
        kind: reply             # optional: omit for a request, reply for a response
        link: <flow id>         # optional: clicking the step opens that flow
        notes: Optional plain text.
        badges: []              # optional, see Badges
```

**Shapes** (`type`):

| Shape | Use it for |
|---|---|
| `participant` | Services, apps and components. This is the default, so omit it. |
| `actor` | A person or role |
| `database` | Databases, caches, ledgers, file stores |
| `queue` | Queues, topics, event buses |
| `external` | Third-party or out-of-scope systems |

**Arrows** (`kind`):

| Value | How it's drawn | Use it for |
|---|---|---|
| omitted (or `sync`) | Request: solid line, filled head | Any call or message sent |
| `reply` | Response: dashed line, filled head | The answer to an earlier request |

Don't use `async`; it is deprecated. Model fire-and-forget events as a request with no matching response.

## Badges

Badges are small coloured tags drawn under a step's arrow. The name shows on the diagram, and the content opens when the reader clicks the badge. Use them for exactly two things.

**Payloads.** Show the data a step carries.
- Name it `request` or `response`, or something more specific such as `event`, `webhook` or `file`.
- Always set `type: yaml`.
- Write a realistic sample payload as YAML, with believable values rather than placeholders.
- Use `color: blue` for requests and `teal` for responses.
- Add one where data crosses a boundary: UI to backend, service to service, or to and from external systems.

```yaml
badges:
  - name: request
    type: yaml
    color: blue
    content: |-
      customerId: C-10482
      documentType: proof_of_address
      fileName: utility-bill-sept.pdf
```

**Statuses.** Show where an entity reaches a state, for example a document the UI uploads, the backend saves and a scheduled job verifies.
- Name it `"<entity>: <status>"`, lowercase and quoted, under about 24 characters.
- Leave it as text type, so omit `type`.
- The content explains what the status means, what moved it there, and what happens next.
- Give each entity one colour and keep it across all flows. Use `red` for failure statuses.
- Put it on the step that causes the change, usually the step arriving at the participant that now holds the state.

```yaml
badges:
  - name: "document: uploaded"
    color: orange
    content: |-
      The file is stored and a document record exists.
      It waits for the verification job.
```

Colours: `blue`, `green`, `orange`, `red`, `purple`, `teal`, `gray`. Badges are only allowed on messages. Put anything that is neither a payload nor a status in `notes`.

## Rules

1. Every `from` and `to` is a participant id in the **same flow**. Participants aren't shared between flows, so list them in each flow that uses them.
2. Every `link` is an existing flow id other than the flow it's in. Flows may link to each other in any direction, and one flow can be linked from several places.
3. Ids use only letters, digits, `.`, `-` and `_`. Use kebab-case for flows and participants, and `m1`, `m2`… for messages.
4. Don't add a `root` key.
5. Omit optional keys rather than leaving them empty.
6. Quote strings that contain `: `, `#`, `{`, `}`, `[`, `]`, `,`, `&`, `*`, `?`, `|`, `>`, `!`, `%` or `@`, or that start with a quote or dash.
7. Use `|-` for multi-line notes and badge content, and indent with 2 spaces.

## Design

- **Participant order:** the initiator (often an `actor`) goes on the left, then each system in the order the request reaches it. External systems go on the right.
- **Pairing:** a request that returns something meaningful gets a later `reply`. Skip responses that add nothing.
- **Labels:** 2–6 words. They wrap at about 18 characters between neighbouring participants.
  - API calls: `POST /payments`
  - Actions: `Reserve funds`
  - Responses: the outcome, such as `201 Created` or `approved`
- **Linked flows:** a linked flow starts where the link left off. Its first participants are the sender and receiver of the linked step, and its first step mirrors that step.
- **Badges per step:** at most about 3.

The complete card-payment example is in `references/example.yaml`. It has three linked flows, payload badges and payment status badges.

## Links

A link opens the diagram in Lifeline's Preview, and the reader can switch to Design to edit it. Give the link as a plain URL on its own line, not as a Markdown link.

| Form | When |
|---|---|
| `https://rudivuuren.github.io/lifeline/open/#z=<data>` | You can run code. `scripts/lifeline.py` prints it. |
| `https://rudivuuren.github.io/lifeline/open/#yaml=<encoded YAML>` | You can't run code and the YAML is short (under about 3,000 characters). |
| `https://rudivuuren.github.io/lifeline/open/?src=<encoded URL>` | The YAML is published at a public raw URL, such as a Gist. |

You can add `&tab=design` or `&tab=yaml` (the default is `preview`), and `&flow=<flow id>`.

For `#yaml=`, percent-encode the whole YAML the way JavaScript's `encodeURIComponent` does. Keep every indentation space. For example, new line → `%0A`, space → `%20`, `:` → `%3A`, `#` → `%23`, `&` → `%26`, `%` → `%25`, `"` → `%22`, `/` → `%2F`, `,` → `%2C`, `|` → `%7C`.

```
https://rudivuuren.github.io/lifeline/open/#yaml=title%3A%20Demo%0Aflows%3A%0A%20%20main%3A%0A%20%20%20%20name%3A%20Main%0A
```

If you can't run code and the YAML is long, skip the link. Give the YAML and tell the user to paste it into Lifeline's YAML tab or open the saved file.

`#z=` is raw DEFLATE, base64url-encoded without padding. In Python: `zlib.compressobj(9, zlib.DEFLATED, -15)`, then `base64.urlsafe_b64encode(...).rstrip(b"=")`.

## Checklist

- [ ] No `root` key, and the overview flow is listed first.
- [ ] Every `from` and `to` exists in the same flow, and every `link` names another existing flow.
- [ ] Every flow except the first is linked from somewhere.
- [ ] Ids are unique within their flow and use only valid characters.
- [ ] `kind` is omitted or `reply`.
- [ ] Payload badges have `type: yaml` and a realistic sample. Status badges are quoted `"<entity>: <status>"` with one colour per entity.
- [ ] Badges appear only on messages.
- [ ] No flow is much bigger than 8 participants or 15 steps.
- [ ] The link is on its own line.
