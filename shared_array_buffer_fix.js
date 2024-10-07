if (typeof window !== 'undefined') {
    (async function() {
        if (window.crossOriginIsolated !== false) {
            return;
        }
        let swRegistration = await navigator.serviceWorker.register(window.document.currentScript.src)
            .catch(error => console.error("[COOP/COEP: FAIL]", error));
        if (swRegistration) {
            swRegistration.addEventListener("updatefound", () => {
                window.location.reload();
            });
            if (swRegistration.active && !navigator.serviceWorker.controller) {
                window.location.reload();
            }
        }
    })();
} else {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

    async function processFetch(req) {
        if (req.cache === "only-if-cached" && req.mode !== "same-origin") {
            return;
        }

        if (req.mode === "no-cors") {
            req = new Request(req.url, {
                cache: req.cache,
                credentials: "omit",
                destination: req.destination,
                headers: req.headers,
                integrity: req.integrity,
                keepalive: req.keepalive,
                method: req.method,
                mode: req.mode,
                redirect: req.redirect,
                referrer: req.referrer,
                referrerPolicy: req.referrerPolicy,
                signal: req.signal,
            });
        }

        let response = await fetch(req).catch(error => console.error(error));

        if (response.status === 0) {
            return response;
        }

        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }

    self.addEventListener("fetch", function(event) {
        event.respondWith(processFetch(event.request));
    });
}
