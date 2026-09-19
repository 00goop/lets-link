import React, { useState } from "react";
import { Sparkles, Share2, CheckCircle, Calendar, MapPin } from "lucide-react";

export default function CreateParty() {
  const [name, setName] = useState("");
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [created, setCreated] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic input validation (React handles XSS protection)
    if (name.trim() && when.trim() && where.trim()) {
      setCreated({ name: name.trim(), when: when.trim(), where: where.trim() });
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }} className="animate-in stagger-1">
        <p className="section-heading brand-gradient">Create a party</p>
        <p className="section-subtitle">
          CTA gradients and glass inputs make the flow feel premium yet familiar.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-surface-static animate-in stagger-2"
        style={{ padding: "28px", borderRadius: "24px", marginBottom: "24px" }}
      >
        <FormField
          icon={<Sparkles size={14} />}
          label="Party name"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="Friday Night Out"
            required
            maxLength={100}
            autoComplete="off"
          />
        </FormField>

        <FormField
          icon={<Calendar size={14} />}
          label="When"
        >
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="form-input"
            placeholder="Friday - 7:30 PM"
            required
            maxLength={50}
            autoComplete="off"
          />
        </FormField>

        <FormField
          icon={<MapPin size={14} />}
          label="Where"
        >
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            className="form-input"
            placeholder="Downtown"
            required
            maxLength={100}
            autoComplete="off"
          />
        </FormField>

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button type="submit" className="gradient-button">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} />
              Create party
            </span>
          </button>
          <button type="button" className="outline-button">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Share2 size={14} />
              Share draft
            </span>
          </button>
        </div>
      </form>

      {/* Success State */}
      {created && (
        <div
          className="success-card glass-surface-static"
          style={{ padding: "24px", borderRadius: "20px" }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px"
          }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #34d399, #22d3d1)",
              display: "grid",
              placeItems: "center",
              color: "white"
            }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "18px", color: "#059669" }}>
                Party created!
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                Share the code with your friends
              </p>
            </div>
          </div>

          <div style={{
            display: "grid",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.7)",
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid rgba(74, 222, 128, 0.2)"
          }}>
            <InfoRow label="Name" value={created.name} />
            <InfoRow label="When" value={created.when} />
            <InfoRow label="Where" value={created.where} />
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ icon, label, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color: "#a855f7" }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{value}</span>
    </div>
  );
}
