# Glossary

| Term | Meaning |
|---|---|
| Authorisation | The issuer's approval to reserve funds on a card. No money moves yet. |
| Capture | The request that turns an authorisation into a debit during settlement. |
| Hold | Funds reserved by an authorisation, visible to the cardholder as pending. |
| Idempotency key | A client-supplied key that makes a repeated request return the original result instead of creating a second payment. |
| Risk score | A number between 0 and 1 from fraud scoring. Higher means riskier. |
| Settlement | The nightly batch that captures authorised payments. |

Flows that use these terms: [Checkout](../journeys/checkout.yaml), [Authorise payment](../services/authorise-payment.yaml), [Settlement](../operations/settlement.yaml).
