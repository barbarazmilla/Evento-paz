# Security Notes

## Current posture

- No application secrets should be committed to this repository.
- Local environment files, private keys, certificates and editor noise stay out of git.
- GitHub Actions runs a gitleaks scan on push and pull request.

## Active payment rule

The public landing can create leads and open checkout.

It cannot confirm, reconcile or mutate the final payment state.

## Current trust boundary

The trusted path is:

`Mercado Pago -> webhook server-side -> API official lookup -> update_payment -> Google Sheets`

The browser is outside that trust boundary.

## Rules that must stay true

1. The Apps Script public action is `create_lead` only.
2. `update_payment` must stay protected by a shared secret and server-side origin.
3. Query params such as `status`, `payment_id` and `external_reference` must never close a sale.
4. Mercado Pago access tokens must never reach the frontend.
5. All incoming fields must be sanitized before writing to Sheets.

## Remaining hardening work

1. Add stronger abuse protection to the public lead endpoint if volume grows.
2. Add webhook signature validation from Mercado Pago in the Render service.
3. Add better logging and observability for reconciliation failures.
4. Reconfirm that deployed Script Properties match the documented contract.