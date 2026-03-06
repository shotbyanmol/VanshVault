"use client";
import { useState, useRef } from "react";
import { DS } from "./ds";
import { SAMPLE_FAMILY, ALL_MEMBERS } from "./data";
import { Btn, Badge, Avatar, Icon, SectionLabel, FormField } from "./shared";

const TreeNode = ({ x, y, person, isRoot, isLeaf, isSelected, isHovered, onHover, onSelect, searchFocus }) => {
  const isMatch = searchFocus && person.name.toLowerCase().includes(searchFocus.toLowerCase());
  const r = isRoot ? 28 : isLeaf ? 14 : 20;
  const color = isRoot ? DS.colors.gold : !person.isComplete ? DS.colors.warn : DS.colors.accent;
  const fillColor = isSelected ? DS.colors.info : isHovered ? color : `${color}CC`;
  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }} onClick={() => onSelect(person)} onMouseEnter={() => onHover(person.id)} onMouseLeave={() => onHover(null)}>
      {(isSelected || isMatch) && (
        <circle r={r + 10} fill="none" stroke={isSelected ? DS.colors.info : DS.colors.gold} strokeWidth="1.5" opacity="0.5" strokeDasharray="4,3">
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r={r} fill={fillColor} stroke={isSelected ? DS.colors.info : color} strokeWidth={isSelected ? 2.5 : 1.5} style={{ filter: (isHovered || isSelected) ? `drop-shadow(0 0 8px ${color}80)` : "none", transition: "all 0.2s" }} />
      {isRoot && (
        <>
          <circle r={r - 8} fill="none" stroke={DS.colors.gold} strokeWidth="1" opacity="0.6" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize="14" fill={DS.colors.bg} fontFamily={DS.fonts.display}>E</text>
        </>
      )}
      {!person.isComplete && !isRoot && <text x={r - 5} y={-(r - 5)} fontSize="10" fill={DS.colors.warn} fontWeight="700">!</text>}
      <text y={r + 14} textAnchor="middle" fontSize={isRoot ? 11 : 9} fontWeight={isSelected ? 700 : 500} fill={isSelected ? DS.colors.text : DS.colors.textMuted} fontFamily={DS.fonts.body} style={{ pointerEvents: "none" }}>{person.name?.split(" ")[0]}</text>
      {isRoot && <text y={r + 24} textAnchor="middle" fontSize={8} fill={DS.colors.textDim} fontFamily={DS.fonts.body}>{person.name?.split(" ").slice(1).join(" ")}</text>}
    </g>
  );
};

const PersonDetailPanel = ({ person, onClose }) => {
  const [tab, setTab] = useState("profile");
  const hue = (person.name?.charCodeAt(0) || 0) * 17 % 360;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }} className="slide-up">
      <div style={{ padding: "20px 20px 0", background: `linear-gradient(180deg, hsl(${hue},30%,12%) 0%, transparent 100%)`, borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar name={person.name} size={48} incomplete={!person.isComplete} />
            <div>
              <div style={{ fontFamily: DS.fonts.display, fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>{person.name}</div>
              <div style={{ color: DS.colors.textMuted, fontSize: 11, marginTop: 3 }}>Generation {person.generation + 1}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: DS.colors.textMuted, cursor: "pointer", padding: 4 }}><Icon name="close" size={16} /></button>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["profile","family","contact"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 14px", borderRadius: "6px 6px 0 0", fontSize: 12, fontWeight: tab === t ? 600 : 400, background: tab === t ? DS.colors.surfaceElevated : "transparent", color: tab === t ? DS.colors.text : DS.colors.textMuted, borderTop: tab === t ? `1px solid ${DS.colors.surfaceBorder}` : "none", borderLeft: tab === t ? `1px solid ${DS.colors.surfaceBorder}` : "none", borderRight: tab === t ? `1px solid ${DS.colors.surfaceBorder}` : "none", borderBottom: "none", cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {tab === "profile" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge color={person.isComplete ? "accent" : "warn"}>{person.isComplete ? "Complete" : "Incomplete"}</Badge>
              {person.role && <Badge color="dim">{person.role}</Badge>}
              {person.died && <Badge color="dim">Deceased</Badge>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Born", person.born], ["Died", person.died || "Living"], ["Location", person.location], ["Spouse", person.spouse || "—"], ["Children", person.children?.length || 0]].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: DS.colors.surfaceElevated, borderRadius: DS.radii.md }}>
                  <span style={{ color: DS.colors.textMuted, fontSize: 12 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "family" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {person.spouse && (
              <div>
                <div style={{ fontSize: 11, color: DS.colors.textMuted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Spouse</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: DS.colors.surfaceElevated, borderRadius: DS.radii.md }}>
                  <Avatar name={person.spouse} size={30} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{person.spouse}</div>
                    <Badge color="gold" style={{ marginTop: 2, fontSize: 10 }}>Spouse</Badge>
                  </div>
                </div>
              </div>
            )}
            {person.children?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: DS.colors.textMuted, marginBottom: 8, marginTop: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Children ({person.children.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {person.children.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: DS.colors.surfaceElevated, borderRadius: DS.radii.md }}>
                      <Avatar name={c.name} size={26} incomplete={!c.isComplete} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: DS.colors.textMuted }}>b. {c.born} · {c.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "contact" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "12px 14px", background: DS.colors.surfaceElevated, borderRadius: DS.radii.md, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="location" size={14} color={DS.colors.textMuted} />
              <span style={{ fontSize: 12 }}>{person.location || "No location"}</span>
            </div>
            <div style={{ color: DS.colors.textDim, fontSize: 12, textAlign: "center", padding: "12px 0" }}>Contact details are private</div>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", gap: 8 }}>
        <Btn variant="ghost" size="sm" style={{ flex: 1, justifyContent: "center" }}><Icon name="edit" size={12} /> Edit</Btn>
        <Btn variant="ghost" size="sm" style={{ flex: 1, justifyContent: "center" }}><Icon name="link" size={12} /> Links</Btn>
        <Btn variant="primary" size="sm" style={{ flex: 1, justifyContent: "center" }}><Icon name="eye" size={12} /> Focus</Btn>
      </div>
    </div>
  );
};

export const TreeVisualization = ({ selectedPerson, setSelectedPerson }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [hovLeaf, setHovLeaf] = useState(null);
  const [filter, setFilter] = useState({ gen: "all", branch: "all" });
  const [searchFocus, setSearchFocus] = useState("");
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const svgRef = useRef();

  return (
    <div style={{ display: "flex", height: "100%", position: "relative" }} className="fade-in">
      {/* Left sidebar */}
      <div style={{ width: 260, borderRight: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", flexDirection: "column", background: DS.colors.surface }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
          <div style={{ fontFamily: DS.fonts.display, fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Explore Tree</div>
          <input placeholder="Find a person..." value={searchFocus} onChange={e => setSearchFocus(e.target.value)} style={{ fontSize: 12 }} />
        </div>
        <div style={{ padding: 16, borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
          <SectionLabel style={{ marginBottom: 10 }}>Filters</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <FormField label="Generation">
              <select value={filter.gen} onChange={e => setFilter(p => ({ ...p, gen: e.target.value }))} style={{ fontSize: 12 }}>
                <option value="all">All Generations</option>
                {[0,1,2,3].map(g => <option key={g} value={g}>Generation {g + 1}</option>)}
              </select>
            </FormField>
            <FormField label="Branch">
              <select value={filter.branch} onChange={e => setFilter(p => ({ ...p, branch: e.target.value }))} style={{ fontSize: 12 }}>
                <option value="all">All Branches</option>
                <option>Weston Branch</option><option>Price Branch</option><option>Alderton Branch</option>
              </select>
            </FormField>
          </div>
        </div>
        <div style={{ padding: 16, borderBottom: `1px solid ${DS.colors.surfaceBorder}` }}>
          <SectionLabel style={{ marginBottom: 10 }}>Legend</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[{ color: DS.colors.gold, label: "Patriarch / Matriarch" }, { color: DS.colors.accent, label: "Complete Record" }, { color: DS.colors.warn, label: "Incomplete Record" }, { color: DS.colors.info, label: "Selected" }].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: DS.radii.full, background: color }} />
                <span style={{ fontSize: 11, color: DS.colors.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <SectionLabel style={{ marginBottom: 10 }}>Quick Stats</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[["Members", ALL_MEMBERS.length], ["Generations", 4], ["Branches", 3]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: DS.colors.surfaceElevated, borderRadius: DS.radii.sm }}>
                <span style={{ fontSize: 12, color: DS.colors.textMuted }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: DS.colors.accent }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center: tree canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: `radial-gradient(ellipse at center, #0D1710 0%, ${DS.colors.bg} 70%)` }}>
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {[{ icon: "zoom", label: "Zoom In", action: () => setZoom(z => Math.min(2, z + 0.2)) }, { icon: "search", label: "Zoom Out", action: () => setZoom(z => Math.max(0.4, z - 0.2)) }, { icon: "rotate", label: "Rotate", action: () => setRotation(r => (r + 45) % 360) }].map(({ icon, label, action }) => (
            <button key={label} onClick={action} title={label} style={{ width: 36, height: 36, borderRadius: DS.radii.md, background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: DS.colors.textMuted, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DS.colors.accent; e.currentTarget.style.color = DS.colors.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DS.colors.surfaceBorder; e.currentTarget.style.color = DS.colors.textMuted; }}>
              <Icon name={icon} size={16} />
            </button>
          ))}
          <div style={{ height: 1, background: DS.colors.surfaceBorder, margin: "2px 0" }} />
          <button onClick={() => { setZoom(1); setRotation(0); setPanOffset({ x: 0, y: 0 }); }} style={{ width: 36, height: 36, borderRadius: DS.radii.md, background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: DS.colors.textMuted, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>⊙</button>
        </div>

        <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 10, background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.md, padding: "6px 12px", fontSize: 11, color: DS.colors.textMuted }}>{Math.round(zoom * 100)}% zoom</div>
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10, background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.md, padding: "8px 12px", fontSize: 11, color: DS.colors.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: DS.radii.full, background: DS.colors.accent, animation: "pulse 2s infinite" }} />
          Interactive 2.5D Tree • Drag to pan
        </div>

        <svg ref={svgRef} width="100%" height="100%" viewBox="-400 -50 800 650" style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={e => { setIsDragging(true); setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }); }}
          onMouseMove={e => { if (isDragging && dragStart) setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
          onMouseUp={() => { setIsDragging(false); setDragStart(null); }}
          onMouseLeave={() => { setIsDragging(false); setDragStart(null); }}>
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(78,155,111,0.08)" /><stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7A5230" /><stop offset="100%" stopColor="#3D2010" />
            </linearGradient>
          </defs>
          <g transform={`translate(${panOffset.x},${panOffset.y}) scale(${zoom}) rotate(${rotation}, 0, 300)`}>
            <ellipse cx="0" cy="250" rx="350" ry="280" fill="url(#bgGlow)" />
            <ellipse cx="0" cy="580" rx="120" ry="18" fill="rgba(60,35,15,0.4)" />
            <path d="M -18 580 C -20 520, -12 450, -8 400 C -5 360, 2 320, 0 280 C -3 240, 8 200, 5 170" stroke="url(#trunkGrad)" strokeWidth="28" fill="none" strokeLinecap="round" />
            <TreeNode x={0} y={140} person={SAMPLE_FAMILY} isRoot isSelected={selectedPerson?.id === SAMPLE_FAMILY.id} isHovered={hovLeaf === SAMPLE_FAMILY.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
            {/* Branch 1 */}
            <path d="M 0 200 C -80 200, -150 250, -180 300" stroke="#6B4C38" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path d="M -180 300 C -200 320, -220 340, -210 370" stroke="#7A5230" strokeWidth="10" fill="none" strokeLinecap="round" />
            {SAMPLE_FAMILY.children[0] && <>
              <TreeNode x={-180} y={295} person={SAMPLE_FAMILY.children[0]} isSelected={selectedPerson?.id === SAMPLE_FAMILY.children[0].id} isHovered={hovLeaf === SAMPLE_FAMILY.children[0].id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
              {SAMPLE_FAMILY.children[0].children?.map((c, ci) => (
                <g key={c.id}>
                  <TreeNode x={-270 + ci * 90} y={355} person={c} isSelected={selectedPerson?.id === c.id} isHovered={hovLeaf === c.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                  {c.children?.map((gc, gci) => (
                    <g key={gc.id}>
                      <path d={`M ${-270 + ci * 90} 390 C ${-270 + ci * 90} 410, ${-290 + ci * 90 + gci * 60} 420, ${-290 + ci * 90 + gci * 60} 440`} stroke="#5A4030" strokeWidth="3" fill="none" />
                      <TreeNode x={-290 + ci * 90 + gci * 60} y={445} person={gc} isSelected={selectedPerson?.id === gc.id} isHovered={hovLeaf === gc.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} isLeaf />
                    </g>
                  ))}
                </g>
              ))}
            </>}
            {/* Branch 2 */}
            <path d="M 5 180 C 60 180, 120 220, 140 270" stroke="#6B4C38" strokeWidth="14" fill="none" strokeLinecap="round" />
            {SAMPLE_FAMILY.children[1] && <>
              <TreeNode x={145} y={265} person={SAMPLE_FAMILY.children[1]} isSelected={selectedPerson?.id === SAMPLE_FAMILY.children[1].id} isHovered={hovLeaf === SAMPLE_FAMILY.children[1].id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
              {SAMPLE_FAMILY.children[1].children?.map((c, ci) => (
                <g key={c.id}>
                  <path d={`M 145 300 C 145 320, ${120 + ci * 60} 335, ${120 + ci * 60} 360`} stroke="#5A4030" strokeWidth="4" fill="none" />
                  <TreeNode x={120 + ci * 60} y={362} person={c} isSelected={selectedPerson?.id === c.id} isHovered={hovLeaf === c.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                  {c.children?.map((gc, gci) => (
                    <g key={gc.id}>
                      <path d={`M ${120 + ci * 60} 395 L ${100 + ci * 60 + gci * 55} 435`} stroke="#5A4030" strokeWidth="2.5" fill="none" />
                      <TreeNode x={100 + ci * 60 + gci * 55} y={440} person={gc} isSelected={selectedPerson?.id === gc.id} isHovered={hovLeaf === gc.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} isLeaf />
                    </g>
                  ))}
                </g>
              ))}
            </>}
            {/* Branch 3 */}
            <path d="M 3 155 C 100 150, 200 180, 230 230" stroke="#6B4C38" strokeWidth="12" fill="none" strokeLinecap="round" />
            {SAMPLE_FAMILY.children[2] && <>
              <TreeNode x={238} y={228} person={SAMPLE_FAMILY.children[2]} isSelected={selectedPerson?.id === SAMPLE_FAMILY.children[2].id} isHovered={hovLeaf === SAMPLE_FAMILY.children[2].id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
              {SAMPLE_FAMILY.children[2].children?.map((c, ci) => (
                <g key={c.id}>
                  <path d={`M 238 265 C 238 285, ${200 + ci * 70} 300, ${200 + ci * 70} 325`} stroke="#5A4030" strokeWidth="4" fill="none" />
                  <TreeNode x={200 + ci * 70} y={328} person={c} isSelected={selectedPerson?.id === c.id} isHovered={hovLeaf === c.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} />
                  {c.children?.map((gc, gci) => (
                    <g key={gc.id}>
                      <path d={`M ${200 + ci * 70} 360 L ${185 + ci * 70 + gci * 40} 400`} stroke="#5A4030" strokeWidth="2.5" fill="none" />
                      <TreeNode x={185 + ci * 70 + gci * 40} y={405} person={gc} isSelected={selectedPerson?.id === gc.id} isHovered={hovLeaf === gc.id} onHover={setHovLeaf} onSelect={setSelectedPerson} searchFocus={searchFocus} isLeaf />
                    </g>
                  ))}
                </g>
              ))}
            </>}
            {[-60,-20,20,50,-40,30].map((x, i) => (
              <ellipse key={i} cx={x} cy={100 + i * 12} rx={18 + i * 4} ry={12 + i * 3} fill={`rgba(30,${60 + i * 8},35,0.4)`} />
            ))}
          </g>
        </svg>
      </div>

      {/* Right panel */}
      <div style={{ width: 300, borderLeft: `1px solid ${DS.colors.surfaceBorder}`, background: DS.colors.surface, display: "flex", flexDirection: "column" }}>
        {selectedPerson ? (
          <PersonDetailPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: DS.radii.full, background: DS.colors.surfaceElevated, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `1px solid ${DS.colors.surfaceBorder}` }}>
              <Icon name="person" size={28} color={DS.colors.textDim} />
            </div>
            <div style={{ fontFamily: DS.fonts.display, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No one selected</div>
            <div style={{ color: DS.colors.textMuted, fontSize: 12, lineHeight: 1.7 }}>Click any leaf or node on the tree to view their profile</div>
          </div>
        )}
      </div>
    </div>
  );
};
