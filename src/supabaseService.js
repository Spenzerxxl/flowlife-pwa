// supabaseService.js
// FlowLife Supabase Integration Service

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://database.frankrath.de';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0NzA3MzU4MCwiZXhwIjo0OTAyNzQ3MTgwLCJyb2xlIjoiYW5vbiJ9.0l5w0smQh1FDN-nGnfmNbX80smyL-XcQM9C69OwE3Vo';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication Service
export const authService = {
  // Sign up new user
  async signUp(email, password, fullName = '') {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out current user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

// Tasks Service
export const tasksService = {
  // Get all tasks for current user
  async getTasks() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Get tasks error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Create new task
  async createTask(taskData) {
    try {
      console.log('[DEBUG] createTask called with:', taskData);
      
      const user = await authService.getCurrentUser();
      console.log('[DEBUG] Current user:', user);
      
      if (!user) {
        console.error('[DEBUG] No user authenticated!');
        throw new Error('User not authenticated');
      }

      // Prepare metadata object for additional data
      const metadata = {};
      if (taskData.googleEventId) {
        metadata.google_event_id = taskData.googleEventId;
      }

      const insertData = {
        user_id: user.id,
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category || 'Allgemein',
        deadline: taskData.deadline || null,
        status: 'open',
        progress: 0,
        voice_created: taskData.voiceCreated || false,
        metadata: Object.keys(metadata).length > 0 ? metadata : {}
      };
      
      console.log('[DEBUG] Insert data:', insertData);

      const { data, error } = await supabase
        .from('tasks')
        .insert([insertData])
        .select()
        .single();
      
      console.log('[DEBUG] Supabase response:', { data, error });
      
      if (error) {
        console.error('[DEBUG] Supabase error details:', error);
        throw error;
      }
      
      console.log('[DEBUG] Task created successfully:', data);
      
      return {
        success: true,
        data: {
          id: data.id,
          title: data.title,
          description: data.description || '',
          category: data.category,
          deadline: data.deadline,
          status: data.status,
          progress: data.progress,
          googleEventId: data.metadata?.google_event_id || null,
          voiceCreated: data.voice_created
        }
      };
    } catch (error) {
      console.error('[DEBUG] createTask error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update task
  async updateTask(taskId, updates) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Handle googleEventId if present in updates
      if (updates.googleEventId !== undefined) {
        const currentTask = await supabase
          .from('tasks')
          .select('metadata')
          .eq('id', taskId)
          .single();
        
        const metadata = currentTask.data?.metadata || {};
        if (updates.googleEventId) {
          metadata.google_event_id = updates.googleEventId;
        } else {
          delete metadata.google_event_id;
        }
        updates.metadata = metadata;
        delete updates.googleEventId;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data: {
          ...data,
          googleEventId: data.metadata?.google_event_id || null
        }
      };
    } catch (error) {
      console.error('Update task error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete task
  async deleteTask(taskId) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Delete task error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Subscribe to task changes
  subscribeToChanges(userId, callback) {
    const subscription = supabase
      .channel(`tasks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Task change detected:', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  },

  // Unsubscribe from changes
  unsubscribeFromChanges(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
};

// Export Supabase client for direct access if needed
export { supabase };

export default {
  authService,
  tasksService
};

// ===== SUBTASKS CRUD OPERATIONS =====
// Alle Subtasks einer Aufgabe abrufen
export const getSubtasksByTaskId = async (taskId) => {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data;
};

// Neue Subtask erstellen
export const createSubtask = async (subtaskData) => {
  const { data, error } = await supabase
    .from('subtasks')
    .insert([subtaskData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Subtask aktualisieren
export const updateSubtask = async (subtaskId, updates) => {
  const { data, error } = await supabase
    .from('subtasks')
    .update(updates)
    .eq('id', subtaskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Subtask löschen
export const deleteSubtask = async (subtaskId) => {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', subtaskId);

  if (error) throw error;
};

// Subtask-Status togglen
export const toggleSubtask = async (subtaskId, completed) => {
  const { data, error } = await supabase
    .from('subtasks')
    .update({ completed })
    .eq('id', subtaskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
