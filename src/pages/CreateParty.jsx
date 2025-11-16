import React, { useState } from "react";

const fieldStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(226,232,240,0.8)",
  fontSize: "15px",
  background: "rgba(255,255,255,0.9)",
};

export default function CreateParty() {
  const [name, setName] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [created, setCreated] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setCreated({ name, when, where });
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p className="section-heading brand-gradient">Create a party</p>
        <p className="section-subtitle">
          CTA gradients and glass inputs make the flow feel premium yet familiar.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-surface"
        style={{ padding: "24px", borderRadius: "24px", marginBottom: "20px" }}
      >
        <FormField label="Party name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
            placeholder="Friday Night Out"
            required
          />
        </FormField>

        <FormField label="When">
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            style={fieldStyle}
            placeholder="Friday - 7:30 PM"
            required
          />
        </FormField>

        <FormField label="Where">
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            style={fieldStyle}
            placeholder="Downtown"
            required
          />
        </FormField>

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" className="gradient-button">
            Create party
          </button>
          <button type="button" className="outline-button">
            Share draft
          </button>
        </div>
      </form>

      {created && (
        <div className="glass-surface" style={{ padding: "20px", borderRadius: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>
            Party created (demo)
          </div>
          <p style={{ margin: "6px 0" }}>Name: {created.name}</p>
          <p style={{ margin: "6px 0" }}>When: {created.when}</p>
          <p style={{ margin: "6px 0" }}>Where: {created.where}</p>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "6px",
          letterSpacing: "0.04em",
          color: "#475569",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
