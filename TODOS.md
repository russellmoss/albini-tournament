# TODOS

## Post-MVP

### Spectator "highlight my row" via cookie

**What:** When a spectator opens `/groups` or `/bracket`, their own name is visually highlighted (golden left edge instead of green) so they can find themselves at a glance.

**Why:** Belonging matters at events. Seeing your own name lit up in the live standings is the small pleasure that turns a passive viewer into an invested one.

**Pros:**
- Higher emotional engagement for spectators.
- Trivial to test (load the page in two browsers, see different highlights).
- Reusable pattern for any future tournaments.

**Cons:**
- Adds a "claim your name" flow (probably a `/claim?token=...` link in the group chat, OR an in-app picker).
- Cookie persistence + clearing logic.
- Risk: nobody uses it because the URL gets shared AFTER the group draw (when interest spikes).

**Context:** Surfaced in `/plan-design-review` on 2026-04-18 for the First Inaugural Albini Invitational. Deferred from MVP because the spec for the claim flow alone is ~2h of work and the Second Annual is a better moment to add it (you'll know which spectator interactions actually mattered on night one).

**Depends on / blocked by:** Nothing. Can be added any time post-launch.

**Where to start:** Add a `claimed_player_id` cookie. New `/claim` page or `?claim=PLAYER_ID` query param on landing. Update group/bracket components to compare cookie to row's player_id, swap accent class.
