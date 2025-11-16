import React from "react";

const statCards = [
  {
    label: "Active Parties",
    value: "04",
    helper: "2 happening this week",
    accent: "linear-gradient(135deg, #a855f7, #fb7185)",
  },
  {
    label: "Invitations",
    value: "08",
    helper: "3 awaiting your response",
    accent: "linear-gradient(135deg, #38bdf8, #c084fc)",
  },
  {
    label: "Friend Activity",
    value: "17",
    helper: "pings in the last 24 hours",
    accent: "linear-gradient(135deg, #34d399, #facc15)",
  },
];

const statusClass = {
  Upcoming: "status-pill info",
  Planning: "status-pill warning",
  Confirmed: "status-pill success",
};

export default function Dashboard() {
  const upcomingParties = [
    {
      id: 1,
      name: "Friday Night Out",
      date: "Friday - 7:30 PM",
      location: "Downtown",
      status: "Confirmed",
    },
    {
      id: 2,
      name: "Study Session",
      date: "Saturday - 3:00 PM",
      location: "Library",
      status: "Upcoming",
    },
    {
      id: 3,
      name: "Brunch & Stroll",
      date: "Sunday - 11:00 AM",
      location: "East Village",
      status: "Planning",
    },
  ];

  const notifications = [
    {
      id: 1,
      title: "Alex",
      text: "invited you to Friday Night Out.",
      tone: "info",
    },
    {
      id: 2,
      title: "Jasmine",
      text: "joined Study Session. You're now 3/5.",
      tone: "success",
    },
    {
      id: 3,
      title: "Remy",
      text: "suggested a new meetup spot: City Rooftop.",
      tone: "warning",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <p className="section-heading brand-gradient">Dashboard</p>
        <p className="section-subtitle">
          Bright cues show which parties need love, attention, or a quick rally.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            Create Party
          </button>
          <button className="outline-button" type="button">
            Send Request
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="glass-surface"
            style={{
              padding: "20px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: stat.accent,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              *
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>{stat.label}</p>
            <p style={{ margin: "4px 0", fontSize: "32px", fontWeight: 800 }}>{stat.value}</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="card-stack two-column">
        <section className="glass-surface" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Upcoming parties</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                Bright status pills guide who needs a poke.
              </p>
            </div>
            <span className="status-pill info">3 active</span>
          </div>

          {upcomingParties.map((party) => (
            <div
              key={party.id}
              style={{
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid rgba(226,232,240,0.9)",
                marginBottom: "12px",
                background: "#fff",
                boxShadow: "0 15px 30px rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "16px" }}>{party.name}</p>
                  <p style={{ margin: "4px 0", color: "#475569", fontSize: "13px" }}>{party.date}</p>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                    Location - {party.location}
                  </p>
                </div>
                <span className={statusClass[party.status] ?? "status-pill info"}>
                  {party.status}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="glass-surface" style={{ padding: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
            Notifications
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px", marginBottom: "14px" }}>
            Hover-friendly cards keep things lively.
          </p>

          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                marginBottom: "10px",
                padding: "14px",
                borderRadius: "14px",
                background:
                  notification.tone === "success"
                    ? "rgba(74,222,128,0.15)"
                    : notification.tone === "warning"
                    ? "rgba(251,191,36,0.18)"
                    : "rgba(59,130,246,0.12)",
                color: "#0f172a",
                border: "1px solid rgba(226,232,240,0.6)",
              }}
            >
              <strong>{notification.title}</strong> {notification.text}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
