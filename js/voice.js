// Voice Recognition and Synthesis Module
class VoiceHandler {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceEnabled = false;
        
        this.init();
    }

    init() {
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.setupRecognitionEvents();
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
        
        // Setup voice synthesis
        this.loadVoices();
    }

    // Setup speech recognition events
    setupRecognitionEvents() {
        if (!this.recognition) return;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceButton(true);
            console.log('Voice recognition started');
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButton(false);
            console.log('Voice recognition ended');
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update input field with transcript
            const input = document.getElementById('messageInput');
            if (input) {
                input.value = finalTranscript || interimTranscript;
                app.autoResizeTextarea();
            }
            
            // Auto-send if final transcript exists and is long enough
            if (finalTranscript && finalTranscript.trim().length > 0 && this.autoSend) {
                setTimeout(() => {
                    if (app && !app.isGenerating) {
                        app.sendMessage(finalTranscript.trim());
                    }
                }, 1000);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceButton(false);
            
            switch (event.error) {
                case 'not-allowed':
                    app.showToast('Microphone access denied');
                    break;
                case 'no-speech':
                    app.showToast('No speech detected');
                    break;
                case 'audio-capture':
                    app.showToast('No microphone found');
                    break;
                default:
                    app.showToast('Voice recognition error');
            }
        };
    }

    // Load available voices for speech synthesis
    loadVoices() {
        if (this.synthesis) {
            // Chrome loads voices asynchronously
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
            };
        }
    }

    // Toggle voice input
    toggleVoiceInput() {
        if (!this.recognition) {
            app.showToast('Voice input not supported in this browser');
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    // Start listening
    startListening() {
        if (!this.recognition || this.isListening) return;
        
        try {
            this.recognition.start();
            app.showToast('Listening... Speak now');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            app.showToast('Failed to start voice input');
        }
    }

    // Stop listening
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Failed to stop voice recognition:', error);
        }
    }

    // Update voice button state
    updateVoiceButton(isActive) {
        const voiceBtn = document.getElementById('voiceBtn');
        if (!voiceBtn) return;
        
        if (isActive) {
            voiceBtn.classList.add('voice-recording');
            voiceBtn.innerHTML = `
                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
            `;
        } else {
            voiceBtn.classList.remove('voice-recording');
            voiceBtn.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
            `;
        }
    }

    // Speak text
    speak(text) {
        if (!this.synthesis) return;
        
        // Stop any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Select best voice
        if (this.voices && this.voices.length > 0) {
            // Prefer English voices
            const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
        };
        
        this.synthesis.speak(utterance);
    }

    // Stop speaking
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    // Enable/disable auto-send after voice input
    setAutoSend(enabled) {
        this.autoSend = enabled;
    }

    // Check if browser supports voice features
    isVoiceSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
}

// Initialize voice handler
window.voiceHandler = new VoiceHandler();