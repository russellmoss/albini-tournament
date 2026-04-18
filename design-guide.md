# albini-tournament — Design Guide

## 1. What Is This?

First Inaugural Albini Invitational (aka the Juergens Memorial Caroms Tournament) — a web app to run a ~15-person caroms billiards tournament in World Cup format for an in-person event.

FORMAT
- Group stage → knockout, exactly like the World Cup.
- Unknown final player count (~15, but entries are added live as people show up).
- Groups are auto-assigned, auto-named after records Steve Albini produced (e.g., In Utero, Surfer Rosa, At Action Park, Rid of Me, Pod).
- Group sizes should be as equal as possible given N players.
- Top 2 from each group + 1 wildcard advance → 8 players in knockout.
- Knockout is single-elimination from QF → SF → Final.

SEEDING & TIEBREAKERS
- Players seeded top-to-worst going into knockout.
- Group-stage tiebreaker waterfall: (1) games won, (2) total points scored, (3) point differential between the two tied players.

DATA ENTRY
- Enter players as they arrive (live roster).
- Enter match results per match as they're played.

STACK
- Next.js (rstack), Neon (Postgres), deploy on Vercel.
- ENV already configured with Anthropic + Gemini keys.

VISUAL
- Background: blurred slideshow of Albini-produced album covers cycling behind a framed content card. Text must stay readable over the moving background.
- Source images currently at C:\Users\russe\Documents\albini-tournament\images (will need to move these into the repo for Vercel).

GOAL FOR THIS SESSION
Builder mode. I want to pressure-test the design before building — especially the group-assignment algorithm, the wildcard rule, the bracket logic, and the schema. Output a design doc I can feed into /plan-eng-review.

I want to scope a small web app: a tournament management system for a 
caroms billiards tournament I'm hosting. Working title: "First Inaugural 
Albini Invitational (aka the Juergens Memorial Caroms Tournament)."

Format mirrors the FIFA World Cup:
- Group stage (round-robin within each group)
- Knockout stage with 8 participants (single elimination)
- Top 2 from each group auto-advance
- Wildcard(s) fill the remaining knockout slots
- Tiebreaker waterfall: games won → total points → point differential

Roster:
- ~15 players expected, but unknown until day-of
- Need to add players as they walk in, not pre-populate
- Auto-assign groups, optimised so groups are as equal in size as possible
- Groups named after Steve Albini-produced records (In Utero, Surfer Rosa, 
  Rid of Me, At Action Park, Pod, Goat, etc.)
- Players seeded top-to-worst going into knockout

Operator model:
- Single operator (me) enters players and match results from a laptop
- Players may want to view standings on phones — read-only is fine

Stack (already decided):
- Next.js on Vercel
- Neon Postgres (with Drizzle or Prisma — open to either)
- Built using rstack workflow
- Background: blurred slideshow of Albini album covers cycling behind a 
  framed content card so text stays legible

Decisions I need you to surface and pressure-test before we plan:

1. GROUP STRUCTURE MATH. Top-2 + "a wildcard" = 8 doesn't cleanly resolve 
   for 15 players. Force me to pick: fixed group count (e.g., always 4 
   groups, sized to fit N) or fixed group size (e.g., always 5, group 
   count varies)? What's the wildcard rule — best 3rd-place finisher by 
   the same tiebreaker waterfall?

2. MATCH SCORING MODEL. In caroms, what counts as a "game"? Is each match 
   a single game to a fixed point total (e.g., first to 25)? Or a 
   best-of-N games per match? "Games won" as primary tiebreaker only 
   makes sense if matches have multiple games. Lock the schema implication.

3. SEEDING ALGORITHM. "Top to worst" into knockout — does this mean global 
   ranking across all groups (1 vs 8, 2 vs 7, etc.) using the tiebreaker 
   waterfall? Or group winners seeded above runners-up FIFA-style?

4. GROUP ASSIGNMENT ALGORITHM. "As equal as possible" with N unknown — 
   snake draft from a seeded list? Pure random? Do I even have seeds 
   before the tournament starts, or is the first group draw blind?

5. RE-DRAW BEHAVIOUR. If a player no-shows or a late entry arrives after 
   groups are drawn, what happens? Hard rule or operator override?

6. IMAGE HOSTING. Album covers currently sit in a local Windows folder. 
   On Vercel they need to live in /public/albums or in Blob storage. 
   Decide now so it's in the spec.

7. AUTH. Does the public read-only standings view need any auth at all? 
   Probably not — but confirm so we don't accidentally build a login 
   flow nobody asked for.

8. SCOPE GUARDRAIL. What is the smallest version of this that is still 
   useful on tournament day? If I had to ship in 2 evenings instead of 
   a week, what gets cut? Push me on this.

Output I want from office-hours: a tightened design brief I can hand to 
/auto-feature (or to build-guide directly) with all 8 decisions resolved 
and any others you surface along the way.


**Users**: friends. nothing happens. who cares

**Tech stack**: 


**Data layer**: None detected


## 2. Architecture Overview

New  project. Architecture will be established during development.


### Data layer
None detected


## 3. Feature Inventory

<!-- Add features here as the project evolves. Use the format:
**F1: Feature name**
Description of what the feature does, who uses it, and key implementation details.
-->

_To be filled as the project develops._

## 4. Risk Areas

it just needs to work and track a tournament 

**If an AI agent silently gets something wrong, where does that hurt most?** For this project: [fill in based on the above risk areas — what's the worst-case cascading failure?]

## 5. Conventions and Constraints

no problem just do tihs



### Blocked Areas (never modify without explicit approval)
everything can be modified


## 6. Success Criteria

<!-- Define what "done" looks like for the current milestone. -->

_To be filled when the first milestone is defined._
