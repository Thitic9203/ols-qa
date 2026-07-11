# OLS Login Runbook (NDLP68 SSO)

Self-contained procedure for an AI agent to log into **OLS** for QA testing —
**fully invisible (headless), no manual form-fill, no screen disturbance.**
Follow top to bottom. Verified working 2026-07-12 (Teacher → dev-ols).

Credentials are **never** in this file (repo is public). Emails + shared password
live in local agent memory `reference_ols-test-accounts`. Related: memory
`reference_ols-ndlp68-auto-login`, `no-screen-hijack`.

---

## 1. How OLS auth works (read first)

- OLS has **no login page of its own.** Identity comes from the **NDLP68 portal**
  (`https://<SSO_PORTAL_HOST>`).
- On successful NDLP68 login, an auth cookie is set on the **parent domain
  `<COOKIE_DOMAIN>`**. That cookie is automatically sent to every subdomain — including
  **`<DEV_HOST>`** → OLS is logged in with no extra step (just load/refresh dev-ols).
- Login API the modal calls: `POST {backend}/auth/login-with-email`,
  body `{email, password, token}` (`token` = reCAPTCHA v3), cookie session
  (`withCredentials: true`).
- `{backend}` = `school-core-api-{env}<COOKIE_DOMAIN>`, env ∈ `dev` / `uat` / `preprod` /
  `ndlp68` / `prod` (resolved from the frontend origin; the public portal = `ndlp68`).
- Session check: `GET {backend}/auth/session` → `{"loggedIn": true|false}`.

## 2. NDLP → OLS role mapping

| NDLP role (login portal) | OLS role | Test account (memory key) | Notes |
|---|---|---|---|
| Student | **Learner** | Student | default learner experience |
| Teacher | **NDLP Creator** | Teacher | **primary for creator / media QA**; after login toggle "Creator mode" |
| School Admin | **Admin Content** | School Admin | |
| Central Admin (OBEC) | **Admin User** | Central Admin | called "admin obec" on the NDLP side |
| Region Admin | *(OLS role not yet specified — confirm with user)* | Region Admin | not in the provided mapping |

Emails + shared password → memory `reference_ols-test-accounts`. Never paste
credentials into any committed file.

## 3. Prerequisites

- **VPN**: `<DEV_HOST>` requires the NDLP VPN. `<SSO_PORTAL_HOST>` is
  public. If dev-ols fails to load, the VPN is likely off → tell the user (do not work around).
- **Tool**: headless Chrome via `use_browser` (skill `superpowers-chrome:browsing`).
  If deferred, load with ToolSearch `select:mcp__plugin_superpowers-chrome_chrome__use_browser`.
- **Screen safety**: `use_browser` runs **headless by default** (separate
  "superpowers-chrome" profile, own port) — invisible, never raises/focuses the user's
  real Chrome. **NEVER call `show_browser` / headed mode here** (screen hijack — see
  memory `no-screen-hijack`). Confirm with `{action:"browser_mode"}` → `headless: true`.

## 4. Login runbook (exact `use_browser` actions)

`<EMAIL>` / `<PASSWORD>` come from memory `reference_ols-test-accounts` (pick the role's account).

1. `{action:"browser_mode"}` → confirm `headless:true`.
2. `{action:"navigate", payload:"https://<SSO_PORTAL_HOST>/"}`
3. **(Re-run / switching role only)** check + log out first — see §6. A fresh profile is already logged out.
4. **Dismiss the PDPA consent overlay** (it intercepts clicks and blocks the login button):
   `{action:"click", selector:"//button[contains(., 'ยอมรับ')]"}`
5. **Open the login modal:**
   `{action:"click", selector:"//button[normalize-space(.)='เข้าสู่ระบบ']"}`
   then `{action:"await_element", selector:"#email", timeout:15000}`.
   The modal is a `form` with `#email`, `#password`, and a `rememberMe` checkbox.
   The submit button stays disabled until inputs are valid.
6. **Fill credentials:**
   `{action:"type", selector:"#email", payload:"<EMAIL>"}`
   `{action:"type", selector:"#password", payload:"<PASSWORD>"}`
7. **Submit:**
   `{action:"click", selector:"//button[@type='submit' and normalize-space(.)='เข้าสู่ระบบ']"}`
   The app auto-generates the reCAPTCHA v3 token — **headless passes, no visible
   challenge, not classifier-blocked.**
8. **Confirm the NDLP68 session** (in-page async eval):
   ```js
   (async () => {
     const r = await fetch('https://<AUTH_API_HOST>/auth/session', {credentials:'include'});
     return JSON.stringify({status: r.status, body: await r.text()});
   })()
   ```
   Expect `{"loggedIn":true}`. On success the page redirects to `<SCHOOL_HOST>/user-...`.

## 5. Verify SSO into OLS (dev-ols)

1. `{action:"navigate", payload:"https://<DEV_HOST>/"}`
2. *(optional, for a clean screenshot)* `{action:"set_viewport", viewport:{width:1440,height:900}}`
   then navigate again — the top-right user area renders at desktop width.
3. Logged-in indicators (any of these confirms SSO carried):
   - top-right **avatar** (`.MuiAvatar-root`); **no** "เข้าสู่ระบบ" login button
   - nav shows **"สร้างสื่อ"** (Create media)
   - bottom-left **"เปลี่ยนเป็น Creator mode"** toggle
   - personalized greeting ("สวัสดี &lt;name&gt;")
   - `localStorage.getItem('isCreator')` is present (`"false"` = currently Learner view,
     **not** logged out)

## 6. Switch role / log out

- To switch role: **log out first**, then repeat §4 with the other account.
- Log out: NDLP68 logout UI, or in-page
  `fetch('https://<AUTH_API_HOST>/auth/logout', {method:'POST', credentials:'include'})`
  then reload. `{action:"clear_cookies"}` may not clear httpOnly cookies — prefer the logout endpoint.
- Verify logged out: `/auth/session` → `{"loggedIn":false}`.

## 7. Creator vs Learner mode (Teacher / NDLP Creator)

dev-ols opens in **Learner view** by default (`isCreator=false`). To test creator/media
features, click the bottom-left **"เปลี่ยนเป็น Creator mode"** toggle. Creator mode adds
**"จัดการสื่อการเรียนรู้"** to the sidebar and the toggle flips to **"เปลี่ยนเป็น Learner mode"**.

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Login button click does nothing (URL unchanged, no modal) | PDPA consent overlay is on top — do §4 step 4 (accept "ยอมรับ") first. |
| `/sign-in` or `/login` shows "เกิดข้อผิดพลาด ไม่พบหน้า" | There is **no** login route — login is a **modal** on `/`, not a page. |
| Form inputs never render | Wait longer (`await_element #email`, 15s). Modal + reCAPTCHA load async. |
| `/auth/session` cross-origin `Failed to fetch` from dev-ols | CORS — probe the **matching** backend from the **same** origin, or just rely on the UI indicators in §5. |
| dev-ols won't load / times out | VPN off → tell the user. Do not work around. |
| Login rejected / reCAPTCHA error | Retry once. If it persists, tell the user. **Do NOT switch to headed mode** to solve a challenge (screen hijack). Manual login by the user is the last-resort fallback. |

## 9. Do-not list

- ❌ Never use headed / `show_browser` mode (screen hijack — memory `no-screen-hijack`).
- ❌ Never commit credentials to this repo (public). Creds live in agent memory only.
- ❌ Never change a Jira ticket's assignee during QA (guide § Assignee during QA).
