import React from "react";

export default function PartyDetails() {
  const details = {
    name: "Friday Night Out",
    location: "Downtown",
    time: "Friday - 7:30 PM",
    people: "Alex, Jasmine, You, and 2 others.",
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p className="section-heading brand-gradient">Party details</p>
        <p className="section-subtitle">
          Glass cards + gradients keep important callouts bold without overwhelming.
        </p>
      </div>

      <div className="glass-surface" style={{ padding: "24px", borderRadius: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{details.name}</h2>
        <p style={{ margin: "10px 0", color: "#475569" }}>{details.location}</p>
        <p style={{ margin: "6px 0", color: "#475569" }}>{details.time}</p>
        <p style={{ margin: "6px 0", color: "#475569" }}>{details.people}</p>
      </div>

      <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "16px" }}>
        In your real version, this page would show polls, shared photos, live location, and the
        member list.
      </p>
    </div>
  );
}
