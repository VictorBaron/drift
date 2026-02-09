## Build Sequence for ShoulderTap

### Phase 1: Skeleton & Slack OAuth

Get the app installable and receiving events.

- Nest.js app with Bolt.js wired in
- Slack app manifest configured (scopes, event subscriptions)
- User token OAuth flow working (install button → tokens stored)
- Log every incoming message event to console
- Deploy somewhere (Railway/Render) so Slack can reach it

**Milestone:** Install app on a test workspace, see your own messages logged.

---

### Phase 2: Database & Pre-filtering

Store data and skip the obvious noise.

- Set up Postgres + MikroORM
- Save users, channels, incoming messages
- Track user activity (last message sent per channel)
- Implement heuristic filters: skip if user is active, skip if no mention, etc.
- Log which messages pass vs. get filtered

**Milestone:** Only ~30% of messages make it past the filter.

---

### Phase 3: LLM Scoring

Add intelligence.

- Build the urgency scoring prompt
- Call Claude/GPT for messages that pass pre-filter
- Store urgency score + reason with each message
- Send immediate DM for urgency 5 (critical)

**Milestone:** Get a DM when something actually urgent happens.

---

### Phase 4: Google Calendar Integration

Make it context-aware.

- Google OAuth flow (separate from Slack OAuth)
- Sync calendar events for each user
- Detect "natural breaks" (meeting ended, gap in schedule)
- Queue urgency 3–4 messages, flush on break

**Milestone:** Messages arrive after your meeting ends, not during.

---

### Phase 5: Batching & Digest

Complete the notification tiers.

- Batch logic for important-but-not-urgent (3–4)
- Daily digest job for low-priority (1–2)
- DM formatting: summaries, deep links, grouping by channel

**Milestone:** End of day, you get one digest with the FYI stuff.

---

### Phase 6: User Preferences & Feedback

Let users tune it.

- Slack slash command or App Home for settings
- VIP senders, muted channels, working hours
- "This wasn't urgent" button on DMs → adjusts scoring

**Milestone:** Users can customize without touching code.

---

### Phase 7: Onboarding & Polish

Make it usable by others.

- Guided setup: install → connect calendar → mute Slack notifications
- Error handling, retry logic, rate limit handling
- Monitoring & alerts (Sentry, logs)

**Milestone:** Someone outside your team can install and use it.
