// Main Application Controller
class LuxAI {
    constructor() {
        this.currentModel = 'deepseek';
        this.currentChatId = null;
        this.chats = {};
        this.messages = [];
        this.isGenerating = false;
        this.abortController = null;
        this.voiceEnabled = false;
        this.currentTheme = 'dark';
        
        this.init();
    }

   init() {
    this.loadChats();
    this.setupEventListeners();
    this.setupParticles();
    this.hideLoadingScreen();

    // delay until UI fully ready
    setTimeout(() => {
        this.autoResizeTextarea();
    }, 0);
   }

    // Hide Loading Screen
    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('hide');
            document.getElementById('app').style.opacity = '1';
        }, 2000);
    }

    // Setup Particles.js
    setupParticles() {
        particlesJS('particles-js', {
            particles: {
                number: { value: 50, density: { enable: true, value_area: 800 } },
                color: { value: '#667eea' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#667eea',
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: true,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'grab' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                },
                modes: {
                    grab: { distance: 140, line_linked: { opacity: 0.5 } },
                    push: { particles_nb: 3 }
                }
            },
            retina_detect: true
        });
    }

    // Load saved chats from localStorage
    loadChats() {
        const savedChats = localStorage.getItem('luxai_chats');
        if (savedChats) {
            this.chats = JSON.parse(savedChats);
        }
        this.renderChatHistory();
    }

    // Save chats to localStorage
    saveChats() {
        localStorage.setItem('luxai_chats', JSON.stringify(this.chats));
    }

    // Create new chat
    createNewChat() {
        const chatId = 'chat_' + Date.now();
        const chat = {
            id: chatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            model: this.currentModel
        };
        
        this.chats[chatId] = chat;
        this.currentChatId = chatId;
        this.messages = [];
        this.saveChats();
        this.renderChatHistory();
        this.clearChatArea();
        this.showWelcomeScreen();
        
        return chatId;
    }

    // Switch active chat
    switchChat(chatId) {
        if (!this.chats[chatId]) return;
        
        this.currentChatId = chatId;
        this.messages = this.chats[chatId].messages || [];
        this.currentModel = this.chats[chatId].model || 'deepseek';
        
        // Update model display
        document.getElementById('currentModel').textContent = this.getModelDisplayName(this.currentModel);
        
        // Render messages
        this.renderMessages();
        this.hideWelcomeScreen();
    }

    // Delete chat
    deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            delete this.chats[chatId];
            
            if (this.currentChatId === chatId) {
                this.currentChatId = null;
                this.messages = [];
                this.clearChatArea();
                this.showWelcomeScreen();
            }
            
            this.saveChats();
            this.renderChatHistory();
            this.showToast('Chat deleted successfully');
        }
    }

    // Rename chat
    renameChat(chatId) {
        const chat = this.chats[chatId];
        if (!chat) return;
        
        const newTitle = prompt('Enter new chat title:', chat.title);
        if (newTitle && newTitle.trim()) {
            chat.title = newTitle.trim();
            this.saveChats();
            this.renderChatHistory();
        }
    }

 // Switch AI model
switchModel(model) {

    // Temporarily unavailable models
    if (model === 'copilot' || model === 'nemotron') {

        // Red unavailable popup
        const toast = document.createElement('div');

        toast.className = 'fixed top-5 right-5 z-[9999] bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl border border-red-400 animate-fadeIn';

        toast.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <div>
                <div class="font-semibold">${this.getModelDisplayName(model)} Unavailable</div>
                <div class="text-sm text-red-100">Switching to DeepSeek...</div>
            </div>
        </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);

        // Auto switch to DeepSeek
        model = 'deepseek';
    }

    this.currentModel = model;
    document.getElementById('currentModel').textContent = this.getModelDisplayName(model);

    if (this.currentChatId && this.chats[this.currentChatId]) {
        this.chats[this.currentChatId].model = model;
        this.saveChats();
    }

    this.showToast(`Switched to ${this.getModelDisplayName(model)}`);
}
    // Get model display name
    getModelDisplayName(model) {
        const names = {
            'deepseek': 'DeepSeek V3',
            'copilot': 'Copilot',
            'chatgpt': 'ChatGPT',
            'nemotron': 'Nemotron'
        };
        return names[model] || model;
    }

    // Send message
    async sendMessage(message) {
        // IMAGE COMMAND CHECK
if (message.startsWith('/image ')) {

    const prompt = message.replace('/image ', '').trim();

    if (!prompt) {
        this.showToast('Image prompt likho');
        return;
    }

    // user message show
    this.messages.push({
        id: Date.now(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    this.renderMessages();

    // loading message
    const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '🎨 Image bana raha hoon...',
        timestamp: new Date().toISOString()
    };

    this.messages.push(aiMsg);
    this.renderMessages();

    try {

        const res = await fetch('./api/image.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `prompt=${encodeURIComponent(prompt)}`
        });

        const data = await res.json();

        if (data.success) {

            aiMsg.content = `
                <img src="${data.imageUrl}" style="max-width:300px;border-radius:10px;">
            `;

        } else {
            aiMsg.content = "Image failed";
        }

    } catch (e) {
        aiMsg.content = "Error aagaya";
    }

    this.renderMessages();
    this.saveChats();

    return; // 🚨 VERY IMPORTANT
}
        if (!message.trim() || this.isGenerating) return;
        
        // Create chat if none exists
        if (!this.currentChatId) {
            this.createNewChat();
        }
        
        // Hide welcome screen
        this.hideWelcomeScreen();
        
        // Add user message
        const userMessage = {
            id: 'msg_' + Date.now(),
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(userMessage);
        this.renderMessages();
        
        // Update chat title based on first message
        if (this.chats[this.currentChatId]?.messages?.length === 0) {
            this.chats[this.currentChatId].title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        }
        
        // Save to chat
        this.chats[this.currentChatId].messages = this.messages;
        this.saveChats();
        this.renderChatHistory();
        
        // Clear input
        document.getElementById('messageInput').value = '';
        this.autoResizeTextarea();
        
        // Get AI response
        await this.getAIResponse(message);
    }

  // Get AI response from backend
async getAIResponse(userMessage) {
    this.isGenerating = true;
    this.showStopButton();

    const aiMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
    };

    this.messages.push(aiMessage);

    const messageElement = this.createMessageElement(aiMessage);
    document.getElementById('chatMessages')
        .appendChild(messageElement);

    const contentElement =
        messageElement.querySelector('.message-content');

    this.abortController = new AbortController();

    try {

        const response = await fetch(
            this.getApiUrl(),
            {
                method: 'POST',
                body: new URLSearchParams({
                    message: userMessage
                }),
                signal: this.abortController.signal
            }
        );

        if (!response.ok) {
            throw new Error(
                'API Error: ' + response.status
            );
        }

        const data = await response.json();

        console.log(data);

        aiMessage.content =
            data.content ||
            data.response ||
            "No response";

        contentElement.innerHTML =
            marked.parse(aiMessage.content);

        hljs.highlightAll();

        this.chats[this.currentChatId].messages =
            this.messages;

        this.saveChats();

    } catch(error){

        console.error(error);

        aiMessage.content =
            'Sorry, an error occurred';

        contentElement.innerHTML =
            marked.parse(aiMessage.content);

    } finally {

        this.isGenerating = false;
        this.hideStopButton();
        this.abortController = null;

    }
}

    // Get API URL based on current model
   getApiUrl() {
    const apiMap = {
        'deepseek': '/chatbot/api/deepseek.php',
        'copilot': '/chatbot/api/copilot.php',
        'chatgpt': '/chatbot/api/chatgpt.php',
        'nemotron': '/chatbot/api/nemotron.php'
    };

    return apiMap[this.currentModel];
}

    // Stop generation
    stopGeneration() {
        if (this.abortController) {
            this.abortController.abort();
            this.isGenerating = false;
            this.hideStopButton();
        }
    }

    // Regenerate AI response
    async regenerateResponse(messageIndex) {
        if (this.isGenerating) return;
        
        // Remove messages after this point
        this.messages = this.messages.slice(0, messageIndex);
        
        // Get the last user message
        const lastUserMessage = this.messages[this.messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
            // Remove the old AI response from DOM
            const messagesContainer = document.getElementById('chatMessages');
            const oldAIMessages = messagesContainer.querySelectorAll('[data-message-id]');
            if (oldAIMessages.length > 0) {
                oldAIMessages[oldAIMessages.length - 1].remove();
            }
            
            // Get new response
            await this.getAIResponse(lastUserMessage.content);
        }
    }

    // Edit message
    editMessage(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;
        
        const editModal = document.getElementById('editMessageModal');
        const editInput = document.getElementById('editMessageInput');
        
        editInput.value = message.content;
        editModal.classList.remove('hidden');
        
        // Focus input
        setTimeout(() => editInput.focus(), 100);
        
        // Save edit handler
        const saveHandler = () => {
            const newContent = editInput.value.trim();
            if (newContent) {
                message.content = newContent;
                this.renderMessages();
                this.chats[this.currentChatId].messages = this.messages;
                this.saveChats();
                editModal.classList.add('hidden');
            }
        };
        
        document.getElementById('saveEditMessageBtn').onclick = saveHandler;
        document.getElementById('cancelEditMessageBtn').onclick = () => {
            editModal.classList.add('hidden');
        };
    }

    // Render chat history in sidebar
    renderChatHistory() {
        const historyContainer = document.getElementById('chatHistory');
        const searchQuery = document.getElementById('searchChats')?.value?.toLowerCase() || '';
        
        const chats = Object.values(this.chats)
            .filter(chat => chat.title.toLowerCase().includes(searchQuery))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        historyContainer.innerHTML = chats.map(chat => `
            <div class="chat-history-item group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-800/50 ${chat.id === this.currentChatId ? 'bg-gray-800/50 border border-gray-700/50' : ''}"
                 data-chat-id="${chat.id}">
                <div class="flex-1 min-w-0" onclick="app.switchChat('${chat.id}')">
                    <div class="text-sm font-medium truncate">${this.escapeHtml(chat.title)}</div>
                    <div class="text-xs text-gray-500">${this.formatDate(chat.createdAt)}</div>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1 hover:bg-gray-700 rounded transition-all" onclick="event.stopPropagation(); app.renameChat('${chat.id}')" title="Rename">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button class="p-1 hover:bg-red-600/20 hover:text-red-400 rounded transition-all" onclick="event.stopPropagation(); app.deleteChat('${chat.id}')" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to chat items
        historyContainer.querySelectorAll('.chat-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.switchChat(item.dataset.chatId);
                }
            });
        });
    }

    // Render all messages
    renderMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        
        this.messages.forEach(message => {
            this.renderMessage(message);
        });
        
        this.scrollToBottom();
    }

    // Render single message
    renderMessage(message) {
        const messageElement = this.createMessageElement(message);
        document.getElementById('chatMessages').appendChild(messageElement);
        this.scrollToBottom();
        
        // Highlight code blocks
        messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    // Create message element
    createMessageElement(message, isStreaming = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-container message-${message.role} animate-fadeIn flex gap-4 p-6 ${message.role === 'assistant' ? 'bg-gray-800/20' : ''}`;
        messageDiv.dataset.messageId = message.id;
        
        const avatarHtml = message.role === 'user' ? `
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            </div>
        ` : `
            <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse-slow">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
            </div>
        `;
        
        const content = message.role === 'assistant' ? marked.parse(message.content) : this.escapeHtml(message.content);
        
        const actionsHtml = message.role === 'assistant' ? `
            <div class="message-actions flex items-center gap-2 mt-2">
                <button class="copy-message-btn p-1.5 hover:bg-gray-700 rounded-lg transition-all hover:scale-110" title="Copy message" data-content="${this.escapeHtml(message.content)}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                </button>
                <button class="regenerate-btn p-1.5 hover:bg-gray-700 rounded-lg transition-all hover:scale-110" title="Regenerate response">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                </button>
            </div>
        ` : `
            <div class="message-actions flex items-center gap-2 mt-2">
                <button class="edit-message-btn p-1.5 hover:bg-gray-700 rounded-lg transition-all hover:scale-110" title="Edit message">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        messageDiv.innerHTML = `
            ${avatarHtml}
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-sm">${message.role === 'user' ? 'You' : 'LuxAI'}</span>
                    <span class="text-xs text-gray-500">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="message-content prose prose-invert max-w-none">
                    ${content}
                </div>
                ${actionsHtml}
            </div>
        `;
        
        // Add event listeners
        const copyBtn = messageDiv.querySelector('.copy-message-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard(copyBtn.dataset.content);
            });
        }
        
        const regenerateBtn = messageDiv.querySelector('.regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                const index = this.messages.findIndex(m => m.id === message.id);
                this.regenerateResponse(index);
            });
        }
        
        const editBtn = messageDiv.querySelector('.edit-message-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editMessage(message.id);
            });
        }
        
        return messageDiv;
    }

    // Clear chat area
    clearChatArea() {
        document.getElementById('chatMessages').innerHTML = '';
    }

    // Show welcome screen
    showWelcomeScreen() {
        document.getElementById('welcomeScreen')?.classList.remove('hidden');
    }

    // Hide welcome screen
    hideWelcomeScreen() {
        document.getElementById('welcomeScreen')?.classList.add('hidden');
    }

    // Show/hide stop button
    showStopButton() {
        document.getElementById('sendBtn').classList.add('hidden');
        document.getElementById('stopBtn').classList.remove('hidden');
    }

    hideStopButton() {
        document.getElementById('sendBtn').classList.remove('hidden');
        document.getElementById('stopBtn').classList.add('hidden');
    }

    // Copy to clipboard
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!');
        });
    }

    // Scroll to bottom of chat
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    // Auto resize textarea
    autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }

    // Show toast notification
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) { // Less than 24 hours
            return this.formatTime(dateString);
        } else if (diff < 604800000) { // Less than 7 days
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    // Format time
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Setup all event listeners
    setupEventListeners() {
        // Sidebar collapse
        document.getElementById('collapseSidebar').addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('w-80');
            sidebar.classList.toggle('w-0');
            sidebar.classList.toggle('overflow-hidden');
        });
        
        // Mobile menu
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        
        // New chat button
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.createNewChat();
        });
        
        // Model switcher
        document.getElementById('modelSwitcherBtn').addEventListener('click', () => {
            const dropdown = document.getElementById('modelDropdown');
            dropdown.classList.toggle('hidden');
        });
        
        // Model options
        document.querySelectorAll('.model-option').forEach(option => {
            option.addEventListener('click', () => {
                const model = option.dataset.model;
                this.switchModel(model);
                document.getElementById('modelDropdown').classList.add('hidden');
            });
        });
        
        // Close model dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#modelSwitcher')) {
                document.getElementById('modelDropdown').classList.add('hidden');
            }
        });
        
        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => {
            const input = document.getElementById('messageInput');
            this.sendMessage(input.value);
        });
        
        // Stop generation
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopGeneration();
        });
        
        // Enter to send (Shift+Enter for new line)
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const input = document.getElementById('messageInput');
                this.sendMessage(input.value);
            }
        });
        
        // Auto resize textarea
        document.getElementById('messageInput').addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Plus button menu
        document.getElementById('plusBtn').addEventListener('click', () => {
            document.getElementById('plusMenu').classList.remove('hidden');
        });
        
        document.getElementById('plusMenuOverlay').addEventListener('click', () => {
            document.getElementById('plusMenu').classList.add('hidden');
        });
        
        // Create image
        document.getElementById('createImageBtn').addEventListener('click', () => {
            document.getElementById('plusMenu').classList.add('hidden');
            document.getElementById('imageModal').classList.remove('hidden');
        });
        
        document.getElementById('imageModalOverlay').addEventListener('click', () => {
            document.getElementById('imageModal').classList.add('hidden');
        });
        
        document.getElementById('closeImageModal').addEventListener('click', () => {
            document.getElementById('imageModal').classList.add('hidden');
        });
        
        // Upload file
        document.getElementById('uploadFileBtn').addEventListener('click', () => {
            document.getElementById('plusMenu').classList.add('hidden');
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.showToast(`File "${file.name}" selected`);
                // Handle file upload logic here
            }
        });
        
        // Clear chat
        document.getElementById('clearChatBtn').addEventListener('click', () => {
            document.getElementById('plusMenu').classList.add('hidden');
            if (confirm('Are you sure you want to clear the current chat?')) {
                this.messages = [];
                this.clearChatArea();
                this.showWelcomeScreen();
                if (this.currentChatId && this.chats[this.currentChatId]) {
                    this.chats[this.currentChatId].messages = [];
                    this.saveChats();
                }
                this.showToast('Chat cleared');
            }
        });
        
        // Quick actions
        document.getElementById('quickActionsBtn').addEventListener('click', () => {
            document.getElementById('plusMenu').classList.add('hidden');
            document.getElementById('messageInput').value = '/help';
            this.sendMessage('/help');
        });
        
        // Generate image
        document.getElementById('generateImageBtn').addEventListener('click', async () => {
            const prompt = document.getElementById('imagePrompt').value;
            if (!prompt.trim()) return;
            
            const imageResult = document.getElementById('imageResult');
            const generatedImage = document.getElementById('generatedImage');
            
            imageResult.classList.add('hidden');
            document.getElementById('generateImageBtn').textContent = 'Generating...';
            
            try {
                const response = await fetch(`./api/image.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `prompt=${encodeURIComponent(prompt)}`
                });
                
                const data = await response.json();
                if (data.success) {
    generatedImage.src = data.imageUrl;
    imageResult.classList.remove('hidden');

    // image load hone ke baad auto scroll
    generatedImage.onload = () => {
        imageResult.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    };

} else {
                    throw new Error(data.error || 'Generation failed');
                }
            } catch (error) {
                this.showToast('Image generation failed. Please try again.');
                console.error('Image generation error:', error);
            } finally {
                document.getElementById('generateImageBtn').textContent = 'Generate Image';
            }
        });
        
        // Download image
        document.getElementById('downloadImageBtn').addEventListener('click', () => {
            const img = document.getElementById('generatedImage');
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'luxai-image.png';
            link.click();
        });
        
        // Regenerate image
        document.getElementById('regenerateImageBtn').addEventListener('click', () => {
            document.getElementById('generateImageBtn').click();
        });
        
        // Edit message modal
        document.getElementById('editMessageModalOverlay').addEventListener('click', () => {
            document.getElementById('editMessageModal').classList.add('hidden');
        });
        
        document.getElementById('closeEditMessageModal').addEventListener('click', () => {
            document.getElementById('editMessageModal').classList.add('hidden');
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Voice button
        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });
        
        // Search chats
        document.getElementById('searchChats').addEventListener('input', () => {
            this.renderChatHistory();
        });
        
        // Suggested prompts
        document.querySelectorAll('.suggested-prompt').forEach(prompt => {
            prompt.addEventListener('click', () => {
                this.sendMessage(prompt.dataset.prompt);
            });
        });
        
        // Handle window resize for mobile
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    }

    // Toggle theme
    toggleTheme() {
        if (this.currentTheme === 'dark') {
            this.currentTheme = 'light';
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#ffffff';
            document.body.style.color = '#000000';
        } else {
            this.currentTheme = 'dark';
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#000000';
            document.body.style.color = '#ffffff';
        }
        this.showToast(`Theme switched to ${this.currentTheme} mode`);
    }

    // Toggle voice input
    toggleVoiceInput() {
        if (window.voiceHandler) {
            window.voiceHandler.toggleVoiceInput();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LuxAI();
});
// Mobile menu fix
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");

mobileMenuBtn.addEventListener("click", () => {

    if (sidebar.classList.contains("-translate-x-full")) {
        sidebar.classList.remove("-translate-x-full");
    } else {
        sidebar.classList.add("-translate-x-full");
    }

});
// Sidebar close button ( >> )
const collapseSidebar = document.getElementById("collapseSidebar");

collapseSidebar.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
});