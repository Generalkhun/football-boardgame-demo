'use client';

import React from 'react';
import { X, BookOpen, CheckCircle, Shield, Activity, Dices, Award } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border-2 border-zinc-700 bg-zinc-950 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Football Board Game — Official Rules & Component Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-300 leading-relaxed">
          {/* Objective */}
          <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
            <h3 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-2">
              🏆 Match Objective
            </h3>
            <p>
              Each side competes to deliver the Ball into the opposite team&apos;s goal net (called <b>Score</b>).
              The team with more goals when the 90-minute match clock expires wins the match!
            </p>
          </div>

          {/* Component 1: Field */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              1. Football Field & Unique Grid Mechanics
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-300">
              <li><b>Pitch Size:</b> 6 × 11 square grid. Each square is called a <b>Zone</b>.</li>
              <li><b>Coordinates:</b> Width side named <b>A to F</b> in order. Length side named <b>1 to 11</b> in order.</li>
              <li><b>Capacity Limit:</b> Each Zone contains a maximum of <b>2 units</b>.</li>
              <li><b>Positioning Placements:</b> Units can stay <b>inside</b> a zone, <b>on the line</b>, and <b>on the corner</b> of the zone.</li>
              <li><b>Line Placement:</b> A unit staying on a line is considered contained in <b>both</b> zones sharing that line, affecting both container limits!</li>
              <li><b>Corner Placement:</b> A unit staying on a corner <b>never counts</b> in any container&apos;s limit!</li>
              <li><b>Tactical Range:</b> When executing a tactic in a zone, <i>Unit in the Zone</i> means any unit that is inside, on the line, or on the corner of that zone.</li>
            </ul>
          </div>

          {/* Component 2 & 3: Units & Ball */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              2. Units, Ball Possession & Kick-off Reorganization (Reorg)
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-300">
              <li><b>11 Units per Side:</b> Distinct jersey colors for each team (Sky Blue vs Crimson Red).</li>
              <li><b>Goalkeepers:</b> Distinct keeper jersey color (Neon Yellow vs Emerald Green).</li>
              <li><b>Ball Possession Statuses:</b>
                <span className="block pl-4 mt-1">
                  1. <b>In-Possession:</b> Controlled by an attacking unit.<br />
                  2. <b>Free Ball:</b> Loose ball in open territory, contested by adjacent units.<br />
                  3. <b>Dead Ball:</b> Set pieces (Kick-off, Goal Kick, Throw-in, Corner, Free Kick, Penalty).
                </span>
              </li>
              <li className="pt-1 text-amber-200">
                <b>Kick-off Dead Ball & Reorg Action:</b> When a match starts or after a goal is scored, the ball starts as <b>Dead Ball (Kick-off)</b>.
                <span className="block pl-4 mt-1 text-zinc-300">
                  • <b>Attacking side</b> (in possession) Reorgs first: can move <b>All units</b> on their side freely.<br />
                  • <b>Defending side</b> (out of possession) follows: can move <b>All units</b> on their side freely.<br />
                  • <b>Crucial Exception:</b> Only the <b>Unit having the Ball must remain still</b>!
                </span>
              </li>
            </ul>
          </div>

          {/* Component 4 & 5: Cards */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              3. Unit Cards & Manager Strategy Cards
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-300">
              <li><b>Unit Cards:</b> 11 starting unit cards in hand. Substitutes kept face-down on the bench. Cards can be deployed Face-Up (activated) or Face-Down.</li>
              <li><b>Manager Cards:</b> 5 manager cards per team. Each side chooses <b>1 In-Possession card</b> and <b>1 Out-of-Possession card</b>.</li>
              <li><b>Free Adjustment:</b> Managers can freely swap their active strategy card whenever possession changes!</li>
              <li><b>Formation Synergy:</b> Matching active formation (e.g. 4-3-3, 4-4-2) grants bonus dice roll power.</li>
            </ul>
          </div>

          {/* Component 6: Formation, Fatigue & Mental Track */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              4. Formation Screen, Fatigue Stacking & Injuries
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-300">
              <li><b>Physical Requirement Actions (PRA):</b> Sprint, Slide Tackle, High Press, Power Shot, Aerial Duel grant +1 dice bonus but add <b>1 Fatigue Token</b>.</li>
              <li><b>2-Slot Fatigue Stacks:</b> Each unit has 2 slots, holding up to 5 tokens each.</li>
              <li><b>Minor Injury Conversion:</b> When a slot reaches 5 tokens, all 5 convert into <b>1 Minor Injury token</b> (-1 to duels).</li>
              <li><b>Major Injury Conversion:</b> When a unit collects 2 Minor Injuries, they convert into <b>1 Major Injury token</b> (-2 to duels, high risk!).</li>
              <li><b>Team Mental Track (-2 to +2):</b> Tracks psychological composure. Modifies all tactical duels directly.</li>
            </ul>
          </div>

          {/* Component 7: Dice Duel Resolution */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              5. Tactical Execution & 6-Sided Dice (d6)
            </h3>
            <p>
              Attacker declares a tactic (Pass, Dribble, Shoot). Defender reacts with a tackle/intercept/block. Both roll 1d6 + modifiers:
            </p>
            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 border border-zinc-800">
              Total = Dice Roll (d6) + Player Stat + Manager Strategy Bonus + Mental Track + PRA Bonus - Fatigue Penalties
            </div>
          </div>

          {/* Component 8: Reposition (Repo) */}
          <div className="rounded-xl border border-sky-900/60 bg-sky-950/20 p-4 space-y-2">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              6. Reposition (Repo) Phase & Run [PRA]
            </h3>
            <p className="text-zinc-300">
              After complete tactical execution (unless a Goal was scored), both teams enter the <b>Reposition (Repo)</b> phase before repeating tactical execution:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-300">
              <li><b>Sequence:</b> <b>Defending side</b> repositions each defending unit 1 move first, then <b>Attacking side</b> follows.</li>
              <li><b>1-Move Adjacency Rules:</b>
                <span className="block pl-4 mt-0.5 text-zinc-400">
                  1) Move Unit inside Zone ➔ to an adjacent Line or Corner in that Zone<br />
                  2) Move Unit on Line ➔ to an adjacent Zone or adjacent Corner<br />
                  3) Move Unit on Corner ➔ to an adjacent Line or adjacent Zone
                </span>
              </li>
              <li><b>Run [PRA] Action:</b> Each side may perform <b>Run [PRA]</b> on a designated unit to gain <b>+1 additional move</b> (2 moves total) at the cost of <b>+1 Fatigue token</b>!</li>
              <li><b>Repeat Tactical Execution:</b> Once both sides complete repositioning, the attacking side in possession initiates their next tactic.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-zinc-900 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-700"
          >
            Understood! Let&apos;s Play
          </button>
        </div>
      </div>
    </div>
  );
};
