// CalendarView.jsx - Separate component for Google Calendar integration
import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, LogIn, LogOut, RefreshCw, CalendarPlus, 
  CalendarX, Edit2, Clock, MapPin, Loader2, CheckCircle
} from 'lucide-react';
import GoogleCalendarService from './GoogleCalendarService';

function CalendarView({ tasks, taskDescriptions, onCreateEventFromTask }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [status, setStatus] = useState('');
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

  // Initialize Google Calendar Service
  useEffect(() => {
    GoogleCalendarService.init()
      .then(() => {
        console.log('Google Calendar Service initialized');
        // Check if already signed in
        if (GoogleCalendarService.isSignedIn()) {
          setIsSignedIn(true);
          loadEvents();
        }
      })
      .catch(error => {
        console.error('Failed to initialize Google Calendar:', error);
        setStatus('⚠️ Google Calendar konnte nicht geladen werden. Bitte API Key prüfen.');
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

  // Sign out from Google
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
      const formattedEvents = events.map(e => GoogleCalendarService.formatEvent(e));
      setCalendarEvents(formattedEvents);
      setStatus(`✅ ${events.length} Termine geladen`);
    } catch (error) {
      console.error('Failed to load events:', error);
      setStatus('❌ Termine konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  // Create or update event
  const handleSaveEvent = async () => {
    if (!newEvent.summary || !newEvent.startDate) {
      setStatus('❌ Titel und Datum sind erforderlich');
      return;
    }

    setIsLoading(true);
    try {
      const eventData = {
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
      };

      if (newEvent.isAllDay) {
        eventData.startDate = newEvent.startDate;
        eventData.endDate = newEvent.endDate || newEvent.startDate;
      } else {
        eventData.startDateTime = `${newEvent.startDate}T${newEvent.startTime || '09:00'}:00`;
        eventData.endDateTime = `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || '10:00'}:00`;
      }

      let result;
      if (editingEvent) {
        result = await GoogleCalendarService.updateEvent(editingEvent.id, eventData);
        setStatus('✅ Termin aktualisiert!');
      } else {
        result = await GoogleCalendarService.createEvent(eventData);
        setStatus('✅ Termin erstellt!');
      }

      await loadEvents();
      closeEventModal();
    } catch (error) {
      console.error('Failed to save event:', error);
      setStatus('❌ Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Termin wirklich löschen?')) return;

    setIsLoading(true);
    try {
      await GoogleCalendarService.deleteEvent(eventId);
      setStatus('✅ Termin gelöscht');
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      setStatus('❌ Fehler beim Löschen');
    } finally {
      setIsLoading(false);
    }
  };

  // Create event from task
  const createEventFromTask = (task) => {
    const eventData = GoogleCalendarService.taskToEvent(task, taskDescriptions[task.id]);
    
    setNewEvent({
      summary: eventData.summary,
      description: eventData.description,
      startDate: eventData.startDateTime.split('T')[0],
      startTime: eventData.startDateTime.split('T')[1].slice(0, 5),
      endDate: eventData.endDateTime.split('T')[0],
      endTime: eventData.endDateTime.split('T')[1].slice(0, 5),
      location: '',
      isAllDay: false
    });
    setShowEventModal(true);
  };

  // Quick add using natural language
  const handleQuickAdd = async () => {
    const text = prompt('Termin in natürlicher Sprache eingeben:\n\nBeispiel: "Meeting morgen um 14 Uhr"');
    if (!text) return;

    setIsLoading(true);
    try {
      await GoogleCalendarService.quickAdd(text);
      setStatus('✅ Termin erstellt!');
      await loadEvents();
    } catch (error) {
      console.error('Quick add failed:', error);
      setStatus('❌ Fehler beim Erstellen');
    } finally {
      setIsLoading(false);
    }
  };

  // Close event modal
  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
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
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Google Kalender</h1>
        
        <div className="flex gap-3">
          {isSignedIn ? (
            <>
              <button
                onClick={loadEvents}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                Aktualisieren
              </button>
              
              <button
                onClick={handleQuickAdd}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Quick Add
              </button>
              
              <button
                onClick={() => setShowEventModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <CalendarPlus size={20} />
                Neuer Termin
              </button>
              
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut size={20} />
                Abmelden
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <LogIn size={20} />
              Mit Google anmelden
            </button>
          )}
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
          {status}
        </div>
      )}

      {!isSignedIn ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <CalendarDays className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Google Kalender verbinden</h2>
            <p className="text-gray-600 mb-6">
              Melde dich mit deinem Google-Konto an, um:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={16} />
                <span>Termine direkt in FlowLife erstellen</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={16} />
                <span>Bestehende Termine anzeigen und bearbeiten</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={16} />
                <span>Tasks automatisch in Termine umwandeln</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5" size={16} />
                <span>Echtzeit-Synchronisation mit Google Kalender</span>
              </li>
            </ul>
            
            <button
              onClick={handleSignIn}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <LogIn size={20} />
              Mit Google anmelden
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Events List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Deine Termine ({calendarEvents.length})
              </h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin mx-auto text-gray-400" size={32} />
                <p className="text-gray-500 mt-2">Termine werden geladen...</p>
              </div>
            ) : calendarEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Keine anstehenden Termine
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {calendarEvents.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {event.startStr}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setNewEvent({
                              summary: event.title,
                              description: event.description || '',
                              startDate: event.start.toISOString().split('T')[0],
                              startTime: event.isAllDay ? '' : event.start.toTimeString().slice(0, 5),
                              endDate: event.end.toISOString().split('T')[0],
                              endTime: event.isAllDay ? '' : event.end.toTimeString().slice(0, 5),
                              location: event.location || '',
                              isAllDay: event.isAllDay
                            });
                            setShowEventModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <CalendarX size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks to Events */}
          {tasks.filter(t => t.deadline).length > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">
                📅 Tasks mit Deadline → Termin erstellen
              </h3>
              <div className="space-y-2">
                {tasks.filter(t => t.deadline).slice(0, 5).map(task => (
                  <button
                    key={task.id}
                    onClick={() => createEventFromTask(task)}
                    className="w-full text-left p-2 bg-white hover:bg-purple-100 rounded-lg transition-colors flex justify-between items-center"
                  >
                    <span className="text-sm">{task.title}</span>
                    <CalendarPlus size={14} className="text-purple-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}
            </h2>
            
            <div className="space-y-3">
              <input
                type="text"
                value={newEvent.summary}
                onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                placeholder="Titel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="Beschreibung (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
              />
              
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                placeholder="Ort (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.isAllDay}
                  onChange={(e) => setNewEvent({...newEvent, isAllDay: e.target.checked})}
                />
                <label htmlFor="allDay" className="text-sm text-gray-700">Ganztägig</label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Start</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {!newEvent.isAllDay && (
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
                
                <div>
                  <label className="text-xs text-gray-600">Ende</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {!newEvent.isAllDay && (
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEvent}
                disabled={!newEvent.summary || !newEvent.startDate || isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Speichern...' : (editingEvent ? 'Aktualisieren' : 'Erstellen')}
              </button>
              
              <button
                onClick={closeEventModal}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;