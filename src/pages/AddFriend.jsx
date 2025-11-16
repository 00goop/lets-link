import React, { useState } from "react";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(226,232,240,0.8)",
  fontSize: "15px",
  background: "rgba(255,255,255,0.9)",
};

export default function AddFriend() {
  const [username, setUsername] = useState("");
  const [sentTo, setSentTo] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSentTo(username);
    setUsername("");
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p className="section-heading brand-gradient">Add friend</p>
        <p className="section-subtitle">
          Gradient primary + outline secondary keeps the hierarchy very obvious.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-surface"
        style={{ padding: "24px", borderRadius: "24px", marginBottom: "20px" }}
      >
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{ display: "block", fontSize: "13px", marginBottom: "6px", fontWeight: 600 }}
          >
            Friend&apos;s username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alex123"
            style={inputStyle}
            required
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" className="gradient-button">
            Send request
          </button>
          <button type="button" className="outline-button">
            Share invite link
          </button>
        </div>
      </form>

      {sentTo && (
        <div className="glass-surface" style={{ padding: "18px", borderRadius: "18px" }}>
          Friend request sent (demo) to <strong>{sentTo}</strong>.
        </div>
      )}
    </div>
  );
}
