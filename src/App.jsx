import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, CheckCircle, AlertTriangle, XCircle, Search, 
  Lock, Globe, Server, Activity, ArrowRight, ShieldCheck, 
  AlertOctagon, Fingerprint, ChevronDown, ExternalLink,
  ShieldAlert, Info, Zap
} from 'lucide-react';

// --- CONFIGURATION ---
const apiKey = "AIzaSyB300EpegojEXHxcqmsUzD8rMLp07tShYE"; // The environment provides the key at runtime

// --- COMPONENTS ---

// 1. Subtle, high-end background
const AmbientBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
    <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
    <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
  </div>
);

// 2. High-precision Trust Gauge
const TrustScoreRing = ({ score }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform">
        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
        <circle 
          cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColor(score)} drop-shadow-lg`} 
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold tracking-tight ${getColor(score)}`}>{score}</span>
        <span className="text-xs uppercase font-medium text-slate-500 mt-1">Trust Score</span>
      </div>
    </div>
  );
};

// 3. Technical Detail Cards
const DetailTile = ({ icon: Icon, label, value, status = "neutral" }) => {
  const colors = {
    safe: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    neutral: "bg-slate-800/50 text-slate-300 border-slate-700/50"
  };

  return (
    <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:bg-slate-800/80 ${colors[status]}`}>
      <div className={`p-2 rounded-lg bg-black/20`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
        <div className="font-semibold text-sm">{value}</div>
      </div>
    </div>
  );
};

const App = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef(null);

  // Focus input on initial mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const analyzeLink = async () => {
    if (!url) return;
    setLoading(true);
    setResult(null);
    setShowDetails(false);

    // Build suspense with a deliberate scan time
    await new Promise(r => setTimeout(r, 2200));

    const systemPrompt = `
      You are an elite cyber-security intelligence AI. 
      Analyze the provided URL for phishing, scams, credential harvesting, malware, and suspicious redirects.
      Provide a highly professional assessment suitable for global enterprise users.
      Respond ONLY in JSON format:
      {
        "score": 0-100 (integer, 100 is perfectly safe),
        "status": "SAFE" | "SUSPICIOUS" | "MALICIOUS",
        "headline": "A short, authoritative verdict (e.g., 'Official Financial Entity' or 'Critical Phishing Alert')",
        "description": "A clear, concise security summary for non-technical users in English.",
        "technical_points": ["Detailed point 1", "Detailed point 2", "Detailed point 3"],
        "ssl_active": boolean,
        "domain_age": "Plausible age or 'Unknown'",
        "host": "Clean hostname",
        "region": "Estimated server location"
      }
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `TARGET URL FOR ANALYSIS: ${url}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text);
      setResult(parsed);
    } catch (error) {
      console.error("Analysis Failed", error);
      setResult({
        score: 0,
        status: "ERROR",
        headline: "Analysis Interrupted",
        description: "An error occurred while connecting to the security node. Please verify the URL and retry.",
        technical_points: ["API Timeout", "Connection Reset"],
        ssl_active: false,
        domain_age: "N/A",
        host: "N/A",
        region: "N/A"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') analyzeLink();
  };

  const getStatusStyles = (score) => {
    if (score >= 80) return { border: "border-emerald-500/30", bg: "bg-emerald-950/20", text: "text-emerald-400", accent: "from-emerald-400 to-emerald-600" };
    if (score >= 50) return { border: "border-amber-500/30", bg: "bg-amber-950/20", text: "text-amber-400", accent: "from-amber-400 to-amber-600" };
    return { border: "border-rose-500/30", bg: "bg-rose-950/20", text: "text-rose-400", accent: "from-rose-400 to-rose-600" };
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
      <AmbientBackground />

      {/* Modern Navigation */}
      <nav className="border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 rounded-lg p-1.5 shadow-lg shadow-blue-500/40">
              <Shield size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white uppercase">
              LinkGuard <span className="text-blue-500">PRO</span>
            </span>
          </div>
          <div className="hidden sm:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-blue-400 transition-colors">Intelligence</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Network</a>
            <a href="#" className="hover:text-blue-400 transition-colors">API Docs</a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-[0.2em] mb-6 animate-in fade-in slide-in-from-top-2">
            <Zap size={12} className="fill-current" />
            NEURAL ANALYSIS ENGINE V2.5.4
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white leading-[0.9]">
            Verify Before <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">You Click.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Protect your digital identity with advanced real-time URL intelligence. 
            Identify phishing, malware, and fraudulent sites instantly.
          </p>
        </div>

        {/* Unified Search UI (Stacked) */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-2xl transition-all duration-500">
          <div className="flex flex-col gap-5">
            
            {/* 1. Input Box */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className={`w-6 h-6 transition-colors ${loading ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste destination link here..."
                className="block w-full pl-14 pr-6 py-5 bg-slate-950/80 border border-slate-800 rounded-2xl text-lg text-white placeholder-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none shadow-inner font-medium"
              />
            </div>

            {/* 2. Primary Action Button (Stacked Below) */}
            <button
              onClick={analyzeLink}
              disabled={loading || !url}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl text-xl tracking-widest shadow-xl shadow-blue-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  SCANNING...
                </>
              ) : (
                <>
                  INITIALIZE SECURITY SCAN
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-[10px] text-slate-500 font-black uppercase tracking-widest">
            <span className="flex items-center gap-2"><Lock size={12} className="text-blue-500"/> SSL VALIDATION</span>
            <span className="flex items-center gap-2"><Globe size={12} className="text-blue-500"/> GLOBAL REPUTATION</span>
            <span className="flex items-center gap-2"><Activity size={12} className="text-blue-500"/> HEURISTIC CHECK</span>
          </div>
        </div>

        {/* Results Dashboard */}
        {result && !loading && (
          <div className="mt-12 animate-in slide-in-from-bottom-10 fade-in duration-700">
            
            <div className={`relative overflow-hidden rounded-[2.5rem] border ${getStatusStyles(result.score).border} ${getStatusStyles(result.score).bg} shadow-2xl`}>
              
              {/* Gradient Status Line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${getStatusStyles(result.score).accent}`} />

              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                  
                  {/* Visual Trust Indicator */}
                  <div className="flex-shrink-0 scale-110">
                    <TrustScoreRing score={result.score} />
                  </div>

                  {/* Descriptive Text */}
                  <div className="flex-grow text-center md:text-left">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.15em] mb-4 ${getStatusStyles(result.score).text} bg-black/40 border ${getStatusStyles(result.score).border}`}>
                      {result.score >= 80 ? <ShieldCheck size={16}/> : result.score >= 50 ? <AlertTriangle size={16}/> : <ShieldAlert size={16}/>}
                      {result.status}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                      {result.headline}
                    </h2>
                    <p className="text-slate-300 leading-relaxed text-lg max-w-xl">
                      {result.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Details Controller */}
              <button 
                className="w-full bg-black/40 border-t border-slate-800/50 py-4 flex justify-center items-center gap-3 cursor-pointer hover:bg-black/60 transition-all text-xs font-bold text-slate-400 uppercase tracking-widest"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Deep Analysis' : 'Show Deep Analysis Data'}
                <ChevronDown size={18} className={`transition-transform duration-500 ${showDetails ? 'rotate-180' : ''}`}/>
              </button>

              {/* Collapsible Content */}
              {showDetails && (
                <div className="p-8 md:p-12 border-t border-slate-800/50 bg-black/30 animate-in slide-in-from-top-4 fade-in duration-500">
                  
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <DetailTile 
                      icon={Globe} 
                      label="Domain Host" 
                      value={result.host} 
                    />
                    <DetailTile 
                      icon={Lock} 
                      label="SSL Status" 
                      value={result.ssl_active ? "Encrypted" : "Unsecured"} 
                      status={result.ssl_active ? "safe" : "danger"}
                    />
                    <DetailTile 
                      icon={Server} 
                      label="Server Location" 
                      value={result.region || "Restricted"} 
                    />
                     <DetailTile 
                      icon={Activity} 
                      label="Domain Age" 
                      value={result.domain_age} 
                      status="neutral"
                    />
                  </div>

                  {/* Analysis Breakdown */}
                  <div className="bg-slate-900/50 rounded-3xl p-8 border border-slate-800">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Info size={14} className="text-blue-500" /> Neural Scan Findings
                    </h3>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                      {result.technical_points.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-4 text-slate-300 group">
                          <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125 ${result.score >= 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                          <span className="text-sm font-medium leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Legend / Safety Zones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                { label: "Verified", color: "bg-emerald-500", desc: "Safe corporate or official domains." },
                { label: "Suspicious", color: "bg-amber-500", desc: "Unknown origin or low reputation." },
                { label: "High Risk", color: "bg-rose-500", desc: "Phishing or malicious payloads detected." }
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">{item.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-black/40 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5 opacity-60">
            <ShieldCheck size={18} className="text-blue-500" />
            <span className="font-bold text-sm tracking-widest uppercase">LinkGuard Intelligence</span>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Infrastructure</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Transparency</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Node Status</a>
          </div>
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest italic">
            Protecting the digital frontier.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

