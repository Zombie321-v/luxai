// Custom Command System
class CommandHandler {
    constructor() {
        this.commands = {
            '/help': {
                handler: this.showHelp.bind(this),
                description: 'Show all available commands'
            },
            '/owner': {
                handler: this.showOwner.bind(this),
                description: 'Display owner information'
            },
            '/about': {
                handler: this.showAbout.bind(this),
                description: 'Information about LuxAI'
            },
            '/clear': {
                handler: this.clearChat.bind(this),
                description: 'Clear current chat'
            },
            '/new': {
                handler: this.newChat.bind(this),
                description: 'Create a new chat'
            },
            '/image': {
                handler: this.generateImage.bind(this),
                description: 'Generate an image. Usage: /image [prompt]'
            },
            '/time': {
                handler: this.showTime.bind(this),
                description: 'Show current time'
            },
            '/date': {
                handler: this.showDate.bind(this),
                description: 'Show current date'
            },
            '/models': {
                handler: this.showModels.bind(this),
                description: 'Show available AI models'
            },
            '/voice': {
                handler: this.toggleVoice.bind(this),
                description: 'Enable or disable voice mode'
            },
            '/theme': {
                handler: this.switchTheme.bind(this),
                description: 'Switch theme (dark/light)'
            },
            '/history': {
                handler: this.showHistory.bind(this),
                description: 'Show saved chats'
            },
            '/random': {
                handler: this.randomPrompt.bind(this),
                description: 'Get random prompt suggestions'
            },
            '/stats': {
                handler: this.showStats.bind(this),
                description: 'Show chat statistics'
            },
            '/export': {
                handler: this.exportChat.bind(this),
                description: 'Export current chat. Usage: /export [json|text|markdown]'
            }
        };
        
        this.randomPrompts = [
            "Write a poem about artificial intelligence",
            "Explain the theory of relativity in simple terms",
            "Create a recipe for a futuristic dish",
            "Design a new superhero character",
            "Write a short story about time travel",
            "Explain how blockchain technology works",
            "Create a workout plan for beginners",
            "Write a business proposal template",
            "Explain the concept of mindfulness",
            "Create a travel itinerary for Japan",
            "Write code for a simple web application",
            "Explain the importance of cybersecurity",
            "Create a study plan for learning a new language",
            "Write a movie script scene",
            "Explain how to start a successful blog"
        ];
    }

    // Check if message is a command
    isCommand(message) {
        return message.trim().startsWith('/');
    }

    // Execute command
    async execute(command, fullMessage = '') {
        const cmd = command.toLowerCase().split(' ')[0];
        
        if (this.commands[cmd]) {
            await this.commands[cmd].handler(fullMessage);
            return true;
        } else {
            return false;
        }
    }

    // Show help command
    async showHelp() {
        let helpText = "# 📋 Available Commands\n\n";
        
        Object.entries(this.commands).forEach(([cmd, info]) => {
            helpText += `**${cmd}** - ${info.description}\n\n`;
        });
        
        helpText += "\n---\n*Type any command to execute it. For example: /help*";
        
        this.addSystemMessage(helpText);
    }

   // Show owner command
async showOwner() {
    const ownerInfo = `
# 👑 Owner Information

**Owner:** Mohsin  
**Developer:** Mohsin  
**Role:** Full Stack Developer & AI Enthusiast  
**Project:** LuxAI - Premium AI Chatbot  
**Version:** v2.1.0  
**Technology Stack:** HTML, Tailwind CSS, JavaScript, PHP, AI APIs  

---

### 🚀 About Owner
Passionate about creating modern AI experiences with premium UI/UX, animations, and smart interactive systems.

### ✨ Special Interests
• Artificial Intelligence  
• Web Development  
• UI/UX Design  
• Automation Systems  
• Premium Frontend Experiences  

---

*"Building the future with code and creativity."*
    `;
    
    this.addSystemMessage(ownerInfo);
}

    // Show about command
    async showAbout() {
        const aboutInfo = `
# ℹ️ About LuxAI

**LuxAI** is a premium AI chatbot powered by multiple advanced language models including DeepSeek, Copilot, ChatGPT, and Nemotron.

**Features:**
- 🎨 Premium UI/UX Design
- 🚀 Multiple AI Models
- 🎤 Voice Input/Output
- 🖼️ AI Image Generation
- 💾 Chat History & Management
- 🎯 Custom Commands
- 🌙 Dark/Light Theme

**Version:** 2.1.0  
**Technology:** HTML, Tailwind CSS, JavaScript, PHP

---
*Experience the future of AI conversation*
        `;
        
        this.addSystemMessage(aboutInfo);
    }

    // Clear chat command
    async clearChat() {
        if (window.app) {
            window.app.messages = [];
            window.app.clearChatArea();
            window.app.showWelcomeScreen();
            
            if (window.app.currentChatId && window.app.chats[window.app.currentChatId]) {
                window.app.chats[window.app.currentChatId].messages = [];
                window.app.saveChats();
            }
            
            window.app.showToast('Chat cleared successfully');
        }
    }

    // New chat command
    async newChat() {
        if (window.app) {
            window.app.createNewChat();
            window.app.showToast('New chat created');
        }
    }

    // Generate image command
    async generateImage(fullMessage) {
        const prompt = fullMessage.replace('/image', '').trim();
        
        if (!prompt) {
            this.addSystemMessage('⚠️ Please provide a prompt for image generation.\n\n**Usage:** `/image a beautiful sunset over mountains`');
            return;
        }
        
        // Open image modal
        const imageModal = document.getElementById('imageModal');
        const imagePrompt = document.getElementById('imagePrompt');
        
        if (imageModal && imagePrompt) {
            imagePrompt.value = prompt;
            imageModal.classList.remove('hidden');
            
            // Auto-generate
            setTimeout(() => {
                document.getElementById('generateImageBtn')?.click();
            }, 500);
        }
    }

    // Show time command
    async showTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
        
        this.addSystemMessage(`# 🕐 Current Time\n\n**${timeString}**`);
    }

    // Show date command
    async showDate() {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        this.addSystemMessage(`# 📅 Current Date\n\n**${dateString}**`);
    }

    // Show models command
    async showModels() {
        const modelsInfo = `
# 🤖 Available AI Models

| Model | Description | Status |
|-------|-------------|--------|
| **DeepSeek V3** | Fast and efficient AI model | 🟢 Active |
| **Copilot** | Smart assistant with code expertise | 🟢 Active |
| **ChatGPT** | Advanced conversational AI | 🟢 Active |
| **Nemotron** | Powerful language model | 🟢 Active |

**Current Model:** ${window.app ? window.app.getModelDisplayName(window.app.currentModel) : 'DeepSeek V3'}

---
*Switch models using the dropdown in the top bar*
        `;
        
        this.addSystemMessage(modelsInfo);
    }

    // Toggle voice command
    async toggleVoice() {
        if (window.voiceHandler) {
            window.app.voiceEnabled = !window.app.voiceEnabled;
            const status = window.app.voiceEnabled ? 'enabled' : 'disabled';
            
            this.addSystemMessage(`# 🎤 Voice Mode\n\nVoice mode has been **${status}**.\n\n${window.app.voiceEnabled ? 'You can now use the microphone button to input voice commands.' : 'Voice input has been turned off.'}`);
            
            window.app.showToast(`Voice mode ${status}`);
        }
    }

    // Switch theme command
    async switchTheme() {
        if (window.app) {
            window.app.toggleTheme();
        }
    }

    // Show history command
    async showHistory() {
        if (!window.app || !window.app.chats) {
            this.addSystemMessage('No chat history available.');
            return;
        }
        
        const chats = Object.values(window.app.chats);
        
        if (chats.length === 0) {
            this.addSystemMessage('# 📚 Chat History\n\nNo saved chats found.');
            return;
        }
        
        let historyText = '# 📚 Chat History\n\n';
        
        chats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .forEach((chat, index) => {
                historyText += `${index + 1}. **${chat.title}** - ${chat.messages.length} messages\n`;
                historyText += `   Model: ${window.app.getModelDisplayName(chat.model)}\n`;
                historyText += `   Created: ${new Date(chat.createdAt).toLocaleDateString()}\n\n`;
            });
        
        this.addSystemMessage(historyText);
    }

    // Random prompt command
    async randomPrompt() {
        const randomIndex = Math.floor(Math.random() * this.randomPrompts.length);
        const prompt = this.randomPrompts[randomIndex];
        
        const promptList = this.randomPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n');
        
        const message = `
# 🎲 Random Prompt Suggestion

**Try this:** *${prompt}*

---

### More Suggestions:
${promptList}

---
*Click on any suggestion or type it to start a conversation*
        `;
        
        this.addSystemMessage(message);
    }

    // Show stats command
    async showStats() {
        if (!window.app) return;
        
        let statsText = '# 📊 Chat Statistics\n\n';
        
        // Global stats
        const totalChats = Object.keys(window.app.chats).length;
        const totalMessages = Object.values(window.app.chats).reduce((sum, chat) => sum + chat.messages.length, 0);
        
        statsText += `**Total Chats:** ${totalChats}\n`;
        statsText += `**Total Messages:** ${totalMessages}\n`;
        
        // Current chat stats
        if (window.app.currentChatId && window.app.chats[window.app.currentChatId]) {
            const chatStats = chatManager.getChatStats(window.app.currentChatId);
            if (chatStats) {
                statsText += `\n**Current Chat:**\n`;
                statsText += `- Messages: ${chatStats.totalMessages}\n`;
                statsText += `- User Messages: ${chatStats.userMessages}\n`;
                statsText += `- AI Messages: ${chatStats.aiMessages}\n`;
                statsText += `- Chat Duration: ${Math.floor(chatStats.duration / 60000)} minutes\n`;
            }
        }
        
        statsText += `\n**Current Model:** ${window.app.getModelDisplayName(window.app.currentModel)}\n`;
        statsText += `**Theme:** ${window.app.currentTheme}\n`;
        statsText += `**Voice:** ${window.app.voiceEnabled ? 'Enabled' : 'Disabled'}\n`;
        
        this.addSystemMessage(statsText);
    }

    // Export chat command
    async exportChat(fullMessage) {
        if (!window.app || !window.app.currentChatId) {
            this.addSystemMessage('⚠️ No active chat to export.');
            return;
        }
        
        const parts = fullMessage.split(' ');
        const format = parts[1] || 'json';
        
        if (!['json', 'text', 'markdown'].includes(format)) {
            this.addSystemMessage('⚠️ Invalid format. Use: `/export json`, `/export text`, or `/export markdown`');
            return;
        }
        
        const exportedData = chatManager.exportChat(window.app.currentChatId, format);
        
        if (exportedData) {
            // Create download link
            const blob = new Blob([exportedData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-export.${format === 'markdown' ? 'md' : format}`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.addSystemMessage(`# 💾 Chat Exported\n\nChat has been exported as **${format.toUpperCase()}** format. Check your downloads.`);
        } else {
            this.addSystemMessage('❌ Failed to export chat.');
        }
    }

    // Add system message to chat
    addSystemMessage(content) {
        if (!window.app) return;
        
        const systemMessage = {
            id: 'sys_' + Date.now(),
            role: 'assistant',
            content: content,
            timestamp: new Date().toISOString(),
            isSystem: true
        };
        
        window.app.messages.push(systemMessage);
        window.app.renderMessage(systemMessage);
        
        if (window.app.currentChatId && window.app.chats[window.app.currentChatId]) {
            window.app.chats[window.app.currentChatId].messages = window.app.messages;
            window.app.saveChats();
        }
    }

    // Get command suggestions
    getSuggestions(partial) {
        if (!partial.startsWith('/')) return [];
        
        return Object.keys(this.commands).filter(cmd => 
            cmd.startsWith(partial.toLowerCase())
        );
    }
}

// Initialize command handler
window.commandHandler = new CommandHandler();

// Override sendMessage in app to handle commands
const originalSendMessage = LuxAI.prototype.sendMessage;
LuxAI.prototype.sendMessage = async function(message) {
    if (window.commandHandler && window.commandHandler.isCommand(message)) {
        const executed = await window.commandHandler.execute(message);
        if (executed) {
            document.getElementById('messageInput').value = '';
            this.autoResizeTextarea();
            return;
        }
    }
    
    // If not a command, proceed with normal message sending
    await originalSendMessage.call(this, message);
};