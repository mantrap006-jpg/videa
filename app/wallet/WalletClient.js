"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Clock3, Coins, RefreshCw, ShieldCheck } from "lucide-react";

async function readJsonResponse(response, fallbackMessage) {
  const responseText = await response.text();
  if (!responseText.trim()) {
    throw new Error(response.ok
      ? "The server returned an empty response. Please refresh and try again."
      : fallbackMessage + " (HTTP " + response.status + "). Please try again.");
  }
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(response.ok
      ? "The server returned an invalid response. Please refresh and try again."
      : fallbackMessage + " (HTTP " + response.status + "). Please try again.");
  }
  if (!response.ok) throw new Error(result?.error || fallbackMessage + " (HTTP " + response.status + ").");
  return result;
}

export default function WalletClient() {
  const [data, setData] = useState(null);
  const [points, setPoints] = useState("100");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("MTN MoMo");
  const [depositAmount, setDepositAmount] = useState("1000");
  const [depositPhone, setDepositPhone] = useState("");
  const [depositNetwork, setDepositNetwork] = useState("MTN MoMo");
  const [paymentSettings, setPaymentSettings] = useState({ ussdNumber: "", paymentNetwork: "MTN / Airtel Money" });
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      const result = await readJsonResponse(res, "Could not load wallet");
      setData(result);
      const settingsResponse = await fetch("/api/payment-settings", { cache: "no-store" });
      if (settingsResponse.ok) setPaymentSettings(await readJsonResponse(settingsResponse, "Could not load payment settings"));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function withdraw(e) {
    e.preventDefault(); setError(""); setMessage(""); setSubmitting(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(points), phone, network })
      });
      const result = await readJsonResponse(res, "Could not submit withdrawal");
      setMessage("Withdrawal request submitted. Your points are reserved while the admin reviews it.");
      setPhone("");
      await load();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  async function deposit(e) {
    e.preventDefault(); setError(""); setMessage(""); setDepositSubmitting(true);
    try {
      const res = await fetch("/api/wallet/deposits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountRwf: Number(depositAmount), phone: depositPhone, network: depositNetwork, senderName })
      });
      const result = await readJsonResponse(res, "Could not submit deposit");
      setMessage("Deposit submitted for admin verification. Points will be added only after approval.");
      setSenderName("");
      await load();
    } catch (e) { setError(e.message); }
    finally { setDepositSubmitting(false); }
  }

  if (loading && !data) return <section className="wallet-page"><div className="card">Loading your wallet…</div></section>;

  const wallet = data?.wallet;
  return (
    <section className="wallet-page">
      <div className="wallet-hero">
        <div><div className="eyebrow"><Wallet size={15}/> YOUR WALLET</div><h1>Manage your Videa wallet</h1><p>Track your rewards and request a mobile-money withdrawal.</p></div>
        <button type="button" className="button secondary wallet-refresh" onClick={load}><RefreshCw size={16}/> Refresh</button>
      </div>
      {error && <p className="error wallet-message">{error}</p>}
      {message && <p className="success wallet-message">{message}</p>}
      <div className="wallet-balance-grid">
        <div className="card wallet-balance-card"><span><Coins size={16}/> Available points</span><strong>{(wallet?.points || 0).toLocaleString()}</strong><small>Pending deposits do not count until approved</small></div>
        <div className="card wallet-balance-card wallet-money"><span><Wallet size={16}/> Available value</span><strong>{(wallet?.balanceRwf || 0).toLocaleString()} <small>RWF</small></strong><small>1 point = 1 RWF</small></div>
      </div>

      {data?.wallet?.role === "creator" && (
        <form className="card wallet-deposit-form" onSubmit={deposit}>
          <div className="eyebrow"><ArrowUpFromLine size={15}/> CREATOR DEPOSIT</div>
          <h2>Deposit for your creator account</h2>
          <p className="muted">Enter the mobile-money payment details. An admin will verify the payment before approving it.</p>
          <label>Amount (RWF)<input type="number" min="100" max="10000000" step="1" required value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} /></label>
          <label>Mobile money network<select value={depositNetwork} onChange={e=>setDepositNetwork(e.target.value)}><option>MTN MoMo</option><option>Airtel Money</option></select></label>
          <label>Payment phone number<input required value={depositPhone} onChange={e=>setDepositPhone(e.target.value)} placeholder="e.g. 078..." autoComplete="tel" /></label>
          <label>Sender name shown on payment<input required value={senderName} onChange={e=>setSenderName(e.target.value)} maxLength={120} /></label>
          <button className="button wallet-submit" disabled={depositSubmitting}>{depositSubmitting ? "Submitting…" : "Submit deposit for verification"}</button>
        </form>
      )}

      <div className="wallet-columns">
        <form className="card wallet-withdraw-form" onSubmit={withdraw}>
          <div className="eyebrow"><ArrowDownToLine size={15}/> WITHDRAW</div><h2>Request a payout</h2>
          <p className="muted">Minimum {wallet?.minimumWithdrawalPoints || 100} points. Your points are held until the request is reviewed.</p>
          <label>Points to withdraw<input type="number" min={wallet?.minimumWithdrawalPoints || 100} max={wallet?.points || 0} step="1" required value={points} onChange={e=>setPoints(e.target.value)} /></label>
          <div className="wallet-amount-preview"><span>You will receive</span><strong>{(Number(points) || 0).toLocaleString()} RWF</strong></div>
          <label>Mobile money network<select value={network} onChange={e=>setNetwork(e.target.value)}><option>MTN MoMo</option><option>Airtel Money</option><option>Other</option></select></label>
          <label>Phone number<input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 078..." autoComplete="tel" /></label>
          <button className="button wallet-submit" disabled={submitting || !wallet || Number(points) > wallet.points || Number(points) < (wallet.minimumWithdrawalPoints || 100)}>{submitting ? "Submitting…" : "Submit withdrawal request"}</button>
          <div className="wallet-security"><ShieldCheck size={16}/> Every request is checked and reviewed by Videa admin.</div>
        </form>
        <div className="card wallet-history">
          <div className="wallet-section-title">
            <div>
              <div className="eyebrow">PAYOUT HISTORY</div>
              <h2>Withdrawals</h2>
            </div>
            <Clock3 size={20} />
          </div>
          {!data?.withdrawals?.length ? (
            <p className="muted">No withdrawal requests yet.</p>
          ) : (
            data.withdrawals.map((item) => (
              <div className="wallet-history-row" key={item.id}>
                <div>
                  <strong>{item.amountRwf.toLocaleString()} RWF</strong>
                  <span>{item.network} · {item.phone}</span>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                  {item.adminNote && <small>{item.adminNote}</small>}
                </div>
                <span className={"admin-status " + item.status}>{item.status}</span>
              </div>
            ))
          )}
          <div className="wallet-section-title wallet-earnings-title">
            <div>
              <div className="eyebrow">REWARD ACTIVITY</div>
              <h2>Recent earnings</h2>
            </div>
          </div>
          {!data?.earnings?.length ? (
            <p className="muted">Watch eligible videos to earn your first points.</p>
          ) : (
            data.earnings.map((item) => (
              <div className="wallet-history-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <b className="wallet-earned-points">+{item.points} pts</b>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
