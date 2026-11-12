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

  function readChoice() {
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
        document.cookie = expired;
        document.cookie = expired + '; Domain=' + location.hostname;
      }
    }
  }

  function startAnalytics() {
    if (analyticsStarted) return;
    analyticsStarted = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
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
    clearAnalyticsCookies();
  }

  function applyChoice(choice) {
    if (choice === 'accepted') {
      startAnalytics();
      return;
    }
    stopAnalytics();
    if (analyticsStarted) location.reload();
  }

  function resetCookieConsent() {
    localStorage.removeItem(storageKey);
    stopAnalytics();
    location.reload();
  }

  window.resetCookieConsent = resetCookieConsent;

  function saveChoice(choice) {
    try {
      localStorage.setItem(storageKey, choice);
    } catch {
      // Analytics stays disabled if the site cannot remember consent.
      choice = 'rejected';
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

  for (const button of document.querySelectorAll('[data-cookie-preferences]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      if (panel.open) panel.close();
      panel.showModal();
    });
  }

  for (const button of document.querySelectorAll('[data-cookie-reset]')) {
    button.addEventListener('click', resetCookieConsent);
    button.hidden = false;
  }

  function syncChoice() {
    const choice = readChoice();
    applyChoice(choice);
    if (choice && panel.open) closePanel();
    if (!choice && !panel.open && !analyticsStarted) {
      // Show the first-visit notice without moving keyboard focus.
      panel.setAttribute('open', '');
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
