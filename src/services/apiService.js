// Centralized API service for consistent error handling and retries
import { supabase } from '../supabaseClient';

class ApiService {
  constructor() {
    this.defaultTimeout = 10000; // 10 seconds
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Generic retry mechanism
  async withRetry(operation, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on auth errors or client errors
        if (error.message?.includes('401') || error.message?.includes('403') || 
            error.message?.includes('Invalid') || error.name === 'AbortError') {
          throw error;
        }
        
        if (attempt < maxRetries) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }
      }
    }
    
    throw lastError;
  }

  // Generic timeout wrapper
  async withTimeout(operation, timeout = this.defaultTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await operation(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  }

  // Generic Supabase query wrapper
  async executeQuery(queryBuilder, options = {}) {
    const { timeout = this.defaultTimeout, retries = this.maxRetries } = options;
    
    return this.withRetry(async () => {
      return this.withTimeout(async (signal) => {
        const query = queryBuilder();
        if (signal) {
          query.abortSignal(signal);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data;
      }, timeout);
    }, retries);
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if error is retryable
  isRetryableError(error) {
    const retryableMessages = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'unavailable'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  // Format error for user display
  formatError(error) {
    if (typeof error === 'string') return error;
    
    // Handle specific Supabase errors
    if (error.code === 'PGRST116') {
      return 'Record not found';
    }
    
    if (error.code?.startsWith('23')) {
      return 'A database constraint was violated. Please check your input.';
    }
    
    // Handle network errors
    if (error.name === 'AbortError') {
      return 'Request timed out. Please try again.';
    }
    
    // Default to error message or generic message
    return error.message || 'An unexpected error occurred. Please try again.';
  }
}

export const apiService = new ApiService();