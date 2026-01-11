import React from "react";
import { Users, Share2, Bell, Sparkles } from "lucide-react";

const statusBadge = {
  Upcoming: "status-pill info",
  Past: "status-pill warning",
  Planning: "status-pill success",
};

const partyData = [
  {
    name: "Friday Night Out",
    status: "Upcoming",
    people: 5,
    vibe: "Neon Karaoke + Drinks",
    emoji: "🎤",
  },
  {
    name: "Study Session",
    status: "Upcoming",
    people: 3,
    vibe: "Library grind then bubble tea",
    emoji: "📚",
  },
  {
    name: "Last Week Hangout",
    status: "Past",
    people: 7,
    vibe: "Sunset picnic + playlists",
    emoji: "🌅",
  },
];

export default function Parties() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }} className="animate-in stagger-1">
        <p className="section-heading brand-gradient">Parties</p>
        <p className="section-subtitle">
          Bright gradient cards highlight where momentum lives. Filter with one tap.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} />
              Create Party
            </span>
          </button>
          <button className="outline-button" type="button">
            Share Location
          </button>
        </div>
      </div>

      {/* Party Cards */}
      <div className="card-stack">
        {partyData.map((party, index) => (
          <div
            key={party.name}
            className={`party-card animate-in stagger-${index + 2}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              {/* Party Emoji */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "28px",
                  flexShrink: 0,
                }}
              >
                {party.emoji}
              </div>

              <div>
                <p style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                  {party.name}
                </p>
                <p style={{ margin: "6px 0 14px", color: "#475569", fontSize: "14px" }}>
                  {party.vibe}
                </p>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <span className={statusBadge[party.status] ?? "status-pill info"}>
                    {party.status}
                  </span>
                  <span style={{
                    fontSize: "13px",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <Users size={14} />
                    {party.people} people
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
              <button className="gradient-button" type="button" style={{ padding: "10px 18px", fontSize: "13px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Share2 size={14} />
                  Share Update
                </span>
              </button>
              <button className="outline-button" type="button" style={{ padding: "10px 18px", fontSize: "13px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Bell size={14} />
                  Remind
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
