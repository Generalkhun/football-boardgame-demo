'use client';

import React, { useState } from 'react';
import { UnitOnField, UnitCard, TeamSide } from '../types/game';
import { FORMATIONS } from '../lib/constants';
import { addFatigueTokens } from '../lib/gameRules';
import { X, UserPlus, HeartPulse, Sparkles, Activity, ShieldAlert, Award } from 'lucide-react';

interface FormationScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamSide;
  units: Record<string, UnitOnField>;
  subs: UnitCard[];
  formation: string;
  mentalTrack: number; // -2 to +2
  onUpdateFormation: (team: TeamSide, newFormation: string) => void;
  onUpdateMentalTrack: (team: TeamSide, newMental: number) => void;
  onUpdateUnitFatigue: (unitId: string, slot1: number, slot2: number, minor: number, major: number) => void;
  onSubstitute: (starterId: string, subId: string) => void;
}

export const FormationScreenModal: React.FC<FormationScreenModalProps> = ({
  isOpen,
  onClose,
  team,
  units,
  subs,
  formation,
  mentalTrack,
  onUpdateFormation,
  onUpdateMentalTrack,
  onUpdateUnitFatigue,
  onSubstitute,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [substituteModalForId, setSubstituteModalForId] = useState<string | null>(null);

  if (!isOpen) return null;

  const teamUnits = Object.values(units).filter((u) => u.team === team);
  const teamColorClass =
    team === 'home'
      ? 'border-sky-500 bg-sky-950/90 text-sky-200'
      : 'border-red-500 bg-red-950/90 text-red-200';

  const teamName = team === 'home' ? 'Home (Sky Blue City)' : 'Away (Crimson United)';

  const handleAddToken = (unit: UnitOnField) => {
    const res = addFatigueTokens(unit, 1);
    onUpdateUnitFatigue(
      unit.id,
      res.unit.fatigueSlot1,
      res.unit.fatigueSlot2,
      res.unit.minorInjuries,
      res.unit.majorInjuries
    );
  };

  const handleClearFatigue = (unit: UnitOnField) => {
    onUpdateUnitFatigue(unit.id, 0, 0, unit.minorInjuries, unit.majorInjuries);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border-2 border-zinc-700 bg-zinc-950 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${team === 'home' ? 'bg-sky-400' : 'bg-red-500'}`} />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                📋 Formation & Squad Screen — {teamName}
              </h2>
              <p className="text-xs text-zinc-400">
                Manage starting 11, monitor 2-slot Fatigue tokens (max 5 each), injuries, and Team Mental track
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700">
              <span className="text-zinc-400">Formation:</span>
              <select
                value={formation}
                onChange={(e) => onUpdateFormation(team, e.target.value)}
                className="bg-zinc-900 border border-zinc-600 rounded px-2 py-0.5 text-xs text-white font-semibold cursor-pointer"
              >
                {FORMATIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Rules Explanation Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <Activity className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-amber-300">Fatigue & Injury Rules:</b> Each unit has 2 Fatigue slots (max 5 tokens each).
                When a slot fills to 5 tokens, all 5 convert to <b className="text-amber-400">1 Minor Injury token</b>.
                When a unit collects <b className="text-red-400">2 Minor Injuries</b>, they convert into <b className="text-red-500">1 Major Injury token</b>.
                Committing Physical Requirement Actions (PRA like Sprint, Slide Tackle, Power Shot) stacks fatigue!
              </div>
            </div>
          </div>

          {/* 11 Starting Units Grid */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Starting 11 Players ({teamUnits.length})</span>
              <span className="text-xs normal-case text-zinc-400">Click a player to view PRA stats & substitutions</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamUnits.map((unit) => {
                const totalFatigue = unit.fatigueSlot1 + unit.fatigueSlot2;
                const hasInjury = unit.minorInjuries > 0 || unit.majorInjuries > 0;

                return (
                  <div
                    key={unit.id}
                    className={`rounded-xl border p-3 transition-all ${
                      selectedUnitId === unit.id
                        ? 'border-amber-400 bg-zinc-900 ring-2 ring-amber-400/40'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                    onClick={() => setSelectedUnitId(unit.id)}
                  >
                    {/* Player Info Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-black text-xs ${
                            team === 'home'
                              ? unit.card.isGoalkeeper
                                ? 'bg-amber-400 text-black'
                                : 'bg-sky-500 text-white'
                              : unit.card.isGoalkeeper
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          {unit.card.number}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            {unit.card.name}
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                              {unit.card.positionName}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Pace {unit.card.stats.pace} • Pass {unit.card.stats.passing} • Drib {unit.card.stats.dribbling} • Tack {unit.card.stats.tackling}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubstituteModalForId(unit.id);
                        }}
                        className="rounded bg-zinc-800 p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        title="Substitute player"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Fatigue Slots (2 Slots, Max 5 tokens each) */}
                    <div className="space-y-1.5 mt-2.5 pt-2 border-t border-zinc-800/80">
                      {/* Slot 1 */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Fatigue Slot 1:</span>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span
                              key={`s1-${i}`}
                              className={`h-3 w-3 rounded-full border ${
                                i < unit.fatigueSlot1
                                  ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                                  : 'bg-zinc-800 border-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Slot 2 */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Fatigue Slot 2:</span>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span
                              key={`s2-${i}`}
                              className={`h-3 w-3 rounded-full border ${
                                i < unit.fatigueSlot2
                                  ? 'bg-amber-500 border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                                  : 'bg-zinc-800 border-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Injury Badges & Controls */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        {unit.minorInjuries > 0 && (
                          <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                            🩹 Minor ({unit.minorInjuries})
                          </span>
                        )}
                        {unit.majorInjuries > 0 && (
                          <span className="flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/40 animate-pulse">
                            🚑 Major ({unit.majorInjuries})
                          </span>
                        )}
                        {!hasInjury && totalFatigue === 0 && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            ✓ Fully Fresh
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToken(unit);
                          }}
                          className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                          title="Add PRA Fatigue token"
                        >
                          +1 Fatigue
                        </button>
                        {totalFatigue > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFatigue(unit);
                            }}
                            className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white"
                            title="Reset fatigue tokens"
                          >
                            Rest
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Substitutions Bench Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-sky-400" />
              Substitutes Bench (Facedown Deck: {subs.length} Available)
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              Swap any starter with a substitute when fatigued or injured.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {subs.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-center"
                >
                  <div className="text-xs font-bold text-zinc-200">
                    #{sub.number} {sub.name}
                  </div>
                  <div className="text-[10px] text-zinc-400">{sub.positionName}</div>
                  <div className="mt-1 text-[9px] text-zinc-500">
                    P{sub.stats.pace} • Pas{sub.stats.passing} • Tack{sub.stats.tackling}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Mental Track */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Team Mental Track (-2 to +2 Scale)
                </h3>
              </div>
              <span className="text-xs font-bold text-purple-300">
                Current Effect:{' '}
                {mentalTrack === -2
                  ? '-2 Dice Roll Penalty (Panicked)'
                  : mentalTrack === -1
                  ? '-1 Dice Roll Penalty (Shaken)'
                  : mentalTrack === 0
                  ? '0 (Neutral / Composed)'
                  : mentalTrack === 1
                  ? '+1 Dice Roll Advantage (Confident)'
                  : '+2 Dice Roll Advantage (On Fire)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Team morale shifts based on key moments (scoring goals, conceding, heroic tackles, manager speeches).
            </p>

            {/* Visual Mental Scale */}
            <div className="grid grid-cols-5 gap-2">
              {[-2, -1, 0, 1, 2].map((level) => {
                const isCurrent = mentalTrack === level;
                const labels: Record<number, { title: string; color: string; desc: string }> = {
                  [-2]: { title: 'Panicked (-2)', color: 'border-red-600 bg-red-950/60 text-red-300', desc: '-2 to all duels' },
                  [-1]: { title: 'Shaken (-1)', color: 'border-orange-600 bg-orange-950/60 text-orange-300', desc: '-1 to all duels' },
                  [0]: { title: 'Composed (0)', color: 'border-zinc-700 bg-zinc-900 text-zinc-300', desc: 'Standard play' },
                  [1]: { title: 'Confident (+1)', color: 'border-blue-600 bg-blue-950/60 text-blue-300', desc: '+1 to all duels' },
                  [2]: { title: 'On Fire (+2)', color: 'border-emerald-600 bg-emerald-950/60 text-emerald-300', desc: '+2 to all duels' },
                };

                return (
                  <button
                    key={level}
                    onClick={() => onUpdateMentalTrack(team, level)}
                    className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                      labels[level].color
                    } ${
                      isCurrent
                        ? 'ring-2 ring-white shadow-lg scale-105 font-bold'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{labels[level].title}</div>
                    <div className="text-[10px] text-zinc-400">{labels[level].desc}</div>
                    {isCurrent && (
                      <div className="mt-1 text-[10px] text-purple-300 font-black">
                        ★ ACTIVE
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal for Selecting a Substitute */}
        {substituteModalForId && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-white">
              <h4 className="text-base font-bold text-white mb-2">
                Make Substitution for {units[substituteModalForId]?.card.name}
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Select an available substitute from the bench to replace this player on the pitch.
              </p>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      onSubstitute(substituteModalForId, sub.id);
                      setSubstituteModalForId(null);
                    }}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3 hover:border-sky-500 cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">
                        #{sub.number} {sub.name} ({sub.positionName})
                      </div>
                      <div className="text-xs text-zinc-400">
                        Pace {sub.stats.pace} • Pass {sub.stats.passing} • Tack {sub.stats.tackling}
                      </div>
                    </div>
                    <button className="rounded bg-sky-600 px-3 py-1 text-xs font-bold text-white">
                      Swap
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSubstituteModalForId(null)}
                className="w-full rounded-lg bg-zinc-800 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
