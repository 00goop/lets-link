import React from "react";
import { Edit, Share2, MapPin, Heart, Sparkles } from "lucide-react";

const user = {
  name: "Demo User",
  username: "demo_user",
  bio: "I like planning things with friends.",
  location: "New York, NY",
  interests: "Food, music, movies",
};

export default function Profile() {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }} className="animate-in stagger-1">
        <p className="section-heading brand-gradient">Profile</p>
        <p className="section-subtitle">
          Glass panels keep details legible while the gradients set a vibrant vibe.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="gradient-button" type="button">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Edit size={16} />
              Edit Profile
            </span>
          </button>
          <button className="outline-button" type="button">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Share2 size={14} />
              Share Card
            </span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div
        className="glass-surface-static animate-in-scale stagger-2"
        style={{ padding: "28px", borderRadius: "24px" }}
      >
        {/* Avatar + Name Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
          <div
            className="avatar glow"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #a855f7, #fb7185)",
              fontSize: "30px",
            }}
          >
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "24px", letterSpacing: "-0.01em" }}>
              {user.name}
            </p>
            <p style={{ margin: "6px 0 0", color: "#7c3aed", fontSize: "15px", fontWeight: 500 }}>
              @{user.username}
            </p>
          </div>
        </div>

        {/* Profile Fields */}
        <div style={{ display: "grid", gap: "14px" }}>
          <ProfileRow
            icon={<Sparkles size={16} />}
            label="Bio"
            value={user.bio}
            delay={3}
          />
          <ProfileRow
            icon={<MapPin size={16} />}
            label="Location"
            value={user.location}
            delay={4}
          />
          <ProfileRow
            icon={<Heart size={16} />}
            label="Interests"
            value={user.interests}
            delay={5}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value, delay }) {
  return (
    <div className={`profile-row animate-in-right stagger-${delay}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ color: "#a855f7" }}>{icon}</span>
        <p style={{
          margin: 0,
          color: "#64748b",
          fontSize: "11px",
          textTransform: "uppercase",
          fontWeight: 700,
          letterSpacing: "0.08em"
        }}>
          {label}
        </p>
      </div>
      <p style={{ margin: 0, fontSize: "16px", fontWeight: 500, color: "#1e293b" }}>
        {value}
      </p>
    </div>
  );
}
