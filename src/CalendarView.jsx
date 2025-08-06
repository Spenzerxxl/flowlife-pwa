// CalendarView.jsx - Mit Theme-Support
import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, LogIn, LogOut, RefreshCw, CalendarPlus, 
  CalendarX, Edit2, Clock, MapPin, Loader2, CheckCircle,
  ChevronLeft, ChevronRight, Calendar, LayoutGrid, List
} from 'lucide-react';
import GoogleCalendarService from './GoogleCalendarService';

function CalendarView({ tasks, taskDescriptions, onCreateEventFromTask, viewMode = 'week', theme = 'light' }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [status, setStatus] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    isAllDay: false
  });

  // Theme Classes
  const themeClasses = {
    // Container
    containerBg: theme === 'light' ? 'bg-white' : 'bg-gray-800',
    
    // Text
    primaryText: theme === 'light' ? 'text-gray-900' : 'text-white',
    secondaryText: theme === 'light' ? 'text-gray-600' : 'text-gray-400',
    
    // Calendar Grid
    gridBg: theme === 'light' ? 'bg-gray-50' : 'bg-gray-900',
    gridBorder: theme === 'light' ? 'border-gray-200' : 'border-gray-700',
    
    // Events
    eventBg: theme === 'light' ? 'bg-blue-100 hover:bg-blue-200' : 'bg-blue-900 hover:bg-blue-800',
    eventText: theme === 'light' ? 'text-blue-900' : 'text-blue-100',
    
    // Today Highlight
    todayBg: theme === 'light' ? 'bg-green-50' : 'bg-green-900/30',
    todayBorder: theme === 'light' ? 'border-green-400' : 'border-green-600',
    
    // Buttons
    buttonBg: theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-700 hover:bg-gray-600',
    buttonText: theme === 'light' ? 'text-gray-700' : 'text-gray-200',
    
    // Inputs
    inputBg: theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600',
    inputText: theme === 'light' ? 'text-gray-900' : 'text-white',
    
    // Modal
    modalBg: theme === 'light' ? 'bg-white' : 'bg-gray-800',
    modalOverlay: 'bg-black bg-opacity-50',
  };

  // Initialize Google Calendar Service
  useEffect(() => {
    GoogleCalendarService.init()
      .then(() => {
        console.log('Google Calendar Service initialized');
        if (GoogleCalendarService.isSignedIn()) {
          setIsSignedIn(true);
          loadEvents();
        }
      })
      .catch(error => {
        console.error('Failed to initialize Google Calendar:', error);
        setStatus('⚠️ Google Calendar konnte nicht geladen werden.');
      });
  }, []);

  // Sign in with Google
  const handleSignIn = async () => {
    try {
      await GoogleCalendarService.signIn();
      setIsSignedIn(true);
      setStatus('✅ Erfolgreich angemeldet!');
      loadEvents();
    } catch (error) {
      console.error('Sign in failed:', error);
      setStatus('❌ Anmeldung fehlgeschlagen');
    }
  };

  // Sign out
  const handleSignOut = () => {
    GoogleCalendarService.signOut();
    setIsSignedIn(false);
    setCalendarEvents([]);
    setStatus('👋 Abgemeldet');
  };

  // Load calendar events
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const events = await GoogleCalendarService.listEvents();
      setCalendarEvents(events);
      setStatus(`📅 ${events.length} Events geladen`);
    } catch (error) {
      console.error('Failed to load events:', error);
      setStatus('❌ Events konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  // Get week dates
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Navigate week
  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Format time
  const formatTime = (dateTime) => {
    if (!dateTime) return 'Ganztägig';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Create event
  const createEvent = async () => {
    if (!newEvent.summary || !newEvent.startDate) {
      setStatus('⚠️ Bitte Titel und Datum eingeben');
      return;
    }

    setIsLoading(true);
    try {
      let startDateTime, endDateTime;

      if (newEvent.isAllDay) {
        startDateTime = newEvent.startDate;
        endDateTime = newEvent.endDate || newEvent.startDate;
      } else {
        startDateTime = `${newEvent.startDate}T${newEvent.startTime || '09:00'}:00`;
        endDateTime = `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || '10:00'}:00`;
      }

      const event = {
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
        start: newEvent.isAllDay ? { date: startDateTime } : { dateTime: startDateTime },
        end: newEvent.isAllDay ? { date: endDateTime } : { dateTime: endDateTime }
      };

      await GoogleCalendarService.createEvent(event);
      setStatus('✅ Event erstellt!');
      loadEvents();
      setShowEventModal(false);
      setNewEvent({
        summary: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        isAllDay: false
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      setStatus('❌ Event konnte nicht erstellt werden');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (!window.confirm('Event wirklich löschen?')) return;

    setIsLoading(true);
    try {
      await GoogleCalendarService.deleteEvent(eventId);
      setStatus('✅ Event gelöscht');
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      setStatus('❌ Event konnte nicht gelöscht werden');
    } finally {
      setIsLoading(false);
    }
  };

  // Week View Component
  const WeekView = () => {
    const weekDates = getWeekDates();
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return (
      <div className={`${themeClasses.containerBg} rounded-xl p-6 shadow-sm`}>
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className={`p-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className={`px-4 py-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors`}
            >
              Heute
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className={`p-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors`}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className={`text-lg font-semibold ${themeClasses.primaryText}`}>
            {weekDates[0].toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const events = getEventsForDate(date);
            const today = isToday(date);

            return (
              <div
                key={index}
                className={`border rounded-lg p-2 min-h-[150px] ${
                  today 
                    ? `${themeClasses.todayBg} ${themeClasses.todayBorder} border-2` 
                    : themeClasses.gridBorder
                } ${themeClasses.gridBg}`}
              >
                <div className={`text-center mb-2 ${themeClasses.secondaryText}`}>
                  <div className="text-xs">{dayNames[index]}</div>
                  <div className={`text-lg font-semibold ${today ? 'text-green-600' : themeClasses.primaryText}`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`p-1 rounded text-xs cursor-pointer ${themeClasses.eventBg} ${themeClasses.eventText} transition-colors`}
                      onClick={() => setEditingEvent(event)}
                      title={event.summary}
                    >
                      <div className="font-medium truncate">{event.summary}</div>
                      <div className="text-xs opacity-75">
                        {formatTime(event.start.dateTime)}
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className={`text-xs text-center ${themeClasses.secondaryText}`}>
                      +{events.length - 3} mehr
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // List View Component
  const ListView = () => {
    const sortedEvents = [...calendarEvents].sort((a, b) => {
      const dateA = new Date(a.start.dateTime || a.start.date);
      const dateB = new Date(b.start.dateTime || b.start.date);
      return dateA - dateB;
    });

    return (
      <div className={`${themeClasses.containerBg} rounded-xl p-6 shadow-sm`}>
        <div className="space-y-3">
          {sortedEvents.map((event) => {
            const eventDate = new Date(event.start.dateTime || event.start.date);
            const today = isToday(eventDate);
            
            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg border ${
                  today 
                    ? `${themeClasses.todayBg} ${themeClasses.todayBorder}` 
                    : themeClasses.gridBorder
                } ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'} transition-colors cursor-pointer`}
                onClick={() => setEditingEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${themeClasses.primaryText}`}>{event.summary}</h3>
                    {event.description && (
                      <p className={`text-sm mt-1 ${themeClasses.secondaryText}`}>{event.description}</p>
                    )}
                    <div className={`flex items-center gap-4 mt-2 text-sm ${themeClasses.secondaryText}`}>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {eventDate.toLocaleDateString('de-DE')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatTime(event.start.dateTime)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(event.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <CalendarX size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {sortedEvents.length === 0 && (
            <div className={`text-center py-12 ${themeClasses.secondaryText}`}>
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p>Keine Events vorhanden</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {!isSignedIn ? (
        <div className={`${themeClasses.containerBg} rounded-xl p-8 text-center shadow-sm`}>
          <CalendarDays size={64} className={`mx-auto mb-4 ${themeClasses.secondaryText} opacity-50`} />
          <h3 className={`text-xl font-semibold mb-2 ${themeClasses.primaryText}`}>Google Calendar verbinden</h3>
          <p className={`mb-6 ${themeClasses.secondaryText}`}>
            Melde dich an, um deine Google Calendar Events zu sehen und zu verwalten
          </p>
          <button
            onClick={handleSignIn}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <LogIn size={20} />
            Mit Google anmelden
          </button>
        </div>
      ) : (
        <>
          {/* Header with actions */}
          <div className={`${themeClasses.containerBg} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <span className={`font-medium ${themeClasses.primaryText}`}>
                  Verbunden als {GoogleCalendarService.getUserEmail()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={loadEvents}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors flex items-center gap-2`}
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  Aktualisieren
                </button>
                
                <button
                  onClick={() => setShowEventModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <CalendarPlus size={16} />
                  Neues Event
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Abmelden
                </button>
              </div>
            </div>
            
            {status && (
              <div className={`mt-2 text-sm ${themeClasses.secondaryText}`}>{status}</div>
            )}
          </div>

          {/* Calendar View */}
          {isLoading ? (
            <div className={`${themeClasses.containerBg} rounded-xl p-12 text-center shadow-sm`}>
              <Loader2 size={48} className={`mx-auto mb-4 animate-spin ${themeClasses.secondaryText}`} />
              <p className={themeClasses.secondaryText}>Lade Events...</p>
            </div>
          ) : (
            viewMode === 'week' ? <WeekView /> : <ListView />
          )}
        </>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className={`fixed inset-0 ${themeClasses.modalOverlay} flex items-center justify-center z-50`}>
          <div className={`${themeClasses.modalBg} rounded-xl p-6 max-w-md w-full mx-4`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.primaryText}`}>
              Neues Event erstellen
            </h2>
            
            <div className="space-y-3">
              <input
                type="text"
                value={newEvent.summary}
                onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                placeholder="Titel"
                className={`w-full px-4 py-2 border rounded-lg ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="Beschreibung (optional)"
                className={`w-full px-4 py-2 border rounded-lg ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                rows="3"
              />
              
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                placeholder="Ort (optional)"
                className={`w-full px-4 py-2 border rounded-lg ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.isAllDay}
                  onChange={(e) => setNewEvent({...newEvent, isAllDay: e.target.checked})}
                  className="w-4 h-4"
                />
                <label htmlFor="allDay" className={`text-sm ${themeClasses.primaryText}`}>
                  Ganztägig
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs ${themeClasses.secondaryText}`}>Start</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  {!newEvent.isAllDay && (
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                      className={`w-full mt-2 px-4 py-2 border rounded-lg ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  )}
                </div>
                
                <div>
                  <label className={`text-xs ${themeClasses.secondaryText}`}>Ende</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  {!newEvent.isAllDay && (
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                      className={`w-full mt-2 px-4 py-2 border rounded-lg ${themeClasses.inputBg} ${themeClasses.inputText} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className={`px-4 py-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors`}
              >
                Abbrechen
              </button>
              <button
                onClick={createEvent}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {isLoading ? 'Erstelle...' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className={`fixed inset-0 ${themeClasses.modalOverlay} flex items-center justify-center z-50`}>
          <div className={`${themeClasses.modalBg} rounded-xl p-6 max-w-md w-full mx-4`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.primaryText}`}>Event Details</h2>
            
            <div className="space-y-3">
              <div>
                <h3 className={`font-semibold ${themeClasses.primaryText}`}>{editingEvent.summary}</h3>
                {editingEvent.description && (
                  <p className={`mt-2 ${themeClasses.secondaryText}`}>{editingEvent.description}</p>
                )}
              </div>
              
              <div className={`space-y-2 text-sm ${themeClasses.secondaryText}`}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>
                    {new Date(editingEvent.start.dateTime || editingEvent.start.date).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>
                    {formatTime(editingEvent.start.dateTime)} - {formatTime(editingEvent.end.dateTime)}
                  </span>
                </div>
                
                {editingEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{editingEvent.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  deleteEvent(editingEvent.id);
                  setEditingEvent(null);
                }}
                className="px-4 py-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
              >
                Löschen
              </button>
              
              <button
                onClick={() => setEditingEvent(null)}
                className={`px-4 py-2 rounded-lg ${themeClasses.buttonBg} ${themeClasses.buttonText} transition-colors`}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
