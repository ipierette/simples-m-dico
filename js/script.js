const CONFIG = {
    N8N_WEBHOOK_URL: '/api/agendamento',
    TYPING_DELAY: 1000,
    SESSION_STORAGE_KEY: 'chatSessionId',
    MESSAGES: {
        ERROR: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
        FALLBACK: 'Obrigado pela sua mensagem! Nossa equipe irá processar seu agendamento em breve. Em caso de urgência, ligue para (11) 3456-7890.',
        EMPTY_INPUT: 'Por favor, digite uma mensagem antes de enviar.'
    }
};

const DOM = {
    mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
    navLinks: document.querySelector('.nav-links'),
    navLinkItems: document.querySelectorAll('.nav-link'),
    chatBox: document.getElementById('chatBox'),
    chatInput: document.getElementById('chatInput'),
    chatForm: document.getElementById('chatForm'),
    typingIndicator: document.getElementById('typingIndicator')
};

class ChatManager {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.isProcessing = false;
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(CONFIG.SESSION_STORAGE_KEY, sessionId);
        }
        return sessionId;
    }

    addMessage(text, sender) {
        if (!text || !sender) {
            console.error('Parâmetros inválidos para addMessage');
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${sender}`;
        messageDiv.textContent = text;
        messageDiv.setAttribute('role', sender === 'bot' ? 'status' : 'log');

        DOM.chatBox.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        DOM.chatBox.scrollTop = DOM.chatBox.scrollHeight;
    }

    showTypingIndicator() {
        DOM.typingIndicator.classList.add('active');
        DOM.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        DOM.typingIndicator.classList.remove('active');
        DOM.typingIndicator.style.display = 'none';
    }

    async sendToN8N(message) {
        const payload = {
            message: message,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: 'agendamento'
        };

        const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async processMessage(message) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        this.addMessage(message, 'user');
        this.showTypingIndicator();

        try {
            const data = await this.sendToN8N(message);
            this.hideTypingIndicator();
            if (data && data.response) {
                this.addMessage(data.response, 'bot');
            } else {
                this.addMessage(CONFIG.MESSAGES.ERROR, 'bot');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            await this.delay(CONFIG.TYPING_DELAY);
            this.hideTypingIndicator();
            this.addMessage(CONFIG.MESSAGES.FALLBACK, 'bot');
        } finally {
            this.isProcessing = false;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class NavigationManager {
    constructor() { this.isMenuOpen = false; }
    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        DOM.navLinks.classList.toggle('active');
        DOM.mobileMenuToggle.setAttribute('aria-expanded', this.isMenuOpen);
        DOM.mobileMenuToggle.setAttribute('aria-label', this.isMenuOpen ? 'Fechar menu' : 'Abrir menu');
    }
    closeMobileMenu() {
        this.isMenuOpen = false;
        DOM.navLinks.classList.remove('active');
        DOM.mobileMenuToggle.setAttribute('aria-expanded', 'false');
        DOM.mobileMenuToggle.setAttribute('aria-label', 'Abrir menu');
    }
    setupSmoothScroll() {
        DOM.navLinkItems.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        this.closeMobileMenu();
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        history.pushState(null, '', href);
                        target.focus({ preventScroll: true });
                    }
                }
            });
        });
    }
}

class App {
    constructor() {
        this.chatManager = new ChatManager();
        this.navigationManager = new NavigationManager();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAccessibility();
        this.navigationManager.setupSmoothScroll();
        console.log('Site carregado com sucesso! ✅');
    }

    setupEventListeners() {
        if (DOM.chatForm) {
            DOM.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleChatSubmit();
            });
        }

        if (DOM.mobileMenuToggle) {
            DOM.mobileMenuToggle.addEventListener('click', () => {
                this.navigationManager.toggleMobileMenu();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.navigationManager.isMenuOpen && !DOM.mobileMenuToggle.contains(e.target) && !DOM.navLinks.contains(e.target)) {
                this.navigationManager.closeMobileMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.navigationManager.isMenuOpen) {
                this.navigationManager.closeMobileMenu();
                DOM.mobileMenuToggle.focus();
            }
        });

        this.preventIOSZoom();
    }

    handleChatSubmit() {
        const message = DOM.chatInput.value.trim();
        if (!message) {
            alert(CONFIG.MESSAGES.EMPTY_INPUT);
            return;
        }
        DOM.chatInput.value = '';
        this.chatManager.processMessage(message);
    }

    setupAccessibility() {
        this.addSkipLink();
        if (DOM.chatInput) {
            DOM.chatInput.addEventListener('focus', () => {
                DOM.chatBox.setAttribute('aria-live', 'polite');
            });
        }
    }

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#sobre';
        skipLink.className = 'sr-only';
        skipLink.textContent = 'Pular para o conteúdo principal';
        skipLink.style.cssText = `position: absolute; top: -40px; left: 0; background: var(--color-primary); color: white; padding: 8px; text-decoration: none; z-index: 10000;`;
        skipLink.addEventListener('focus', () => { skipLink.style.top = '0'; });
        skipLink.addEventListener('blur', () => { skipLink.style.top = '-40px'; });
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    preventIOSZoom() {
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { new App(); });
} else { new App(); }

// export { ChatManager, NavigationManager, App };