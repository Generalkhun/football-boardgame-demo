'use client';

import React, { useState } from 'react';
import {
  ColumnLabel,
  RowNumber,
  UnitPosition,
  UnitOnField,
  BallState,
  TeamSide,
} from '../types/game';
import { COLUMNS, ROWS } from '../lib/constants';
import {
  colToIndex,
  indexToCol,
  getContainerZones,
  getZoneOccupancy,
  arePositionsEqual,
  positionToKey,
} from '../lib/gameRules';
import { Shield, Activity, Sparkles } from 'lucide-react';

interface PitchBoardProps {
  units: Record<string, UnitOnField>;
  ball: BallState;
  selectedUnitId: string | null;
  onSelectUnit: (unit: UnitOnField) => void;
  onSelectPosition: (pos: UnitPosition) => void;
  targetPosition: UnitPosition | null;
  validTargetPositions?: UnitPosition[];
  currentTurn: TeamSide;
  highlightedZone?: { col: ColumnLabel; row: RowNumber } | null;
}

export const PitchBoard: React.FC<PitchBoardProps> = ({
  units,
  ball,
  selectedUnitId,
  onSelectUnit,
  onSelectPosition,
  targetPosition,
  validTargetPositions,
  currentTurn,
  highlightedZone,
}) => {
  const [hoveredPosition, setHoveredPosition] = useState<UnitPosition | null>(null);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Landscape coordinates mapping:
  // Length (1 to 11) is along X axis (left to right, 1 = Home goal, 11 = Away goal)
  // Width (A to F) is along Y axis (top to bottom, A to F)
  // Portrait coordinates mapping:
  // Width (A to F) along X axis (A to F)
  // Length (1 to 11) along Y axis (1 at bottom or top)

  // We will base SVG viewbox on landscape (width 1100, height 660)
  // Cell size: 100 x 100 each (11 cols x 6 rows => 1100 x 600, + 60 for margins)
  const cellW = 90;
  const cellH = 75;
  const pitchPadding = 40;
  const svgW = cellW * 11 + pitchPadding * 2; // 990 + 80 = 1070
  const svgH = cellH * 6 + pitchPadding * 2;  // 450 + 80 = 530

  // Calculate pixel center for any UnitPosition in landscape mode
  const getPixelCoord = (pos: UnitPosition): { x: number; y: number } => {
    const colIdx = colToIndex(pos.col); // 0 to 5 (Y axis)
    const rowIdx = pos.row - 1;         // 0 to 10 (X axis)

    if (pos.type === 'inside') {
      return {
        x: pitchPadding + rowIdx * cellW + cellW / 2,
        y: pitchPadding + colIdx * cellH + cellH / 2,
      };
    }
    if (pos.type === 'line') {
      if (pos.orientation === 'horizontal') {
        // Line between row and row+1 (vertical line on screen in landscape)
        return {
          x: pitchPadding + (rowIdx + 1) * cellW,
          y: pitchPadding + colIdx * cellH + cellH / 2,
        };
      } else {
        // Line between col and col+1 (horizontal line on screen in landscape)
        return {
          x: pitchPadding + rowIdx * cellW + cellW / 2,
          y: pitchPadding + (colIdx + 1) * cellH,
        };
      }
    }
    // Corner: intersection of row+1 and col+1
    return {
      x: pitchPadding + (rowIdx + 1) * cellW,
      y: pitchPadding + (colIdx + 1) * cellH,
    };
  };

  const isPositionTarget = (pos: UnitPosition): boolean => {
    return targetPosition !== null && arePositionsEqual(targetPosition, pos);
  };

  const isValidTarget = (pos: UnitPosition): boolean => {
    if (!validTargetPositions) return false;
    return validTargetPositions.some((p) => arePositionsEqual(p, pos));
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-4 border-emerald-950 bg-gradient-to-b from-emerald-900 to-green-950 p-2 shadow-2xl">
      {/* Header bar above pitch */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-emerald-200">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wider uppercase text-emerald-400">Tactical Pitch (6 × 11 Grid)</span>
          <span className="hidden sm:inline-block text-zinc-400">
            Width: <b className="text-white">A–F</b> | Length: <b className="text-white">1–11</b> | Zone Max: <b className="text-emerald-300">2 Units</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 border border-emerald-800 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" /> Home (Rows 1-5)
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 border border-emerald-800 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Away (Rows 7-11)
          </span>
        </div>
      </div>

      {/* SVG Football Field */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto min-w-[760px] drop-shadow-md"
          style={{ maxHeight: '68vh' }}
        >
          {/* Pitch Outer Grass Background */}
          <rect x="0" y="0" width={svgW} height={svgH} fill="#14532d" rx="16" />

          {/* Grass Alternating Stripes (11 stripes along length) */}
          {ROWS.map((r, i) => (
            <rect
              key={`stripe-${r}`}
              x={pitchPadding + i * cellW}
              y={pitchPadding}
              width={cellW}
              height={cellH * 6}
              fill={i % 2 === 0 ? '#15803d' : '#16a34a'}
              opacity="0.88"
            />
          ))}

          {/* Perimeter White Chalk Line */}
          <rect
            x={pitchPadding}
            y={pitchPadding}
            width={cellW * 11}
            height={cellH * 6}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeOpacity="0.9"
            rx="4"
          />

          {/* Goals on ends */}
          {/* Home Goal (Left, Rows C & D at Length 1) */}
          <rect
            x={pitchPadding - 24}
            y={pitchPadding + cellH * 2}
            width="24"
            height={cellH * 2}
            fill="#022c22"
            stroke="#ffffff"
            strokeWidth="3"
            opacity="0.9"
          />
          {/* Home Net pattern */}
          <line x1={pitchPadding - 16} y1={pitchPadding + cellH * 2} x2={pitchPadding - 16} y2={pitchPadding + cellH * 4} stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <line x1={pitchPadding - 8} y1={pitchPadding + cellH * 2} x2={pitchPadding - 8} y2={pitchPadding + cellH * 4} stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

          {/* Away Goal (Right, Rows C & D at Length 11) */}
          <rect
            x={pitchPadding + cellW * 11}
            y={pitchPadding + cellH * 2}
            width="24"
            height={cellH * 2}
            fill="#022c22"
            stroke="#ffffff"
            strokeWidth="3"
            opacity="0.9"
          />
          {/* Away Net pattern */}
          <line x1={pitchPadding + cellW * 11 + 8} y1={pitchPadding + cellH * 2} x2={pitchPadding + cellW * 11 + 8} y2={pitchPadding + cellH * 4} stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <line x1={pitchPadding + cellW * 11 + 16} y1={pitchPadding + cellH * 2} x2={pitchPadding + cellW * 11 + 16} y2={pitchPadding + cellH * 4} stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

          {/* Center Line (between Length 6) */}
          <line
            x1={pitchPadding + cellW * 5.5}
            y1={pitchPadding}
            x2={pitchPadding + cellW * 5.5}
            y2={pitchPadding + cellH * 6}
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity="0.8"
          />

          {/* Center Circle */}
          <circle
            cx={pitchPadding + cellW * 5.5}
            cy={pitchPadding + cellH * 3}
            r={cellH * 1.2}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <circle
            cx={pitchPadding + cellW * 5.5}
            cy={pitchPadding + cellH * 3}
            r="4.5"
            fill="#ffffff"
            opacity="0.9"
          />

          {/* Home Penalty Box (Left, Rows B to E, Length 1 to 3) */}
          <rect
            x={pitchPadding}
            y={pitchPadding + cellH * 1}
            width={cellW * 2}
            height={cellH * 4}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeOpacity="0.75"
          />
          {/* Home 6-Yard Box */}
          <rect
            x={pitchPadding}
            y={pitchPadding + cellH * 1.75}
            width={cellW * 0.8}
            height={cellH * 2.5}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          {/* Home Penalty Spot */}
          <circle
            cx={pitchPadding + cellW * 1.4}
            cy={pitchPadding + cellH * 3}
            r="3.5"
            fill="#ffffff"
            opacity="0.85"
          />

          {/* Away Penalty Box (Right, Rows B to E, Length 9 to 11) */}
          <rect
            x={pitchPadding + cellW * 9}
            y={pitchPadding + cellH * 1}
            width={cellW * 2}
            height={cellH * 4}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeOpacity="0.75"
          />
          {/* Away 6-Yard Box */}
          <rect
            x={pitchPadding + cellW * 10.2}
            y={pitchPadding + cellH * 1.75}
            width={cellW * 0.8}
            height={cellH * 2.5}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          {/* Away Penalty Spot */}
          <circle
            cx={pitchPadding + cellW * 9.6}
            cy={pitchPadding + cellH * 3}
            r="3.5"
            fill="#ffffff"
            opacity="0.85"
          />

          {/* Grid lines (Subtle dotted grid showing individual Zones A1 to F11) */}
          {ROWS.map((r, i) => (
            <line
              key={`grid-x-${r}`}
              x1={pitchPadding + i * cellW}
              y1={pitchPadding}
              x2={pitchPadding + i * cellW}
              y2={pitchPadding + cellH * 6}
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity="0.35"
            />
          ))}
          {COLUMNS.map((c, i) => (
            <line
              key={`grid-y-${c}`}
              x1={pitchPadding}
              y1={pitchPadding + i * cellH}
              x2={pitchPadding + cellW * 11}
              y2={pitchPadding + cellH * i}
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity="0.35"
            />
          ))}

          {/* Axis Labels: Length 1 to 11 on top & bottom */}
          {ROWS.map((r, i) => {
            const x = pitchPadding + i * cellW + cellW / 2;
            return (
              <g key={`col-label-${r}`}>
                <text
                  x={x}
                  y={pitchPadding - 14}
                  textAnchor="middle"
                  fill="#86efac"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {r}
                </text>
                <text
                  x={x}
                  y={pitchPadding + cellH * 6 + 24}
                  textAnchor="middle"
                  fill="#86efac"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {r}
                </text>
              </g>
            );
          })}

          {/* Axis Labels: Width A to F on left & right */}
          {COLUMNS.map((c, i) => {
            const y = pitchPadding + i * cellH + cellH / 2 + 5;
            return (
              <g key={`row-label-${c}`}>
                <text
                  x={pitchPadding - 32}
                  y={y}
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {c}
                </text>
                <text
                  x={pitchPadding + cellW * 11 + 32}
                  y={y}
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {c}
                </text>
              </g>
            );
          })}

          {/* Zone Cells (Inside Areas) */}
          {COLUMNS.map((col, cIdx) =>
            ROWS.map((row, rIdx) => {
              const x = pitchPadding + rIdx * cellW;
              const y = pitchPadding + cIdx * cellH;
              const pos: UnitPosition = { type: 'inside', col, row };
              const occupancy = getZoneOccupancy(col, row, units);
              const isFull = occupancy >= 2;
              const isTarget = isPositionTarget(pos);
              const isValid = isValidTarget(pos);
              const isHighlighted = highlightedZone?.col === col && highlightedZone?.row === row;

              return (
                <g
                  key={`zone-${col}${row}`}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => onSelectPosition(pos)}
                  onMouseEnter={() => setHoveredPosition(pos)}
                  onMouseLeave={() => setHoveredPosition(null)}
                >
                  {/* Zone background hit area */}
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={cellW - 4}
                    height={cellH - 4}
                    fill={
                      isTarget
                        ? '#f59e0b'
                        : isValid
                        ? '#3b82f6'
                        : isHighlighted
                        ? '#eab308'
                        : isFull
                        ? '#ef4444'
                        : '#ffffff'
                    }
                    fillOpacity={
                      isTarget ? 0.45 : isValid ? 0.35 : isHighlighted ? 0.35 : isFull ? 0.08 : 0.02
                    }
                    stroke={isTarget ? '#fbbf24' : isValid ? '#60a5fa' : 'transparent'}
                    strokeWidth={isTarget || isValid ? 2.5 : 0}
                    rx="6"
                  />

                  {/* Zone Coordinate & Occupancy Counter in top corner */}
                  <text
                    x={x + 6}
                    y={y + 14}
                    fill="#a7f3d0"
                    fontSize="10"
                    fontWeight="bold"
                    opacity="0.65"
                  >
                    {col}{row}
                  </text>
                  <text
                    x={x + cellW - 6}
                    y={y + 14}
                    textAnchor="end"
                    fill={isFull ? '#fca5a5' : occupancy === 1 ? '#fef08a' : '#86efac'}
                    fontSize="10"
                    fontWeight="bold"
                    opacity="0.75"
                  >
                    {occupancy}/2
                  </text>
                </g>
              );
            })
          )}

          {/* Horizontal Lines Clickable Hit Areas (Between row and row+1) */}
          {COLUMNS.map((col, cIdx) =>
            ROWS.slice(0, 10).map((row, rIdx) => {
              const pos: UnitPosition = { type: 'line', orientation: 'horizontal', col, row };
              const isTarget = isPositionTarget(pos);
              const isValid = isValidTarget(pos);
              const lineX = pitchPadding + (rIdx + 1) * cellW;
              const lineY = pitchPadding + cIdx * cellH;

              return (
                <g
                  key={`hline-${col}${row}`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPosition(pos);
                  }}
                >
                  <line
                    x1={lineX}
                    y1={lineY + 6}
                    x2={lineX}
                    y2={lineY + cellH - 6}
                    stroke={isTarget ? '#f59e0b' : isValid ? '#38bdf8' : '#ffffff'}
                    strokeWidth={isTarget || isValid ? 4 : 2}
                    strokeOpacity={isTarget ? 0.9 : isValid ? 0.8 : 0.25}
                    strokeDasharray={isValid ? '4 2' : undefined}
                  />
                  {/* Invisible thicker hit box for clicking easily */}
                  <rect
                    x={lineX - 10}
                    y={lineY}
                    width="20"
                    height={cellH}
                    fill="transparent"
                  />
                </g>
              );
            })
          )}

          {/* Vertical Lines Clickable Hit Areas (Between col and col+1) */}
          {COLUMNS.slice(0, 5).map((col, cIdx) =>
            ROWS.map((row, rIdx) => {
              const pos: UnitPosition = { type: 'line', orientation: 'vertical', col, row };
              const isTarget = isPositionTarget(pos);
              const isValid = isValidTarget(pos);
              const lineX = pitchPadding + rIdx * cellW;
              const lineY = pitchPadding + (cIdx + 1) * cellH;

              return (
                <g
                  key={`vline-${col}${row}`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPosition(pos);
                  }}
                >
                  <line
                    x1={lineX + 6}
                    y1={lineY}
                    x2={lineX + cellW - 6}
                    y2={lineY}
                    stroke={isTarget ? '#f59e0b' : isValid ? '#38bdf8' : '#ffffff'}
                    strokeWidth={isTarget || isValid ? 4 : 2}
                    strokeOpacity={isTarget ? 0.9 : isValid ? 0.8 : 0.25}
                    strokeDasharray={isValid ? '4 2' : undefined}
                  />
                  {/* Invisible thicker hit box for clicking easily */}
                  <rect
                    x={lineX}
                    y={lineY - 10}
                    width={cellW}
                    height="20"
                    fill="transparent"
                  />
                </g>
              );
            })
          )}

          {/* Corners (Intersections between 4 zones) */}
          {/* "Unit stay on the corner, never count in container's limit." */}
          {COLUMNS.slice(0, 5).map((col, cIdx) =>
            ROWS.slice(0, 10).map((row, rIdx) => {
              const pos: UnitPosition = { type: 'corner', col, row };
              const isTarget = isPositionTarget(pos);
              const isValid = isValidTarget(pos);
              const cx = pitchPadding + (rIdx + 1) * cellW;
              const cy = pitchPadding + (cIdx + 1) * cellH;

              return (
                <g
                  key={`corner-${col}${row}`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPosition(pos);
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isTarget ? 7 : isValid ? 6 : 4}
                    fill={isTarget ? '#f59e0b' : isValid ? '#38bdf8' : '#ffffff'}
                    fillOpacity={isTarget || isValid ? 0.9 : 0.3}
                    stroke="#022c22"
                    strokeWidth="1.5"
                  />
                  {/* Invisible enlarged hit target for easy touch/click */}
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />
                </g>
              );
            })
          )}

          {/* Units on Field */}
          {(() => {
            const posGroups: Record<string, UnitOnField[]> = {};
            Object.values(units).forEach((u) => {
              const k = positionToKey(u.position);
              if (!posGroups[k]) posGroups[k] = [];
              posGroups[k].push(u);
            });

            return Object.values(units).map((unit) => {
              const coord = getPixelCoord(unit.position);
              const group = posGroups[positionToKey(unit.position)] || [unit];
              const idxInGroup = group.findIndex((u) => u.id === unit.id);
              const offsetX = group.length > 1 ? (idxInGroup === 0 ? -14 : 14) : 0;
              const unitX = coord.x + offsetX;
              const unitY = coord.y;

              const isSelected = selectedUnitId === unit.id;
              const hasBall =
                ball.status === 'in-possession' && ball.possessionUnitId === unit.id;
              const isHome = unit.team === 'home';
              const isGK = unit.card.isGoalkeeper;

              // Jersey colors:
              // Home (City): Sky blue #0284c7, GK: Golden Yellow #eab308
              // Away (Liverpool): Crimson #dc2626, GK: Neon Emerald #10b981
              const jerseyColor = isHome
                ? isGK
                  ? '#eab308'
                  : '#0ea5e9'
                : isGK
                ? '#10b981'
                : '#dc2626';

              const strokeColor = isSelected
                ? '#f59e0b'
                : hasBall
                ? '#fbbf24'
                : '#ffffff';

              return (
                <g
                  key={`unit-${unit.id}`}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUnit(unit);
                  }}
                >
                  {/* Glow ring if selected or has ball */}
                  {(isSelected || hasBall) && (
                    <circle
                      cx={unitX}
                      cy={unitY}
                      r="24"
                      fill="none"
                      stroke={hasBall ? '#fef08a' : '#fde047'}
                      strokeWidth="3.5"
                      strokeDasharray={isSelected ? '4 2' : undefined}
                      className="animate-pulse"
                    />
                  )}

                  {/* Drop shadow */}
                  <circle cx={unitX + 1.5} cy={unitY + 2.5} r="17" fill="#000000" opacity="0.4" />

                  {/* Outer Token Circle */}
                  <circle
                    cx={unitX}
                    cy={unitY}
                    r="18"
                    fill={jerseyColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected || hasBall ? 3 : 2}
                  />

                  {/* Squad Number */}
                  <text
                    x={unitX}
                    y={unitY + 4.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="900"
                    fontFamily="sans-serif"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {unit.card.number}
                  </text>

                  {/* Role / Position pill badge (GK, DF, MF, FW) */}
                  <rect
                    x={unitX - 14}
                    y={unitY + 11}
                    width="28"
                    height="11"
                    fill="#09090b"
                    rx="3"
                    opacity="0.85"
                  />
                  <text
                    x={unitX}
                    y={unitY + 19.5}
                    textAnchor="middle"
                    fill={isGK ? '#fef08a' : '#e2e8f0'}
                    fontSize="7.5"
                    fontWeight="bold"
                  >
                    {unit.card.positionName}
                  </text>

                  {/* Player Name Pill */}
                  <text
                    x={unitX}
                    y={unitY - 19}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="bold"
                    className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  >
                    {unit.card.name}
                  </text>

                  {/* Fatigue / Injury Indicators */}
                  {(unit.fatigueSlot1 > 0 || unit.fatigueSlot2 > 0 || unit.minorInjuries > 0 || unit.majorInjuries > 0) && (
                    <g transform={`translate(${unitX + 10}, ${unitY - 16})`}>
                      <circle cx="0" cy="0" r="6" fill={unit.majorInjuries > 0 ? '#ef4444' : unit.minorInjuries > 0 ? '#f59e0b' : '#38bdf8'} />
                      <text x="0" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                        {unit.majorInjuries > 0 ? '🚑' : unit.minorInjuries > 0 ? '🩹' : unit.fatigueSlot1 + unit.fatigueSlot2}
                      </text>
                    </g>
                  )}
                </g>
              );
            });
          })()}

          {/* Ball (Rendered on top of units or loose in zone) */}
          {(() => {
            let ballCoord: { x: number; y: number } | null = null;
            if (ball.status === 'in-possession' && ball.possessionUnitId) {
              const carrier = units[ball.possessionUnitId];
              if (carrier) {
                const uCoord = getPixelCoord(carrier.position);
                ballCoord = { x: uCoord.x + 13, y: uCoord.y + 11 };
              }
            } else if (ball.status === 'free-ball' && ball.freeBallPosition) {
              ballCoord = getPixelCoord(ball.freeBallPosition);
            } else if (ball.status === 'dead-ball' && ball.deadBallSpot) {
              ballCoord = getPixelCoord(ball.deadBallSpot);
            }

            if (!ballCoord) return null;

            return (
              <g className="cursor-pointer transition-transform duration-300">
                {/* Ball Shadow */}
                <ellipse cx={ballCoord.x + 2} cy={ballCoord.y + 4} rx="9" ry="5" fill="#000000" opacity="0.45" />

                {/* Ball Outer Circle */}
                <circle cx={ballCoord.x} cy={ballCoord.y} r="9" fill="#ffffff" stroke="#18181b" strokeWidth="1.5" />

                {/* Pentagon details for soccer ball */}
                <polygon
                  points={`
                    ${ballCoord.x},${ballCoord.y - 3}
                    ${ballCoord.x + 3},${ballCoord.y - 1}
                    ${ballCoord.x + 2},${ballCoord.y + 3}
                    ${ballCoord.x - 2},${ballCoord.y + 3}
                    ${ballCoord.x - 3},${ballCoord.y - 1}
                  `}
                  fill="#09090b"
                />

                {/* Ball status glow */}
                {ball.status === 'free-ball' && (
                  <circle
                    cx={ballCoord.x}
                    cy={ballCoord.y}
                    r="14"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin"
                  />
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Pitch legend footer */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-800/60 pt-2 text-[11px] text-emerald-300/80">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-sky-500 border border-white" />
            Home Unit
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-red-600 border border-white" />
            Away Unit
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-400 border border-white" />
            Goalkeeper
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-white border border-zinc-900" />
            Ball
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-300">
            Placement: <span className="text-white font-medium">Inside Zone (count 1)</span> |{' '}
            <span className="text-white font-medium">On Line (shares both)</span> |{' '}
            <span className="text-white font-medium">On Corner (count 0)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
