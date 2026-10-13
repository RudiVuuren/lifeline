# Lifeline YAML guide for AI generation

You are generating a YAML file for **Lifeline**, a sequence diagram tool. One file holds a set of **flows**. Each flow is one sequence diagram. All flows sit at the same level; there is no root or parent flow. A participant or step in any flow can **link** to any other flow, so the reader can jump from one flow into another that shows more detail or a related process.

Output **only** the YAML, with no prose before or after it and no code fences, unless you are asked otherwise.

---

## 1. File structure

```yaml
title: <string>            # name of the whole diagram set
flows:                     # the first flow listed opens first
  <flow id>:               # e.g. card-payment
    name: <string>         # human-readable flow name
    notes: <string>        # optional, plain text
    participants: [...]    # left-to-right order on the diagram
    messages: [...]        # top-to-bottom order (step 1, 2, 3 …)
```

### Participant

```yaml
- id: <id>                 # required, unique within this flow
  name: <string>           # display name
  type: <shape>            # optional, default: participant
  link: <flow id>          # optional, drill-down target
  notes: <string>          # optional, plain text
```

`type` is one of:

| type          | Use it for                                          |
|---------------|-----------------------------------------------------|
| `participant` | Services, apps, components (default, omit the key)  |
| `actor`       | A person or role (customer, operator, admin)        |
| `database`    | Databases, caches, ledgers, file stores             |
| `queue`       | Message queues, topics, event buses                 |
| `external`    | Third-party or out-of-scope systems                 |

### Message (step)

```yaml
- id: <id>                 # unique within this flow, use m1, m2, m3 …
  from: <participant id>   # must exist in this flow's participants
  to: <participant id>     # must exist in this flow's participants; may equal from
  label: <string>          # what is sent or done
  kind: <kind>             # optional, default: sync
  link: <flow id>          # optional, drill-down target
  notes: <string>          # optional, plain text
  badges: [...]            # optional, small coloured tags shown under the arrow
```

### Badge

Badges are small coloured tags drawn under a step's arrow. Each one shows its **name** on the diagram, and its **content** opens in an editor when the reader clicks it. A step can have several badges.

```yaml
- name: <string>           # shown on the diagram
  type: <text | yaml>      # optional, default: text
  color: <colour>          # optional, default: gray
  content: <string>        # use |- for more than one line
```

`color` is one of `blue`, `green`, `orange`, `red`, `purple`, `teal` or `gray`. Prefer these names over hex values because they adapt to light and dark mode.

Use badges for exactly two things: **payloads** and **statuses**.

#### Payload badges

A payload badge shows the data a step carries, as a realistic sample.

- **Name:** `request` on a step that sends data, `response` on the step that returns it. If a step carries something more specific, name it after that (`event`, `webhook`, `file`).
- **Type:** always `yaml`.
- **Content:** a sample payload written as YAML: realistic field names and believable values, not placeholders like `string` or `<id>`.
- **Colour:** `blue` for requests, `teal` for responses.

Add them where data crosses a boundary, typically from UI to backend, between services, and to or from external systems. Skip them on steps that carry nothing worth showing.

```yaml
- id: m2
  from: ui
  to: api
  label: POST /documents
  badges:
    - name: request
      type: yaml
      color: blue
      content: |-
        customerId: C-10482
        documentType: proof_of_address
        fileName: utility-bill-sept.pdf
        sizeBytes: 482113
```

#### Status badges

A status badge shows an entity's state at the point in the flow where that state is reached. Use them when the flow creates or moves an entity through a lifecycle, for example a UI creates a document, the backend saves it, the database stores it, and a scheduled job updates it later.

- **Name:** `<entity>: <status>`, lowercase, for example `document: uploaded`, `document: pending verification`, `document: verified`. Keep it under about 24 characters; longer names are shortened with an ellipsis on the diagram.
- **Type:** `text` (the default, so omit it).
- **Content:** one or two sentences explaining what the status means: what is true now, who or what moved it here, and what happens next.
- **Colour:** give each entity one colour and keep it for every status of that entity across all flows, so the reader can follow it. Use `red` for failure statuses (`document: rejected`).
- **Placement:** put the badge on the step that causes the change, usually the step arriving at the participant that now holds that state.

```yaml
- id: m4
  from: api
  to: db
  label: Insert document
  badges:
    - name: "document: uploaded"
      color: orange
      content: |-
        The file is stored and a document record exists.
        Nothing has checked it yet; it waits for the verification job.
- id: m7
  from: scheduler
  to: api
  label: Run verification
  badges:
    - name: "document: pending verification"
      color: orange
      content: The verification job has claimed the document and sent it for OCR and address matching.
```

Always quote status badge names, because they contain `: `.

Use `notes` for anything that is neither a payload nor a status.

`kind` is one of:

| kind    | Shown as   | Arrow                      | Use it for                                |
|---------|------------|----------------------------|-------------------------------------------|
| `sync`  | Request    | Solid line, filled head    | Any call or message sent (default)        |
| `reply` | Response   | Dashed line, filled head   | The response to an earlier request        |

Use only `sync` and `reply`. The editor only offers Request and Response. An older `async` kind still loads and draws with an open arrowhead, but it can't be selected in the editor, so don't generate it. Model fire-and-forget events as a request with no matching response.

When `from` and `to` are the same, the step is drawn as a self-call, for internal work such as "Validate payload".

---

## 2. Rules the file must follow

1. Do not add a `root` key. All flows are peers.
2. Every `from` and `to` must be the `id` of a participant **in the same flow**. Participants are not shared between flows. If a service appears in two flows, list it in both.
3. Participant ids are unique within a flow. Message ids are unique within a flow.
4. Ids use only letters, digits, `.`, `-` and `_`. Prefer lowercase kebab-case for participants and flows (`payments-api`, `fraud-scoring`) and `m1`, `m2`… for messages.
5. Every `link` must name an existing flow id. A flow must not link to itself. Flows may link to each other in any direction, including back to a flow that links to them.
6. Omit optional keys instead of leaving them empty. Leave out `type: participant` and `kind: sync` because they are the defaults.
7. Quote any string containing `:`, `#`, `{`, `}`, `[`, `]`, `,`, `&`, `*`, `?`, `|`, `>`, `!`, `%` or `@`, or that starts with a quote or a dash, e.g. `label: "GET /accounts/{id}"`.
8. Use `|-` block style for notes that span more than one line.
9. Use 2-space indentation throughout.

---

## 3. How to design good flows

**Keep each flow to one screen.** Aim for about 4–8 participants and 6–15 steps. If a flow would need more, split it into several flows and link them.

**List the flow a reader should see first at the top.** It opens when the file loads. Usually this is the end-to-end overview.

**Link instead of making long flows.** When a step hides real complexity (for example "Authorise payment"), give it `link: authorisation` and write the detail in a separate flow with that id. Link a **participant** when the whole component deserves its own internal view. Link a **step** when one interaction does.

**Make a linked flow continue where the link left off.** A flow opened from a step usually starts with the participant that sent that step, followed by the one that received it. Its first step mirrors the linked step, and the detail comes after that. The same flow can be linked from several places, for example a shared "Authorisation" flow used by both card and wallet payments.

**Order participants by who acts first.** The initiator (often an `actor`) goes on the left, then each system in the order the request travels through it. External systems usually go on the far right.

**Pair requests with responses.** A request that returns something meaningful gets a later `reply` step going back. Skip responses that add nothing, and leave fire-and-forget events without one.

**Keep labels short and concrete.** They wrap within the space between two neighbouring participants (about 18 characters per line), so 2–6 words works best:
- API calls: method and path, e.g. `POST /payments`
- Domain actions: verb and object, e.g. `Reserve funds`
- Responses: the outcome, e.g. `201 Created`, `approved`, `score 12 · allow`
- Message formats: the real code where there is one, e.g. `0100 auth request`

**Put detail in badges and notes, not labels.** Show the data a step carries with a `request` or `response` payload badge. Show where an entity changes state with a `<entity>: <status>` badge. Use notes for explanation, error handling and open questions. Keep to about 3 badges per step.

---

## 4. Complete example

```yaml
title: Card payments
flows:
  card-payment:
    name: Card payment
    notes: |-
      End-to-end card-not-present payment from checkout to settlement hold.
      Steps 3 and 5 drill down into their own flows.
    participants:
      - id: customer
        name: Customer
        type: actor
      - id: checkout
        name: Checkout UI
      - id: payments
        name: Payments API
        notes: Idempotency key is required on POST /payments.
      - id: fraud
        name: Fraud service
        link: fraud-scoring
      - id: network
        name: Card network
        type: external
      - id: ledger
        name: Ledger
        type: database
    messages:
      - id: m1
        from: customer
        to: checkout
        label: Pay R 1 249.00
      - id: m2
        from: checkout
        to: payments
        label: POST /payments
        badges:
          - name: request
            type: yaml
            color: blue
            content: |-
              amount: 124900
              currency: ZAR
              cardToken: tok_4f9a
              orderId: ORD-20931
          - name: "payment: created"
            color: orange
            content: Payments API has recorded the payment intent. No funds are reserved yet.
      - id: m3
        from: payments
        to: fraud
        label: Score transaction
        link: fraud-scoring
      - id: m4
        from: fraud
        to: payments
        label: score 12 · allow
        kind: reply
      - id: m5
        from: payments
        to: network
        label: Authorise (0100)
        link: authorisation
        notes: |-
          ISO 8583 authorisation request.
          Timeout after 25 s, then reverse with 0400.
      - id: m6
        from: network
        to: payments
        label: 0110 approved
        kind: reply
        badges:
          - name: "payment: authorised"
            color: orange
            content: The issuer approved the authorisation and reserved the funds on the card for up to 7 days.
      - id: m7
        from: payments
        to: ledger
        label: Post hold
        badges:
          - name: "payment: held"
            color: orange
            content: The ledger shows the reserved amount as a hold. Settlement converts it to a debit.
      - id: m8
        from: payments
        to: checkout
        label: 201 Created
        kind: reply
        badges:
          - name: response
            type: yaml
            color: teal
            content: |-
              paymentId: pay_7Hc21
              status: authorised
              amount: 124900
              currency: ZAR
      - id: m9
        from: checkout
        to: customer
        label: Show receipt
        kind: reply
  fraud-scoring:
    name: Fraud scoring
    participants:
      - id: fraud
        name: Fraud service
      - id: devices
        name: Device cache
        type: database
      - id: rules
        name: Rules engine
      - id: model
        name: Risk model
    messages:
      - id: m1
        from: fraud
        to: devices
        label: Lookup fingerprint
      - id: m2
        from: devices
        to: fraud
        label: seen 14 times
        kind: reply
      - id: m3
        from: fraud
        to: rules
        label: Evaluate velocity rules
      - id: m4
        from: rules
        to: fraud
        label: 0 hits
        kind: reply
      - id: m5
        from: fraud
        to: model
        label: Predict(features)
      - id: m6
        from: model
        to: fraud
        label: p=0.012
        kind: reply
        notes: Threshold for review is 0.35; decline above 0.80.
  authorisation:
    name: Authorisation
    participants:
      - id: payments
        name: Payments API
      - id: hsm
        name: HSM
        type: external
      - id: network
        name: Card network
        type: external
      - id: issuer
        name: Issuing bank
    messages:
      - id: m1
        from: payments
        to: hsm
        label: Generate ARQC check
      - id: m2
        from: hsm
        to: payments
        label: ok
        kind: reply
      - id: m3
        from: payments
        to: network
        label: 0100 auth request
      - id: m4
        from: network
        to: issuer
        label: Route by BIN
      - id: m5
        from: issuer
        to: issuer
        label: Check balance & limits
      - id: m6
        from: issuer
        to: network
        label: 0110 approved
        kind: reply
      - id: m7
        from: network
        to: payments
        label: 0110 approved
        kind: reply
```

---

## 5. Check before you answer

- [ ] There is no `root` key.
- [ ] Every `kind` is `sync` (or omitted) or `reply`; no `async`.
- [ ] Badges appear only on messages (steps), never on participants or flows.
- [ ] Payload badges are named `request` or `response` (or a specific payload name), have `type: yaml`, and contain a realistic sample.
- [ ] Status badges are named `"<entity>: <status>"` (quoted), use one colour per entity, and explain the status in their content.
- [ ] Every `from` and `to` is a participant id in the same flow.
- [ ] Every `link` names an existing flow, and no flow links to itself.
- [ ] Every flow is linked from at least one other flow, unless it is meant to stand alone.
- [ ] Ids are unique within their flow and use only letters, digits, `.`, `-` and `_`.
- [ ] Strings with special characters are quoted.
- [ ] No flow has more than about 8 participants or 15 steps. Split it with a link if it does.
- [ ] The output is the YAML only.

---

## 6. Open the diagram from a link

Lifeline is hosted at **https://rudivuuren.github.io/lifeline/**. Opening a link to its `/open/` route loads the diagram straight into Preview, where the reader can look through it and switch to Design to edit it.

Put the diagram in the part of the link after `#`, using one of these forms:

| Form | Use it when |
|------|-------------|
| `https://rudivuuren.github.io/lifeline/open/#yaml=<encoded YAML>` | You can't run code. Percent-encode the YAML. |
| `https://rudivuuren.github.io/lifeline/open/#z=<compressed YAML>` | You can run code. Gives much shorter links. |
| `https://rudivuuren.github.io/lifeline/open/?src=<encoded URL>` | The YAML is published at a public raw URL, such as a GitHub Gist raw link. Best for very large diagrams. |

Two optional settings can follow, joined with `&`:
- `tab=preview` (default), `tab=design` or `tab=yaml` picks the tab that opens.
- `flow=<flow id>` picks the flow that opens. The default is the first flow.

Example: `https://rudivuuren.github.io/lifeline/open/#yaml=...&tab=design&flow=authorisation`

### `#yaml=` without tools

Percent-encode the whole YAML the way JavaScript's `encodeURIComponent` does. Every character except `A–Z a–z 0–9 - _ . ! ~ * ' ( )` becomes `%XX`. In particular:

| Character | Write it as |
|-----------|-------------|
| new line  | `%0A` |
| space     | `%20` |
| `:`       | `%3A` |
| `#`       | `%23` |
| `&`       | `%26` |
| `%`       | `%25` |
| `"`       | `%22` |
| `/`       | `%2F` |
| `,`       | `%2C` |
| `\|`      | `%7C` |

For example, this YAML:

```yaml
title: Demo
flows:
  main:
    name: Main
```

becomes:

```
https://rudivuuren.github.io/lifeline/open/#yaml=title%3A%20Demo%0Aflows%3A%0A%20%20main%3A%0A%20%20%20%20name%3A%20Main%0A
```

Keep every indentation space; each one becomes `%20`.

### `#z=` with code

`z` is the YAML compressed with raw DEFLATE, then base64url-encoded without padding:

```python
import base64, zlib
yaml_text = open("diagram.yaml", encoding="utf-8").read()
c = zlib.compressobj(9, zlib.DEFLATED, -15)
z = base64.urlsafe_b64encode(c.compress(yaml_text.encode("utf-8")) + c.flush()).decode().rstrip("=")
print("https://rudivuuren.github.io/lifeline/open/#z=" + z)
```

### Link rules

- Give the link as a plain URL on its own line, not inside Markdown link syntax, so no character gets lost.
- Keep links under about 8,000 characters. Above that, use `#z=` or `?src=`.
- Validate the YAML against section 5 before encoding it. A link with invalid YAML opens in the YAML tab with the error shown.
- Opening a link replaces the diagram the reader had open. The previous one can be brought back with **File → Restore previous diagram**.

---

## 7. Prompt template

Copy this, fill in the brackets, and paste it to the AI together with this guide.

```
Using the Lifeline YAML guide above, generate the YAML for:

System / process: [what is being modelled]
Starting point: [who or what starts the flow]
Participants I know about: [list, with type if known]
Detail to drill into: [steps or components that need their own flow]
Payloads to show: [which requests and responses need sample payloads]
Entities and statuses to track: [e.g. document: uploaded → pending verification → verified / rejected]
Things to capture in notes: [explanations, open questions]
Flows to create: [e.g. an overview plus one flow per linked step]

Return only the YAML.
```

To get a link instead of the YAML, replace the last line with:

```
Return the YAML, then a Lifeline link to it built as described in section 6.
```
