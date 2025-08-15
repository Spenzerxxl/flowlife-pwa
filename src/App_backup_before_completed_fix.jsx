// App.jsx - FlowLife mit Supabase Integration - PROGRESS & STATUS FIX
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Send, Loader2, Trash2, Plus, CheckCircle2, 
  Clock, Tag, AlertCircle, Mail, Phone, Calendar, 
  ChevronDown, ChevronUp, Sparkles, Target, X, Sun, Moon,
  Pencil, Save, FileText, CalendarDays, Menu, Home, ListTodo,
  ChevronRight, LogOut, RefreshCw, Archive
} from 'lucide-react';
import CalendarView from './CalendarView';
import AuthComponent from './AuthComponent';
import { authService, tasksService } from './supabaseService';

function App() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

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
  const [selectedTaskCategory, setSelectedTaskCategory] = useState('Allgemein');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  
  // Task Details States
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskNotes, setTaskNotes] = useState({});
  
  // View States
  const [activeView, setActiveView] = useState('dashboard');
  const [showSidebar, setShowSidebar] = useState(true);

  // Real-time subscription
  const subscriptionRef = useRef(null);

  // Categories (angepasst an Datenbank-Kategorien)
  const categories = [
    { id: 'Familie', label: '👨‍👩‍👧 Familie', color: 'blue' },
    { id: 'Business', label: '💼 Business', color: 'purple' },
    { id: 'Loge', label: '🏛️ Loge', color: 'amber' },
    { id: 'Gesundheit', label: '💪 Gesundheit', color: 'green' },
    { id: 'Finanzen', label: '💰 Finanzen', color: 'yellow' },
    { id: 'Haushalt', label: '🏠 Haushalt', color: 'orange' },
    { id: 'Termine', label: '📅 Termine', color: 'pink' },
    { id: 'Umzug', label: '📦 Umzug', color: 'indigo' },
    { id: 'Allgemein', label: '📌 Allgemein', color: 'gray' }
  ];

  // Initialize Authentication
  useEffect(() => {
    checkUser();
    
    // Listen to auth state changes
    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadTasks();
      } else {
        setUser(null);
        setTasks([]);
      }
    });

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
      if (subscriptionRef.current) {
        tasksService.unsubscribeFromChanges(subscriptionRef.current);
      }
    };
  }, []);

  // Check current user
  const checkUser = async () => {
    const currentUser = await authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      await loadTasks();
      subscribeToTaskChanges();
    }
    setLoadingAuth(false);
  };

  // Load tasks from Supabase
  const loadTasks = async () => {
    setSyncing(true);
    try {
      const tasksData = await tasksService.getTasks();
      setTasks(tasksData.data || []);
      setLastSync(new Date());
      setStatus('Aufgaben synchronisiert');
    } catch (error) {
      setStatus('Fehler beim Laden der Aufgaben');
    } finally {
      setSyncing(false);
    }
  };

  // Subscribe to real-time changes
  const subscribeToTaskChanges = () => {
    if (subscriptionRef.current) {
      tasksService.unsubscribeFromChanges(subscriptionRef.current);
    }

    subscriptionRef.current = tasksService.subscribeToChanges((payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks(prev => prev.map(task => 
          task.id === payload.new.id ? payload.new : task
        ));
        // ✅ FIX: Auch selectedTask aktualisieren bei Real-time Updates
        if (selectedTask && selectedTask.id === payload.new.id) {
          setSelectedTask(payload.new);
        }
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        // ✅ FIX: selectedTask schließen wenn gelöscht
        if (selectedTask && selectedTask.id === payload.old.id) {
          setSelectedTask(null);
          setShowTaskModal(false);
        }
      }
      setLastSync(new Date());
    });
  };

  // Handle Authentication Success
  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    loadTasks();
    subscribeToTaskChanges();
  };

  // Handle Logout
  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setTasks([]);
    if (subscriptionRef.current) {
      tasksService.unsubscribeFromChanges(subscriptionRef.current);
    }
  };

  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setShowSidebar(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme Toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('flowlife_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Speech Recognition Setup
  useEffect(() => {
    if (!user) return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setStatus('Fehler bei der Spracherkennung');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        if (transcript) {
          processVoiceInput(transcript);
        }
      };
    }
  }, [user]);

  // Voice Recording Functions
  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setTranscript('');
      setIsRecording(true);
      recognitionRef.current.start();
      setStatus('Sprechen Sie jetzt...');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setStatus('Verarbeite...');
    }
  };

  // Process Voice Input
  const processVoiceInput = async (text) => {
    setIsProcessing(true);
    
    const task = {
      title: text,
      description: '',
      category: 'Allgemein',
      deadline: null,
      voiceCreated: true
    };

    if (text.toLowerCase().includes('termin') || text.toLowerCase().includes('meeting')) {
      task.category = 'Termine';
    } else if (text.toLowerCase().includes('familie')) {
      task.category = 'Familie';
    } else if (text.toLowerCase().includes('arbeit') || text.toLowerCase().includes('business')) {
      task.category = 'Business';
    }

    const result = await tasksService.createTask(task);
    
    console.log("📝 DEBUG: Service result:", result);
    if (result.success) {
      setStatus('Aufgabe erstellt und synchronisiert!');
      setTranscript('');
      setShowVoiceInput(false);
      await loadTasks(); // Reload to get latest data
    } else {
      setStatus('Fehler beim Erstellen der Aufgabe');
    }
    
    setIsProcessing(false);
  };

  // Add Manual Task
  const addManualTask = async () => {
    if (!manualTaskText.trim()) return;

    const task = {
      title: manualTaskText,
      description: '',
      category: selectedTaskCategory,
      deadline: selectedDeadline || null,
      voiceCreated: false
    };

    const result = await tasksService.createTask(task);
    
    console.log("📝 DEBUG: Service result:", result);
    if (result.success) {
      setManualTaskText('');
      setSelectedDeadline('');
      setSelectedTaskCategory('Allgemein');
      setShowTaskInput(false);
      setStatus('Aufgabe erstellt!');
      await loadTasks();
    } else {
      setStatus('Fehler beim Erstellen der Aufgabe');
    }
  };

  // ✅ FIX: Toggle Task Completion mit automatischem Progress-Update
  const toggleTaskComplete = async (taskId) => {
    console.log("🔥 DEBUG: toggleTaskComplete called with taskId:", taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log("❌ DEBUG: Task not found for ID:", taskId);
      return;
    }
    console.log("✅ DEBUG: Found task:", task);

    const newCompleted = !task.completed;
    const newProgress = newCompleted ? 100 : (task.progress || 0);

    console.log("📞 DEBUG: Calling tasksService.updateTask with:", { taskId, newCompleted, newProgress });
    const result = await tasksService.updateTask(taskId, {
      completed: newCompleted,
      progress: newProgress
    });

    console.log("📝 DEBUG: Service result:", result);
    if (result.success) {
      // ✅ Sofort lokalen State aktualisieren
      const updatedTask = { ...task, completed: newCompleted, progress: newProgress };
      
      // Tasks Array aktualisieren
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      // ✅ FIX: Auch selectedTask sofort aktualisieren!
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
      
      setStatus(newCompleted ? 'Aufgabe erledigt!' : 'Aufgabe wieder geöffnet');
      
      // Background reload für Konsistenz
      loadTasks();
    }
  };

  // ✅ FIX: Update Task Progress mit sofortiger UI-Aktualisierung
  const updateTaskProgress = async (taskId, progress) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log("❌ DEBUG: Task not found for ID:", taskId);
      return;
    }
    console.log("✅ DEBUG: Found task:", task);

    console.log("📞 DEBUG: Calling tasksService.updateTask with:", { taskId, newCompleted, newProgress });
    const result = await tasksService.updateTask(taskId, { progress });
    
    console.log("📝 DEBUG: Service result:", result);
    if (result.success) {
      // ✅ Sofort lokalen State aktualisieren
      const updatedTask = { ...task, progress };
      
      // Tasks Array aktualisieren
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      // ✅ FIX: Auch selectedTask sofort aktualisieren!
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
      
      setStatus(`Fortschritt auf ${progress}% aktualisiert`);
      
      // Background reload für Konsistenz
      loadTasks();
    }
  };

  // Delete Task
  const deleteTask = async (taskId) => {
    const result = await tasksService.deleteTask(taskId);
    
    console.log("📝 DEBUG: Service result:", result);
    if (result.success) {
      setSelectedTask(null);
      setShowTaskModal(false);
      await loadTasks();
      setStatus('Aufgabe gelöscht');
    }
  };

  // Save Task Edits
  const saveTaskEdit = async () => {
    if (!editingTask) return;

    const result = await tasksService.updateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      category: editingTask.category,
      deadline: editingTask.deadline
    });

    console.log("📝 DEBUG: Service result:", result);
    if (result.success) {
      setEditingTask(null);
      setSelectedTask(editingTask);
      await loadTasks();
      setStatus('Aufgabe aktualisiert');
    }
  };

  // ✅ FIX: Erweiterte Filter für Erledigt-Kategorie
  const filteredTasks = () => {
    if (selectedCategory === 'alle') return tasks;
    if (selectedCategory === 'erledigt') return tasks.filter(task => task.completed);
    if (selectedCategory === 'offen') return tasks.filter(task => !task.completed);
    return tasks.filter(task => task.category === selectedCategory);
  };

  // Show loading screen while checking authentication
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Lade FlowLife...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <AuthComponent onAuthSuccess={handleAuthSuccess} />;
  }

  // Main App UI - Part 1 of return statement
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setShowSidebar(!showSidebar)}>
                <Menu className="h-6 w-6 dark:text-gray-300" />
              </button>
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FlowLife
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sync Status */}
            <button 
              onClick={loadTasks}
              disabled={syncing}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={lastSync ? `Letzte Sync: ${lastSync.toLocaleTimeString()}` : 'Synchronisieren'}
            >
              <RefreshCw className={`h-5 w-5 dark:text-gray-300 ${syncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? 
                <Sun className="h-5 w-5 text-yellow-500" /> : 
                <Moon className="h-5 w-5 text-gray-600" />
              }
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Abmelden"
              >
                <LogOut className="h-5 w-5 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        {showSidebar && (
          <aside className={`${isMobile ? 'absolute z-40 h-full' : 'relative'} w-64 bg-white dark:bg-gray-800 shadow-lg`}>
            <nav className="p-4">
              <button
                onClick={() => { setActiveView('dashboard'); if (isMobile) setShowSidebar(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === 'dashboard' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </button>
              
              <button
                onClick={() => { setActiveView('tasks'); if (isMobile) setShowSidebar(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-2 ${
                  activeView === 'tasks' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <ListTodo className="h-5 w-5" />
                <span className="font-medium">Aufgaben</span>
              </button>

              <button
                onClick={() => { setActiveView('calendar'); if (isMobile) setShowSidebar(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-2 ${
                  activeView === 'calendar' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <CalendarDays className="h-5 w-5" />
                <span className="font-medium">Kalender</span>
              </button>

              {/* ✅ FIX: Erweiterte Kategorien */}
              <div className="mt-8">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Ansichten
                </h3>
                <button
                  onClick={() => { setSelectedCategory('alle'); if (isMobile) setShowSidebar(false); }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'alle'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="dark:text-gray-300">📊 Alle Aufgaben</span>
                </button>
                <button
                  onClick={() => { setSelectedCategory('offen'); if (isMobile) setShowSidebar(false); }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'offen'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="dark:text-gray-300">⏳ Offene Aufgaben</span>
                </button>
                <button
                  onClick={() => { setSelectedCategory('erledigt'); if (isMobile) setShowSidebar(false); }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'erledigt'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="dark:text-gray-300">✅ Erledigte Aufgaben</span>
                </button>
              </div>

              {/* Categories */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Kategorien
                </h3>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); if (isMobile) setShowSidebar(false); }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="dark:text-gray-300">{cat.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Dashboard</h2>
              
              {/* Quick Entry Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Schnelleintrag</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowVoiceInput(true)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    <Mic className="h-6 w-6 mx-auto mb-2" />
                    <span className="block text-sm">Spracheingabe</span>
                  </button>
                  <button
                    onClick={() => setShowTaskInput(true)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    <Plus className="h-6 w-6 mx-auto mb-2" />
                    <span className="block text-sm">Neue Aufgabe</span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {tasks.filter(t => !t.completed).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Offene Aufgaben</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {tasks.filter(t => t.completed).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Erledigt</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {tasks.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gesamt</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {tasks.filter(t => t.deadline && new Date(t.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Diese Woche</div>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Aktuelle Aufgaben</h3>
                <div className="space-y-2">
                  {filteredTasks().slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(task.id);
                          }}
                          className={`w-5 h-5 rounded-full border-2 ${
                            task.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {task.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </button>
                        <div>
                          <p className={`font-medium dark:text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {categories.find(c => c.id === task.category)?.label || task.category}
                          </p>
                        </div>
                      </div>
                      {task.deadline && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(task.deadline).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tasks View */}
          {activeView === 'tasks' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Aufgaben</h2>
                <button
                  onClick={() => setShowTaskInput(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Neue Aufgabe
                </button>
              </div>

              <div className="space-y-2">
                {filteredTasks().length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Aufgaben vorhanden</p>
                  </div>
                ) : (
                  filteredTasks().map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskComplete(task.id);
                            }}
                            className={`w-5 h-5 rounded-full border-2 mt-0.5 ${
                              task.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {task.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </button>
                          <div className="flex-1">
                            <p className={`font-medium dark:text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full dark:text-gray-300">
                                {categories.find(c => c.id === task.category)?.label || task.category}
                              </span>
                              {task.deadline && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(task.deadline).toLocaleDateString('de-DE')}
                                </span>
                              )}
                              {/* ✅ FIX: Progress-Anzeige in Task-Liste */}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {task.progress || 0}% erledigt
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Calendar View */}
          {activeView === 'calendar' && (
            <CalendarView tasks={tasks} isDarkMode={isDarkMode} />
          )}
        </main>
      </div>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-white">Spracheingabe</h3>
              <button
                onClick={() => {
                  setShowVoiceInput(false);
                  setTranscript('');
                  if (isRecording) stopRecording();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 dark:text-gray-300" />
              </button>
            </div>

            <div className="text-center py-8">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white shadow-lg`}
              >
                {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              </button>
              
              {transcript && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{transcript}</p>
                </div>
              )}
              
              {status && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{status}</p>
              )}
            </div>

            {transcript && !isRecording && (
              <button
                onClick={() => processVoiceInput(transcript)}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Verarbeite...
                  </span>
                ) : (
                  'Aufgabe erstellen'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual Task Input Modal */}
      {showTaskInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-white">Neue Aufgabe</h3>
              <button
                onClick={() => {
                  setShowTaskInput(false);
                  setManualTaskText('');
                  setSelectedDeadline('');
                  setSelectedTaskCategory('Allgemein');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 dark:text-gray-300" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Was möchten Sie erledigen?
                </label>
                <input
                  type="text"
                  value={manualTaskText}
                  onChange={(e) => setManualTaskText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Aufgabe eingeben..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategorie
                </label>
                <select
                  value={selectedTaskCategory}
                  onChange={(e) => setSelectedTaskCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label.split(' ')[1]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fälligkeitsdatum (optional)
                </label>
                <input
                  type="date"
                  value={selectedDeadline}
                  onChange={(e) => setSelectedDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={addManualTask}
                disabled={!manualTaskText.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                Aufgabe hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold dark:text-white">Aufgabendetails</h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                  setEditingTask(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 dark:text-gray-300" />
              </button>
            </div>

            {editingTask ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Beschreibung..."
                />
                <select
                  value={editingTask.category}
                  onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label.split(' ')[1]}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={editingTask.deadline || ''}
                  onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveTaskEdit}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    <Save className="h-5 w-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium dark:text-white">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedTask.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm dark:text-gray-300">
                    {categories.find(c => c.id === selectedTask.category)?.label || selectedTask.category}
                  </span>
                  {selectedTask.deadline && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                      Fällig: {new Date(selectedTask.deadline).toLocaleDateString('de-DE')}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedTask.completed
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    {selectedTask.completed ? 'Erledigt' : 'Offen'}
                  </span>
                </div>

                {/* ✅ FIX: Progress mit sofortiger UI-Reaktion */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium dark:text-gray-300">Fortschritt</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{selectedTask.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${selectedTask.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[0, 25, 50, 75, 100].map(value => (
                      <button
                        key={value}
                        onClick={() => updateTaskProgress(selectedTask.id, value)}
                        className={`flex-1 py-1 rounded text-sm transition-colors ${
                          (selectedTask.progress || 0) === value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* ✅ FIX: Actions mit sofortiger UI-Reaktion */}
                <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={() => toggleTaskComplete(selectedTask.id)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      selectedTask.completed
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedTask.completed ? 'Wieder öffnen' : 'Als erledigt markieren'}
                  </button>
                  <button
                    onClick={() => { console.log("Edit clicked"); setEditingTask(selectedTask); }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteTask(selectedTask.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ FIX: Status-Nachricht für besseres Feedback */}
      {status && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {status}
        </div>
      )}
    </div>
  );
}

export default App;
