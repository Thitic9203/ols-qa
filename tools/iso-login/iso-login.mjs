#!/usr/bin/env node
// Open an ISOLATED Chrome window (own profile, own cookies) at the OLS sign-in drawer with the
// username already filled and the cursor in the password field, so the user only types the password.
// Usage: node tools/iso-login/iso-login.mjs <username> <sign-in-url> [port]
//   <sign-in-url> = the env's OLS URL with ?signIn=1 (host from the local secrets file, never committed)
// Never types a password. Used for second-session checks (single-session test, parallel lanes).
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [,, user, url, port = '9333'] = process.argv;
if (!user || !url) { console.error('usage: iso-login.mjs <username> <sign-in-url> [port]'); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'ols-iso-'));
spawn('open', ['-na', 'Google Chrome', '--args', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`,
  '--no-first-run', '--no-default-browser-check', '--new-window', url], { stdio: 'ignore', detached: true }).unref();
let page;
for (let i = 0; i < 80 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page' && t.url.startsWith('http')); } catch {}
  if (!page) await sleep(250);
}
if (!page) { console.error('isolated Chrome did not come up'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const js = `(()=>{const i=document.querySelector('input[type=email],input[name=email],#email,input[type=text]'); if(!i) return 'no-input'; const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(i, ${JSON.stringify(user)}); i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); const pw=document.querySelector('input[type=password]'); if(pw) pw.focus(); return 'filled:'+i.value;})()`;
const walk = n => [n.frame, ...(n.childFrames || []).flatMap(walk)];
for (let k = 0; k < 80; k++) {
  const ft = (await send('Page.getFrameTree')).result?.frameTree;
  const fr = ft && walk(ft).find(f => (f.url || '').includes('/sign-in'));
  if (fr) {
    const w = await send('Page.createIsolatedWorld', { frameId: fr.id, worldName: 'prefill' });
    const r = await send('Runtime.evaluate', { expression: js, contextId: w.result.executionContextId, returnByValue: true });
    const v = r.result?.result?.value;
    if (v && v.startsWith('filled')) {
      await send('Page.bringToFront');
      try { execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate']); } catch {}
      console.log(`${v} — window in front, cursor in password field (profile ${profile}, devtools ${port})`);
      process.exit(0);
    }
  }
  await sleep(250);
}
console.error('sign-in form not found'); process.exit(1);
