import React from "react";

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
  },
  {
    name: "Study Session",
    status: "Upcoming",
    people: 3,
    vibe: "Library grind then bubble tea",
  },
  {
    name: "Last Week Hangout",
    status: "Past",
    people: 7,
    vibe: "Sunset picnic + playlists",
  },
];

export default function Parties() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p className="section-heading brand-gradient">Parties</p>
        <p className="section-subtitle">
          Bright gradient cards highlight where momentum lives. Filter with one tap.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            Create Party
          </button>
          <button className="outline-button" type="button">
            Share Location
          </button>
        </div>
      </div>

      <div className="card-stack">
        {partyData.map((party) => (
          <div
            key={party.name}
            className="glass-surface"
            style={{
              padding: "20px",
              borderRadius: "22px",
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{party.name}</p>
              <p style={{ margin: "6px 0 12px", color: "#475569", fontSize: "14px" }}>
                {party.vibe}
              </p>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span className={statusBadge[party.status] ?? "status-pill info"}>
                  {party.status}
                </span>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  {party.people} people in
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="gradient-button" type="button">
                Share Update
              </button>
              <button className="outline-button" type="button">
                Send Reminder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
