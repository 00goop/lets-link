import React from "react";
import { UserPlus, Share2 } from "lucide-react";

const friends = [
  { name: "Alex", status: "Online", vibe: "Ready for late night plans" },
  { name: "Jasmine", status: "Offline", vibe: "Studying until 9 PM" },
  { name: "Chris", status: "Online", vibe: "Available after 6 PM" },
  { name: "Morgan", status: "Online", vibe: "Down for anything spontaneous" },
];

const getInitials = (name) => {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
};

const getAvatarGradient = (name) => {
  const gradients = [
    "linear-gradient(135deg, #a855f7, #ec4899)",
    "linear-gradient(135deg, #38bdf8, #818cf8)",
    "linear-gradient(135deg, #34d399, #22d3d1)",
    "linear-gradient(135deg, #fb7185, #fbbf24)",
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
};

export default function Friends() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }} className="animate-in stagger-1">
        <p className="section-heading brand-gradient">Friends</p>
        <p className="section-subtitle">
          Color-coded presence indicators make it obvious who is around to rally.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserPlus size={16} />
              Add Friend
            </span>
          </button>
          <button className="outline-button" type="button">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Share2 size={14} />
              Share Invite Link
            </span>
          </button>
        </div>
      </div>

      {/* Friends List */}
      <div className="card-stack">
        {friends.map((friend, index) => (
          <div
            key={friend.name}
            className={`friend-card animate-in stagger-${index + 2}`}
          >
            {/* Avatar + Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Avatar with presence */}
              <div style={{ position: "relative" }}>
                <div
                  className="avatar"
                  style={{
                    width: "52px",
                    height: "52px",
                    fontSize: "18px",
                    background: getAvatarGradient(friend.name),
                  }}
                >
                  {getInitials(friend.name)}
                </div>
                {/* Presence Dot */}
                <div
                  className={`presence-dot ${friend.status.toLowerCase()}`}
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    border: "2px solid white",
                  }}
                />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                  {friend.name}
                </p>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                  {friend.vibe}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={friend.status === "Online" ? "status-pill success" : "status-pill warning"}>
              <span
                className={`presence-dot ${friend.status.toLowerCase()}`}
                style={{ width: "6px", height: "6px" }}
              />
              {friend.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
