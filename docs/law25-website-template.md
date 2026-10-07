**English** · [Français](fr/law25-website-template.md)

# Law 25 kit for a website using WP Chat — template to adapt

A set of ready-to-adapt texts and forms for an organization that offers the WP Chat widget on its
website and must meet Quebec's Law 25 (*Act respecting the protection of personal information in the
private sector*, as amended). Everything that is specific to **your** organization is in
`[SQUARE BRACKETS IN CAPITALS]`: replace it, delete what does not apply, and keep what is true.

> **This is a template, not legal advice.** Which rules apply to you (private-sector Act, public
> body, non-profit, federal rules) and the exact wording and deadlines must be confirmed by a
> lawyer or your privacy officer before publication. Where a legal detail is mentioned below it is
> marked *(verify)*.
>
> The texts describe what **WP Chat and switchboard-chat actually do**. If you change the software
> or its settings, change the texts (section 1 lists what must stay in agreement).
> The technical background is in [law25.md](law25.md).

## How to use this kit

1. Read section 1 (the facts) and section 9 (the alignment checklist). Fix the software settings first.
2. Fill in the **organization sheet** (section 2) once; reuse the values everywhere.
3. Adapt and publish **Part A** (privacy policy section) on your website. Put the link in the plugin
   (Settings → WP Chat → *Privacy policy URL*).
4. Adapt **Part B** (the notice shown inside the chat window).
5. Keep **Parts D–G** in your privacy governance file: request procedure, volunteer commitment,
   incident register, privacy impact assessment.
6. Have it all reviewed, date it, and review it at least yearly or whenever the service changes.

A Quebec website must be available in French; the French version of this kit
([fr/law25-website-template.md](fr/law25-website-template.md)) has the visitor-facing texts in
French. If your site is bilingual, publish both.

## 1. The facts about WP Chat (do not promise more, or less)

| Topic | What the software does | Setting that controls it |
|---|---|---|
| What the visitor must give | Nothing: no name, email or phone number is requested | – |
| Message content | Travels browser → chat server (in memory) → an **end-to-end encrypted** Matrix room read by volunteers. Never written to disk or logs by the chat server. **The website (WordPress) never receives it.** | – |
| Identifier | A random session token held in the widget's memory only: **no cookie, no browser storage**. Sent in a request header; only its hash is kept, in the server's memory. (If you enabled `WEB_SESSION_COOKIE` for widgets older than 0.5.0, describe that cookie too.) | idle timeout; page closed |
| IP address | Kept in the chat server's **memory** for at most one hour (abuse limits). Not written by the chat server. **Your reverse proxy and web host may log it** (access logs). | log retention of your proxy / host: **you set it** |
| End of a conversation | Visitor presses **End chat**, or a volunteer types `!fin` / `!end`, or the idle timeout passes. The chat server leaves and forgets the room and deletes its record. | `WEB_IDLE_TIMEOUT_MIN` (default 1440 min = 24 h) and the plugin's *Retention sentence* |
| Who can read a new conversation | **Every active respondent** of the call center is invited to the new room and can read it until one of them types `!ok` (private room: the others are removed). Say so in the policy. | respondents list of the call center (`WEB_CALL_CENTER_ID`) |
| Copies kept by volunteers | Volunteers' Matrix clients keep their own copy until they delete the room (they are asked to). | volunteer commitment (Part E); optional Matrix server retention policy |
| Restart of the chat server | Ends all open chats (sessions are in memory). | – |
| Profiling / tracking | None: no analytics, advertising, or third-party scripts in the widget; no technology to identify, locate or profile the visitor. | – (your **site's other** analytics are separate: describe them in your general policy) |
| Blocking abusive visitors | A respondent can type `!ban`: the chat ends and the visitor's connection is refused for a set time (default 1 day). The server then keeps a **keyed hash** of the IPv4 address or IPv6 /64 network and an end date (no reason, no content), and deletes it at expiry. Say so in the policy. | `WEB_BAN_DAYS`, `WEB_BAN_MAX_DAYS` |
| If you also run the SMS line | The caller's phone number is stored encrypted and hashed; conversations are deleted after *N* days of silence; SMS pass through voip.ms and mobile carriers. | `SMS_IDLE_RETENTION_DAYS` (default 7) |
| Server logs of the bridge | 7 daily files, no message text, no phone number, no token or password. | – |
| Where data lives | wherever **you** host WordPress, the chat server, the Matrix server and the proxy | your hosting choices |

## 2. Organization sheet (fill once)

| Item | Your value |
|---|---|
| Organization legal name | `[ORGANIZATION NAME]` |
| Website | `[WEBSITE ADDRESS]` |
| Person responsible for the protection of personal information (name, title) | `[PRIVACY OFFICER NAME, TITLE]` |
| Contact for privacy requests (email, postal address, phone) | `[PRIVACY EMAIL]`, `[POSTAL ADDRESS]`, `[PHONE]` |
| Purpose of the chat (one sentence) | `[PURPOSE, e.g. "to let a person talk anonymously with a volunteer about recovery from addiction"]` |
| Who answers | `[WHO ANSWERS, e.g. "trained volunteers of our fellowship"]` |
| Idle timeout (must equal `WEB_IDLE_TIMEOUT_MIN`) | `[24 hours]` |
| Server access logs kept for | `[X days]` |
| Hosting: WordPress / chat server / Matrix server (company and country) | `[HOSTING COMPANIES AND COUNTRIES]` |
| Matrix server operator | `[MATRIX OPERATOR]` |
| Matrix retention on volunteers' copies (if configured) | `[X days / none]` |
| SMS line offered? provider | `[YES/NO]`, `[SMS PROVIDER, e.g. voip.ms]`, retention `[7 days]` |
| Date of this version | `[DATE]` |

---

## Part A — Privacy policy section "Chat" (publish on the website)

*Copy into your privacy policy page. Delete the bracketed alternatives that do not apply, and the
SMS block if you do not offer SMS.*

> ### Confidential chat
>
> **Who we are and why this service exists.** `[ORGANIZATION NAME]` offers a confidential chat
> on this website `[PURPOSE]`. The people who answer are `[WHO ANSWERS]`.
>
> **What we collect.**
> - The messages you write in the chat and the replies you receive.
> - A random identifier, kept only in the memory of the open chat page (no cookie is used), so that
>   your conversation can continue while you chat. It contains no information about you.
> - Your IP address, held briefly in the memory of our chat server to limit abuse, and recorded in the
>   technical logs of our servers for `[X days]`. If a volunteer blocks a connection for abuse, we also keep
>   an unreadable fingerprint of that address (it cannot be turned back into the address) until the block
>   ends, `[1 day]` by default and never more than `[30 days]`.
>
> We do **not** ask for your name, email address or phone number, and we do not need them to chat.
> The chat does not use analytics, advertising or profiling tools, and does not use any technology to
> identify, locate or profile you. *(If your website uses other tools, they are described in
> `[SECTION OF YOUR POLICY]`.)*
>
> **Why we collect it.** Only to run the conversation you ask for, to keep the service secure, and
> to protect your confidentiality. We do not use your messages for any other purpose, and we do not
> sell or share them for marketing.
>
> **Who sees what.** Volunteers of our team who are on duty can read what you write: a new
> conversation is visible to the volunteers on duty until one of them takes it privately, after which
> only that volunteer sees it. They do not see your IP address. The messages pass through our chat server and a private, encrypted conversation
> room on our messaging server operated by `[MATRIX OPERATOR]`. **This website itself does not receive or store your
> messages.** Our service providers (hosting: `[HOSTING COMPANIES]`) host the servers but do not
> read the conversations. Our volunteers are bound by a written confidentiality commitment.
>
> **How long we keep it.** Your conversation is deleted when you press **End chat**, when the
> volunteer ends it, when you close the page, or after `[24 hours]` of inactivity; the identifier is
> discarded at the same time.
> The volunteers who took part must delete their copy of the conversation `[and our messaging server
> removes old messages after X days]`. Technical logs are kept `[X days]`. The fingerprint of a blocked
> connection is deleted when its block ends.
>
> **Where your information is.** Our servers are located in `[COUNTRY / PROVINCE]`. `[If outside
> Quebec: "Your information may be processed outside Quebec, in COUNTRY. We have assessed this
> transfer and require protection comparable to Quebec's." *(verify)*]`
>
> **How we protect it.** Connections are encrypted (HTTPS); conversation rooms are end-to-end
> encrypted; access is limited to trained volunteers; the service limits abuse and keeps no
> conversation history.
>
> **Your rights.** You may ask whether we hold information about you, ask to see it or have it
> corrected, ask us to stop and delete it, and withdraw your consent at any time (simply press
> **End chat**). Because we keep no record that links a conversation to a person, we cannot find or
> recover a conversation after it has been deleted. To exercise a right, or to ask a question or file a complaint,
> contact our person responsible for the protection of personal information: `[PRIVACY OFFICER NAME, TITLE]`,
> `[PRIVACY EMAIL]`, `[POSTAL ADDRESS]`. We answer within the legal deadline *(verify: 30 days)*. You may also
> contact the Commission d’accès à l’information du Québec (cai.gouv.qc.ca).
>
> **On a shared or public device.** Press **End chat** and close the tab when you are done. The
> conversation is not kept on this website, but it remains visible on your screen until you do.
>
> *Identifier used by the chat (no cookie):*
>
> | Identifier | Purpose | Kept by | Lifetime |
> |---|---|---|---|
> | session token | keeps your conversation going | the open chat page (memory only) and our chat server (`[CHAT SERVER ADDRESS]`, hash only) | until you end the chat, close the page or `[24 hours]` of inactivity |
>
> **SMS line** *(delete if not offered).* If you text our number `[SMS NUMBER]`, we receive your
> phone number and your messages through `[SMS PROVIDER]` and your mobile carrier, which keep their own
> records under their own policies. We keep your number only in encrypted form while the
> conversation is open and delete the conversation after `[7 days]` without a text from you.
> Text STOP (ARRET) at any time to stop receiving messages; to honor that request we keep a
> non-readable fingerprint of your number, which cannot identify you.
>
> *Last updated: `[DATE]`.*

## Part B — Notice shown in the chat window

The widget shows, before the first message: the confidentiality sentence, the retention sentence,
the privacy contact and the policy link, then a button (**I understand, start chatting**). Pressing the
button is the visitor's consent to start. Keep this notice **short, plain and consistent** with Part A.

| Element | Where to set it | Suggested wording (adapt) |
|---|---|---|
| Confidentiality sentence | `wp-chat/languages/widget-strings.json` → `consent` | "This chat is confidential. We do not keep your messages on this website." *(default; true as long as WordPress is not in the message path)* |
| Retention sentence | Settings → WP Chat → *Retention sentence* (keep equal to `WEB_IDLE_TIMEOUT_MIN`) | "Your conversation is deleted when you end the chat or after `[24 hours]` of inactivity." |
| Privacy contact | Settings → WP Chat → *Person responsible for privacy* | `[PRIVACY OFFICER NAME]` |
| Privacy policy link | Settings → WP Chat → *Privacy policy URL* | `[URL OF PART A]` |
| Start button | `widget-strings.json` → `start` | "I understand, start chatting" |

Notes for adapting: consent must be given for **specific purposes**, in **clear and simple language**,
and must be separable from other terms *(verify)*. Do not bundle it with unrelated acceptances. If you
change the sentences, change both language versions and keep them true to the facts of section 1.
The respondent name shown is generic (e.g. "Respondent"), which is fine; just make sure your policy
tells visitors that the person answering is a volunteer of the team and that several volunteers on
duty may see a new conversation until one takes it privately (as Part A does).

## Part C — Visitor FAQ (optional page or section)

| Question | Answer (adapt) |
|---|---|
| Do I need to give my name? | No. We do not ask for any personal detail. |
| Who can read what I write? | Only the `[VOLUNTEERS]` on duty, in a private encrypted room (until one of them takes your conversation privately, then only that volunteer). Not the website's administrators. |
| Is it really anonymous? | We do not ask who you are and keep no history. Your internet provider and the network you use can still see that you connected to this site; use a private network if that matters. |
| Is anything saved on my device? | No cookie and nothing in the browser's storage: a temporary identifier lives in the open chat page only and disappears when you close it. |
| Can I get my conversation back? | No: it is deleted when it ends, so nobody can retrieve it later. |
| How do I stop? | Press **End chat**. The conversation is deleted and the volunteer is told. |
| I wrote something I regret. | End the chat; it is deleted. You can also ask the volunteer to end it. |
| How do I contact the privacy officer? | `[PRIVACY EMAIL]` |

## Part D — Procedure for privacy requests (internal)

| Request | What to do | Time limit |
|---|---|---|
| **Access** to information | Say honestly what exists: normally nothing after the chat has ended. During a live chat, the volunteer can confirm what the room contains. For SMS, the room exists until deleted. Record the request and answer in writing. | `[30 days]` *(verify)* |
| **Rectification** | There is no profile to correct. Explain this in the answer. | same |
| **Erasure / stop** | Live web chat: a volunteer types `!oubli` (or `!fin`). SMS: type `!oubli` in the room, or an administrator calls the API command `erase_caller` with the caller's number. The bot leaves and forgets the room and removes the records. **Ask every volunteer who took part to delete the room on their device.** The SMS opt-out fingerprint stays so the person is not texted again. | answer as soon as done; within `[30 days]` |
| **Withdrawal of consent** | The visitor ends the chat; same as erasure. | immediate |
| **Complaint** | Log it, answer in writing, and tell the person they may contact the Commission d’accès à l’information. | `[30 days]` |

Keep a short log of each request (date, type, answer, date answered), without the content of any
conversation. Verify the requester's identity as far as reasonably possible; for an anonymous chat
this usually means that only the person who is chatting *now* can be confirmed.

## Part E — Volunteer confidentiality commitment (template)

> **Confidentiality commitment — `[ORGANIZATION NAME]` chat service**
>
> I, `[NAME]`, volunteer for `[ORGANIZATION NAME]`, commit to the following when answering the chat or SMS service:
>
> 1. I keep **confidential** everything I learn through the service. I never discuss a conversation
>    with anyone except, when needed, the person responsible for privacy.
> 2. I do **not** copy, screenshot, record, forward or export a conversation, and I do not try to find out who the person is.
> 3. When a conversation ends (or the person asks to be forgotten) I **delete the room** in my own Matrix client,
>    and I never keep notes that could identify someone.
> 4. I protect my device: screen lock, up-to-date software, no sharing of my account, I sign out
>    on devices I do not own. I use only the Matrix account given to me for this service.
> 5. I answer only as `[ROLE]`, I do not give medical or legal advice, and I follow the
>    organization's guidelines (including the emergency procedure `[LINK]`).
> 6. I report **immediately** to `[PRIVACY OFFICER]` any loss of a device, any message sent to the wrong
>    person, any suspected access by someone else, or anything that may be a confidentiality incident.
> 7. These commitments continue after I stop volunteering. A breach may end my participation and, where
>    the law applies, have other consequences.
>
> Name: ______________  Signature: ______________  Date: ______________

Provide short training on the commands (`!ok`, `!fin`, `!oubli`, `!aide`) and on deleting rooms.

## Part F — Confidentiality incident register (template)

A confidentiality incident is access, use or disclosure not authorized by law, loss of personal
information, or any other breach of its protection. **Record every incident, even a minor one that
you do not report** *(verify the register contents and retention requirements; five years is
commonly cited)*.

| # | Date noticed | Date of incident | What happened | Information involved | People concerned (number) | Cause | Risk of **serious injury**? (sensitivity of the information, foreseeable consequences, likelihood of misuse) | Commission notified (date) | People notified (date) | Measures taken to reduce risk and prevent repeat | Closed (date, by) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | | |

**Decision:** if the incident presents a risk of serious injury, notify the Commission d’accès à
l’information **and** the people concerned **promptly** *(verify the form and content of the notice)*.
Because chat content from a recovery service is highly sensitive, treat any exposure of conversation
content as presenting that risk until assessed otherwise. Technical first steps are in
[law25.md](law25.md), section 6.

## Part G — Privacy impact assessment (PIA / EFVP) skeleton

A PIA is required for projects of acquisition, development or overhaul of an information system
involving personal information, and before communicating information outside Quebec *(verify)*.
Pre-filled with the facts of WP Chat; complete the bracketed parts.

| Section | Content |
|---|---|
| 1. Project | Offer an anonymous, confidential chat on `[WEBSITE]` so that `[PURPOSE]`, answered by `[WHO ANSWERS]`. Components: WordPress plugin (widget), chat server (switchboard-chat), Matrix server, reverse proxy; optional SMS line. |
| 2. Personal information | (a) content of messages, possibly **sensitive** (health, recovery, personal life); (b) a random session identifier; (c) IP address (memory, proxy logs); (d) SMS only: phone number. No name, email or account. |
| 3. Necessity and proportionality | Message content is necessary to hold the conversation. The identifier is needed to keep the conversation going. The IP address is needed to limit abuse. Nothing else is collected. `[Justify and consider alternatives, e.g. a telephone line.]` |
| 4. Parties and flows | Visitor ↔ chat server (HTTPS) ↔ encrypted Matrix room ↔ volunteers. WordPress is not in the path. Providers: `[HOSTING COMPANIES]`, `[MATRIX OPERATOR]`, `[SMS PROVIDER]`. |
| 5. Location and transfers | `[WHERE EACH SERVER IS; transfers outside Quebec and the protection assessment]` |
| 6. Retention and destruction | Web: at end of chat or after `[24 h]`; volunteers delete their copies; proxy logs `[X days]`; block list `[1 day, 30 days at most]`. SMS: after `[7 days]` of silence; opt-out fingerprint kept; backups `[HOW LONG, ENCRYPTED]`. |
| 7. Safeguards | HTTPS; end-to-end encrypted rooms; message text never on disk or in logs; origin allow-list; rate limits; numbers hashed/encrypted; secrets in environment; volunteers' commitment; incident procedure. |
| 8. Risks and mitigations | See table below. |
| 9. Residual risks | Volunteers' devices keep copies until deleted; SMS carriers keep records; the visitor's own device and network; `[OTHERS]`. |
| 10. Decision | `[APPROVED / CONDITIONS]` by `[NAME, TITLE]` on `[DATE]`; review by `[DATE]`. |

| Risk | Likelihood / impact `[RATE]` | Mitigation in place | Action if not enough |
|---|---|---|---|
| Visitor identified through proxy or host logs | `[ ]` | short log retention; no message content in logs | `[reduce retention / anonymize addresses]` |
| Volunteer keeps or shares a conversation | `[ ]` | commitment, training, deletion procedure | `[audit, remove access]` |
| Interception in transit | `[ ]` | HTTPS; encrypted rooms | – |
| Unauthorized access to the servers | `[ ]` | restricted access, secrets outside the code, encrypted fields | `[2FA, monitoring]` |
| Session token stolen or reused | `[ ]` | random value, memory only, HTTPS, short life, chat ends when the page closes | `[keep WordPress and plugins updated]` |
| Sensitive content exposed by an incident | `[ ]` | register + notification procedure | `[exercise the procedure yearly]` |

## 9. Alignment checklist (before going live and at every change)

| Check | Where | ☐ |
|---|---|---|
| Retention sentence equals `WEB_IDLE_TIMEOUT_MIN` | plugin settings ↔ chat server | ☐ |
| Privacy contact and policy URL filled in | plugin settings | ☐ |
| Policy (Part A) published, linked from the plugin, dated, in French (and English if bilingual) | website | ☐ |
| Policy states the real log retention of proxy/host | your servers' log settings | ☐ |
| Hosting locations and transfers outside Quebec stated and assessed | Part A, Part G | ☐ |
| SMS block present only if SMS is offered, with `SMS_IDLE_RETENTION_DAYS` | Part A, `.env` | ☐ |
| Volunteers trained and signed the commitment (Part E) | governance file | ☐ |
| Request procedure and incident register in place (Parts D, F) | governance file | ☐ |
| PIA completed and approved (Part G) | governance file | ☐ |
| Backups encrypted, secrets (`PHONE_ENC_KEY`, `PHONE_HASH_SECRET`) stored apart | operations | ☐ |
| `WEB_ALLOWED_ORIGINS` lists only your sites | chat server | ☐ |
| Review date set (at least yearly, and after any change to the service) | governance file | ☐ |
