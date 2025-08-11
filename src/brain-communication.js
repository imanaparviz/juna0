/**
 * BRAIN COMMUNICATION MODULE
 * Handles all communication between Juna Frontend (Face) and Brain Backend
 * Implements the exact interface specification provided
 */

import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

export class BrainCommunication {
  constructor() {
    this.eventHandlers = new Map();
    this.currentTaskId = null;
    this.isInitialized = false;
    
    this.init();
  }

  async init() {
    try {
      await this.setupEventListeners();
      this.isInitialized = true;
      console.log("🧠 Brain Communication initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Brain Communication:", error);
      throw error;
    }
  }

  // ============================================================================
  // CORE COMMUNICATION METHODS
  // ============================================================================

  /**
   * Send a query to the Brain backend
   * @param {string} query - User's natural language input
   * @param {Object} config - Optional configuration
   * @returns {Promise<QueryResponse>}
   */
  async processQuery(query, config = null) {
    if (!query || typeof query !== 'string') {
      throw new Error("Query must be a non-empty string");
    }

    if (query.length > 10000) {
      throw new Error("Query exceeds maximum length of 10000 characters");
    }

    try {
      console.log("🔄 Sending query to Brain:", query);
      
      const response = await invoke("process_query", { 
        query: query.trim(),
        config: config || {
          context_collection: true,
          timeout_ms: 60000,
          verbose_mode: false
        }
      });

      console.log("✅ Received response from Brain:", response);
      return this.validateQueryResponse(response);
    } catch (error) {
      console.error("❌ Brain communication failed:", error);
      
      // Return structured error response
      return {
        success: false,
        response_type: "ERROR",
        message: `Communication failed: ${error.message}`,
        metadata: {
          route_taken: "error_handler",
          execution_time_ms: 0,
          steps_completed: 0,
          session_id: "unknown"
        }
      };
    }
  }

  /**
   * Reset the current session
   * @returns {Promise<void>}
   */
  async resetSession() {
    try {
      console.log("🔄 Resetting Brain session");
      await invoke("reset_session");
      console.log("✅ Brain session reset successfully");
      
      // Notify listeners about session reset
      this.emit('session_reset', { timestamp: Date.now() });
    } catch (error) {
      console.error("❌ Failed to reset Brain session:", error);
      throw new Error(`Session reset failed: ${error.message}`);
    }
  }

  /**
   * Get current session status
   * @returns {Promise<SessionStatus>}
   */
  async getSessionStatus() {
    try {
      console.log("🔄 Getting Brain session status");
      const status = await invoke("get_session_status");
      console.log("✅ Received session status:", status);
      return this.validateSessionStatus(status);
    } catch (error) {
      console.error("❌ Failed to get session status:", error);
      
      // Return default session status
      return {
        session_id: "unknown",
        created_at: Date.now(),
        message_count: 0,
        current_task: null,
        memory_size: 0,
        is_active: false
      };
    }
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /**
   * Setup event listeners for real-time updates
   */
  async setupEventListeners() {
    try {
      // Listen for progress updates
      await listen("progress_update", (event) => {
        console.log("📊 Received progress update:", event.payload);
        this.handleProgressUpdate(event.payload);
      });

      // Listen for error events
      await listen("brain_error", (event) => {
        console.log("❌ Received error event:", event.payload);
        this.handleErrorEvent(event.payload);
      });

      // Listen for session events
      await listen("session_event", (event) => {
        console.log("🔄 Received session event:", event.payload);
        this.handleSessionEvent(event.payload);
      });

      console.log("🎧 Brain event listeners setup successfully");
    } catch (error) {
      console.error("Failed to setup event listeners:", error);
      throw error;
    }
  }

  /**
   * Handle progress update events
   */
  handleProgressUpdate(update) {
    const validatedUpdate = this.validateProgressUpdate(update);
    this.emit('progress_update', validatedUpdate);
  }

  /**
   * Handle error events
   */
  handleErrorEvent(error) {
    const validatedError = this.validateErrorResponse(error);
    this.emit('brain_error', validatedError);
  }

  /**
   * Handle session events
   */
  handleSessionEvent(event) {
    this.emit('session_event', event);
  }

  /**
   * Register event handler
   */
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType).add(handler);
  }

  /**
   * Unregister event handler
   */
  off(eventType, handler) {
    if (this.eventHandlers.has(eventType)) {
      this.eventHandlers.get(eventType).delete(handler);
    }
  }

  /**
   * Emit event to all registered handlers
   */
  emit(eventType, data) {
    if (this.eventHandlers.has(eventType)) {
      this.eventHandlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Validate QueryResponse structure
   */
  validateQueryResponse(response) {
    const validTypes = ["SIMPLE", "COMPLEX", "DIRECT", "ERROR"];
    
    if (!response || typeof response !== 'object') {
      throw new Error("Invalid response structure");
    }

    return {
      success: response.success ?? false,
      response_type: validTypes.includes(response.response_type) ? response.response_type : "ERROR",
      message: response.message ?? "No message provided",
      metadata: {
        route_taken: response.metadata?.route_taken ?? "unknown",
        execution_time_ms: response.metadata?.execution_time_ms ?? 0,
        steps_completed: response.metadata?.steps_completed ?? 0,
        session_id: response.metadata?.session_id ?? "unknown"
      }
    };
  }

  /**
   * Validate ProgressUpdate structure
   */
  validateProgressUpdate(update) {
    const validTypes = ["CONTEXT_COLLECTION", "TASK_EXECUTION", "STEP_COMPLETE"];
    
    return {
      type: validTypes.includes(update.type) ? update.type : "TASK_EXECUTION",
      message: update.message ?? "Processing...",
      current_step: update.current_step ?? 1,
      total_steps: update.total_steps ?? null,
      timestamp: update.timestamp ?? Date.now()
    };
  }

  /**
   * Validate SessionStatus structure
   */
  validateSessionStatus(status) {
    return {
      session_id: status.session_id ?? "unknown",
      created_at: status.created_at ?? Date.now(),
      message_count: status.message_count ?? 0,
      current_task: status.current_task ?? null,
      memory_size: status.memory_size ?? 0,
      is_active: status.is_active ?? false
    };
  }

  /**
   * Validate ErrorResponse structure
   */
  validateErrorResponse(error) {
    return {
      error_code: error.error_code ?? "UNKNOWN_ERROR",
      message: error.message ?? "An unknown error occurred",
      details: error.details ?? null,
      recoverable: error.recoverable ?? false,
      timestamp: error.timestamp ?? Date.now()
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if Brain communication is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get current task ID
   */
  getCurrentTaskId() {
    return this.currentTaskId;
  }

  /**
   * Set current task ID (used for progress tracking)
   */
  setCurrentTaskId(taskId) {
    this.currentTaskId = taskId;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.eventHandlers.clear();
    this.currentTaskId = null;
    this.isInitialized = false;
    console.log("🧠 Brain Communication destroyed");
  }
}

// ============================================================================
// RESPONSE TYPE DEFINITIONS (for reference)
// ============================================================================

/**
 * @typedef {Object} QueryResponse
 * @property {boolean} success
 * @property {"SIMPLE"|"COMPLEX"|"DIRECT"|"ERROR"} response_type
 * @property {string} message
 * @property {ResponseMetadata} metadata
 */

/**
 * @typedef {Object} ResponseMetadata
 * @property {string} route_taken
 * @property {number} execution_time_ms
 * @property {number} steps_completed
 * @property {string} session_id
 */

/**
 * @typedef {Object} ProgressUpdate
 * @property {"CONTEXT_COLLECTION"|"TASK_EXECUTION"|"STEP_COMPLETE"} type
 * @property {string} message
 * @property {number} current_step
 * @property {number|null} total_steps
 * @property {number} timestamp
 */

/**
 * @typedef {Object} SessionStatus
 * @property {string} session_id
 * @property {number} created_at
 * @property {number} message_count
 * @property {string|null} current_task
 * @property {number} memory_size
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {string} error_code
 * @property {string} message
 * @property {string|null} details
 * @property {boolean} recoverable
 * @property {number} timestamp
 */
