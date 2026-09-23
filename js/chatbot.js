// Medi Chat Bot Logic - Advanced Upgrade
const MediChat = {
    isOpen: false,
    isTyping: false,
    history: [],
    doctors: [],
    context: {
        step: 'greeting',
        symptom: null,
        specialization: null
    },

    // Advanced Symptom-to-Specialization Mapping
    symptomMap: {
        'fever': 'General Physician',
        'cold': 'General Physician',
        'flu': 'General Physician',
        'cough': 'General Physician',
        'headache': 'Neurologist',
        'migraine': 'Neurologist',
        'dizziness': 'Neurologist',
        'chest pain': 'Cardiologist',
        'heart': 'Cardiologist',
        'palpitations': 'Cardiologist',
        'skin': 'Dermatologist',
        'rash': 'Dermatologist',
        'itching': 'Dermatologist',
        'acne': 'Dermatologist',
        'bone': 'Orthopedic',
        'joint': 'Orthopedic',
        'fracture': 'Orthopedic',
        'back pain': 'Orthopedic',
        'stomach': 'Gastroenterologist',
        'digestion': 'Gastroenterologist',
        'eye': 'Ophthalmologist',
        'vision': 'Ophthalmologist'
    },

    async init() {
        this.render();
        this.addEventListeners();
        await this.fetchDoctors();

        const welcomeMsg = "Hello! I'm Medi, your intelligent healthcare assistant. How can I help you today? I can guide you through symptoms, recommend specialists, or help you book appointments.";
        setTimeout(() => {
            this.addMessage('bot', welcomeMsg);
            this.showQuickSuggestions(['Symptom Check', 'Find Doctor', 'My Reports']);
        }, 1000);
    },

    async fetchDoctors() {
        try {
            // Local fallback if server fails
            const response = await fetch('/db.json').catch(() => null);
            if (response) {
                const data = await response.json();
                this.doctors = data.doctors || [];
            } else {
                // Fallback hardcoded for demo if fetch fails
                this.doctors = [
                    { name: "Dr. Sarah Wilson", specialization: "Cardiologist" },
                    { name: "Dr. John Smith", specialization: "Neurologist" }
                ];
            }
        } catch (error) {
            console.error("Error fetching doctors:", error);
        }
    },

    toggle() {
        // If on homepage, open dedicated full-screen Medi Assistant page
        try {
            const path = window.location.pathname || '';
            if (path === '/' || path.endsWith('/index.html')) {
                window.location.href = '/pages/medi-ai/chat.html';
                return;
            }
        } catch (e) {}

        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('medi-chat-window');
        const toggleBtn = document.getElementById('medi-chat-toggle');

        if (this.isOpen) {
            chatWindow.classList.add('open');
            toggleBtn.innerHTML = '<ion-icon name="close-outline"></ion-icon>';
        } else {
            chatWindow.classList.remove('open');
            toggleBtn.innerHTML = '<ion-icon name="chatbubbles-outline"></ion-icon>';
        }
    },

    addEventListeners() {
        const sendBtn = document.getElementById('medi-send-btn');
        const input = document.getElementById('medi-input');

        sendBtn.addEventListener('click', () => this.handleUserInput());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
    },

    handleUserInput(customText = null) {
        const input = document.getElementById('medi-input');
        const text = customText || input.value.trim();
        if (!text) return;

        if (!customText) input.value = '';
        this.addMessage('user', text);
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.processLogic(text.toLowerCase());
        }, 1200);
    },

    processLogic(input) {
        let response = "";
        let foundSymptom = false;

        // Context-aware logic
        if (this.context.step === 'awaiting_symptoms') {
            for (let s in this.symptomMap) {
                if (input.includes(s)) {
                    this.context.symptom = s;
                    this.context.specialization = this.symptomMap[s];
                    this.recommendDoctor(this.context.specialization);
                    return;
                }
            }
            response = "I see. To help you better, could you specify any other symptoms like fever, pain, or skin issues?";
            this.addMessage('bot', response);
            return;
        }

        // General Command Handling
        if (input.includes('hello') || input.includes('hi')) {
            response = "Hi there! I'm here to assist you. Are you experiencing any symptoms today?";
            this.showQuickSuggestions(['Yes, I have symptoms', 'Find a Doctor', 'No, just browsing']);
        } else if (input.includes('symptom') || input.includes('yes') || input.includes('feeling unwell')) {
            this.context.step = 'awaiting_symptoms';
            response = "I'm sorry to hear that. Please describe your symptoms (e.g., headache, chest pain, fever).";
            this.addMessage('bot', response);
        } else if (input.includes('appointment') || input.includes('book')) {
            response = "Click below to book an appointment with our available specialists.";
            this.addMessage('bot', response);
            this.addActionCard("Book Appointment", "pages/services/appointments.html", "calendar-outline");
        } else if (input.includes('doctor') || input.includes('specialist') || input.includes('find')) {
            response = "We have highly qualified specialists. What area of concern do you have?";
            this.addMessage('bot', response);
            this.showQuickSuggestions(['Cardiology', 'Neurology', 'Dermatology', 'General Checkup']);
        } else if (input.includes('report') || input.includes('result')) {
            response = "Access your medical reports securely here.";
            this.addMessage('bot', response);
            this.addActionCard("View Reports", "pages/services/view-reports.html", "document-text-outline");
        } else if (input.includes('emergency') || input.includes('help')) {
            response = "For medical emergencies, please call 911 immediately or visit the nearest ER.";
            this.addMessage('bot', response);
        } else {
            // Check for symptoms directly
            for (let s in this.symptomMap) {
                if (input.includes(s)) {
                    this.recommendDoctor(this.symptomMap[s]);
                    return;
                }
            }
            response = "I'm here to help! You can tell me about your symptoms, or ask about doctors and appointments.";
            this.addMessage('bot', response);
            this.showQuickSuggestions(['Symptom Check', 'Find Doctor', 'View Reports']);
        }

        if (response) {
            this.addMessage('bot', response);
        }
    },

    recommendDoctor(specialization) {
        const matches = this.doctors.filter(d => d.specialization === specialization);
        let response = `Based on your query, I recommend consulting a **${specialization}**. `;

        if (matches.length > 0) {
            response += `We have **${matches[0].name}** available. Would you like to schedule an appointment?`;
            this.addMessage('bot', response);
            const bookingUrl = `pages/services/appointments.html?doctor=${encodeURIComponent(matches[0].name)}&specialization=${encodeURIComponent(specialization)}`;
            this.addActionCard(`Book ${matches[0].name}`, bookingUrl, "person-add-outline");
        } else {
            response += `You can find available specialists in this department here.`;
            this.addMessage('bot', response);
            const findUrl = `pages/services/find-doctors.html?specialization=${encodeURIComponent(specialization)}`;
            this.addActionCard(`Find ${specialization}s`, findUrl, "search-outline");
        }

        // Reset context
        this.context.step = 'greeting';
    },

    addMessage(sender, text) {
        const chatBody = document.getElementById('medi-chat-body');
        const msgDiv = document.createElement('div');
        msgDiv.className = `medi-message ${sender}-message`;
        const paragraph = document.createElement('p');
        paragraph.textContent = String(text);
        msgDiv.appendChild(paragraph);
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    },

    showQuickSuggestions(suggestions) {
        const chatBody = document.getElementById('medi-chat-body');
        const suggestDiv = document.createElement('div');
        suggestDiv.className = 'medi-suggestions';
        suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'suggest-btn';
            btn.innerText = s;
            btn.onclick = () => this.handleUserInput(s);
            suggestDiv.appendChild(btn);
        });
        chatBody.appendChild(suggestDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    },

    addActionCard(text, url, icon = 'arrow-forward-outline') {
        const chatBody = document.getElementById('medi-chat-body');
        const card = document.createElement('div');
        card.className = 'medi-action-card';

        const content = document.createElement('div');
        content.className = 'card-content';

        const iconEl = document.createElement('ion-icon');
        iconEl.setAttribute('name', icon);
        const span = document.createElement('span');
        span.textContent = String(text);
        content.appendChild(iconEl);
        content.appendChild(span);

        const arrow = document.createElement('ion-icon');
        arrow.setAttribute('name', 'chevron-forward-outline');

        card.appendChild(content);
        card.appendChild(arrow);
        card.onclick = () => window.location.href = url;
        chatBody.appendChild(card);
        chatBody.scrollTop = chatBody.scrollHeight;
    },

    showTyping() {
        const chatBody = document.getElementById('medi-chat-body');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'medi-typing';
        typingDiv.className = 'medi-message bot-message typing';
        for (let index = 0; index < 3; index += 1) {
            const pulse = document.createElement('span');
            typingDiv.appendChild(pulse);
        }
        chatBody.appendChild(typingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        this.isTyping = true;
    },

    hideTyping() {
        if (this.isTyping) {
            const el = document.getElementById('medi-typing');
            if (el) el.remove();
            this.isTyping = false;
        }
    },

    render() {
        // Ensure only one container exists
        if (document.getElementById('medi-chat-container')) return;

        const container = document.createElement('div');
        container.id = 'medi-chat-container';
        container.innerHTML = `
            <div id="medi-chat-toggle" onclick="MediChat.toggle()">
                <ion-icon name="chatbubbles-outline"></ion-icon>
            </div>
            <div id="medi-chat-window">
                <div class="medi-chat-header">
                    <div class="header-info">
                        <div class="bot-avatar">
                            <ion-icon name="medical"></ion-icon>
                            <div class="online-indicator"></div>
                        </div>
                        <div class="bot-details">
                            <span class="bot-name">Medi Assistant</span>
                            <span class="bot-status">AI Support Online</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <ion-icon name="refresh-outline" onclick="location.reload()" title="Reset Chat"></ion-icon>
                        <ion-icon name="close-outline" onclick="MediChat.toggle()"></ion-icon>
                    </div>
                </div>
                <div id="medi-chat-body">
                    <div class="medi-disclaimer">
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        <span><strong>Disclaimer:</strong> I am an AI assistant. I do not provide medical diagnoses. For emergencies, call 911.</span>
                    </div>
                </div>
                <div class="medi-chat-input-area">
                    <div class="input-wrapper">
                        <input type="text" id="medi-input" placeholder="Ask about symptoms, doctors...">
                        <button id="medi-send-btn">
                            <ion-icon name="send"></ion-icon>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => MediChat.init());

