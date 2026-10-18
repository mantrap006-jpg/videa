# Videa FlowPay hosted crypto checkout

Videa offers a hosted FlowPay checkout for creator wallet top-ups. The customer chooses from FlowPay's supported cryptocurrencies at checkout; Videa prices the order in USD and converts the configured USD value to wallet points. Existing RWF/mobile-money deposits remain unchanged and still require admin review.

FlowPay describes itself as a custodial gateway: paid funds first settle to the merchant's FlowPay balance and are withdrawn from there. Review its custody, supported-country, fees, account, and withdrawal terms independently before accepting live funds.

## Environment variables

Set these in Vercel Project Settings → Environment Variables:

- `FLOWPAY_API_KEY`: server-side FlowPay API key. Prefer a payments-scoped key that cannot withdraw funds.
- `FLOWPAY_WEBHOOK_SECRET`: webhook signing secret returned when creating the FlowPay merchant.
- `CRYPTO_USD_RWF_RATE`: integer RWF point value for 1 USD of checkout value. For example, 1,400 means a $1 charge credits 1,400 points. This is an example policy value, not a live FX quote; choose and update your rate yourself.
- `APP_BASE_URL`: canonical HTTPS site URL, normally `https://videapro.site`.

Never prefix provider secrets with `NEXT_PUBLIC_` or commit real values. Redeploy after changing environment variables. No API credentials are stored in the repository.

## FlowPay account setup

1. Review the official API docs at https://flowpay.network/docs and make sure FlowPay supports your location and planned use case.
2. FlowPay documents a signup API at `POST https://flowpay.network/v1/signup`. Supply your business/display name, email, and webhook URL `https://videapro.site/api/webhooks/flowpay` as documented by the provider.
3. Store the returned `api_key` as `FLOWPAY_API_KEY` and `webhook_secret` as `FLOWPAY_WEBHOOK_SECRET` directly in Vercel. The provider says the credentials are shown once; do not paste them into chat or commit them.
4. Use the provider's default payments scope, or a more restricted payments key. Do not put a withdrawal-enabled key on the customer-facing server.
5. Configure the webhook endpoint to deliver charge events to `https://videapro.site/api/webhooks/flowpay` and confirm the signing secret matches the key stored in Vercel.
6. Confirm the merchant can receive payments and withdraw from its FlowPay balance before inviting users to pay.

## Checkout and credit safety

- Only authenticated creator accounts can start wallet top-ups.
- The server calculates the USD amount and point credit; browser return URLs never credit points.
- Videa creates a hosted charge at `POST /v1/charges` with USD pricing and a unique order reference, omitting `pay_currency` so the customer chooses a supported cryptocurrency.
- Hosted checkout URLs must use HTTPS and the exact `flowpay.network` hostname.
- The webhook verifies the HMAC-SHA256 signature against the exact raw request body using `FLOWPAY_WEBHOOK_SECRET`, compares in constant time, and checks the timestamp header freshness.
- After a signed `invoice.paid` event, Videa fetches the charge from FlowPay and verifies its ID, paid status, order reference, USD amount, and currency before considering credit.
- The webhook matches the payment to the existing pending Videa order and validates the stored amount.
- Event records, the wallet point increment, and payment status update run in a MongoDB transaction. MongoDB must support transactions (MongoDB Atlas replica set is typical).
- Unique event/payment keys prevent retries or duplicate deliveries from crediting points twice.
- Underpaid, expired, unsigned, stale, mismatched, or unverifiable events must not credit points.
- The existing RWF deposit endpoint, manual admin approval, and wallet UI remain in place.

## Release test checklist

- [ ] Confirm Vercel has all three required FlowPay/rate variables and redeploy.
- [ ] A logged-out request cannot create a charge.
- [ ] A viewer account cannot create a creator wallet top-up.
- [ ] Missing provider credentials or exchange-rate configuration returns a safe configuration error; RWF deposits continue working.
- [ ] A valid charge creation response redirects to an HTTPS `flowpay.network` hosted checkout URL.
- [ ] Invalid signature, changed raw body, missing timestamp, or stale timestamp is rejected.
- [ ] A signed non-paid event does not credit points.
- [ ] A signed paid event whose provider charge cannot be fetched or does not match the order is rejected without credit.
- [ ] Wrong order reference, charge ID, USD amount, or currency is rejected.
- [ ] Replaying a paid event or sending a second paid event for the same charge never credits twice.
- [ ] A verified paid charge credits the expected points exactly once.
- [ ] Verify payment and withdrawal using a small real payment only after reviewing the provider's live-payment and custody terms.

FlowPay's published docs describe a live `sk_live_` API key and do not clearly document a sandbox/test mode. Do not assume that creating a checkout is a test. Validate the integration with mocked webhook/provider responses first, then use a small live payment only if you accept the risk.
