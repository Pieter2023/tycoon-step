# Build 53: Phase 1 slice 5, one milestone track (2026-09-25, branch `town-lighting-pass`)

Pieter delegated the design on 2026-09-25: "decide whatever you think works best overall and gives the best user experience". Plan: `docs/phase1-plan.md`.

## What was there

A mapping pass over the code found seven separate goal systems:
- 19 quests per player, with a Quest Log modal grouped by category and reachable from five places;
- the dashboard's "next best step" card;
- the first-steps mission;
- three city journeys, which give badges;
- three monthly notice-board challenges, with no reward;
- milestone moments, celebrated only inside the city;
- quiz certifications.

Nothing told the player which goal mattered next, and quests finished by closing the month got no toast at all: the monthly tick moved them to "ready" before App's sync looked.

## The design: the Freedom Track

One ordered track of the core goals in the order personal finance takes them. It runs **inside the existing quest engine** (`updateQuests`), so claiming, rewards, toasts, confetti and save files keep working.

| Chapter | Milestones |
|---|---|
| 1 · Safety first | Build Your Reserve (+$2,000 from pay), First Investment (with a month of cash kept) |
| 2 · Build the base | $10k invested, Emergency Fund (3 months in cash **and savings**), Diversify (3 kinds) |
| 3 · Money that works | Credit 720, $500/mo passive income, **Coast point** (new) |
| 4 · Freedom | **25% free**, **50% free**, **75% free** (new), then Freedom Day (the win) |

- **A chapter at a time.** All of a chapter's milestones are active together. The next chapter opens once each is ready or claimed, and milestones already met move straight to ready (the engine repeats until settled).
- **Nothing in chapter one is free on day one.** The emergency fund moved to chapter two, because every character's starting cash already covers three months.
- **Four new milestones on one new metric**, `FREEDOM_COVERAGE`: the win check's own `financialFreedom()` figure in percent.
  - The coast point is 17%: at 6% after inflation, what is invested grows to the target in 30 years without another deposit.
  - Their rewards are happiness and less stress, not cash, so the economy stays honest.
- **The emergency fund counts savings deposits.** A high-yield savings account is where one belongs; before, it counted cash only.
- **Story and side goals.** The character's story quests and side goals (hustles, career, the Investor / Entrepreneur / Debt Crusher branch) share two slots beside the chapter, story first. Up to five goals are active at once (`MAX_ACTIVE_QUESTS`).
- **Older saves.** A later chapter's milestone held as active waits for its chapter. Every ready reward stays claimable. `test/FreedomTrack.test.ts` runs the production fixture save through it.

### Where it shows

- **Dashboard (compact and full views).** "Freedom track": the chapter, its milestones with live progress, every reward waiting to be claimed (from any chapter), the character's story line, "Next: \<chapter\>" and "See the whole track".
- **The goals log (Quick actions → Quests, and the other entry points).** Retitled "Freedom track": four chapters (later ones marked "Opens in chapter n"), Freedom Day, "Your story", "Side goals", and Claim all.
- **The city's notice board.** The quest section is the Freedom Track: the chapter heading, ready rewards, then the chapter's milestones, then story and side goals. The three monthly challenges stay as the board's habits.
- **The city header strip.** Once the three guided journeys are done it reads "FREEDOM TRACK · CHAPTER n/4" plus the next milestone, not the challenge list.
- **Celebrations.**
  - App's quest sync now compares with what it has already announced, so a milestone reached by closing the month gets "Milestone reached: …" with a Claim button.
  - Finishing a chapter gets one bigger "Chapter n complete: … Next up: …" moment with confetti.
  - Loading a save doesn't replay old ones.

### The meters

- **Life tab and mobile Profile.** Energy and stress lead: they set this month's actions and the burnout risk. Happiness, health, networking and financial IQ sit under "More about you".
- **Financial IQ's tooltip** promised a passive-income boost that does not exist. It now says what it does: at 60+ it adds points to the yearly review.
- **The compact dashboard, the default view,** already showed only the freedom figure (now with its pace) and actions left.
- **The simulation** is unchanged; only what is on screen moved.

## Checks

- **`test/FreedomTrack.test.ts` (6):**
  - every character starts on chapter one, their story and one side goal, with nothing ready;
  - a chapter opens and cascades;
  - savings count toward the emergency fund;
  - the coverage milestones;
  - the pre-release production save lands in chapter two with its ready rewards intact;
  - the view model.
- **`test/FreedomTrackUI.test.tsx` (5):**
  - the card;
  - claiming from it;
  - the four-chapter log;
  - the city strip after the journeys;
  - the month-close toast, driven through App. Reverting the sync fix makes it fail.
- **Existing tests** were updated where they named the old labels: the board test ("Freedom track", "See the whole track →") and the active-count bound. The strategy ranking still holds.
- **Totals:** 463 tests / 83 files and the production build pass.
- **Browser (`localhost:5191`, the production fixture save at month 8):**
  - "Continue building my buffer" showed the card: "Chapter 2 of 4 · Build the base · 5 of 12 milestones", the emergency fund at 72% (2.2 / 3.0 months), five ready rewards across three chapters, and "Your story: Automation Payoff · 50%".
  - Claiming Build Your Reserve moved cash from $9,941 to $10,141.
  - The log shows the chapters as done / current / upcoming, with "Your story" and "Side goals".
  - The notice board in the city reads "Freedom track · Chapter 2: Build the base · 5/12".
  - The Lifestyle sheet leads with Energy 100 and Stress 0, with the other four collapsed.
