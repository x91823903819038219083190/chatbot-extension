// background.js
// Securely performs API calls using the API key stored in chrome.storage.local.
// Receives messages from content scripts: { action: "chatRequest", prompt: "..." }
// Returns { reply: "..."} or { error: "..." }

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "chatRequest") {
    chrome.storage.local.get(['apiKey','apiUrl','model'], ({apiKey, apiUrl, model}) => {
      if (!apiKey) {
        sendResponse({ error: 'No API key set. Open the extension popup and save your API key.' });
        return;
      }

      apiUrl = apiUrl || 'https://api.openai.com/v1/chat/completions';
      model = model || 'gpt-4o-mini';

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      };

      let body;
      // If the target looks like OpenAI, format as chat.completions
      if (apiUrl.includes('openai.com')) {
        body = JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: request.prompt }]
        });
      } else {
        // Generic API shape (you can adapt this to your API)
        body = JSON.stringify({ prompt: request.prompt });
      }

      fetch(apiUrl, { method: 'POST', headers, body })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error('HTTP ' + res.status + ': ' + text);
          }
          return res.json();
        })
        .then((data) => {
          let reply = '';
          if (apiUrl.includes('openai.com')) {
            // Try to extract OpenAI-style reply
            reply = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
          } else {
            // Try common shapes: { reply } or raw
            reply = data?.reply || (typeof data === 'string' ? data : JSON.stringify(data));
          }
          sendResponse({ reply });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
    });
    // Keep the message channel open for async response
    return true;
  }
});

/* ICONS */
chrome.runtime.onInstalled.addListener(() => {
  // Default to white icons (good for dark toolbars)
  chrome.action.setIcon({
    path: {
      16: "icon_white_16.png",
      48: "icon_white_48.png",
      128: "icon_white_128.png"
    }
  });
});

// Optional: detect theme changes (if you want to auto-switch)
chrome.runtime.onMessage.addListener((req) => {
  if (req.theme === "light") {
    chrome.action.setIcon({
      path: {
        16: "icon16.png",
        48: "icon48.png",
        128: "icon128.png"
      }
    });
  }
  if (req.theme === "dark") {
    chrome.action.setIcon({
      path: {
        16: "icon_white_16.png",
        48: "icon_white_48.png",
        128: "icon_white_128.png"
      }
    });
  }
});

