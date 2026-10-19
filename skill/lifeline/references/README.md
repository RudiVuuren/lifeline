# Card payments workspace

This example plans a small card-payment system as linked Lifeline flows. Open the folder in Lifeline with **Workspace → Open folder…**, or load it with **Workspace → Load example workspace**.

## How the workspace is organised

| Folder | Holds | Example |
|---|---|---|
| `journeys/` | What a person does and observes, end to end | [Checkout](journeys/checkout.yaml) starts with a step linking to [Sign in](journeys/sign-in.yaml) |
| `services/` | How one system handles one request: validation, rules, persistence, responses | [Authorise payment](services/authorise-payment.yaml), [Fraud scoring](services/fraud-scoring.yaml) |
| `operations/` | Background and scheduled processing | [Settlement](operations/settlement.yaml) |
| `docs/` | Reference material that is not an interaction | [Glossary](docs/glossary.md) |

## Conventions shown here

- Each `.yaml` file holds exactly one flow. The file path is the flow's identity.
- Links use workspace-relative paths without the `.yaml` extension, for example `services/authorise-payment`. Links to documents keep the `.md` extension.
- A prerequisite is an ordinary step that links to the flow covering it. Checkout's first step links to Sign in instead of repeating it.
- A step that needs more detail links to a service flow. Internal detail used only once stays inside the flow as a `group`.
- Branches use `alt`, optional behaviour uses `opt`, and repetition uses `loop`.
- Each flow's `notes` is Markdown shown below the diagram: purpose, outcomes and rules.
- Badges on steps carry example payloads (`request`, `response`, `query`, `write`, `event`) and entity states such as `payment: authorised`.

`services/fraud-scoring.yaml` deliberately links to `services/manual-review`, which does not exist. The Problems panel and the Map show it as a missing reference.
