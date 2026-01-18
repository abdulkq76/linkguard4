import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, Zap, Info, ShieldAlert, ExternalLink } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURATION ---
const apiKey = "AIzaSyAuJk5n4LgrM71ZclQFqPAZu0VGHXcajLw"; // Provided by the environment

const App = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);

  const analyzeLink = async () => {
    if (!url) return;
    setLoading(true);
    
    const systemPrompt = `You are a professional cyber security analyst. 
    Analyze the provided URL for phishing, IP grabbing, and scams. 
    Respond ONLY in JSON format: 
    {
        "score": 0-100 (100 is perfectly safe, 0 is malicious),
        "status": "Safe" | "Suspicious" | "High Risk",
        "verdict": "Clear professional summary of findings",
        "details": ["Observation 1", "Observation 2"],
        "isPhishing": boolean
    }`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze this URL: ${url}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      const parsedResult = JSON.parse(data.candidates[0].content.parts[0].text);
      setResult(parsedResult);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 40) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs font-medium mb-6">
            <Zap size={14} className="text-blue-400" />
            POWERED BY NEURAL ANALYSIS
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-white">
            LinkGuard<span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Professional link verification and threat intelligence to protect your digital identity.
          </p>
        </header>

        {/* Input Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-2 shadow-2xl mb-12">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-grow w-full">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste URL to verify..."
                className="w-full bg-transparent pl-14 pr-6 py-5 text-lg outline-none placeholder-slate-600 border-none focus:ring-0"
              />
            </div>
            <button 
              onClick={analyzeLink}
              disabled={loading || !url}
              className="w-full md:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <Zap size={20} className="animate-pulse" /> : "Verify"}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`bg-slate-900/60 backdrop-blur-xl border rounded-3xl p-8 ${result.score < 40 ? 'border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]' : 'border-slate-800'}`}>
              <div className="flex flex-col md:flex-row items-center gap-10">
                {/* Gauge */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                    <circle 
                      cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" 
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (result.score / 100) * 364.4}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ease-out ${getProgressColor(result.score)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{result.score}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Score</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-grow text-center md:text-left">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest mb-4 ${getStatusColor(result.score)}`}>
                    {result.score < 40 ? <ShieldAlert size={12}/> : <Shield size={12} />}
                    {result.status}
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">{result.score < 40 ? "Potential Threat Detected" : "Security Assessment"}</h2>
                  <p className="text-slate-400 leading-relaxed">{result.verdict}</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Info size={14} className="text-blue-500" /> Analysis Details
                </h3>
                <ul className="space-y-3">
                  {result.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${result.score < 40 ? 'bg-rose-500' : 'bg-blue-500'}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col justify-center text-center">
                <p className="text-slate-500 text-sm italic mb-4">Final Recommendation:</p>
                <div className={`p-4 rounded-2xl border ${result.score < 40 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  <p className="font-bold">
                    {result.score < 40 
                      ? "Do not interact with this link." 
                      : "No immediate threats found."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <p>© 2026 LinkGuard Intelligence. Secure Browsing Infrastructure.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;


