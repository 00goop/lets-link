import React from "react";

const user = {
  name: "Demo User",
  username: "demo_user",
  bio: "I like planning things with friends.",
  location: "New York, NY",
  interests: "Food, music, movies",
};

export default function Profile() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p className="section-heading brand-gradient">Profile</p>
        <p className="section-subtitle">
          Glass panels keep details legible while the gradients set a vibrant vibe.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            Edit Profile
          </button>
          <button className="outline-button" type="button">
            Share Card
          </button>
        </div>
      </div>

      <div className="glass-surface" style={{ padding: "24px", borderRadius: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #a855f7, #fb7185)",
              color: "white",
              fontWeight: 700,
              fontSize: "28px",
              display: "grid",
              placeItems: "center",
            }}
          >
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "20px" }}>{user.name}</p>
            <p style={{ margin: "4px 0", color: "#64748b" }}>@{user.username}</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <ProfileRow label="Bio" value={user.bio} />
          <ProfileRow label="Location" value={user.location} />
          <ProfileRow label="Interests" value={user.interests} />
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "16px",
        border: "1px solid rgba(226,232,240,0.7)",
        background: "rgba(255,255,255,0.8)",
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: "16px", fontWeight: 500 }}>{value}</p>
    </div>
  );
}
