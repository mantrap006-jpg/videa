"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, XCircle, Wallet, CreditCard, ShieldCheck, ArrowDownToLine } from "lucide-react";

export default function AdminFinance({ initialPayments, initialWithdrawals, initialDeposits = [] }) {
  const [tab, setTab] = useState("deposits");
  const [payments, setPayments] = useState(initialPayments);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [deposits, setDeposits] = useState(initialDeposits);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function review(type, id, action) {
    const promptText = action === "approve" ? "Confirm approval. Optional note:" : "Reason for rejection (required):";
    const adminNote = window.prompt(promptText);
    if (adminNote === null || (action === "reject" && !adminNote.trim())) return;
    setBusy(id); setMessage("");
    const endpoint = type === "subscriptions" ? "/api/admin/payments" : type === "withdrawals" ? "/api/admin/withdrawals" : "/api/admin/deposits";
    try {
      const res = await fetch(endpoint, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not review request.");
      if (type === "subscriptions") {
        setPayments(items => items.map(item => item.id === id ? { ...item, ...result.payment } : item));
      } else if (type === "withdrawals") {
        setWithdrawals(items => items.map(item => item.id === id ? { ...item, ...result.withdrawal } : item));
      } else {
        setDeposits(items => items.map(item => item.id === id ? { ...item, ...result.deposit } : item));
      }
      setMessage(type === "subscriptions" ? "Subscription request updated." : type === "withdrawals" ? action === "approve" ? "Withdrawal approved. Complete the mobile-money payout and keep its reference." : "Withdrawal rejected and points returned to the user." : action === "approve" ? "Deposit verified and points added to the user's wallet." : "Deposit rejected. No points were added.");
    } catch (e) { setMessage(e.message); }
    finally { setBusy(""); }
  }

  const pendingPayments = payments.filter(x => x.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter(x => x.status === "pending").length;
  const pendingDeposits = deposits.filter(x => x.status === "pending").length;

  function actions(type, item) {
    return item.status === "pending" ? <div className="admin-payment-actions"><button className="button admin-approve" disabled={busy===item.id} onClick={()=>review(type,item.id,"approve")}><CheckCircle2 size={16}/>{type === "deposits" ? "Verify & add points" : type === "withdrawals" ? "Approve payout" : "Approve"}</button><button className="button admin-reject" disabled={busy===item.id} onClick={()=>review(type,item.id,"reject")}><XCircle size={16}/> Reject</button></div> : <div className="admin-verified"><Clock3 size={15}/>{item.status === "approved" ? (type === "deposits" ? "Verified · points credited" : type === "withdrawals" ? "Marked approved for payout" : "Subscription activated") : type === "deposits" ? "Rejected · no points added" : type === "withdrawals" ? "Points refunded" : "Request rejected"}</div>;
  }

  return (
    <section className="admin-page">
      <div className="admin-head"><div><div className="eyebrow">VIDEA OPERATIONS</div><h1>Payment center</h1><p>Verify wallet deposits, Creator subscriptions, and user withdrawals.</p></div></div>
      <div className="admin-stats">
        <div className="card"><span>Pending deposits</span><strong>{pendingDeposits}</strong></div>
        <div className="card"><span>Pending subscriptions</span><strong>{pendingPayments}</strong></div>
        <div className="card"><span>Pending withdrawals</span><strong>{pendingWithdrawals}</strong></div>
        <div className="card"><span>Conversion rate</span><strong>1:1</strong><small>1 point = 1 RWF</small></div>
      </div>
      <div className="admin-tabs">
        <button className={tab === "deposits" ? "active" : ""} onClick={() => setTab("deposits")}><ArrowDownToLine size={17}/> Verify deposits <span>{pendingDeposits}</span></button>
        <button className={tab === "subscriptions" ? "active" : ""} onClick={() => setTab("subscriptions")}><CreditCard size={17}/> Approve subscriptions <span>{pendingPayments}</span></button>
        <button className={tab === "withdrawals" ? "active" : ""} onClick={() => setTab("withdrawals")}><Wallet size={17}/> Withdrawals <span>{pendingWithdrawals}</span></button>
      </div>
      {message && <p className="admin-flash">{message}</p>}

      {tab === "deposits" ? (
        deposits.length ? <div className="admin-payments">{deposits.map(item=><article className="card admin-payment-card" key={item.id}>
          <div className="admin-request-main"><div className="admin-payment-title"><h3>{item.userName || "Videa user"}</h3><span className={"admin-status "+item.status}>{item.status}</span></div>
            <p>{item.userEmail}</p><div className="admin-payment-meta"><span><b>Deposit:</b> {Number(item.amountRwf).toLocaleString()} RWF</span><span><b>Points on approval:</b> {Number(item.points).toLocaleString()}</span><span><b>Network:</b> {item.network}</span><span><b>Phone:</b> {item.phone}</span><span><b>Transaction reference:</b> {item.transactionReference}</span></div>
            <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>{item.adminNote && <div className="admin-note">{item.adminNote}</div>}
          </div>{actions("deposits",item)}
        </article>)}</div> : <div className="card admin-empty">No deposit requests yet.</div>
      ) : tab === "subscriptions" ? (
        payments.length ? <div className="admin-payments">{payments.map(payment=><article className="card admin-payment-card" key={payment.id}>
          <div className="admin-request-main"><div className="admin-payment-title"><h3>{payment.userName || "Creator"}</h3><span className={"admin-status "+payment.status}>{payment.status}</span></div>
            <p>{payment.userEmail}</p><div className="admin-payment-meta"><span><b>Amount:</b> {Number(payment.amountRwf).toLocaleString()} RWF</span><span><b>Phone:</b> {payment.phone}</span><span><b>Reference:</b> {payment.transactionReference}</span></div>
            <small>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""}</small>{payment.adminNote && <div className="admin-note">{payment.adminNote}</div>}
          </div>{actions("subscriptions",payment)}
        </article>)}</div> : <div className="card admin-empty">No subscription payment requests yet.</div>
      ) : (
        withdrawals.length ? <div className="admin-payments">{withdrawals.map(item=><article className="card admin-payment-card" key={item.id}>
          <div className="admin-request-main"><div className="admin-payment-title"><h3>{item.userName || "Videa user"}</h3><span className={"admin-status "+item.status}>{item.status}</span></div>
            <p>{item.userEmail}</p><div className="admin-payment-meta"><span><b>Payout:</b> {Number(item.amountRwf).toLocaleString()} RWF</span><span><b>Reserved:</b> {Number(item.points).toLocaleString()} points</span><span><b>Network:</b> {item.network}</span><span><b>Phone:</b> {item.phone}</span></div>
            <small>Requested {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>{item.adminNote && <div className="admin-note">{item.adminNote}</div>}
          </div>{actions("withdrawals",item)}
        </article>)}</div> : <div className="card admin-empty">No withdrawal requests yet.</div>
      )}
      <p className="admin-payout-warning"><ShieldCheck size={16}/> Verify the actual mobile-money transaction before approving a deposit. Deposit approval credits points automatically; withdrawal approval only records the decision, so the mobile-money payout must be sent manually.</p>
    </section>
  );
}
