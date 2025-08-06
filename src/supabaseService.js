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

  // Sign out
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
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database structure to app structure
      return data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category || 'Allgemein',
        deadline: task.deadline,
        completed: task.status === 'completed',
        progress: task.progress || 0,
        googleEventId: task.google_event_id,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      console.error('Get tasks error:', error);
      return [];
    }
  },

  // Create new task
  async createTask(taskData) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: taskData.title,
          description: taskData.description || null,
          category: taskData.category || 'Allgemein',
          deadline: taskData.deadline || null,
          status: 'open',
          progress: 0,
          google_event_id: taskData.googleEventId || null,
          voice_created: taskData.voiceCreated || false
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data: {
          id: data.id,
          title: data.title,
          description: data.description || '',
          category: data.category,
          deadline: data.deadline,
          completed: false,
          progress: data.progress,
          googleEventId: data.google_event_id
        }
      };
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update task
  async updateTask(taskId, updates) {
    try {
      const updateData = {};
      
      // Map app fields to database fields
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.googleEventId !== undefined) updateData.google_event_id = updates.googleEventId;
      
      // Handle completed status
      if (updates.completed !== undefined) {
        updateData.status = updates.completed ? 'completed' : 'open';
        if (updates.completed) {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Update task error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete task
  async deleteTask(taskId) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Delete task error:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to real-time changes
  subscribeToChanges(callback) {
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        (payload) => {
          console.log('Task change:', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  },

  // Unsubscribe from real-time changes
  unsubscribeFromChanges(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
};

// Export supabase client for direct access if needed
export { supabase };

export default {
  auth: authService,
  tasks: tasksService,
  supabase
};
