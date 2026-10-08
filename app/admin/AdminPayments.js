"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export default function AdminPayments({ initialPayments }) {
  const [payments, setPayments] = useState(initialPayments);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function updatePayment(id, action) {
    const adminNote = window.prompt(action === "approve" ? "Optional admin note:" : "Reason for rejection:");
    if (action === "reject" && adminNote === null) return;
    setBusyId(id); setMessage("");

    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote: adminNote || "" })
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || "Could not update payment."); return; }

      setPayments(current => current.map(payment =>
        payment.id === id
          ? { ...payment, status: data.payment.status, adminNote: data.payment.adminNote, verifiedAt: data.payment.verifiedAt }
          : payment
      ));
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setBusyId("");
    }
  }

  if (!payments.length) return <div className="card admin-empty">No subscription payments have been submitted yet.</div>;

  return (
    <div className="admin-payments">
      {message && <p className="error">{message}</p>}
      {payments.map(payment => (
        <article className="card admin-payment-card" key={payment.id}>
          <div>
            <div className="admin-payment-title">
              <h3>{payment.userName}</h3>
              <span className={`admin-status ${payment.status}`}>{payment.status}</span>
            </div>
            <p>{payment.userEmail}</p>
            <div className="admin-payment-meta">
              <span><b>Amount:</b> {payment.amountRwf.toLocaleString()} RWF</span>
              <span><b>Phone:</b> {payment.phone}</span>
              <span><b>Reference:</b> {payment.transactionReference}</span>
            </div>
            <small>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""}</small>
            {payment.adminNote && <div className="admin-note">{payment.adminNote}</div>}
          </div>

          {payment.status === "pending" ? (
            <div className="admin-payment-actions">
              <button className="button admin-approve" disabled={busyId === payment.id} onClick={() => updatePayment(payment.id, "approve")}>
                <CheckCircle2 size={16} /> Approve
              </button>
              <button className="button admin-reject" disabled={busyId === payment.id} onClick={() => updatePayment(payment.id, "reject")}>
                <XCircle size={16} /> Reject
              </button>
            </div>
          ) : (
            <div className="admin-verified">
              <Clock3 size={15} />
              {payment.status === "approved" ? "Payment approved and subscription activated." : "Payment rejected."}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
