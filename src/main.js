/**
 * JUNA - AI VOICE ASSISTANT INTERFACE
 * High-performance voice interface for AI agent interaction
 * Integrated with Brain backend for intelligent responses
 */

import { BrainCommunication } from './brain-communication.js';
import { MessageRenderer } from './message-renderer.js';

// ============================================================================
// GLOBAL STATE AND CONFIGURATION
// ============================================================================

class JunaVoiceInterface {
  constructor() {
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.timerInterval = null;
    this.currentAudioURL = null;
    this.currentAudioBlob = null;
    this.currentMode = "voice"; // 'voice' or 'chat'
    this.chatHistory = [];
    
    // Brain communication
    this.brain = null;
    this.messageRenderer = null;
    this.currentSession = null;
    this.isProcessingQuery = false;
    this.currentTaskId = null;

    // Performance optimization - cache DOM elements
    this.elements = {
      micButton: null,
      statusText: null,
      timer: null,
      soundWaves: null,
      playButton: null,
      saveButton: null,
      deleteButton: null,
      notification: null,
      voiceModeBtn: null,
      chatModeBtn: null,
      chatContainer: null,
      chatMessages: null,
      chatInput: null,
      sendMessageBtn: null,
      clearChatBtn: null,
      charCount: null,
      recordingInterface: null,
      voiceControls: null,
    };

    // Configuration
    this.config = {
      audioConstraints: {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2,
        },
      },
      recordingOptions: {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000,
      },
    };

    // Note: init() will be called asynchronously from the DOMContentLoaded event
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async init() {
    this.cacheDOMElements();
    this.bindEvents();
    
    // Initialize Brain communication
    await this.initializeBrainCommunication();
    
    this.updateUI();
    this.showNotification("Juna ready - Click to start talking!", "success");
  }

  cacheDOMElements() {
    // Voice interface elements
    this.elements.micButton = document.getElementById("mic-button");
    this.elements.statusText = document.getElementById("status-text");
    this.elements.timer = document.getElementById("timer");
    this.elements.soundWaves = document.querySelector(".sound-waves");
    this.elements.playButton = document.getElementById("play-button");
    this.elements.saveButton = document.getElementById("save-button");
    this.elements.deleteButton = document.getElementById("delete-button");
    this.elements.notification = document.getElementById("notification");
    this.elements.recordingInterface = document.querySelector(
      ".recording-interface"
    );
    this.elements.voiceControls = document.querySelector(".voice-controls");

    // Chat interface elements
    this.elements.voiceModeBtn = document.getElementById("voice-mode-btn");
    this.elements.chatModeBtn = document.getElementById("chat-mode-btn");
    this.elements.chatContainer = document.getElementById("chat-container");
    this.elements.chatMessages = document.getElementById("chat-messages");
    this.elements.chatInput = document.getElementById("chat-input");
    this.elements.sendMessageBtn = document.getElementById("send-message-btn");
    this.elements.clearChatBtn = document.getElementById("clear-chat-btn");
    this.elements.sessionResetBtn = document.getElementById("session-reset-btn");
    this.elements.charCount = document.getElementById("char-count");
    this.elements.sessionInfo = document.getElementById("session-info");
  }

  bindEvents() {
    // Main microphone button
    this.elements.micButton.addEventListener("click", () =>
      this.toggleRecording()
    );

    // Control buttons
    this.elements.playButton.addEventListener("click", () =>
      this.playRecording()
    );
    this.elements.saveButton.addEventListener("click", () =>
      this.saveRecording()
    );
    this.elements.deleteButton.addEventListener("click", () =>
      this.deleteRecording()
    );

    // Interface mode toggle
    this.elements.voiceModeBtn.addEventListener("click", () =>
      this.switchToVoiceMode()
    );
    this.elements.chatModeBtn.addEventListener("click", () =>
      this.switchToChatMode()
    );

    // Chat functionality
    this.elements.sendMessageBtn.addEventListener("click", () =>
      this.sendChatMessage()
    );
    this.elements.clearChatBtn.addEventListener("click", () =>
      this.clearChat()
    );
    this.elements.sessionResetBtn.addEventListener("click", () =>
      this.resetBrainSession()
    );
    this.elements.chatInput.addEventListener("input", (e) =>
      this.updateCharCount(e)
    );
    this.elements.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );

    // Prevent context menu on buttons for better UX
    this.elements.micButton.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    );
  }

  // ============================================================================
  // AUDIO UTILITIES
  // ============================================================================

  getSupportedMimeType() {
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/wav",
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return "audio/webm"; // Fallback
  }

  async requestMicrophoneAccess() {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia(
        this.config.audioConstraints
      );
      return true;
    } catch (error) {
      console.error("Microphone access denied:", error);
      this.showNotification(
        "Microphone access denied. Please grant permission.",
        "error"
      );
      return false;
    }
  }

  // ============================================================================
  // RECORDING FUNCTIONALITY
  // ============================================================================

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    const hasAccess = await this.requestMicrophoneAccess();
    if (!hasAccess) return;

    try {
      // Initialize MediaRecorder with optimized settings
      this.mediaRecorder = new MediaRecorder(
        this.audioStream,
        this.config.recordingOptions
      );
      this.audioChunks = [];

      // Event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.createAudioBlob();
        this.stopAudioStream();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms for better responsiveness
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // Start timer
      this.startTimer();

      // Update UI
      this.updateUI();
      this.showNotification("Listening to you...", "success");
    } catch (error) {
      console.error("Recording start failed:", error);
      this.showNotification("Could not start listening", "error");
      this.stopAudioStream();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    this.isRecording = false;
    this.stopTimer();
    this.updateUI();
    this.showNotification("Stopped listening", "success");
  }

  createAudioBlob() {
    this.currentAudioBlob = new Blob(this.audioChunks, {
      type: this.config.recordingOptions.mimeType,
    });

    // Create URL for playback
    if (this.currentAudioURL) {
      URL.revokeObjectURL(this.currentAudioURL);
    }
    this.currentAudioURL = URL.createObjectURL(this.currentAudioBlob);

    this.updateUI();
  }

  stopAudioStream() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }

  // ============================================================================
  // PLAYBACK FUNCTIONALITY
  // ============================================================================

  playRecording() {
    if (!this.currentAudioURL) return;

    const audio = new Audio(this.currentAudioURL);
    audio.play().catch((error) => {
      console.error("Playback failed:", error);
      this.showNotification("Playback failed", "error");
    });

    this.showNotification("Playback started", "success");
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  saveRecording() {
    if (!this.currentAudioBlob) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = this.getFileExtension();
    const filename = `juna-message-${timestamp}.${extension}`;

    const url = URL.createObjectURL(this.currentAudioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    this.showNotification(`Voice message saved: ${filename}`, "success");
  }

  deleteRecording() {
    if (this.currentAudioURL) {
      URL.revokeObjectURL(this.currentAudioURL);
      this.currentAudioURL = null;
    }

    this.currentAudioBlob = null;
    this.audioChunks = [];
    this.updateUI();
    this.showNotification("Message deleted", "warning");
  }

  getFileExtension() {
    const mimeType = this.config.recordingOptions.mimeType;
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("ogg")) return "ogg";
    if (mimeType.includes("wav")) return "wav";
    return "webm";
  }

  // ============================================================================
  // TIMER FUNCTIONALITY
  // ============================================================================

  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      this.elements.timer.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, 100); // Update every 100ms for smooth animation
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ============================================================================
  // UI UPDATES
  // ============================================================================

  updateUI() {
    // Update microphone button
    if (this.isRecording) {
      this.elements.micButton.classList.add("recording");
      this.elements.statusText.textContent = "Listening...";
      this.elements.statusText.classList.add("recording");
      this.elements.timer.classList.add("recording");
      this.elements.soundWaves.classList.add("active");
    } else {
      this.elements.micButton.classList.remove("recording");
      this.elements.statusText.classList.remove("recording");
      this.elements.timer.classList.remove("recording");
      this.elements.soundWaves.classList.remove("active");

      if (this.currentAudioBlob) {
        this.elements.statusText.textContent = "Message ready";
      } else {
        this.elements.statusText.textContent = "Click to talk to Juna";
        this.elements.timer.textContent = "00:00";
      }
    }

    // Update control buttons
    const hasRecording = !!this.currentAudioBlob;
    this.elements.playButton.disabled = !hasRecording;
    this.elements.saveButton.disabled = !hasRecording;
    this.elements.deleteButton.disabled = !hasRecording;
  }

  // ============================================================================
  // NOTIFICATION SYSTEM
  // ============================================================================

  showNotification(message, type = "success") {
    this.elements.notification.textContent = message;
    this.elements.notification.className = `notification ${type}`;
    this.elements.notification.classList.add("show");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.elements.notification.classList.remove("show");
    }, 3000);
  }

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  handleKeyboardShortcuts(event) {
    // Spacebar to toggle recording
    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      this.toggleRecording();
    }

    // Enter to play recording
    if (event.code === "Enter" && this.currentAudioBlob) {
      event.preventDefault();
      this.playRecording();
    }

    // Ctrl+S to save
    if (event.ctrlKey && event.code === "KeyS" && this.currentAudioBlob) {
      event.preventDefault();
      this.saveRecording();
    }

    // Delete key to delete recording
    if (event.code === "Delete" && this.currentAudioBlob) {
      event.preventDefault();
      this.deleteRecording();
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy() {
    this.stopRecording();
    this.stopTimer();
    this.stopAudioStream();

    if (this.currentAudioURL) {
      URL.revokeObjectURL(this.currentAudioURL);
    }
  }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Feature detection
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; color: white;">
        <div>
          <h1>Browser not supported</h1>
          <p>Your browser does not support voice input.<br>Please use a modern browser like Chrome, Firefox or Safari.</p>
        </div>
      </div>
    `;
    return;
  }

  // Initialize the Juna voice interface
  window.junaVoiceInterface = new JunaVoiceInterface();
  
  // Initialize asynchronously
  window.junaVoiceInterface.init().catch(error => {
    console.error("Failed to initialize Juna Voice Interface:", error);
  });

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (window.junaVoiceInterface) {
      window.junaVoiceInterface.destroy();
    }
  });

  console.log("🤖 Juna Voice Interface initialized successfully!");
});

// ============================================================================
// INTERFACE TOGGLE FUNCTIONALITY
// ============================================================================

JunaVoiceInterface.prototype.switchToVoiceMode = function () {
  this.currentMode = "voice";
  this.elements.voiceModeBtn.classList.add("active");
  this.elements.chatModeBtn.classList.remove("active");
  this.elements.chatContainer.classList.add("hidden");
  this.elements.recordingInterface.style.display = "flex";
  this.elements.voiceControls.style.display = "flex";
  this.showNotification("Switched to voice mode", "success");
};

JunaVoiceInterface.prototype.switchToChatMode = function () {
  this.currentMode = "chat";
  this.elements.chatModeBtn.classList.add("active");
  this.elements.voiceModeBtn.classList.remove("active");
  this.elements.chatContainer.classList.remove("hidden");
  this.elements.recordingInterface.style.display = "none";
  this.elements.voiceControls.style.display = "none";
  this.elements.chatInput.focus();
  this.showNotification("Switched to chat mode", "success");
};

// ============================================================================
// CHAT FUNCTIONALITY
// ============================================================================

JunaVoiceInterface.prototype.sendChatMessage = async function () {
  const message = this.elements.chatInput.value.trim();
  if (!message || this.isProcessingQuery) return;

  // Clear input first
  this.elements.chatInput.value = "";
  this.updateCharCount({ target: this.elements.chatInput });

  // If Brain is not initialized, fallback to old behavior
  if (!this.brain || !this.messageRenderer) {
    this.addChatMessage(message, "user");
    setTimeout(() => {
      this.addChatMessage("Brain backend not connected. Please refresh the page.", "juna");
    }, 1000);
    return;
  }

  // Add user message using new renderer
  this.messageRenderer.renderUserMessage(message);

  // Process query through Brain backend
  await this.processBrainQuery(message);
};

JunaVoiceInterface.prototype.addChatMessage = function (message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <div class="message-avatar">${sender === "user" ? "U" : "J"}</div>
    <div class="message-content">
      <p>${this.escapeHtml(message)}</p>
      <span class="message-time">${time}</span>
    </div>
  `;

  this.elements.chatMessages.appendChild(messageDiv);
  this.elements.chatMessages.scrollTop =
    this.elements.chatMessages.scrollHeight;

  // Store in chat history
  this.chatHistory.push({
    message: message,
    sender: sender,
    timestamp: new Date().toISOString(),
  });
};

JunaVoiceInterface.prototype.clearChat = async function () {
  try {
    // Reset Brain session if available
    if (this.brain) {
      await this.resetBrainSession();
    }
    
    // Keep welcome message, remove others
    const welcomeMessage =
      this.elements.chatMessages.querySelector(".welcome-message");
    this.elements.chatMessages.innerHTML = "";
    if (welcomeMessage) {
      this.elements.chatMessages.appendChild(welcomeMessage);
    }
    
    // Clear local chat history
    this.chatHistory = [];
    
    this.showNotification("Chat and session cleared", "success");
  } catch (error) {
    console.error("Failed to clear chat:", error);
    this.showNotification("Failed to clear session", "error");
  }
};

JunaVoiceInterface.prototype.updateCharCount = function (event) {
  const length = event.target.value.length;
  this.elements.charCount.textContent = `${length}/500`;
  this.elements.sendMessageBtn.disabled = length === 0;
};

JunaVoiceInterface.prototype.escapeHtml = function (text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
};

// ============================================================================
// BRAIN COMMUNICATION METHODS
// ============================================================================

JunaVoiceInterface.prototype.initializeBrainCommunication = async function() {
  try {
    console.log("🧠 Initializing Brain communication...");
    
    // Initialize Brain communication
    this.brain = new BrainCommunication();
    
    // Initialize message renderer
    this.messageRenderer = new MessageRenderer(this.elements.chatMessages);
    
    // Setup event handlers
    this.setupBrainEventHandlers();
    
    // Get initial session status
    this.currentSession = await this.brain.getSessionStatus();
    
    console.log("✅ Brain communication initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Brain communication:", error);
    this.showNotification("Failed to connect to Brain backend", "error");
  }
};

JunaVoiceInterface.prototype.setupBrainEventHandlers = function() {
  // Progress update handler
  this.brain.on('progress_update', (update) => {
    this.handleProgressUpdate(update);
  });
  
  // Error handler
  this.brain.on('brain_error', (error) => {
    this.handleBrainError(error);
  });
  
  // Session event handler
  this.brain.on('session_event', (event) => {
    this.handleSessionEvent(event);
  });
  
  // Session reset handler
  this.brain.on('session_reset', (data) => {
    this.handleSessionReset(data);
  });
};

JunaVoiceInterface.prototype.processBrainQuery = async function(query) {
  if (this.isProcessingQuery) {
    this.showNotification("Please wait for current query to complete", "warning");
    return;
  }
  
  this.isProcessingQuery = true;
  this.currentTaskId = `task_${Date.now()}`;
  
  try {
    // Show processing indicator
    this.showProcessingIndicator();
    
    // Send query to Brain
    const response = await this.brain.processQuery(query);
    
    // Render response based on type
    this.renderBrainResponse(response);
    
    // Update session info
    this.updateSessionInfo();
    
  } catch (error) {
    console.error("Failed to process Brain query:", error);
    this.showNotification(`Query failed: ${error.message}`, "error");
    
    // Render error response
    this.messageRenderer.renderErrorResponse({
      success: false,
      response_type: "ERROR",
      message: error.message,
      metadata: { error_code: "COMMUNICATION_FAILED" }
    });
    
  } finally {
    this.isProcessingQuery = false;
    this.hideProcessingIndicator();
  }
};

JunaVoiceInterface.prototype.renderBrainResponse = function(response) {
  switch (response.response_type) {
    case "SIMPLE":
      this.messageRenderer.renderSimpleResponse(response);
      break;
    case "COMPLEX":
      this.messageRenderer.renderComplexResponse(response);
      // Complete any active progress messages
      if (this.currentTaskId) {
        this.messageRenderer.completeProgressMessage(this.currentTaskId, response);
      }
      break;
    case "DIRECT":
      this.messageRenderer.renderDirectResponse(response);
      break;
    case "ERROR":
      this.messageRenderer.renderErrorResponse(response);
      break;
    default:
      this.messageRenderer.renderSimpleResponse(response);
  }
};

JunaVoiceInterface.prototype.handleProgressUpdate = function(update) {
  console.log("📊 Progress update:", update);
  
  // Render or update progress message
  this.messageRenderer.renderProgressUpdate(update, this.currentTaskId);
  
  // Show progress notification for major steps
  if (update.type === "STEP_COMPLETE") {
    this.showNotification(`${update.message}`, "success");
  }
};

JunaVoiceInterface.prototype.handleBrainError = function(error) {
  console.error("🧠 Brain error:", error);
  
  this.messageRenderer.renderErrorResponse({
    success: false,
    response_type: "ERROR",
    message: error.message,
    metadata: {
      error_code: error.error_code,
      details: error.details
    }
  });
  
  this.showNotification(`Brain error: ${error.message}`, "error");
};

JunaVoiceInterface.prototype.handleSessionEvent = function(event) {
  console.log("🔄 Session event:", event);
  // Handle session-related events
};

JunaVoiceInterface.prototype.handleSessionReset = function(data) {
  console.log("🔄 Session reset:", data);
  
  // Clear chat messages but keep welcome message
  const welcomeMessage = this.elements.chatMessages.querySelector('.welcome-message');
  this.elements.chatMessages.innerHTML = '';
  if (welcomeMessage) {
    this.elements.chatMessages.appendChild(welcomeMessage);
  }
  
  this.showNotification("Session reset successfully", "success");
};

JunaVoiceInterface.prototype.resetBrainSession = async function() {
  try {
    this.showNotification("Resetting session...", "warning");
    await this.brain.resetSession();
    this.currentSession = await this.brain.getSessionStatus();
  } catch (error) {
    console.error("Failed to reset session:", error);
    this.showNotification(`Failed to reset session: ${error.message}`, "error");
  }
};

JunaVoiceInterface.prototype.updateSessionInfo = async function() {
  try {
    this.currentSession = await this.brain.getSessionStatus();
    this.updateSessionUI();
  } catch (error) {
    console.error("Failed to update session info:", error);
  }
};

JunaVoiceInterface.prototype.updateSessionUI = function() {
  if (!this.currentSession) return;
  
  // Update session info in UI if elements exist
  const sessionInfo = document.getElementById('session-info');
  if (sessionInfo) {
    sessionInfo.innerHTML = `
      <div class="session-details">
        <span class="session-id">Session: ${this.currentSession.session_id.substring(0, 8)}...</span>
        <span class="message-count">Messages: ${this.currentSession.message_count}</span>
        <span class="memory-size">Memory: ${this.formatBytes(this.currentSession.memory_size)}</span>
      </div>
    `;
  }
};

JunaVoiceInterface.prototype.showProcessingIndicator = function() {
  // Show typing indicator or processing state
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.classList.add('active');
    typingIndicator.textContent = 'Juna is thinking...';
  }
};

JunaVoiceInterface.prototype.hideProcessingIndicator = function() {
  // Hide typing indicator
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.classList.remove('active');
    typingIndicator.textContent = '';
  }
};

JunaVoiceInterface.prototype.formatBytes = function(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
