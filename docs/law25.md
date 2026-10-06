> Canonical copy: `docs/law25.md` in the switchboard-chat repository. Keep both in step.

# Law 25 (Quebec) — privacy notes for wp-chat and switchboard-chat

Working document for the person responsible for the protection of personal information.
It describes what the software does. It is not legal advice: have a lawyer review the
notices and the privacy impact assessment (PIA) before launch.

## 1. What data exists, where, and for how long

| Data | Where | Form | Kept until |
|---|---|---|---|
| Web chat message text | Browser ↔ switchboard-chat memory ↔ Matrix room | Never written to disk or logs by the bridge. Matrix room is end-to-end encrypted. | Chat ends or idle timeout (`WEB_IDLE_TIMEOUT_MIN`, default 24 h). Bridge leaves and forgets the room. |
| Web visitor identifier | Cookie `wpchat` in the browser, SHA-256 of it in bridge memory | Random, no link to a person | Chat end / timeout. Lost on bridge restart. |
| Pseudo caller number (web) | Database `room` | Random number, hashed + encrypted | Deleted with the room |
| SMS message text | voip.ms → bridge → Matrix room | Not stored by the bridge except in a retry queue (below). Matrix room is encrypted. | Room deleted after `SMS_IDLE_RETENTION_DAYS` (default 7) without a text from the caller |
| Caller phone number | Database `room` | Keyed hash (lookup) + AES-256-GCM encrypted copy (needed to answer) | Deleted with the room |
| Opt-out list (STOP) | Database `denied_did` | Keyed hash only, date, how | Kept on purpose, so an opt-out is honored. It cannot identify anyone without `PHONE_HASH_SECRET`. |
| First-contact notice record, auto-SMS counters | Database | Keyed hash only | Notice record: until erased. Counters: 7 days. |
| Retry queues | Database | Inbound texts waiting for a respondent: 24 h max. Outbound: 1 h max. voip.ms password never stored there. | Purged automatically |
| voip.ms password | Database | AES-256-GCM encrypted | Until changed |
| Logs | `data/logs`, 7 daily files | No message text, no phone number, no password or token. Callers appear as an 8-character hash prefix. | 7 days |
| Matrix history | Synapse | Encrypted. Respondents' own devices keep copies. | Synapse `retention` (8 days in the sample config) |

## 2. What the software no longer does (compared with the original SMS path)

- Phone numbers, opt-out list and counters are no longer stored in clear.
- Rooms and number mappings are no longer kept forever.
- The retry queue no longer holds the voip.ms password and is purged on a timer.
- Message bodies, phone numbers, bearer tokens and voip.ms URLs are no longer written to logs.
- `.env` is no longer copied into the Docker image. The example PHP client no longer
  contains an API token.

## 3. Rights of the person

| Request | How |
|---|---|
| Erasure ("forget me") | A respondent types `!oubli` (or `!forget`) in the room, or an administrator calls the API command `erase_caller` with the caller's number. Deletes the room, the encrypted number and the records. The bot leaves the room; **each respondent must also delete the room in their own client**. The opt-out entry (hash) stays. |
| End a web chat | Visitor presses "End chat", or a respondent types `!fin` / `!end`. |
| Access / rectification | The bridge keeps no profile: only the live conversation exists. Answer an access request from the Matrix room while it exists. |
| Opt out of SMS | Caller texts STOP (ARRET). Respondent can type `!stop`. |

## 4. Notices to show

- **Web widget**: the consent text and retention sentence are shown before the first message
  (Settings → WP Chat). Fill in the privacy officer's name and the privacy-policy URL, and
  keep the retention sentence equal to `WEB_IDLE_TIMEOUT_MIN`.
- **SMS**: the first SMS every caller receives states that texts are deleted after
  `SMS_IDLE_RETENTION_DAYS` days and how to opt out. Say in the privacy policy that
  voip.ms and the mobile carriers handle SMS under their own retention, which we do not control.
- **Respondents**: they must not copy, screenshot or export conversations, must delete the
  room when asked, and must keep their Matrix device locked. Put this in the volunteer agreement.

## 5. Residual risks (not fixed by the software)

1. **SMS pass through voip.ms and the carriers** (not end-to-end encrypted, copies kept by them).
2. **Respondents' devices** hold decrypted history until they delete the room or Synapse retention purges it.
3. **API tokens** (`call_center.sb_chat_api_token`) are still stored in clear in the database,
   because the API returns the existing token on request and `dumpdb.sh` shows it. Protect
   the database file (permissions, encrypted disk, encrypted backups). Hashing them is a
   possible later change.
4. **Backups** of the database contain whatever exists at that moment (hashes and
   encrypted numbers, no message text). Encrypt backups and expire them. Keep
   `PHONE_ENC_KEY` and `PHONE_HASH_SECRET` backed up *separately* from the database. Losing
   `PHONE_ENC_KEY` makes open conversations unreadable; changing `PHONE_HASH_SECRET` makes
   the opt-out list forget everyone.
5. **Old log files** written before this change still contain numbers and message text.
   Delete `data/logs/*` once after upgrading.
6. **Web chat sessions live in memory**: a restart ends them (rooms are purged at start).
7. **Rate-limit memory** keeps IP addresses for up to an hour (in memory only).

## 6. Incident procedure (outline)

1. Contain: stop the bridge (`docker compose stop`), rotate `PHONE_ENC_KEY` is *not* enough
   on its own; rotate the voip.ms password, API tokens, Matrix bot password.
2. Assess: what was exposed (hashes and encrypted numbers are low risk without the keys;
   Matrix room contents are end-to-end encrypted; SMS content passes through voip.ms).
3. Decide whether there is a risk of serious injury: if so, notify the Commission d'accès à
   l'information and the people concerned **promptly**.
4. Record every confidentiality incident in the incident register (required even when
   not notified), then fix the cause and update this document.

## 7. Privacy impact assessment checklist

- [ ] Purpose and necessity written down (help for people in recovery, anonymous, one-to-one).
- [ ] Data inventory above reviewed and confirmed by running the system.
- [ ] Consent and notices reviewed by a lawyer, in French first.
- [ ] Privacy officer named and published.
- [ ] Respondent confidentiality agreement signed.
- [ ] Hosting location of the bridge, Synapse and WordPress documented (outside Quebec = assessment of transfer).
- [ ] Backups: where, encrypted, how long.
- [ ] Incident register created.
- [ ] Yearly review date set.
