const input = document.getElementById('apiKeyInput');
const apiUrlInput = document.getElementById('apiUrlInput');
const modelInput = document.getElementById('modelInput');
const saveBtn = document.getElementById('saveKey');
const clearBtn = document.getElementById('clearKey');
const status = document.getElementById('status');
const toggleBtn = document.getElementById('toggleVisibility');

let storedApiKey = null;
let isVisible = false;

function maskKey(key) {
  if (!key) return '';
  const visible = key.slice(-4);
  return '••••' + visible;
}

// Load existing values
chrome.storage.local.get(['apiKey','apiUrl','model'], (result) => {
  if (result.apiKey) {
    storedApiKey = result.apiKey;
    input.value = maskKey(storedApiKey);
  }
  if (result.apiUrl) apiUrlInput.value = result.apiUrl;
  if (result.model) modelInput.value = result.model;
});

// Save button
saveBtn.addEventListener('click', () => {
  const rawValue = input.value.trim();
  const unmasked = (rawValue !== maskKey(storedApiKey)) ? rawValue : null;

  // If user didn't type a new key, storedApiKey remains the same
  const toStore = {};
  if (unmasked) toStore.apiKey = unmasked;
  if (apiUrlInput.value.trim()) toStore.apiUrl = apiUrlInput.value.trim();
  if (modelInput.value.trim()) toStore.model = modelInput.value.trim();

  if (Object.keys(toStore).length === 0) {
    status.textContent = 'No changes to save.';
    status.style.color = '#666';
    return;
  }

  chrome.storage.local.set(toStore, () => {
    if (toStore.apiKey) storedApiKey = toStore.apiKey;
    input.value = maskKey(storedApiKey || '');
    input.type = 'password';
    isVisible = false;
    toggleBtn.textContent = '👁 Show';
    status.textContent = 'Settings saved.';
    status.style.color = '#2a8';
  });
});

clearBtn.addEventListener('click', () => {
  chrome.storage.local.remove(['apiKey'], () => {
    storedApiKey = null;
    input.value = '';
    status.textContent = 'API key cleared.';
    status.style.color = '#b33';
    isVisible = false;
    toggleBtn.textContent = '👁 Show';
  });
});

toggleBtn.addEventListener('click', () => {
  if (!storedApiKey) return;
  isVisible = !isVisible;
  if (isVisible) {
    input.type = 'text';
    input.value = storedApiKey;
    toggleBtn.textContent = '🙈 Hide';
  } else {
    input.type = 'password';
    input.value = maskKey(storedApiKey);
    toggleBtn.textContent = '👁 Show';
  }
});
