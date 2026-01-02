// Glana Popup Script

const DEFAULT_API_URL = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const apiUrlInput = document.getElementById('apiUrl');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');
  const statsDiv = document.getElementById('stats');
  const dashboardLink = document.getElementById('dashboardLink');

  // Charger la configuration existante
  const { apiKey, apiUrl } = await chrome.storage.sync.get(['apiKey', 'apiUrl']);

  if (apiKey) {
    apiKeyInput.value = apiKey;
    loadStats(apiKey, apiUrl);
  }

  if (apiUrl) {
    apiUrlInput.value = apiUrl;
  }

  // Mettre à jour le lien du dashboard
  const baseUrl = apiUrl || DEFAULT_API_URL;
  const dashboardUrl = baseUrl.replace('/api', '/dashboard');
  dashboardLink.href = dashboardUrl;

  // Sauvegarder la configuration
  saveButton.addEventListener('click', async () => {
    const newApiKey = apiKeyInput.value.trim();
    const newApiUrl = apiUrlInput.value.trim();

    if (!newApiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Testing...';

    // Tester la clé
    try {
      const testUrl = (newApiUrl || DEFAULT_API_URL) + '/stats';
      const response = await fetch(testUrl, {
        headers: { 'Authorization': `Bearer ${newApiKey}` }
      });

      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      await chrome.storage.sync.set({
        apiKey: newApiKey,
        apiUrl: newApiUrl || ''
      });

      showStatus('Configuration saved!', 'success');
      loadStats(newApiKey, newApiUrl);

      // Mettre à jour le lien du dashboard
      const baseUrl = newApiUrl || DEFAULT_API_URL;
      dashboardLink.href = baseUrl.replace('/api', '/dashboard');

    } catch (error) {
      showStatus(error.message, 'error');
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Configuration';
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status show ${type}`;

    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }

  async function loadStats(apiKey, apiUrl) {
    try {
      const statsUrl = (apiUrl || DEFAULT_API_URL) + '/stats';
      const response = await fetch(statsUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        document.getElementById('totalTweets').textContent = data.totalTweets || 0;
        document.getElementById('totalThemes').textContent = data.totalThemes || 0;
        statsDiv.classList.add('show');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
});
