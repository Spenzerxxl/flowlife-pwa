// CalendarView.jsx - Mit Kalender-Wochenansicht und Listen-Toggle
import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, LogIn, LogOut, RefreshCw, CalendarPlus, 
  CalendarX, Edit2, Clock, MapPin, Loader2, CheckCircle,
  Calendar, List, ChevronLeft, ChevronRight, Grid3x3
} from 'lucide-react';
import GoogleCalendarService from './GoogleCalendarService';

function CalendarView({ tasks, taskDescriptions, onCreateEventFromTask }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week', 'list'
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
      setStatus(`✅ ${events.length} Termine geladen`);
    } catch (error) {
      console.error('Failed to load events:', error);
      setStatus('❌ Fehler beim Laden der Termine');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Get week dates
  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Helper: Format date for display
  const formatDateShort = (date) => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  // Helper: Get events for specific date
  const getEventsForDate = (date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Format time for event display
  const formatEventTime = (event) => {
    if (!event.start.dateTime) return 'Ganztägig';
    const date = new Date(event.start.dateTime);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Week View Component
  const WeekView = () => {
    const weekDates = getWeekDates(currentWeek);
    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const today = new Date().toDateString();
    
    return (
      <div className="week-view">
        {/* Navigation */}
        <div className="week-navigation">
          <button onClick={goToPreviousWeek} className="nav-btn">
            <ChevronLeft size={20} />
          </button>
          <button onClick={goToToday} className="today-btn">
            Heute
          </button>
          <span className="week-label">
            {formatDateShort(weekDates[0])} - {formatDateShort(weekDates[6])}
          </span>
          <button onClick={goToNextWeek} className="nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Header */}
          <div className="calendar-header">
            {weekDates.map((date, index) => (
              <div 
                key={index} 
                className={`day-header ${date.toDateString() === today ? 'today' : ''}`}
              >
                <div className="day-name">{weekDays[index]}</div>
                <div className="day-date">{date.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Events Grid */}
          <div className="calendar-body">
            {weekDates.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              return (
                <div 
                  key={index} 
                  className={`day-column ${date.toDateString() === today ? 'today-column' : ''}`}
                >
                  {dayEvents.length === 0 ? (
                    <div className="no-events">-</div>
                  ) : (
                    dayEvents.map((event, eventIndex) => (
                      <div 
                        key={eventIndex} 
                        className="event-card"
                        onClick={() => handleEditEvent(event)}
                      >
                        <div className="event-time">{formatEventTime(event)}</div>
                        <div className="event-title">{event.summary}</div>
                        {event.location && (
                          <div className="event-location">
                            <MapPin size={12} /> {event.location}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // List View Component (simplified)
  const ListView = () => {
    return (
      <div className="events-list">
        {calendarEvents.length === 0 ? (
          <p className="no-events-message">Keine Termine vorhanden</p>
        ) : (
          calendarEvents.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-header">
                <h4>{event.summary}</h4>
                <div className="event-actions">
                  <button onClick={() => handleEditEvent(event)} className="edit-btn">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteEvent(event.id)} className="delete-btn">
                    <CalendarX size={16} />
                  </button>
                </div>
              </div>
              <div className="event-details">
                <span className="event-date">
                  <Clock size={14} />
                  {new Date(event.start.dateTime || event.start.date).toLocaleString('de-DE')}
                </span>
                {event.location && (
                  <span className="event-location">
                    <MapPin size={14} />
                    {event.location}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="event-description">{event.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  // Create new event
  const handleCreateEvent = async () => {
    try {
      const eventData = {
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
        start: newEvent.isAllDay 
          ? { date: newEvent.startDate }
          : { dateTime: `${newEvent.startDate}T${newEvent.startTime}:00` },
        end: newEvent.isAllDay
          ? { date: newEvent.endDate || newEvent.startDate }
          : { dateTime: `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || newEvent.startTime}:00` }
      };

      await GoogleCalendarService.createEvent(eventData);
      setStatus('✅ Termin erstellt!');
      loadEvents();
      setShowEventModal(false);
      resetEventForm();
    } catch (error) {
      console.error('Failed to create event:', error);
      setStatus('❌ Fehler beim Erstellen des Termins');
    }
  };

  // Edit event
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      summary: event.summary,
      description: event.description || '',
      location: event.location || '',
      startDate: event.start.dateTime ? event.start.dateTime.split('T')[0] : event.start.date,
      startTime: event.start.dateTime ? event.start.dateTime.split('T')[1].slice(0, 5) : '',
      endDate: event.end.dateTime ? event.end.dateTime.split('T')[0] : event.end.date,
      endTime: event.end.dateTime ? event.end.dateTime.split('T')[1].slice(0, 5) : '',
      isAllDay: !event.start.dateTime
    });
    setShowEventModal(true);
  };

  // Update event
  const handleUpdateEvent = async () => {
    try {
      const eventData = {
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
        start: newEvent.isAllDay 
          ? { date: newEvent.startDate }
          : { dateTime: `${newEvent.startDate}T${newEvent.startTime}:00` },
        end: newEvent.isAllDay
          ? { date: newEvent.endDate || newEvent.startDate }
          : { dateTime: `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || newEvent.startTime}:00` }
      };

      await GoogleCalendarService.updateEvent(editingEvent.id, eventData);
      setStatus('✅ Termin aktualisiert!');
      loadEvents();
      setShowEventModal(false);
      setEditingEvent(null);
      resetEventForm();
    } catch (error) {
      console.error('Failed to update event:', error);
      setStatus('❌ Fehler beim Aktualisieren');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Termin wirklich löschen?')) {
      try {
        await GoogleCalendarService.deleteEvent(eventId);
        setStatus('✅ Termin gelöscht');
        loadEvents();
      } catch (error) {
        console.error('Failed to delete event:', error);
        setStatus('❌ Fehler beim Löschen');
      }
    }
  };

  // Reset form
  const resetEventForm = () => {
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
    <div className="calendar-container">
      {/* Header with controls */}
      <div className="calendar-header-bar">
        <div className="header-left">
          <h3>
            <CalendarDays className="inline-icon" />
            Google Kalender
          </h3>
          {status && <span className="status-message">{status}</span>}
        </div>

        <div className="header-controls">
          {/* View Toggle */}
          {isSignedIn && (
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
                title="Wochenansicht"
              >
                <Grid3x3 size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Listenansicht"
              >
                <List size={18} />
              </button>
            </div>
          )}

          {/* Action buttons */}
          {!isSignedIn ? (
            <button onClick={handleSignIn} className="sign-in-btn">
              <LogIn size={18} />
              Mit Google anmelden
            </button>
          ) : (
            <>
              <button onClick={loadEvents} className="refresh-btn" disabled={isLoading}>
                <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
                Aktualisieren
              </button>
              <button onClick={() => setShowEventModal(true)} className="add-event-btn">
                <CalendarPlus size={18} />
                Neuer Termin
              </button>
              <button onClick={handleSignOut} className="sign-out-btn">
                <LogOut size={18} />
                Abmelden
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      {isSignedIn && (
        <div className="calendar-content">
          {isLoading ? (
            <div className="loading-state">
              <Loader2 className="spinning" size={32} />
              <p>Termine werden geladen...</p>
            </div>
          ) : (
            viewMode === 'week' ? <WeekView /> : <ListView />
          )}
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}</h3>
            
            <div className="form-group">
              <label>Titel *</label>
              <input
                type="text"
                value={newEvent.summary}
                onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                placeholder="z.B. Meeting mit Team"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={newEvent.isAllDay}
                  onChange={(e) => setNewEvent({...newEvent, isAllDay: e.target.checked})}
                />
                Ganztägig
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Startdatum *</label>
                <input
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                />
              </div>
              {!newEvent.isAllDay && (
                <div className="form-group">
                  <label>Startzeit *</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Enddatum</label>
                <input
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                />
              </div>
              {!newEvent.isAllDay && (
                <div className="form-group">
                  <label>Endzeit</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Ort</label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                placeholder="z.B. Büro, Online, etc."
              />
            </div>

            <div className="form-group">
              <label>Beschreibung</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows="3"
                placeholder="Zusätzliche Informationen..."
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => {
                setShowEventModal(false);
                setEditingEvent(null);
                resetEventForm();
              }} className="cancel-btn">
                Abbrechen
              </button>
              <button 
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                className="save-btn"
                disabled={!newEvent.summary || !newEvent.startDate}
              >
                {editingEvent ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          padding: 20px;
          background: #1a1a1a;
          border-radius: 8px;
          min-height: 500px;
        }

        .calendar-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #333;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .header-left h3 {
          margin: 0;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .inline-icon {
          display: inline-block;
        }

        .status-message {
          color: #888;
          font-size: 14px;
        }

        .header-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        /* View Toggle */
        .view-toggle {
          display: flex;
          background: #2a2a2a;
          border-radius: 6px;
          padding: 2px;
          margin-right: 10px;
        }

        .view-btn {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .view-btn.active {
          background: #4CAF50;
          color: white;
        }

        .view-btn:hover:not(.active) {
          background: #333;
          color: #fff;
        }

        /* Week View Styles */
        .week-view {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
        }

        .week-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .nav-btn {
          padding: 6px 10px;
          background: #333;
          border: none;
          color: #fff;
          border-radius: 4px;
          cursor: pointer;
        }

        .nav-btn:hover {
          background: #444;
        }

        .today-btn {
          padding: 6px 16px;
          background: #4CAF50;
          border: none;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .today-btn:hover {
          background: #45a049;
        }

        .week-label {
          color: #fff;
          font-weight: 500;
          min-width: 150px;
          text-align: center;
        }

        .calendar-grid {
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #333;
        }

        .day-header {
          padding: 12px 8px;
          text-align: center;
          border-right: 1px solid #444;
        }

        .day-header:last-child {
          border-right: none;
        }

        .day-header.today {
          background: #4CAF50;
        }

        .day-name {
          color: #aaa;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .day-header.today .day-name {
          color: #fff;
        }

        .day-date {
          color: #fff;
          font-size: 16px;
          font-weight: 500;
        }

        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          min-height: 400px;
        }

        .day-column {
          border-right: 1px solid #333;
          padding: 8px;
          background: #1a1a1a;
          min-height: 100px;
        }

        .day-column:last-child {
          border-right: none;
        }

        .today-column {
          background: rgba(76, 175, 80, 0.1);
        }

        .no-events {
          color: #555;
          text-align: center;
          padding: 10px;
        }

        .event-card {
          background: #333;
          border-left: 3px solid #4CAF50;
          padding: 6px;
          margin-bottom: 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .event-card:hover {
          background: #3a3a3a;
        }

        .event-time {
          color: #4CAF50;
          font-size: 11px;
          font-weight: 500;
        }

        .event-title {
          color: #fff;
          font-size: 13px;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-card .event-location {
          color: #888;
          font-size: 11px;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        /* List View Styles (existing) */
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-item {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid #4CAF50;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .event-header h4 {
          margin: 0;
          color: #fff;
        }

        .event-actions {
          display: flex;
          gap: 8px;
        }

        .edit-btn, .delete-btn {
          padding: 6px;
          background: #333;
          border: none;
          color: #fff;
          border-radius: 4px;
          cursor: pointer;
        }

        .edit-btn:hover {
          background: #4CAF50;
        }

        .delete-btn:hover {
          background: #f44336;
        }

        .event-details {
          display: flex;
          gap: 20px;
          color: #888;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .event-date, .event-location {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .event-description {
          color: #aaa;
          font-size: 14px;
          margin: 8px 0 0 0;
        }

        /* Loading state */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #888;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 25px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin: 0 0 20px 0;
          color: #fff;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          color: #aaa;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .form-group input[type="text"],
        .form-group input[type="date"],
        .form-group input[type="time"],
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 4px;
          color: #fff;
        }

        .form-group input[type="checkbox"] {
          margin-right: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .cancel-btn, .save-btn {
          padding: 8px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .cancel-btn {
          background: #333;
          color: #fff;
        }

        .cancel-btn:hover {
          background: #444;
        }

        .save-btn {
          background: #4CAF50;
          color: white;
        }

        .save-btn:hover {
          background: #45a049;
        }

        .save-btn:disabled {
          background: #555;
          cursor: not-allowed;
        }

        /* Button styles */
        .sign-in-btn, .refresh-btn, .add-event-btn, .sign-out-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .sign-in-btn {
          background: #4285f4;
          color: white;
        }

        .sign-in-btn:hover {
          background: #357ae8;
        }

        .refresh-btn {
          background: #333;
          color: #fff;
        }

        .refresh-btn:hover {
          background: #444;
        }

        .add-event-btn {
          background: #4CAF50;
          color: white;
        }

        .add-event-btn:hover {
          background: #45a049;
        }

        .sign-out-btn {
          background: #333;
          color: #fff;
        }

        .sign-out-btn:hover {
          background: #f44336;
        }

        .no-events-message {
          text-align: center;
          color: #888;
          padding: 40px;
        }
      `}</style>
    </div>
  );
}

export default CalendarView;
