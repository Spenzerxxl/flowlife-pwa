import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Send, Loader2, Trash2, Plus, CheckCircle2, 
  Clock, Tag, AlertCircle, Mail, Phone, Calendar, Menu,
  ChevronDown, ChevronUp, Sparkles, Target, X, MessageSquare,
  CalendarDays, Brain, Home, List, Settings, Search, Filter
} from 'lucide-react';

function App() {
  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const recognitionRef = useRef(null);

  // Task Management States
  const [tasks, setTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [manualTaskText, setManualTaskText] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [activeView, setActiveView] = useState('dashboard');
  const [showSidebar, setShowSidebar] = useState(true);

  // Categories
  const categories = [
    { id: 'familie', label: '👨‍👩‍👧 Familie', color: 'blue' },
    { id: 'business', label: '💼 Business', color: 'purple' },
    { id: 'loge', label: '🏛️ Loge', color: 'amber' },
    { id: 'umzug', label: '📦 Umzug', color: 'green' },
    { id: 'personal', label: '🏃 Personal', color: 'pink' },
    { id: 'sonstiges', label: '📌 Sonstiges', color: 'gray' }
  ];

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('flowlife_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }

    // Detect mobile device
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    
    // Auto-hide sidebar on mobile
    if (checkMobile) {
      setShowSidebar(false);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowlife_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // AI-powered task parsing from transcript
  const parseTaskFromTranscript = (text) => {
    const lowerText = text.toLowerCase();
    
    // Detect category
    let category = 'sonstiges';
    if (lowerText.includes('familie') || lowerText.includes('mutter') || lowerText.includes('vater') || lowerText.includes('schwiegermutter')) {
      category = 'familie';
    } else if (lowerText.includes('arbeit') || lowerText.includes('business') || lowerText.includes('meeting') || lowerText.includes('projekt')) {
      category = 'business';
    } else if (lowerText.includes('loge') || lowerText.includes('bruder')) {
      category = 'loge';
    } else if (lowerText.includes('umzug') || lowerText.includes('karton') || lowerText.includes('packen')) {
      category = 'umzug';
    } else if (lowerText.includes('sport') || lowerText.includes('training') || lowerText.includes('arzt')) {
      category = 'personal';
    }

    // Detect deadline
    let deadline = null;
    const today = new Date();
    if (lowerText.includes('heute')) {
      deadline = today.toISOString().split('T')[0];
    } else if (lowerText.includes('morgen')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      deadline = tomorrow.toISOString().split('T')[0];
    } else if (lowerText.includes('übermorgen')) {
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);
      deadline = dayAfter.toISOString().split('T')[0];
    } else if (lowerText.includes('nächste woche')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      deadline = nextWeek.toISOString().split('T')[0];
    }

    // Generate AI suggestions based on content
    const suggestions = [];
    if (lowerText.includes('mail') || lowerText.includes('email') || lowerText.includes('schreiben')) {
      suggestions.push({ icon: Mail, text: 'E-Mail formulieren', action: 'compose_email' });
    }
    if (lowerText.includes('anrufen') || lowerText.includes('telefonieren')) {
      suggestions.push({ icon: Phone, text: 'Anruf vorbereiten', action: 'prepare_call' });
    }
    if (lowerText.includes('termin') || lowerText.includes('treffen')) {
      suggestions.push({ icon: Calendar, text: 'Termin eintragen', action: 'schedule' });
    }
    if (lowerText.includes('beerdigung') || lowerText.includes('bestatter')) {
      suggestions.push({ icon: Mail, text: 'Einfühlsame Nachricht', action: 'sympathy_message' });
    }

    return {
      id: Date.now().toString(),
      title: text.trim(),
      category,
      deadline,
      progress: 0,
      suggestions,
      created_at: new Date().toISOString(),
      completed_at: null
    };
  };

  // Create task from transcript
  const createTaskFromTranscript = () => {
    if (!transcript.trim()) return;
    
    const newTask = parseTaskFromTranscript(transcript);
    setTasks(prev => [newTask, ...prev]);
    setTranscript('');
    setStatus('✅ Task erstellt: ' + newTask.title.slice(0, 30) + '...');
    setActiveView('tasks');
    
    setTimeout(() => {
      setStatus('');
    }, 3000);
  };

  // Create manual task
  const createManualTask = () => {
    if (!manualTaskText.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      title: manualTaskText.trim(),
      category: 'sonstiges',
      deadline: selectedDeadline || null,
      progress: 0,
      suggestions: [],
      created_at: new Date().toISOString(),
      completed_at: null
    };
    
    setTasks(prev => [newTask, ...prev]);
    setManualTaskText('');
    setSelectedDeadline('');
    setShowTaskInput(false);
  };

  // Quick task creation
  const quickCreateTask = (text, category = 'sonstiges') => {
    const newTask = {
      id: Date.now().toString(),
      title: text,
      category,
      deadline: null,
      progress: 0,
      suggestions: [],
      created_at: new Date().toISOString(),
      completed_at: null
    };
    
    setTasks(prev => [newTask, ...prev]);
    setStatus('✅ Task hinzugefügt');
    setTimeout(() => setStatus(''), 2000);
  };

  // Update task progress
  const updateProgress = (taskId, progress) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          progress,
          completed_at: progress === 100 ? new Date().toISOString() : null
        };
      }
      return task;
    }));
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // Execute AI suggestion
  const executeSuggestion = async (task, suggestion) => {
    setStatus(`🤖 ${suggestion.text} wird vorbereitet...`);
    setIsProcessing(true);
    
    // Hier später: n8n Webhook triggern
    setTimeout(() => {
      setStatus(`✨ ${suggestion.text} - Bereit zur Ausführung`);
      setIsProcessing(false);
      
      // Erhöhe Progress um 25%
      const newProgress = Math.min(task.progress + 25, 100);
      updateProgress(task.id, newProgress);
    }, 2000);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'alle' || task.category === selectedCategory;
    const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get stats
  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.progress === 100).length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.deadline && t.deadline < today && t.progress < 100).length;
    const todayTasks = tasks.filter(t => t.deadline === today).length;
    
    return { total, completed, overdue, todayTasks };
  };

  const stats = getStats();

  // Get deadline status
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (deadline < today) return 'overdue';
    if (deadline === today) return 'today';
    if (deadline === tomorrowStr) return 'tomorrow';
    return 'future';
  };

  // Voice recording functions
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus('❌ Dein Browser unterstützt keine Spracherkennung');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'de-DE';
    recognitionRef.current.continuous = !isMobile;
    recognitionRef.current.interimResults = !isMobile;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setStatus('🎙️ Spreche jetzt...');
    };

    recognitionRef.current.onresult = (event) => {
      if (isMobile) {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal || !recognitionRef.current.interimResults) {
          const newText = lastResult[0].transcript;
          setTranscript(prev => {
            if (!prev.endsWith(newText)) {
              return (prev + ' ' + newText).trim();
            }
            return prev;
          });
        }
      } else {
        let finalText = '';
        let interimText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }
        
        if (finalText) {
          setTranscript(prev => (prev + ' ' + finalText).trim());
        }
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event);
      setStatus('');
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      setStatus('');
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Start error:', error);
      setStatus('❌ Konnte Aufnahme nicht starten');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setStatus('');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setStatus('');
  };

  // Sidebar Component
  const Sidebar = () => (
    <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 text-white overflow-hidden flex-shrink-0`}>
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">🚀</span> FlowLife
        </h1>
      </div>
      
      <nav className="p-4">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
            activeView === 'dashboard' ? 'bg-purple-600' : 'hover:bg-gray-800'
          }`}
        >
          <Home size={20} />
          Dashboard
        </button>
        
        <button
          onClick={() => setActiveView('tasks')}
          className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
            activeView === 'tasks' ? 'bg-purple-600' : 'hover:bg-gray-800'
          }`}
        >
          <List size={20} />
          Aufgaben
          {stats.total > 0 && (
            <span className="ml-auto bg-purple-500 px-2 py-1 rounded-full text-xs">
              {stats.total}
            </span>
          )}
        </button>
        
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 hover:bg-gray-800 transition-colors"
        >
          <CalendarDays size={20} />
          Google Kalender
          <span className="ml-auto">↗</span>
        </a>
        
        <button
          onClick={() => {
            setActiveView('assistant');
            // Später: Claude Chat öffnen
          }}
          className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
            activeView === 'assistant' ? 'bg-purple-600' : 'hover:bg-gray-800'
          }`}
        >
          <Brain size={20} />
          KI-Assistent
        </button>
        
        <button
          onClick={() => setActiveView('voice')}
          className={`w-full text-left p-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
            activeView === 'voice' ? 'bg-purple-600' : 'hover:bg-gray-800'
          }`}
        >
          <Mic size={20} />
          Voice Input
        </button>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <div className="text-xs text-gray-400">
          <p>📊 {stats.completed}/{stats.total} erledigt</p>
          {stats.overdue > 0 && (
            <p className="text-red-400 mt-1">⚠️ {stats.overdue} überfällig</p>
          )}
        </div>
      </div>
    </div>
  );

  // Dashboard View
  const DashboardView = () => (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-sm text-gray-500 mb-1">Gesamt</div>
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-400">Aufgaben</div>
        </div>
        
        <div className="bg-green-50 rounded-xl shadow-lg p-6">
          <div className="text-sm text-green-600 mb-1">Erledigt</div>
          <div className="text-3xl font-bold text-green-700">{stats.completed}</div>
          <div className="text-xs text-green-500">Abgeschlossen</div>
        </div>
        
        <div className="bg-orange-50 rounded-xl shadow-lg p-6">
          <div className="text-sm text-orange-600 mb-1">Heute</div>
          <div className="text-3xl font-bold text-orange-700">{stats.todayTasks}</div>
          <div className="text-xs text-orange-500">Fällig</div>
        </div>
        
        <div className="bg-red-50 rounded-xl shadow-lg p-6">
          <div className="text-sm text-red-600 mb-1">Überfällig</div>
          <div className="text-3xl font-bold text-red-700">{stats.overdue}</div>
          <div className="text-xs text-red-500">Verspätet</div>
        </div>
      </div>
      
      {/* Quick Add */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Schnell-Eingabe</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Neue Aufgabe hinzufügen..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                quickCreateTask(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={startRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording ? 'bg-red-500 text-white' : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            <Mic size={20} />
          </button>
        </div>
        {transcript && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
            {transcript}
            <button
              onClick={createTaskFromTranscript}
              className="ml-2 text-purple-600 hover:text-purple-700"
            >
              → Task erstellen
            </button>
          </div>
        )}
      </div>
      
      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Aktuelle Aufgaben</h3>
        <div className="space-y-2">
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                task.progress === 100 ? 'bg-green-500' :
                getDeadlineStatus(task.deadline) === 'overdue' ? 'bg-red-500' :
                getDeadlineStatus(task.deadline) === 'today' ? 'bg-orange-500' :
                'bg-gray-400'
              }`} />
              <span className="flex-1">{task.title}</span>
              <span className="text-xs text-gray-500">{task.progress}%</span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-gray-400 text-center py-4">Noch keine Aufgaben</p>
          )}
        </div>
        {tasks.length > 5 && (
          <button
            onClick={() => setActiveView('tasks')}
            className="w-full mt-4 text-purple-600 hover:text-purple-700 text-sm"
          >
            Alle {tasks.length} Aufgaben anzeigen →
          </button>
        )}
      </div>
    </div>
  );

  // Tasks View (existing task management)
  const TasksView = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Aufgaben</h2>
        <button
          onClick={() => setShowTaskInput(!showTaskInput)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus size={20} className="inline mr-2" />
          Neue Aufgabe
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Aufgaben durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Manual Task Input */}
      {showTaskInput && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualTaskText}
              onChange={(e) => setManualTaskText(e.target.value)}
              placeholder="Aufgabe eingeben..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && createManualTask()}
            />
            <input
              type="date"
              value={selectedDeadline}
              onChange={(e) => setSelectedDeadline(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={createManualTask}
              disabled={!manualTaskText.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('alle')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedCategory === 'alle' 
              ? 'bg-purple-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Alle ({tasks.length})
        </button>
        {categories.map(cat => {
          const count = tasks.filter(t => t.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-400">
              {searchQuery 
                ? 'Keine Aufgaben gefunden' 
                : selectedCategory === 'alle' 
                  ? 'Noch keine Aufgaben. Klicke auf "Neue Aufgabe" um zu beginnen!' 
                  : 'Keine Aufgaben in dieser Kategorie.'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const deadlineStatus = getDeadlineStatus(task.deadline);
            const category = categories.find(c => c.id === task.category);
            
            return (
              <div key={task.id} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">{task.title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {category?.label}
                      </span>
                      
                      {task.deadline && (
                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${
                          deadlineStatus === 'overdue' ? 'bg-red-100 text-red-700' :
                          deadlineStatus === 'today' ? 'bg-orange-100 text-orange-700' :
                          deadlineStatus === 'tomorrow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          <Clock size={14} />
                          {new Date(task.deadline).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Fortschritt</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        task.progress === 100 ? 'bg-green-500' :
                        task.progress >= 75 ? 'bg-blue-500' :
                        task.progress >= 50 ? 'bg-yellow-500' :
                        task.progress >= 25 ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  
                  <div className="flex gap-1 mt-2">
                    {[0, 25, 50, 75, 100].map(value => (
                      <button
                        key={value}
                        onClick={() => updateProgress(task.id, value)}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${
                          task.progress >= value 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions */}
                {task.suggestions.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <Sparkles size={14} />
                      <span>KI-Vorschläge:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => executeSuggestion(task, suggestion)}
                          disabled={isProcessing}
                          className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700 text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <suggestion.icon size={14} />
                          {suggestion.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Voice View
  const VoiceView = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Voice Input</h2>
      
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            Drücke das Mikrofon und sprich deine Aufgabe
          </p>
        </div>
        
        {/* Transcript Box */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 min-h-[150px] relative">
          {transcript && (
            <button
              onClick={clearTranscript}
              className="absolute top-3 right-3 p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
          <p className="text-gray-800 text-lg pr-10">
            {transcript || <span className="text-gray-400">Warte auf Spracheingabe...</span>}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`p-6 rounded-full transition-all transform ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
                : 'bg-purple-500 hover:bg-purple-600 hover:scale-105'
            } text-white shadow-lg disabled:opacity-50`}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <button
            onClick={createTaskFromTranscript}
            disabled={isProcessing || !transcript.trim()}
            className="p-6 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={32} className="animate-spin" /> : <Plus size={32} />}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="text-center">
            <p className="bg-gray-100 rounded-full px-6 py-3 inline-block">
              {status}
            </p>
          </div>
        )}
        
        {/* Examples */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Beispiele:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
            <div>• "Morgen Zahnarzt anrufen"</div>
            <div>• "Mail an Bestatter schreiben"</div>
            <div>• "Meeting mit Business Partner nächste Woche"</div>
            <div>• "Umzugskartons packen"</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Assistant View
  const AssistantView = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">KI-Assistent</h2>
      
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Brain size={64} className="mx-auto text-purple-500 mb-4" />
          <h3 className="text-xl font-semibold mb-4">Claude Integration</h3>
          <p className="text-gray-600 mb-6">
            Die KI-Integration wird in Kürze verfügbar sein.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Hier kannst du bald direkt mit Claude chatten, um:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
            <li>• E-Mails formulieren lassen</li>
            <li>• Aufgaben intelligent priorisieren</li>
            <li>• Komplexe Projekte planen</li>
            <li>• Automatische Workflows erstellen</li>
          </ul>
          
          <div className="mt-8 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700">
              💡 Tipp: Nutze vorerst die KI-Vorschläge bei deinen Tasks!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            {status && (
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {status}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('de-DE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'voice' && <VoiceView />}
          {activeView === 'assistant' && <AssistantView />}
        </div>
      </div>
    </div>
  );
}

export default App;
