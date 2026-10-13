# Session renewal resilience

Applies to any job that keeps saved test sessions alive so a person does not have to sign in again
(keepalive, token refresh, re-link). Learned from a renewal job that ran every 10 minutes and still
let every session expire.

## Rules

1. **Renew whenever renewal is possible, not only near expiry.** A job that renews only inside the
   last N hours before a token expires has one chance per lifetime. If the network, VPN or machine is
   down for that window, every session dies. Renew on the first run where the target is reachable and
   the token is past a threshold well before expiry (for a 24 h token, renewing once less than about
   20 h remain leaves about 22 h of chances instead of 2).
2. **Judge liveness by the application, not only by the cookie.** A session can be dead on the
   application side (idle timeout, reboot, server restart) while its identity-provider token is still
   valid. A renewal job that reads only cookie expiry treats that session as healthy and skips it.
   When the app reports the session dead and the provider token is still valid, run the same full
   renewal sequence automatically — never only behind a manual flag.
3. **An unreachable target skips the run, not the whole window.** When the job skips because the
   target is unreachable, the next reachable run must still be able to renew (rule 1 makes this true).
4. **Test the interruptions, not only the happy path.** Every renewal job carries tests for:
   target unreachable through the old renewal window then reachable again with time left → renews;
   app session dead while provider token valid → renews; provider token already expired → reports
   that a human sign-in is needed and changes nothing.
5. **Every failed renewal restores the previous saved state.** A half-renewed session is worse than
   an old one.
6. **When renewal is impossible** (provider token already expired), say so and ask before opening any
   sign-in window — never open one unasked.
