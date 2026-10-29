'use client';

import React from 'react';
import { MatchLogEntry } from '../types/game';
import { MessageSquare, Bell } from 'lucide-react';

interface MatchLogProps {
  logs: MatchLogEntry[];
}

export const MatchLog: React.FC<MatchLogProps> = ({ logs }) => {
  return (
    <div className="flex h-56 w-full flex-col rounded-2xl border-2 border-zinc-800 bg-zinc-950 p-3 text-white shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
            Live Match Commentary & Tactical Log
          </h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          {logs.length} Events Recorded
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
            Kick-off underway! Tactical moves will appear here...
          </div>
        ) : (
          logs.map((log) => {
            const badgeColor =
              log.type === 'goal'
                ? 'bg-amber-500 text-black font-black'
                : log.type === 'tackle'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : log.type === 'pass'
                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                : log.type === 'injury'
                ? 'bg-orange-950 text-orange-300 border border-orange-800'
                : 'bg-zinc-800 text-zinc-300';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 rounded-lg bg-zinc-900/60 p-2 text-xs border border-zinc-800/60"
              >
                <span className="font-mono text-[10px] font-bold text-zinc-400 shrink-0 mt-0.5">
                  {log.minute}&apos;
                </span>
                <span className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${badgeColor}`}>
                  {log.type}
                </span>
                <span className="flex-1 text-zinc-200 text-[11px] leading-relaxed">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
