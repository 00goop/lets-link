import React from "react";
import { Link } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", key: "Dashboard" },
  { to: "/parties", label: "Parties", key: "Parties" },
  { to: "/friends", label: "Friends", key: "Friends" },
  { to: "/create-party", label: "Create Party", key: "CreateParty" },
  { to: "/notifications", label: "Notifications", key: "Notifications" },
  { to: "/profile", label: "Profile", key: "Profile" },
];

const orb = (size, blur, top, left, colors) => ({
  position: "absolute",
  width: size,
  height: size,
  top,
  left,
  background: colors,
  filter: `blur(${blur})`,
  opacity: 0.45,
  borderRadius: "999px",
});

export default function Layout({ children, currentPageName }) {
  return (
    <div
      className="page-shell"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        aria-hidden
        style={orb(
          "420px",
          "120px",
          "-8%",
          "-12%",
          "radial-gradient(circle, rgba(178,132,255,0.8), transparent 65%)"
        )}
      />
      <div
        aria-hidden
        style={orb(
          "320px",
          "80px",
          "12%",
          "72%",
          "radial-gradient(circle, rgba(255,154,193,0.75), transparent 55%)"
        )}
      />
      <div
        aria-hidden
        style={orb(
          "260px",
          "90px",
          "70%",
          "-6%",
          "radial-gradient(circle, rgba(125,211,252,0.5), transparent 60%)"
        )}
      />

      <div className="glass-panel" style={{ position: "relative", zIndex: 1 }}>
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "18px",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background:
                  "linear-gradient(130deg, rgba(128,83,255,1), rgba(255,111,177,1))",
                display: "grid",
                placeItems: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "18px",
                boxShadow: "0 20px 35px rgba(128,83,255,0.35)",
              }}
            >
              LL
            </div>
            <div>
              <p
                className="brand-gradient"
                style={{ fontSize: "28px", fontWeight: 800, margin: 0 }}
              >
                Let&apos;s Link
              </p>
              <p style={{ margin: 0, color: "#475569", fontWeight: 500 }}>
                Plan. Vote. Rally.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="outline-button" type="button">
              Share Invite
            </button>
            <Link
              to="/create-party"
              className="gradient-button"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Create Party
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </header>

        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "32px",
            background: "rgba(255,255,255,0.6)",
            borderRadius: "999px",
            padding: "6px",
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {navItems.map((item) => {
            const isActive = currentPageName === item.key;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "10px 18px",
                  borderRadius: "999px",
                  background: isActive
                    ? "linear-gradient(120deg, rgba(128,83,255,0.95), rgba(255,111,177,0.95))"
                    : "transparent",
                  color: isActive ? "white" : "#475569",
                  boxShadow: isActive
                    ? "0 8px 20px rgba(128,83,255,0.35)"
                    : "none",
                  transition: "all 200ms ease",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main
          className="glass-surface"
          style={{
            padding: "32px clamp(16px, 4vw, 40px)",
            marginBottom: "28px",
          }}
        >
          {children}
        </main>

        <footer
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          Let&apos;s Link · Built for crews who love showing up together
        </footer>
      </div>
    </div>
  );
}
