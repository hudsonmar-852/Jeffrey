# Information Architecture

## Primary user journey

```text
Daily message
  → Landing invitation
  → 60-second challenge
  → Completion
  → Surprise unlock
  → Wellness passport
  → Invite one friend
  → Optional private message
```

## Public routes planned for Sprint 2

| Route | Purpose |
|---|---|
| `/wellness/` | Main landing page |
| `/wellness/challenge/` | Daily challenge |
| `/wellness/unlock/` | Reward reveal |
| `/wellness/passport/` | Streak and earned unlocks |
| `/wellness/ripple/` | Care-based invitation and anonymous ripple count |
| `/wellness/library/` | Recovery protocols and collections |
| `/wellness/stories/` | Consented real-life wins |
| `/wellness/private-message/` | Private support CTA |
| `/wellness/privacy/` | Privacy and data-use notice |

## Admin routes planned later

| Route | Purpose |
|---|---|
| `/admin/overview/` | Key engagement metrics |
| `/admin/challenges/` | Challenge content management |
| `/admin/rewards/` | Surprise unlock management |
| `/admin/ripple/` | Aggregated invitation metrics |
| `/admin/messages/` | Daily WhatsApp copy |
| `/admin/content-review/` | AI output approval queue |

## Navigation rules

- The first visit must not lead with participant counts.
- One primary action per screen.
- No forced registration before completing the first challenge.
- Personal data collection is optional and requires clear consent.
- Ripple tracking uses anonymous referral tokens by default.
- Public leaderboards should not expose identity or contact details.

## Data entities for future backend

- `challenge`
- `challenge_completion`
- `anonymous_participant`
- `passport_progress`
- `reward_unlock`
- `ripple_invitation`
- `consent_record`
- `private_message_intent`
- `content_source`
- `admin_user`

## Analytics events

- `landing_viewed`
- `challenge_started`
- `challenge_completed`
- `reward_revealed`
- `passport_viewed`
- `ripple_link_created`
- `ripple_link_opened`
- `private_message_clicked`

Only aggregated statistics should be shown publicly.