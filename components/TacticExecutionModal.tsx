'use client';

import React, { useState, useEffect } from 'react';
import {
  UnitOnField,
  ManagerCard,
  TeamSide,
  TacticType,
  PhysicalAction,
  UnitPosition,
} from '../types/game';
import { resolveDuel, DuelResult, positionToKey } from '../lib/gameRules';
import { SoundEffects } from '../lib/constants';
import {
  Swords,
  Dices,
  ShieldAlert,
  Flame,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TacticExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tacticType: TacticType;
  attackerUnit: UnitOnField;
  possibleDefenders: UnitOnField[];
  attackerManager?: ManagerCard;
  defenderManager?: ManagerCard;
  attackerMental: number;
  defenderMental: number;
  targetPosition?: UnitPosition;
  targetTeammate?: UnitOnField;
  onDuelCompleted: (result: DuelResult, attackerUsedPRA?: PhysicalAction, defenderUsedPRA?: PhysicalAction) => void;
}

export const TacticExecutionModal: React.FC<TacticExecutionModalProps> = ({
  isOpen,
  onClose,
  tacticType,
  attackerUnit,
  possibleDefenders,
  attackerManager,
  defenderManager,
  attackerMental,
  defenderMental,
  targetPosition,
  targetTeammate,
  onDuelCompleted,
}) => {
  // Attacker options
  const [attackerFaceUp, setAttackerFaceUp] = useState<boolean>(true);
  const [attackerPRA, setAttackerPRA] = useState<PhysicalAction | undefined>(undefined);

  // Defender selection & options
  const [selectedDefenderId, setSelectedDefenderId] = useState<string>(
    possibleDefenders[0]?.id || ''
  );
  const [defenderFaceUp, setDefenderFaceUp] = useState<boolean>(true);
  const [defenderPRA, setDefenderPRA] = useState<PhysicalAction | undefined>(undefined);

  // Rolling state
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [diceVisual, setDiceVisual] = useState<{ atk: number; def: number }>({ atk: 1, def: 1 });
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);

  useEffect(() => {
    if (possibleDefenders.length > 0 && !selectedDefenderId) {
      setSelectedDefenderId(possibleDefenders[0].id);
    }
  }, [possibleDefenders, selectedDefenderId]);

  if (!isOpen) return null;

  const selectedDefender = possibleDefenders.find((d) => d.id === selectedDefenderId);

  const handleExecuteClash = () => {
    setIsRolling(true);
    setDuelResult(null);
    SoundEffects.playDiceRoll();

    // Dice animation interval
    let ticks = 0;
    const interval = setInterval(() => {
      setDiceVisual({
        atk: Math.floor(Math.random() * 6) + 1,
        def: Math.floor(Math.random() * 6) + 1,
      });
      ticks++;
      if (ticks > 12) {
        clearInterval(interval);
        // Calculate true result
        const result = resolveDuel({
          tactic: tacticType,
          attackerUnit,
          defenderUnit: selectedDefender,
          attackerManager,
          defenderManager,
          attackerMental,
          defenderMental,
          attackerUsedPRA: attackerPRA,
          defenderUsedPRA: defenderPRA,
        });

        setDiceVisual({
          atk: result.attackerDice,
          def: result.defenderDice,
        });
        setDuelResult(result);
        setIsRolling(false);

        // Sound effect based on outcome
        if (result.outcomeType === 'goal') {
          SoundEffects.playWhistle();
          SoundEffects.playCheer();
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {
            // Ignore if in test env
          }
        } else if (result.outcomeType === 'save' || result.outcomeType === 'tackled') {
          SoundEffects.playTackle();
        } else {
          SoundEffects.playKick();
        }
      }
    }, 60);
  };

  const handleFinish = () => {
    if (duelResult) {
      onDuelCompleted(duelResult, attackerPRA, defenderPRA);
    }
  };

  const attackerTeamName = attackerUnit.team === 'home' ? 'Home (Sky Blue)' : 'Away (Crimson)';
  const defenderTeamName = attackerUnit.team === 'home' ? 'Away (Crimson)' : 'Home (Sky Blue)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl border-2 border-zinc-700 bg-zinc-950 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Tactical Duel Resolution
                </span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-white border border-zinc-700">
                  {tacticType}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {attackerUnit.card.name} executing {tacticType}
              </h2>
            </div>
          </div>
          {!duelResult && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Clash Setup Grid: Attacker Card vs Defender Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Attacking Side */}
            <div className="rounded-xl border-2 border-sky-500/50 bg-sky-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Attacking Initiative ({attackerTeamName})
                </span>
                <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-300 border border-sky-500/40">
                  Initiative Gain
                </span>
              </div>

              {/* Attacker Unit Info */}
              <div className="flex items-center gap-3 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white font-black text-sm">
                  {attackerUnit.card.number}
                </div>
                <div>
                  <div className="font-bold text-white">{attackerUnit.card.name}</div>
                  <div className="text-xs text-zinc-400">
                    {attackerUnit.card.positionName} • {attackerUnit.card.role}
                  </div>
                </div>
              </div>

              {/* Card Deployed State (Face Up vs Face Down from demo images) */}
              <div className="space-y-1.5 text-xs">
                <span className="text-zinc-400">Player Card Deployed Status:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAttackerFaceUp(true)}
                    className={`rounded-lg py-1.5 px-2 text-xs font-semibold border ${
                      attackerFaceUp
                        ? 'bg-sky-600 text-white border-sky-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Face-Up (Activated)
                  </button>
                  <button
                    onClick={() => setAttackerFaceUp(false)}
                    className={`rounded-lg py-1.5 px-2 text-xs font-semibold border ${
                      !attackerFaceUp
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Face-Down (Stealth)
                  </button>
                </div>
              </div>

              {/* Physical Requirement Action (PRA) Selection */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Commit PRA (+1 Die, +1 Fatigue):</span>
                  {attackerPRA && (
                    <span className="text-[10px] text-amber-300 font-bold">+1 Fatigue Token</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setAttackerPRA(undefined)}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold border ${
                      !attackerPRA
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    None
                  </button>
                  {attackerUnit.card.preferredPRA.map((pra) => (
                    <button
                      key={pra}
                      onClick={() => setAttackerPRA(pra)}
                      className={`rounded px-2.5 py-1 text-[11px] font-semibold border ${
                        attackerPRA === pra
                          ? 'bg-amber-500 text-black border-amber-300 font-bold'
                          : 'bg-zinc-900 text-amber-200 border-zinc-800 hover:border-amber-500/50'
                      }`}
                    >
                      ⚡ {pra}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Modifiers list */}
              <div className="pt-2 border-t border-zinc-800 text-[11px] space-y-1 text-zinc-300">
                <div className="flex justify-between">
                  <span>Manager Strategy ({attackerManager?.name || 'Standard'}):</span>
                  <span className="text-emerald-400 font-bold">
                    +{attackerManager?.inPossessionTactic.bonusValue || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Team Mental Track:</span>
                  <span className={attackerMental >= 0 ? 'text-purple-400' : 'text-red-400'}>
                    {attackerMental >= 0 ? `+${attackerMental}` : attackerMental}
                  </span>
                </div>
                {attackerUnit.minorInjuries > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Minor Injury Penalty:</span>
                    <span>-{attackerUnit.minorInjuries}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Defending Side */}
            <div className="rounded-xl border-2 border-red-500/50 bg-red-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Defending Response ({defenderTeamName})
                </span>
                <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold text-red-300 border border-red-500/40">
                  Response Action
                </span>
              </div>

              {/* Defender Selection */}
              {possibleDefenders.length > 0 ? (
                <div>
                  <span className="text-xs text-zinc-400 mb-1 block">Choose Primary Defender:</span>
                  <select
                    value={selectedDefenderId}
                    onChange={(e) => setSelectedDefenderId(e.target.value)}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-xs text-white font-bold"
                  >
                    {possibleDefenders.map((def) => (
                      <option key={def.id} value={def.id}>
                        #{def.card.number} {def.card.name} ({def.card.positionName}) — Tack {def.card.stats.tackling}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded-lg bg-zinc-900/60 p-3 text-xs text-zinc-400 border border-zinc-800">
                  No direct defender in zone (Uncontested pitch defense)
                </div>
              )}

              {/* Defender Card Deployed Status */}
              <div className="space-y-1.5 text-xs">
                <span className="text-zinc-400">Player Card Deployed Status:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDefenderFaceUp(true)}
                    className={`rounded-lg py-1.5 px-2 text-xs font-semibold border ${
                      defenderFaceUp
                        ? 'bg-red-600 text-white border-red-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Face-Up (Activated)
                  </button>
                  <button
                    onClick={() => setDefenderFaceUp(false)}
                    className={`rounded-lg py-1.5 px-2 text-xs font-semibold border ${
                      !defenderFaceUp
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Face-Down (Stealth)
                  </button>
                </div>
              </div>

              {/* Defender PRA */}
              {selectedDefender && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Commit PRA (+1 Die, +1 Fatigue):</span>
                    {defenderPRA && (
                      <span className="text-[10px] text-amber-300 font-bold">+1 Fatigue Token</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setDefenderPRA(undefined)}
                      className={`rounded px-2.5 py-1 text-[11px] font-semibold border ${
                        !defenderPRA
                          ? 'bg-zinc-800 text-white border-zinc-600'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      None
                    </button>
                    {selectedDefender.card.preferredPRA.map((pra) => (
                      <button
                        key={pra}
                        onClick={() => setDefenderPRA(pra)}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold border ${
                          defenderPRA === pra
                            ? 'bg-amber-500 text-black border-amber-300 font-bold'
                            : 'bg-zinc-900 text-amber-200 border-zinc-800 hover:border-amber-500/50'
                        }`}
                      >
                        🛡️ {pra}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Modifiers list */}
              <div className="pt-2 border-t border-zinc-800 text-[11px] space-y-1 text-zinc-300">
                <div className="flex justify-between">
                  <span>Manager Strategy ({defenderManager?.name || 'Standard'}):</span>
                  <span className="text-amber-400 font-bold">
                    +{defenderManager?.outOfPossessionTactic.bonusValue || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Team Mental Track:</span>
                  <span className={defenderMental >= 0 ? 'text-purple-400' : 'text-red-400'}>
                    {defenderMental >= 0 ? `+${defenderMental}` : defenderMental}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dice & Clash Action Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 text-center">
            {/* Visual Dice Display */}
            <div className="flex items-center justify-center gap-10 my-3">
              {/* Attacker Die */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-sky-400">Attacker Roll</span>
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-sky-400 bg-sky-950 font-black text-3xl text-sky-200 shadow-xl ${
                    isRolling ? 'animate-bounce' : ''
                  }`}
                >
                  {diceVisual.atk}
                </div>
              </div>

              <div className="text-2xl font-black text-zinc-500">VS</div>

              {/* Defender Die */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-red-400">Defender Roll</span>
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-red-400 bg-red-950 font-black text-3xl text-red-200 shadow-xl ${
                    isRolling ? 'animate-bounce' : ''
                  }`}
                >
                  {diceVisual.def}
                </div>
              </div>
            </div>

            {/* Roll Button */}
            {!duelResult && (
              <button
                onClick={handleExecuteClash}
                disabled={isRolling}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-black uppercase tracking-wider text-black shadow-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 cursor-pointer"
              >
                <Dices className="h-5 w-5" />
                {isRolling ? 'Rolling Dice...' : 'Roll Dice & Resolve Duel (d6)'}
              </button>
            )}

            {/* Duel Outcome Breakdown */}
            {duelResult && (
              <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-left space-y-3">
                <div
                  className={`rounded-lg p-3 text-center text-sm font-black tracking-wide border ${
                    duelResult.success
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                      : 'border-red-500 bg-red-950/60 text-red-200'
                  }`}
                >
                  {duelResult.description}
                </div>

                {/* Score breakdown side by side */}
                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  {/* Attacker breakdown */}
                  <div className="space-y-1 bg-zinc-900/60 p-3 rounded-lg border border-sky-900/40">
                    <div className="font-bold text-sky-400 flex justify-between">
                      <span>Attacker Total:</span>
                      <span className="text-base font-black">{duelResult.attackerTotal}</span>
                    </div>
                    {duelResult.attackerBreakdown.map((item, idx) => (
                      <div key={idx} className="text-zinc-400">
                        • {item}
                      </div>
                    ))}
                  </div>

                  {/* Defender breakdown */}
                  <div className="space-y-1 bg-zinc-900/60 p-3 rounded-lg border border-red-900/40">
                    <div className="font-bold text-red-400 flex justify-between">
                      <span>Defender Total:</span>
                      <span className="text-base font-black">{duelResult.defenderTotal}</span>
                    </div>
                    {duelResult.defenderBreakdown.map((item, idx) => (
                      <div key={idx} className="text-zinc-400">
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-2 text-center">
                  <button
                    onClick={handleFinish}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 shadow-md cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Apply Outcome & Continue Match
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
