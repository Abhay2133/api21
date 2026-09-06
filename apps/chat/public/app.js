/**
 * apps21 // Global Chat - Client Application Logic
 * High-performance, real-time glassmorphic web chat client.
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Constants & Configuration
  // =========================================================================
  const STORAGE_KEY_TOKEN = 'apps21_chat_token';
  const MAX_MESSAGE_LENGTH = 2000;
  const PING_INTERVAL_MS = 25000;
  const REST_POLL_INTERVAL_MS = 4000;
  const BASE_RECONNECT_DELAY_MS = 1000;
  const MAX_RECONNECT_DELAY_MS = 15000;

  // Resolve API and WebSocket URLs
  const config = window.__APP_CONFIG__ || {};
  const currentHost = window.location.hostname || 'localhost';
  const currentPort = window.location.port || '';
  const isHttps = window.location.protocol === 'https:';

  // Default API: If chat served on port 3001, default to port 5000 or proxy
  let API_BASE = config.apiUrl;
  if (!API_BASE) {
    if (currentPort === '5000') {
      API_BASE = '';
    } else {
      API_BASE = `${window.location.protocol}//${currentHost}:5000`;
    }
  }

  // =========================================================================
  // 2. Application State
  // =========================================================================
  const state = {
    token: localStorage.getItem(STORAGE_KEY_TOKEN) || null,
    currentUser: {
      id: 0,
      display_name: 'Guest',
      ip_address: '127.0.0.1',
      is_claimed: false,
      device_token: '',
    },
    conversation: {
      id: 1,
      slug: 'global',
      title: 'Global Chat',
    },
    onlineCount: 1,
    messages: new Map(), // messageId -> message object
    ws: null,
    wsConnected: false,
    reconnectAttempts: 0,
    reconnectTimer: null,
    heartbeatTimer: null,
    restPollTimer: null,
    isAtBottom: true,
    unreadWhileScrolled: 0,
    isSubmittingClaim: false,
  };

  // =========================================================================
  // 3. DOM Elements
  // =========================================================================
  const elements = {
    // Header
    connectionStatusBadge: document.getElementById('connectionStatusBadge'),
    connectionStatusText: document.getElementById('connectionStatusText'),
    onlineCountText: document.getElementById('onlineCountText'),

    // Identity Bar
    identityDisplayName: document.getElementById('identityDisplayName'),
    identityClaimBadge: document.getElementById('identityClaimBadge'),
    identityClaimLabel: document.getElementById('identityClaimLabel'),
    identityIpAddress: document.getElementById('identityIpAddress'),
    tokenTruncated: document.getElementById('tokenTruncated'),
    userAvatar: document.getElementById('userAvatar'),
    userAvatarLetter: document.getElementById('userAvatarLetter'),
    claimBtnText: document.getElementById('claimBtnText'),
    openClaimModalBtn: document.getElementById('openClaimModalBtn'),

    // Messages
    messagesContainer: document.getElementById('messagesContainer'),
    messagesStream: document.getElementById('messagesStream'),
    welcomeCard: document.getElementById('welcomeCard'),
    jumpBottomBtn: document.getElementById('jumpBottomBtn'),
    unreadCountBadge: document.getElementById('unreadCountBadge'),

    // Composer
    messageForm: document.getElementById('messageForm'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    charCounter: document.getElementById('charCounter'),

    // Claim Modal
    claimModal: document.getElementById('claimModal'),
    closeClaimModalBtn: document.getElementById('closeClaimModalBtn'),
    cancelClaimBtn: document.getElementById('cancelClaimBtn'),
    claimHandleForm: document.getElementById('claimHandleForm'),
    claimDisplayName: document.getElementById('claimDisplayName'),
    claimPassword: document.getElementById('claimPassword'),
    submitClaimBtn: document.getElementById('submitClaimBtn'),
    claimSpinner: document.getElementById('claimSpinner'),
    claimSubmitLabel: document.getElementById('claimSubmitLabel') || document.getElementById('claimSubmitText'),
    claimErrorAlert: document.getElementById('claimErrorAlert'),
    claimErrorMessage: document.getElementById('claimErrorMessage'),
    claimSuccessAlert: document.getElementById('claimSuccessAlert'),
    claimSuccessMessage: document.getElementById('claimSuccessMessage'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),
  };

  // =========================================================================
  // 4. Utilities: Security & Formatting
  // =========================================================================

  /**
   * Escape HTML to strictly prevent Cross-Site Scripting (XSS).
   */
  function escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Formats message text with safe URL auto-linking and code highlighting.
   */
  function formatMessageBody(rawText) {
    if (!rawText) return '';
    let sanitized = escapeHtml(rawText);

    // Code blocks: ```code```
    sanitized = sanitized.replace(/```([\s\S]*?)```/g, (_match, code) => {
      return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
    });

    // Inline code: `code`
    sanitized = sanitized.replace(/`([^`\n]+)`/g, (_match, code) => {
      return `<code class="inline-code">${code}</code>`;
    });

    // Safe auto-link for http/https URLs
    const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    sanitized = sanitized.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // Line breaks
    sanitized = sanitized.replace(/\n/g, '<br>');

    return sanitized;
  }

  /**
   * Format message timestamp.
   */
  function formatTimestamp(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return timeStr;
    }
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  }

  /**
   * Show toast notification.
   */
  function showToast(message, type = 'info', duration = 3500) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // =========================================================================
  // 5. REST Client Helpers with Proxied Fallback
  // =========================================================================

  /**
   * Universal fetch with primary API URL and fallback to relative proxy path.
   */
  async function apiFetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (state.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    const primaryUrl = API_BASE ? `${API_BASE}${path}` : path;

    try {
      const res = await fetch(primaryUrl, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.message || `Request failed with status ${res.status}`);
        (error).status = res.status;
        (error).response = data;
        throw error;
      }
      return data;
    } catch (err) {
      // If primary API failed and API_BASE was non-empty, try relative path (chat server proxy)
      if (API_BASE && !path.startsWith('http')) {
        try {
          const fallbackRes = await fetch(path, { ...options, headers });
          const fallbackData = await fallbackRes.json();
          if (!fallbackRes.ok) {
            const error = new Error(fallbackData.message || `Fallback failed with status ${fallbackRes.status}`);
            (error).status = fallbackRes.status;
            (error).response = fallbackData;
            throw error;
          }
          return fallbackData;
        } catch (fallbackErr) {
          throw err;
        }
      }
      throw err;
    }
  }

  // =========================================================================
  // 6. UI Renderers
  // =========================================================================

  /**
   * Update connection status badge.
   */
  function renderConnectionStatus(status) {
    const badge = elements.connectionStatusBadge;
    const label = elements.connectionStatusText;
    if (!badge || !label) return;

    badge.classList.remove('status-connected', 'status-connecting', 'status-disconnected');

    if (status === 'connected') {
      badge.classList.add('status-connected');
      label.textContent = 'WS: Connected';
    } else if (status === 'connecting') {
      badge.classList.add('status-connecting');
      label.textContent = 'WS: Reconnecting...';
    } else {
      badge.classList.add('status-disconnected');
      label.textContent = 'REST Fallback';
    }
  }

  /**
   * Update online presence indicator.
   */
  function renderOnlineCount(count) {
    if (!elements.onlineCountText) return;
    state.onlineCount = count;
    elements.onlineCountText.textContent = `${count} Online`;
  }

  /**
   * Update identity bar with current user information.
   */
  function renderIdentity() {
    const user = state.currentUser;
    if (!user) return;

    // Display Name
    if (elements.identityDisplayName) {
      elements.identityDisplayName.textContent = user.display_name || 'Guest';
    }

    // Avatar Letter
    if (elements.userAvatarLetter) {
      const initial = (user.display_name || 'G').trim().charAt(0).toUpperCase();
      elements.userAvatarLetter.textContent = initial || '?';
    }

    // IP Address
    if (elements.identityIpAddress) {
      elements.identityIpAddress.textContent = user.ip_address || '127.0.0.1';
    }

    // Truncated Device Token
    if (elements.tokenTruncated && user.device_token) {
      const token = user.device_token;
      const truncated = token.length > 10 ? `${token.slice(0, 4)}...${token.slice(-4)}` : token;
      elements.tokenTruncated.textContent = `Token: ${truncated}`;
      elements.tokenTruncated.title = `Device Session Token: ${token}`;
    }

    // Claim Badge & Action Button
    if (elements.identityClaimBadge && elements.identityClaimLabel) {
      elements.identityClaimBadge.classList.remove('badge-claimed', 'badge-guest');

      if (user.is_claimed) {
        elements.identityClaimBadge.classList.add('badge-claimed');
        elements.identityClaimLabel.textContent = 'Claimed Handle';
        if (elements.claimBtnText) elements.claimBtnText.textContent = 'Switch Account';
      } else {
        elements.identityClaimBadge.classList.add('badge-guest');
        elements.identityClaimLabel.textContent = 'Guest (Ephemeral)';
        if (elements.claimBtnText) elements.claimBtnText.textContent = 'Claim Handle';
      }
    }
  }

  /**
   * Renders or updates a single chat message in the stream.
   */
  function appendMessageToStream(msg, shouldScroll = true) {
    if (!elements.messagesStream || !msg || !msg.id) return;

    // Check for duplicate message
    const existingElement = document.getElementById(`msg-${msg.id}`);
    if (existingElement) {
      return;
    }

    state.messages.set(msg.id, msg);

    // Hide welcome card if there are messages
    if (elements.welcomeCard) {
      elements.welcomeCard.style.display = 'none';
    }

    const isSelf =
      (state.currentUser.id && msg.user_id && msg.user_id === state.currentUser.id) ||
      (msg.sender_name && msg.sender_name === state.currentUser.display_name);

    const isSystem = msg.message_type === 'system';

    const bubble = document.createElement('div');
    bubble.id = `msg-${msg.id}`;

    if (isSystem) {
      bubble.className = 'message-system';
      bubble.innerHTML = `
        <svg class="message-system-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>${formatMessageBody(msg.content)}</span>
      `;
    } else {
      bubble.className = `message-bubble ${isSelf ? 'message-self' : 'message-other'}`;

      // Determine sender claimed badge
      const isClaimed =
        msg.metadata?.is_claimed !== undefined
          ? msg.metadata.is_claimed
          : isSelf
          ? state.currentUser.is_claimed
          : !msg.sender_name.startsWith('Guest-');

      let badgeHtml = '';
      if (isSelf && isClaimed) {
        badgeHtml = `<span class="msg-badge msg-badge-you">You</span> <span class="msg-badge msg-badge-claimed">Claimed</span>`;
      } else if (isSelf) {
        badgeHtml = `<span class="msg-badge msg-badge-you">You</span>`;
      } else if (isClaimed) {
        badgeHtml = `<span class="msg-badge msg-badge-claimed">Claimed</span>`;
      } else {
        badgeHtml = `<span class="msg-badge msg-badge-guest">Guest</span>`;
      }

      const senderDisplayName = escapeHtml(msg.sender_name || 'Anonymous');
      const timeFormatted = formatTimestamp(msg.created_at);
      const contentHtml = formatMessageBody(msg.content);

      bubble.innerHTML = `
        <div class="message-header">
          <span class="message-sender">${senderDisplayName}</span>
          ${badgeHtml}
          <span class="message-time" title="${msg.created_at || ''}">${timeFormatted}</span>
        </div>
        <div class="message-content">${contentHtml}</div>
      `;
    }

    elements.messagesStream.appendChild(bubble);

    // Scroll management
    if (shouldScroll && state.isAtBottom) {
      scrollToBottom();
    } else if (!isSelf) {
      state.unreadWhileScrolled++;
      updateUnreadBadge();
    }
  }

  /**
   * Scroll messages stream to the bottom.
   */
  function scrollToBottom(smooth = true) {
    if (!elements.messagesContainer) return;
    elements.messagesContainer.scrollTo({
      top: elements.messagesContainer.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    state.unreadWhileScrolled = 0;
    updateUnreadBadge();
  }

  /**
   * Update Jump to bottom button and unread counter.
   */
  function updateUnreadBadge() {
    if (!elements.jumpBottomBtn || !elements.unreadCountBadge) return;

    if (state.isAtBottom) {
      elements.jumpBottomBtn.classList.add('hidden');
      elements.unreadCountBadge.classList.add('hidden');
      elements.unreadCountBadge.textContent = '0';
    } else {
      elements.jumpBottomBtn.classList.remove('hidden');
      if (state.unreadWhileScrolled > 0) {
        elements.unreadCountBadge.classList.remove('hidden');
        elements.unreadCountBadge.textContent =
          state.unreadWhileScrolled > 99 ? '99+' : state.unreadWhileScrolled;
      } else {
        elements.unreadCountBadge.classList.add('hidden');
      }
    }
  }

  // =========================================================================
  // 7. WebSocket Controller (Real-time connection with exponential backoff)
  // =========================================================================

  function getWebSocketUrl() {
    const token = state.token || '';

    // If explicit WS URL passed in configuration:
    if (config.wsUrl) {
      const url = new URL(config.wsUrl);
      if (!url.pathname || url.pathname === '/') {
        url.pathname = '/ws/chat';
      }
      url.searchParams.set('token', token);
      return url.toString();
    }

    // If served on port 5000 (unified server)
    const proto = isHttps ? 'wss:' : 'ws:';
    if (currentPort === '5000') {
      return `${proto}//${window.location.host}/ws/chat?token=${encodeURIComponent(token)}`;
    }

    // Standard API port 5000
    return `${proto}//${currentHost}:5000/ws/chat?token=${encodeURIComponent(token)}`;
  }

  function connectWebSocket() {
    if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    renderConnectionStatus('connecting');

    const wsUrl = getWebSocketUrl();

    try {
      const ws = new WebSocket(wsUrl);
      state.ws = ws;

      ws.onopen = () => {
        state.wsConnected = true;
        state.reconnectAttempts = 0;
        renderConnectionStatus('connected');
        stopRestPolling();
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'INIT':
              if (message.payload) {
                if (message.payload.user) {
                  state.currentUser = message.payload.user;
                  renderIdentity();
                }
                if (message.payload.conversation) {
                  state.conversation = message.payload.conversation;
                }
                if (typeof message.payload.onlineCount === 'number') {
                  renderOnlineCount(message.payload.onlineCount);
                }
              }
              break;

            case 'NEW_MESSAGE':
              if (message.payload) {
                appendMessageToStream(message.payload, true);
              }
              break;

            case 'PRESENCE_UPDATE':
              if (message.payload && typeof message.payload.onlineCount === 'number') {
                renderOnlineCount(message.payload.onlineCount);
              }
              break;

            case 'PONG':
              // Heartbeat acknowledged
              break;

            case 'ERROR':
              if (message.payload?.message) {
                showToast(message.payload.message, 'error');
              }
              break;

            default:
              console.warn('[ChatWS] Unknown action:', message.type);
          }
        } catch (err) {
          console.error('[ChatWS] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        state.wsConnected = false;
        stopHeartbeat();
        renderConnectionStatus('disconnected');
        startRestPolling();
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        console.warn('[ChatWS] Connection error:', err);
      };
    } catch (err) {
      console.error('[ChatWS] Failed to initialize WebSocket:', err);
      renderConnectionStatus('disconnected');
      startRestPolling();
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
    }

    state.reconnectAttempts++;
    const factor = Math.min(Math.pow(1.6, state.reconnectAttempts), 20);
    const delay = Math.min(BASE_RECONNECT_DELAY_MS * factor, MAX_RECONNECT_DELAY_MS) + Math.random() * 500;

    renderConnectionStatus('connecting');

    state.reconnectTimer = setTimeout(() => {
      connectWebSocket();
    }, delay);
  }

  function startHeartbeat() {
    stopHeartbeat();
    state.heartbeatTimer = setInterval(() => {
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, PING_INTERVAL_MS);
  }

  function stopHeartbeat() {
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }
  }

  // =========================================================================
  // 8. REST Polling & Message History Fallback
  // =========================================================================

  function startRestPolling() {
    if (state.restPollTimer) return;
    pollLatestMessages();
    state.restPollTimer = setInterval(pollLatestMessages, REST_POLL_INTERVAL_MS);
  }

  function stopRestPolling() {
    if (state.restPollTimer) {
      clearInterval(state.restPollTimer);
      state.restPollTimer = null;
    }
  }

  async function pollLatestMessages() {
    try {
      const convId = state.conversation.id || 1;
      const res = await apiFetch(`/api/v1/chat/conversations/${convId}/messages?limit=30`);
      if (res.status === 'success' && res.data?.messages) {
        for (const msg of res.data.messages) {
          if (!state.messages.has(msg.id)) {
            appendMessageToStream(msg, state.isAtBottom);
          }
        }
      }

      // Also refresh online count
      const globalRes = await apiFetch(`/api/v1/chat/conversations/global`);
      if (globalRes.status === 'success' && typeof globalRes.data?.onlineCount === 'number') {
        renderOnlineCount(globalRes.data.onlineCount);
      }
    } catch (_err) {
      // Ignore polling errors in background
    }
  }

  async function fetchInitialHistory() {
    try {
      // 1. Fetch Global conversation info & online count
      const globalRes = await apiFetch('/api/v1/chat/conversations/global');
      if (globalRes.status === 'success' && globalRes.data) {
        if (globalRes.data.conversation) {
          state.conversation = globalRes.data.conversation;
        }
        if (typeof globalRes.data.onlineCount === 'number') {
          renderOnlineCount(globalRes.data.onlineCount);
        }
      }

      // 2. Fetch message history
      const convId = state.conversation.id || 1;
      const msgRes = await apiFetch(`/api/v1/chat/conversations/${convId}/messages?limit=50`);
      if (msgRes.status === 'success' && msgRes.data?.messages) {
        elements.messagesStream.innerHTML = '';
        for (const msg of msgRes.data.messages) {
          appendMessageToStream(msg, false);
        }
        scrollToBottom(false);
      }
    } catch (err) {
      console.warn('[Chat] Failed to load initial message history:', err);
    }
  }

  // =========================================================================
  // 9. Send Message Controller
  // =========================================================================

  async function handleSendMessage(content) {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    // Disable composer while transmitting
    elements.sendMessageBtn.disabled = true;

    const convId = state.conversation.id || 1;

    try {
      // Option A: Send via real-time WebSocket if open
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(
          JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
              conversationId: convId,
              content: trimmed,
            },
          })
        );
      } else {
        // Option B: Fallback REST message post
        const res = await apiFetch(`/api/v1/chat/conversations/${convId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: trimmed }),
        });

        if (res.status === 'success' && res.data) {
          appendMessageToStream(res.data, true);
        }
      }

      // Reset textarea
      elements.messageInput.value = '';
      elements.messageInput.style.height = 'auto';
      updateCharCounter(0);
      scrollToBottom();
    } catch (err) {
      console.error('[Chat] Error sending message:', err);
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      updateCharCounter(elements.messageInput.value.length);
      elements.messageInput.focus();
    }
  }

  // =========================================================================
  // 10. Claim Handle Controller
  // =========================================================================

  function openClaimModal() {
    if (!elements.claimModal) return;

    // Reset feedback alerts
    elements.claimErrorAlert.classList.add('hidden');
    elements.claimSuccessAlert.classList.add('hidden');

    // Pre-populate if claimed or custom name
    const currentName = state.currentUser.display_name;
    if (currentName && !currentName.startsWith('Guest-')) {
      elements.claimDisplayName.value = currentName;
    } else {
      elements.claimDisplayName.value = '';
    }
    elements.claimPassword.value = '';

    elements.claimModal.classList.remove('hidden');
    setTimeout(() => {
      elements.claimDisplayName.focus();
    }, 50);
  }

  function closeClaimModal() {
    if (!elements.claimModal) return;
    elements.claimModal.classList.add('hidden');
    elements.claimErrorAlert.classList.add('hidden');
    elements.claimSuccessAlert.classList.add('hidden');
    setClaimSubmitting(false);
  }

  function setClaimSubmitting(isSubmitting) {
    state.isSubmittingClaim = isSubmitting;
    elements.submitClaimBtn.disabled = isSubmitting;
    elements.claimDisplayName.disabled = isSubmitting;
    elements.claimPassword.disabled = isSubmitting;

    if (isSubmitting) {
      if (elements.claimSpinner) elements.claimSpinner.classList.remove('hidden');
      if (elements.claimSubmitLabel) elements.claimSubmitLabel.textContent = 'Securing Handle...';
    } else {
      if (elements.claimSpinner) elements.claimSpinner.classList.add('hidden');
      if (elements.claimSubmitLabel) elements.claimSubmitLabel.textContent = 'Claim & Save Handle';
    }
  }

  async function handleClaimSubmit(event) {
    event.preventDefault();
    if (state.isSubmittingClaim) return;

    const displayName = elements.claimDisplayName.value.trim();
    const password = elements.claimPassword.value;

    elements.claimErrorAlert.classList.add('hidden');
    elements.claimSuccessAlert.classList.add('hidden');

    // Validation
    if (displayName.length < 2 || displayName.length > 30) {
      showClaimError('Display name must be between 2 and 30 characters');
      return;
    }
    if (!/^[\w\s\-_.]+$/.test(displayName)) {
      showClaimError('Display name can only contain letters, numbers, spaces, and - _ .');
      return;
    }
    if (password.length < 4 || password.length > 100) {
      showClaimError('Password must be between 4 and 100 characters');
      return;
    }

    setClaimSubmitting(true);

    try {
      const res = await apiFetch('/api/v1/chat/identity/claim', {
        method: 'POST',
        body: JSON.stringify({ displayName, password }),
      });

      if (res.status === 'success' && res.data) {
        const { user, token } = res.data;

        // Persist session token
        state.token = token;
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        state.currentUser = user;

        renderIdentity();

        elements.claimSuccessMessage.textContent = `Handle '@${user.display_name}' secured successfully!`;
        elements.claimSuccessAlert.classList.remove('hidden');

        showToast(`Logged in as @${user.display_name}`, 'success');

        // Reconnect WebSocket with new claimed token
        if (state.ws) {
          state.ws.close();
        }
        setTimeout(() => {
          connectWebSocket();
          closeClaimModal();
        }, 1000);
      } else {
        throw new Error(res.message || 'Failed to claim handle');
      }
    } catch (err) {
      console.error('[Chat] Claim handle error:', err);
      let msg = err.message || 'An error occurred while claiming the handle';
      if (err.status === 401) {
        msg = 'This handle is password-protected. The password entered is incorrect.';
      }
      showClaimError(msg);
    } finally {
      setClaimSubmitting(false);
    }
  }

  function showClaimError(msg) {
    elements.claimErrorMessage.textContent = msg;
    elements.claimErrorAlert.classList.remove('hidden');
  }

  // =========================================================================
  // 11. Initial Handshake & Bootstrap
  // =========================================================================

  async function executeHandshake() {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

      const res = await apiFetch('/api/v1/chat/identity/handshake', {
        method: 'POST',
        body: JSON.stringify({ token: savedToken || undefined }),
      });

      if (res.status === 'success' && res.data) {
        const { user, token } = res.data;
        state.token = token;
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        state.currentUser = user;
        renderIdentity();
      }
    } catch (err) {
      console.warn('[Chat] Handshake fallback to local guest session:', err);
      if (!state.token) {
        state.token = 'guest-' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(STORAGE_KEY_TOKEN, state.token);
      }
      renderIdentity();
    }
  }

  // =========================================================================
  // 12. Event Listeners & Interactions
  // =========================================================================

  function updateCharCounter(length) {
    elements.charCounter.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;
    elements.charCounter.classList.remove('char-counter-warn', 'char-counter-danger');

    if (length > MAX_MESSAGE_LENGTH) {
      elements.charCounter.classList.add('char-counter-danger');
      elements.sendMessageBtn.disabled = true;
    } else if (length > MAX_MESSAGE_LENGTH * 0.9) {
      elements.charCounter.classList.add('char-counter-warn');
      elements.sendMessageBtn.disabled = length === 0;
    } else {
      elements.sendMessageBtn.disabled = length === 0;
    }
  }

  function setupEventListeners() {
    // Message input auto-resize & counter
    elements.messageInput.addEventListener('input', () => {
      elements.messageInput.style.height = 'auto';
      const newHeight = Math.min(elements.messageInput.scrollHeight, 160);
      elements.messageInput.style.height = `${newHeight}px`;

      const len = elements.messageInput.value.trim().length;
      updateCharCounter(len);
    });

    // Enter to send, Shift+Enter for newline
    elements.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const content = elements.messageInput.value.trim();
        if (content && content.length <= MAX_MESSAGE_LENGTH) {
          handleSendMessage(content);
        }
      }
    });

    // Form submit
    elements.messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const content = elements.messageInput.value.trim();
      if (content && content.length <= MAX_MESSAGE_LENGTH) {
        handleSendMessage(content);
      }
    });

    // Scroll detection for auto-scroll and jump button
    elements.messagesContainer.addEventListener('scroll', () => {
      const container = elements.messagesContainer;
      const scrollPos = container.scrollHeight - container.scrollTop - container.clientHeight;
      state.isAtBottom = scrollPos < 80;
      updateUnreadBadge();
    });

    // Jump to bottom button
    elements.jumpBottomBtn.addEventListener('click', () => {
      scrollToBottom();
    });

    // Claim Handle Modal triggers
    elements.openClaimModalBtn.addEventListener('click', openClaimModal);
    elements.closeClaimModalBtn.addEventListener('click', closeClaimModal);
    elements.cancelClaimBtn.addEventListener('click', closeClaimModal);

    // Modal background click
    elements.claimModal.addEventListener('click', (e) => {
      if (e.target === elements.claimModal) {
        closeClaimModal();
      }
    });

    // Escape key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.claimModal.classList.contains('hidden')) {
        closeClaimModal();
      }
    });

    // Claim form submit
    elements.claimHandleForm.addEventListener('submit', handleClaimSubmit);
  }

  // =========================================================================
  // 13. Application Initialization
  // =========================================================================

  async function init() {
    setupEventListeners();
    renderIdentity();
    renderConnectionStatus('connecting');

    // 1. Handshake to resolve or create session
    await executeHandshake();

    // 2. Fetch initial messages & room stats
    await fetchInitialHistory();

    // 3. Connect real-time WebSocket
    connectWebSocket();
  }

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
