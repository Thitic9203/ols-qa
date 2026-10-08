#!/usr/bin/env node
// Wait until the isolated Chrome (devtools PORT) is signed in to OLS: /api/me/achievements answers 200.
const port = process.argv[2] || '9333';
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 240; i++) {
  try {
    const p = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page' && t.url.includes('ols'));
    if (p) {
      const ws = new WebSocket(p.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
      const v = await new Promise(r => { ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id === 1) r(d.result?.result?.value); };
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: "fetch('/api/me/achievements',{credentials:'include'}).then(r=>r.status)", awaitPromise: true, returnByValue: true } })); });
      ws.close();
      if (v === 200) { console.log('ISO_LOGGED_IN ' + new Date().toISOString()); process.exit(0); }
    }
  } catch {}
  await sleep(3000);
}
console.log('TIMEOUT'); process.exit(1);
