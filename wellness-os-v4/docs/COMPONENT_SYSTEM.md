# Component System

## Foundation components

- `AppShell`
- `SiteHeader`
- `BottomNavigation`
- `Section`
- `Stack`
- `Cluster`
- `Card`
- `Button`
- `IconButton`
- `Badge`
- `ProgressBar`
- `Modal`
- `Toast`
- `Disclosure`
- `EmptyState`
- `SafetyNotice`

## Wellness components

### `ChallengeHero`
Displays the invitation without public statistics on first view.

Required fields:
- Eyebrow
- Caring headline
- Short explanation
- Surprise teaser
- Primary start action

### `ChallengeSteps`
- Maximum four simple steps
- Large touch targets
- Clear completion state
- No medically risky movement without review

### `UnlockReveal`
- Honest reward title
- Useful content
- Rarity is optional and must not imply monetary value
- Reduced-motion alternative

### `WellnessPassport`
- Completion stamps
- Streak summary
- Next unlock preview
- No shame language after missed days

### `RippleInvite`
- Care-based copy
- One share action
- Anonymous referral token
- Clear distinction between link creation and actual completion

### `PrivateMessageCard`
- Friendly explanation
- Optional CTA
- Privacy link
- No booking pressure

### `ProtocolCard`
Required metadata:
- Goal
- Intended audience
- Duration
- Steps
- Why it may help
- Common mistakes
- Stop conditions
- Evidence note and review date

### `RealWinCard`
- Explicit publication consent
- No unsupported treatment claim
- May be anonymised
- Date and context

## Accessibility requirements

- WCAG 2.2 AA target
- Minimum 44 × 44 CSS-pixel interactive targets
- Visible keyboard focus
- Semantic headings
- No information conveyed by colour alone
- Reduced-motion support
- Traditional Chinese labels and clear form errors

## Interaction rules

- One dominant CTA per screen
- User may exit at every stage
- No dark patterns
- No preselected marketing consent
- No forwarding threat or social-pressure countdown
- Existing Daily Reminder production UI remains independent until migration is approved
