'use client';

import React from 'react';
import { ManagerCard, TeamSide, BallPossessionStatus } from '../types/game';
import { X, Check, ShieldCheck, Flame, BookOpen, Award } from 'lucide-react';
import Image from 'next/image';

interface ManagerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamSide;
  managerCards: ManagerCard[];
  activeInPossessionId: string;
  activeOutOfPossessionId: string;
  onSelectInPossession: (team: TeamSide, cardId: string) => void;
  onSelectOutOfPossession: (team: TeamSide, cardId: string) => void;
  currentFormation: string;
  ballStatus: BallPossessionStatus;
  isTeamInPossession: boolean;
}

export const ManagerCardModal: React.FC<ManagerCardModalProps> = ({
  isOpen,
  onClose,
  team,
  managerCards,
  activeInPossessionId,
  activeOutOfPossessionId,
  onSelectInPossession,
  onSelectOutOfPossession,
  currentFormation,
  ballStatus,
  isTeamInPossession,
}) => {
  if (!isOpen) return null;

  const teamName = team === 'home' ? 'Home (Sky Blue City)' : 'Away (Crimson United)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border-2 border-zinc-700 bg-zinc-950 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${team === 'home' ? 'bg-sky-400' : 'bg-red-500'}`} />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                👔 Manager Strategy Cards — {teamName}
              </h2>
              <p className="text-xs text-zinc-400">
                Choose 1 In-Possession card & 1 Out-of-Possession card. Adjust freely whenever ball possession changes!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active Strategy Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/50 px-6 py-3 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold uppercase tracking-wider">In-Possession Card:</span>
              <span className="rounded bg-emerald-950/80 px-2.5 py-1 font-bold text-emerald-300 border border-emerald-800">
                {managerCards.find((c) => c.id === activeInPossessionId)?.name || 'None'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-semibold uppercase tracking-wider">Out-of-Possession Card:</span>
              <span className="rounded bg-amber-950/80 px-2.5 py-1 font-bold text-amber-300 border border-amber-800">
                {managerCards.find((c) => c.id === activeOutOfPossessionId)?.name || 'None'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-zinc-400">Current Formation:</span>
            <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
              {currentFormation}
            </span>
            <span className="text-[11px] text-zinc-400">
              Matching formation grants <b className="text-amber-300">+Advantage</b> in duels
            </span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {managerCards.map((card) => {
              const isInPossActive = card.id === activeInPossessionId;
              const isOutOfPossActive = card.id === activeOutOfPossessionId;
              const isFormationMatch = card.preferredFormation === currentFormation;

              return (
                <div
                  key={card.id}
                  className={`flex flex-col justify-between rounded-xl border-2 p-3.5 transition-all relative overflow-hidden ${
                    isInPossActive && isOutOfPossActive
                      ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : isInPossActive
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : isOutOfPossActive
                      ? 'border-amber-500 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <div className="text-base font-black text-white">{card.name}</div>
                        <div className="text-[10px] text-zinc-400">Tactical Mastermind</div>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${
                          isFormationMatch
                            ? 'bg-amber-400 text-black border-amber-300 animate-pulse'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {card.preferredFormation}
                      </span>
                    </div>

                    {/* Card Mock Photo / Visual Artwork */}
                    <div className="relative mb-2.5 h-32 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                      {card.image ? (
                        <img
                          src={card.image}
                          alt={card.name}
                          className="h-full w-full object-cover object-top opacity-90 transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-3xl">
                          👔
                        </div>
                      )}
                      {isFormationMatch && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/50">
                          ★ Formation Synergy
                        </span>
                      )}
                    </div>

                    {/* Quote */}
                    <p className="text-[10px] italic text-zinc-400 mb-2 border-l-2 border-zinc-700 pl-2">
                      &quot;{card.quote}&quot;
                    </p>

                    {/* In Possession Ability */}
                    <div className="mb-2 rounded-lg border border-emerald-900/60 bg-emerald-950/40 p-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-0.5">
                        <span>⚡ In-Possession</span>
                        <span className="text-[10px] text-emerald-300 font-mono">+{card.inPossessionTactic.bonusValue} {card.inPossessionTactic.bonusStat}</span>
                      </div>
                      <div className="font-semibold text-white text-[11px]">{card.inPossessionTactic.name}</div>
                      <div className="text-[10px] text-zinc-300 mt-0.5 leading-snug">
                        {card.inPossessionTactic.description}
                      </div>
                    </div>

                    {/* Out of Possession Ability */}
                    <div className="mb-3 rounded-lg border border-amber-900/60 bg-amber-950/40 p-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-0.5">
                        <span>🛡️ Out-of-Possession</span>
                        <span className="text-[10px] text-amber-300 font-mono">+{card.outOfPossessionTactic.bonusValue} {card.outOfPossessionTactic.bonusStat}</span>
                      </div>
                      <div className="font-semibold text-white text-[11px]">{card.outOfPossessionTactic.name}</div>
                      <div className="text-[10px] text-zinc-300 mt-0.5 leading-snug">
                        {card.outOfPossessionTactic.description}
                      </div>
                    </div>
                  </div>

                  {/* Selection Buttons */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <button
                      onClick={() => onSelectInPossession(team, card.id)}
                      className={`w-full rounded py-1.5 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isInPossActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-emerald-900 hover:text-white'
                      }`}
                    >
                      {isInPossActive ? <Check className="h-3 w-3" /> : null}
                      {isInPossActive ? 'In-Possession Active' : 'Set as In-Possession'}
                    </button>

                    <button
                      onClick={() => onSelectOutOfPossession(team, card.id)}
                      className={`w-full rounded py-1.5 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isOutOfPossActive
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-amber-900 hover:text-white'
                      }`}
                    >
                      {isOutOfPossActive ? <Check className="h-3 w-3" /> : null}
                      {isOutOfPossActive ? 'Out-of-Possession Active' : 'Set as Out-of-Possession'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-800 bg-zinc-900 px-6 py-3 text-xs text-zinc-400 flex items-center justify-between">
          <span>
            💡 <b>Manager Advantage:</b> Matching manager strategy to the game state provides bonus dice power during tactical duels.
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            Done Adjusting
          </button>
        </div>
      </div>
    </div>
  );
};
