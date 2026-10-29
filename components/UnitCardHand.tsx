'use client';

import React, { useState } from 'react';
import { UnitCard, UnitOnField, TeamSide, TacticType } from '../types/game';
import {
  Shield,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Crosshair,
  Footprints,
  Send,
  Sparkles,
} from 'lucide-react';

interface UnitCardHandProps {
  team: TeamSide;
  handCards: UnitCard[];
  units: Record<string, UnitOnField>;
  selectedUnitId: string | null;
  onSelectUnit: (unit: UnitOnField) => void;
  onInitiateTactic: (unitId: string, tactic: TacticType) => void;
  ballCarrierId: string | null;
  isCurrentTurn: boolean;
  isTeamInPossession: boolean;
  isRepo?: boolean;
  repoMovesUsed?: Record<string, number>;
  repoRunUnits?: Record<string, boolean>;
  onToggleRepoRunPRA?: (unitId: string) => void;
}

export const UnitCardHand: React.FC<UnitCardHandProps> = ({
  team,
  handCards,
  units,
  selectedUnitId,
  onSelectUnit,
  onInitiateTactic,
  ballCarrierId,
  isCurrentTurn,
  isTeamInPossession,
  isRepo,
  repoMovesUsed,
  repoRunUnits,
  onToggleRepoRunPRA,
}) => {
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const filteredCards = handCards.filter(
    (c) => filterRole === 'ALL' || c.role === filterRole
  );

  return (
    <div className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-950 p-3 text-white shadow-xl">
      {/* Hand Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              team === 'home' ? 'bg-sky-400' : 'bg-red-500'
            }`}
          />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
            {team === 'home' ? 'Home' : 'Away'} Hand: 11 Starting Unit Cards
          </h3>
          <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-800">
            {handCards.length} Cards in Hand
          </span>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1 text-[10px]">
          {['ALL', 'FW', 'MF', 'DF', 'GK'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`rounded px-2 py-0.5 font-bold transition-all ${
                filterRole === role
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Carousel / Grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        {filteredCards.map((card) => {
          const unitOnField = units[card.id];
          const isSelected = selectedUnitId === card.id;
          const hasBall = ballCarrierId === card.id;
          const isHome = team === 'home';

          return (
            <div
              key={card.id}
              onClick={() => {
                if (unitOnField) onSelectUnit(unitOnField);
              }}
              className={`relative flex w-44 shrink-0 flex-col justify-between rounded-xl border-2 p-2.5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-zinc-900 shadow-[0_0_15px_rgba(251,191,36,0.25)] scale-[1.02]'
                  : hasBall
                  ? 'border-yellow-400 bg-zinc-900/90 shadow-[0_0_12px_rgba(250,204,21,0.2)]'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              {/* Card Top Pill: Number, Role, Position */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                        isHome
                          ? card.isGoalkeeper
                            ? 'bg-amber-400 text-black'
                            : 'bg-sky-500 text-white'
                          : card.isGoalkeeper
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {card.number}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-300">
                      {card.positionName}
                    </span>
                  </div>

                  {hasBall && (
                    <span className="flex items-center gap-1 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-black text-yellow-300 border border-yellow-500/40 animate-pulse">
                      ⚽ BALL
                    </span>
                  )}
                </div>

                {/* Player Name */}
                <div className="text-xs font-black text-white truncate mb-1">
                  {card.name}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-1 rounded bg-zinc-950/70 p-1.5 text-[9px] text-zinc-300 border border-zinc-800/80 mb-2">
                  <div>
                    <span className="text-zinc-500">PAC:</span> <b className="text-white">{card.stats.pace}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500">PAS:</span> <b className="text-white">{card.stats.passing}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500">DRI:</span> <b className="text-white">{card.stats.dribbling}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500">TCK:</span> <b className="text-white">{card.stats.tackling}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500">SHT:</span> <b className="text-white">{card.stats.shooting}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500">STA:</span> <b className="text-white">{card.stats.stamina}</b>
                  </div>
                </div>

                {/* Preferred Physical Actions (PRA) */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {card.preferredPRA.slice(0, 2).map((pra) => (
                    <span
                      key={pra}
                      className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[8.5px] font-semibold text-amber-300 border border-amber-500/20"
                    >
                      ⚡ {pra}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tactic Action Buttons if Ball Carrier */}
              {isCurrentTurn && isTeamInPossession && hasBall && !isRepo && (
                <div className="space-y-1 border-t border-zinc-800 pt-1.5">
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInitiateTactic(card.id, 'Short Pass');
                      }}
                      className="rounded bg-sky-700 hover:bg-sky-600 px-1.5 py-1 font-bold text-white shadow"
                    >
                      Short Pass
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInitiateTactic(card.id, 'Dribble');
                      }}
                      className="rounded bg-emerald-700 hover:bg-emerald-600 px-1.5 py-1 font-bold text-white shadow"
                    >
                      Dribble
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInitiateTactic(card.id, 'Shoot');
                    }}
                    className="w-full rounded bg-amber-600 hover:bg-amber-500 px-1.5 py-1 text-[9px] font-black uppercase tracking-wider text-black shadow"
                  >
                    ⚽ Shoot on Goal
                  </button>
                </div>
              )}

              {/* Reposition (Repo) controls on card */}
              {isRepo && isCurrentTurn && (
                <div className="border-t border-zinc-800 pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-300">
                    <span>Repo:</span>
                    <span className="font-bold text-sky-400">
                      Moves: {repoMovesUsed?.[card.id] || 0}/{repoRunUnits?.[card.id] ? 2 : 1}
                      {(repoMovesUsed?.[card.id] || 0) >= (repoRunUnits?.[card.id] ? 2 : 1)
                        ? ' ✓'
                        : ''}
                    </span>
                  </div>
                  {!repoRunUnits?.[card.id] && onToggleRepoRunPRA && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRepoRunPRA(card.id);
                      }}
                      className="w-full rounded bg-amber-500/20 hover:bg-amber-500/30 px-1 py-1 text-[8.5px] font-bold text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                    >
                      ⚡ Run [PRA] (+1 Move)
                    </button>
                  )}
                </div>
              )}

              {/* Out-of-possession defensive response buttons */}
              {isCurrentTurn && !isTeamInPossession && !isRepo && (
                <div className="border-t border-zinc-800 pt-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInitiateTactic(card.id, 'Tackle');
                    }}
                    className="w-full rounded bg-red-700 hover:bg-red-600 px-1.5 py-1 text-[9px] font-bold text-white shadow"
                  >
                    Press / Tackle
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
