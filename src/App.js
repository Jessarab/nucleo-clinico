import { useState, useEffect, useRef } from "react";

// ── Color tokens ──────────────────────────────────────────────────
const C = {
  bg: "#0d1117",
  surface: "#161b22",
  card: "#1c2330",
  border: "#2a3441",
  accent: "#00d4aa",
  accentDim: "#00d4aa22",
  accentSoft: "#00d4aa44",
  warn: "#f59e0b",
  danger: "#ef4444",
  ok: "#22c55e",
  text: "#e6edf3",
  muted: "#7d8590",
  label: "#a0aab4",
};

// ── Shared styles ─────────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "'DM Sans', sans-serif",
    background: C.bg,
    color: C.text,
    minHeight: "100vh",
    display: "flex",
  },
  sidebar: {
    width: 220,
    background: C.surface,
    borderRight: `1px solid ${C.border}`,
    display: "flex",
    flexDirection: "column",
    padding: "28px 0 20px",
    flexShrink: 0,
  },
  logo: {
    padding: "0 20px 28px",
    borderBottom: `1px solid ${C.border}`,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    color: C.accent,
    letterSpacing: "-0.5px",
  },
  logoSub: { fontSize: 11, color: C.muted, marginTop: 2, letterSpacing: 1 },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: 0,
    background: active ? C.accentDim : "transparent",
    borderLeft: `3px solid ${active ? C.accent : "transparent"}`,
    color: active ? C.accent : C.label,
    fontSize: 13.5,
    fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
  }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: {
    padding: "16px 28px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: C.surface,
  },
  pageTitle: { fontSize: 17, fontWeight: 600, color: C.text },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px" },
  card: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 14, letterSpacing: 0.5, textTransform: "uppercase" },
  grid: (cols) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 14,
  }),
  label: { fontSize: 11.5, color: C.muted, marginBottom: 4, display: "block", letterSpacing: 0.3 },
  input: {
    width: "100%",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "8px 10px",
    color: C.text,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "8px 10px",
    color: C.text,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 72,
  },
  select: {
    width: "100%",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "8px 10px",
    color: C.text,
    fontSize: 13,
    outline: "none",
  },
  btn: (variant = "primary") => ({
    padding: "8px 18px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: variant === "primary" ? C.accent : variant === "danger" ? C.danger : C.border,
    color: variant === "primary" ? "#0d1117" : C.text,
    transition: "opacity 0.15s",
  }),
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: color + "22",
    color: color,
    border: `1px solid ${color}44`,
  }),
  statBox: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "14px 16px",
  },
  statVal: { fontSize: 22, fontWeight: 700, color: C.accent, lineHeight: 1 },
  statLabel: { fontSize: 11.5, color: C.muted, marginTop: 4 },
  tag: (ok) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: ok ? C.ok : C.danger,
    background: ok ? C.ok + "18" : C.danger + "18",
    border: `1px solid ${ok ? C.ok : C.danger}44`,
    borderRadius: 12,
    padding: "2px 8px",
  }),
};

// ── Fake initial data ─────────────────────────────────────────────
const INIT_PATIENTS = [
  {
    id: 1,
    nombre: "María García López",
    edad: 34,
    sexo: "F",
    telefono: "555-1234",
    email: "maria@email.com",
    fechaIngreso: "2025-01-10",
    diagnostico: "Obesidad grado I, Resistencia a la insulina",
    motivoConsulta: "Pérdida de peso y control metabólico",
    antHeredofam: "Padre: DM2, Madre: HTA",
    antPatologicos: "Sin cirugías previas",
    alergias: "Ninguna conocida",
    medicamentos: "Semaglutida 0.5mg semanal",
    habSueno: "6-7h, refiere sueño no reparador",
    habEjercicio: "Sedentaria",
    habAlcohol: "Ocasional (fines de semana)",
    habTabaco: "No",
    sesiones: [
      {
        id: 1, fecha: "2025-01-17", num: 1,
        pesoKg: 85.2, cinturaCm: 96, caderaCm: 112,
        inbodyRealizado: false,
        eventoAdverso: false, tipoEA: "",
        malestarGI: true, tipoGI: "Náuseas leves",
        adherencia: "Buena",
        ajusteDosis: false, notaAjuste: "",
        notas: "Primera sesión. Buena disposición.",
      },
      {
        id: 2, fecha: "2025-01-24", num: 2,
        pesoKg: 84.6, cinturaCm: 95.5, caderaCm: 111.5,
        inbodyRealizado: true, inbodyGrasa: 38.2, inbodyMusculo: 47.1, inbodyAgua: 38.5,
        eventoAdverso: false, tipoEA: "",
        malestarGI: true, tipoGI: "Estreñimiento leve",
        adherencia: "Buena",
        ajusteDosis: true, notaAjuste: "Subir a 1mg la próxima semana",
        notas: "InBody dentro de parámetros esperados para inicio.",
      },
    ],
    laboratorios: [
      {
        id: 1, fecha: "2025-01-10",
        glucosa: 102, urea: 28, creatinina: 0.8, colTotal: 198,
        hdl: 42, ldl: 130, trigliceridos: 210,
        tgo: 32, tgp: 28,
        hba1c: 5.9, homaIr: 3.2,
        hemoglobina: 13.8, leucocitos: 7200, plaquetas: 285000,
        notasLab: "Triglicéridos elevados, resistencia a la insulina borderline",
      },
    ],
  },
  {
    id: 2,
    nombre: "Carlos Mendoza Ruiz",
    edad: 47,
    sexo: "M",
    telefono: "555-5678",
    email: "carlos@email.com",
    fechaIngreso: "2025-02-03",
    diagnostico: "Síndrome metabólico, DM2 inicial",
    motivoConsulta: "Control glucémico y pérdida de peso",
    antHeredofam: "Madre y abuela: DM2",
    antPatologicos: "HTA diagnosticada 2022",
    alergias: "Metformina (intolerancia GI)",
    medicamentos: "Tirzepatida 2.5mg semanal, Losartán 50mg",
    habSueno: "5-6h, insomnio frecuente",
    habEjercicio: "Caminata 3x semana",
    habAlcohol: "No",
    habTabaco: "Ex-fumador (dejó 2020)",
    sesiones: [
      {
        id: 1, fecha: "2025-02-10", num: 1,
        pesoKg: 102.4, cinturaCm: 114, caderaCm: 108,
        inbodyRealizado: false,
        eventoAdverso: false, tipoEA: "",
        malestarGI: false, tipoGI: "",
        adherencia: "Muy buena",
        ajusteDosis: false, notaAjuste: "",
        notas: "Paciente muy motivado. Explico plan de alimentación.",
      },
    ],
    laboratorios: [],
  },
];

// ── Field component ───────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <span style={S.label}>{label}</span>
      {children}
    </div>
  );
}

// ── Mini sparkline SVG ────────────────────────────────────────────
function Sparkline({ values, color = C.accent, height = 40, width = 120 }) {
  if (!values || values.length < 2) return <span style={{ color: C.muted, fontSize: 11 }}>—</span>;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(" ");
  const last = values[values.length - 1];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={width} height={height} style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="3" fill={color} />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{last}</span>
    </div>
  );
}

// ── Lab range checker ─────────────────────────────────────────────
const LAB_RANGES = {
  glucosa: [70, 100, "mg/dL"],
  urea: [10, 50, "mg/dL"],
  creatinina: [0.5, 1.2, "mg/dL"],
  colTotal: [0, 200, "mg/dL"],
  hdl: [40, 999, "mg/dL"],
  ldl: [0, 130, "mg/dL"],
  trigliceridos: [0, 150, "mg/dL"],
  tgo: [0, 40, "U/L"],
  tgp: [0, 41, "U/L"],
  hba1c: [0, 5.7, "%"],
  homaIr: [0, 2.5, ""],
  hemoglobina: [12, 17, "g/dL"],
  leucocitos: [4500, 11000, "/µL"],
  plaquetas: [150000, 400000, "/µL"],
};

function labStatus(key, val) {
  const r = LAB_RANGES[key];
  if (!r) return "ok";
  return val < r[0] || val > r[1] ? "danger" : "ok";
}

const LAB_LABELS = {
  glucosa: "Glucosa", urea: "Urea", creatinina: "Creatinina",
  colTotal: "Col. Total", hdl: "HDL", ldl: "LDL", trigliceridos: "Triglicéridos",
  tgo: "TGO", tgp: "TGP", hba1c: "HbA1c", homaIr: "HOMA-IR",
  hemoglobina: "Hemoglobina", leucocitos: "Leucocitos", plaquetas: "Plaquetas",
};

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
Analiza este resultado de laboratorio y extrae ÚNICAMENTE los siguientes valores si aparecen.
Responde SOLO con un objeto JSON válido, sin texto adicional ni markdown:
{
  "glucosa": número o null,
  "urea": número o null,
  "creatinina": número o null,
  "colTotal": número o null,
  "hdl": número o null,
  "ldl": número o null,
  "trigliceridos": número o null,
  "tgo": número o null,
  "tgp": número o null,
  "hba1c": número o null,
  "homaIr": número o null,
  "hemoglobina": número o null,
  "leucocitos": número o null,
  "plaquetas": número o null,
  "notasLab": "observación breve si hay algo relevante fuera de lo común, sino cadena vacía"
}`;

      const contentArr = isPdf
        ? [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: prompt },
          ]
        : [
            { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
            { type: "text", text: prompt },
          ];

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: contentArr }],
        }),
      });
      const data = await resp.json();
      const text = data.content.map((b) => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      onExtracted(parsed);
    } catch (err) {
      alert("Error al procesar el archivo. Intenta con otra imagen o PDF.");
    }
    setLoading(false);
  };

  return (
    <div style={{ ...S.card, borderColor: C.accent + "44", background: C.accentDim }}>
      <div style={S.cardTitle}>📄 Leer laboratorio con IA</div>
      <p style={{ fontSize: 12.5, color: C.muted, marginBottom: 12 }}>
        Sube la foto o PDF del resultado. La IA extrae los valores automáticamente y resalta lo que esté fuera de rango.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: "none" }} />
        <button style={S.btn("secondary")} onClick={() => fileRef.current.click()}>
          📁 {file ? file.name : "Seleccionar archivo"}
        </button>
        {file && (
          <button style={S.btn("primary")} onClick={analyze} disabled={loading}>
            {loading ? "⏳ Analizando..." : "✨ Extraer valores"}
          </button>
        )}
      </div>
      {preview && file?.type?.startsWith("image") && (
        <img src={preview} alt="lab" style={{ marginTop: 10, maxHeight: 160, borderRadius: 6, opacity: 0.8 }} />
      )}
    </div>
  );
}

// ── Lab Form ──────────────────────────────────────────────────────
function LabForm({ onSave, onCancel }) {
  const [vals, setVals] = useState({ fecha: new Date().toISOString().split("T")[0] });
  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const keys = Object.keys(LAB_LABELS);

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Nuevo Laboratorio</div>
      <AILabReader onExtracted={(data) => setVals((p) => ({ ...p, ...data }))} />
      <div style={{ ...S.grid(2), marginBottom: 14 }}>
        <Field label="Fecha">
          <input style={S.input} type="date" value={vals.fecha || ""} onChange={(e) => set("fecha", e.target.value)} />
        </Field>
      </div>
      <div style={{ ...S.grid(3), marginBottom: 14 }}>
        {keys.map((k) => {
          const r = LAB_RANGES[k];
          const val = vals[k];
          const status = val !== undefined && val !== null && val !== "" ? labStatus(k, parseFloat(val)) : null;
          return (
            <Field key={k} label={`${LAB_LABELS[k]}${r ? ` (${r[2]})` : ""}`}>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...S.input, borderColor: status === "danger" ? C.danger : status === "ok" ? C.ok : C.border }}
                  type="number"
                  step="0.01"
                  value={vals[k] ?? ""}
                  onChange={(e) => set(k, e.target.value)}
                />
                {status && (
                  <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>
                    {status === "danger" ? "⚠️" : "✓"}
                  </span>
                )}
              </div>
              {r && <span style={{ fontSize: 10, color: C.muted }}>Ref: {r[0]}–{r[1] === 999 ? ">" + r[0] : r[1]}</span>}
            </Field>
          );
        })}
      </div>
      <Field label="Notas / Observaciones">
        <textarea style={S.textarea} value={vals.notasLab || ""} onChange={(e) => set("notasLab", e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={S.btn("primary")} onClick={() => onSave({ ...vals, id: Date.now() })}>Guardar</button>
        <button style={S.btn("secondary")} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Session Form ──────────────────────────────────────────────────
function SessionForm({ num, onSave, onCancel }) {
  const isInBody = num % 2 === 0;
  const [vals, setVals] = useState({
    fecha: new Date().toISOString().split("T")[0],
    num,
    inbodyRealizado: isInBody,
    eventoAdverso: false,
    malestarGI: false,
    ajusteDosis: false,
    adherencia: "Buena",
  });
  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Sesión #{num}</div>
      <div style={{ ...S.grid(3), marginBottom: 14 }}>
        <Field label="Fecha"><input style={S.input} type="date" value={vals.fecha} onChange={(e) => set("fecha", e.target.value)} /></Field>
        <Field label="Peso (kg)"><input style={S.input} type="number" step="0.1" value={vals.pesoKg || ""} onChange={(e) => set("pesoKg", e.target.value)} /></Field>
        <Field label="Adherencia">
          <select style={S.select} value={vals.adherencia} onChange={(e) => set("adherencia", e.target.value)}>
            {["Muy buena","Buena","Regular","Mala"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ ...S.grid(2), marginBottom: 14 }}>
        <Field label="Cintura (cm)"><input style={S.input} type="number" step="0.1" value={vals.cinturaCm || ""} onChange={(e) => set("cinturaCm", e.target.value)} /></Field>
        <Field label="Cadera (cm)"><input style={S.input} type="number" step="0.1" value={vals.caderaCm || ""} onChange={(e) => set("caderaCm", e.target.value)} /></Field>
      </div>
      {isInBody && (
        <div style={{ ...S.card, background: C.surface, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginBottom: 10 }}>📊 InBody (sesión par)</div>
          <div style={S.grid(3)}>
            <Field label="% Grasa"><input style={S.input} type="number" step="0.1" value={vals.inbodyGrasa || ""} onChange={(e) => set("inbodyGrasa", e.target.value)} /></Field>
            <Field label="Masa muscular (kg)"><input style={S.input} type="number" step="0.1" value={vals.inbodyMusculo || ""} onChange={(e) => set("inbodyMusculo", e.target.value)} /></Field>
            <Field label="Agua corporal (%)"><input style={S.input} type="number" step="0.1" value={vals.inbodyAgua || ""} onChange={(e) => set("inbodyAgua", e.target.value)} /></Field>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          ["eventoAdverso", "⚠️ Evento adverso"],
          ["malestarGI", "🫁 Malestar GI"],
          ["ajusteDosis", "💊 Ajuste de dosis"],
        ].map(([k, lbl]) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" checked={vals[k]} onChange={(e) => set(k, e.target.checked)} />
            {lbl}
          </label>
        ))}
      </div>
      {vals.eventoAdverso && <Field label="Describir evento adverso"><input style={{ ...S.input, marginBottom: 12 }} value={vals.tipoEA || ""} onChange={(e) => set("tipoEA", e.target.value)} /></Field>}
      {vals.malestarGI && <Field label="Tipo de malestar GI"><input style={{ ...S.input, marginBottom: 12 }} placeholder="Ej: náuseas, estreñimiento..." value={vals.tipoGI || ""} onChange={(e) => set("tipoGI", e.target.value)} /></Field>}
      {vals.ajusteDosis && <Field label="Nota de ajuste de dosis"><input style={{ ...S.input, marginBottom: 12 }} value={vals.notaAjuste || ""} onChange={(e) => set("notaAjuste", e.target.value)} /></Field>}
      <Field label="Notas de sesión"><textarea style={{ ...S.textarea, marginBottom: 14 }} value={vals.notas || ""} onChange={(e) => set("notas", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btn("primary")} onClick={() => onSave({ ...vals, id: Date.now() })}>Guardar sesión</button>
        <button style={S.btn("secondary")} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Patient Profile Form ──────────────────────────────────────────
function PatientForm({ patient, onSave, onCancel }) {
  const [vals, setVals] = useState(patient || { fechaIngreso: new Date().toISOString().split("T")[0], sesiones: [], laboratorios: [] });
  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const sections = [
    {
      title: "Datos Generales",
      fields: [
        ["nombre", "Nombre completo", "text"],
        ["edad", "Edad", "number"],
        ["sexo", "Sexo", "select", ["F", "M"]],
        ["telefono", "Teléfono", "text"],
        ["email", "Email", "email"],
        ["fechaIngreso", "Fecha de ingreso", "date"],
      ],
    },
    {
      title: "Clínico",
      fields: [
        ["diagnostico", "Diagnóstico principal", "textarea"],
        ["motivoConsulta", "Motivo de consulta", "textarea"],
        ["alergias", "Alergias", "text"],
        ["medicamentos", "Medicamentos actuales", "textarea"],
      ],
    },
    {
      title: "Antecedentes",
      fields: [
        ["antHeredofam", "Heredofamiliares", "textarea"],
        ["antPatologicos", "Patológicos", "textarea"],
      ],
    },
    {
      title: "Hábitos",
      fields: [
        ["habSueno", "Sueño", "text"],
        ["habEjercicio", "Ejercicio", "text"],
        ["habAlcohol", "Alcohol", "text"],
        ["habTabaco", "Tabaco", "text"],
      ],
    },
  ];

  return (
    <div>
      {sections.map((sec) => (
        <div key={sec.title} style={S.card}>
          <div style={S.cardTitle}>{sec.title}</div>
          <div style={S.grid(2)}>
            {sec.fields.map(([k, lbl, type, opts]) => (
              <Field key={k} label={lbl}>
                {type === "textarea" ? (
                  <textarea style={S.textarea} value={vals[k] || ""} onChange={(e) => set(k, e.target.value)} />
                ) : type === "select" ? (
                  <select style={S.select} value={vals[k] || ""} onChange={(e) => set(k, e.target.value)}>
                    {opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input style={S.input} type={type} value={vals[k] || ""} onChange={(e) => set(k, e.target.value)} />
                )}
              </Field>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btn("primary")} onClick={() => onSave({ ...vals, id: vals.id || Date.now() })}>
          {patient ? "Guardar cambios" : "Crear paciente"}
        </button>
        <button style={S.btn("secondary")} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Patient Detail ────────────────────────────────────────────────
function PatientDetail({ patient, onUpdate, onBack }) {
  const [tab, setTab] = useState("resumen");
  const [addSession, setAddSession] = useState(false);
  const [addLab, setAddLab] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const tabs = ["resumen", "sesiones", "laboratorios", "perfil"];

  const saveSession = (s) => {
    const updated = { ...patient, sesiones: [...(patient.sesiones || []), s] };
    onUpdate(updated);
    setAddSession(false);
  };

  const saveLab = (l) => {
    const updated = { ...patient, laboratorios: [...(patient.laboratorios || []), l] };
    onUpdate(updated);
    setAddLab(false);
  };

  const weightVals = patient.sesiones?.map((s) => parseFloat(s.pesoKg)).filter(Boolean) || [];
  const cinturaVals = patient.sesiones?.map((s) => parseFloat(s.cinturaCm)).filter(Boolean) || [];

  const lastLab = patient.laboratorios?.[patient.laboratorios.length - 1];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <button style={{ ...S.btn("secondary"), padding: "6px 12px" }} onClick={onBack}>← Volver</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{patient.nombre}</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {patient.edad} años · {patient.sexo === "F" ? "Femenino" : "Masculino"} · Ingreso: {patient.fechaIngreso}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={S.badge(C.accent)}>{patient.diagnostico?.split(",")[0]}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? C.accent : "transparent"}`,
              color: tab === t ? C.accent : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: tab === t ? 600 : 400,
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* RESUMEN */}
      {tab === "resumen" && (
        <div>
          <div style={S.grid(4)}>
            {[
              ["Sesiones", patient.sesiones?.length || 0],
              ["Último peso", weightVals.length ? `${weightVals[weightVals.length - 1]} kg` : "—"],
              ["Última cintura", cinturaVals.length ? `${cinturaVals[cinturaVals.length - 1]} cm` : "—"],
              ["Labs registrados", patient.laboratorios?.length || 0],
            ].map(([lbl, val]) => (
              <div key={lbl} style={S.statBox}>
                <div style={S.statVal}>{val}</div>
                <div style={S.statLabel}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={{ ...S.grid(2), marginTop: 16 }}>
            <div style={S.card}>
              <div style={S.cardTitle}>Evolución de peso</div>
              <Sparkline values={weightVals} />
              {weightVals.length >= 2 && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  Δ {(weightVals[weightVals.length - 1] - weightVals[0]).toFixed(1)} kg desde inicio
                </div>
              )}
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>Evolución cintura</div>
              <Sparkline values={cinturaVals} color={C.warn} />
              {cinturaVals.length >= 2 && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  Δ {(cinturaVals[cinturaVals.length - 1] - cinturaVals[0]).toFixed(1)} cm desde inicio
                </div>
              )}
            </div>
          </div>

          {lastLab && (
            <div style={S.card}>
              <div style={S.cardTitle}>Último laboratorio — {lastLab.fecha}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.keys(LAB_LABELS).map((k) => {
                  const val = lastLab[k];
                  if (val === undefined || val === null || val === "") return null;
                  const st = labStatus(k, parseFloat(val));
                  return (
                    <div key={k} style={{ ...S.statBox, minWidth: 90 }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{LAB_LABELS[k]}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: st === "danger" ? C.danger : C.ok }}>{val}</div>
                    </div>
                  );
                })}
              </div>
              {lastLab.notasLab && <div style={{ fontSize: 12, color: C.warn, marginTop: 10 }}>📝 {lastLab.notasLab}</div>}
            </div>
          )}

          {/* Eventos adversos recientes */}
          {patient.sesiones?.filter((s) => s.malestarGI || s.eventoAdverso).length > 0 && (
            <div style={S.card}>
              <div style={S.cardTitle}>Eventos registrados</div>
              {patient.sesiones.filter((s) => s.malestarGI || s.eventoAdverso).map((s) => (
                <div key={s.id} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted, minWidth: 80 }}>{s.fecha}</span>
                  {s.malestarGI && <span style={S.tag(false)}>GI: {s.tipoGI}</span>}
                  {s.eventoAdverso && <span style={S.tag(false)}>⚠️ {s.tipoEA}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SESIONES */}
      {tab === "sesiones" && (
        <div>
          {!addSession && (
            <button style={{ ...S.btn("primary"), marginBottom: 16 }} onClick={() => setAddSession(true)}>
              + Nueva sesión
            </button>
          )}
          {addSession && (
            <SessionForm num={(patient.sesiones?.length || 0) + 1} onSave={saveSession} onCancel={() => setAddSession(false)} />
          )}
          {[...(patient.sesiones || [])].reverse().map((s) => (
            <div key={s.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Sesión #{s.num}</span>
                  <span style={{ color: C.muted, fontSize: 12, marginLeft: 10 }}>{s.fecha}</span>
                  {s.inbodyRealizado && <span style={{ ...S.badge(C.accent), marginLeft: 8 }}>InBody</span>}
                </div>
                <span style={{ ...S.badge(s.adherencia === "Muy buena" || s.adherencia === "Buena" ? C.ok : C.warn) }}>
                  Adherencia: {s.adherencia}
                </span>
              </div>
              <div style={S.grid(3)}>
                {s.pesoKg && <div><span style={S.label}>Peso</span><span style={{ fontWeight: 600 }}>{s.pesoKg} kg</span></div>}
                {s.cinturaCm && <div><span style={S.label}>Cintura</span><span style={{ fontWeight: 600 }}>{s.cinturaCm} cm</span></div>}
                {s.caderaCm && <div><span style={S.label}>Cadera</span><span style={{ fontWeight: 600 }}>{s.caderaCm} cm</span></div>}
              </div>
              {s.inbodyRealizado && s.inbodyGrasa && (
                <div style={{ ...S.grid(3), marginTop: 8 }}>
                  <div><span style={S.label}>% Grasa</span><span style={{ fontWeight: 600 }}>{s.inbodyGrasa}%</span></div>
                  <div><span style={S.label}>Músculo</span><span style={{ fontWeight: 600 }}>{s.inbodyMusculo} kg</span></div>
                  <div><span style={S.label}>Agua</span><span style={{ fontWeight: 600 }}>{s.inbodyAgua}%</span></div>
                </div>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {s.malestarGI && <span style={S.tag(false)}>GI: {s.tipoGI}</span>}
                {s.eventoAdverso && <span style={S.tag(false)}>⚠️ {s.tipoEA}</span>}
                {s.ajusteDosis && <span style={S.badge(C.warn)}>💊 {s.notaAjuste}</span>}
              </div>
              {s.notas && <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontStyle: "italic" }}>"{s.notas}"</div>}
            </div>
          ))}
        </div>
      )}

      {/* LABORATORIOS */}
      {tab === "laboratorios" && (
        <div>
          {!addLab && (
            <button style={{ ...S.btn("primary"), marginBottom: 16 }} onClick={() => setAddLab(true)}>
              + Nuevo laboratorio
            </button>
          )}
          {addLab && <LabForm onSave={saveLab} onCancel={() => setAddLab(false)} />}
          {[...(patient.laboratorios || [])].reverse().map((lab) => (
            <div key={lab.id} style={S.card}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Laboratorio — {lab.fecha}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {Object.keys(LAB_LABELS).map((k) => {
                  const val = lab[k];
                  if (val === undefined || val === null || val === "") return null;
                  const st = labStatus(k, parseFloat(val));
                  return (
                    <div key={k} style={{ ...S.statBox, minWidth: 90 }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{LAB_LABELS[k]}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: st === "danger" ? C.danger : C.ok }}>{val}</div>
                      <div style={{ fontSize: 10, color: st === "danger" ? C.danger : C.ok }}>{st === "danger" ? "⚠ Fuera de rango" : "✓ Normal"}</div>
                    </div>
                  );
                })}
              </div>
              {lab.notasLab && <div style={{ fontSize: 12, color: C.warn }}>📝 {lab.notasLab}</div>}
            </div>
          ))}
        </div>
      )}

      {/* PERFIL */}
      {tab === "perfil" && (
        <div>
          {editProfile ? (
            <PatientForm
              patient={patient}
              onSave={(updated) => { onUpdate(updated); setEditProfile(false); }}
              onCancel={() => setEditProfile(false)}
            />
          ) : (
            <div>
              <button style={{ ...S.btn("secondary"), marginBottom: 16 }} onClick={() => setEditProfile(true)}>✏️ Editar perfil</button>
              {[
                ["Diagnóstico", patient.diagnostico],
                ["Motivo de consulta", patient.motivoConsulta],
                ["Alergias", patient.alergias],
                ["Medicamentos", patient.medicamentos],
                ["Antecedentes heredofamiliares", patient.antHeredofam],
                ["Antecedentes patológicos", patient.antPatologicos],
                ["Sueño", patient.habSueno],
                ["Ejercicio", patient.habEjercicio],
                ["Alcohol", patient.habAlcohol],
                ["Tabaco", patient.habTabaco],
              ].map(([lbl, val]) => val ? (
                <div key={lbl} style={{ ...S.card, padding: "12px 16px" }}>
                  <span style={{ ...S.label, display: "block", marginBottom: 4 }}>{lbl}</span>
                  <span style={{ fontSize: 13 }}>{val}</span>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Patient List ──────────────────────────────────────────────────
function PatientList({ patients, onSelect, onAdd }) {
  const [search, setSearch] = useState("");
  const filtered = patients.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button style={S.btn("primary")} onClick={onAdd}>+ Nuevo paciente</button>
      </div>
      {filtered.map((p) => (
        <div
          key={p.id}
          style={{ ...S.card, cursor: "pointer", transition: "border-color 0.15s" }}
          onClick={() => onSelect(p)}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent + "88")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{p.nombre}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {p.edad} años · {p.sexo === "F" ? "F" : "M"} · {p.telefono}
              </div>
              <div style={{ fontSize: 12, color: C.label, marginTop: 4 }}>{p.diagnostico}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted }}>{p.sesiones?.length || 0} sesiones</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.laboratorios?.length || 0} labs</div>
              {p.sesiones?.some((s) => s.malestarGI || s.eventoAdverso) && (
                <span style={{ ...S.badge(C.warn), marginTop: 4, display: "block" }}>⚠ Eventos</span>
              )}
            </div>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>
          No se encontraron pacientes
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
function Dashboard({ patients }) {
  const total = patients.length;
  const totalSes = patients.reduce((a, p) => a + (p.sesiones?.length || 0), 0);
  const totalLabs = patients.reduce((a, p) => a + (p.laboratorios?.length || 0), 0);
  const conEventos = patients.filter((p) => p.sesiones?.some((s) => s.malestarGI || s.eventoAdverso)).length;

  return (
    <div>
      <div style={{ ...S.grid(4), marginBottom: 20 }}>
        {[
          ["Pacientes activos", total, C.accent],
          ["Total de sesiones", totalSes, C.ok],
          ["Laboratorios", totalLabs, C.warn],
          ["Con eventos adversos", conEventos, C.danger],
        ].map(([lbl, val, color]) => (
          <div key={lbl} style={{ ...S.statBox, borderColor: color + "44" }}>
            <div style={{ ...S.statVal, color }}>{val}</div>
            <div style={S.statLabel}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Pacientes recientes</div>
        {patients.slice(0, 5).map((p) => {
          const lastSes = p.sesiones?.[p.sesiones.length - 1];
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{p.diagnostico?.split(",")[0]}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {lastSes && <div style={{ fontSize: 11, color: C.muted }}>Última sesión: {lastSes.fecha}</div>}
                {lastSes?.pesoKg && <div style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{lastSes.pesoKg} kg</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const handle = () => {
    if (pw === "nucleo2025") { onLogin(); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 320, ...S.card, padding: 32 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.accent, marginBottom: 4 }}>Núcleo</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 28, letterSpacing: 1, textTransform: "uppercase" }}>Sistema Clínico</div>
        <Field label="Contraseña">
          <input
            style={{ ...S.input, borderColor: err ? C.danger : C.border }}
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            placeholder="••••••••"
          />
        </Field>
        {err && <div style={{ fontSize: 11, color: C.danger, marginTop: 6 }}>Contraseña incorrecta</div>}
        <button style={{ ...S.btn("primary"), width: "100%", marginTop: 16, padding: "10px" }} onClick={handle}>
          Entrar →
        </button>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 20, textAlign: "center" }}>
          Demo: contraseña <strong>nucleo2025</strong>
        </div>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(false);
  const [view, setView] = useState("dashboard");
  const [patients, setPatients] = useState(INIT_PATIENTS);
  const [selected, setSelected] = useState(null);
  const [addingPatient, setAddingPatient] = useState(false);

  useEffect(() => {
    // load Google Font
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  if (!auth) return <Login onLogin={() => setAuth(true)} />;

  const updatePatient = (updated) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
  };

  const addPatient = (p) => {
    setPatients((prev) => [...prev, p]);
    setSelected(p);
    setAddingPatient(false);
    setView("patients");
  };

  const navItems = [
    ["dashboard", "📊", "Dashboard"],
    ["patients", "👥", "Pacientes"],
  ];

  const pageTitle =
    addingPatient ? "Nuevo Paciente"
    : selected ? selected.nombre
    : view === "dashboard" ? "Dashboard"
    : "Pacientes";

  return (
    <div style={S.app}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoText}>Núcleo</div>
          <div style={S.logoSub}>Sistema Clínico</div>
        </div>
        {navItems.map(([key, icon, label]) => (
          <div
            key={key}
            style={S.navItem(view === key && !selected && !addingPatient)}
            onClick={() => { setView(key); setSelected(null); setAddingPatient(false); }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "0 20px" }}>
          <div style={{ fontSize: 11, color: C.muted }}>v1.0 · Demo</div>
          <button
            style={{ ...S.btn("secondary"), width: "100%", marginTop: 8, fontSize: 12 }}
            onClick={() => setAuth(false)}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={S.pageTitle}>{pageTitle}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <div style={S.content}>
          {view === "dashboard" && !selected && <Dashboard patients={patients} />}
          {view === "patients" && !selected && !addingPatient && (
            <PatientList patients={patients} onSelect={setSelected} onAdd={() => setAddingPatient(true)} />
          )}
          {addingPatient && (
            <PatientForm onSave={addPatient} onCancel={() => setAddingPatient(false)} />
          )}
          {selected && (
            <PatientDetail
              patient={selected}
              onUpdate={updatePatient}
              onBack={() => setSelected(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
