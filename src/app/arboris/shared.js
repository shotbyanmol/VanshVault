"use client";
import { useState } from "react";
import { DS } from "./ds";

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: ${DS.colors.bg}; --surface: ${DS.colors.surface};
      --surface-elevated: ${DS.colors.surfaceElevated}; --border: ${DS.colors.surfaceBorder};
      --accent: ${DS.colors.accent}; --accent-glow: ${DS.colors.accentGlow};
      --gold: ${DS.colors.gold}; --text: ${DS.colors.text};
      --text-muted: ${DS.colors.textMuted}; --text-dim: ${DS.colors.textDim};
    }
    body { background: var(--bg); color: var(--text); font-family: ${DS.fonts.body}; font-size: 14px; line-height: 1.6; overflow: hidden; height: 100vh; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }
    input, select, textarea {
      background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text);
      border-radius: ${DS.radii.md}; padding: 10px 14px; font-family: ${DS.fonts.body};
      font-size: 13px; outline: none; width: 100%; transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    input::placeholder { color: var(--text-dim); }
    button { cursor: pointer; border: none; outline: none; font-family: ${DS.fonts.body}; }
    .fade-in { animation: fadeIn 0.4s ease forwards; }
    .slide-up { animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
    @keyframes growBranch { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
    @keyframes glow { 0%,100% { box-shadow: 0 0 8px rgba(78,155,111,0.3); } 50% { box-shadow: 0 0 24px rgba(78,155,111,0.6); } }
  `}</style>
);

export const Btn = ({ children, variant = "default", size = "md", onClick, style = {}, disabled }) => {
  const [hov, setHov] = useState(false);
  const styles = {
    default: { background: hov ? DS.colors.surfaceElevated : DS.colors.surface, border: `1px solid ${hov ? DS.colors.accent : DS.colors.surfaceBorder}`, color: DS.colors.text },
    primary: { background: hov ? DS.colors.accentSoft : DS.colors.accent, border: "none", color: "#fff", boxShadow: hov ? DS.shadows.accent : "none" },
    ghost: { background: hov ? DS.colors.accentDim : "transparent", border: "none", color: hov ? DS.colors.accent : DS.colors.textMuted },
    danger: { background: hov ? "rgba(224,90,90,0.2)" : "transparent", border: `1px solid ${hov ? DS.colors.danger : DS.colors.surfaceBorder}`, color: DS.colors.danger },
    gold: { background: hov ? DS.colors.goldSoft : "transparent", border: `1px solid ${DS.colors.gold}`, color: DS.colors.gold },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "12px", borderRadius: DS.radii.sm },
    md: { padding: "9px 18px", fontSize: "13px", borderRadius: DS.radii.md },
    lg: { padding: "12px 24px", fontSize: "14px", borderRadius: DS.radii.md },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 500, transition: "all 0.2s", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...styles[variant], ...sizes[size], ...style }}>
      {children}
    </button>
  );
};

export const Badge = ({ children, color = "accent", style = {} }) => {
  const colors = {
    accent: { bg: DS.colors.accentDim, text: DS.colors.accent, border: "rgba(78,155,111,0.3)" },
    gold: { bg: DS.colors.goldSoft, text: DS.colors.gold, border: "rgba(201,168,76,0.3)" },
    danger: { bg: "rgba(224,90,90,0.1)", text: DS.colors.danger, border: "rgba(224,90,90,0.3)" },
    warn: { bg: "rgba(212,145,74,0.1)", text: DS.colors.warn, border: "rgba(212,145,74,0.3)" },
    dim: { bg: "rgba(255,255,255,0.04)", text: DS.colors.textMuted, border: DS.colors.surfaceBorder },
  };
  const c = colors[color];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: DS.radii.full, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: "11px", fontWeight: 600, letterSpacing: "0.03em", ...style }}>
      {children}
    </span>
  );
};

export const Avatar = ({ name, size = 36, photo, incomplete }) => {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const hue = (name?.charCodeAt(0) || 0) * 17 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: DS.radii.full, background: photo ? `url(${photo}) center/cover` : `linear-gradient(135deg, hsl(${hue},40%,25%), hsl(${hue},50%,35%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 600, color: "#fff", border: incomplete ? `2px dashed ${DS.colors.warn}` : `2px solid ${DS.colors.surfaceBorder}`, flexShrink: 0, position: "relative", overflow: "hidden", fontFamily: DS.fonts.display }}>
      {!photo && initials}
      {incomplete && (<div style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.35, height: size * 0.35, background: DS.colors.warn, borderRadius: "4px 0 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.2, color: "#fff" }}>!</div>)}
    </div>
  );
};

const ICONS = {
  person: "M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v1h20v-1c0-3.3-6.7-5-10-5z",
  tree: "M17 8C8 10 5.9 16.17 3.82 21L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 4-4 8-2 8-2-2 4-6 6-8 8-2 2-5 3-5 3 1.5-1.5 3-4 3-6 0 0-7 3-7 9 0 2 .5 4 2 5.5V20H2v2h20v-2h-2v-2c0-6.5-7-8-7-8s5-3 4-4z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  filter: "M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  warn: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  branch: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
  photo: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  chevron: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  zoom: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z",
  rotate: "M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
  highlight: "M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 000-1.41z",
  users: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96a7.08 7.08 0 00-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87a.49.49 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
};

export const Icon = ({ name, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color || "currentColor"}>
    {ICONS[name] && <path d={ICONS[name]} />}
  </svg>
);

export const SectionLabel = ({ children, style = {} }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: DS.colors.textMuted, ...style }}>{children}</div>
);

export const FormField = ({ label, children, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 500, color: DS.colors.textMuted }}>
      {label}{required && <span style={{ color: DS.colors.danger }}> *</span>}
    </label>
    {children}
  </div>
);
