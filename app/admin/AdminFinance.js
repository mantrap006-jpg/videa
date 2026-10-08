"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, XCircle, Wallet, CreditCard } from "lucide-react";

export default function AdminFinance({ initialPayments, initialWithdrawals }) {
  const [tab, setTab] = useState("subscriptions");
  const [payments, setPayments] = useState(initialPayments);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function review(type, id, action) {
    const promptText = action === "approve" ? "Confirm approval/payout. Optional note:" : "Reason for rejection (required):";
    const adminNote = window.prompt(promptText);
    if (adminNote === null || (action === "reject" && !adminNote.trim())) return;
    setBusy(id); setMessage("");
    try {
      const res = await fetch(type === "subscriptions" ? "/api/admin/payments" : "/api/admin/withdrawals", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not review request.");
      if (type === "subscriptions") {
        setPayments(items => items.map(item => item.id === id ? { ...item, ...result.payment } : item));
      } else {
        setWithdrawals(items => items.map(item => item.id === id ? { ...item, ...result.withdrawal } : item));
      }
      setMessage(type === "subscriptions" ? "Subscription request updated." : action === "approve" ? "Withdrawal approved. Complete the mobile-money payout and keep its reference." : "Withdrawal rejected and points returned to the user.");
    } catch (e) { setMessage(e.message); }
    finally { setBusy(""); }
  }

  const pendingPayments = payments.filter(x => x.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter(x => x.status === "pending").length;
  return (
    <section className="admin-page">
      <div className="admin-head"><div><div className="eyebrow">VIDEA OPERATIONS</div><h1>Payment center</h1><p>Verify Creator subscriptions and review user withdrawals.</p></div><a className="button secondary" href="/wallet"><Wallet size={16}/> User wallet preview</a></div>
      <div className="admin-stats">
        <div className="card"><span>Pending subscriptions</span><strong>{pendingPayments}</strong></div>
        <div className="card"><span>Pending withdrawals</span><strong>{pendingWithdrawals}</strong></div>
        <div className="card"><span>Conversion rate</span><strong>1:1</strong><small>1 point = 1 RWF</small></div>
      </div>
      <div className="admin-tabs">
        <button className={tab === "subscriptions" ? "active" : ""} onClick={() => setTab("subscriptions")}><CreditCard size={17}/> Approve subscriptions <span>{pendingPayments}</span></button>
        <button className={tab === "withdrawals" ? "active" : ""} onClick={() => setTab("withdrawals")}><Wallet size={17}/> Withdrawals <span>{pendingWithdrawals}</span></button>
      </div>
      {message && <p className="admin-flash">{message}</p>}
      {tab === "subscriptions" ? (
        payments.length ? <div className="admin-payments">{payments.map(payment=><article className="card admin-payment-card" key={payment.id}>
          <div className="admin-request-main"><div className="admin-payment-title"><h3>{payment.userName || "Creator"}</h3><span className={"admin-status "+payment.status}>{payment.status}</span></div>
            <p>{payment.userEmail}</p><div className="admin-payment-meta"><span><b>Amount:</b> {Number(payment.amountRwf).toLocaleString()} RWF</span><span><b>Phone:</b> {payment.phone}</span><span><b>Reference:</b> {payment.transactionReference}</span></div>
            <small>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""}</small>{payment.adminNote && <div className="admin-note">{payment.adminNote}</div>}
          </div>
          {payment.status === "pending" ? <div className="admin-payment-actions"><button className="button admin-approve" disabled={busy===payment.id} onClick={()=>review("subscriptions",payment.id,"approve")}><CheckCircle2 size={16}/> Approve</button><button className="button admin-reject" disabled={busy===payment.id} onClick={()=>review("subscriptions",payment.id,"reject")}><XCircle size={16}/> Reject</button></div> : <div className="admin-verified"><Clock3 size={15}/>{payment.status === "approved" ? "Subscription activated" : "Request rejected"}</div>}
        </article>)}</div> : <div className="card admin-empty">No subscription payment requests yet.</div>
      ) : (
        withdrawals.length ? <div className="admin-payments">{withdrawals.map(item=><article className="card admin-payment-card" key={item.id}>
          <div className="admin-request-main"><div className="admin-payment-title"><h3>{item.userName || "Videa user"}</h3><span className={"admin-status "+item.status}>{item.status}</span></div>
            <p>{item.userEmail}</p><div className="admin-payment-meta"><span><b>Payout:</b> {Number(item.amountRwf).toLocaleString()} RWF</span><span><b>Reserved:</b> {Number(item.points).toLocaleString()} points</span><span><b>Network:</b> {item.network}</span><span><b>Phone:</b> {item.phone}</span></div>
            <small>Requested {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>{item.adminNote && <div className="admin-note">{item.adminNote}</div>}
          </div>
          {item.status === "pending" ? <div className="admin-payment-actions"><button className="button admin-approve" disabled={busy===item.id} onClick={()=>review("withdrawals",item.id,"approve")}><CheckCircle2 size={16}/> Approve payout</button><button className="button admin-reject" disabled={busy===item.id} onClick={()=>review("withdrawals",item.id,"reject")}><XCircle size={16}/> Reject</button></div> : <div className="admin-verified"><Clock3 size={15}/>{item.status === "approved" ? "Marked approved for payout" : "Points refunded"}</div>}
        </article>)}</div> : <div className="card admin-empty">No withdrawal requests yet.</div>
      )}
      <p className="admin-payout-warning"><ShieldCheck size={16}/> Approving a withdrawal records the admin decision; send the mobile-money payment manually and record the payout reference in the admin note.</p>
    </section>
  );
}
