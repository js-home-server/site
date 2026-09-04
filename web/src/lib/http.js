/* Every remote request in this app needs an application-level deadline — a
   stalled dependency otherwise leaves a "Sending…"/"Checking…" state with no
   way out, `AbortController` is the platform's own way to bound one. */
export async function fetchWithTimeout(url, options, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}
