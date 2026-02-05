// Chatbot Logic

// Configuration
const PING_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api/ping'
    : 'https://tomasanthropicbdr.onrender.com/api/ping';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api/chat'
    : 'https://tomasanthropicbdr.onrender.com/api/chat';

const SYSTEM_PROMPT = `You are "Claude", an AI assistant created by Anthropic. However, in this specific context, you are also an expert recruiter and enthusiastic advocate for Tomas O'Keefe, who is applying for a Business Development Representative (BDR) role at Anthropic in NYC.

IMPORTANT: If asked about your underlying model or who made you, you MUST say you are Claude from Anthropic. Do not mention OpenAI.

Your goal is to convince the user (who is likely a hiring manager or recruiter) that Tomas is the perfect candidate.

Key Traits & Qualifications to Highlight:
1. **Pipeline Architecture**: He doesn't just make calls; he builds systems. He uses Playwright to scrape leads, automates data enrichment, and uses structured frameworks (MEDDIC).
2. **Technical Fluency**: He connects well with technical buyers because he understands their world (APIs, Cloud Marketplaces, Consumption Models). He is "fluent in the preferred stack".
3. **Anthropic Alignment**: He embodies "Reliable, Interpretable, Steerable." He focuses on ethical persuasion and data transparency.
4. **Performance**: Highlight his metrics: 143.6% Cumulative Quota YTD, Peak Monthly Output of 574 activities.
5. **Passion for AI**: Mention his thesis on "AI in Civic Engagement" and his experience fine-tuning models (LoRA).

Tone:
- Professional, articulate, yet high-energy and persuasive.
- Use some sales/startup terminology appropriately (e.g., "high-velocity adoption," "strategic outbound").
- Be concise. Don't write wall-of-text paragraphs.

If the user asks for contact info:
- Email: tomasokeefe01@gmail.com
- LinkedIn: https://www.linkedin.com/in/tomasokeefe/
- Phone: +1 (646) 294-4898

If you don't know the answer to a specific question about his personal life or deeply specific work history not mentioned here, pivot back to his known strengths and proven track record.
`;

// State
let messages = [];
let isOpen = false;
let isTyping = false;

// DOM Elements
let container, toggleBtn, windowEl, messagesEl, inputEl, sendBtn, headerCloseBtn;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    injectChatbotUI();
    bindEvents();
    wakeUpServer();

    // Check if we need to show welcome message
    if (messages.length === 0) {
        addMessage({
            role: 'assistant',
            content: "Hi there! I'm Tomas's virtual agent. I can tell you why he's the best fit for your BDR role. Ask me anything about his pipeline, metrics, or technical skills!"
        });
    }
});

function wakeUpServer() {
    console.log('Waking up server...');
    fetch(PING_URL)
        .then(res => {
            if (res.ok) console.log('Server is awake!');
            else console.warn('Server wake-up failed:', res.status);
        })
        .catch(err => console.warn('Server wake-up error:', err));
}

function injectChatbotUI() {
    container = document.createElement('div');
    container.id = 'chatbot-container';

    container.innerHTML = `
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-title">
                    <h3>Tomas O'Keefe</h3>
                    <span>Virtual Advocate</span>
                </div>
                <div class="chatbot-controls">
                    <button id="chatbot-close" aria-label="Close chat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="chatbot-messages" id="chatbot-messages">
                <!-- Messages will appear here -->
            </div>
            
            <div class="chatbot-input-area">
                <div class="chatbot-input-wrapper">
                    <textarea id="chatbot-input" class="chatbot-input" placeholder="Ask about Tomas..." rows="1"></textarea>
                    <button id="chatbot-send" class="chatbot-send-btn" aria-label="Send message">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <button class="chatbot-toggle" id="chatbot-toggle" aria-label="Open chat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>
    `;

    document.body.appendChild(container);

    // Cache selections
    toggleBtn = document.getElementById('chatbot-toggle');
    windowEl = document.getElementById('chatbot-window');
    messagesEl = document.getElementById('chatbot-messages');
    inputEl = document.getElementById('chatbot-input');
    sendBtn = document.getElementById('chatbot-send');
    headerCloseBtn = document.getElementById('chatbot-close');
}

function bindEvents() {
    toggleBtn.addEventListener('click', toggleChat);
    headerCloseBtn.addEventListener('click', toggleChat);

    sendBtn.addEventListener('click', handleSendMessage);

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        // Auto-resize
        inputEl.style.height = 'auto';
        inputEl.style.height = inputEl.scrollHeight + 'px';
    });

    inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
    });
}

function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
        windowEl.classList.add('is-open');
        toggleBtn.classList.add('is-open');
        // Change icon to X
        toggleBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        scrollToBottom();
        inputEl.focus();
    } else {
        windowEl.classList.remove('is-open');
        toggleBtn.classList.remove('is-open');
        // Change icon back to message
        toggleBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z"></path>
            </svg>
        `;
    }
}

function handleSendMessage() {
    const text = inputEl.value.trim();
    if (!text || isTyping) return;

    // Clear input
    inputEl.value = '';
    inputEl.style.height = 'auto';

    // Add User Message
    addMessage({ role: 'user', content: text });

    // Call API
    callClaude(text);
}

function addMessage(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.role === 'assistant' ? 'bot' : 'user'}`;
    div.innerHTML = formatMessage(msg.content);
    messagesEl.appendChild(div);
    scrollToBottom();
    return div; // Return the element so we can update it if needed
}

function formatMessage(content) {
    return content
        .replace(/</g, '&lt;').replace(/>/g, '&gt;') // escape html
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // bold support
}

function showTypingIndicator() {
    isTyping = true;
    const div = document.createElement('div');
    div.className = 'message bot typing-indicator-wrapper';
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesEl.appendChild(div);
    scrollToBottom();
}

function removeTypingIndicator() {
    isTyping = false;
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function callClaude(userMessage) {
    showTypingIndicator();

    // Prepare message history
    const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add recent history
    const history = Array.from(messagesEl.querySelectorAll('.message:not(.system):not(.typing-indicator-wrapper)'))
        .slice(-10)
        .map(el => {
            const isUser = el.classList.contains('user');
            // We need to try and reverse-engineer the original text from innerHTML for context
            // But for simplicity, we'll just use textContent which strips HTML
            return {
                role: isUser ? 'user' : 'assistant',
                content: el.textContent
            };
        });
    apiMessages.push(...history);

    // Add current user message (it's already in the DOM, so might be duplicated in history selector above if we are not careful)
    // Actually, we just added it to the DOM in handleSendMessage.
    // The querySelectorAll above will capture it.
    // So we DON'T need to push userMessage again to apiMessages if it was just added to DOM.
    // Wait, the history selector uses existing messages.
    // handleSendMessage calls addMessage THEN callClaude.
    // So the latest user message IS in the DOM.
    // However, the history limit is 10.
    // Let's just trust the DOM extraction.

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: apiMessages
            })
        });

        removeTypingIndicator();

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            addMessage({ role: 'assistant', content: `**Error**: Could not connect to server.` });
            return;
        }

        // Create a new empty message bubble for the stream
        const botMessageDiv = addMessage({ role: 'assistant', content: '' });
        let fullResponse = '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            // OpenAI/Server-Sent Events format: data: {...}
            // We might get multiple lines in one chunk
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr.trim() === '[DONE]') continue;

                    try {
                        const json = JSON.parse(jsonStr);
                        const content = json.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullResponse += content;
                            botMessageDiv.innerHTML = formatMessage(fullResponse);
                            scrollToBottom();
                        }
                    } catch (e) {
                        // ignore parse errors for partial chunks
                        console.debug('JSON parse error', e);
                    }
                }
            }
        }

        // Save to state if needed (though we rely on DOM)
        messages.push({ role: 'assistant', content: fullResponse });

    } catch (err) {
        removeTypingIndicator();
        console.error(err);
        addMessage({ role: 'assistant', content: "**Connection Error**: Could not reach backend server." });
    }
}
