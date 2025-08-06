import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Send, Loader2, Trash2, Plus, CheckCircle2, 
  Clock, Tag, AlertCircle, Mail, Phone, Calendar, Menu,
  ChevronDown, ChevronUp, Sparkles, Target, X, MessageSquare,
  CalendarDays, Brain, Home, List, Settings, Search, Filter,
  Edit2, Save, FileText, Link, Upload, Image as ImageIcon
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
  const [selectedTaskCategory, setSelectedTaskCategory] = useState('sonstiges');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Add States (Dashboard)
  const [quickTaskText, setQuickTaskText] = useState('');
  const [quickTaskCategory, setQuickTaskCategory] = useState('');
  const [quickTaskDeadline, setQuickTaskDeadline] = useState('');
  
  // Task Details States
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskDescriptions, setTaskDescriptions] = useState({});
  const [taskAttachments, setTaskAttachments] = useState({});
  
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

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('flowlife_tasks');
    const savedDescriptions = localStorage.getItem('flowlife_descriptions');
    const savedAttachments = localStorage.getItem('flowlife_attachments');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    if (savedDescriptions) {
      setTaskDescriptions(JSON.parse(savedDescriptions));
    }
    if (savedAttachments) {
      setTaskAttachments(JSON.parse(savedAttachments));
    }

    // Detect mobile device
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    
    // Auto-hide sidebar on mobile
    if (checkMobile) {
      setShowSidebar(false);
    }
  }, []);

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowlife_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('flowlife_descriptions', JSON.stringify(taskDescriptions));
  }, [taskDescriptions]);

  useEffect(() => {
    localStorage.setItem('flowlife_attachments', JSON.stringify(taskAttachments));
  }, [taskAttachments]);

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
    
    setTimeout(() => {
      setStatus('');
    }, 3000);
  };

  // Create manual task (Aufgaben-Seite)
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
  };

  // Create quick task (Dashboard)
  const createQuickTask = () => {
    if (!quickTaskText.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      title: quickTaskText.trim(),
      category: quickTaskCategory || 'sonstiges',
      deadline: quickTaskDeadline || null,
      progress: 0,
      suggestions: [],
      created_at: new Date().toISOString(),
      completed_at: null
    };
    
    setTasks(prev => [newTask, ...prev]);
    setQuickTaskText('');
    setQuickTaskCategory('');
    setQuickTaskDeadline('');
    setStatus('✅ Aufgabe hinzugefügt!');
    
    setTimeout(() => {
      setStatus('');
    }, 2000);
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
    // Also clean up descriptions and attachments
    setTaskDescriptions(prev => {
      const newDescriptions = { ...prev };
      delete newDescriptions[taskId];
      return newDescriptions;
    });
    setTaskAttachments(prev => {
      const newAttachments = { ...prev };
      delete newAttachments[taskId];
      return newAttachments;
    });
  };

  // Update task description
  const updateTaskDescription = (taskId, description) => {
    setTaskDescriptions(prev => ({
      ...prev,
      [taskId]: description
    }));
  };

  // Add attachment to task
  const addTaskAttachment = (taskId, attachment) => {
    setTaskAttachments(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), attachment]
    }));
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

  // Filter tasks based on search and category
  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'alle' || task.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (taskDescriptions[task.id] && taskDescriptions[task.id].toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
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

  // Get stats for dashboard
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.progress === 100).length;
    const today = tasks.filter(t => getDeadlineStatus(t.deadline) === 'today').length;
    const overdue = tasks.filter(t => getDeadlineStatus(t.deadline) === 'overdue').length;
    
    return { total, completed, today, overdue };
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

  // Render different views based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'tasks':
        return renderTasks();
      case 'calendar':
        return renderCalendar();
      case 'ai':
        return renderAI();
      case 'voice':
        return renderVoiceInput();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    const stats = getTaskStats();
    
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-gray-500 text-sm mb-1">Gesamt</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-400">Aufgaben</div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
            <div className="text-green-600 text-sm mb-1">Erledigt</div>
            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            <div className="text-xs text-green-500">Abgeschlossen</div>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 shadow-sm border border-orange-200">
            <div className="text-orange-600 text-sm mb-1">Heute</div>
            <div className="text-2xl font-bold text-orange-700">{stats.today}</div>
            <div className="text-xs text-orange-500">Fällig</div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
            <div className="text-red-600 text-sm mb-1">Überfällig</div>
            <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
            <div className="text-xs text-red-500">Verspätet</div>
          </div>
        </div>

        {/* Schnell-Eingabe */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Schnell-Eingabe</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={quickTaskText}
              onChange={(e) => setQuickTaskText(e.target.value)}
              placeholder="Neue Aufgabe hinzufügen..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && createQuickTask()}
            />
            
            <div className="flex gap-3">
              <select
                value={quickTaskCategory}
                onChange={(e) => setQuickTaskCategory(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Kategorie (optional)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              
              <input
                type="date"
                value={quickTaskDeadline}
                onChange={(e) => setQuickTaskDeadline(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Datum (optional)"
              />
              
              <button
                onClick={createQuickTask}
                disabled={!quickTaskText.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>

        {/* Aktuelle Aufgaben */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Aktuelle Aufgaben</h2>
          <div className="space-y-2">
            {tasks.slice(0, 5).map(task => {
              const category = categories.find(c => c.id === task.category);
              const deadlineStatus = getDeadlineStatus(task.deadline);
              
              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{category?.label}</span>
                    <span className="font-medium text-gray-800">{task.title}</span>
                    {task.deadline && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        deadlineStatus === 'overdue' ? 'bg-red-100 text-red-700' :
                        deadlineStatus === 'today' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {new Date(task.deadline).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{task.progress}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTasks = () => {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Aufgaben</h1>
          <button
            onClick={() => setShowTaskInput(!showTaskInput)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Neue Aufgabe
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Aufgaben durchsuchen..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Add Task Form */}
        {showTaskInput && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
            <div className="space-y-3">
              <input
                type="text"
                value={manualTaskText}
                onChange={(e) => setManualTaskText(e.target.value)}
                placeholder="Aufgabe eingeben..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && createManualTask()}
              />
              
              <div className="flex gap-3">
                <select
                  value={selectedTaskCategory}
                  onChange={(e) => setSelectedTaskCategory(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                
                <input
                  type="date"
                  value={selectedDeadline}
                  onChange={(e) => setSelectedDeadline(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                <button
                  onClick={createManualTask}
                  disabled={!manualTaskText.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('alle')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'alle' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'Keine Aufgaben gefunden' : 'Noch keine Aufgaben vorhanden'}
            </div>
          ) : (
            filteredTasks.map(task => {
              const deadlineStatus = getDeadlineStatus(task.deadline);
              const category = categories.find(c => c.id === task.category);
              const isExpanded = expandedTaskId === task.id;
              const isEditing = editingTaskId === task.id;
              
              return (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">{task.title}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bg-gray-100 px-2 py-1 rounded-full">
                            {category?.label}
                          </span>
                          
                          {task.deadline && (
                            <span className={`px-2 py-1 rounded-full flex items-center gap-1 ${
                              deadlineStatus === 'overdue' ? 'bg-red-100 text-red-700' :
                              deadlineStatus === 'today' ? 'bg-orange-100 text-orange-700' :
                              deadlineStatus === 'tomorrow' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <Clock size={12} />
                              {new Date(task.deadline).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Details anzeigen"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
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
                                ? 'bg-purple-600 text-white' 
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
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                          <Sparkles size={12} />
                          <span>KI-Vorschläge:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {task.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => executeSuggestion(task, suggestion)}
                              disabled={isProcessing}
                              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <suggestion.icon size={14} />
                              {suggestion.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Beschreibung</h4>
                            <button
                              onClick={() => setEditingTaskId(isEditing ? null : task.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                            </button>
                          </div>
                          
                          {isEditing ? (
                            <textarea
                              value={taskDescriptions[task.id] || ''}
                              onChange={(e) => updateTaskDescription(task.id, e.target.value)}
                              placeholder="Beschreibung hinzufügen..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              rows="3"
                            />
                          ) : (
                            <p className="text-sm text-gray-600">
                              {taskDescriptions[task.id] || <span className="text-gray-400">Keine Beschreibung vorhanden</span>}
                            </p>
                          )}
                        </div>

                        {/* Attachments */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Anhänge</h4>
                          <div className="flex gap-2 flex-wrap">
                            {taskAttachments[task.id]?.map((attachment, idx) => (
                              <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                {attachment.type === 'link' ? <Link size={12} /> :
                                 attachment.type === 'image' ? <ImageIcon size={12} /> :
                                 <FileText size={12} />}
                                <span>{attachment.name}</span>
                              </div>
                            ))}
                            
                            <button
                              onClick={() => {
                                // Placeholder für Upload-Funktion
                                const url = prompt('Link hinzufügen:');
                                if (url) {
                                  addTaskAttachment(task.id, {
                                    type: 'link',
                                    name: url.slice(0, 30) + '...',
                                    url: url
                                  });
                                }
                              }}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center gap-1 transition-colors"
                            >
                              <Plus size={12} />
                              Anhang
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Google Kalender</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=primary&ctz=Europe%2FBerlin&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&hl=de"
            style={{ border: 0 }}
            width="100%"
            height="600"
            frameBorder="0"
            scrolling="no"
            title="Google Kalender"
            className="rounded-lg"
          ></iframe>
        </div>
      </div>
    );
  };

  const renderAI = () => {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">KI-Assistent</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Brain className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Claude Integration kommt bald!</h2>
            <p className="text-gray-600 mb-4">
              Der KI-Assistent wird in Kürze verfügbar sein und dir bei folgenden Aufgaben helfen:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>E-Mails formulieren und versenden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Termine intelligent planen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Aufgaben automatisch priorisieren</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Dokumente erstellen und bearbeiten</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Komplexe Workflows automatisieren</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderVoiceInput = () => {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Voice Input</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎤 Sprachsteuerung</h2>
          
          {/* Transcript Box */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 min-h-[150px] max-h-[250px] overflow-y-auto relative">
            {transcript && (
              <button
                onClick={clearTranscript}
                className="absolute top-2 right-2 p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <p className="text-gray-800 pr-10 whitespace-pre-wrap">
              {transcript || <span className="text-gray-400">Drücke das Mikrofon und sprich deinen Task...</span>}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-4 rounded-full transition-all transform ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
                  : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
              } text-white shadow-lg disabled:opacity-50`}
            >
              {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
            </button>

            <button
              onClick={createTaskFromTranscript}
              disabled={isProcessing || !transcript.trim()}
              className="p-4 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
              title="Task erstellen"
            >
              {isProcessing ? <Loader2 size={28} className="animate-spin" /> : <Plus size={28} />}
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className="text-center">
              <p className="text-sm bg-gray-100 rounded-full px-4 py-2 inline-block">
                {status}
              </p>
            </div>
          )}

          {/* Voice Tips */}
          <div className="mt-6 p-4 bg-purple-50 rounded-xl">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">💡 Voice-Tipps:</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Sage "Morgen" oder "Heute" für automatische Deadlines</li>
              <li>• Erwähne "Familie", "Business", "Loge" für automatische Kategorisierung</li>
              <li>• Sage "E-Mail schreiben" oder "anrufen" für KI-Vorschläge</li>
              <li>• Beispiel: "Morgen Mutter anrufen wegen Geburtstag"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 text-white overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🚀</span>
            </div>
            <h1 className="text-xl font-bold">FlowLife</h1>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'dashboard' ? 'bg-purple-600' : 'hover:bg-gray-800'
              }`}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('tasks')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'tasks' ? 'bg-purple-600' : 'hover:bg-gray-800'
              }`}
            >
              <List size={20} />
              <span>Aufgaben</span>
              {tasks.length > 0 && (
                <span className="ml-auto bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('calendar')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'calendar' ? 'bg-purple-600' : 'hover:bg-gray-800'
              }`}
            >
              <CalendarDays size={20} />
              <span>Google Kalender</span>
              <span className="ml-auto text-xs">
                <ChevronDown size={16} className="transform -rotate-90" />
              </span>
            </button>

            <button
              onClick={() => setActiveView('ai')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'ai' ? 'bg-purple-600' : 'hover:bg-gray-800'
              }`}
            >
              <Brain size={20} />
              <span>KI-Assistent</span>
            </button>

            <button
              onClick={() => setActiveView('voice')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'voice' ? 'bg-purple-600' : 'hover:bg-gray-800'
              }`}
            >
              <Mic size={20} />
              <span>Voice Input</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('de-DE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            {status && (
              <div className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                {status}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
