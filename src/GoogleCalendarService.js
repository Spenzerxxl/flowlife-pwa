// Google Calendar Integration Module for FlowLife
// This module handles all Google Calendar API interactions with Session Management

const GOOGLE_CLIENT_ID = '96804046179-c7804cq1fpai9aabojrtehednvkimjjg.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyAziHw8mh3xUamDMrbdrvOs6QZz1aOPqQE';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export const GoogleCalendarService = {
  gapiInited: false,
  gisInited: false,
  tokenClient: null,
  accessToken: null,
  userEmail: null,

  // Initialize Google API
  async init() {
    return new Promise((resolve, reject) => {
      // Check for existing session
      this.checkExistingSession();

      // Load GAPI script
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.async = true;
      script1.defer = true;
      script1.onload = () => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            });
            this.gapiInited = true;
            console.log('✅ Google API Client initialized');
            
            // Restore session if exists
            if (this.accessToken) {
              gapi.client.setToken({ access_token: this.accessToken });
            }
            
            this.checkIfReady();
            resolve();
          } catch (error) {
            console.error('❌ Error initializing GAPI client:', error);
            reject(error);
          }
        });
      };
      document.body.appendChild(script1);

      // Load GIS (Google Identity Services) script
      const script2 = document.createElement('script');
      script2.src = 'https://accounts.google.com/gsi/client';
      script2.async = true;
      script2.defer = true;
      script2.onload = () => {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.error !== undefined) {
              throw response;
            }
            this.handleAuthSuccess(response);
          },
        });
        this.gisInited = true;
        console.log('✅ Google Identity Services initialized');
        this.checkIfReady();
      };
      document.body.appendChild(script2);
    });
  },

  // Check for existing session in localStorage
  checkExistingSession() {
    const savedToken = localStorage.getItem('flowlife_google_token');
    const savedExpiry = localStorage.getItem('flowlife_token_expiry');
    const savedEmail = localStorage.getItem('flowlife_user_email');
    
    if (savedToken && savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      const now = Date.now();
      
      // Check if token is still valid (with 5 minute buffer)
      if (now < expiryTime - 300000) {
        this.accessToken = savedToken;
        this.userEmail = savedEmail || 'Google User';
        console.log('✅ Restored existing session');
      } else {
        // Clear expired session
        this.clearSession();
      }
    }
  },

  // Handle successful authentication
  handleAuthSuccess(response) {
    this.accessToken = response.access_token;
    
    // Save to localStorage (token expires in 1 hour)
    const expiryTime = Date.now() + 3600000; // 1 hour
    localStorage.setItem('flowlife_google_token', response.access_token);
    localStorage.setItem('flowlife_token_expiry', expiryTime.toString());
    
    // Set token for gapi client
    gapi.client.setToken({ access_token: response.access_token });
    
    // Try to get user info
    this.fetchUserInfo();
    
    console.log('✅ User authenticated successfully');
  },

  // Fetch user info from Google
  async fetchUserInfo() {
    try {
      // Try to get user profile
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.ok) {
        const userInfo = await response.json();
        this.userEmail = userInfo.email || 'Google User';
        localStorage.setItem('flowlife_user_email', this.userEmail);
        console.log('✅ User email:', this.userEmail);
      }
    } catch (error) {
      console.warn('Could not fetch user info:', error);
      // Fallback to test user if known
      this.userEmail = 'frank.rath@gmail.com';
      localStorage.setItem('flowlife_user_email', this.userEmail);
    }
  },

  // Clear session data
  clearSession() {
    localStorage.removeItem('flowlife_google_token');
    localStorage.removeItem('flowlife_token_expiry');
    localStorage.removeItem('flowlife_user_email');
    this.accessToken = null;
    this.userEmail = null;
  },

  checkIfReady() {
    if (this.gapiInited && this.gisInited) {
      console.log('✅ Google Calendar Service ready!');
    }
  },

  // Sign in user
  async signIn() {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      this.tokenClient.callback = (response) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }
        this.handleAuthSuccess(response);
        resolve(response);
      };

      // Request access token
      if (gapi.client.getToken() === null) {
        // Prompt for consent
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Skip consent
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  },

  // Sign out user
  signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
    }
    
    // Clear session
    this.clearSession();
    
    console.log('✅ User signed out');
  },

  // Check if user is signed in
  isSignedIn() {
    // Check both token and gapi client
    const hasToken = this.accessToken !== null;
    const hasGapiToken = gapi && gapi.client && gapi.client.getToken() !== null;
    
    return hasToken || hasGapiToken;
  },

  // Get user email
  getUserEmail() {
    return this.userEmail || 'Google User';
  },

  // List calendar events
  async listEvents(timeMin = new Date().toISOString(), maxResults = 50) {
    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        showDeleted: false,
        singleEvents: true,
        maxResults: maxResults,
        orderBy: 'startTime',
      });
      
      return response.result.items || [];
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  },

  // Create calendar event
  async createEvent(eventData) {
    try {
      // Construct the event object based on whether it's all-day or not
      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        location: eventData.location || '',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
        colorId: eventData.colorId || undefined,
      };

      // Set start and end based on the event data structure
      if (eventData.start && eventData.end) {
        // Direct start/end objects from CalendarView
        event.start = eventData.start;
        event.end = eventData.end;
      } else {
        // Legacy format
        event.start = {
          dateTime: eventData.startDateTime || undefined,
          date: eventData.startDate || undefined,
          timeZone: 'Europe/Berlin',
        };
        event.end = {
          dateTime: eventData.endDateTime || undefined,
          date: eventData.endDate || undefined,
          timeZone: 'Europe/Berlin',
        };
      }

      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      console.log('✅ Event created:', response.result);
      return response.result;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  },

  // Update calendar event
  async updateEvent(eventId, eventData) {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        location: eventData.location || '',
        start: {
          dateTime: eventData.startDateTime || undefined,
          date: eventData.startDate || undefined,
          timeZone: 'Europe/Berlin',
        },
        end: {
          dateTime: eventData.endDateTime || undefined,
          date: eventData.endDate || undefined,
          timeZone: 'Europe/Berlin',
        },
      };

      const response = await gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
      });

      console.log('✅ Event updated:', response.result);
      return response.result;
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  },

  // Delete calendar event
  async deleteEvent(eventId) {
    try {
      await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      
      console.log('✅ Event deleted');
      return true;
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  },

  // Get calendar colors (for UI)
  async getColors() {
    try {
      const response = await gapi.client.calendar.colors.get();
      return response.result;
    } catch (error) {
      console.error('❌ Error fetching colors:', error);
      throw error;
    }
  },

  // Quick add event (using natural language)
  async quickAdd(text) {
    try {
      const response = await gapi.client.calendar.events.quickAdd({
        calendarId: 'primary',
        text: text,
      });
      
      console.log('✅ Quick event created:', response.result);
      return response.result;
    } catch (error) {
      console.error('❌ Error with quick add:', error);
      throw error;
    }
  },

  // Helper: Convert task to calendar event
  taskToEvent(task, description = '') {
    const startDate = task.deadline || new Date().toISOString().split('T')[0];
    const startDateTime = `${startDate}T09:00:00`;
    const endDateTime = `${startDate}T10:00:00`;

    return {
      summary: task.title,
      description: description || `Task: ${task.title}\nKategorie: ${task.category}\nFortschritt: ${task.progress}%`,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      colorId: this.getCategoryColor(task.category),
    };
  },

  // Helper: Get color ID for category
  getCategoryColor(category) {
    const colorMap = {
      'familie': '5',     // Yellow
      'business': '9',    // Blue
      'loge': '6',        // Orange
      'umzug': '2',       // Green
      'personal': '3',    // Purple
      'sonstiges': '8',   // Gray
    };
    return colorMap[category] || '1';
  },

  // Helper: Format event for display
  formatEvent(event) {
    const start = new Date(event.start.dateTime || event.start.date);
    const end = new Date(event.end.dateTime || event.end.date);
    
    return {
      id: event.id,
      title: event.summary,
      description: event.description,
      location: event.location,
      start: start,
      end: end,
      startStr: start.toLocaleString('de-DE'),
      endStr: end.toLocaleString('de-DE'),
      isAllDay: !event.start.dateTime,
      htmlLink: event.htmlLink,
      colorId: event.colorId,
    };
  },
};

export default GoogleCalendarService;
