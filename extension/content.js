// Glana Content Script - Injecte le bouton de sauvegarde sur X.com

let API_KEY = '';

// Charger l'API key depuis le storage
chrome.storage.sync.get(['apiKey', 'apiUrl'], (result) => {
  API_KEY = result.apiKey || '';
});

// Écouter les changements de storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) {
    API_KEY = changes.apiKey.newValue || '';
  }
});

// Observer pour détecter les nouveaux tweets chargés
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        injectButtons(node);
      }
    });
  });
});

// Démarrer l'observation
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Injection initiale
setTimeout(() => injectButtons(document.body), 1000);

function injectButtons(root) {
  // Sélecteur pour les tweets (article avec data-testid="tweet")
  const tweets = root.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach((tweet) => {
    // Éviter double injection
    if (tweet.querySelector('.glana-btn')) return;

    // Trouver le groupe d'actions (like, retweet, etc.)
    const actionBar = tweet.querySelector('[role="group"]');
    if (!actionBar) return;

    // Créer le bouton
    const btn = document.createElement('button');
    btn.className = 'glana-btn';
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    btn.title = 'Save to Glana';

    // Event listener
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!API_KEY) {
        showNotification('Configure your API key in the Glana extension', 'error');
        return;
      }

      const tweetData = extractTweetData(tweet);
      if (!tweetData) {
        showNotification('Could not extract tweet data', 'error');
        return;
      }

      btn.classList.add('loading');

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'saveTweet',
          data: tweetData
        });

        if (response.success) {
          btn.classList.remove('loading');
          btn.classList.add('saved');
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          `;
          showNotification('Tweet saved!', 'success');
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        btn.classList.remove('loading');
        btn.classList.add('error');
        console.error('Glana Error:', error);
        showNotification(error.message || 'Failed to save tweet', 'error');
        setTimeout(() => btn.classList.remove('error'), 2000);
      }
    });

    // Insérer le bouton
    actionBar.appendChild(btn);
  });
}

function extractTweetData(tweetElement) {
  try {
    // Extraire l'URL du tweet
    const timeElement = tweetElement.querySelector('time');
    const linkElement = timeElement?.closest('a');
    const tweetUrl = linkElement?.href;

    if (!tweetUrl || !tweetUrl.includes('/status/')) return null;

    // Extraire le contenu textuel
    const contentDiv = tweetElement.querySelector('[data-testid="tweetText"]');
    const content = contentDiv?.innerText || '';

    if (!content.trim()) return null;

    // Extraire l'auteur
    const userLinks = tweetElement.querySelectorAll('a[href^="/"]');
    let authorUsername = '';
    let authorDisplayName = '';

    for (const link of userLinks) {
      const href = link.getAttribute('href');
      if (href && href.match(/^\/[^\/]+$/) && !href.includes('/status/')) {
        authorUsername = href.slice(1);
        // Le display name est souvent dans un span à côté
        const parentDiv = link.closest('[data-testid="User-Name"]');
        if (parentDiv) {
          const spans = parentDiv.querySelectorAll('span');
          for (const span of spans) {
            if (span.innerText && !span.innerText.startsWith('@')) {
              authorDisplayName = span.innerText;
              break;
            }
          }
        }
        break;
      }
    }

    return {
      tweetUrl,
      content,
      authorUsername,
      authorDisplayName
    };
  } catch (error) {
    console.error('Error extracting tweet data:', error);
    return null;
  }
}

function showNotification(message, type) {
  // Supprimer les notifications existantes
  const existing = document.querySelector('.glana-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `glana-notification glana-notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('glana-notification-hide');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
