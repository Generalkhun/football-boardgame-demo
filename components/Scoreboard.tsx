'use client';

import React from 'react';
import { GameState, TeamSide } from '../types/game';
import {
  Clock,
  Shield,
  Layers,
  Award,
  Users,
  Bot,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ScoreboardProps {
  gameState: GameState;
  isAiEnabled: boolean;
  onToggleAi: () => void;
  onOpenFormationModal: (team: TeamSide) => void;
  onOpenManagerModal: (team: TeamSide) => void;
  onOpenRulesModal: () => void;
  onRestartMatch: () => void;
  onEndTurn: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  gameState,
  isAiEnabled,
  onToggleAi,
  onOpenFormationModal,
  onOpenManagerModal,
  onOpenRulesModal,
  onRestartMatch,
  onEndTurn,
  soundEnabled,
  onToggleSound,
}) => {
  const {
    homeScore,
    awayScore,
    matchMinute,
    half,
    currentTurnTeam,
    ball,
    units,
    homeMentalTrack,
    awayMentalTrack,
    isGameOver,
  } = gameState;

  const currentCarrier =
    ball.status === 'in-possession' && ball.possessionUnitId
      ? units[ball.possessionUnitId]
      : null;

  const formatTime = (min: number) => {
    const mm = Math.min(90, Math.floor(min)).toString().padStart(2, '0');
    return `${mm}:00`;
  };

  return (
    <div className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-950 p-4 text-white shadow-2xl">
      {/* Top Banner: Broadcast Match Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
        {/* Teams & Score */}
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Home Team */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 font-black text-sm text-white shadow-md border border-sky-400">
              MCI
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                Sky Blue City
                {currentTurnTeam === 'home' && (
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                )}
              </div>
              <div className="text-[11px] text-zinc-400">
                Mental: <span className="font-bold text-purple-300">{homeMentalTrack > 0 ? `+${homeMentalTrack}` : homeMentalTrack}</span>
              </div>
            </div>
          </div>

          {/* Score Box */}
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-1.5 border border-zinc-800 shadow-inner">
            <span className="text-2xl sm:text-3xl font-black text-sky-400">{homeScore}</span>
            <span className="text-lg font-bold text-zinc-600">-</span>
            <span className="text-2xl sm:text-3xl font-black text-red-500">{awayScore}</span>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-black text-white flex items-center justify-end gap-1.5">
                {currentTurnTeam === 'away' && (
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                )}
                Crimson United
              </div>
              <div className="text-[11px] text-zinc-400">
                Mental: <span className="font-bold text-purple-300">{awayMentalTrack > 0 ? `+${awayMentalTrack}` : awayMentalTrack}</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 font-black text-sm text-white shadow-md border border-red-400">
              LIV
            </div>
          </div>
        </div>

        {/* Match Clock & Half */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-1.5 border border-zinc-800">
            <Clock className="h-4 w-4 text-amber-400" />
            <div className="text-right">
              <div className="font-mono text-sm font-black text-amber-300">
                {formatTime(matchMinute)}
              </div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">
                {isGameOver ? 'Full Time' : half === 1 ? '1st Half (0-45\')' : '2nd Half (45-90\')'}
              </div>
            </div>
          </div>

          {/* Turn Indicator Pill */}
          <div
            className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${
              currentTurnTeam === 'home'
                ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                : 'bg-red-950/80 text-red-300 border-red-800'
            }`}
          >
            {gameState.turnPhase.startsWith('reorg')
              ? 'Reorg Phase: '
              : gameState.turnPhase === 'repo-defending'
              ? 'Repo (Defending): '
              : gameState.turnPhase === 'repo-attacking'
              ? 'Repo (Attacking): '
              : 'Turn: '}
            {currentTurnTeam === 'home' ? 'Home (Sky Blue)' : 'Away (Crimson)'}
          </div>
        </div>
      </div>

      {/* Middle Bar: Ball Possession Status & Strategic Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Ball Possession Details */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Ball Status:</span>
          {ball.status === 'in-possession' ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-950/80 px-2.5 py-1 font-bold text-emerald-300 border border-emerald-800">
              ⚽ Controlled by {currentCarrier ? `#${currentCarrier.card.number} ${currentCarrier.card.name}` : 'Team'}
              <span className="text-[10px] text-emerald-400/80">({ball.possessionTeam === 'home' ? 'Home' : 'Away'})</span>
              {gameState.turnPhase === 'repo-defending' && (
                <span className="text-[10px] text-amber-300 font-bold ml-1">• Repo (Defending)</span>
              )}
              {gameState.turnPhase === 'repo-attacking' && (
                <span className="text-[10px] text-sky-300 font-bold ml-1">• Repo (Attacking)</span>
              )}
            </span>
          ) : ball.status === 'free-ball' ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-amber-950/80 px-2.5 py-1 font-bold text-amber-300 border border-amber-800 animate-pulse">
              ⚡ Free Ball (Contested Loose Ball)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg bg-blue-950/80 px-2.5 py-1 font-bold text-blue-300 border border-blue-800">
              🛑 Dead Ball ({ball.deadBallType || 'Set Piece'})
              {gameState.turnPhase === 'reorg-attacking' && (
                <span className="text-[10px] text-sky-300 font-normal"> — Attacking Reorg</span>
              )}
              {gameState.turnPhase === 'reorg-defending' && (
                <span className="text-[10px] text-red-300 font-normal"> — Defending Reorg</span>
              )}
            </span>
          )}
        </div>

        {/* Quick Modal Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Formation Modals */}
          <button
            onClick={() => onOpenFormationModal('home')}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 hover:bg-sky-950 hover:text-sky-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-all cursor-pointer"
          >
            <Users className="h-3.5 w-3.5 text-sky-400" />
            Home Formation
          </button>
          <button
            onClick={() => onOpenFormationModal('away')}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 hover:bg-red-950 hover:text-red-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-all cursor-pointer"
          >
            <Users className="h-3.5 w-3.5 text-red-400" />
            Away Formation
          </button>

          {/* Manager Strategy Cards Modals */}
          <button
            onClick={() => onOpenManagerModal(currentTurnTeam)}
            className="flex items-center gap-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 px-2.5 py-1.5 text-xs font-bold text-amber-300 border border-amber-800/80 transition-all cursor-pointer"
          >
            <Award className="h-3.5 w-3.5 text-amber-400" />
            Manager Cards
          </button>

          {/* Rulebook */}
          <button
            onClick={onOpenRulesModal}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-800 cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
            Rules
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="rounded-lg bg-zinc-900 hover:bg-zinc-800 p-1.5 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
            title="Toggle stadium sound effects"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* AI vs 2-Player Hotseat Toggle */}
          <button
            onClick={onToggleAi}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
              isAiEnabled
                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            {isAiEnabled ? 'AI Opponent ON' : '2-Player Hotseat'}
          </button>

          {/* End Turn / Pass Initiative Button */}
          <button
            onClick={onEndTurn}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-black uppercase text-white shadow-md transition-all cursor-pointer"
          >
            Pass Initiative ➔
          </button>
        </div>
      </div>
    </div>
  );
};
