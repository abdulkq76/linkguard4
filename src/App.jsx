import { useState, useEffect, useRef } from "react";
import { Calendar, Plus, X, Moon, Sun, Book, Clock, Brain, Sparkles, ChevronRight, Download, TrendingUp, Play, Pause, RotateCcw, AlertCircle, Target, Lightbulb, FileText, Upload, ArrowLeft, Trash2, LogOut, Eye, EyeOff, Mail, User, Lock } from "lucide-react";

const Card = ({ children, className = "", dark }) => (
  <div className={`rounded-2xl ${dark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100"} ${className}`}>{children}</div>
);

export default function StudyFlow() {
  const [view, setView] = useState("auth");
  const [dark, setDark] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [schedule, setSchedule] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [checked, setChecked] = useState({});
  const [showTimer, setShowTimer] = useState(false);
  const [tMins, setTMins] = useState(25);
  const [tSecs, setTSecs] = useState(0);
  const [tRun, setTRun] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", emoji: "📚" });
  const [addingTest, setAddingTest] = useState(false);
  const [newTest, setNewTest] = useState({ subject: "", topic: "", date: "" });

  // Heftintrag
  const [heftMode, setHeftMode] = useState("thema");
  const [heftSubject, setHeftSubject] = useState("");
  const [heftTopic, setHeftTopic] = useState("");
  const [heftPdfs, setHeftPdfs] = useState([]);
  const [heftLoading, setHeftLoading] = useState(false);
  const [heftEntries, setHeftEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Auth
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("signup"); // "signup" | "login"
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authPassConfirm, setAuthPassConfirm] = useState("");
  const [authShowPass, setAuthShowPass] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authValidating, setAuthValidating] = useState(false);
  const [katexReady, setKatexReady] = useState(false);

  const tips = [
    { e: "🧠", t: "Erkläre das Gelernten mit eigenen Worten – das festigt dein Wissen!" },
    { e: "⏰", t: "25 min lernen, 5 min Pause – die Pomodoro-Technik ist mega!" },
    { e: "😴", t: "Vor dem Test gut schlafen! Dein Gehirn speichert während des Schlafs." },
    { e: "🚶", t: "Kurze Spaziergänge zwischen Sessions helfen dem Gedächtnis." },
    { e: "✍️", t: "Handschriftlich lernen ist besser als tippen!" },
    { e: "🍎", t: "Trinke viel Wasser – Dehydrierung verschlechtert die Konzentration." },
    { e: "🎵", t: "Instrumentale Musik kann deine Konzentration steigern." },
    { e: "📝", t: "Zusammenfassungen vor dem Test = beste Wiederholungsmethode!" },
  ];

  useEffect(() => {
    const i = setInterval(() => setTipIdx((p) => (p + 1) % tips.length), 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (window.katex) { setKatexReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
    document.head.appendChild(link);
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
    sc.onload = () => setKatexReady(true);
    document.head.appendChild(sc);
  }, []);

  useEffect(() => {
    try {
      const load = (k) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; };
      setSubjects(load("sf_sub") || []);
      setTests(load("sf_tst") || []);
      setDark(load("sf_dk") || false);
      setSchedule(localStorage.getItem("sf_sch") || "");
      setStreak(parseInt(localStorage.getItem("sf_str") || "0"));
      setAiResult(localStorage.getItem("sf_ai") || "");
      setChecked(load("sf_chk") || {});
      setHeftEntries(load("sf_heft") || []);
      const session = load("sf_session");
      if (session) { setUser(session); setView("welcome"); }
    } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem("sf_sub", JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem("sf_tst", JSON.stringify(tests)); }, [tests]);
  useEffect(() => { localStorage.setItem("sf_dk", JSON.stringify(dark)); }, [dark]);
  useEffect(() => { localStorage.setItem("sf_sch", schedule); }, [schedule]);
  useEffect(() => { localStorage.setItem("sf_str", streak.toString()); }, [streak]);
  useEffect(() => { localStorage.setItem("sf_ai", aiResult); }, [aiResult]);
  useEffect(() => { localStorage.setItem("sf_chk", JSON.stringify(checked)); }, [checked]);
  useEffect(() => { localStorage.setItem("sf_heft", JSON.stringify(heftEntries)); }, [heftEntries]);

  useEffect(() => {
    if (!tRun) return;
    const iv = setInterval(() => {
      if (tSecs === 0 && tMins === 0) { setTRun(false); setStreak((p) => p + 1); return; }
      if (tSecs === 0) { setTMins((p) => p - 1); setTSecs(59); } else { setTSecs((p) => p - 1); }
    }, 1000);
    return () => clearInterval(iv);
  }, [tRun, tMins, tSecs]);

  const hashPass = (p) => btoa(encodeURIComponent(p));

  const loadUsers = () => {
    try {
      const v = localStorage.getItem("sf_users");
      const users = v ? JSON.parse(v) : [];
      // one-time migration: if old single-user key exists, fold it in
      if (users.length === 0) {
        try {
          const old = localStorage.getItem("sf_user");
          if (old) { const u = JSON.parse(old); users.push(u); localStorage.setItem("sf_users", JSON.stringify(users)); }
        } catch {}
      }
      return users;
    } catch { return []; }
  };

  const validateEmailFormat = (email) => {
    if (!email) return "Bitte eine E-Mail eingeben.";
    const re = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]{1,62}@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) return "Ungültiges E-Mail-Format.";
    const [local, domain] = email.split("@");
    if (local.length < 3) return "Mindestens 3 Zeichen vor dem @-Zeichen nötig.";
    if (local.startsWith(".") || local.endsWith(".")) return "Darf nicht mit einem Punkt beginnen oder enden.";
    if (local.includes("..")) return "Keine aufeinanderfolgenden Punkte erlaubt.";
    const parts = domain.split(".");
    const tld = parts[parts.length - 1];
    if (tld.length < 2) return "Die Domain-Endung ist ungültig.";
    return null;
  };

  const checkMX = async (domain) => {
    try {
      const res = await fetch("https://dns.google/resolve?name=" + encodeURIComponent(domain) + "&type=MX");
      const data = await res.json();
      if (data.Answer && data.Answer.some(a => a.type === 15)) return true;
      // fallback: A-Record (some Domains senden über A-Record)
      const res2 = await fetch("https://dns.google/resolve?name=" + encodeURIComponent(domain) + "&type=A");
      const data2 = await res2.json();
      return !!(data2.Answer && data2.Answer.some(a => a.type === 1));
    } catch { return true; } // network fail → let through
  };

  const handleSignup = async () => {
    setAuthError("");
    if (!authName.trim()) { setAuthError("Bitte einen Namen eingeben."); return; }
    const fmtErr = validateEmailFormat(authEmail.trim());
    if (fmtErr) { setAuthError(fmtErr); return; }
    if (authPass.length < 6) { setAuthError("Passwort muss mindestens 6 Zeichen haben."); return; }
    if (authPass !== authPassConfirm) { setAuthError("Passwörter stimmen nicht überein."); return; }

    // MX-Prüfung – verifiziert dass die Domain E-Mails empfangen kann
    setAuthValidating(true);
    const domain = authEmail.trim().toLowerCase().split("@")[1];
    const hasMX = await checkMX(domain);
    setAuthValidating(false);
    if (!hasMX) { setAuthError("Diese Domain kann keine E-Mails empfangen. Bitte eine gültige E-Mail-Adresse verwenden."); return; }

    const users = loadUsers();
    if (users.find(u => u.email === authEmail.trim().toLowerCase())) {
      setAuthError("Diese E-Mail ist bereits registriert. Bitte logge dich ein.");
      return;
    }

    const newUser = { id: Date.now(), name: authName.trim(), email: authEmail.trim().toLowerCase(), pass: hashPass(authPass), createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem("sf_users", JSON.stringify(users));
    const session = { email: newUser.email, name: newUser.name };
    localStorage.setItem("sf_session", JSON.stringify(session));
    setUser(session);
    setAuthName(""); setAuthEmail(""); setAuthPass(""); setAuthPassConfirm("");
    setView("welcome");
  };

  const handleLogin = () => {
    setAuthError("");
    if (!authEmail.trim()) { setAuthError("Bitte E-Mail eingeben."); return; }
    if (!authPass.trim()) { setAuthError("Bitte Passwort eingeben."); return; }
    const users = loadUsers();
    if (users.length === 0) { setAuthError("Noch keine Konten vorhanden. Bitte zuerst anmelden."); return; }
    const found = users.find(u => u.email === authEmail.trim().toLowerCase());
    if (!found || hashPass(authPass) !== found.pass) { setAuthError("E-Mail oder Passwort falsch."); return; }
    const session = { email: found.email, name: found.name };
    localStorage.setItem("sf_session", JSON.stringify(session));
    setUser(session);
    setAuthEmail(""); setAuthPass("");
    setView("welcome");
  };

  const logout = () => {
    localStorage.removeItem("sf_session");
    setUser(null);
    setView("auth");
    setAuthMode("login");
  };

  const today = () => {
    const n = new Date();
    return {
      str: `${String(n.getDate()).padStart(2, "0")}.${String(n.getMonth() + 1).padStart(2, "0")}.${n.getFullYear()}`,
      long: n.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    };
  };

  const daysUntil = (ds) => {
    const [d, m, y] = ds.split(".");
    const t = new Date(+y, +m - 1, +d);
    const now = new Date(); now.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0);
    return Math.round((t - now) / 86400000);
  };

  const emojis = ["📚", "🔬", "🧪", "📐", "🖊️", "🌍", "💻", "🎨", "📖", "⚽", "🎵", "🏛️", "🧮", "📊", "🌱", "⚗️"];
  const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  const addSub = () => {
    if (!newSub.name.trim()) return;
    setSubjects([...subjects, { id: Date.now(), name: newSub.name.trim(), emoji: newSub.emoji, color: colors[subjects.length % colors.length] }]);
    setNewSub({ name: "", emoji: "📚" });
    setAddingSubject(false);
  };

  const addTst = () => {
    if (!newTest.subject || !newTest.topic || !newTest.date) return;
    setTests([...tests, { id: Date.now(), ...newTest }]);
    setNewTest({ subject: "", topic: "", date: "" });
    setAddingTest(false);
  };

  const generate = async () => {
    setLoading(true);
    setAiResult("");
    setChecked({});
    const t = today();
    const tl = tests.map((x) => `- ${x.subject}: "${x.topic}" am ${x.date} (in ${daysUntil(x.date)} Tagen ab heute)`).join("\n") || "- Keine Tests eingetragen";
    const prompt = `Du bist ein motivierender Lernplan-Assistent für Schüler und Studenten.

⚠️ HEUTIGES DATUM: ${t.str} (${t.long})
Erstelle den Lernplan NUR ab heute! Nicht ab einem anderen Datum!

📋 TESTS:
${tl}

📚 FÄCHER: ${subjects.map((s) => s.name).join(", ") || "Keine"}

📅 STUNDENPLAN:
${schedule || "Nicht angegeben"}

AUFGABE:
Erstelle einen konkreten Lernplan vom HEUTE (${t.str}) bis zum nächsten anstehenden Test. Für jeden Tag ab heute konkrete Aufgaben mit Zeitblöcken.

Wichtig:
- Der Plan beginnt HEUTE am ${t.str} – nicht früher!
- Jeder Tag = eigener Abschnitt mit dem konkreten Datum
- Konkrete Themen und Aufgaben pro Tag
- Zeitblöcke angeben (z.B. 30 min, 45 min)
- Pausen zwischen den Blöcken einplanen
- Den letzten Tag vor dem Test nur für Zusammenfassung und Wiederholung nutzen

Danach 4-5 kurze, motivierende Tipps zum Lernen.

FORMAT (bitte genau so):
## 📅 [Datum] - [Wochentag]
- [ ] Aufgabe beschreiben (XX min)
- [ ] Nächste Aufgabe (XX min)
- ☕ Pause (10 min)

## 💡 Tipps zum Lernen
- Tipp 1
- Tipp 2

Sei motivierend und realistisch!`;

    try {
      const r = await fetch("https://api.bennokahmann.me/ai/google/jill/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!r.ok) throw new Error(`Fehler ${r.status}`);
      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
      if (!text.trim()) throw new Error("Keine Antwort von der KI");
      setAiResult(text);
      setView("ai");
    } catch (e) {
      alert("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Heft
  const handleFile = (file) => {
    if (!file || file.type !== "application/pdf") { alert("Bitte nur PDF-Dateien hochladen!"); return; }
    if (heftPdfs.find((p) => p.name === file.name)) { alert("Diese PDF wurde bereits hinzugefügt!"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setHeftPdfs((prev) => [...prev, { name: file.name, base64: e.target.result.split(",")[1] }]);
    reader.readAsDataURL(file);
  };

  const handleFiles = (files) => {
    Array.from(files).forEach((f) => handleFile(f));
  };

  const generateHeft = async () => {
    if (heftMode === "thema" && (!heftSubject.trim() || !heftTopic.trim())) { alert("Bitte Fach und Thema eingeben!"); return; }
    if (heftMode === "pdf" && heftPdfs.length === 0) { alert("Bitte mindestens eine PDF-Datei hochladen!"); return; }
    setHeftLoading(true);

    try {
      let parts = [];
      if (heftMode === "thema") {
        parts = [{ text: `Du bist ein brillanter Lehrer für Schüler und Studenten.\n\nFach: ${heftSubject}\nThema: ${heftTopic}\n\nErstelle einen wunderschönen, detaillierten Heftintrag über dieses Thema. Der Eintrag soll:\n- Das Thema vollständig und verständlich erklären\n- Mit einer kurzen Definition beginnen\n- Wichtige Konzepte, Zusammenhänge und Beispiele enthalten\n- Für Schüler/Studenten leicht verständlich sein\n- Mit einem kurzen "Merke dir!" Kasten am Ende enden\n\nFORMAT:\n# 📚 ${heftTopic}\n**Fach:** ${heftSubject}\n\n## 🔑 Definition\n...\n\n## 📝 Erklärung\n...\n\n## 💡 Beispiele\n...\n\n## 🔗 Zusammenhänge\n...\n\n## ✅ Merke dir!\n- Wichtigster Punkt 1\n- Wichtigster Punkt 2\n\nSei detailliert, klar und motivierend!` }];
      } else {
        const pdfNames = heftPdfs.map((p) => p.name).join(", ");
        const pdfParts = heftPdfs.map((p) => ({ inlineData: { mimeType: "application/pdf", data: p.base64 } }));
        parts = [
          ...pdfParts,
          { text: `Du bist ein brillanter Lehrer für Schüler und Studenten.\n\nEs werden ${heftPdfs.length} PDF-Datei${heftPdfs.length > 1 ? "en" : ""} aus einem Unterricht oder Kurs mitgeteilt (${pdfNames}). Fasse sie zusammen und erstelle einen schönen, lernbaren Heftintrag der ALLE Dokumente umfasst.\n\nDer Eintrag soll:\n- Die wichtigsten Punkte aus ALLEN Dokumenten zusammenfassen\n- Zusammenhänge zwischen den Dokumenten aufzeigen\n- Klar und verständlich erklären\n- Mit einem "Merke dir!" Kasten enden\n\nFORMAT:\n# 📚 Zusammenfassung: ${pdfNames}\n\n## 🔑 Hauptthemen\n...\n\n## 📝 Wichtige Punkte\n...\n\n## 💡 Erklärungen & Beispiele\n...\n\n## 🔗 Zusammenhänge\n...\n\n## ✅ Merke dir!\n- Wichtigster Punkt 1\n- Wichtigster Punkt 2\n\nSei detailliert, klar und motivierend!` }
        ];
      }

      const r = await fetch("https://api.bennokahmann.me/ai/google/jill/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      });
      if (!r.ok) throw new Error(`Fehler ${r.status}`);
      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
      if (!text.trim()) throw new Error("Keine Antwort von der KI");

      const entry = {
        id: Date.now(),
        mode: heftMode,
        subject: heftMode === "thema" ? heftSubject : "",
        topic: heftMode === "thema" ? heftTopic : heftPdfs.map((p) => p.name).join(", "),
        content: text,
        date: today().str,
      };
      setHeftEntries((prev) => [entry, ...prev]);
      setActiveEntry(entry);
      setView("heft-entry");
      setHeftSubject("");
      setHeftTopic("");
      setHeftPdfs([]);
    } catch (e) {
      alert("❌ " + e.message);
    } finally {
      setHeftLoading(false);
    }
  };

  const toggleCheck = (k) => setChecked((p) => ({ ...p, [k]: !p[k] }));
  const totalTasks = (aiResult.match(/^- \[[ x]\]/gm) || []).length;
  const doneCount = Object.values(checked).filter(Boolean).length;
  const progress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // Inline formatting: bold-italic, bold, italic, inline code, underline
  // Pre-clean raw AI text to strip artifacts before line-by-line rendering
  const cleanAI = (raw) => {
    let t = raw;
    // 1. Strip outer ```markdown ... ``` wrapper the AI sometimes adds around the whole response
    t = t.replace(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/, "$1");
    // 2. Strip stray triple backticks that appear alone on a line (leftover fences)
    t = t.replace(/^```\w*\s*$/gm, "");
    // 3. Convert markdown links [text](url) → text only
    t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    // 4. Convert strikethrough ~~text~~ → plain text
    t = t.replace(/~~([^~]+?)~~/g, "$1");
    // 5. Remove stray | characters that aren't part of a table row (but never touch lines with math $)
    t = t.split("\n").map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) return line;
      if (trimmed.includes("$")) return line;
      return line.replace(/\|/g, "");
    }).join("\n");
    // 6. Common HTML entities
    t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
    // 7. Remove /{...} template artifacts
    t = t.replace(/\/\{[^}]*\}/g, "");
    // 8. Remove lone empty curly braces
    t = t.replace(/^\s*\{?\s*\}\s*$/gm, "");
    // 9. Collapse 3+ empty lines into 1
    t = t.replace(/\n{3,}/g, "\n\n");
    return t;
  };

  const renderMath = (expr, displayMode, key) => {
    try {
      if (window.katex) {
        const html = window.katex.renderToString(expr.trim(), { displayMode, throwOnError: false });
        return <span key={key} dangerouslySetInnerHTML={{ __html: html }} className={displayMode ? "block overflow-x-auto py-1" : "inline"} />;
      }
    } catch (e) {}
    return <code key={key} className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono ${dark ? "bg-gray-700 text-emerald-400" : "bg-gray-200 text-emerald-700"}`}>{expr}</code>;
  };

  const renderInline = (text) => {
    // Split by patterns in priority order – includes links and strikethrough
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|```[\s\S]*?```|`[^`]+`|\*\*\*.*?\*\*\*|___.*?___|\[[^\]]*\]\([^)]*\)|~~[^~]+?~~|\*\*.*?\*\*|__.*?__|``.*?``|\*[^*\n]+?\*|_[^_\n]+?_)/g);
    return parts.map((part, i) => {
      if (!part) return null;
      // Display math $$...$$
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
        return renderMath(part.slice(2, -2), true, i);
      }
      // Inline math $...$  (only if it looks like LaTeX: contains \ ^ _ or {)
      if (part.startsWith("$") && part.endsWith("$") && !part.startsWith("$$") && part.length > 2) {
        const inner = part.slice(1, -1);
        if (/[\\^_{]/.test(inner)) return renderMath(inner, false, i);
      }
      // Inline code
      const codeMatch = part.match(/^``(.+)``$/) || part.match(/^`(.+)`$/);
      if (codeMatch) {
        return <code key={i} className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono ${dark ? "bg-gray-700 text-emerald-400" : "bg-gray-200 text-emerald-700"}`}>{codeMatch[1]}</code>;
      }
      // Markdown link [text](url)
      const linkMatch = part.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
      if (linkMatch) {
        return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={`underline ${dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500"}`}>{linkMatch[1]}</a>;
      }
      // Strikethrough ~~text~~
      if (part.startsWith("~~") && part.endsWith("~~")) {
        return <s key={i} className={dark ? "text-gray-500" : "text-gray-400"}>{part.slice(2, -2)}</s>;
      }
      // Bold italic ***text***
      if (part.startsWith("***") && part.endsWith("***")) {
        return <strong key={i} className={`italic ${dark ? "text-white" : "text-gray-900"}`}>{part.slice(3, -3)}</strong>;
      }
      // Bold underline ___text___
      if (part.startsWith("___") && part.endsWith("___")) {
        return <strong key={i} className={`underline ${dark ? "text-white" : "text-gray-900"}`}>{part.slice(3, -3)}</strong>;
      }
      // Bold **text** or __text__
      if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
        return <strong key={i} className={dark ? "text-white" : "text-gray-900"}>{part.slice(2, -2)}</strong>;
      }
      // Italic *text* or _text_
      if ((part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) ||
          (part.startsWith("_") && part.endsWith("_") && !part.startsWith("__"))) {
        return <em key={i} className={dark ? "text-gray-300 italic" : "text-gray-500 italic"}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderMD = (text, enableCheckboxes = false) => {
    const lines = cleanAI(text).split("\n");
    let taskI = 0;
    let inCodeBlock = false;
    let codeLines = [];
    let codeLang = "";
    let inMathBlock = false;
    let mathLines = [];
    const output = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.trim().slice(3).trim();
          codeLines = [];
          continue;
        } else {
          inCodeBlock = false;
          output.push(
            <div key={`code-${i}`} className={`my-3 rounded-lg overflow-hidden border ${dark ? "border-gray-600" : "border-gray-200"}`}>
              {codeLang && <div className={`px-3 py-1 text-xs font-mono ${dark ? "bg-gray-700 text-gray-400 border-b border-gray-600" : "bg-gray-100 text-gray-500 border-b border-gray-200"}`}>{codeLang}</div>}
              <pre className={`p-3 overflow-x-auto text-xs font-mono leading-relaxed whitespace-pre ${dark ? "bg-gray-900 text-emerald-400" : "bg-gray-50 text-emerald-700"}`}>
                {codeLines.join("\n")}
              </pre>
            </div>
          );
          continue;
        }
      }
      if (inCodeBlock) { codeLines.push(line); continue; }

      // Multi-line math block: line is exactly $$
      if (line.trim() === "$$") {
        if (!inMathBlock) { inMathBlock = true; mathLines = []; continue; }
        inMathBlock = false;
        output.push(
          <div key={`math-${i}`} className={`my-3 rounded-xl p-3 overflow-x-auto ${dark ? "bg-gray-800/60 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
            {renderMath(mathLines.join("\n"), true, `math-${i}`)}
          </div>
        );
        continue;
      }
      if (inMathBlock) { mathLines.push(line); continue; }

      // Single-line display math  $$...$$
      if (line.trim().startsWith("$$") && line.trim().endsWith("$$") && line.trim().length > 4) {
        output.push(
          <div key={`math-${i}`} className={`my-3 rounded-xl p-3 overflow-x-auto ${dark ? "bg-gray-800/60 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
            {renderMath(line.trim().slice(2, -2).trim(), true, `math-${i}`)}
          </div>
        );
        continue;
      }

      // Horizontal rule ---
      if (/^---+$/.test(line.trim())) {
        output.push(<hr key={i} className={`my-4 border-0 h-0.5 rounded-full ${dark ? "bg-gray-700" : "bg-gray-200"}`} />);
        continue;
      }

      // Table: lines starting and ending with |
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        // Collect all consecutive table lines
        let tableLines = [];
        let j = i;
        while (j < lines.length && lines[j].trim().startsWith("|") && lines[j].trim().endsWith("|")) {
          tableLines.push(lines[j]);
          j++;
        }
        // Parse table
        const rows = tableLines.map((tl) => tl.split("|").map((c) => c.trim()).filter((c) => c !== ""));
        const separatorIdx = rows.findIndex((r) => r.every((c) => /^[-:]+$/.test(c)));
        const hasHeader = separatorIdx === 1;

        output.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto">
            <table className={`w-full text-sm border-collapse rounded-lg overflow-hidden ${dark ? "border border-gray-600" : "border border-gray-200"}`}>
              <tbody>
                {rows.map((row, ri) => {
                  if (ri === separatorIdx) return null; // skip separator row
                  const isHeader = hasHeader && ri === 0;
                  return (
                    <tr key={ri} className={isHeader ? (dark ? "bg-gray-700" : "bg-indigo-50") : (ri % 2 === 0 ? (dark ? "bg-gray-800" : "bg-white") : (dark ? "bg-gray-750" : "bg-gray-50"))}>
                      {row.map((cell, ci) => {
                        const Tag = isHeader ? "th" : "td";
                        return (
                          <Tag key={ci} className={`px-3 py-2 text-left border ${dark ? "border-gray-600" : "border-gray-200"} ${isHeader ? `font-bold text-xs uppercase tracking-wide ${dark ? "text-indigo-300" : "text-indigo-600"}` : `text-xs ${dark ? "text-gray-300" : "text-gray-600"}`}`}>
                            {renderInline(cell)}
                          </Tag>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        i = j - 1; // skip consumed table lines
        continue;
      }

      // Blockquote > ...
      if (line.startsWith("> ") || line === ">") {
        const qText = line.slice(line.startsWith("> ") ? 2 : 1);
        output.push(
          <div key={i} className={`my-2 pl-4 border-l-4 ${dark ? "border-indigo-600 bg-indigo-900/15" : "border-indigo-400 bg-indigo-50"} rounded-r-lg py-2 pr-3`}>
            <p className={`text-sm leading-relaxed ${dark ? "text-indigo-300" : "text-indigo-700"}`}>{renderInline(qText)}</p>
          </div>
        );
        continue;
      }

      // ### H3
      if (line.startsWith("### ")) {
        output.push(
          <h3 key={i} className={`text-base md:text-lg font-bold mt-4 mb-1.5 ${dark ? "text-purple-300" : "text-purple-700"}`}>{renderInline(line.slice(4))}</h3>
        );
        continue;
      }

      // ## H2
      if (line.startsWith("## ")) {
        output.push(
          <div key={i} className="mt-6 mb-2.5">
            <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">{renderInline(line.slice(3))}</h2>
            <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mt-1" />
          </div>
        );
        continue;
      }

      // # H1
      if (line.startsWith("# ")) {
        output.push(
          <h1 key={i} className="text-xl md:text-2xl font-extrabold mt-4 mb-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">{renderInline(line.slice(2))}</h1>
        );
        continue;
      }

      // Checkbox - [ ] or - [x]
      if (enableCheckboxes && /^- \[[ x]\]/.test(line)) {
        const content = line.replace(/^- \[[ x]\] /, "");
        const key = `t${taskI}`; taskI++;
        const done = checked[key];
        output.push(
          <div key={i} onClick={() => toggleCheck(key)} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg my-1.5 cursor-pointer select-none transition-all active:scale-[0.98] ${
            done ? (dark ? "bg-emerald-900/25 border border-emerald-800/40" : "bg-emerald-50 border border-emerald-200")
                 : (dark ? "bg-gray-800/60 border border-gray-700/40 hover:bg-gray-800/80" : "bg-white border border-gray-200 hover:bg-gray-50")
          }`}>
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? "bg-emerald-500 border-emerald-500" : dark ? "border-gray-500" : "border-gray-300"}`}>
              {done && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className={`text-sm md:text-base leading-relaxed ${done ? "line-through text-gray-400" : dark ? "text-gray-200" : "text-gray-700"}`}>{renderInline(content)}</span>
          </div>
        );
        continue;
      }

      // ☕ Pause line
      if (line.includes("☕") || (line.startsWith("- ") && /pause/i.test(line))) {
        output.push(
          <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg my-1 ${dark ? "bg-amber-900/15" : "bg-amber-50"}`}>
            <span className="text-amber-500 text-sm">☕</span>
            <span className={`text-xs italic ${dark ? "text-amber-300" : "text-amber-700"}`}>{line.replace(/^- /, "")}</span>
          </div>
        );
        continue;
      }

      // Bullet list - or •
      if (/^[-•]\s/.test(line)) {
        const c = line.replace(/^[-•]\s/, "");
        output.push(
          <li key={i} className={`ml-5 mb-2 text-sm md:text-base list-disc leading-relaxed ${dark ? "text-gray-300" : "text-gray-600"}`}>
            {renderInline(c)}
          </li>
        );
        continue;
      }

      // Numbered list
      if (/^\d+[.)]\s/.test(line)) {
        const c = line.replace(/^\d+[.)]\s/, "");
        output.push(
          <li key={i} className={`ml-5 mb-2 text-sm md:text-base list-decimal leading-relaxed ${dark ? "text-gray-300" : "text-gray-600"}`}>
            {renderInline(c)}
          </li>
        );
        continue;
      }

      // Empty line
      if (!line.trim()) { output.push(<div key={i} className="h-2" />); continue; }

      // Default paragraph
      output.push(
        <p key={i} className={`mb-2 text-sm md:text-base leading-relaxed ${dark ? "text-gray-300" : "text-gray-600"}`}>
          {renderInline(line)}
        </p>
      );
    }
    return output;
  };

  const exportPlan = () => {
    const b = new Blob([aiResult], { type: "text/plain" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = `lernplan-${today().str}.txt`; a.click(); URL.revokeObjectURL(u);
  };

  const nextTest = tests.filter((t) => daysUntil(t.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0];


  // ===== AUTH SCREEN =====
  if (view === "auth") {
    return (
      <div className={`w-screen min-h-screen relative overflow-hidden ${dark ? "bg-gray-950" : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"}`}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl ${dark ? "bg-purple-600 opacity-20" : "bg-purple-400 opacity-30"}`} style={{ animation: "blob1 8s ease-in-out infinite" }} />
          <div className={`absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-3xl ${dark ? "bg-blue-600 opacity-15" : "bg-blue-400 opacity-25"}`} style={{ animation: "blob2 10s ease-in-out infinite 2s" }} />
          <div className={`absolute -bottom-32 left-1/3 w-96 h-96 rounded-full blur-3xl ${dark ? "bg-pink-600 opacity-15" : "bg-pink-400 opacity-25"}`} style={{ animation: "blob3 12s ease-in-out infinite 4s" }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 py-12">
          <button onClick={() => setDark(!dark)} className={`absolute top-5 right-5 p-3 rounded-2xl transition-all hover:scale-110 ${dark ? "bg-gray-800 text-yellow-400" : "bg-white/80 backdrop-blur text-gray-600 shadow-lg"}`}>
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Logo */}
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-xl mb-6 ${dark ? "bg-gradient-to-br from-indigo-600 to-purple-700 shadow-purple-500/30" : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-purple-400/30"}`} style={{ animation: "float 3s ease-in-out infinite" }}>
            <Book size={36} className="text-white" />
          </div>
          <h1 className={`text-3xl md:text-4xl font-extrabold mb-1 ${dark ? "text-white" : "text-gray-900"}`}>StudyFlow</h1>
          <p className={`text-sm md:text-base mb-8 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {authMode === "signup" ? "Erstelle dein Konto und fange an zu lernen" : "Willkommen zurück – meld dich wieder ein"}
          </p>

          {/* Card */}
          <div className={`w-full max-w-sm rounded-2xl shadow-xl overflow-hidden ${dark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
            {/* Top color bar */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6 md:p-7">
              {/* Mode toggle */}
              <div className={`flex gap-1 p-1 rounded-xl mb-6 ${dark ? "bg-gray-700" : "bg-gray-100"}`}>
                {["signup", "login"].map((m) => (
                  <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${authMode === m ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm" : dark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}>
                    {m === "signup" ? "✨ Anmelden" : "🔑 Einloggen"}
                  </button>
                ))}
              </div>

              {/* Signup fields */}
              {authMode === "signup" && (
                <div className="space-y-3.5">
                  <div>
                    <label className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}><User size={12} /> Name</label>
                    <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Dein Name" className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}><Mail size={12} /> E-Mail</label>
                    <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="du@beispiel.de" className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}><Lock size={12} /> Passwort</label>
                    <div className="relative">
                      <input type={authShowPass ? "text" : "password"} value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="Min. 6 Zeichen" className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                      <button onClick={() => setAuthShowPass(!authShowPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                        {authShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}><Lock size={12} /> Passwort wiederholen</label>
                    <input type={authShowPass ? "text" : "password"} value={authPassConfirm} onChange={(e) => setAuthPassConfirm(e.target.value)} placeholder="Noch einmal eingeben" className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                  </div>
                </div>
              )}

              {/* Login fields */}
              {authMode === "login" && (
                <div className="space-y-3.5">
                  <div>
                    <label className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}><Mail size={12} /> E-Mail</label>
                    <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="du@beispiel.de" className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}><Lock size={12} /> Passwort</label>
                    <div className="relative">
                      <input type={authShowPass ? "text" : "password"} value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="Dein Passwort" onKeyDown={(e) => e.key === "Enter" && handleLogin()} className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                      <button onClick={() => setAuthShowPass(!authShowPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                        {authShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {authError && (
                <div className={`mt-4 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${dark ? "bg-red-900/25 border border-red-800/50 text-red-400" : "bg-red-50 border border-red-200 text-red-600"}`}>
                  <AlertCircle size={14} className="flex-shrink-0" /> {authError}
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={authMode === "signup" ? handleSignup : handleLogin}
                disabled={authValidating}
                className={`w-full mt-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${authValidating ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]"}`}
              >
                {authValidating
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> E-Mail wird geprüft...</>
                  : authMode === "signup" ? <><Sparkles size={16} /> Konto erstellen</> : <><Book size={16} /> Einloggen</>
                }
              </button>

              {/* Hint */}
              <p className={`text-center text-xs mt-4 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                {authMode === "signup"
                  ? <>Schon ein Konto? <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className="text-indigo-500 hover:text-indigo-400 font-semibold">Hier einloggen</button></>
                  : <>Noch kein Konto? <button onClick={() => { setAuthMode("signup"); setAuthError(""); }} className="text-indigo-500 hover:text-indigo-400 font-semibold">Hier anmelden</button></>
                }
              </p>
            </div>
          </div>
        </div>
        <style>{`
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden; }

          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes blob1 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.15) translate(20px,30px)} }
          @keyframes blob2 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.2) translate(-30px,20px)} }
          @keyframes blob3 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.1) translate(25px,-20px)} }
        `}</style>
      </div>
    );
  }

  // ===== WELCOME =====
  if (view === "welcome") {
    return (
      <div className={`w-screen min-h-screen relative overflow-hidden ${dark ? "bg-gray-950" : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"}`}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl ${dark ? "bg-purple-600 opacity-20" : "bg-purple-400 opacity-30"}`} style={{ animation: "blob1 8s ease-in-out infinite" }} />
          <div className={`absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-3xl ${dark ? "bg-blue-600 opacity-15" : "bg-blue-400 opacity-25"}`} style={{ animation: "blob2 10s ease-in-out infinite 2s" }} />
          <div className={`absolute -bottom-32 left-1/3 w-96 h-96 rounded-full blur-3xl ${dark ? "bg-pink-600 opacity-15" : "bg-pink-400 opacity-25"}`} style={{ animation: "blob3 12s ease-in-out infinite 4s" }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 py-16">
          <button onClick={() => setDark(!dark)} className={`absolute top-5 right-5 p-3 rounded-2xl transition-all hover:scale-110 ${dark ? "bg-gray-800 text-yellow-400" : "bg-white/80 backdrop-blur text-gray-600 shadow-lg"}`}>
            {dark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <div className={`w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-3xl flex items-center justify-center shadow-2xl mb-8 ${dark ? "bg-gradient-to-br from-indigo-600 to-purple-700 shadow-purple-500/30" : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-purple-400/30"}`} style={{ animation: "float 3s ease-in-out infinite" }}>
            <Book size={44} className="text-white" style={{ width: "clamp(36px, 5vw, 56px)", height: "clamp(36px, 5vw, 56px)" }} />
          </div>
          <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-2 text-center ${dark ? "text-white" : "text-gray-900"}`}>StudyFlow</h1>
          <p className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">Lerne smarter, nicht härter.</p>
          <p className={`text-sm md:text-base lg:text-lg max-w-lg text-center mb-10 leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Dein KI-powered Lernplan-Assistent. Personalisierte Pläne ab heute bis zum Test – komplett automatisch.
          </p>
          <button onClick={() => setView("dashboard")} className="group px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl text-base md:text-lg font-bold shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105 hover:-translate-y-1 flex items-center gap-3">
            Jetzt starten <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl lg:max-w-3xl">
            {[
              { icon: Brain, title: "KI-Lernpläne", desc: "Personalisiert ab heute", g: "from-purple-500 to-pink-500" },
              { icon: Clock, title: "Pomodoro", desc: "Fokus & Pausen", g: "from-orange-500 to-red-500" },
              { icon: Target, title: "Streak & Ziele", desc: "Bleib motiviert", g: "from-blue-500 to-cyan-500" },
            ].map((f, i) => (
              <div key={i} className={`group p-5 md:p-6 rounded-2xl backdrop-blur transition-all hover:scale-105 hover:-translate-y-1 ${dark ? "bg-gray-800/60 border border-gray-700" : "bg-white/70 border border-white shadow-lg"}`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.g} flex items-center justify-center mb-3 group-hover:rotate-6 transition-transform`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className={`font-bold text-sm md:text-base ${dark ? "text-white" : "text-gray-900"}`}>{f.title}</h3>
                <p className={`text-xs md:text-sm mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden; }

          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
          @keyframes blob1 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.15) translate(20px,30px)} }
          @keyframes blob2 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.2) translate(-30px,20px)} }
          @keyframes blob3 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.1) translate(25px,-20px)} }
        `}</style>
      </div>
    );
  }

  // ===== APP SHELL =====
  return (
    <div className={`w-screen min-h-screen ${dark ? "bg-gray-950" : "bg-gray-100"} transition-colors duration-500`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-48 -right-48 w-96 h-96 rounded-full blur-3xl ${dark ? "bg-purple-600 opacity-10" : "bg-indigo-400 opacity-10"}`} />
        <div className={`absolute -bottom-48 -left-48 w-80 h-80 rounded-full blur-3xl ${dark ? "bg-pink-600 opacity-8" : "bg-pink-400 opacity-10"}`} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Nav */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("welcome")} className={`p-2.5 rounded-xl transition-all hover:scale-110 ${dark ? "bg-gray-800 text-white" : "bg-white text-gray-900 shadow-md"}`}>
              <Book size={22} />
            </button>
            <div>
              <h1 className={`text-lg md:text-xl lg:text-2xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>
                {view === "ai" ? "✨ Dein Lernplan" : (view === "heft" || view === "heft-entry") ? "📓 Heftintrag" : "📚 Dashboard"}
              </h1>
              <p className={`text-xs md:text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>{today().long}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { id: "dashboard", label: "Dashboard", bg: "#4f46e5" },
              { id: "heft", label: "📓 Heft", bg: "#059669" },
              ...(aiResult ? [{ id: "ai", label: "KI-Plan", bg: "#9333ea" }] : []),
            ].map((n) => {
              const active = view === n.id || (view === "heft-entry" && n.id === "heft");
              return (
                <button key={n.id} onClick={() => { setView(n.id); setActiveEntry(null); }} className={`px-3 md:px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all ${active ? "text-white shadow-md" : dark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"}`} style={active ? { background: n.bg } : {}}>
                  {n.label}
                </button>
              );
            })}
            <button onClick={() => setDark(!dark)} className={`p-2 rounded-xl transition-all hover:scale-110 ${dark ? "bg-gray-800 text-yellow-400" : "bg-white text-gray-600 shadow-sm"}`}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user && (
              <div className="flex items-center gap-1.5">
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${dark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200 shadow-sm"}`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.name[0]?.toUpperCase()}</span>
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${dark ? "text-gray-300" : "text-gray-700"}`}>{user.name}</span>
                </div>
                <button onClick={logout} className={`p-2 rounded-xl transition-all hover:scale-110 hover:text-red-500 ${dark ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500 shadow-sm"}`} title="Abmelden">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tip Banner */}
        <div className={`mb-4 p-3 md:p-4 rounded-xl flex items-center gap-3 transition-all ${dark ? "bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-800/40" : "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"}`}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Lightbulb size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-purple-400" : "text-purple-600"}`}>💡 Tipp</p>
            <p className={`text-xs md:text-sm leading-relaxed ${dark ? "text-gray-300" : "text-gray-600"}`}>{tips[tipIdx].e} {tips[tipIdx].t}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {tips.map((_, i) => <button key={i} onClick={() => setTipIdx(i)} className={`rounded-full transition-all ${i === tipIdx ? "bg-purple-500 w-3.5 h-1.5" : `h-1.5 w-1.5 ${dark ? "bg-gray-600" : "bg-gray-300"}`}`} />)}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Fächer", val: subjects.length, icon: Book, g: "from-blue-500 to-indigo-500" },
            { label: "Tests", val: tests.length, icon: Calendar, g: "from-purple-500 to-pink-500" },
            { label: "Streak 🔥", val: streak, icon: TrendingUp, g: "from-orange-500 to-red-500" },
            { label: nextTest ? `Test in ${daysUntil(nextTest.date)}d` : "Kein Test", val: nextTest ? nextTest.subject : "—", icon: Target, g: "from-emerald-500 to-teal-500" },
          ].map((s, i) => (
            <Card dark={dark} key={i} className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold uppercase tracking-wide truncate ${dark ? "text-gray-500" : "text-gray-400"}`}>{s.label}</span>
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.g} flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={14} className="text-white" />
                </div>
              </div>
              <p className={`text-lg md:text-xl font-extrabold truncate ${dark ? "text-white" : "text-gray-900"}`}>{s.val}</p>
            </Card>
          ))}
        </div>

        {/* Pomodoro */}
        {showTimer && (
          <Card dark={dark} className="mb-4 p-5 md:p-6 text-center">
            <p className={`text-xs font-bold mb-2 uppercase tracking-wider ${dark ? "text-gray-400" : "text-gray-500"}`}>🍅 Pomodoro Timer</p>
            <div className={`text-5xl md:text-6xl font-mono font-extrabold mb-3 ${tRun ? "text-red-500" : dark ? "text-indigo-400" : "text-indigo-600"}`}>
              {String(tMins).padStart(2, "0")}:{String(tSecs).padStart(2, "0")}
            </div>
            <div className="flex justify-center gap-2 mb-2">
              <button onClick={() => setTRun(!tRun)} className={`px-5 py-2 rounded-lg font-bold text-xs md:text-sm transition-all hover:scale-105 ${tRun ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                {tRun ? <><Pause size={14} className="inline mr-1" />Pause</> : <><Play size={14} className="inline mr-1" />Start</>}
              </button>
              <button onClick={() => { setTRun(false); setTMins(25); setTSecs(0); }} className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm ${dark ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700"}`}>
                <RotateCcw size={13} className="inline mr-1" />Reset
              </button>
            </div>
            <div className="flex justify-center gap-1.5">
              {[15, 25, 45].map((m) => (
                <button key={m} onClick={() => { setTMins(m); setTSecs(0); setTRun(false); }} className={`px-3 py-1 rounded-lg text-xs font-semibold ${tMins === m && tSecs === 0 && !tRun ? "bg-indigo-500 text-white" : dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{m}min</button>
              ))}
            </div>
          </Card>
        )}

        {/* ===== DASHBOARD ===== */}
        {view === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-4">
              {/* Subjects */}
              <Card dark={dark} className="p-4 md:p-5">
                <div className="flex justify-between items-center mb-3">
                  <h2 className={`text-sm md:text-base font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>📚 Fächer</h2>
                  <button onClick={() => setAddingSubject(!addingSubject)} className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:scale-110 transition-all shadow-sm"><Plus size={15} /></button>
                </div>
                {addingSubject && (
                  <div className={`p-3 rounded-lg mb-3 ${dark ? "bg-gray-700/50 border border-gray-600" : "bg-gray-50 border border-gray-200"}`}>
                    <input autoFocus value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addSub()} placeholder="Fach-Name..." className={`w-full px-3 py-2 rounded-lg text-sm border mb-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dark ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                    <p className={`text-xs font-semibold mb-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Emoji:</p>
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {emojis.map((e) => (
                        <button key={e} onClick={() => setNewSub({ ...newSub, emoji: e })} className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${newSub.emoji === e ? "bg-indigo-500 scale-110 shadow-sm" : dark ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-100 hover:bg-gray-200"}`}>{e}</button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={addSub} className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:scale-105 transition-all">Hinzufügen</button>
                      <button onClick={() => setAddingSubject(false)} className={`px-3 py-2 rounded-lg text-xs font-bold ${dark ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700"}`}>Nein</button>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  {subjects.length === 0 ? (
                    <p className={`text-xs text-center py-5 ${dark ? "text-gray-500" : "text-gray-400"}`}>Noch keine Fächer – klicke auf +!</p>
                  ) : subjects.map((s) => (
                    <div key={s.id} className={`group flex items-center gap-2.5 p-2.5 rounded-lg transition-all hover:scale-[1.02] ${dark ? "bg-gray-700/50 hover:bg-gray-700/70" : "bg-gray-50 hover:bg-gray-100"}`}>
                      <span className="text-base">{s.emoji}</span>
                      <span className={`flex-1 font-semibold text-xs md:text-sm ${dark ? "text-white" : "text-gray-900"}`}>{s.name}</span>
                      <button onClick={() => setSubjects(subjects.filter((x) => x.id !== s.id))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all"><X size={15} /></button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Tests */}
              <Card dark={dark} className="p-4 md:p-5">
                <div className="flex justify-between items-center mb-3">
                  <h2 className={`text-sm md:text-base font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>📝 Tests</h2>
                  <button onClick={() => setAddingTest(!addingTest)} className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center hover:scale-110 transition-all shadow-sm"><Plus size={15} /></button>
                </div>
                {addingTest && (
                  <div className={`p-3 rounded-lg mb-3 ${dark ? "bg-gray-700/50 border border-gray-600" : "bg-gray-50 border border-gray-200"}`}>
                    <input value={newTest.subject} onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })} placeholder="Fach..." className={`w-full px-3 py-2 rounded-lg text-sm border mb-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${dark ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                    <input value={newTest.topic} onChange={(e) => setNewTest({ ...newTest, topic: e.target.value })} placeholder="Thema..." className={`w-full px-3 py-2 rounded-lg text-sm border mb-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${dark ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                    <input value={newTest.date} onChange={(e) => setNewTest({ ...newTest, date: e.target.value })} placeholder="TT.MM.JJJJ" className={`w-full px-3 py-2 rounded-lg text-sm border mb-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${dark ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                    <div className="flex gap-1.5">
                      <button onClick={addTst} className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:scale-105 transition-all">Hinzufügen</button>
                      <button onClick={() => setAddingTest(false)} className={`px-3 py-2 rounded-lg text-xs font-bold ${dark ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700"}`}>Nein</button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {tests.length === 0 ? (
                    <p className={`text-xs text-center py-5 ${dark ? "text-gray-500" : "text-gray-400"}`}>Keine Tests – trage deine ein!</p>
                  ) : tests.map((t) => {
                    const days = daysUntil(t.date);
                    const urgent = days >= 0 && days <= 3;
                    const passed = days < 0;
                    return (
                      <div key={t.id} className={`group p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                        passed ? (dark ? "bg-gray-700/30 border-gray-600" : "bg-gray-100 border-gray-200")
                          : urgent ? (dark ? "bg-red-900/20 border-red-800/50" : "bg-red-50 border-red-200")
                          : (dark ? "bg-purple-900/15 border-purple-800/40" : "bg-purple-50 border-purple-200")
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <p className={`font-bold text-xs md:text-sm truncate ${passed ? "line-through text-gray-400" : urgent ? "text-red-600" : dark ? "text-purple-400" : "text-purple-600"}`}>
                              {t.subject} {urgent && !passed && <AlertCircle size={12} className="inline animate-pulse" />}
                            </p>
                            <p className={`text-xs mt-0.5 truncate ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.topic}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${passed ? "bg-emerald-100 text-emerald-700" : urgent ? "bg-red-100 text-red-700" : dark ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                              {passed ? "✓ Vorbei" : days === 0 ? "⚡ Heute!" : days === 1 ? "⏰ Morgen" : `${days}d`}
                            </span>
                            <button onClick={() => setTests(tests.filter((x) => x.id !== t.id))} className="opacity-0 group-hover:opacity-100 text-red-400 transition-all"><X size={13} /></button>
                          </div>
                        </div>
                        {!passed && (
                          <div className={`mt-2 h-1 rounded-full overflow-hidden ${dark ? "bg-gray-700" : "bg-gray-200"}`}>
                            <div className={`h-full rounded-full transition-all ${urgent ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`} style={{ width: `${Math.max(8, 100 - (days / 30) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right */}
            <div className="md:col-span-1 lg:col-span-2 space-y-4">
              <Card dark={dark} className="p-4 md:p-5">
                <h2 className={`text-sm md:text-base font-extrabold mb-2.5 ${dark ? "text-white" : "text-gray-900"}`}>🗓️ Stundenplan</h2>
                <textarea value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder={"Montag: 8-10 Mathe, 10-12 Deutsch\nDienstag: 8-10 Bio, 12-14 Sport\n..."} className={`w-full h-36 md:h-44 px-3.5 py-3 rounded-lg border text-xs md:text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-2xl border-2 border-dashed p-4 md:p-5 transition-all ${dark ? "bg-gradient-to-br from-indigo-900/25 to-purple-900/25 border-purple-700/40" : "bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-300"}`}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <Brain size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className={`text-sm md:text-base font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>KI-Lernplan</h2>
                      <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>Plan ab heute bis zum Test</p>
                    </div>
                  </div>
                  <button onClick={generate} disabled={loading} className={`w-full py-3 rounded-lg font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${loading ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02] shadow-md"}`}>
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generiere...</> : <><Sparkles size={16} /> KI-Lernplan erstellen</>}
                  </button>
                </div>

                <button onClick={() => setShowTimer(!showTimer)} className={`rounded-2xl p-4 md:p-5 transition-all flex flex-col items-center justify-center gap-2 hover:scale-[1.02] ${
                  showTimer ? (dark ? "bg-orange-900/30 border-2 border-orange-700" : "bg-orange-50 border-2 border-orange-200")
                           : (dark ? "bg-gray-800 border-2 border-gray-700 hover:bg-gray-700" : "bg-white border-2 border-gray-200 hover:bg-gray-50 shadow-sm")
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${showTimer ? "bg-orange-500" : dark ? "bg-gray-700" : "bg-gray-100"}`}>
                    <Clock size={20} className={showTimer ? "text-white" : dark ? "text-orange-400" : "text-orange-500"} />
                  </div>
                  <p className={`text-xs md:text-sm font-bold ${showTimer ? (dark ? "text-orange-300" : "text-orange-700") : dark ? "text-gray-300" : "text-gray-600"}`}>🍅 Pomodoro Timer</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== AI VIEW ===== */}
        {view === "ai" && (
          <div className="max-w-3xl mx-auto">
            {progress === 100 && totalTasks > 0 && (
              <div className={`mb-4 p-4 rounded-xl text-center border ${dark ? "bg-emerald-900/30 border-emerald-700" : "bg-emerald-50 border-emerald-200"}`}>
                <p className="text-2xl mb-1">🎉🏆🎉</p>
                <p className={`font-extrabold text-sm md:text-base ${dark ? "text-emerald-400" : "text-emerald-700"}`}>Alle Aufgaben erledigt! Du bist eine Kanone!</p>
              </div>
            )}
            {aiResult && (
              <Card dark={dark} className="mb-4 p-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-xs md:text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>📈 Fortschritt</span>
                  <span className={`text-xs font-extrabold ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{progress}%</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${dark ? "bg-gray-700" : "bg-gray-200"}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className={`text-xs mt-1.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>{doneCount} von {totalTasks} Aufgaben erledigt</p>
              </Card>
            )}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={exportPlan} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-xs font-bold hover:scale-105 transition-all shadow-sm"><Download size={13} className="inline mr-1" /> Export</button>
              <button onClick={() => { if (confirm("Lernplan löschen?")) { setAiResult(""); setChecked({}); setView("dashboard"); } }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:scale-105 transition-all shadow-sm"><X size={13} className="inline mr-1" /> Löschen</button>
              <button onClick={generate} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-xs font-bold hover:scale-105 transition-all shadow-sm disabled:opacity-50"><RotateCcw size={13} className="inline mr-1" /> {loading ? "Lädt..." : "Neu generieren"}</button>
            </div>
            <Card dark={dark} className="p-4 md:p-6">{renderMD(aiResult, true)}</Card>
          </div>
        )}

        {/* ===== HEFT VIEW ===== */}
        {(view === "heft" || view === "heft-entry") && (
          <div className="max-w-3xl mx-auto">
            {/* Entry Detail */}
            {view === "heft-entry" && activeEntry && (
              <div>
                <button onClick={() => { setView("heft"); setActiveEntry(null); }} className={`flex items-center gap-2 mb-4 text-xs md:text-sm font-bold transition-all hover:opacity-70 ${dark ? "text-indigo-400" : "text-indigo-600"}`}>
                  <ArrowLeft size={16} /> Zurück zur Liste
                </button>
                <div className={`rounded-2xl overflow-hidden shadow-lg ${dark ? "border border-gray-700" : ""}`}>
                  <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <div className={`p-5 md:p-7 relative ${dark ? "bg-gray-800" : "bg-amber-50"}`}>
                    {/* Notebook lines */}
                    {!dark && (
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #e5ddd0 31px, #e5ddd0 32px)", backgroundPosition: "0 32px" }} />
                    )}
                    {/* Red margin line */}
                    {!dark && <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-red-300 opacity-50 pointer-events-none" />}

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${dark ? "bg-indigo-900 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}>
                            {activeEntry.mode === "pdf" ? "📄 PDF-Zusammenfassung" : `📚 ${activeEntry.subject}`}
                          </span>
                          <h2 className={`text-lg md:text-xl font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>{activeEntry.topic}</h2>
                          <p className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>Erstellt am {activeEntry.date}</p>
                        </div>
                        <button onClick={() => { setHeftEntries(heftEntries.filter((e) => e.id !== activeEntry.id)); setView("heft"); setActiveEntry(null); }} className="text-red-400 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                      </div>
                      <div className={`border-t pt-4 mt-2 ${dark ? "border-gray-700" : "border-amber-200"}`}>
                        {renderMD(activeEntry.content)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Heft Main */}
            {view === "heft" && (
              <div>
                <Card dark={dark} className="p-4 md:p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                      <FileText size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className={`text-sm md:text-base font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Neuer Heftintrag</h2>
                      <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>KI erklärt ein Thema oder zusammenfasst deine PDF</p>
                    </div>
                  </div>

                  {/* Mode Toggle */}
                  <div className={`flex gap-1.5 p-1 rounded-lg mb-4 ${dark ? "bg-gray-700" : "bg-gray-100"}`}>
                    <button onClick={() => { setHeftMode("thema"); setHeftPdfs([]); }} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${heftMode === "thema" ? "bg-emerald-600 text-white shadow-sm" : dark ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}>
                      📚 Thema eingeben
                    </button>
                    <button onClick={() => setHeftMode("pdf")} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${heftMode === "pdf" ? "bg-emerald-600 text-white shadow-sm" : dark ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}>
                      📄 PDF hochladen
                    </button>
                  </div>

                  {heftMode === "thema" && (
                    <div className="space-y-2.5">
                      <div>
                        <label className={`text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>Fach</label>
                        <input value={heftSubject} onChange={(e) => setHeftSubject(e.target.value)} placeholder="z.B. Biologie" className={`w-full mt-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                      </div>
                      <div>
                        <label className={`text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>Thema</label>
                        <input value={heftTopic} onChange={(e) => setHeftTopic(e.target.value)} placeholder="z.B. Photosynthese" className={`w-full mt-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${dark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                      </div>
                    </div>
                  )}

                  {heftMode === "pdf" && (
                    <div>
                      <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                      {/* Drop zone – always visible so you can keep adding */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                        onClick={() => fileRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 md:p-7 text-center cursor-pointer transition-all hover:scale-[1.01] ${
                          dragOver
                            ? (dark ? "border-emerald-500 bg-emerald-900/20" : "border-emerald-500 bg-emerald-50")
                            : (dark ? "border-gray-600 hover:border-gray-500" : "border-gray-300 hover:border-gray-400")
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center ${dark ? "bg-gray-700" : "bg-gray-100"}`}>
                          <Upload size={22} className={dark ? "text-gray-400" : "text-gray-500"} />
                        </div>
                        <p className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>
                          {heftPdfs.length === 0 ? "PDF hier ablegen oder klicken" : "+ Weitere PDFs hinzufügen"}
                        </p>
                        <p className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>Mehrere Dateien erlaubt</p>
                      </div>

                      {/* List of added PDFs */}
                      {heftPdfs.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {heftPdfs.map((pdf, idx) => (
                            <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg ${dark ? "bg-emerald-900/20 border border-emerald-800" : "bg-emerald-50 border border-emerald-200"}`}>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center flex-shrink-0"><FileText size={14} className="text-white" /></div>
                                <div className="min-w-0">
                                  <p className={`text-xs font-bold truncate ${dark ? "text-white" : "text-gray-900"}`}>{pdf.name}</p>
                                </div>
                              </div>
                              <button onClick={() => setHeftPdfs(heftPdfs.filter((_, j) => j !== idx))} className="text-red-400 hover:text-red-500 transition-all flex-shrink-0"><X size={15} /></button>
                            </div>
                          ))}
                          <p className={`text-xs text-center pt-1 ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                            {heftPdfs.length} PDF{heftPdfs.length > 1 ? "s" : ""} geladen ✓
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={generateHeft} disabled={heftLoading} className={`w-full mt-4 py-3 rounded-lg font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${heftLoading ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:scale-[1.02] shadow-md"}`}>
                    {heftLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Erstelle Heftintrag...</> : <><Sparkles size={16} /> Heftintrag erstellen</>}
                  </button>
                </Card>

                {/* Entry List */}
                {heftEntries.length > 0 && (
                  <div>
                    <h3 className={`text-xs md:text-sm font-extrabold mb-2.5 uppercase tracking-wider ${dark ? "text-gray-400" : "text-gray-500"}`}>📓 Deine Einträge</h3>
                    <div className="space-y-2">
                      {heftEntries.map((entry) => (
                        <button key={entry.id} onClick={() => { setActiveEntry(entry); setView("heft-entry"); }} className={`group w-full text-left p-3 md:p-4 rounded-xl border transition-all hover:scale-[1.02] ${dark ? "bg-gray-800 border-gray-700 hover:border-emerald-600" : "bg-white border-gray-200 hover:border-emerald-300 shadow-sm"}`}>
                          <div className="flex justify-between items-center">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? "bg-emerald-900 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
                                  {entry.mode === "pdf" ? "📄 PDF" : `📚 ${entry.subject}`}
                                </span>
                                <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>{entry.date}</span>
                              </div>
                              <p className={`font-bold text-sm truncate ${dark ? "text-white" : "text-gray-900"}`}>{entry.topic}</p>
                            </div>
                            <ChevronRight size={16} className={`flex-shrink-0 transition-transform group-hover:translate-x-1 ${dark ? "text-gray-500" : "text-gray-400"}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden; }
        `}</style>
    </div>
  );
}