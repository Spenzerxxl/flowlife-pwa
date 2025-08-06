// App.jsx - FlowLife PWA mit Theme-Toggle
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, CheckCircle, Circle, Calendar, Clock, Tag, Trash2, 
  Edit2, X, ChevronRight, ChevronDown, Paperclip, AlertCircle,
  Search, Filter, Menu, Home, CheckSquare, Archive, Settings,
  Sun, Moon, Save, Mic, MicOff, Upload, FileText,
  Brain, Sparkles, Zap, Target, TrendingUp, Award,
  Coffee, Briefcase, Heart, Users, FolderOpen, MessageSquare,
  LayoutGrid, List
} from 'lucide-react';
import CalendarView from './CalendarView';

function App() {
  // Theme State - NEU!
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('flowlife_theme');
    return savedTheme || 'light';
  });
  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('flowlife_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newTaskInput, setNewTaskInput] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showSidebar, setShowSidebar] = useState(true);
  const [calendarViewMode, setCalendarViewMode] = useState('week');
  
  // Theme Toggle Function - NEU!
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('flowlife_theme', newTheme);
  };
  
  // Theme Classes - NEU!
  const themeClasses = {
    // Hauptcontainer
    mainBg: theme === 'light' ? 'bg-gray-50' : 'bg-gray-900',
    
    // Sidebar
    sidebarBg: theme === 'light' ? 'bg-white border-r border-gray-200' : 'bg-gray-800',
    sidebarText: theme === 'light' ? 'text-gray-800' : 'text-white',
    sidebarHover: theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700',
    sidebarActive: theme === 'light' ? 'bg-purple-100 text-purple-700' : 'bg-purple-600 text-white',
    
    // Cards & Container
    cardBg: theme === 'light' ? 'bg-white' : 'bg-gray-800',
    cardHoverBg: theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700',
    
    // Text
    primaryText: theme === 'light' ? 'text-gray-900' : 'text-white',
    secondaryText: theme === 'light' ? 'text-gray-600' : 'text-gray-400',
    
    // Inputs
    inputBg: theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600',
    inputText: theme === 'light' ? 'text-gray-900' : 'text-white',
    
    // Buttons
    buttonBg: theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-700 hover:bg-gray-600',
    buttonText: theme === 'light' ? 'text-gray-700' : 'text-gray-200',
    
    // Tags & Badges
    tagBg: theme === 'light' ? 'bg-gray-100' : 'bg-gray-700',
    tagText: theme === 'light' ? 'text-gray-600' : 'text-gray-300',
  };

  // Audio-System (unverändert)
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // KI-Vorschläge System (unverändert)
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [taskDescriptions, setTaskDescriptions] = useState(() => {
    const saved = localStorage.getItem('flowlife_task_descriptions');
    return saved ? JSON.parse(saved) : {};
  });

  // Speichern bei Änderungen
  useEffect(() => {
    localStorage.setItem('flowlife_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('flowlife_task_descriptions', JSON.stringify(taskDescriptions));
  }, [taskDescriptions]);

  // Rest der Funktionen bleiben unverändert...
  // (Ich kürze hier ab, da die Funktionen gleich bleiben)
  
  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-yellow-500', 
    low: 'text-green-500'
  };

  const categoryIcons = {
    work: Briefcase,
    personal: Heart,
    health: Heart,
    learning: Brain,
    finance: TrendingUp,
    social: Users,
    projects: FolderOpen,
    ideas: Sparkles
  };

  const createTask = () => {
    if (!newTaskInput.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      title: newTaskInput,
      completed: false,
      priority: 'medium',
      tags: [],
      category: 'personal',
      dueDate: null,
      subtasks: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskInput('');
    setAttachments([]);
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : null
        };
      }
      return task;
    }));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const updateTask = (taskId, updates) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  };

  // Filter-Logik
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => task.tags.includes(tag));
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesCompleted = showCompleted || !task.completed;
    
    return matchesSearch && matchesTags && matchesPriority && matchesCompleted;
  });

  // Stats berechnen
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length,
    todayTasks: tasks.filter(t => {
      if (!t.dueDate) return false;
      const today = new Date().toDateString();
      return new Date(t.dueDate).toDateString() === today;
    }).length
  };

  const allTags = [...new Set(tasks.flatMap(task => task.tags))];

  return (
    <div className={`min-h-screen ${themeClasses.mainBg} flex`}>
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 ${themeClasses.sidebarBg} ${themeClasses.sidebarText} overflow-hidden`}>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Zap className="text-purple-500" />
            FlowLife
          </h1>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'dashboard' ? themeClasses.sidebarActive : themeClasses.sidebarHover
              }`}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView('tasks')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'tasks' ? themeClasses.sidebarActive : themeClasses.sidebarHover
              }`}
            >
              <CheckSquare size={20} />
              <span>Aufgaben</span>
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'calendar' ? themeClasses.sidebarActive : themeClasses.sidebarHover
              }`}
            >
              <Calendar size={20} />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => setActiveView('ai')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'ai' ? themeClasses.sidebarActive : themeClasses.sidebarHover
              }`}
            >
              <Brain size={20} />
              <span>KI-Assistent</span>
            </button>
          </nav>
          
          {/* Theme Toggle Button - NEU! */}
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className={`${themeClasses.cardBg} shadow-sm border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText}`}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'bg-purple-900 text-purple-300'}`}>
                <Award size={20} />
                <span className="font-medium">{stats.completed} erledigt</span>
              </div>
              
              <button className={`p-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText}`}>
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 overflow-auto h-[calc(100vh-73px)]">
          {activeView === 'dashboard' && (
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${themeClasses.primaryText}`}>
                Willkommen zurück! 👋
              </h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className={`${themeClasses.cardBg} rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={themeClasses.secondaryText}>Gesamt</span>
                    <CheckSquare className="text-purple-500" size={20} />
                  </div>
                  <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>{stats.total}</div>
                </div>
                
                <div className={`${themeClasses.cardBg} rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={themeClasses.secondaryText}>Offen</span>
                    <Circle className="text-blue-500" size={20} />
                  </div>
                  <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>{stats.pending}</div>
                </div>
                
                <div className={`${themeClasses.cardBg} rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={themeClasses.secondaryText}>Heute</span>
                    <Calendar className="text-green-500" size={20} />
                  </div>
                  <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>{stats.todayTasks}</div>
                </div>
                
                <div className={`${themeClasses.cardBg} rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={themeClasses.secondaryText}>Wichtig</span>
                    <AlertCircle className="text-red-500" size={20} />
                  </div>
                  <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>{stats.highPriority}</div>
                </div>
              </div>

              {/* Quick Add */}
              <div className={`${themeClasses.cardBg} rounded-xl p-6 shadow-sm mb-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.primaryText}`}>Neue Aufgabe</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createTask()}
                    placeholder="Was möchtest du erledigen?"
                    className={`flex-1 px-4 py-2 rounded-lg border ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  <button
                    onClick={createTask}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Hinzufügen
                  </button>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className={`${themeClasses.cardBg} rounded-xl p-6 shadow-sm`}>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.primaryText}`}>Aktuelle Aufgaben</h3>
                <div className="space-y-2">
                  {filteredTasks.slice(0, 5).map(task => (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg ${themeClasses.cardHoverBg} transition-colors cursor-pointer`}
                         onClick={() => setSelectedTask(task)}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                          className={task.completed ? 'text-green-500' : themeClasses.secondaryText}
                        >
                          {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                        <span className={`${task.completed ? 'line-through ' + themeClasses.secondaryText : themeClasses.primaryText}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className={priorityColors[task.priority]}>
                        <AlertCircle size={16} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Alle Aufgaben</h2>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`px-4 py-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors`}
                  >
                    {showCompleted ? 'Erledigte ausblenden' : 'Alle anzeigen'}
                  </button>
                </div>
              </div>

              {/* Task List */}
              <div className={`${themeClasses.cardBg} rounded-xl p-6 shadow-sm`}>
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg ${themeClasses.cardHoverBg} transition-colors`}>
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={task.completed ? 'text-green-500' : themeClasses.secondaryText}
                        >
                          {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                        </button>
                        
                        <div className="flex-1">
                          <div className={`font-medium ${task.completed ? 'line-through ' + themeClasses.secondaryText : themeClasses.primaryText}`}>
                            {task.title}
                          </div>
                          {task.tags.length > 0 && (
                            <div className="flex gap-2 mt-1">
                              {task.tags.map(tag => (
                                <span key={tag} className={`text-xs px-2 py-1 rounded-full ${themeClasses.tagBg} ${themeClasses.tagText}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={priorityColors[task.priority]}>
                            <AlertCircle size={20} />
                          </span>
                          
                          {task.dueDate && (
                            <span className={`text-sm ${themeClasses.secondaryText} flex items-center gap-1`}>
                              <Calendar size={16} />
                              {new Date(task.dueDate).toLocaleDateString('de-DE')}
                            </span>
                          )}
                          
                          <button
                            onClick={() => setEditingTask(task)}
                            className={`p-2 rounded-lg ${themeClasses.buttonBg} transition-colors`}
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredTasks.length === 0 && (
                    <div className={`text-center py-12 ${themeClasses.secondaryText}`}>
                      <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Keine Aufgaben gefunden</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'calendar' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Kalender Integration</h2>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarViewMode('week')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      calendarViewMode === 'week' 
                        ? 'bg-purple-600 text-white' 
                        : `${themeClasses.buttonBg} ${themeClasses.buttonText}`
                    }`}
                  >
                    <LayoutGrid size={20} />
                    Woche
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('list')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      calendarViewMode === 'list' 
                        ? 'bg-purple-600 text-white' 
                        : `${themeClasses.buttonBg} ${themeClasses.buttonText}`
                    }`}
                  >
                    <List size={20} />
                    Liste
                  </button>
                </div>
              </div>
              
              <CalendarView 
                tasks={tasks} 
                taskDescriptions={taskDescriptions}
                onCreateEventFromTask={(taskId) => {
                  console.log('Create event from task:', taskId);
                }}
                viewMode={calendarViewMode}
                theme={theme}
              />
            </div>
          )}

          {activeView === 'ai' && (
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${themeClasses.primaryText}`}>KI-Assistent</h2>
              
              <div className={`${themeClasses.cardBg} rounded-xl p-6 shadow-sm`}>
                <div className={`rounded-xl p-4 mb-4 min-h-[150px] max-h-[250px] overflow-y-auto ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
                  {aiSuggestions.length > 0 ? (
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className={`p-3 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                          <div className="flex items-start gap-2">
                            <Sparkles className="text-purple-500 mt-1" size={16} />
                            <div>
                              <p className={`font-medium ${themeClasses.primaryText}`}>{suggestion.title}</p>
                              <p className={`text-sm mt-1 ${themeClasses.secondaryText}`}>{suggestion.description}</p>
                              {suggestion.action && (
                                <button className="text-purple-600 text-sm mt-2 hover:underline">
                                  {suggestion.action}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center ${themeClasses.secondaryText}`}>
                      <Brain size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Der KI-Assistent analysiert deine Aufgaben und gibt dir intelligente Vorschläge.</p>
                      <p className="text-sm mt-2">Kommt bald!</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Frag den KI-Assistenten..."
                    className={`flex-1 px-4 py-2 rounded-lg border ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Senden
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
