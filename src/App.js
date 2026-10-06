import { resolveQr } from './qr';
import Membership, { MembershipLookup, currentPackage, membershipAction } from "./Membership";
import { useState, useEffect, useRef } from "react";

// ── SUPABASE CONFIG ───────────────────────────────────────────────
import { supabase, SUPABASE_URL, SUPABASE_KEY } from "./authClient";

async function sb(method, table, body, query = "") {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Inicia sesión para continuar.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${session.access_token}`,
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const db = {
  getPacientes: () => sb("GET", "pacientes", null, "?order=nombre.asc"),
  createPaciente: (p) => sb("POST", "pacientes", p),
  updatePaciente: (id, p) => sb("PATCH", "pacientes", p, `?id=eq.${id}`),
  getSesiones: (pid) => sb("GET", "sesiones", null, `?paciente_id=eq.${pid}&order=num.asc`),
  createSesion: (s) => sb("POST", "sesiones", s),
  getLabs: (pid) => sb("GET", "laboratorios", null, `?paciente_id=eq.${pid}&order=fecha.desc`),
  createLab: (l) => sb("POST", "laboratorios", l),
};

// ── Color tokens ──────────────────────────────────────────────────
const C = {
  bg: "#0d1117", surface: "#161b22", card: "#1c2330", border: "#2a3441",
  accent: "#00d4aa", accentDim: "#00d4aa22", warn: "#f59e0b",
  danger: "#ef4444", ok: "#22c55e", text: "#e6edf3", muted: "#7d8590", label: "#a0aab4",
  purple: "#a78bfa", purpleDim: "#a78bfa22",
};

const S = {
  app: { fontFamily: "'DM Sans', sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex" },
  sidebar: { width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "28px 0 20px", flexShrink: 0 },
  logo: { padding: "0 20px 28px", borderBottom: `1px solid ${C.border}`, marginBottom: 16 },
  logoText: { fontSize: 20, fontWeight: 700, color: C.accent, letterSpacing: "-0.5px" },
  logoSub: { fontSize: 11, color: C.muted, marginTop: 2, letterSpacing: 1 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", cursor: "pointer", background: active ? C.accentDim : "transparent", borderLeft: `3px solid ${active ? C.accent : "transparent"}`, color: active ? C.accent : C.label, fontSize: 13.5, fontWeight: active ? 600 : 400, transition: "all 0.15s" }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: { padding: "16px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface },
  pageTitle: { fontSize: 17, fontWeight: 600, color: C.text },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px" },
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 14, letterSpacing: 0.5, textTransform: "uppercase" },
  grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }),
  label: { fontSize: 11.5, color: C.muted, marginBottom: 4, display: "block", letterSpacing: 0.3 },
  input: { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 72 },
  select: { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 13, outline: "none" },
  btn: (variant = "primary") => ({ padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: variant === "primary" ? C.accent : variant === "danger" ? C.danger : C.border, color: variant === "primary" ? "#0d1117" : C.text, transition: "opacity 0.15s" }),
  badge: (color) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "22", color: color, border: `1px solid ${color}44` }),
  statBox: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px" },
  statVal: { fontSize: 22, fontWeight: 700, color: C.accent, lineHeight: 1 },
  statLabel: { fontSize: 11.5, color: C.muted, marginTop: 4 },
  tag: (ok) => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: ok ? C.ok : C.danger, background: ok ? C.ok + "18" : C.danger + "18", border: `1px solid ${ok ? C.ok : C.danger}44`, borderRadius: 12, padding: "2px 8px" }),
};

function Field({ label, children }) {
  return <div><span style={S.label}>{label}</span>{children}</div>;
}

function Sparkline({ values, color = C.accent, height = 40, width = 120 }) {
  if (!values || values.length < 2) return <span style={{ color: C.muted, fontSize: 11 }}>—</span>;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (width - 4) + 2},${height - 4 - ((v - min) / range) * (height - 8)}`).join(" ");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={width} height={height}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /><circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="3" fill={color} /></svg>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{values[values.length - 1]}</span>
    </div>
  );
}

const LAB_RANGES = {
  glucosa: [70, 100, "mg/dL"], urea: [10, 50, "mg/dL"], creatinina: [0.5, 1.2, "mg/dL"],
  col_total: [0, 200, "mg/dL"], hdl: [40, 999, "mg/dL"], ldl: [0, 130, "mg/dL"],
  trigliceridos: [0, 150, "mg/dL"], tgo: [0, 40, "U/L"], tgp: [0, 41, "U/L"],
  hba1c: [0, 5.7, "%"], homa_ir: [0, 2.5, ""], hemoglobina: [12, 17, "g/dL"],
  leucocitos: [4500, 11000, "/µL"], plaquetas: [150000, 400000, "/µL"],
};

const LAB_LABELS = {
  glucosa: "Glucosa", urea: "Urea", creatinina: "Creatinina", col_total: "Col. Total",
  hdl: "HDL", ldl: "LDL", trigliceridos: "Triglicéridos", tgo: "TGO", tgp: "TGP",
  hba1c: "HbA1c", homa_ir: "HOMA-IR", hemoglobina: "Hemoglobina", leucocitos: "Leucocitos", plaquetas: "Plaquetas",
};

function labStatus(key, val) {
  const r = LAB_RANGES[key];
  if (!r) return "ok";
  return val < r[0] || val > r[1] ? "danger" : "ok";
}

// ── MEMBRESÍA CONSTANTS ───────────────────────────────────────────
const PLAN_LABELS = { sin_plan: "Sin membresía", plus: "Plus" };
const PLAN_COLORS = { sin_plan: C.muted, plus: C.purple };

// ── MEMBRESÍA TAB (dentro de paciente) ───────────────────────────
// ── VISTA GLOBAL DE MEMBRESÍAS ────────────────────────────────────
function MembresiasView({ patients, onSelectPatient, onUpdate }) {
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

  const real = patients.filter(p => p.nombre !== "test");

  const stats = {
    total: real.length,
    conPlan: real.filter(p => p.plan && p.plan !== "sin_plan").length,
    sinPlan: real.filter(p => !p.plan || p.plan === "sin_plan").length,
    alerta: real.filter(p => p.plan && p.plan !== "sin_plan" && Math.max(0, (p.apps_total || 0) - (p.apps_usadas || 0)) <= 1).length,
  };

  let list = real.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));
  if (filter === "con_plan") list = list.filter(p => p.plan && p.plan !== "sin_plan");
  if (filter === "sin_plan") list = list.filter(p => !p.plan || p.plan === "sin_plan");
  if (filter === "alerta") list = list.filter(p => p.plan && p.plan !== "sin_plan" && Math.max(0, (p.apps_total || 0) - (p.apps_usadas || 0)) <= 1);

  const chips = [
    { key: "todos", label: "Todos" },
    { key: "con_plan", label: "Con membresía" },
    { key: "sin_plan", label: "Sin plan" },
    { key: "alerta", label: "⚠ Por agotar" },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={{ ...S.grid(4), marginBottom: 20 }}>
        {[
          ["Total pacientes", stats.total, C.accent],
          ["Con membresía", stats.conPlan, C.ok],
          ["Sin plan", stats.sinPlan, C.muted],
          ["Apps por agotar", stats.alerta, stats.alerta > 0 ? C.warn : C.muted],
        ].map(([lbl, val, color]) => (
          <div key={lbl} style={{ ...S.statBox, borderColor: color + "44" }}>
            <div style={{ ...S.statVal, color }}>{val}</div>
            <div style={S.statLabel}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {chips.map(c => (
            <button key={c.key} onClick={() => setFilter(c.key)} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${filter === c.key ? C.accent : C.border}`, background: filter === c.key ? C.accentDim : "transparent", color: filter === c.key ? C.accent : C.muted, fontWeight: filter === c.key ? 600 : 400 }}>
              {c.label}
            </button>
          ))}
        </div>
        <input style={{ ...S.input, flex: 1, minWidth: 180 }} placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {list.map(p => {
          const plan = p.plan || "sin_plan";
          const color = PLAN_COLORS[plan];
          const rest = Math.max(0, (p.apps_total || 0) - (p.apps_usadas || 0));
          const total = p.apps_total || 0;
          const used = p.apps_usadas || 0;
          const isAlerta = plan !== "sin_plan" && rest <= 1;

          return (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p)}
              style={{ ...S.card, cursor: "pointer", borderColor: isAlerta ? (rest === 0 ? C.danger + "88" : C.warn + "88") : C.border, borderLeft: `3px solid ${isAlerta ? (rest === 0 ? C.danger : C.warn) : color}`, marginBottom: 0, transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color + "88"}
              onMouseLeave={e => e.currentTarget.style.borderColor = isAlerta ? (rest === 0 ? C.danger + "88" : C.warn + "88") : C.border}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, lineHeight: 1.3 }}>{p.nombre}</div>
              <span style={S.badge(color)}>{PLAN_LABELS[plan]}</span>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontFamily: "monospace" }}>{p.dosis_actual || "2.5"} mg</div>
              {plan !== "sin_plan" && total > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 5 }}>
                    {Array.from({ length: total }, (_, i) => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < used ? C.border : color }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: rest === 0 ? C.danger : rest <= 1 ? C.warn : C.muted, fontWeight: rest <= 1 ? 600 : 400 }}>
                    {rest === 0 ? "Sin apps restantes" : `${rest} de ${total} restantes`}
                  </div>
                </div>
              )}
              {plan === "sin_plan" && <div style={{ fontSize: 11, color: C.muted, marginTop: 8, fontStyle: "italic" }}>Click para asignar plan</div>}
            </div>
          );
        })}
      </div>
      {list.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>No hay pacientes que coincidan.</div>}
    </div>
  );
}

// ── AI Lab Reader ─────────────────────────────────────────────────
function AILabReader({ onExtracted }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file || !preview) return;
    setLoading(true);
    try {
      const base64 = preview.split(",")[1];
      const isPdf = file.type === "application/pdf";
      const prompt = `Eres un asistente médico especializado en lectura de laboratorios clínicos en México.
Analiza este resultado y extrae los valores. Responde SOLO con JSON válido sin texto adicional:
{"glucosa":null,"urea":null,"creatinina":null,"col_total":null,"hdl":null,"ldl":null,"trigliceridos":null,"tgo":null,"tgp":null,"hba1c":null,"homa_ir":null,"hemoglobina":null,"leucocitos":null,"plaquetas":null,"notas_lab":""}`;
      const contentArr = isPdf
        ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }, { type: "text", text: prompt }]
        : [{ type: "image", source: { type: "base64", media_type: file.type, data: base64 } }, { type: "text", text: prompt }];
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: contentArr }] }),
      });
      const data = await resp.json();
      const text = data.content.map((b) => b.text || "").join("");
      onExtracted(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err) { alert("Error al procesar el archivo."); }
    setLoading(false);
  };

  return (
    <div style={{ ...S.card, borderColor: C.accent + "44", background: C.accentDim }}>
      <div style={S.cardTitle}>📄 Leer laboratorio con IA</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: "none" }} />
        <button style={S.btn("secondary")} onClick={() => fileRef.current.click()}>📁 {file ? file.name : "Seleccionar archivo"}</button>
        {file && <button style={S.btn("primary")} onClick={analyze} disabled={loading}>{loading ? "⏳ Analizando..." : "✨ Extraer valores"}</button>}
      </div>
      {preview && file?.type?.startsWith("image") && <img src={preview} alt="lab" style={{ marginTop: 10, maxHeight: 160, borderRadius: 6, opacity: 0.8 }} />}
    </div>
  );
}

// ── Lab Form ──────────────────────────────────────────────────────
function LabForm({ pacienteId, onSave, onCancel }) {
  const [vals, setVals] = useState({ fecha: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { paciente_id: pacienteId, ...vals };
      Object.keys(LAB_LABELS).forEach(k => { if (payload[k] === "" || payload[k] === undefined) payload[k] = null; else if (payload[k] !== null) payload[k] = parseFloat(payload[k]) || null; });
      const result = await db.createLab(payload);
      onSave(result[0]);
    } catch (e) { alert("Error al guardar: " + e.message); }
    setSaving(false);
  };

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Nuevo Laboratorio</div>
      <AILabReader onExtracted={(data) => setVals((p) => ({ ...p, ...data }))} />
      <div style={{ ...S.grid(2), marginBottom: 14 }}>
        <Field label="Fecha"><input style={S.input} type="date" value={vals.fecha || ""} onChange={(e) => set("fecha", e.target.value)} /></Field>
      </div>
      <div style={{ ...S.grid(3), marginBottom: 14 }}>
        {Object.keys(LAB_LABELS).map((k) => {
          const r = LAB_RANGES[k];
          const val = vals[k];
          const status = val !== undefined && val !== null && val !== "" ? labStatus(k, parseFloat(val)) : null;
          return (
            <Field key={k} label={`${LAB_LABELS[k]}${r ? ` (${r[2]})` : ""}`}>
              <div style={{ position: "relative" }}>
                <input style={{ ...S.input, borderColor: status === "danger" ? C.danger : status === "ok" ? C.ok : C.border }} type="number" step="0.01" value={vals[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
                {status && <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>{status === "danger" ? "⚠️" : "✓"}</span>}
              </div>
              {r && <span style={{ fontSize: 10, color: C.muted }}>Ref: {r[0]}–{r[1] === 999 ? ">" + r[0] : r[1]}</span>}
            </Field>
          );
        })}
      </div>
      <Field label="Notas"><textarea style={{ ...S.textarea, marginBottom: 14 }} value={vals.notas_lab || ""} onChange={(e) => set("notas_lab", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
        <button style={S.btn("secondary")} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Session Form ──────────────────────────────────────────────────
// InBody en sesiones impares (1, 3, 5...) — desde la primera
function SessionForm({ pacienteId, num, onSave, onCancel, patient, onUpdatePatient }) {
  const pendingRequest = useRef(null);
  const savingLock = useRef(false);
  const isInBody = num % 2 !== 0;
  const [vals, setVals] = useState({ fecha: new Date().toISOString().split("T")[0], num, inbody_realizado: isInBody, evento_adverso: false, malestar_gi: false, ajuste_dosis: false, adherencia: "Buena", dosis_mounjaro: "2.5mg" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const isPlus = patient?.plan === "plus";
  const appsRestantes = isPlus ? Math.max(0, (patient?.apps_total || 4) - (patient?.apps_usadas || 0)) : null;

  const handleSave = async () => {
    if (savingLock.current) return;
    savingLock.current = true;
    setSaving(true);
    try {
      const payload = { paciente_id: pacienteId, ...vals };
      ["peso_kg", "cintura_cm", "cadera_cm", "inbody_musculo", "inbody_grasa", "inbody_grasa_visceral"].forEach(k => {
        if (payload[k] !== undefined && payload[k] !== "") payload[k] = parseFloat(payload[k]) || null;
        else payload[k] = null;
      });
      payload.inbody_agua = null;
      if (!pendingRequest.current) {
        const pack = await currentPackage(pacienteId);
        pendingRequest.current = { id: crypto.randomUUID(), packId: pack?.id || null, payload };
      }
      const pending = pendingRequest.current;
      const result = await membershipAction(pacienteId, 'sesion', pending.packId, pending.id, pending.payload);
      pendingRequest.current = null;
      onUpdatePatient && onUpdatePatient(result.paciente);
      onSave(result.sesion);
    } catch (e) { if (e.code) pendingRequest.current = null; alert("Error al guardar: " + e.message + (e.code ? "" : ". Si fue un problema de conexión, reintenta sin cambiar los datos.")); }
    savingLock.current = false;
    setSaving(false);
  };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={S.cardTitle}>Sesión #{num}</div>
        {isInBody && <span style={S.badge(C.accent)}>📊 InBody + mediciones</span>}
        {!isInBody && <span style={{ fontSize: 12, color: C.muted }}>Solo seguimiento</span>}
      </div>

      {/* Aviso plan Plus */}
      {isPlus && (
        <div style={{ ...S.card, background: appsRestantes === 0 ? C.danger + "18" : appsRestantes === 1 ? C.warn + "18" : C.purple + "11", borderColor: appsRestantes === 0 ? C.danger + "66" : appsRestantes === 1 ? C.warn + "66" : C.purple + "44", marginBottom: 14, padding: "10px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: appsRestantes === 0 ? C.danger : appsRestantes === 1 ? C.warn : C.purple }}>
            {appsRestantes === 0 ? "⚠ Plan agotado — renueva antes de registrar otra aplicación" : appsRestantes === 1 ? `⚠ Última aplicación del plan Plus — avisar al paciente` : `💳 Plan Plus · ${appsRestantes} aplicaciones restantes → al guardar quedará ${appsRestantes - 1}`}
          </div>
        </div>
      )}

      {/* Siempre visible */}
      <div style={{ ...S.grid(3), marginBottom: 14 }}>
        <Field label="Fecha"><input style={S.input} type="date" value={vals.fecha} onChange={(e) => set("fecha", e.target.value)} /></Field>
        <Field label="Peso (kg)"><input style={S.input} type="number" step="0.1" value={vals.peso_kg || ""} onChange={(e) => set("peso_kg", e.target.value)} /></Field>
        <Field label="Adherencia">
          <select style={S.select} value={vals.adherencia} onChange={(e) => set("adherencia", e.target.value)}>
            {["Muy buena", "Buena", "Regular", "Mala"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ ...S.grid(2), marginBottom: 14 }}>
        <Field label="💉 Dosis Mounjaro">
          <select style={{ ...S.select, borderColor: C.accent + "88", color: C.accent, fontWeight: 600 }} value={vals.dosis_mounjaro || "2.5mg"} onChange={(e) => set("dosis_mounjaro", e.target.value)}>
            {["1.5mg (introducción)", "2.5mg", "5mg", "7.5mg", "10mg"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </div>

      {/* Solo en sesiones InBody (impares) */}
      {isInBody && (
        <div style={{ ...S.card, background: C.surface, marginBottom: 14, borderColor: C.accent + "44" }}>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginBottom: 12 }}>📊 InBody + Mediciones antropométricas</div>
          <div style={{ ...S.grid(2), marginBottom: 12 }}>
            <Field label="Cintura (cm)"><input style={S.input} type="number" step="0.1" value={vals.cintura_cm || ""} onChange={(e) => set("cintura_cm", e.target.value)} /></Field>
            <Field label="Cadera (cm)"><input style={S.input} type="number" step="0.1" value={vals.cadera_cm || ""} onChange={(e) => set("cadera_cm", e.target.value)} /></Field>
          </div>
          <div style={S.grid(3)}>
            <Field label="MME — Masa Muscular Esq. (kg)"><input style={S.input} type="number" step="0.1" value={vals.inbody_musculo || ""} onChange={(e) => set("inbody_musculo", e.target.value)} /></Field>
            <Field label="Masa Grasa Corporal (kg)"><input style={S.input} type="number" step="0.1" value={vals.inbody_grasa || ""} onChange={(e) => set("inbody_grasa", e.target.value)} /></Field>
            <Field label="Grasa Visceral (nivel)"><input style={S.input} type="number" step="1" min="1" value={vals.inbody_grasa_visceral || ""} onChange={(e) => set("inbody_grasa_visceral", e.target.value)} /></Field>
          </div>
        </div>
      )}

      {/* Síntomas / efectos secundarios unificados */}
      <div style={{ ...S.card, background: C.surface, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 12 }}>Síntomas y efectos secundarios</div>
        <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" checked={vals.evento_adverso || vals.malestar_gi} onChange={(e) => { set("evento_adverso", e.target.checked); set("malestar_gi", e.target.checked); }} />
            ⚠️ Presentó síntomas / efectos secundarios
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" checked={vals.ajuste_dosis} onChange={(e) => set("ajuste_dosis", e.target.checked)} />
            💊 Ajuste de dosis
          </label>
        </div>
        {(vals.evento_adverso || vals.malestar_gi) && (
          <Field label="Describir síntomas (GI, náuseas, estreñimiento, otros)">
            <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ej: náuseas leves, estreñimiento..." value={vals.tipo_ea || vals.tipo_gi || ""} onChange={(e) => { set("tipo_ea", e.target.value); set("tipo_gi", e.target.value); }} />
          </Field>
        )}
        {vals.ajuste_dosis && (
          <Field label="Nota de ajuste">
            <input style={{ ...S.input, marginTop: 10 }} value={vals.nota_ajuste || ""} onChange={(e) => set("nota_ajuste", e.target.value)} />
          </Field>
        )}
      </div>

      <Field label="Notas de sesión"><textarea style={{ ...S.textarea, marginBottom: 14 }} value={vals.notas || ""} onChange={(e) => set("notas", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar sesión"}</button>
        <button style={S.btn("secondary")} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Patient Form ──────────────────────────────────────────────────
function PatientForm({ patient, onSave, onCancel }) {
  const [vals, setVals] = useState(patient || { fecha_ingreso: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...vals };
      if (payload.edad) payload.edad = parseInt(payload.edad);
      delete payload.sesiones; delete payload.laboratorios;
      ["plan", "apps_total", "apps_usadas", "fecha_inicio_plan", "id", "created_at"].forEach(k => delete payload[k]);
      let result;
      if (patient?.id) { result = await db.updatePaciente(patient.id, payload); }
      else { result = await db.createPaciente(payload); }
      onSave({ ...result[0], sesiones: patient?.sesiones || [], laboratorios: patient?.laboratorios || [] });
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const sections = [
    { title: "Datos Generales", fields: [["nombre", "Nombre completo", "text"], ["edad", "Edad", "number"], ["sexo", "Sexo", "select", ["F", "M"]], ["telefono", "Teléfono", "text"], ["email", "Email", "email"], ["fecha_ingreso", "Fecha de ingreso", "date"]] },
    { title: "Clínico", fields: [["diagnostico", "Diagnóstico principal", "textarea"], ["motivo_consulta", "Motivo de consulta", "textarea"], ["alergias", "Alergias", "text"], ["medicamentos", "Medicamentos actuales", "textarea"]] },
    { title: "Antecedentes", fields: [["ant_heredofam", "Heredofamiliares", "textarea"], ["ant_patologicos", "Patológicos", "textarea"]] },
    { title: "Hábitos", fields: [["hab_sueno", "Sueño", "text"], ["hab_ejercicio", "Ejercicio", "text"], ["hab_alcohol", "Alcohol", "text"], ["hab_tabaco", "Tabaco", "text"]] },
  ];

  return (
    <div>
      {sections.map((sec) => (
        <div key={sec.title} style={S.card}>
          <div style={S.cardTitle}>{sec.title}</div>
          <div style={S.grid(2)}>
            {sec.fields.map(([k, lbl, type, opts]) => (
              <Field key={k} label={lbl}>
                {type === "textarea" ? <textarea style={S.textarea} value={vals[k] || ""} onChange={(e) => set(k, e.target.value)} />
                  : type === "select" ? <select style={S.select} value={vals[k] || ""} onChange={(e) => set(k, e.target.value)}>{opts.map(o => <option key={o}>{o}</option>)}</select>
                  : <input style={S.input} type={type} value={vals[k] || ""} onChange={(e) => set(k, e.target.value)} />}
              </Field>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : patient ? "Guardar cambios" : "Crear paciente"}</button>
        <button style={S.btn("secondary")} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Patient Detail ────────────────────────────────────────────────
function PatientDetail({ patient, onUpdate, onBack, initialTab = "resumen" }) {
  const [tab, setTab] = useState(initialTab);
  const [sesiones, setSesiones] = useState([]);
  const [labs, setLabs] = useState([]);
  const [addSession, setAddSession] = useState(false);
  const [addLab, setAddLab] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localPatient, setLocalPatient] = useState(patient);

  useEffect(() => {
    Promise.all([db.getSesiones(patient.id), db.getLabs(patient.id)])
      .then(([s, l]) => { setSesiones(s); setLabs(l); })
      .finally(() => setLoading(false));
  }, [patient.id]);

  const lastSesion = sesiones[sesiones.length - 1];
  const dosisActual = lastSesion?.dosis_mounjaro || null;
  const semanasEnDosis = dosisActual ? [...sesiones].reverse().findIndex(s => s.dosis_mounjaro !== dosisActual) : 0;
  const semanasMostrar = semanasEnDosis === -1 ? sesiones.length : semanasEnDosis;
  const weightVals = sesiones.map(s => parseFloat(s.peso_kg)).filter(Boolean);
  const cinturaVals = sesiones.map(s => parseFloat(s.cintura_cm)).filter(Boolean);
  const lastLab = labs[0];
  const planColor = PLAN_COLORS[localPatient.plan || "sin_plan"];

  const handleMembresiaSave = (updated) => {
    setLocalPatient(updated);
    onUpdate(updated);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <button style={{ ...S.btn("secondary"), padding: "6px 12px" }} onClick={onBack}>← Volver</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{localPatient.nombre}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{localPatient.edad} años · {localPatient.sexo === "F" ? "Femenino" : "Masculino"} · Ingreso: {localPatient.fecha_ingreso}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={S.badge(planColor)}>{PLAN_LABELS[localPatient.plan || "sin_plan"]}</span>
          <span style={S.badge(C.accent)}>{localPatient.diagnostico?.split(",")[0]}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {["resumen", "membresía", "sesiones", "laboratorios", "perfil"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === t ? C.accent : "transparent"}`, color: tab === t ? C.accent : C.muted, padding: "8px 16px", cursor: "pointer", fontWeight: tab === t ? 600 : 400, fontSize: 13, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {loading && <div style={{ color: C.muted, padding: 20 }}>Cargando datos...</div>}

      {!loading && tab === "resumen" && (
        <div>
          <div style={S.grid(5)}>
            {[["Dosis actual", dosisActual ? dosisActual + " — " + semanasMostrar + " sem" : "—"], ["Sesiones", sesiones.length], ["Último peso", weightVals.length ? `${weightVals[weightVals.length - 1]} kg` : "—"], ["Última cintura", cinturaVals.length ? `${cinturaVals[cinturaVals.length - 1]} cm` : "—"], ["Labs registrados", labs.length]].map(([lbl, val]) => (
              <div key={lbl} style={S.statBox}><div style={S.statVal}>{val}</div><div style={S.statLabel}>{lbl}</div></div>
            ))}
          </div>
          {/* Membresía mini-card en resumen */}
          {localPatient.plan && localPatient.plan !== "sin_plan" && (
            <div style={{ ...S.card, borderColor: planColor + "55", background: planColor + "11", marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Membresía</div>
                  <div style={{ fontWeight: 600, color: planColor }}>{PLAN_LABELS[localPatient.plan]}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 3, justifyContent: "flex-end", marginBottom: 4 }}>
                    {Array.from({ length: localPatient.apps_total || 0 }, (_, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < (localPatient.apps_usadas || 0) ? C.border : planColor }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>{Math.max(0, (localPatient.apps_total || 0) - (localPatient.apps_usadas || 0))} apps restantes</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ ...S.grid(2), marginTop: 16 }}>
            <div style={S.card}><div style={S.cardTitle}>Evolución de peso</div><Sparkline values={weightVals} />{weightVals.length >= 2 && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Δ {(weightVals[weightVals.length - 1] - weightVals[0]).toFixed(1)} kg desde inicio</div>}</div>
            <div style={S.card}><div style={S.cardTitle}>Evolución cintura</div><Sparkline values={cinturaVals} color={C.warn} />{cinturaVals.length >= 2 && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Δ {(cinturaVals[cinturaVals.length - 1] - cinturaVals[0]).toFixed(1)} cm desde inicio</div>}</div>
          </div>
          {lastLab && (
            <div style={S.card}>
              <div style={S.cardTitle}>Último laboratorio — {lastLab.fecha}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.keys(LAB_LABELS).map(k => {
                  const val = lastLab[k];
                  if (val === undefined || val === null) return null;
                  const st = labStatus(k, parseFloat(val));
                  return <div key={k} style={{ ...S.statBox, minWidth: 90 }}><div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{LAB_LABELS[k]}</div><div style={{ fontSize: 14, fontWeight: 700, color: st === "danger" ? C.danger : C.ok }}>{val}</div></div>;
                })}
              </div>
              {lastLab.notas_lab && <div style={{ fontSize: 12, color: C.warn, marginTop: 10 }}>📝 {lastLab.notas_lab}</div>}
            </div>
          )}
        </div>
      )}

      {!loading && tab === "membresía" && (
        <Membership key={patient.id} patient={localPatient} onUpdate={handleMembresiaSave} />
      )}

      {!loading && tab === "sesiones" && (
        <div>
          {!addSession && <button style={{ ...S.btn("primary"), marginBottom: 16 }} onClick={() => setAddSession(true)}>+ Nueva sesión</button>}
          {addSession && <SessionForm pacienteId={patient.id} num={Math.max(0, ...sesiones.map(s => Number(s.num) || 0)) + 1} patient={localPatient} onUpdatePatient={(updated) => { setLocalPatient(updated); onUpdate(updated); }} onSave={(s) => { setSesiones(prev => [...prev, s]); setAddSession(false); }} onCancel={() => setAddSession(false)} />}
          {[...sesiones].reverse().map(s => (
            <div key={s.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Sesión #{s.num}</span>
                  <span style={{ color: C.muted, fontSize: 12, marginLeft: 10 }}>{s.fecha}</span>
                  {s.inbody_realizado && <span style={{ ...S.badge(C.accent), marginLeft: 8 }}>📊 InBody</span>}
                </div>
                <span style={S.badge(s.adherencia === "Muy buena" || s.adherencia === "Buena" ? C.ok : C.warn)}>Adherencia: {s.adherencia}</span>
              </div>
              {/* Métricas básicas siempre */}
              <div style={S.grid(3)}>
                {s.peso_kg && <div><span style={S.label}>Peso</span><span style={{ fontWeight: 600 }}>{s.peso_kg} kg</span></div>}
                {s.dosis_mounjaro && <div><span style={S.label}>Dosis</span><span style={{ fontWeight: 600, color: C.accent }}>💉 {s.dosis_mounjaro}</span></div>}
              </div>
              {/* InBody + mediciones antropométricas */}
              {s.inbody_realizado && (
                <div style={{ ...S.card, background: C.surface, marginTop: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 8 }}>InBody + Mediciones</div>
                  <div style={S.grid(4)}>
                    {s.cintura_cm && <div><span style={S.label}>Cintura</span><span style={{ fontWeight: 600 }}>{s.cintura_cm} cm</span></div>}
                    {s.cadera_cm && <div><span style={S.label}>Cadera</span><span style={{ fontWeight: 600 }}>{s.cadera_cm} cm</span></div>}
                    {s.inbody_musculo && <div><span style={S.label}>MME</span><span style={{ fontWeight: 600 }}>{s.inbody_musculo} kg</span></div>}
                    {s.inbody_grasa && <div><span style={S.label}>Masa Grasa</span><span style={{ fontWeight: 600 }}>{s.inbody_grasa} kg</span></div>}
                    {s.inbody_grasa_visceral && <div><span style={S.label}>Grasa Visceral</span><span style={{ fontWeight: 600, color: s.inbody_grasa_visceral > 9 ? C.danger : s.inbody_grasa_visceral > 5 ? C.warn : C.ok }}>{s.inbody_grasa_visceral}</span></div>}
                  </div>
                </div>
              )}
              {/* Síntomas unificados */}
              {(s.evento_adverso || s.malestar_gi) && (
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={S.tag(false)}>⚠️ {s.tipo_ea || s.tipo_gi || "Síntomas reportados"}</span>
                  {s.ajuste_dosis && <span style={S.badge(C.warn)}>💊 {s.nota_ajuste}</span>}
                </div>
              )}
              {s.ajuste_dosis && !(s.evento_adverso || s.malestar_gi) && (
                <div style={{ marginTop: 10 }}><span style={S.badge(C.warn)}>💊 {s.nota_ajuste}</span></div>
              )}
              {s.notas && <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontStyle: "italic" }}>"{s.notas}"</div>}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "laboratorios" && (
        <div>
          {!addLab && <button style={{ ...S.btn("primary"), marginBottom: 16 }} onClick={() => setAddLab(true)}>+ Nuevo laboratorio</button>}
          {addLab && <LabForm pacienteId={patient.id} onSave={(l) => { setLabs(prev => [l, ...prev]); setAddLab(false); }} onCancel={() => setAddLab(false)} />}
          {labs.map(lab => (
            <div key={lab.id} style={S.card}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Laboratorio — {lab.fecha}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {Object.keys(LAB_LABELS).map(k => {
                  const val = lab[k];
                  if (val === undefined || val === null) return null;
                  const st = labStatus(k, parseFloat(val));
                  return <div key={k} style={{ ...S.statBox, minWidth: 90 }}><div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{LAB_LABELS[k]}</div><div style={{ fontSize: 14, fontWeight: 700, color: st === "danger" ? C.danger : C.ok }}>{val}</div><div style={{ fontSize: 10, color: st === "danger" ? C.danger : C.ok }}>{st === "danger" ? "⚠ Fuera de rango" : "✓ Normal"}</div></div>;
                })}
              </div>
              {lab.notas_lab && <div style={{ fontSize: 12, color: C.warn }}>📝 {lab.notas_lab}</div>}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "perfil" && (
        <div>
          {editProfile
            ? <PatientForm patient={localPatient} onSave={(updated) => { onUpdate(updated); setLocalPatient(updated); setEditProfile(false); }} onCancel={() => setEditProfile(false)} />
            : <div>
              <button style={{ ...S.btn("secondary"), marginBottom: 16 }} onClick={() => setEditProfile(true)}>✏️ Editar perfil</button>
              {[["Diagnóstico", localPatient.diagnostico], ["Motivo de consulta", localPatient.motivo_consulta], ["Alergias", localPatient.alergias], ["Medicamentos", localPatient.medicamentos], ["Antecedentes heredofamiliares", localPatient.ant_heredofam], ["Antecedentes patológicos", localPatient.ant_patologicos], ["Sueño", localPatient.hab_sueno], ["Ejercicio", localPatient.hab_ejercicio], ["Alcohol", localPatient.hab_alcohol], ["Tabaco", localPatient.hab_tabaco]].map(([lbl, val]) => val ? (
                <div key={lbl} style={{ ...S.card, padding: "12px 16px" }}><span style={{ ...S.label, display: "block", marginBottom: 4 }}>{lbl}</span><span style={{ fontSize: 13 }}>{val}</span></div>
              ) : null)}
            </div>}
        </div>
      )}
    </div>
  );
}

// ── Patient List ──────────────────────────────────────────────────
function PatientList({ patients, onSelect, onAdd }) {
  const [search, setSearch] = useState("");
  const filtered = patients.filter(p => p.nombre?.toLowerCase().includes(search.toLowerCase()) && p.nombre !== "test");
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button style={S.btn("primary")} onClick={onAdd}>+ Nuevo paciente</button>
      </div>
      {filtered.map(p => (
        <div key={p.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => onSelect(p)} onMouseEnter={(e) => e.currentTarget.style.borderColor = C.accent + "88"} onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{p.nombre}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.edad} años · {p.sexo} · {p.telefono}</div>
              <div style={{ fontSize: 12, color: C.label, marginTop: 4 }}>{p.diagnostico}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, color: C.muted }}>
              <div>Ingreso: {p.fecha_ingreso}</div>
              {p.plan && p.plan !== "sin_plan" && <div style={{ marginTop: 4 }}><span style={S.badge(PLAN_COLORS[p.plan])}>{PLAN_LABELS[p.plan]}</span></div>}
            </div>
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>No se encontraron pacientes</div>}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
function Dashboard({ patients, onGoToMembresias }) {
  const real = patients.filter(p => p.nombre !== "test");
  const conPlan = real.filter(p => p.plan && p.plan !== "sin_plan").length;
  const alerta = real.filter(p => p.plan && p.plan !== "sin_plan" && Math.max(0, (p.apps_total || 0) - (p.apps_usadas || 0)) <= 1).length;

  return (
    <div>
      <div style={S.grid(4)}>
        {[
          ["Pacientes activos", real.length, C.accent],
          ["Con membresía", conPlan, C.ok],
          ["Sin plan", real.length - conPlan, C.muted],
          ["Apps por agotar", alerta, alerta > 0 ? C.warn : C.muted],
        ].map(([lbl, val, color]) => (
          <div key={lbl} style={{ ...S.statBox, borderColor: color + "44" }}><div style={{ ...S.statVal, color }}>{val}</div><div style={S.statLabel}>{lbl}</div></div>
        ))}
      </div>
      {alerta > 0 && (
        <div style={{ ...S.card, marginTop: 16, borderColor: C.warn + "55", background: C.warn + "11", cursor: "pointer" }} onClick={onGoToMembresias}>
          <div style={{ fontSize: 13, color: C.warn, fontWeight: 600 }}>⚠ {alerta} paciente{alerta > 1 ? "s" : ""} con pocas aplicaciones restantes → Ver membresías</div>
        </div>
      )}
      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={S.cardTitle}>Pacientes recientes</div>
        {real.slice(0, 8).map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <div><div style={{ fontWeight: 500, fontSize: 13 }}>{p.nombre}</div><div style={{ fontSize: 11, color: C.muted }}>{p.diagnostico?.split(",")[0]}</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {p.plan && p.plan !== "sin_plan" && <span style={S.badge(PLAN_COLORS[p.plan])}>{PLAN_LABELS[p.plan]}</span>}
              <span style={{ fontSize: 11, color: C.muted }}>Ingreso: {p.fecha_ingreso}</span>
            </div>
          </div>
        ))}
        {real.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Aún no hay pacientes registrados.</div>}
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const handle = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
      if (loginError) throw new Error("No se pudo iniciar sesión. Revisa tu correo y contraseña.");
      const { data, error: accessError } = await supabase.rpc("es_admin_clinico");
      if (accessError || data !== true) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("Tu cuenta no tiene acceso autorizado o el acceso aún no está configurado.");
      }
      setPw(""); onLogin();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <form onSubmit={handle} style={{ ...S.card, width: 340 }}>
      <h1 style={{ color: C.accent }}>Núcleo</h1>
      <p style={{ color: "#f59e0b", fontWeight: 700 }}>NÚCLEO · Acceso del personal</p><p>Acceso del personal</p>
      <Field label="Correo"><input required type="email" autoComplete="username" style={S.input} value={email} onChange={e => setEmail(e.target.value)} /></Field>
      <Field label="Contraseña"><input required type="password" autoComplete="current-password" style={S.input} value={pw} onChange={e => setPw(e.target.value)} /></Field>
      {error && <p role="alert" style={{ color: C.danger }}>{error}</p>}
      <button style={{ ...S.btn(), marginTop: 16 }} disabled={busy}>{busy ? "Verificando…" : "Entrar"}</button>
    </form>
  </div>;
}

// ── App Root ──────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(false);
  const [qrHash, setQrHash] = useState(window.location.search + window.location.hash);
  const [qrError, setQrError] = useState("");
  const [detailTab, setDetailTab] = useState("resumen");
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuth(false); setPatients([]); setSelected(null); setAddingPatient(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const [view, setView] = useState("dashboard");
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [addingPatient, setAddingPatient] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (auth) {
      setLoadingPatients(true);
      let active = true;
      setLoadError("");
      db.getPacientes().then(p => { if (active) setPatients(p); }).catch(() => { if (active) setLoadError("No se pudieron cargar los pacientes. Verifica tu conexión y acceso."); }).finally(() => { if (active) setLoadingPatients(false); });
      return () => { active = false; };
    }
  }, [auth]);

  useEffect(() => {
    const update = () => setQrHash(window.location.search + window.location.hash);
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => { window.removeEventListener('hashchange', update); window.removeEventListener('popstate', update); };
  }, []);
  useEffect(() => {
    const target = new URL(window.location.origin + '/' + qrHash);
    if (!auth || !(target.searchParams.has('membresia') || new URLSearchParams(target.hash.slice(1)).has('membresia'))) return;
    let active = true;
    setQrError('');
    resolveQr(window.location.origin + '/' + qrHash).then(patient => {
      if (!active) return;
      setDetailTab('membresía'); setSelected(patient); setAddingPatient(false); setView('patients');
      const clean = new URL(window.location.href);
      clean.searchParams.delete('membresia');
      if (new URLSearchParams(clean.hash.slice(1)).has('membresia')) clean.hash = '';
      window.history.replaceState(null, '', clean.pathname + clean.search + clean.hash);
      setQrHash('');
    }).catch(e => { if (active) setQrError(e.message); });
    return () => { active = false; };
  }, [auth, qrHash]);

  if (!auth) return <Login onLogin={() => setAuth(true)} />;

  const navItems = [
    ["dashboard", "📊", "Dashboard"],
    ["patients", "👥", "Pacientes"],
    ["membresias", "💳", "Membresías"],
  ];

  const pageTitle = addingPatient ? "Nuevo Paciente"
    : selected ? selected.nombre
    : view === "dashboard" ? "Dashboard"
    : view === "membresias" ? "Membresías"
    : "Pacientes";

  const handleSelectFromMembresias = (p) => {
    setDetailTab("membresía");
    setSelected(p);
    setView("patients");
  };

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.logo}><div style={S.logoText}>Núcleo</div><div style={S.logoSub}>Sistema Clínico</div></div>
        {navItems.map(([key, icon, label]) => (
          <div key={key} style={S.navItem(view === key && !selected && !addingPatient)} onClick={() => { setView(key); setSelected(null); setAddingPatient(false); }}>
            <span>{icon}</span><span>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "0 20px" }}>
          <div style={{ fontSize: 11, color: C.muted }}>v2.1 · Supabase</div>
          <button style={{ ...S.btn("secondary"), width: "100%", marginTop: 8, fontSize: 12 }} onClick={async () => { setAuth(false); setPatients([]); setSelected(null); setAddingPatient(false); await supabase.auth.signOut({ scope: "local" }); }}>Cerrar sesión</button>
        </div>
      </div>
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={S.pageTitle}>{pageTitle}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <div style={S.content}>
          {qrError && <p role="alert" style={{ color: C.danger }}>{qrError}</p>}
          {loadError && <p role="alert" style={{ color: C.danger }}>{loadError}</p>}
          {loadingPatients && <div style={{ color: C.muted, padding: 20 }}>Cargando pacientes...</div>}
          {!loadingPatients && view === "dashboard" && !selected && (
            <Dashboard patients={patients} onGoToMembresias={() => setView("membresias")} />
          )}
          {!loadingPatients && view === "patients" && !selected && !addingPatient && (
            <PatientList patients={patients} onSelect={p => { setDetailTab("resumen"); setSelected(p); }} onAdd={() => setAddingPatient(true)} />
          )}
          {!loadingPatients && view === "membresias" && !selected && (
            <><MembershipLookup onSelect={handleSelectFromMembresias} /><MembresiasView
              patients={patients}
              onSelectPatient={handleSelectFromMembresias}
              onUpdate={(updated) => setPatients(prev => prev.map(p => p.id === updated.id ? updated : p))}
            /></>
          )}
          {addingPatient && <PatientForm onSave={(p) => { setPatients(prev => [p, ...prev]); setSelected(p); setAddingPatient(false); setView("patients"); }} onCancel={() => setAddingPatient(false)} />}
          {selected && (
            <PatientDetail key={selected.id}
              initialTab={detailTab}
              patient={selected}
              onUpdate={(updated) => { setPatients(prev => prev.map(p => p.id === updated.id ? updated : p)); setSelected(updated); }}
              onBack={() => { setSelected(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
