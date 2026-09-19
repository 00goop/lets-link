import React from "react";

const notifications = [
  { id: 1, text: "Alex invited you to Friday Night Out.", tone: "info" },
  { id: 2, text: "Jasmine replied: \"I'm in!\"", tone: "success" },
  { id: 3, text: "Chris suggested changing the time to 8 PM.", tone: "warning" },
];

const toneStyle = {
  info: "status-pill info",
  success: "status-pill success",
  warning: "status-pill warning",
};

export default function Notifications() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p className="section-heading brand-gradient">Notifications</p>
        <p className="section-subtitle">
          Color-coded badges instantly communicate urgency and next steps.
        </p>
      </div>

      <div className="card-stack">
        {notifications.map((note) => (
          <div
            key={note.id}
            className="glass-surface"
            style={{ padding: "18px", borderRadius: "18px", display: "flex", gap: "16px" }}
          >
            <span className={toneStyle[note.tone] ?? "status-pill info"}>{note.tone}</span>
            <p style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
