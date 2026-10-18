"use client";

import { useEffect, useState } from "react";
import { Coins, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react";

export default function CryptoDepositForm() {
  const [amount, setAmount] = useState("10");
  const [rate, setRate] = useState(null);
  const [payments, setPayments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPayments() {
    try {
      const response = await fetch("/api/wallet/crypto", { cache: "no-store" });
      const result = await response.json();
      if (response.ok) {
        setPayments(result.payments || []);
        if (Number.isSafeInteger(result.rateRwfPerUsdc) && result.rateRwfPerUsdc > 0) setRate(result.rateRwfPerUsdc);
      }
    } catch {}
  }
  useEffect(() => { loadPayments(); }, []);

  const cents = Math.round(Number(amount) * 100);
  const estimatedPoints = rate && Number.isSafeInteger(cents) ? Math.floor((cents * rate) / 100) : null;

  async function startCheckout(event) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/wallet/crypto", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: cents })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start checkout.");
      setMessage("Opening secure USDC checkout…");
      window.location.assign(result.checkoutUrl);
    } catch (e) { setError(e.message || "Could not start checkout."); }
    finally { setBusy(false); }
  }

  return (
    <div className="card wallet-deposit-form crypto-deposit-form">
      <div className="eyebrow"><Coins size={15}/> GLOBAL PAYMENTS · USDC</div>
      <h2>Deposit with USDC</h2>
      <p className="muted">Pay with USD Coin through secure hosted checkout on Polygon. Videa adds points only after the provider confirms payment.</p>
      <form onSubmit={startCheckout}>
        <label>Amount (USDC)
          <input type="number" min="1" max="1000000" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} />
        </label>
        {estimatedPoints !== null && <div className="wallet-amount-preview"><span>Estimated wallet credit</span><strong>{estimatedPoints.toLocaleString()} points</strong></div>}
        {error && <p className="error wallet-message">{error}</p>}
        {message && <p className="success wallet-message">{message}</p>}
        <button className="button wallet-submit" disabled={busy || !Number.isFinite(Number(amount)) || cents < 100 || cents > 100000000}>
          {busy ? "Preparing checkout…" : <>Continue to secure checkout <ExternalLink size={15}/></>}
        </button>
      </form>
      <div className="wallet-security"><ShieldCheck size={16}/> Never send crypto directly to an address shown in chat. Checkout and payment confirmation are handled securely.</div>
      {payments.length > 0 && <div className="crypto-payment-history">
        <div className="wallet-section-title"><h3>USDC payment history</h3><button type="button" className="button secondary" onClick={loadPayments}><RefreshCw size={14}/> Refresh</button></div>
        {payments.map(item=><div className="wallet-history-row" key={item.id}>
          <div><strong>{Number(item.amountUsdc).toFixed(2)} USDC · {Number(item.points).toLocaleString()} points</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div>
          <span className={"admin-status " + (item.status === "paid" ? "approved" : item.status === "failed" ? "rejected" : "pending")}>{item.status}</span>
        </div>)}
      </div>}
    </div>
  );
}
