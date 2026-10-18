# Videa USDC checkout setup

Videa uses Payclave hosted checkout for USDC deposits. The provider must be configured to settle in **USDC on Polygon** (chain ID 137). The existing RWF/mobile-money deposit flow remains available and still requires admin review.

## Vercel environment variables

Set these in the Vercel project for the appropriate environment:

- `PAYCLAVE_SECRET_KEY`: server-side Payclave API secret for the selected mode.
- `PAYCLAVE_WEBHOOK_SECRET`: signing secret generated when registering the webhook endpoint.
- `PAYCLAVE_MODE`: exactly `test` or `live`; must match the API key and webhook.
- `USDC_RWF_RATE`: current integer RWF value used to convert each USDC into wallet points. For example, a configured rate of 1,400 credits 1,400 points per 1 USDC. Choose and maintain this rate yourself; do not treat the example as a live exchange quote.
- `APP_BASE_URL`: canonical HTTPS site URL, normally `https://videapro.site`.

Never prefix provider secrets with `NEXT_PUBLIC_` or commit real values. Redeploy after setting environment variables.

## Provider setup

1. Create/activate a Payclave merchant account and configure its settlement wallet for USDC on Polygon.
2. Start with test credentials and `PAYCLAVE_MODE=test`.
3. Register a webhook endpoint at `https://videapro.site/api/webhooks/payclave`, subscribed to `invoice.paid`. Store its signing secret as `PAYCLAVE_WEBHOOK_SECRET`.
4. Confirm the provider checkout response identifies USDC. Videa deliberately rejects checkout sessions that do not identify USDC.
5. Run the tests below in test mode. Test webhook events never credit points.
6. Before accepting live money, obtain the live secret key and a new live webhook signing secret, set `PAYCLAVE_MODE=live`, configure the production settlement wallet, and make a small live payment.

## Credit safety

- Only authenticated creator accounts can start wallet top-ups.
- The server calculates the amount and point credit; browser return URLs never credit points.
- The webhook verifies the HMAC signature against the exact raw request body and rejects timestamps older/newer than five minutes.
- Only signed `invoice.paid` events in the configured mode can be considered. Videa matches the provider reference, invoice ID, USDC currency, and exact order amount.
- Event IDs are deduplicated, and the event record, wallet increment, and payment status are written in a MongoDB transaction. Use MongoDB Atlas or another replica-set deployment that supports transactions.
- The wallet balance is credited once, after verified payment. Underpaid, failed, mismatched, test, or unsigned events must not credit points.

## Release test checklist

- [ ] A logged-out request cannot create a checkout.
- [ ] A viewer account cannot create a creator wallet top-up.
- [ ] Missing provider credentials or exchange-rate configuration returns a safe configuration error; RWF deposits continue working.
- [ ] A valid USDC test checkout redirects to the Payclave hosted page.
- [ ] A tampered body, invalid signature, missing timestamp, or stale timestamp is rejected.
- [ ] A test webhook event does not credit points.
- [ ] A valid signed test-mode invoice event is handled without crediting points.
- [ ] A live-mode event is ignored when the app is configured for test mode, and vice versa.
- [ ] Wrong reference, invoice ID, currency, or amount is rejected.
- [ ] Replaying the same event, or sending a second paid event for the same invoice, never credits twice.
- [ ] A verified live payment credits the expected number of points exactly once; compare Videa's record with the provider invoice and settlement wallet before launch.
