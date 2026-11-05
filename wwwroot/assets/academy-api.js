window.Academy = (() => {
  let token;
  async function refresh() { const r = await fetch('/api/csrf', { cache: 'no-store' }); if (!r.ok) throw Error('The academy backend is unavailable.'); token = (await r.json()).token; }
  async function request(url, method = 'GET', body) {
    if (method !== 'GET' && !token) await refresh();
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(method === 'GET' ? {} : { 'X-CSRF-TOKEN': token }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: 'no-store' });
    const text = await r.text(); let data; try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!r.ok) throw Object.assign(Error(data.error || (r.status === 401 ? 'Please sign in again.' : r.status === 429 ? 'Too many requests. Wait one minute and try again.' : 'The request could not be completed.')), { status: r.status });
    return data;
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return { request, refresh, esc };
})();
