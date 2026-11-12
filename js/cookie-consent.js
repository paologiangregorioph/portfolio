(() => {
  const measurementId = 'G-G0CDDV4G5H';
  const storageKey = 'portfolio-cookie-preferences-v1';
  const disableKey = 'ga-disable-' + measurementId;
  const denied = {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  };
  let analyticsStarted = false;
  let temporaryChoice;

  function readChoice() {
    if (temporaryChoice !== undefined) return temporaryChoice;
    try {
      const choice = localStorage.getItem(storageKey);
      return choice === 'accepted' || choice === 'rejected' ? choice : null;
    } catch {
      return null;
    }
  }

  function clearAnalyticsCookies() {
    const paths = new Set(['/', new URL('.', location.href).pathname]);
    const suffix = measurementId.slice(2);
    for (const name of ['_ga', '_ga_' + suffix]) {
      for (const path of paths) {
        const expired = name + '=; Max-Age=0; Path=' + path;
        try {
          document.cookie = expired;
          document.cookie = expired + '; Domain=' + location.hostname;
        } catch {
          // Some browser privacy settings also block cookie deletion.
          return;
        }
      }
    }
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  function startAnalytics() {
    if (analyticsStarted) {
      if (window[disableKey]) location.reload();
      return;
    }
    analyticsStarted = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    gtag('consent', 'default', denied);
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 180 * 24 * 60 * 60,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
      page_location: location.origin + location.pathname,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.append(script);
  }

  const panel = document.createElement('dialog');
  panel.className = 'cookie-preferences';
  panel.setAttribute('aria-labelledby', 'cookie-preferences-title');
  panel.innerHTML = `
    <button type="button" class="cookie-preferences__close" aria-label="Chiudi e rifiuta le statistiche">×</button>
    <h2 id="cookie-preferences-title">Preferenze cookie</h2>
    <p>Con il tuo consenso usiamo Google Analytics per misurare le visite. Puoi cambiare scelta in qualsiasi momento. <a href="cookie.html">Informativa sui cookie</a>.</p>
    <div class="cookie-preferences__actions">
      <button type="button" data-cookie-choice="rejected">Rifiuta statistiche</button>
      <button type="button" data-cookie-choice="accepted">Accetta statistiche</button>
    </div>
  `;
  document.body.append(panel);

  let opener;
  function closePanel() {
    panel.close();
    opener?.focus();
    opener = undefined;
  }

  function stopAnalytics() {
    window[disableKey] = true;
    if (analyticsStarted) {
      gtag('consent', 'update', denied);
    }
    clearAnalyticsCookies();
  }

  function applyChoice(choice) {
    if (choice === 'accepted') {
      startAnalytics();
      return;
    }
    stopAnalytics();
    if (analyticsStarted && temporaryChoice === undefined) location.reload();
  }

  function resetCookieConsent() {
    stopAnalytics();
    try {
      localStorage.removeItem(storageKey);
      location.reload();
    } catch {
      temporaryChoice = null;
      if (!panel.open) panel.showModal();
    }
  }

  window.resetCookieConsent = resetCookieConsent;

  function saveChoice(choice) {
    try {
      localStorage.setItem(storageKey, choice);
      temporaryChoice = undefined;
    } catch {
      // Analytics stays disabled if the site cannot remember consent.
      choice = 'rejected';
      temporaryChoice = choice;
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Keep the refusal in memory when storage is entirely unavailable.
      }
    }
    closePanel();
    applyChoice(choice);
  }

  for (const button of panel.querySelectorAll('[data-cookie-choice]')) {
    button.addEventListener('click', () => saveChoice(button.dataset.cookieChoice));
  }
  panel.querySelector('.cookie-preferences__close').addEventListener('click', () => saveChoice('rejected'));
  panel.addEventListener('cancel', event => {
    event.preventDefault();
    if (readChoice()) closePanel();
    else saveChoice('rejected');
  });

  for (const link of document.querySelectorAll('[data-cookie-preferences]')) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      if (panel.open) panel.close();
      panel.showModal();
    });
  }

  function syncChoice() {
    const choice = readChoice();
    applyChoice(choice);
    if (choice && panel.open) closePanel();
    if (!choice && !panel.open && !analyticsStarted) {
      panel.showModal();
    }
  }

  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) syncChoice();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) syncChoice();
  });
  syncChoice();
})();
