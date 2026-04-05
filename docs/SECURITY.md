# Security Notes

## Current posture

- No application secrets should be committed to this repository.
- Local environment files, private keys, certificates and editor noise stay out of git.
- GitHub Actions runs a gitleaks scan on push and pull request.
- GitHub Pages hosts the public landing; Google Apps Script holds the private payment logic.

## Active payment rule

The public landing can create leads and open checkout.

It cannot confirm, reconcile or mutate the final payment state.

## Current trust boundary

The trusted path is:

`Mercado Pago -> Apps Script Web App -> API official lookup -> Google Sheets`

The browser is outside that trust boundary.

## Rules that must stay true

1. The Apps Script public action is `create_lead` only.
2. Final payment mutation must only happen after a server-side lookup to Mercado Pago.
3. Query params such as `status`, `payment_id` and `external_reference` must never close a sale.
4. Mercado Pago access tokens must never reach the frontend.
5. All incoming fields must be sanitized before writing to Sheets.
6. The row must keep reconciling by `external_reference`, not by browser state.

## Remaining hardening work

1. Add stronger abuse protection to the public lead endpoint if volume grows.
2. Confirm whether Apps Script Web Apps can expose `x-signature` and `x-request-id` in a reliable way for HMAC validation.
3. Until that is solved, keep the direct webhook gated by `webhook_secret` in the notification URL plus official API lookup.
4. Add better logging and observability for reconciliation failures.
5. Reconfirm that deployed Script Properties match the documented contract and that Apps Script quotas stay inside safe bounds.