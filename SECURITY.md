# Note per la pubblicazione

## Configurazione presente

Il sito è composto da file statici, senza API, moduli server, account o endpoint di invio. `_headers` imposta CSP e intestazioni di sicurezza su host compatibili con il formato Cloudflare Pages/Netlify. Pubblicare il sito esclusivamente in HTTPS e verificare che il provider applichi davvero tali header.

La CSP consente gli script locali e le risorse visive Cloudinary e Google Fonts già usate dal sito. `style-src 'unsafe-inline'` è necessario per gli stili inline presenti nelle pagine esistenti; rimuoverlo richiede prima di migrare quegli stili.

## GitHub Pages

GitHub Pages non applica il file `_headers`. Le pagine HTML dichiarano la CSP e la policy di referrer tramite tag meta. La CSP via meta non può applicare `frame-ancestors`; la protezione contro l'incorporamento e gli altri header personalizzati richiedono un host o un proxy che li imposti. Abilitare **Enforce HTTPS** in Settings → Pages.

## Rate limiting

Non c’è oggi un endpoint applicativo da limitare. Il rate limiting va configurato sul provider/CDN, per esempio su richieste a futuri percorsi `/api/*` o a endpoint di invio moduli, dopo aver scelto soglie adeguate. Non impostare una soglia generica aggressiva sulle immagini o sulle pagine statiche: un singolo caricamento della galleria produce molte richieste legittime. Attivare anche le protezioni anti-DDoS del provider.

## Prima del go-live

- Verificare sul dominio pubblicato la CSP e il redirect HTTP → HTTPS. Sui provider compatibili, controllare anche gli header configurati in `_headers`.
- Configurare il dominio personalizzato e la protezione DDoS/WAF nel provider; stabilire un rate limit solo quando esiste un endpoint da proteggere.
- Completare i campi segnalati in `privacy.html` e verificare la documentazione e le impostazioni di hosting, Cloudinary e Google Fonts.
- Ricontrollare `cookie.html` dopo ogni aggiunta di script o integrazione. Se si aggiungono strumenti non tecnici, bloccarli prima del consenso e implementare scelta, rifiuto e revoca con una CMP adeguata.
- Tenere aggiornati dipendenze e configurazioni DNS/TLS del provider. Il progetto attuale non richiede pacchetti JavaScript per il sito, benché `node_modules` contenga una dipendenza Cloudinary usata per attività di gestione dei contenuti.
