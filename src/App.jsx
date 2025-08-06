import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Send, Loader2, Trash2, Plus, CheckCircle2, 
  Clock, Tag, AlertCircle, Mail, Phone, Calendar, 
  ChevronDown, ChevronUp, Sparkles, Target, X, Sun, Moon,
  Edit2, Save, FileText, CalendarDays, Menu, Home, ListTodo,
  ChevronRight
} from 'lucide-react';
import CalendarView from './CalendarView';

function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('flowlife_theme');
    return saved ? saved === 'dark' : true;
  });

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
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [manualTaskText, setManualTaskText] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState('');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState('sonstiges');
  
  // Task Details States
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskNotes, setTaskNotes] = useState({});
  
  // View States
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

  // Theme toggle effect
  useEffect(() => {
    localStorage.setItem('flowlife_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('flowlife_tasks');
    const savedNotes = localStorage.getItem('flowlife_notes');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    if (savedNotes) {
      setTaskNotes(JSON.parse(savedNotes));
    }

    // Detect mobile device
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    
    if (checkMobile) {
      setShowSidebar(false);
    }
  }, []);

  // Save tasks and notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowlife_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('flowlife_notes', JSON.stringify(taskNotes));
  }, [taskNotes]);

  // Get today's tasks
  const getTodaysTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.deadline === today && task.progress < 100);
  };

  // Get open tasks
  const getOpenTasks = () => {
    return tasks.filter(task => task.progress < 100);
  };

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
    setStatus('✅ Aufgabe erstellt');
    setShowVoiceInput(false);
    
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
      category: selectedTaskCategory,
      deadline: selectedDeadline || null,
      progress: 0,
      suggestions: [],
      created_at: new Date().toISOString(),
      completed_at: null
    };
    
    setTasks(prev => [newTask, ...prev]);
    setManualTaskText('');
    setSelectedDeadline('');
    setSelectedTaskCategory('sonstiges');
    setShowTaskInput(false);
    setShowVoiceInput(false);
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

  // Update task details
  const updateTask = (taskId, updates) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates };
      }
      return task;
    }));
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (showTaskModal && selectedTask?.id === taskId) {
      setShowTaskModal(false);
      setSelectedTask(null);
    }
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

  // Open task modal
  const openTaskModal = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
    setEditingTask(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedCategory === 'alle') return true;
    return task.category === selectedCategory;
  });

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
      if (event.error === 'no-speech') {
        setStatus('🔇 Keine Sprache erkannt');
      } else if (event.error === 'not-allowed') {
        setStatus('🎤 Bitte Mikrofon-Zugriff erlauben');
      } else if (event.error === 'aborted') {
        setStatus('');
      } else {
        setStatus('❌ Fehler: ' + event.error);
      }
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (isMobile && transcript.length < 100) {
        setStatus('👆 Tippe erneut zum Weitersprechen');
      } else {
        setStatus('');
      }
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

  // Handle navigation click - close sidebar on mobile
  const handleNavigation = (view) => {
    setActiveView(view);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Theme classes
  const theme = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    bgSecondary: isDarkMode ? 'bg-gray-800' : 'bg-white',
    bgTertiary: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    gradient: isDarkMode 
      ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900' 
      : 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500'
  };

  const todaysTasks = getTodaysTasks();
  const openTasks = getOpenTasks();

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Theme Toggle Button - repositioned for mobile */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed ${isMobile ? 'top-4 right-4' : 'top-4 right-20'} p-3 rounded-full ${theme.bgSecondary} ${theme.text} shadow-lg transition-all hover:scale-110 z-50`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - responsive width */}
      <div className={`fixed left-0 top-0 h-full ${isMobile ? 'w-48' : 'w-64'} ${theme.bgSecondary} ${theme.border} border-r transform transition-transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} z-40`}>
        <div className="p-4">
          <h2 className={`text-xl font-bold ${theme.text} mb-6`}>🚀 FlowLife</h2>
          
          <nav className="space-y-2">
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`w-full text-left px-4 py-2 rounded-lg ${activeView === 'dashboard' ? theme.bgTertiary : ''} ${theme.text} ${theme.hover} transition-colors flex items-center gap-2`}
            >
              <Home size={18} />
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation('tasks')}
              className={`w-full text-left px-4 py-2 rounded-lg ${activeView === 'tasks' ? theme.bgTertiary : ''} ${theme.text} ${theme.hover} transition-colors flex items-center gap-2`}
            >
              <ListTodo size={18} />
              Aufgaben
            </button>
            <button
              onClick={() => handleNavigation('calendar')}
              className={`w-full text-left px-4 py-2 rounded-lg ${activeView === 'calendar' ? theme.bgTertiary : ''} ${theme.text} ${theme.hover} transition-colors flex items-center gap-2`}
            >
              <CalendarDays size={18} />
              Kalender
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content - adjusted margin for mobile */}
      <div className={`transition-all duration-300 ${!isMobile && showSidebar ? 'ml-64' : 'ml-0'}`}>
        {/* Header - better spacing for mobile */}
        <div className={`sticky top-0 ${theme.bgSecondary} ${theme.border} border-b p-4 flex items-center gap-4 z-30`}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 ${theme.hover} rounded-lg ${theme.text} transition-colors ${isMobile ? 'mr-2' : ''}`}
          >
            <Menu size={20} />
          </button>
          
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${theme.text} flex-1`}>
            {activeView === 'calendar' ? '📅 Kalender' : activeView === 'tasks' ? '📋 Meine Aufgaben' : '🏠 Dashboard'}
          </h1>
          
          {!isMobile && (
            <span className={`${theme.textSecondary} text-sm`}>
              {openTasks.length} offen • {tasks.filter(t => t.progress === 100).length} erledigt
            </span>
          )}
        </div>

        {/* View Content */}
        {activeView === 'dashboard' ? (
          // Dashboard View
          <div className={`p-${isMobile ? '4' : '6'} max-w-6xl mx-auto`}>
            {/* Quick Add Section */}
            <div className={`${theme.bgSecondary} rounded-xl shadow-lg p-${isMobile ? '4' : '6'} mb-6`}>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold ${theme.text} mb-4`}>➕ Schnelleintrag</h2>
              
              {!showTaskInput && !showVoiceInput ? (
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-${isMobile ? '2' : '4'}`}>
                  <button
                    onClick={() => setShowVoiceInput(true)}
                    className="flex-1 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mic size={20} />
                    Spracheingabe
                  </button>
                  <button
                    onClick={() => setShowTaskInput(true)}
                    className="flex-1 p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={20} />
                    Text eingeben
                  </button>
                </div>
              ) : showVoiceInput ? (
                <div>
                  {/* Voice Input */}
                  <div className={`${theme.bgTertiary} rounded-lg p-4 mb-4 min-h-[100px] relative`}>
                    {transcript && (
                      <button
                        onClick={clearTranscript}
                        className="absolute top-2 right-2 p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <p className={`${theme.text} text-base pr-10`}>
                      {transcript || <span className={theme.textSecondary}>Drücke das Mikrofon und sprich...</span>}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                      className={`p-3 rounded-lg ${
                        isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'
                      } text-white transition-colors disabled:opacity-50`}
                    >
                      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                      onClick={createTaskFromTranscript}
                      disabled={!transcript.trim()}
                      className="flex-1 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
                    >
                      Aufgabe erstellen
                    </button>
                    <button
                      onClick={() => {
                        setShowVoiceInput(false);
                        clearTranscript();
                      }}
                      className={`p-3 ${theme.bgTertiary} ${theme.text} rounded-lg ${theme.hover}`}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Text Input */}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={manualTaskText}
                      onChange={(e) => setManualTaskText(e.target.value)}
                      placeholder="Aufgabe eingeben..."
                      className={`flex-1 ${theme.bgTertiary} ${theme.text} rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
                      onKeyPress={(e) => e.key === 'Enter' && createManualTask()}
                    />
                    <select
                      value={selectedTaskCategory}
                      onChange={(e) => setSelectedTaskCategory(e.target.value)}
                      className={`${theme.bgTertiary} ${theme.text} rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={selectedDeadline}
                      onChange={(e) => setSelectedDeadline(e.target.value)}
                      className={`${theme.bgTertiary} ${theme.text} rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createManualTask}
                      disabled={!manualTaskText.trim()}
                      className="flex-1 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
                    >
                      Aufgabe erstellen
                    </button>
                    <button
                      onClick={() => {
                        setShowTaskInput(false);
                        setManualTaskText('');
                      }}
                      className={`p-3 ${theme.bgTertiary} ${theme.text} rounded-lg ${theme.hover}`}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
              
              {status && (
                <div className="mt-3">
                  <p className={`${theme.textSecondary} ${theme.bgTertiary} rounded-full px-4 py-2 inline-block text-sm`}>
                    {status}
                  </p>
                </div>
              )}
            </div>

            {/* Today's Overview */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
              {/* Today's Tasks */}
              <div className={`${theme.bgSecondary} rounded-xl shadow-lg p-${isMobile ? '4' : '6'}`}>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
                  <Clock size={isMobile ? 18 : 20} />
                  Heute fällig ({todaysTasks.length})
                </h3>
                <div className="space-y-2">
                  {todaysTasks.length === 0 ? (
                    <p className={theme.textSecondary}>Keine Aufgaben für heute</p>
                  ) : (
                    todaysTasks.slice(0, 5).map(task => {
                      const category = categories.find(c => c.id === task.category);
                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskModal(task)}
                          className={`${theme.bgTertiary} rounded-lg p-3 ${theme.hover} transition-colors cursor-pointer flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm">{category?.label}</span>
                            <span className={theme.text}>{task.title}</span>
                          </div>
                          <ChevronRight size={16} className={theme.textSecondary} />
                        </div>
                      );
                    })
                  )}
                  {todaysTasks.length > 5 && (
                    <button
                      onClick={() => setActiveView('tasks')}
                      className={`text-sm ${theme.textSecondary} hover:text-blue-500`}
                    >
                      + {todaysTasks.length - 5} weitere...
                    </button>
                  )}
                </div>
              </div>

              {/* Open Tasks */}
              <div className={`${theme.bgSecondary} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
                  <ListTodo size={20} />
                  Offene Aufgaben ({openTasks.length})
                </h3>
                <div className="space-y-2">
                  {openTasks.length === 0 ? (
                    <p className={theme.textSecondary}>Alle Aufgaben erledigt!</p>
                  ) : (
                    openTasks.slice(0, 5).map(task => {
                      const category = categories.find(c => c.id === task.category);
                      const deadlineStatus = getDeadlineStatus(task.deadline);
                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskModal(task)}
                          className={`${theme.bgTertiary} rounded-lg p-3 ${theme.hover} transition-colors cursor-pointer flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm">{category?.label}</span>
                            <span className={theme.text}>{task.title}</span>
                            {task.deadline && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                deadlineStatus === 'overdue' ? 'bg-red-500/20 text-red-400' :
                                deadlineStatus === 'today' ? 'bg-orange-500/20 text-orange-400' :
                                deadlineStatus === 'tomorrow' ? 'bg-yellow-500/20 text-yellow-400' :
                                `${theme.bgSecondary} ${theme.textSecondary}`
                              }`}>
                                {new Date(task.deadline).toLocaleDateString('de-DE', { 
                                  day: '2-digit', 
                                  month: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${theme.textSecondary}`}>{task.progress}%</span>
                            <ChevronRight size={16} className={theme.textSecondary} />
                          </div>
                        </div>
                      );
                    })
                  )}
                  {openTasks.length > 5 && (
                    <button
                      onClick={() => setActiveView('tasks')}
                      className={`text-sm ${theme.textSecondary} hover:text-blue-500`}
                    >
                      + {openTasks.length - 5} weitere...
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeView === 'calendar' ? (
          <CalendarView 
            tasks={tasks}
            onTaskClick={openTaskModal}
            isDarkMode={isDarkMode}
          />
        ) : (
          // Tasks View
          <div className="p-6 max-w-6xl mx-auto">
            <div className={`${theme.bgSecondary} rounded-xl shadow-lg p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-semibold ${theme.text}`}>📋 Aufgabenliste</h2>
                <button
                  onClick={() => setShowTaskInput(!showTaskInput)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                  title="Neue Aufgabe"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Manual Task Input */}
              {showTaskInput && (
                <div className={`${theme.bgTertiary} rounded-xl p-4 mb-4`}>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={manualTaskText}
                      onChange={(e) => setManualTaskText(e.target.value)}
                      placeholder="Aufgabe eingeben..."
                      className={`flex-1 ${theme.bgSecondary} ${theme.text} rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
                      onKeyPress={(e) => e.key === 'Enter' && createManualTask()}
                    />
                    <select
                      value={selectedTaskCategory}
                      onChange={(e) => setSelectedTaskCategory(e.target.value)}
                      className={`${theme.bgSecondary} ${theme.text} rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={selectedDeadline}
                      onChange={(e) => setSelectedDeadline(e.target.value)}
                      className={`${theme.bgSecondary} ${theme.text} rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button
                      onClick={createManualTask}
                      disabled={!manualTaskText.trim()}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white disabled:opacity-50"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              )}

              {/* Category Filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('alle')}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === 'alle' 
                      ? 'bg-blue-500 text-white' 
                      : `${theme.bgTertiary} ${theme.text} ${theme.hover}`
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
                      className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                        selectedCategory === cat.id 
                          ? 'bg-blue-500 text-white' 
                          : `${theme.bgTertiary} ${theme.text} ${theme.hover}`
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Task List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <p className={`${theme.textSecondary} text-center py-8`}>
                    {selectedCategory === 'alle' 
                      ? 'Noch keine Aufgaben vorhanden' 
                      : 'Keine Aufgaben in dieser Kategorie'}
                  </p>
                ) : (
                  filteredTasks.map(task => {
                    const deadlineStatus = getDeadlineStatus(task.deadline);
                    const category = categories.find(c => c.id === task.category);
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`${theme.bgTertiary} rounded-xl p-4 ${theme.hover} transition-all cursor-pointer`}
                        onClick={() => openTaskModal(task)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className={`${theme.text} font-medium mb-1`}>{task.title}</h3>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`${theme.bgSecondary} px-2 py-1 rounded-full ${theme.textSecondary}`}>
                                {category?.label}
                              </span>
                              
                              {task.deadline && (
                                <span className={`px-2 py-1 rounded-full flex items-center gap-1 ${
                                  deadlineStatus === 'overdue' ? 'bg-red-500/50 text-white' :
                                  deadlineStatus === 'today' ? 'bg-orange-500/50 text-white' :
                                  deadlineStatus === 'tomorrow' ? 'bg-yellow-500/50 text-white' :
                                  `${theme.bgSecondary} ${theme.textSecondary}`
                                }`}>
                                  <Clock size={12} />
                                  {new Date(task.deadline).toLocaleDateString('de-DE', { 
                                    day: '2-digit', 
                                    month: '2-digit' 
                                  })}
                                </span>
                              )}
                              
                              <span className={`${theme.textSecondary}`}>
                                {task.progress}% erledigt
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="p-2 hover:bg-red-500/50 rounded-lg text-red-400 hover:text-white transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* AI Suggestions in List (wenn vorhanden) */}
                        {task.suggestions.length > 0 && (
                          <div className={`mt-3 pt-3 border-t ${theme.border}`} onClick={(e) => e.stopPropagation()}>
                            <div className={`flex items-center gap-1 text-xs ${theme.textSecondary} mb-2`}>
                              <Sparkles size={12} />
                              <span>KI-Vorschläge verfügbar</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme.bgSecondary} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`sticky top-0 ${theme.bgSecondary} border-b ${theme.border} p-4 flex justify-between items-center`}>
              <h2 className={`text-xl font-semibold ${theme.text}`}>Aufgaben-Details</h2>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                  setEditingTask(null);
                }}
                className={`p-2 ${theme.hover} rounded-lg ${theme.text}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Task Title */}
              {editingTask ? (
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  className={`w-full text-lg font-semibold ${theme.bgTertiary} ${theme.text} rounded-lg px-3 py-2 mb-4`}
                />
              ) : (
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{selectedTask.title}</h3>
              )}

              {/* Task Meta */}
              <div className="flex flex-wrap gap-2 mb-4">
                {editingTask ? (
                  <>
                    <select
                      value={editingTask.category}
                      onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                      className={`${theme.bgTertiary} ${theme.text} rounded-lg px-3 py-1`}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={editingTask.deadline || ''}
                      onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value})}
                      className={`${theme.bgTertiary} ${theme.text} rounded-lg px-3 py-1`}
                    />
                  </>
                ) : (
                  <>
                    <span className={`${theme.bgTertiary} px-3 py-1 rounded-full text-sm ${theme.text}`}>
                      {categories.find(c => c.id === selectedTask.category)?.label}
                    </span>
                    {selectedTask.deadline && (
                      <span className={`${theme.bgTertiary} px-3 py-1 rounded-full text-sm ${theme.text} flex items-center gap-1`}>
                        <Clock size={14} />
                        {new Date(selectedTask.deadline).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className={`flex justify-between text-sm ${theme.textSecondary} mb-2`}>
                  <span>Fortschritt</span>
                  <span>{selectedTask.progress}%</span>
                </div>
                <div className={`${theme.bgTertiary} rounded-full h-3 overflow-hidden mb-3`}>
                  <div 
                    className={`h-full transition-all duration-500 ${
                      selectedTask.progress === 100 ? 'bg-green-500' :
                      selectedTask.progress >= 75 ? 'bg-blue-500' :
                      selectedTask.progress >= 50 ? 'bg-yellow-500' :
                      selectedTask.progress >= 25 ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${selectedTask.progress}%` }}
                  />
                </div>
                <div className="flex gap-2">
                  {[0, 25, 50, 75, 100].map(value => (
                    <button
                      key={value}
                      onClick={() => {
                        updateProgress(selectedTask.id, value);
                        setSelectedTask({...selectedTask, progress: value});
                      }}
                      className={`flex-1 py-2 text-sm rounded transition-colors ${
                        selectedTask.progress >= value 
                          ? 'bg-blue-500 text-white' 
                          : `${theme.bgTertiary} ${theme.text} ${theme.hover}`
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes/Bemerkungen */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  📝 Bemerkungen
                </label>
                <textarea
                  value={taskNotes[selectedTask.id] || ''}
                  onChange={(e) => {
                    const newNotes = {...taskNotes, [selectedTask.id]: e.target.value};
                    setTaskNotes(newNotes);
                  }}
                  placeholder="Notizen hinzufügen..."
                  className={`w-full ${theme.bgTertiary} ${theme.text} rounded-lg px-3 py-2 h-24 resize-none`}
                />
              </div>

              {/* AI Suggestions */}
              {selectedTask.suggestions.length > 0 && (
                <div className="mb-4">
                  <div className={`flex items-center gap-2 text-sm font-medium ${theme.text} mb-2`}>
                    <Sparkles size={16} />
                    KI-Vorschläge
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => executeSuggestion(selectedTask, suggestion)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-white text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <suggestion.icon size={16} />
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {editingTask ? (
                  <>
                    <button
                      onClick={() => {
                        updateTask(selectedTask.id, editingTask);
                        setSelectedTask(editingTask);
                        setEditingTask(null);
                      }}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Speichern
                    </button>
                    <button
                      onClick={() => setEditingTask(null)}
                      className={`flex-1 py-2 ${theme.bgTertiary} ${theme.text} ${theme.hover} rounded-lg`}
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingTask(selectedTask)}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <Edit2 size={18} />
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        deleteTask(selectedTask.id);
                        setShowTaskModal(false);
                        setSelectedTask(null);
                      }}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Löschen
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
