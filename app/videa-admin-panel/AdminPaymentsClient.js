"use client";

import { useState } from "react";

export default function AdminPaymentsClient({ initialPayments = [] }) {
  const [items, setItems] = useState(initialPayments);

  return (
    <section className="page">
      <div className="eyebrow">SECURE ADMIN PANEL</div>
      <h1>Subscription verification</h1>
      <p className="muted">Pending Creator subscription requests appear here for manual verification.</p>
      {items.length === 0 ? (
        <div className="card"><h3>No pending requests</h3><p className="muted">The queue is empty.</p></div>
      ) : (
        <div className="admin-payment-list">
          {items.map(item => (
            <article className="card admin-payment-card" key={item.id}>
              <h3>{item.name}</h3>
              <p className="muted">{item.email}</p>
              <p>Amount: <strong>{item.amountRwf?.toLocaleString()} RWF</strong></p>
              <p>Phone: <strong>{item.phone}</strong></p>
              <p>Reference: <strong>{item.transactionReference}</strong></p>
              <p className="muted">Verify this transaction in your mobile-money records before approving it.</p>
              <div className="admin-payment-actions">
                <button className="button" disabled>Approve after server verification</button>
                <button className="button secondary" disabled>Reject</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
