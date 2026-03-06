"use client";
import { useState } from "react";
import { DS } from "./ds";
import { ALL_MEMBERS } from "./data";
import { Btn, Badge, Avatar, Icon, SectionLabel, FormField } from "./shared";

export const AdminDashboard = ({ setActiveView, setSelectedPerson }) => {
  const [searchQ, setSearchQ] = useState("");
  const [filterGen, setFilterGen] = useState("all");
  const [filterComplete, setFilterComplete] = useState("all");

  const filtered = ALL_MEMBERS.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchQ.toLowerCase());
    const matchGen = filterGen === "all" || m.generation === parseInt(filterGen);
    const matchComplete = filterComplete === "all" || (filterComplete === "complete" && m.isComplete) || (filterComplete === "incomplete" && !m.isComplete);
    return matchSearch && matchGen && matchComplete;
  });

  const stats = [
    { label: "Total Members", value: ALL_MEMBERS.length, icon: "users", color: DS.colors.accent },
    { label: "Generations", value: 4, icon: "tree", color: DS.colors.gold },
    { label: "Incomplete Records", value: ALL_MEMBERS.filter(m => !m.isComplete).length, icon: "warn", color: DS.colors.warn },
    { label: "Branches", value: 3, icon: "branch", color: DS.colors.info },
  ];

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 24 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: DS.fonts.display, fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em" }}>Family Registry</h1>
          <p style={{ color: DS.colors.textMuted, marginTop: 4 }}>Manage all family members, relationships and branches</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="default" onClick={() => setActiveView("relationships")}><Icon name="link" size={14} /> Manage Relations</Btn>
          <Btn variant="primary" onClick={() => setActiveView("addPerson")}><Icon name="add" size={14} /> Add Person</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {stats.map((s, i) => (
          <div key={i} className="slide-up" style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.lg, padding: "18px 20px", animationDelay: `${i * 0.08}s`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 0 0 80px", background: `${s.color}08` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: DS.colors.textMuted, fontSize: 12, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: DS.fonts.display, color: s.color }}>{s.value}</div>
              </div>
              <div style={{ color: s.color, opacity: 0.7 }}><Icon name={s.icon} size={20} /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.lg, overflow: "hidden", flex: 1 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <input placeholder="Search members..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <select value={filterGen} onChange={e => setFilterGen(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Generations</option>
            {[0,1,2,3].map(g => <option key={g} value={g}>Generation {g + 1}</option>)}
          </select>
          <select value={filterComplete} onChange={e => setFilterComplete(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Records</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <Badge color="dim">{filtered.length} records</Badge>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: DS.colors.surfaceElevated }}>
                {["Member","Generation","Location","Born / Died","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: DS.colors.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => <MemberRow key={m.id} member={m} i={i} setSelectedPerson={setSelectedPerson} setActiveView={setActiveView} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MemberRow = ({ member: m, setSelectedPerson, setActiveView }) => {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? DS.colors.surfaceElevated : "transparent", transition: "background 0.15s", cursor: "pointer" }}
      onClick={() => setSelectedPerson(m)}>
      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={m.name} size={34} incomplete={!m.isComplete} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div>
            {m.spouse && <div style={{ color: DS.colors.textMuted, fontSize: 11 }}>♡ {m.spouse}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
        <Badge color={["gold","accent","dim","dim"][m.generation]}>Gen {m.generation + 1}</Badge>
      </td>
      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.surfaceBorder}`, color: DS.colors.textMuted, fontSize: 12 }}>{m.location || "—"}</td>
      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.surfaceBorder}`, fontSize: 12, color: DS.colors.textMuted }}>{m.born}{m.died ? ` – ${m.died}` : ""}</td>
      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
        {m.isComplete ? <Badge color="accent"><Icon name="check" size={10} /> Complete</Badge> : <Badge color="warn"><Icon name="warn" size={10} /> Incomplete</Badge>}
      </td>
      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
        <div style={{ display: "flex", gap: 4 }}>
          <Btn size="sm" variant="ghost"><Icon name="edit" size={12} /> Edit</Btn>
          <Btn size="sm" variant="ghost"><Icon name="link" size={12} /></Btn>
          <Btn size="sm" variant="ghost"><Icon name="eye" size={12} /></Btn>
        </div>
      </td>
    </tr>
  );
};
