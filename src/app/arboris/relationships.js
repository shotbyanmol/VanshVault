"use client";
import { useState } from "react";
import { DS } from "./ds";
import { ALL_MEMBERS } from "./data";
import { Btn, Badge, Avatar, Icon } from "./shared";

const RelCard = ({ person, type }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: DS.colors.surface, borderRadius: DS.radii.md, border: `1px solid ${DS.colors.surfaceBorder}` }}>
    <Avatar name={person.name} size={28} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 500 }}>{person.name}</div>
      <div style={{ fontSize: 10, color: DS.colors.textMuted }}>{type}</div>
    </div>
    <Badge color="dim" style={{ fontSize: 10 }}>{type}</Badge>
  </div>
);

export const RelationshipEditor = () => {
  const [selected, setSelected] = useState(null);
  const [relType, setRelType] = useState("parent-child");
  const relTypes = ["parent-child", "spouse", "sibling", "step-parent"];

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }} className="fade-in">
      {/* Left: member list */}
      <div style={{ width: 280, borderRight: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
          <div style={{ fontFamily: DS.fonts.display, fontWeight: 600, marginBottom: 12 }}>Family Members</div>
          <input placeholder="Search..." style={{ fontSize: 12 }} />
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {ALL_MEMBERS.map(m => (
            <div key={m.id} onClick={() => setSelected(m)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", background: selected?.id === m.id ? DS.colors.accentDim : "transparent", borderLeft: selected?.id === m.id ? `3px solid ${DS.colors.accent}` : "3px solid transparent", transition: "all 0.15s" }}>
              <Avatar name={m.name} size={28} incomplete={!m.isComplete} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                <div style={{ fontSize: 10, color: DS.colors.textMuted }}>Gen {m.generation + 1}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center: canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <h2 style={{ fontFamily: DS.fonts.display, fontSize: 20, fontWeight: 600 }}>Relationship Editor</h2>
          <p style={{ color: DS.colors.textMuted, fontSize: 13 }}>Drag members together to create relationships</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {relTypes.map(r => <Btn key={r} variant={relType === r ? "primary" : "default"} size="sm" onClick={() => setRelType(r)}>{r.replace("-", " ")}</Btn>)}
        </div>
        <div style={{ position: "relative", width: "100%", maxWidth: 560, height: 300, background: DS.colors.surface, borderRadius: DS.radii.xl, border: `1px solid ${DS.colors.surfaceBorder}` }}>
          <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={DS.colors.accent} stopOpacity="0.8" />
                <stop offset="100%" stopColor={DS.colors.gold} stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path d="M 120 150 C 200 100, 360 200, 440 150" stroke="url(#lineGrad)" strokeWidth="2" fill="none" strokeDasharray="6,4" />
          </svg>
          <div style={{ position: "absolute", left: 40, top: "50%", transform: "translateY(-50%)", textAlign: "center" }}>
            <div style={{ animation: "float 3s ease-in-out infinite" }}>
              <Avatar name={selected?.name || "Person A"} size={64} incomplete={selected && !selected.isComplete} />
            </div>
            <div style={{ marginTop: 8, fontWeight: 500, fontSize: 12 }}>{selected?.name || "Select person"}</div>
            <div style={{ color: DS.colors.textMuted, fontSize: 10 }}>{selected ? `Gen ${selected.generation + 1}` : ""}</div>
          </div>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: DS.colors.surfaceElevated, border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.lg, padding: "8px 16px", fontSize: 12, color: DS.colors.accent, fontWeight: 600 }}>{relType}</div>
          <div style={{ position: "absolute", right: 40, top: "50%", transform: "translateY(-50%)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: DS.radii.full, border: `2px dashed ${DS.colors.surfaceBorder}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "float 3s ease-in-out infinite 1.5s" }}>
              <Icon name="add" size={24} color={DS.colors.textDim} />
            </div>
            <div style={{ marginTop: 8, color: DS.colors.textDim, fontSize: 12 }}>Drop here</div>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <Btn variant="primary" disabled={!selected}><Icon name="link" size={14} /> Create Relationship</Btn>
        </div>
      </div>

      {/* Right: existing connections */}
      <div style={{ width: 260, borderLeft: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
          <div style={{ fontFamily: DS.fonts.display, fontWeight: 600, fontSize: 14 }}>{selected ? `${selected.name}'s Links` : "Connections"}</div>
        </div>
        <div style={{ padding: 16, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {selected ? (
            <>
              {selected.children?.length > 0 && selected.children.map(c => <RelCard key={c.id} person={c} type="Child" />)}
              {selected.spouse && <RelCard person={{ name: selected.spouse }} type="Spouse" />}
              {!selected.children?.length && !selected.spouse && <div style={{ color: DS.colors.textDim, fontSize: 12, textAlign: "center", padding: 20 }}>No relationships yet</div>}
            </>
          ) : (
            <div style={{ color: DS.colors.textDim, fontSize: 12, textAlign: "center", padding: 20 }}>Select a member to view connections</div>
          )}
        </div>
      </div>
    </div>
  );
};
