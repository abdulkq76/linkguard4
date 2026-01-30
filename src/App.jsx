import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Moon, Sun, Book, Clock, Brain, Sparkles, ChevronRight, Trash2, Edit3 } from 'lucide-react';

const StudyPlannerApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('welcome');
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [schedule, setSchedule] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem('studyflow_subjects');
    const savedTests = localStorage.getItem('studyflow_tests');
    const savedDarkMode = localStorage.getItem('studyflow_darkMode');
    const savedSchedule = localStorage.getItem('studyflow_schedule');
    
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedTests) setTests(JSON.parse(savedTests));
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    if (savedSchedule) setSchedule(savedSchedule);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('studyflow_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('studyflow_tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('studyflow_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('studyflow_schedule', schedule);
  }, [schedule]);

  const subjectColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
    '#06b6d4', '#6366f1', '#f43f5e', '#14b8a6', '#a855f7'
  ];

  const addSubject = () => {
    const name = prompt('Fach-Name:');
    if (name && name.trim()) {
      setSubjects([...subjects, { 
        id: Date.now(), 
        name: name.trim(), 
        color: subjectColors[subjects.length % subjectColors.length] 
      }]);
    }
  };

  const removeSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const addTest = () => {
    const subject = prompt('Fach:');
    const topic = prompt('Thema:');
    const date = prompt('Datum (TT.MM.JJJJ):');
    if (subject && topic && date) {
      setTests([...tests, { id: Date.now(), subject: subject.trim(), topic: topic.trim(), date: date.trim() }]);
    }
  };

  const removeTest = (id) => {
    setTests(tests.filter(t => t.id !== id));
  };

  const generateAIPlan = async () => {
    setLoading(true);
    setAiResult('');

    try {
      const prompt = `Du bist ein intelligenter Lernplan-Assistent für Schüler und Studenten.

STUNDENPLAN:
${schedule || 'Nicht angegeben'}

KOMMENDE TESTS/KLAUSUREN:
${tests.map(t => `- ${t.subject}: ${t.topic} am ${t.date}`).join('\n') || 'Keine Tests eingetragen'}

FÄCHER:
${subjects.map(s => s.name).join(', ') || 'Keine Fächer eingetragen'}

Erstelle einen detaillierten, realistischen Lernplan für die nächsten 2 Wochen. Berücksichtige:
- Verteilung der Lernzeit auf Fächer
- Prioritäten basierend auf Testterminen
- Regelmäßige Pausen (Pomodoro-Technik)
- Wiederholungstage vor Tests
- Realistische Zeitblöcke (30-90 Min pro Session)
- Balance zwischen verschiedenen Fächern

Format als strukturierten Plan mit:
1. WOCHENÜBERSICHT (Montag bis Sonntag)
2. TÄGLICHE LERNBLÖCKE (mit Zeiten)
3. PRIORITÄTEN & TIPPS
4. PAUSEN & ERHOLUNG

Sei motivierend, realistisch und konkret! Nutze Emojis für bessere Lesbarkeit.`;

      const response = await fetch('https://api.bennokahmann.me/ai/google/jill/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error('API-Anfrage fehlgeschlagen');
      }

      const data = await response.json();
      const text = data.response || data.text || data.content || JSON.stringify(data);
      
      setAiResult(text);
      setCurrentView('ai');
    } catch (error) {
      console.error('AI Error:', error);
      alert('Fehler bei KI-Generierung: ' + error.message + '\n\nBitte überprüfe deine Internetverbindung und versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const formatAiResult = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Main headers
      if (line.match(/^#{1,2}\s/)) {
        const level = line.match(/^#+/)[0].length;
        const content = line.replace(/^#+\s/, '');
        return level === 1 ? (
          <h2 key={i} className="text-3xl sm:text-4xl font-bold mt-8 mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            {content}
          </h2>
        ) : (
          <h3 key={i} className="text-2xl sm:text-3xl font-bold mt-6 mb-3 text-blue-600 dark:text-blue-400">
            {content}
          </h3>
        );
      }
      // Bold text
      if (line.match(/^\*\*.+\*\*$/)) {
        return (
          <p key={i} className="font-bold text-lg sm:text-xl mt-5 mb-2 text-gray-900 dark:text-white">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      // List items
      if (line.match(/^[-•]\s/)) {
        return (
          <li key={i} className="ml-6 mb-2 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            {line.replace(/^[-•]\s/, '')}
          </li>
        );
      }
      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={i} className="ml-6 mb-2 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed list-decimal">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      // Regular paragraphs
      if (line.trim()) {
        return (
          <p key={i} className="mb-3 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            {line}
          </p>
        );
      }
      return <div key={i} className="h-2" />;
    });
  };

  // Welcome Screen
  if (currentView === 'welcome') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Theme Toggle */}
          <div className="flex justify-end mb-6 sm:mb-8">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 sm:p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${
                darkMode 
                  ? 'bg-gray-800/50 backdrop-blur-lg text-yellow-400 shadow-xl shadow-yellow-500/20' 
                  : 'bg-white/80 backdrop-blur-lg text-gray-700 shadow-xl'
              }`}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-5xl mx-auto mt-12 sm:mt-20">
            <div className="mb-8 sm:mb-12 flex justify-center animate-bounce">
              <div className={`p-6 sm:p-8 rounded-3xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-purple-500/50' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-2xl'
              }`}>
                <Book size={64} className="text-white sm:w-20 sm:h-20" />
              </div>
            </div>
            
            <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-extrabold mb-6 sm:mb-8 tracking-tight ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              StudyFlow
            </h1>
            
            <p className={`text-xl sm:text-2xl lg:text-3xl mb-12 sm:mb-16 ${
              darkMode ? 'text-gray-200' : 'text-gray-600'
            } max-w-3xl mx-auto leading-relaxed px-4`}>
              Dein intelligenter Lernplan-Assistent. Organisiere dein Studium mit KI-Unterstützung.
            </p>

            <button
              onClick={() => setCurrentView('dashboard')}
              className="group px-10 sm:px-16 py-5 sm:py-7 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl sm:rounded-3xl text-xl sm:text-2xl font-bold shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center gap-3 sm:gap-4">
                Lernplan erstellen
                <ChevronRight className="group-hover:translate-x-2 transition-transform" size={28} />
              </span>
            </button>

            {/* Features Grid */}
            <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 px-4">
              {[
                { icon: Calendar, title: 'Stundenplan', desc: 'Organisiere deinen Alltag perfekt', gradient: 'from-blue-500 to-cyan-500' },
                { icon: Brain, title: 'KI-Assistent', desc: 'Intelligente Lernpläne auf Knopfdruck', gradient: 'from-purple-500 to-pink-500' },
                { icon: Clock, title: 'Zeitmanagement', desc: 'Effizient lernen mit System', gradient: 'from-orange-500 to-red-500' }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className={`group p-8 sm:p-10 rounded-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
                    darkMode 
                      ? 'bg-gray-800/40 backdrop-blur-xl border border-gray-700 shadow-2xl hover:shadow-purple-500/30' 
                      : 'bg-white/90 backdrop-blur-xl shadow-2xl hover:shadow-xl'
                  }`}
                >
                  <div className={`inline-block p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:rotate-6 transition-transform`}>
                    <feature.icon size={48} className="text-white sm:w-14 sm:h-14" />
                  </div>
                  <h3 className={`text-2xl sm:text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard & AI View
  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentView('welcome')}
              className={`p-3 sm:p-4 rounded-2xl transition-all hover:scale-110 ${
                darkMode ? 'bg-gray-800 text-white shadow-lg' : 'bg-white text-gray-900 shadow-xl'
              }`}
            >
              <Book size={28} />
            </button>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentView === 'ai' ? '✨ Dein KI-Lernplan' : '📚 Dashboard'}
            </h1>
          </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentView(currentView === 'ai' ? 'dashboard' : 'dashboard')}
              className={`flex-1 sm:flex-none px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all ${
                currentView === 'dashboard'
                  ? darkMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                    : 'bg-blue-600 text-white shadow-xl'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
              }`}
            >
              Dashboard
            </button>
            
            {aiResult && (
              <button
                onClick={() => setCurrentView('ai')}
                className={`flex-1 sm:flex-none px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all ${
                  currentView === 'ai'
                    ? darkMode 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' 
                      : 'bg-purple-600 text-white shadow-xl'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
                }`}
              >
                KI-Plan
              </button>
            )}
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all hover:scale-110 ${
                darkMode ? 'bg-gray-800 text-yellow-400 shadow-lg' : 'bg-white text-gray-700 shadow-xl'
              }`}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
        </div>

        {currentView === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
              {/* Subjects Card */}
              <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl transition-all ${
                darkMode ? 'bg-gray-800 shadow-2xl border border-gray-700' : 'bg-white shadow-2xl'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📚 Fächer
                  </h2>
                  <button
                    onClick={addSubject}
                    className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:scale-110 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <div className="space-y-3">
                  {subjects.length === 0 ? (
                    <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Book size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-lg">Noch keine Fächer</p>
                      <p className="text-sm mt-2">Klicke auf + um zu starten</p>
                    </div>
                  ) : (
                    subjects.map(subject => (
                      <div
                        key={subject.id}
                        className={`group flex justify-between items-center p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.02] ${
                          darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-lg"
                            style={{ backgroundColor: subject.color }}
                          />
                          <span className={`font-bold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {subject.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSubject(subject.id)}
                          className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                            darkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'
                          }`}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tests Card */}
              <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl transition-all ${
                darkMode ? 'bg-gray-800 shadow-2xl border border-gray-700' : 'bg-white shadow-2xl'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📝 Tests
                  </h2>
                  <button
                    onClick={addTest}
                    className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl sm:rounded-2xl hover:scale-110 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <div className="space-y-3">
                  {tests.length === 0 ? (
                    <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-lg">Keine Tests</p>
                      <p className="text-sm mt-2">Trage deine Prüfungen ein</p>
                    </div>
                  ) : (
                    tests.map(test => (
                      <div
                        key={test.id}
                        className={`group p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.02] ${
                          darkMode ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-50 border border-purple-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                            {test.subject}
                          </span>
                          <button
                            onClick={() => removeTest(test.id)}
                            className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                              darkMode ? 'hover:bg-purple-800 text-red-400' : 'hover:bg-purple-100 text-red-600'
                            }`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <p className={`text-sm sm:text-base mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {test.topic}
                        </p>
                        <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          📅 {test.date}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Schedule Input */}
              <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl transition-all ${
                darkMode ? 'bg-gray-800 shadow-2xl border border-gray-700' : 'bg-white shadow-2xl'
              }`}>
                <h2 className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🗓️ Stundenplan
                </h2>
                <textarea
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Trage hier deinen Stundenplan ein...&#10;&#10;Beispiel:&#10;Montag: 8-10 Mathe, 10-12 Deutsch&#10;Dienstag: 8-10 Bio, 12-14 Sport&#10;..."
                  className={`w-full h-56 sm:h-64 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 font-mono text-sm sm:text-base transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
                />
              </div>

              {/* AI Generation */}
              <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl transition-all ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-purple-700/50 shadow-2xl' 
                  : 'bg-gradient-to-br from-blue-50 to-purple-50 shadow-2xl'
              }`}>
                <div className="flex items-center gap-3 sm:gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                    <Brain size={32} className="text-white" />
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    KI-Lernplan generieren
                  </h2>
                </div>

                <p className={`mb-6 text-base sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Lass unsere KI einen personalisierten Lernplan für dich erstellen, basierend auf deinem Stundenplan, Fächern und anstehenden Tests.
                </p>

                <button
                  onClick={generateAIPlan}
                  disabled={loading}
                  className={`w-full py-5 sm:py-6 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl transition-all flex items-center justify-center gap-3 sm:gap-4 ${
                    loading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl hover:scale-[1.02] shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 border-b-2 border-white"></div>
                      Generiere Lernplan...
                    </>
                  ) : (
                    <>
                      <Sparkles size={28} />
                      KI-Lernplan erstellen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // AI Results View
          <div className={`max-w-5xl mx-auto p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-3xl transition-all ${
            darkMode ? 'bg-gray-800 shadow-2xl border border-gray-700' : 'bg-white shadow-2xl'
          }`}>
            {aiResult ? (
              <div className="prose prose-lg max-w-none">
                {formatAiResult(aiResult)}
              </div>
            ) : (
              <div className="text-center py-20 sm:py-32">
                <Brain size={80} className={`mx-auto mb-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Noch kein Lernplan generiert
                </h2>
                <p className={`text-lg sm:text-xl mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gehe zum Dashboard und erstelle deinen ersten KI-Lernplan!
                </p>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl"
                >
                  Zum Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlannerApp;