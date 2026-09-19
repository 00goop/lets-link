import React from "react";
import { Sparkles, Mail, Activity, Calendar, MapPin } from "lucide-react";

const statCards = [
  {
    label: "Active Parties",
    value: "04",
    helper: "2 happening this week",
    accent: "linear-gradient(135deg, #a855f7, #fb7185)",
    icon: Calendar,
  },
  {
    label: "Invitations",
    value: "08",
    helper: "3 awaiting your response",
    accent: "linear-gradient(135deg, #38bdf8, #c084fc)",
    icon: Mail,
  },
  {
    label: "Friend Activity",
    value: "17",
    helper: "pings in the last 24 hours",
    accent: "linear-gradient(135deg, #34d399, #facc15)",
    icon: Activity,
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
      emoji: "🎉",
    },
    {
      id: 2,
      name: "Study Session",
      date: "Saturday - 3:00 PM",
      location: "Library",
      status: "Upcoming",
      emoji: "📚",
    },
    {
      id: 3,
      name: "Brunch & Stroll",
      date: "Sunday - 11:00 AM",
      location: "East Village",
      status: "Planning",
      emoji: "🥐",
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
      {/* Header Section */}
      <div style={{ marginBottom: "32px" }} className="animate-in stagger-1">
        <p className="section-heading brand-gradient">Dashboard</p>
        <p className="section-subtitle">
          Bright cues show which parties need love, attention, or a quick rally.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} />
              Create Party
            </span>
          </button>
          <button className="outline-button" type="button">
            Send Request
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "18px",
          marginBottom: "36px",
        }}
      >
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.label}
              className={`stat-card animate-in stagger-${index + 1}`}
            >
              <div
                className="stat-icon"
                style={{ background: stat.accent }}
              >
                <IconComponent size={24} strokeWidth={2.5} />
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                {stat.label}
              </p>
              <p style={{ margin: "6px 0 4px", fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {stat.value}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                {stat.helper}
              </p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="card-stack two-column">
        {/* Upcoming Parties Section */}
        <section className="glass-surface-static animate-in stagger-3" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                Upcoming parties
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                Bright status pills guide who needs a poke.
              </p>
            </div>
            <span className="status-pill info">3 active</span>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {upcomingParties.map((party, index) => (
              <div
                key={party.id}
                className={`party-card animate-in-right stagger-${index + 2}`}
                style={{ padding: "18px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "28px" }}>{party.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "16px" }}>
                        {party.name}
                      </p>
                      <p style={{ margin: "4px 0", color: "#475569", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={12} /> {party.date}
                      </p>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={12} /> {party.location}
                      </p>
                    </div>
                  </div>
                  <span className={statusClass[party.status] ?? "status-pill info"}>
                    {party.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications Section */}
        <section className="glass-surface-static animate-in stagger-4" style={{ padding: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
            Notifications
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px", marginBottom: "18px" }}>
            Hover-friendly cards keep things lively.
          </p>

          <div style={{ display: "grid", gap: "12px" }}>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`notification-card ${notification.tone} animate-in-right stagger-${index + 2}`}
              >
                <p style={{ margin: 0, fontSize: "14px" }}>
                  <strong style={{ color: "#0f172a" }}>{notification.title}</strong>{" "}
                  <span style={{ color: "#475569" }}>{notification.text}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
