"use client";
import { useState } from "react";
import { DS } from "./ds";
import { Icon, Avatar } from "./shared";

const NavTab = ({ item, active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: DS.radii.md, background: active ? DS.colors.accentDim : hov ? "rgba(255,255,255,0.04)" : "transparent", color: active ? DS.colors.accent : hov ? DS.colors.text : DS.colors.textMuted, border: active ? `1px solid rgba(78,155,111,0.3)` : "1px solid transparent", fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.2s", cursor: "pointer" }}>
      <Icon name={item.icon} size={14} />{item.label}
    </button>
  );
};

export const TopNav = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: "admin", label: "Admin Dashboard", icon: "settings" },
    { id: "addPerson", label: "Add Person", icon: "add" },
    { id: "relationships", label: "Relationships", icon: "link" },
    { id: "visualization", label: "Tree Visualization", icon: "tree" },
  ];
  return (
    <div style={{ height: 56, background: DS.colors.surface, borderBottom: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 0, position: "relative", zIndex: 100, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
        <div style={{ width: 32, height: 32, borderRadius: DS.radii.md, background: `linear-gradient(135deg, ${DS.colors.accentSoft}, ${DS.colors.accent})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: DS.shadows.accent }}>
          <Icon name="tree" size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: DS.fonts.display, fontWeight: 600, fontSize: 15, letterSpacing: "0.01em", lineHeight: 1 }}>Arboris</div>
          <div style={{ fontSize: 10, color: DS.colors.textMuted, letterSpacing: "0.08em" }}>FAMILY HERITAGE</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        {navItems.map(item => <NavTab key={item.id} item={item} active={activeView === item.id} onClick={() => setActiveView(item.id)} />)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: DS.colors.surfaceElevated, borderRadius: DS.radii.md, padding: "6px 12px", border: `1px solid ${DS.colors.surfaceBorder}` }}>
          <Icon name="search" size={14} color={DS.colors.textMuted} />
          <span style={{ color: DS.colors.textDim, fontSize: 12 }}>Quick search...</span>
          <span style={{ color: DS.colors.textDim, fontSize: 10, background: DS.colors.surfaceBorder, padding: "1px 6px", borderRadius: 4 }}>⌘K</span>
        </div>
        <Avatar name="Admin User" size={30} />
      </div>
    </div>
  );
};
