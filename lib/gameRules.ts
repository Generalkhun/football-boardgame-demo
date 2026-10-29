import {
  ColumnLabel,
  RowNumber,
  UnitPosition,
  UnitOnField,
  GameState,
  TeamSide,
  PhysicalAction,
  PositionInside,
  PositionLine,
  PositionCorner,
  ManagerCard,
} from '../types/game';
import { COLUMNS, ROWS } from './constants';

export const colToIndex = (col: ColumnLabel): number => COLUMNS.indexOf(col);
export const indexToCol = (idx: number): ColumnLabel => COLUMNS[Math.max(0, Math.min(5, idx))];

// String key for a position
export function positionToKey(pos: UnitPosition): string {
  if (pos.type === 'inside') {
    return `inside-${pos.col}${pos.row}`;
  }
  if (pos.type === 'line') {
    return `line-${pos.orientation}-${pos.col}${pos.row}`;
  }
  return `corner-${pos.col}${pos.row}`;
}

export function arePositionsEqual(a: UnitPosition, b: UnitPosition): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'inside' && b.type === 'inside') {
    return a.col === b.col && a.row === b.row;
  }
  if (a.type === 'line' && b.type === 'line') {
    return a.orientation === b.orientation && a.col === b.col && a.row === b.row;
  }
  if (a.type === 'corner' && b.type === 'corner') {
    return a.col === b.col && a.row === b.row;
  }
  return false;
}

// Convert any position to approximate [x, y] coordinates on the 6x11 field
// Where x is 0 to 5 (A to F), y is 0 to 10 (1 to 11)
export function positionToCoords(pos: UnitPosition): { x: number; y: number } {
  const x = colToIndex(pos.col);
  const y = pos.row - 1;

  if (pos.type === 'inside') {
    return { x: x + 0.5, y: y + 0.5 };
  }
  if (pos.type === 'line') {
    if (pos.orientation === 'horizontal') {
      // Line between row and row+1
      return { x: x + 0.5, y: y + 1.0 };
    } else {
      // Line between col and col+1
      return { x: x + 1.0, y: y + 0.5 };
    }
  }
  // Corner: intersection between col & col+1, row & row+1
  return { x: x + 1.0, y: y + 1.0 };
}

// Returns which zones contain a given unit position for container limit purposes.
// "Unit stay on the line, consider being contained to both Zone sharing that line. (Affect container's limit)"
// "Unit stay on the corner, never count in container's limit."
export function getContainerZones(pos: UnitPosition): Array<{ col: ColumnLabel; row: RowNumber }> {
  if (pos.type === 'inside') {
    return [{ col: pos.col, row: pos.row }];
  }
  if (pos.type === 'line') {
    const cIdx = colToIndex(pos.col);
    const r = pos.row;
    if (pos.orientation === 'horizontal') {
      // Shares (col, row) and (col, row + 1)
      const zones: Array<{ col: ColumnLabel; row: RowNumber }> = [{ col: pos.col, row: r }];
      if (r < 11) {
        zones.push({ col: pos.col, row: (r + 1) as RowNumber });
      }
      return zones;
    } else {
      // Shares (col, row) and (col + 1, row)
      const zones: Array<{ col: ColumnLabel; row: RowNumber }> = [{ col: pos.col, row: r }];
      if (cIdx < 5) {
        zones.push({ col: indexToCol(cIdx + 1), row: r });
      }
      return zones;
    }
  }
  // Corner: never counts in container's limit!
  return [];
}

// Check how many units are currently counted inside a specific zone
export function getZoneOccupancy(
  col: ColumnLabel,
  row: RowNumber,
  units: Record<string, UnitOnField>,
  excludeUnitId?: string
): number {
  let count = 0;
  for (const unit of Object.values(units)) {
    if (excludeUnitId && unit.id === excludeUnitId) continue;
    const containers = getContainerZones(unit.position);
    if (containers.some((z) => z.col === col && z.row === row)) {
      count++;
    }
  }
  return count;
}

// Validate if placing a unit at targetPos would violate the 2-unit limit in any affected zone
export function canPlaceUnitAt(
  targetPos: UnitPosition,
  units: Record<string, UnitOnField>,
  movingUnitId?: string
): { allowed: boolean; reason?: string } {
  const affectedZones = getContainerZones(targetPos);
  for (const z of affectedZones) {
    const currentCount = getZoneOccupancy(z.col, z.row, units, movingUnitId);
    if (currentCount >= 2) {
      return {
        allowed: false,
        reason: `Zone ${z.col}${z.row} already has maximum of 2 units (current: ${currentCount}/2)`,
      };
    }
  }
  return { allowed: true };
}

// "When execute tactic (both attacking and defending), Unit in the Zone means Unit that is inside, on the line and on the corner of the Zone."
export function isUnitInZoneForTactics(unitPos: UnitPosition, targetCol: ColumnLabel, targetRow: RowNumber): boolean {
  const cIdx = colToIndex(targetCol);
  const r = targetRow;

  if (unitPos.type === 'inside') {
    return unitPos.col === targetCol && unitPos.row === targetRow;
  }
  if (unitPos.type === 'line') {
    const uColIdx = colToIndex(unitPos.col);
    const uRow = unitPos.row;
    if (unitPos.orientation === 'horizontal') {
      // Top or bottom edge of zone
      // Bottom edge of row r is line at row r (between r and r+1)
      // Top edge of row r is line at row r-1 (between r-1 and r)
      return unitPos.col === targetCol && (uRow === r || uRow === r - 1);
    } else {
      // Left or right edge of zone
      // Right edge of col is line at uColIdx == cIdx
      // Left edge of col is line at uColIdx == cIdx - 1
      return unitPos.row === r && (uColIdx === cIdx || uColIdx === cIdx - 1);
    }
  }
  if (unitPos.type === 'corner') {
    // Corner is at (col, row), which is the intersection of:
    // (col, row), (col+1, row), (col, row+1), (col+1, row+1)
    const uColIdx = colToIndex(unitPos.col);
    const uRow = unitPos.row;
    return (
      (uColIdx === cIdx || uColIdx === cIdx - 1) &&
      (uRow === r || uRow === r - 1)
    );
  }
  return false;
}

// Get all units that participate in tactics for a given zone
export function getUnitsInZoneForTactics(
  col: ColumnLabel,
  row: RowNumber,
  units: Record<string, UnitOnField>
): UnitOnField[] {
  return Object.values(units).filter((u) => isUnitInZoneForTactics(u.position, col, row));
}

// Calculate distance between two positions in grid units
export function getDistance(posA: UnitPosition, posB: UnitPosition): number {
  const coordA = positionToCoords(posA);
  const coordB = positionToCoords(posB);
  const dx = coordA.x - coordB.x;
  const dy = coordA.y - coordB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Reposition (Repo): 1-move adjacency graph:
// 1) moving Unit inside the Zone to line/corner in the Zone
// 2) moving Unit on the line into adjacent Zone/corner
// 3) moving Unit on the corner to adjacent line/Zone
export function getRepoAdjacentPositions(
  currentPos: UnitPosition,
  units: Record<string, UnitOnField>,
  movingUnitId?: string
): UnitPosition[] {
  const candidates: UnitPosition[] = [];
  const cIdx = colToIndex(currentPos.col);
  const r = currentPos.row;

  if (currentPos.type === 'inside') {
    // 1) inside the Zone -> line / corner in that Zone
    // Horizontal lines:
    if (r > 1) {
      candidates.push({ type: 'line', orientation: 'horizontal', col: currentPos.col, row: (r - 1) as RowNumber });
    }
    if (r < 11) {
      candidates.push({ type: 'line', orientation: 'horizontal', col: currentPos.col, row: r });
    }
    // Vertical lines:
    if (cIdx > 0) {
      candidates.push({ type: 'line', orientation: 'vertical', col: indexToCol(cIdx - 1), row: r });
    }
    if (cIdx < 5) {
      candidates.push({ type: 'line', orientation: 'vertical', col: currentPos.col, row: r });
    }
    // Corners:
    if (cIdx > 0 && r > 1) {
      candidates.push({ type: 'corner', col: indexToCol(cIdx - 1), row: (r - 1) as RowNumber });
    }
    if (cIdx < 5 && r > 1) {
      candidates.push({ type: 'corner', col: currentPos.col, row: (r - 1) as RowNumber });
    }
    if (cIdx > 0 && r < 11) {
      candidates.push({ type: 'corner', col: indexToCol(cIdx - 1), row: r });
    }
    if (cIdx < 5 && r < 11) {
      candidates.push({ type: 'corner', col: currentPos.col, row: r });
    }
  } else if (currentPos.type === 'line') {
    // 2) line -> adjacent Zone / corner
    if (currentPos.orientation === 'horizontal') {
      // Adjacent Zones: (col, row) and (col, row + 1)
      candidates.push({ type: 'inside', col: currentPos.col, row: r });
      if (r < 11) {
        candidates.push({ type: 'inside', col: currentPos.col, row: (r + 1) as RowNumber });
      }
      // Adjacent Corners (endpoints of this horizontal line segment):
      if (cIdx > 0) {
        candidates.push({ type: 'corner', col: indexToCol(cIdx - 1), row: r });
      }
      if (cIdx < 5) {
        candidates.push({ type: 'corner', col: currentPos.col, row: r });
      }
    } else {
      // Vertical line:
      // Adjacent Zones: (col, row) and (col + 1, row)
      candidates.push({ type: 'inside', col: currentPos.col, row: r });
      if (cIdx < 5) {
        candidates.push({ type: 'inside', col: indexToCol(cIdx + 1), row: r });
      }
      // Adjacent Corners (endpoints of this vertical line segment):
      if (r > 1) {
        candidates.push({ type: 'corner', col: currentPos.col, row: (r - 1) as RowNumber });
      }
      if (r < 11) {
        candidates.push({ type: 'corner', col: currentPos.col, row: r });
      }
    }
  } else if (currentPos.type === 'corner') {
    // 3) corner -> adjacent line / Zone
    // 4 adjacent Zones:
    candidates.push({ type: 'inside', col: currentPos.col, row: r });
    if (cIdx < 5) {
      candidates.push({ type: 'inside', col: indexToCol(cIdx + 1), row: r });
    }
    if (r < 11) {
      candidates.push({ type: 'inside', col: currentPos.col, row: (r + 1) as RowNumber });
    }
    if (cIdx < 5 && r < 11) {
      candidates.push({ type: 'inside', col: indexToCol(cIdx + 1), row: (r + 1) as RowNumber });
    }
    // 4 adjacent lines:
    candidates.push({ type: 'line', orientation: 'horizontal', col: currentPos.col, row: r });
    if (cIdx < 5) {
      candidates.push({ type: 'line', orientation: 'horizontal', col: indexToCol(cIdx + 1), row: r });
    }
    candidates.push({ type: 'line', orientation: 'vertical', col: currentPos.col, row: r });
    if (r < 11) {
      candidates.push({ type: 'line', orientation: 'vertical', col: currentPos.col, row: (r + 1) as RowNumber });
    }
  }

  // Filter candidates that obey the 2-unit limit in zones
  return candidates.filter((targetPos) => {
    return canPlaceUnitAt(targetPos, units, movingUnitId).allowed;
  });
}

// Fatigue token and Injury management:
// "Each unit has Fatigue token stack 2 slots, each slots can contain maximum of 5 Fatigue tokens.
// If slot is full (contain 5 Fatigue tokens), convert all to 1 Minor injury token.
// When unit has 2 Minor injury tokens, convert all to 1 Major injury token."
export function addFatigueTokens(
  unit: UnitOnField,
  amount: number
): { unit: UnitOnField; convertedMinor: boolean; convertedMajor: boolean } {
  let slot1 = unit.fatigueSlot1;
  let slot2 = unit.fatigueSlot2;
  let minor = unit.minorInjuries;
  let major = unit.majorInjuries;
  let convertedMinor = false;
  let convertedMajor = false;

  for (let i = 0; i < amount; i++) {
    if (slot1 < 5) {
      slot1++;
      if (slot1 === 5) {
        slot1 = 0;
        minor++;
        convertedMinor = true;
      }
    } else if (slot2 < 5) {
      slot2++;
      if (slot2 === 5) {
        slot2 = 0;
        minor++;
        convertedMinor = true;
      }
    } else {
      // Both slots full or overflow -> trigger minor injury directly
      minor++;
      convertedMinor = true;
    }

    if (minor >= 2) {
      minor -= 2;
      major++;
      convertedMajor = true;
    }
  }

  return {
    unit: {
      ...unit,
      fatigueSlot1: slot1,
      fatigueSlot2: slot2,
      minorInjuries: minor,
      majorInjuries: major,
    },
    convertedMinor,
    convertedMajor,
  };
}

// Roll a standard 6-sided die
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Resolve tactical clash between Attacker and Defender
export interface DuelResolutionParams {
  tactic: string;
  attackerUnit: UnitOnField;
  defenderUnit?: UnitOnField;
  attackerManager?: ManagerCard;
  defenderManager?: ManagerCard;
  attackerMental: number; // -2 to +2
  defenderMental: number; // -2 to +2
  attackerUsedPRA?: PhysicalAction;
  defenderUsedPRA?: PhysicalAction;
  targetZone?: { col: ColumnLabel; row: RowNumber };
}

export interface DuelResult {
  attackerDice: number;
  defenderDice: number;
  attackerTotal: number;
  defenderTotal: number;
  attackerBreakdown: string[];
  defenderBreakdown: string[];
  success: boolean;
  outcomeType: 'goal' | 'save' | 'pass-completed' | 'intercepted' | 'dribble-won' | 'tackled' | 'free-ball' | 'dead-ball-foul';
  description: string;
}

export function resolveDuel(params: DuelResolutionParams): DuelResult {
  const {
    tactic,
    attackerUnit,
    defenderUnit,
    attackerManager,
    defenderManager,
    attackerMental,
    defenderMental,
    attackerUsedPRA,
    defenderUsedPRA,
  } = params;

  const attackerDice = rollD6();
  const defenderDice = rollD6();

  const attackerBreakdown: string[] = [`Dice roll: ${attackerDice}`];
  const defenderBreakdown: string[] = [`Dice roll: ${defenderDice}`];

  let attackerTotal = attackerDice;
  let defenderTotal = defenderDice;

  // 1. Attacker Unit Stat
  let attackStat = 3;
  if (tactic.includes('Pass') || tactic.includes('Cross')) {
    attackStat = attackerUnit.card.stats.passing;
    attackerBreakdown.push(`Passing stat: +${attackStat}`);
  } else if (tactic.includes('Dribble')) {
    attackStat = attackerUnit.card.stats.dribbling;
    attackerBreakdown.push(`Dribbling stat: +${attackStat}`);
  } else if (tactic.includes('Shoot')) {
    attackStat = attackerUnit.card.stats.shooting;
    attackerBreakdown.push(`Shooting stat: +${attackStat}`);
  } else {
    attackStat = attackerUnit.card.stats.pace;
    attackerBreakdown.push(`Pace stat: +${attackStat}`);
  }
  attackerTotal += attackStat;

  // 2. Defender Unit Stat (if present)
  if (defenderUnit) {
    let defStat = 3;
    if (tactic.includes('Shoot')) {
      defStat = defenderUnit.card.isGoalkeeper ? defenderUnit.card.stats.tackling + 1 : defenderUnit.card.stats.tackling;
      defenderBreakdown.push(`${defenderUnit.card.isGoalkeeper ? 'GK Reflex' : 'Block'}: +${defStat}`);
    } else {
      defStat = defenderUnit.card.stats.tackling;
      defenderBreakdown.push(`Tackling stat: +${defStat}`);
    }
    defenderTotal += defStat;
  } else {
    // Uncontested base defense
    defenderTotal += 2;
    defenderBreakdown.push('Uncontested pitch resistance: +2');
  }

  // 3. PRA bonuses
  if (attackerUsedPRA) {
    attackerTotal += 1;
    attackerBreakdown.push(`PRA (${attackerUsedPRA}): +1`);
  }
  if (defenderUsedPRA) {
    defenderTotal += 1;
    defenderBreakdown.push(`PRA (${defenderUsedPRA}): +1`);
  }

  // 4. Team Mental Track (-2 to +2)
  if (attackerMental !== 0) {
    attackerTotal += attackerMental;
    attackerBreakdown.push(`Team Mental: ${attackerMental > 0 ? '+' : ''}${attackerMental}`);
  }
  if (defenderMental !== 0) {
    defenderTotal += defenderMental;
    defenderBreakdown.push(`Team Mental: ${defenderMental > 0 ? '+' : ''}${defenderMental}`);
  }

  // 5. Manager In-Possession / Out-of-Possession bonuses
  if (attackerManager) {
    const bonus = attackerManager.inPossessionTactic.bonusValue;
    attackerTotal += bonus;
    attackerBreakdown.push(`Manager [${attackerManager.name}]: +${bonus} (${attackerManager.inPossessionTactic.name})`);
  }
  if (defenderManager) {
    const bonus = defenderManager.outOfPossessionTactic.bonusValue;
    defenderTotal += bonus;
    defenderBreakdown.push(`Manager [${defenderManager.name}]: +${bonus} (${defenderManager.outOfPossessionTactic.name})`);
  }

  // 6. Fatigue & Injury penalties
  const attackerInjuryPenalty = attackerUnit.minorInjuries * 1 + attackerUnit.majorInjuries * 2;
  if (attackerInjuryPenalty > 0) {
    attackerTotal -= attackerInjuryPenalty;
    attackerBreakdown.push(`Injury penalty: -${attackerInjuryPenalty}`);
  }

  if (defenderUnit) {
    const defenderInjuryPenalty = defenderUnit.minorInjuries * 1 + defenderUnit.majorInjuries * 2;
    if (defenderInjuryPenalty > 0) {
      defenderTotal -= defenderInjuryPenalty;
      defenderBreakdown.push(`Injury penalty: -${defenderInjuryPenalty}`);
    }
  }

  const success = attackerTotal >= defenderTotal;
  const margin = attackerTotal - defenderTotal;

  // Determine narrative outcome
  let outcomeType: DuelResult['outcomeType'] = 'pass-completed';
  let description = '';

  if (tactic.includes('Shoot')) {
    if (success) {
      outcomeType = 'goal';
      description = `⚽ GOAL! ${attackerUnit.card.name} unleashes a strike into the back of the net! (${attackerTotal} vs ${defenderTotal})`;
    } else {
      outcomeType = 'save';
      description = `🧤 SAVED! ${defenderUnit ? defenderUnit.card.name : 'The defense'} denies ${attackerUnit.card.name}! (${defenderTotal} vs ${attackerTotal})`;
    }
  } else if (tactic.includes('Pass') || tactic.includes('Cross')) {
    if (success) {
      outcomeType = 'pass-completed';
      description = `🎯 Pass completed! ${attackerUnit.card.name} threads the needle with precision! (${attackerTotal} vs ${defenderTotal})`;
    } else {
      if (margin === -1) {
        outcomeType = 'free-ball';
        description = `⚡ Loose Ball! The pass was deflected and bounces loose into open ground!`;
      } else {
        outcomeType = 'intercepted';
        description = `🛡️ Intercepted! ${defenderUnit ? defenderUnit.card.name : 'The opponent'} cuts out the pass! (${defenderTotal} vs ${attackerTotal})`;
      }
    }
  } else if (tactic.includes('Dribble')) {
    if (success) {
      outcomeType = 'dribble-won';
      description = `⚡ Skillful move! ${attackerUnit.card.name} beats the marker and advances! (${attackerTotal} vs ${defenderTotal})`;
    } else {
      if (defenderDice === 1) {
        outcomeType = 'dead-ball-foul';
        description = `🟨 Foul! ${defenderUnit ? defenderUnit.card.name : 'The defender'} mistimes the challenge! Free Kick awarded!`;
      } else {
        outcomeType = 'tackled';
        description = `🛑 Dispossessed! ${defenderUnit ? defenderUnit.card.name : 'The defense'} wins the ball cleanly! (${defenderTotal} vs ${attackerTotal})`;
      }
    }
  } else {
    // Tackle / Press
    if (success) {
      outcomeType = 'dribble-won';
      description = `Tactical advantage secured by ${attackerUnit.card.name}!`;
    } else {
      outcomeType = 'free-ball';
      description = `Ball breaks free in midfield!`;
    }
  }

  return {
    attackerDice,
    defenderDice,
    attackerTotal,
    defenderTotal,
    attackerBreakdown,
    defenderBreakdown,
    success,
    outcomeType,
    description,
  };
}

// Preset formations for Reorganization
export function getFormationPreset(
  formation: string,
  team: TeamSide,
  isAttacking: boolean
): Record<string, UnitPosition> {
  if (team === 'home') {
    const ballPos: UnitPosition = { type: 'inside', col: 'D', row: 6 };
    if (formation === '4-4-2') {
      return {
        'h-1': { type: 'inside', col: 'C', row: 1 },
        'h-2': { type: 'inside', col: 'A', row: 3 },
        'h-3': { type: 'inside', col: 'C', row: 2 },
        'h-4': { type: 'inside', col: 'D', row: 2 },
        'h-5': { type: 'inside', col: 'F', row: 3 },
        'h-6': { type: 'inside', col: 'B', row: 4 },
        'h-7': { type: 'inside', col: 'C', row: 4 },
        'h-8': { type: 'inside', col: 'D', row: 4 },
        'h-9': { type: 'inside', col: 'E', row: 4 },
        'h-10': ballPos, // ball carrier remains at kickoff
        'h-11': { type: 'inside', col: 'C', row: 6 },
      };
    }
    if (formation === '3-5-2') {
      return {
        'h-1': { type: 'inside', col: 'C', row: 1 },
        'h-2': { type: 'inside', col: 'B', row: 2 },
        'h-3': { type: 'inside', col: 'C', row: 2 },
        'h-4': { type: 'inside', col: 'D', row: 2 },
        'h-5': { type: 'inside', col: 'A', row: 4 },
        'h-6': { type: 'inside', col: 'F', row: 4 },
        'h-7': { type: 'inside', col: 'C', row: 4 },
        'h-8': { type: 'inside', col: 'D', row: 4 },
        'h-9': { type: 'inside', col: 'B', row: 5 },
        'h-10': ballPos, // ball carrier
        'h-11': { type: 'inside', col: 'C', row: 6 },
      };
    }
    if (formation === '5-3-2') {
      return {
        'h-1': { type: 'inside', col: 'C', row: 1 },
        'h-2': { type: 'inside', col: 'A', row: 2 },
        'h-3': { type: 'inside', col: 'B', row: 2 },
        'h-4': { type: 'inside', col: 'C', row: 2 },
        'h-5': { type: 'inside', col: 'D', row: 2 },
        'h-6': { type: 'inside', col: 'F', row: 2 },
        'h-7': { type: 'inside', col: 'C', row: 4 },
        'h-8': { type: 'inside', col: 'D', row: 4 },
        'h-9': { type: 'inside', col: 'B', row: 5 },
        'h-10': ballPos, // ball carrier
        'h-11': { type: 'inside', col: 'C', row: 6 },
      };
    }
    // Default 4-3-3
    return getInitialStartingPositions('home');
  } else {
    const ballPos: UnitPosition = { type: 'inside', col: 'C', row: 6 };
    if (formation === '4-4-2') {
      return {
        'a-1': { type: 'inside', col: 'D', row: 11 },
        'a-2': { type: 'inside', col: 'F', row: 9 },
        'a-3': { type: 'inside', col: 'D', row: 10 },
        'a-4': { type: 'inside', col: 'C', row: 10 },
        'a-5': { type: 'inside', col: 'A', row: 9 },
        'a-6': { type: 'inside', col: 'E', row: 8 },
        'a-7': { type: 'inside', col: 'D', row: 8 },
        'a-8': { type: 'inside', col: 'C', row: 8 },
        'a-9': { type: 'inside', col: 'B', row: 8 },
        'a-10': isAttacking ? ballPos : { type: 'inside', col: 'D', row: 7 },
        'a-11': { type: 'inside', col: 'D', row: 7 },
      };
    }
    if (formation === '3-5-2') {
      return {
        'a-1': { type: 'inside', col: 'D', row: 11 },
        'a-2': { type: 'inside', col: 'E', row: 10 },
        'a-3': { type: 'inside', col: 'D', row: 10 },
        'a-4': { type: 'inside', col: 'C', row: 10 },
        'a-5': { type: 'inside', col: 'F', row: 8 },
        'a-6': { type: 'inside', col: 'A', row: 8 },
        'a-7': { type: 'inside', col: 'D', row: 8 },
        'a-8': { type: 'inside', col: 'C', row: 8 },
        'a-9': { type: 'inside', col: 'E', row: 7 },
        'a-10': isAttacking ? ballPos : { type: 'inside', col: 'C', row: 7 },
        'a-11': { type: 'inside', col: 'D', row: 7 },
      };
    }
    if (formation === '5-3-2') {
      return {
        'a-1': { type: 'inside', col: 'D', row: 11 },
        'a-2': { type: 'inside', col: 'F', row: 10 },
        'a-3': { type: 'inside', col: 'E', row: 10 },
        'a-4': { type: 'inside', col: 'D', row: 10 },
        'a-5': { type: 'inside', col: 'C', row: 10 },
        'a-6': { type: 'inside', col: 'A', row: 10 },
        'a-7': { type: 'inside', col: 'D', row: 8 },
        'a-8': { type: 'inside', col: 'C', row: 8 },
        'a-9': { type: 'inside', col: 'E', row: 8 },
        'a-10': isAttacking ? ballPos : { type: 'inside', col: 'C', row: 7 },
        'a-11': { type: 'inside', col: 'D', row: 7 },
      };
    }
    // Default 4-3-3
    return getInitialStartingPositions('away');
  }
}

// Initial default unit setup for 4-3-3 formation
export function getInitialStartingPositions(team: TeamSide): Record<string, UnitPosition> {
  if (team === 'home') {
    // Home team defends row 1, attacks row 11
    return {
      'h-1': { type: 'inside', col: 'C', row: 1 }, // GK in goalmouth C1
      'h-2': { type: 'inside', col: 'A', row: 3 }, // RB
      'h-3': { type: 'inside', col: 'C', row: 2 }, // CB
      'h-4': { type: 'inside', col: 'D', row: 2 }, // CB
      'h-5': { type: 'inside', col: 'F', row: 3 }, // LB
      'h-6': { type: 'inside', col: 'C', row: 4 }, // CDM
      'h-7': { type: 'inside', col: 'B', row: 4 }, // CAM
      'h-8': { type: 'inside', col: 'E', row: 4 }, // CM
      'h-9': { type: 'inside', col: 'A', row: 5 }, // RW
      'h-10': { type: 'inside', col: 'D', row: 6 }, // ST (kick-off zone)
      'h-11': { type: 'inside', col: 'F', row: 5 }, // LW
    };
  } else {
    // Away team defends row 11, attacks row 1
    return {
      'a-1': { type: 'inside', col: 'D', row: 11 }, // GK in goalmouth D11
      'a-2': { type: 'inside', col: 'F', row: 9 }, // RB
      'a-3': { type: 'inside', col: 'D', row: 10 }, // CB
      'a-4': { type: 'inside', col: 'C', row: 10 }, // CB
      'a-5': { type: 'inside', col: 'A', row: 9 }, // LB
      'a-6': { type: 'inside', col: 'C', row: 8 }, // CDM
      'a-7': { type: 'inside', col: 'E', row: 8 }, // CAM
      'a-8': { type: 'inside', col: 'B', row: 8 }, // CM
      'a-9': { type: 'inside', col: 'F', row: 7 }, // RW
      'a-10': { type: 'inside', col: 'C', row: 7 }, // ST
      'a-11': { type: 'inside', col: 'A', row: 7 }, // LW
    };
  }
}
