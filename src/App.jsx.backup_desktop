import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Send, Loader2, Trash2, Plus, CheckCircle2, 
  Clock, Tag, AlertCircle, Mail, Phone, Calendar, 
  ChevronDown, ChevronUp, Sparkles, Target, X
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

  // Voice recording functions (unchanged from original)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">🚀 FlowLife</h1>
          <p className="text-white/80 text-sm sm:text-base">
            Voice-Powered Life Management • {tasks.length} Tasks
          </p>
        </div>

        {/* Voice Input Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">🎤 Voice Input</h2>
          
          {/* Transcript Box */}
          <div className="bg-white/20 rounded-2xl p-4 mb-4 min-h-[100px] max-h-[150px] overflow-y-auto relative">
            {transcript && (
              <button
                onClick={clearTranscript}
                className="absolute top-2 right-2 p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-white transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <p className="text-white text-base pr-10 whitespace-pre-wrap">
              {transcript || <span className="text-white/50">Drücke das Mikrofon und sprich deinen Task...</span>}
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
                  : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
              } text-white shadow-lg disabled:opacity-50`}
            >
              {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
            </button>

            <button
              onClick={createTaskFromTranscript}
              disabled={isProcessing || !transcript.trim()}
              className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
              title="Task erstellen"
            >
              {isProcessing ? <Loader2 size={28} className="animate-spin" /> : <Plus size={28} />}
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className="text-center">
              <p className="text-white bg-black/30 backdrop-blur rounded-full px-4 py-2 inline-block text-sm">
                {status}
              </p>
            </div>
          )}
        </div>

        {/* Task Management Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">📋 Meine Tasks</h2>
            <button
              onClick={() => setShowTaskInput(!showTaskInput)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
              title="Manuell hinzufügen"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Manual Task Input */}
          {showTaskInput && (
            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={manualTaskText}
                  onChange={(e) => setManualTaskText(e.target.value)}
                  placeholder="Task eingeben..."
                  className="flex-1 bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-2 outline-none focus:bg-white/30"
                  onKeyPress={(e) => e.key === 'Enter' && createManualTask()}
                />
                <input
                  type="date"
                  value={selectedDeadline}
                  onChange={(e) => setSelectedDeadline(e.target.value)}
                  className="bg-white/20 text-white rounded-lg px-3 py-2 outline-none focus:bg-white/30"
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
                  ? 'bg-white/30 text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
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
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Task List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <p className="text-white/50 text-center py-8">
                {selectedCategory === 'alle' 
                  ? 'Noch keine Tasks. Sprich oder tippe, um zu beginnen!' 
                  : 'Keine Tasks in dieser Kategorie.'}
              </p>
            ) : (
              filteredTasks.map(task => {
                const deadlineStatus = getDeadlineStatus(task.deadline);
                const category = categories.find(c => c.id === task.category);
                
                return (
                  <div key={task.id} className="bg-white/20 rounded-xl p-4 hover:bg-white/25 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{task.title}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          {/* Category Badge */}
                          <span className="bg-white/20 px-2 py-1 rounded-full text-white/80">
                            {category?.label}
                          </span>
                          
                          {/* Deadline Badge */}
                          {task.deadline && (
                            <span className={`px-2 py-1 rounded-full flex items-center gap-1 ${
                              deadlineStatus === 'overdue' ? 'bg-red-500/50 text-white' :
                              deadlineStatus === 'today' ? 'bg-orange-500/50 text-white' :
                              deadlineStatus === 'tomorrow' ? 'bg-yellow-500/50 text-white' :
                              'bg-white/20 text-white/80'
                            }`}>
                              <Clock size={12} />
                              {new Date(task.deadline).toLocaleDateString('de-DE', { 
                                day: '2-digit', 
                                month: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 hover:bg-red-500/50 rounded-lg text-white/70 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-white/70 mb-1">
                        <span>Fortschritt</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            task.progress === 100 ? 'bg-green-500' :
                            task.progress >= 75 ? 'bg-blue-500' :
                            task.progress >= 50 ? 'bg-yellow-500' :
                            task.progress >= 25 ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      
                      {/* Progress Buttons */}
                      <div className="flex gap-1 mt-2">
                        {[0, 25, 50, 75, 100].map(value => (
                          <button
                            key={value}
                            onClick={() => updateProgress(task.id, value)}
                            className={`flex-1 py-1 text-xs rounded transition-colors ${
                              task.progress >= value 
                                ? 'bg-white/30 text-white' 
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                          >
                            {value}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    {task.suggestions.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex items-center gap-1 text-xs text-white/70 mb-2">
                          <Sparkles size={12} />
                          <span>KI-Vorschläge:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {task.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => executeSuggestion(task, suggestion)}
                              disabled={isProcessing}
                              className="px-3 py-1 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-white text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
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

        {/* Footer Info */}
        <div className="mt-6 text-center text-white/50 text-xs">
          <p>💡 Spreche natürlich: "Morgen Zahnarzt anrufen" • "Mail an Bestatter schreiben"</p>
          <p className="mt-1">{isMobile ? '📱 Mobile' : '💻 Desktop'} • Daten lokal gespeichert</p>
        </div>
      </div>
    </div>
  );
}

export default App;
