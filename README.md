# Football Boardgame — 2-Player Turn-Based Web Prototype

A tactical, web-based football board game inspired by modern tabletop sports games and trading-card manager strategy.

---

## 🎯 Match Objective
- Each side competes to deliver the Ball into the net on the opposite team (**Score**).
- The team that scores more goals within the shared 90-minute match time limit wins the match.

---

## 🧩 Components & Mechanics Implemented

### 1. Football Field & Unique Grid Placements
- **6 × 11 Square Grid:**
  - Width: **A to F** in order.
  - Length: **1 to 11** in order.
- **Zone Capacity Limit:** Each Zone holds a maximum of **2 units**.
- **Three Placement Types:**
  1. **Inside Zone:** Contained in that specific square (counts 1 towards zone limit).
  2. **On the Line:** Placed on the edge between two adjacent zones. Considered contained in **both** zones sharing that line, affecting both container limits!
  3. **On the Corner:** Placed on the intersection of 4 zones. **Never counts** towards any container's limit!
- **Tactical Reach:** When executing a tactic (attacking or defending) in a zone, *Unit in the Zone* includes all units that are inside, on the line, or on the corner of that zone.

### 2. Units & Teams
- **2-Player Hotseat or Human vs AI:**
  - **Home (Sky Blue City):** Defends Row 1, attacks Row 11. Goalkeeper in Neon Yellow.
  - **Away (Crimson United):** Defends Row 11, attacks Row 1. Goalkeeper in Emerald Green.
- 11 starting units on field + 5 substitutes on the bench for each side.

### 3. Ball Possession States
- **In-Possession:** Ball is held by an active unit.
- **Free Ball:** Loose ball in open territory, contested by adjacent units.
- **Dead Ball:** Set pieces (Kick-off, Goal Kick, Throw-in, Free Kick, Corner Kick, Penalty).
- **Time Consumption:** Every possession change calculates match time consumption (1 to 4 minutes).

### 4. Unit Cards
- 11 Starting Unit Cards in hand for each side + facedown substitutes deck.
- Unit card deployment: **Face-Up (Activated)** or **Face-Down (Stealth)**.
- Detailed stats: Pace, Passing, Dribbling, Tackling, Shooting, Stamina.
- Preferred Physical Requirement Actions (PRA).

### 5. Manager Strategy Cards
- 5 Legendary Manager cards per team (Guardiola, Klopp, Mourinho, Ancelotti, Arteta).
- Choose **1 In-Possession card** and **1 Out-of-Possession card**.
- **Free Adjustment:** Teams can freely adjust their active manager card whenever the ball possession changes!
- **Formation Synergy:** Matching preferred formation (e.g., 4-3-3, 4-4-2) gives tactical bonuses.

### 6. Formation Screen & Fatigue/Injury Token System
- Interactive squad screen displaying 11 starting units + substitutes bench.
- **2-Slot Fatigue Token Stack:**
  - Each slot can contain up to 5 Fatigue tokens.
  - When a slot fills to 5 tokens, all 5 convert to **1 Minor Injury token** (-1 duel penalty).
  - When a unit accumulates **2 Minor Injury tokens**, they convert into **1 Major Injury token** (-2 duel penalty).
- Committing a Physical Requirement Action (PRA: Sprint, Slide Tackle, High Press, Power Shot, Aerial Duel) adds 1 Fatigue token.
- **Team Mental Track:** Scale from **-2 to +2** (Panicked, Shaken, Composed, Confident, On Fire) that directly modifies dice duel totals.

### 7. Dice & Tactical Duel Resolution (d6)
- Standard 6-sided dice duel for resolving tackles, dribbles, passes, saves, and shots:
  ```
  Total = 1d6 + Player Stat + Manager Strategy Bonus + Mental Track + PRA Bonus - Fatigue/Injury Penalties
  ```

### 8. Reposition (Repo) Phase & Run [PRA]
- **Timing:** After every tactical execution (Pass, Dribble, Tackle, Save, Foul), both sides enter the **Reposition (Repo)** phase before repeating tactical execution.
- **Turn Sequence:** **Defending side** repositions first, then **Attacking side** follows.
- **1-Move Adjacency Rules:**
  1. Unit inside Zone ➔ moves to line or corner of that Zone
  2. Unit on line ➔ moves to adjacent Zone or adjacent corner
  3. Unit on corner ➔ moves to adjacent line or adjacent Zone
- **Run [PRA] Action:** Each side may commit **Run [PRA]** on a designated unit to gain **+1 additional move** (total 2 moves) at the cost of **+1 Fatigue token**!
- **Resume Tactical Execution:** Once both sides finish repositioning, tactical execution resumes with the attacking team in possession!

---

## 🚀 Running the Prototype Locally

```bash
cd football-game
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🕹️ How to Play
1. **Kick-Off:** Sky Blue City starts in possession with striker Erling Haaland (#9) at D6.
2. **Execute a Tactic:**
   - Click the ball carrier or select their card in hand.
   - Choose **Pass**, **Dribble**, or **⚽ Shoot on Goal**.
   - If Pass/Dribble, click any highlighted valid target spot on the pitch (inside zone, on a line, or on a corner).
3. **Resolve the Tactical Duel:**
   - Both teams choose Face-Up or Face-Down deployment.
   - Option to commit PRA (e.g. Power Shot, Slide Tackle) for +1 die at the cost of +1 fatigue.
   - Click **Roll Dice & Resolve Duel (d6)**.
   - Read the detailed numerical breakdown and narrative commentary.
   - Click **Apply Outcome & Continue Match**.
4. **Possession Changes & Manager Cards:**
   - Click **Manager Cards** at any time to switch active In-Possession or Out-of-Possession strategy cards.
5. **Formation & Substitutions:**
   - Click **Home Formation** or **Away Formation** to inspect fatigue slots, convert injuries, substitute bench players, or adjust mental tracks.

