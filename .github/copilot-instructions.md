# Project Guidelines

## Architecture

This repository is a static frontend workspace built around standalone HTML files.

- `index.html` is the main landing page and the default file to update for the live event flow.
- There is no deployable backend inside this repository.

Payment creation, webhook handling, Google Sheets updates, and Mercado Pago API calls still run outside this repo in Google Apps Script.

The file `integrations/google-apps-script/Code.gs` is the only repository copy of the active Apps Script logic. Treat it as the versioned source copy that must be kept manually in sync with the deployed script.

If a task changes payment behavior, first read [contexto-plan-mercadopago-apps-script.md](../contexto-plan-mercadopago-apps-script.md) and treat it as the source of truth for the intended architecture.

If a task needs overall repo context, onboarding, or file map, read `README.md` first.

For business context, scope, and event details, see [propuesta-comercial-evento.md](../propuesta-comercial-evento.md).

## Build and Test

There is no build pipeline or automated test suite in this repo.

- Use VS Code Live Server for local checks.
- The workspace is configured for Live Server on port `5501`.
- Validate changes by opening the landing in a browser and manually checking layout, modal flow, form submission, and payment redirect behavior.

## Code Style

- Keep this project framework-free: use plain HTML, inline CSS, and vanilla JavaScript unless the user explicitly asks to introduce tooling.
- Preserve the existing visual language: luxury editorial styling, dark palette, serif headlines, and uppercase UI labels.
- Follow the current structure in `index.html`: styles in the `<style>` block, behavior in the bottom `<script>` block, no unnecessary abstraction.
- Prefer small, targeted edits. Do not refactor the whole page when only one section needs to change.

## Conventions

- When updating payment-related frontend logic, keep compatibility with the current Apps Script contract. The frontend expects a JSON response containing `init_point`.
- Do not move Mercado Pago credentials or sensitive logic into the frontend.
- Treat browser return parameters such as `status`, `collection_status`, `payment_id`, `collection_id`, and `external_reference` as UX or tracking inputs, not as the final source of truth for a paid order.
- If you touch the Google Apps Script endpoint URL, search for all occurrences and update them consistently.

## Pitfalls

- Critical payment execution is external to this repo. Do not assume the payment flow can be fully fixed from HTML alone.
- `integrations/google-apps-script/Code.gs` may lag behind the live Apps Script deployment if someone changes the script outside git. When payment behavior matters, compare the repo copy with the deployed script before making architectural decisions.
- There is no automated safety net. Manual verification is required after meaningful UI or checkout-flow changes.