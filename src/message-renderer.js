/**
 * MESSAGE RENDERER
 * Handles rendering different types of messages from Brain backend
 */

export class MessageRenderer {
  constructor(chatContainer) {
    this.chatContainer = chatContainer;
    this.messageIdCounter = 0;
  }

  /**
   * Render a user message
   */
  renderUserMessage(message) {
    const messageDiv = this.createMessageContainer('user-message');
    const time = this.getCurrentTime();
    
    messageDiv.innerHTML = `
      <div class="message-avatar">U</div>
      <div class="message-content">
        <p>${this.escapeHtml(message)}</p>
        <span class="message-time">${time}</span>
      </div>
    `;
    
    this.appendMessage(messageDiv);
    return messageDiv;
  }

  /**
   * Render a simple Brain response
   */
  renderSimpleResponse(response) {
    const messageDiv = this.createMessageContainer('juna-message simple');
    const time = this.getCurrentTime();
    
    messageDiv.innerHTML = `
      <div class="message-avatar">J</div>
      <div class="message-content">
        <p>${this.escapeHtml(response.message)}</p>
        <div class="response-metadata">
          <span class="metadata-item">⚡ ${response.metadata.execution_time_ms}ms</span>
          <span class="metadata-item">📍 ${response.metadata.route_taken}</span>
        </div>
        <span class="message-time">${time}</span>
      </div>
    `;
    
    this.appendMessage(messageDiv);
    return messageDiv;
  }

  /**
   * Render a complex Brain response with detailed metadata
   */
  renderComplexResponse(response) {
    const messageDiv = this.createMessageContainer('juna-message complex');
    const time = this.getCurrentTime();
    
    messageDiv.innerHTML = `
      <div class="message-avatar">J</div>
      <div class="message-content">
        <div class="response-header">
          <span class="response-type-badge complex">Complex Task</span>
        </div>
        <p>${this.escapeHtml(response.message)}</p>
        <div class="response-metadata">
          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="metadata-label">Route:</span>
              <span class="metadata-value">${response.metadata.route_taken}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Time:</span>
              <span class="metadata-value">${response.metadata.execution_time_ms}ms</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Steps:</span>
              <span class="metadata-value">${response.metadata.steps_completed}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Session:</span>
              <span class="metadata-value">${response.metadata.session_id.substring(0, 8)}...</span>
            </div>
          </div>
        </div>
        <span class="message-time">${time}</span>
      </div>
    `;
    
    this.appendMessage(messageDiv);
    return messageDiv;
  }

  /**
   * Render a direct Brain response
   */
  renderDirectResponse(response) {
    const messageDiv = this.createMessageContainer('juna-message direct');
    const time = this.getCurrentTime();
    
    messageDiv.innerHTML = `
      <div class="message-avatar">J</div>
      <div class="message-content">
        <div class="response-header">
          <span class="response-type-badge direct">Direct</span>
        </div>
        <p>${this.escapeHtml(response.message)}</p>
        <div class="response-metadata">
          <span class="metadata-item">⚡ ${response.metadata.execution_time_ms}ms</span>
        </div>
        <span class="message-time">${time}</span>
      </div>
    `;
    
    this.appendMessage(messageDiv);
    return messageDiv;
  }

  /**
   * Render an error response
   */
  renderErrorResponse(response) {
    const messageDiv = this.createMessageContainer('juna-message error');
    const time = this.getCurrentTime();
    
    messageDiv.innerHTML = `
      <div class="message-avatar error">⚠</div>
      <div class="message-content">
        <div class="response-header">
          <span class="response-type-badge error">Error</span>
        </div>
        <p class="error-message">${this.escapeHtml(response.message)}</p>
        <div class="error-details">
          <span class="error-code">${response.metadata?.error_code || 'UNKNOWN_ERROR'}</span>
          ${response.metadata?.details ? 
            `<details class="error-details-expandable">
              <summary>Technical Details</summary>
              <pre>${this.escapeHtml(response.metadata.details)}</pre>
            </details>` : ''}
        </div>
        <span class="message-time">${time}</span>
      </div>
    `;
    
    this.appendMessage(messageDiv);
    return messageDiv;
  }

  /**
   * Render a progress update
   */
  renderProgressUpdate(update, taskId = null) {
    const existingProgress = this.findProgressMessage(taskId);
    
    if (existingProgress) {
      // Update existing progress message
      this.updateProgressMessage(existingProgress, update);
      return existingProgress;
    } else {
      // Create new progress message
      return this.createProgressMessage(update, taskId);
    }
  }

  /**
   * Create a new progress message
   */
  createProgressMessage(update, taskId) {
    const messageDiv = this.createMessageContainer('progress-message');
    messageDiv.dataset.taskId = taskId || 'default';
    
    this.updateProgressMessage(messageDiv, update);
    this.appendMessage(messageDiv);
    
    return messageDiv;
  }

  /**
   * Update existing progress message
   */
  updateProgressMessage(messageDiv, update) {
    const progressPercentage = update.total_steps ? 
      Math.round((update.current_step / update.total_steps) * 100) : 0;
    
    const progressText = update.total_steps ? 
      `${update.current_step}/${update.total_steps}` : 
      `Step ${update.current_step}`;

    messageDiv.innerHTML = `
      <div class="progress-content">
        <div class="progress-header">
          <span class="progress-type ${update.type.toLowerCase()}">${this.formatProgressType(update.type)}</span>
          <span class="progress-step">${progressText}</span>
        </div>
        <div class="progress-message">${this.escapeHtml(update.message)}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progressPercentage}%"></div>
        </div>
      </div>
    `;
  }

  /**
   * Complete a progress message (mark as done)
   */
  completeProgressMessage(taskId, finalResponse) {
    const progressMessage = this.findProgressMessage(taskId);
    if (progressMessage) {
      progressMessage.classList.add('completed');
      
      // Add completion indicator
      const completionBadge = document.createElement('div');
      completionBadge.className = 'progress-completion';
      completionBadge.innerHTML = `
        <span class="completion-icon">✅</span>
        <span class="completion-text">Completed</span>
      `;
      progressMessage.appendChild(completionBadge);
    }
  }

  /**
   * Find existing progress message by task ID
   */
  findProgressMessage(taskId) {
    if (!taskId) return null;
    return this.chatContainer.querySelector(`[data-task-id="${taskId}"]`);
  }

  /**
   * Create base message container
   */
  createMessageContainer(className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.dataset.messageId = ++this.messageIdCounter;
    return messageDiv;
  }

  /**
   * Append message to chat container
   */
  appendMessage(messageDiv) {
    this.chatContainer.appendChild(messageDiv);
    
    // Animate message appearance
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
      messageDiv.style.transition = 'all 0.3s ease-out';
      messageDiv.style.opacity = '1';
      messageDiv.style.transform = 'translateY(0)';
    });
    
    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Scroll chat container to bottom
   */
  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  /**
   * Format progress type for display
   */
  formatProgressType(type) {
    const typeMap = {
      'CONTEXT_COLLECTION': 'Context',
      'TASK_EXECUTION': 'Executing',
      'STEP_COMPLETE': 'Step Complete'
    };
    
    return typeMap[type] || type;
  }

  /**
   * Get current time string
   */
  getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { 
      return map[m]; 
    });
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.chatContainer.innerHTML = '';
    this.messageIdCounter = 0;
  }

  /**
   * Remove specific message
   */
  removeMessage(messageId) {
    const message = this.chatContainer.querySelector(`[data-message-id="${messageId}"]`);
    if (message) {
      message.style.transition = 'all 0.3s ease-out';
      message.style.opacity = '0';
      message.style.transform = 'translateX(-100%)';
      
      setTimeout(() => {
        message.remove();
      }, 300);
    }
  }
}
