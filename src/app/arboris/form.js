"use client";
import { useState } from "react";
import { DS } from "./ds";
import { ALL_MEMBERS } from "./data";
import { Btn, Badge, Avatar, Icon, SectionLabel, FormField } from "./shared";

const RelationshipPreview = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <Avatar name="Elias Thornwood" size={36} />
    <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${DS.colors.accent}, transparent)`, position: "relative" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 10, color: DS.colors.accent, background: DS.colors.surfaceElevated, padding: "2px 6px", borderRadius: 4 }}>child of</div>
    </div>
    <div style={{ width: 36, height: 36, borderRadius: DS.radii.full, border: `2px dashed ${DS.colors.accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: DS.colors.accent, fontSize: 20 }}>+</div>
  </div>
);

export const AddPersonForm = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ firstName: "", lastName: "", birthDate: "", deathDate: "", location: "", phone: "", email: "", role: "", notes: "", isIncomplete: false, branch: "", parentId: "", spouseId: "" });
  const [saved, setSaved] = useState(false);
  const steps = [{ label: "Personal", icon: "person" }, { label: "Contact", icon: "link" }, { label: "Relations", icon: "branch" }, { label: "Review", icon: "check" }];
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  return (
    <div style={{ padding: 28, maxWidth: 800, margin: "0 auto", overflowY: "auto", height: "100%" }} className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: DS.fonts.display, fontSize: 26, fontWeight: 600 }}>Add Family Member</h1>
        <p style={{ color: DS.colors.textMuted, marginTop: 4 }}>Enter details for the new family member</p>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32, background: DS.colors.surface, borderRadius: DS.radii.lg, padding: 6, border: `1px solid ${DS.colors.surfaceBorder}` }}>
        {steps.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: DS.radii.md, cursor: "pointer", background: step === i ? DS.colors.accentDim : "transparent", color: step === i ? DS.colors.accent : i < step ? DS.colors.textMuted : DS.colors.textDim, border: step === i ? `1px solid rgba(78,155,111,0.3)` : "1px solid transparent", transition: "all 0.2s", fontSize: 13, fontWeight: step === i ? 600 : 400 }}>
            <div style={{ width: 22, height: 22, borderRadius: DS.radii.full, background: i < step ? DS.colors.accent : step === i ? "rgba(78,155,111,0.2)" : DS.colors.surfaceElevated, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i < step ? "#fff" : step === i ? DS.colors.accent : DS.colors.textMuted }}>
              {i < step ? <Icon name="check" size={12} color="#fff" /> : i + 1}
            </div>
            {s.label}
          </div>
        ))}
      </div>

      <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.lg, padding: 28 }}>
        {step === 0 && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionLabel>Personal Information</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="First Name" required><input value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="e.g. Margaret" /></FormField>
              <FormField label="Last Name" required><input value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="e.g. Thornwood" /></FormField>
              <FormField label="Date of Birth"><input type="date" value={form.birthDate} onChange={e => update("birthDate", e.target.value)} /></FormField>
              <FormField label="Date of Death (if applicable)"><input type="date" value={form.deathDate} onChange={e => update("deathDate", e.target.value)} /></FormField>
            </div>
            <FormField label="Location / Hometown"><input value={form.location} onChange={e => update("location", e.target.value)} placeholder="e.g. Yorkshire, England" /></FormField>
            <FormField label="Role / Title in Family">
              <select value={form.role} onChange={e => update("role", e.target.value)}>
                <option value="">Select role...</option>
                <option>Patriarch</option><option>Matriarch</option><option>Parent</option><option>Child</option><option>Sibling</option>
              </select>
            </FormField>
            <FormField label="Notes / Biography">
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Short biography or notes..." rows={4} style={{ resize: "vertical" }} />
            </FormField>
            <FormField label="Photo">
              <div style={{ border: `2px dashed ${DS.colors.surfaceBorder}`, borderRadius: DS.radii.lg, padding: 28, textAlign: "center", color: DS.colors.textMuted, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = DS.colors.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = DS.colors.surfaceBorder}>
                <Icon name="photo" size={28} color={DS.colors.textDim} />
                <div style={{ marginTop: 8, fontSize: 13 }}>Drop photo here or <span style={{ color: DS.colors.accent }}>browse</span></div>
                <div style={{ fontSize: 11, color: DS.colors.textDim, marginTop: 4 }}>PNG, JPG up to 10MB</div>
              </div>
            </FormField>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: DS.colors.surfaceElevated, borderRadius: DS.radii.md }}>
              <div onClick={() => update("isIncomplete", !form.isIncomplete)} style={{ width: 42, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", background: form.isIncomplete ? DS.colors.warn : DS.colors.surfaceBorder, transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: form.isIncomplete ? 20 : 2, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left 0.2s" }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Mark as Incomplete / Lead Record</div>
                <div style={{ color: DS.colors.textMuted, fontSize: 11 }}>Enable if full details are not yet available</div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionLabel>Contact Information</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Phone Number"><input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+44 xxx xxx xxxx" /></FormField>
              <FormField label="Email Address"><input value={form.email} onChange={e => update("email", e.target.value)} placeholder="name@example.com" /></FormField>
            </div>
            <SectionLabel>Location Details</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <FormField label="City"><input placeholder="London" /></FormField>
              <FormField label="Country"><input placeholder="United Kingdom" /></FormField>
              <FormField label="Postal Code"><input placeholder="SW1A 1AA" /></FormField>
            </div>
            <div style={{ background: DS.colors.accentDim, border: `1px solid rgba(78,155,111,0.3)`, borderRadius: DS.radii.md, padding: 14, display: "flex", gap: 10 }}>
              <Icon name="location" size={16} color={DS.colors.accent} />
              <div style={{ fontSize: 12, color: DS.colors.accent }}>Contact information is kept private and only visible to administrators.</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionLabel>Family Relationships</SectionLabel>
            <FormField label="Parent in Tree">
              <select value={form.parentId} onChange={e => update("parentId", e.target.value)}>
                <option value="">Select parent...</option>
                {ALL_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name} (Gen {m.generation + 1})</option>)}
              </select>
            </FormField>
            <FormField label="Spouse / Partner">
              <select value={form.spouseId} onChange={e => update("spouseId", e.target.value)}>
                <option value="">Select spouse...</option>
                {ALL_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </FormField>
            <FormField label="Family Branch">
              <select value={form.branch} onChange={e => update("branch", e.target.value)}>
                <option value="">Assign to branch...</option>
                <option>Thornwood-Weston Branch</option><option>Thornwood-Price Branch</option>
                <option>Thornwood-Alderton Branch</option><option>New Branch</option>
              </select>
            </FormField>
            <div style={{ padding: 16, background: DS.colors.surfaceElevated, borderRadius: DS.radii.md }}>
              <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 12, fontWeight: 600 }}>Relationship Preview</div>
              <RelationshipPreview />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionLabel>Review & Save</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Full Name", form.firstName + " " + form.lastName || "Not set"], ["Date of Birth", form.birthDate || "Not set"], ["Location", form.location || "Not set"], ["Role", form.role || "Not set"], ["Phone", form.phone || "Not set"], ["Email", form.email || "Not set"]].map(([k, v]) => (
                <div key={k} style={{ background: DS.colors.surfaceElevated, borderRadius: DS.radii.md, padding: "12px 14px" }}>
                  <div style={{ color: DS.colors.textMuted, fontSize: 11, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>
            {saved && (
              <div className="slide-up" style={{ background: DS.colors.accentDim, border: `1px solid rgba(78,155,111,0.4)`, borderRadius: DS.radii.md, padding: "14px 18px", display: "flex", gap: 10, alignItems: "center" }}>
                <Icon name="check" size={16} color={DS.colors.accent} />
                <span style={{ color: DS.colors.accent, fontWeight: 500 }}>Member saved successfully!</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Btn variant="default" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>← Back</Btn>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost">Save Draft</Btn>
          {step < 3 ? <Btn variant="primary" onClick={() => setStep(step + 1)}>Continue →</Btn> : <Btn variant="primary" onClick={handleSave}><Icon name="check" size={14} /> Save Member</Btn>}
        </div>
      </div>
    </div>
  );
};
