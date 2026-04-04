# Security Notes

## Current posture

- No application secrets should be committed to this repository.
- Local environment files, private keys, certificates, virtual environments and editor settings are ignored by git.
- GitHub Actions runs a gitleaks scan on every push and pull request.

## Payment flow constraint

The public landing must not update payment status from browser query parameters.

That client-side path was removed from the landing because values such as `status`, `payment_id` and `external_reference` can be forged by any public visitor.

## External hardening still required

The Google Apps Script endpoint used by the landing is not stored in this repository, so it could not be hardened here.

That external endpoint should follow these rules:

1. Accept public writes only for lead capture, never for payment confirmation.
2. Reject any public `update_status` action.
3. Reconcile payment status only from a Mercado Pago webhook or another authenticated server-side process.
4. Validate and sanitize all incoming fields before writing to Google Sheets.
5. Add abuse protection such as rate limiting, CAPTCHA or an equivalent anti-spam control if the endpoint stays public.