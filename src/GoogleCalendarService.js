// GoogleCalendarService.js - Service for Google Calendar integration
/* global gapi */

const CLIENT_ID = '96804046179-c7804cq1fpai9aabojrtehednvkimjjg.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAziHw8mh3xUamDMrbdrvOs6QZz1aOPqQE';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

class GoogleCalendarService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.gapiInitialized = false;
    this.gisInitialized = false;
    
    // Load saved session on initialization
    this.loadSavedSession();
  }

  // Load saved session from localStorage
  loadSavedSession() {
    try {
      const savedToken = localStorage.getItem('flowlife_google_token');
      const tokenExpiry = localStorage.getItem('flowlife_token_expiry');
      
      if (savedToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        if (Date.now() < expiryTime) {
          this.accessToken = savedToken;
          console.log('Restored saved Google session');
        } else {
          // Token expired, clear it
          this.clearSavedSession();
        }
      }
    } catch (error) {
      console.error('Error loading saved session:', error);
    }
  }

  // Save session to localStorage
  saveSession(token) {
    try {
      // Google tokens typically expire after 1 hour
      const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
      localStorage.setItem('flowlife_google_token', token);
      localStorage.setItem('flowlife_token_expiry', expiryTime.toString());
      console.log('Google session saved');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Clear saved session
  clearSavedSession() {
    try {
      localStorage.removeItem('flowlife_google_token');
      localStorage.removeItem('flowlife_token_expiry');
      console.log('Cleared saved Google session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Initialize the Google API client
  async init() {
    return new Promise((resolve, reject) => {
      // Check if already initialized and has valid token
      if (this.gapiInitialized && this.gisInitialized && this.accessToken) {
        // Set the token in gapi
        gapi.client.setToken({ access_token: this.accessToken });
        resolve();
        return;
      }

      // Load the Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = async () => {
        try {
          await this.initializeGapi();
          await this.initializeGis();
          
          // If we have a saved token, set it
          if (this.accessToken) {
            gapi.client.setToken({ access_token: this.accessToken });
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));

      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (!existingScript) {
        document.body.appendChild(script);
      } else {
        // Script already loaded, initialize directly
        this.initializeGapi()
          .then(() => this.initializeGis())
          .then(() => {
            if (this.accessToken) {
              gapi.client.setToken({ access_token: this.accessToken });
            }
            resolve();
          })
          .catch(reject);
      }

      // Load Google Identity Services
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      
      const existingGisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (!existingGisScript) {
        document.body.appendChild(gisScript);
      }
    });
  }

  // Initialize GAPI
  async initializeGapi() {
    return new Promise((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          this.gapiInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Initialize Google Identity Services
  async initializeGis() {
    return new Promise((resolve) => {
      const checkGis = () => {
        if (window.google && window.google.accounts) {
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
              if (response.error) {
                console.error('Token error:', response);
                return;
              }
              this.accessToken = response.access_token;
              this.saveSession(response.access_token); // Save the session
              console.log('Authentication successful');
            },
          });
          this.gisInitialized = true;
          resolve();
        } else {
          setTimeout(checkGis, 100);
        }
      };
      checkGis();
    });
  }

  // Sign in with Google
  async signIn() {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      // Check if we already have a valid token
      if (this.accessToken && gapi.client.getToken()) {
        resolve();
        return;
      }

      // Set up the callback for this specific request
      const originalCallback = this.tokenClient.callback;
      this.tokenClient.callback = (response) => {
        if (response.error) {
          reject(response.error);
          return;
        }
        this.accessToken = response.access_token;
        this.saveSession(response.access_token); // Save the session
        gapi.client.setToken({ access_token: this.accessToken });
        
        // Restore original callback
        this.tokenClient.callback = originalCallback;
        resolve();
      };

      // Request access token
      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  // Sign out
  signOut() {
    const token = gapi.client.getToken();
    if (token) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
    }
    this.accessToken = null;
    this.clearSavedSession(); // Clear saved session
  }

  // Check if user is signed in
  isSignedIn() {
    // Check both memory and localStorage
    if (this.accessToken && gapi.client.getToken()) {
      return true;
    }
    
    // Try to restore from localStorage
    this.loadSavedSession();
    if (this.accessToken) {
      // Set the token in gapi if we found one
      gapi.client.setToken({ access_token: this.accessToken });
      return true;
    }
    
    return false;
  }

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
      console.error('Error fetching events:', error);
      
      // If auth error, try to re-authenticate
      if (error.status === 401) {
        this.clearSavedSession();
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw error;
    }
  }

  // Create a new calendar event
  async createEvent(eventData) {
    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: eventData,
      });

      return response.result;
    } catch (error) {
      console.error('Error creating event:', error);
      
      // If auth error, try to re-authenticate
      if (error.status === 401) {
        this.clearSavedSession();
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw error;
    }
  }

  // Update an existing event
  async updateEvent(eventId, eventData) {
    try {
      const response = await gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: eventData,
      });

      return response.result;
    } catch (error) {
      console.error('Error updating event:', error);
      
      // If auth error, try to re-authenticate
      if (error.status === 401) {
        this.clearSavedSession();
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw error;
    }
  }

  // Delete an event
  async deleteEvent(eventId) {
    try {
      await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      
      // If auth error, try to re-authenticate
      if (error.status === 401) {
        this.clearSavedSession();
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw error;
    }
  }

  // Get a single event
  async getEvent(eventId) {
    try {
      const response = await gapi.client.calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      return response.result;
    } catch (error) {
      console.error('Error fetching event:', error);
      
      // If auth error, try to re-authenticate
      if (error.status === 401) {
        this.clearSavedSession();
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw error;
    }
  }
}

// Export a singleton instance
const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
