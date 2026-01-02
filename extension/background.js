// Glana Background Service Worker

const DEFAULT_API_URL = 'http://localhost:3001/api';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveTweet') {
    handleSaveTweet(request.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Indique une réponse async
  }
});

async function handleSaveTweet(tweetData) {
  const { apiKey, apiUrl } = await chrome.storage.sync.get(['apiKey', 'apiUrl']);

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const baseUrl = apiUrl || DEFAULT_API_URL;

  const response = await fetch(`${baseUrl}/tweets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(tweetData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, data };
}
