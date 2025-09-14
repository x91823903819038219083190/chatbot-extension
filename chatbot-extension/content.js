/* content.js - chatbot sidebar with secure background fetch */

// Avoid injecting multiple times
if (!window.__api_test_sidebar_injected) {
  window.__api_test_sidebar_injected = true;

  // Inject stylesheet
  const cssId = 'api-test-sidebar-style';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles.css');
    document.head.appendChild(link);
  }

  // Create sidebar if not exists
  let sidebar = document.getElementById('my-extension-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'my-extension-sidebar';
    sidebar.innerHTML = `
      <div id="sidebar-inner">
        <div id="header"><h2>🤖 Chatbot</h2></div>
        <div id="chatContainer" role="log" aria-live="polite"></div>
        <textarea id="userInput" placeholder="Ask me about this page..." rows="3"></textarea>
        <button id="sendBtn">Send</button>
      </div>
    `;
    document.body.appendChild(sidebar);
  }

  // Create toggle button if not exists
  let toggleBtn = document.getElementById('my-extension-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('div');
    toggleBtn.id = 'my-extension-toggle';
    toggleBtn.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(toggleBtn);
  }

  // Toggle sidebar
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    toggleBtn.classList.toggle('active');
    if (sidebar.classList.contains('open')) {
      setTimeout(() => document.getElementById('userInput').focus(), 150);
    }
  });

  // Element refs
  const sendBtn = document.getElementById('sendBtn');
  const userInput = document.getElementById('userInput');
  const chatContainer = document.getElementById('chatContainer');

  // Click to send
  sendBtn.addEventListener('click', () => {
    const prompt = userInput.value.trim();
    if (!prompt) return;
    appendMessage('user', prompt);
    userInput.value = '';
    userInput.focus();
    sendChatPrompt(prompt);
  });

  // Enter to send (Shift+Enter = newline)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // Append message
  function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    msg.textContent = text;
    chatContainer.appendChild(msg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Append typing indicator, returns node
  function appendTyping() {
    const t = document.createElement('div');
    t.className = 'message bot typing';
    t.textContent = '… waiting for background response …';
    chatContainer.appendChild(t);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return t;
  }

  // Send prompt to background and handle response
  function sendChatPrompt(prompt) {
    const typingNode = appendTyping();

    chrome.runtime.sendMessage({ action: 'chatRequest', prompt }, (response) => {
      // remove typing node
      if (typingNode && typingNode.parentNode) typingNode.parentNode.removeChild(typingNode);

      if (!response) {
        appendMessage('bot', 'No response (message channel error). Check background console.');
        return;
      }
      if (response.error) {
        appendMessage('bot', 'ERROR: ' + response.error);
      } else {
        appendMessage('bot', response.reply);
      }
    });
  }
}


