// Chat Management Module
class ChatManager {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.setupMarkdown();
        this.setupCodeHighlighting();
    }

    // Setup marked.js for markdown rendering
    setupMarkdown() {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false,
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (e) {}
                }
                return code;
            }
        });
    }

    // Setup code highlighting
    setupCodeHighlighting() {
        hljs.configure({
            ignoreUnescapedHTML: true,
            throwUnescapedHTML: false
        });
    }

    // Add copy buttons to code blocks
    addCopyButtonsToCodeBlocks() {
        document.querySelectorAll('pre').forEach(pre => {
            if (pre.querySelector('.copy-btn')) return;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => {
                const code = pre.querySelector('code');
                const text = code ? code.textContent : pre.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy';
                    }, 2000);
                });
            });
            
            pre.style.position = 'relative';
            pre.appendChild(copyBtn);
        });
    }

    // Stream text effect
    async streamText(element, text, speed = 30) {
        element.textContent = '';
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, speed));
            this.app.scrollToBottom();
        }
    }

    // Parse and format timestamp
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // Generate unique message ID
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Save message to chat history
    saveMessage(chatId, message) {
        if (this.app.chats[chatId]) {
            this.app.chats[chatId].messages.push(message);
            this.app.saveChats();
        }
    }

    // Update message in chat history
    updateMessage(chatId, messageId, updates) {
        if (this.app.chats[chatId]) {
            const messages = this.app.chats[chatId].messages;
            const index = messages.findIndex(m => m.id === messageId);
            if (index !== -1) {
                messages[index] = { ...messages[index], ...updates };
                this.app.saveChats();
            }
        }
    }

    // Delete message from chat history
    deleteMessage(chatId, messageId) {
        if (this.app.chats[chatId]) {
            this.app.chats[chatId].messages = this.app.chats[chatId].messages.filter(m => m.id !== messageId);
            this.app.saveChats();
        }
    }

    // Get chat statistics
    getChatStats(chatId) {
        if (!this.app.chats[chatId]) return null;
        
        const chat = this.app.chats[chatId];
        const messages = chat.messages;
        
        return {
            totalMessages: messages.length,
            userMessages: messages.filter(m => m.role === 'user').length,
            aiMessages: messages.filter(m => m.role === 'assistant').length,
            duration: new Date() - new Date(chat.createdAt),
            averageResponseTime: this.calculateAverageResponseTime(messages)
        };
    }

    // Calculate average response time
    calculateAverageResponseTime(messages) {
        let totalTime = 0;
        let pairs = 0;
        
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].role === 'assistant' && messages[i-1].role === 'user') {
                const time = new Date(messages[i].timestamp) - new Date(messages[i-1].timestamp);
                totalTime += time;
                pairs++;
            }
        }
        
        return pairs > 0 ? totalTime / pairs : 0;
    }

    // Export chat
    exportChat(chatId, format = 'json') {
        if (!this.app.chats[chatId]) return null;
        
        const chat = this.app.chats[chatId];
        
        switch (format) {
            case 'json':
                return JSON.stringify(chat, null, 2);
            case 'text':
                return chat.messages.map(m => {
                    const role = m.role === 'user' ? 'User' : 'AI';
                    return `${role}: ${m.content}\n`;
                }).join('\n');
            case 'markdown':
                return `# ${chat.title}\n\n` + chat.messages.map(m => {
                    const role = m.role === 'user' ? '**User**' : '**AI**';
                    return `${role}:\n${m.content}\n\n---\n`;
                }).join('\n');
            default:
                return null;
        }
    }

    // Import chat
    importChat(chatData) {
        try {
            const chat = typeof chatData === 'string' ? JSON.parse(chatData) : chatData;
            
            if (!chat.id || !chat.messages) {
                throw new Error('Invalid chat data');
            }
            
            this.app.chats[chat.id] = chat;
            this.app.saveChats();
            this.app.renderChatHistory();
            
            return true;
        } catch (error) {
            console.error('Failed to import chat:', error);
            return false;
        }
    }

    // Search messages in current chat
    searchMessages(query) {
        if (!this.app.messages.length) return [];
        
        const results = [];
        const searchQuery = query.toLowerCase();
        
        this.app.messages.forEach((message, index) => {
            if (message.content.toLowerCase().includes(searchQuery)) {
                results.push({
                    messageIndex: index,
                    message: message,
                    preview: this.getSearchPreview(message.content, searchQuery)
                });
            }
        });
        
        return results;
    }

    // Get search preview
    getSearchPreview(content, query) {
        const index = content.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, index - 40);
        const end = Math.min(content.length, index + query.length + 40);
        let preview = content.substring(start, end);
        
        if (start > 0) preview = '...' + preview;
        if (end < content.length) preview = preview + '...';
        
        return preview;
    }
}

// Initialize chat manager
const chatManager = new ChatManager(window.app);