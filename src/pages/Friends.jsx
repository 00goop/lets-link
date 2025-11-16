import React from "react";

const friends = [
  { name: "Alex", status: "Online", vibe: "Ready for late night plans" },
  { name: "Jasmine", status: "Offline", vibe: "Studying until 9 PM" },
  { name: "Chris", status: "Online", vibe: "Available after 6 PM" },
];

const badgeTone = {
  Online: "status-pill success",
  Offline: "status-pill warning",
};

export default function Friends() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p className="section-heading brand-gradient">Friends</p>
        <p className="section-subtitle">
          Color-coded presence indicators make it obvious who is around to rally.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            Add Friend
          </button>
          <button className="outline-button" type="button">
            Share Invite Link
          </button>
        </div>
      </div>

      <div className="card-stack">
        {friends.map((friend) => (
          <div
            key={friend.name}
            className="glass-surface"
            style={{
              padding: "18px",
              borderRadius: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{friend.name}</p>
              <p style={{ margin: "6px 0", color: "#64748b", fontSize: "14px" }}>{friend.vibe}</p>
            </div>
            <span className={badgeTone[friend.status] ?? "status-pill info"}>
              {friend.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
