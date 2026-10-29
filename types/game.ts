export type ColumnLabel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type RowNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type PlacementType = 'inside' | 'line' | 'corner';

export interface PositionInside {
  type: 'inside';
  col: ColumnLabel; // 'A' .. 'F'
  row: RowNumber;   // 1 .. 11
}

export interface PositionLine {
  type: 'line';
  orientation: 'horizontal' | 'vertical';
  // If horizontal: line between (col, row) and (col, row + 1)
  // If vertical: line between (col, row) and (col + 1, row)
  col: ColumnLabel;
  row: RowNumber;
}

export interface PositionCorner {
  type: 'corner';
  // Intersection between col and col+1, row and row+1
  col: ColumnLabel;
  row: RowNumber;
}

export type UnitPosition = PositionInside | PositionLine | PositionCorner;

export type TeamSide = 'home' | 'away'; // Home = Blue (attacks row 11), Away = Red (attacks row 1)

export type PlayerRole = 'GK' | 'DF' | 'MF' | 'FW';

export interface UnitStats {
  pace: number;
  passing: number;
  dribbling: number;
  tackling: number;
  shooting: number;
  stamina: number;
}

export type PhysicalAction = 'Sprint' | 'Slide Tackle' | 'High Press' | 'Power Shot' | 'Aerial Duel';

export interface UnitCard {
  id: string;
  name: string;
  number: number;
  team: TeamSide;
  role: PlayerRole;
  positionName: string; // e.g. "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"
  stats: UnitStats;
  preferredPRA: PhysicalAction[];
  isGoalkeeper: boolean;
  image?: string;
}

export interface UnitOnField {
  id: string; // matches unitCard.id
  card: UnitCard;
  team: TeamSide;
  position: UnitPosition;
  
  // Fatigue & injury state
  fatigueSlot1: number; // 0 to 5
  fatigueSlot2: number; // 0 to 5
  minorInjuries: number; // 0 to 1 (at 2, becomes 1 major injury)
  majorInjuries: number; // 0 or more
  
  hasCardDeployed: boolean;
  isDeployedFaceUp: boolean; // true = activated face-up, false = inactivated face-down
}

export interface ManagerCard {
  id: string;
  name: string;
  image?: string;
  preferredFormation: string; // e.g. "4-3-3", "4-4-2", "4-2-3-1"
  inPossessionTactic: {
    name: string;
    description: string;
    bonusStat: 'passing' | 'dribbling' | 'shooting';
    bonusValue: number;
  };
  outOfPossessionTactic: {
    name: string;
    description: string;
    bonusStat: 'tackling' | 'pace' | 'stamina';
    bonusValue: number;
  };
  quote: string;
}

export type BallPossessionStatus = 'in-possession' | 'free-ball' | 'dead-ball';

export type DeadBallType = 'kick-off' | 'goal-kick' | 'corner-kick' | 'throw-in' | 'free-kick' | 'penalty';

export interface BallState {
  status: BallPossessionStatus;
  possessionTeam: TeamSide | null;
  possessionUnitId: string | null;
  freeBallPosition: UnitPosition | null;
  deadBallType: DeadBallType | null;
  deadBallSpot: UnitPosition | null;
}

export type TacticType = 'Short Pass' | 'Long Pass' | 'Through Ball' | 'Dribble' | 'Cross' | 'Shoot' | 'Tackle' | 'High Press' | 'Clearance';

export interface MatchLogEntry {
  id: string;
  minute: number;
  half: 1 | 2;
  message: string;
  type: 'goal' | 'tackle' | 'pass' | 'foul' | 'injury' | 'possession' | 'card' | 'whistle';
  team?: TeamSide;
}

export interface GameState {
  // Score & Time
  homeScore: number;
  awayScore: number;
  matchMinute: number; // 0 to 90
  half: 1 | 2;
  isGameOver: boolean;
  
  // Current Turn
  currentTurnTeam: TeamSide;
  turnPhase:
    | 'reorg-attacking'
    | 'reorg-defending'
    | 'repo-defending'
    | 'repo-attacking'
    | 'select-action'
    | 'awaiting-defense'
    | 'resolving-duel'
    | 'possession-change-manager-adjust'
    | 'game-over';
  
  // Units
  units: Record<string, UnitOnField>;
  homeStarting11Ids: string[];
  awayStarting11Ids: string[];
  homeSubs: UnitCard[];
  awaySubs: UnitCard[];
  
  // Formations & Mental Track
  homeFormation: string;
  awayFormation: string;
  homeMentalTrack: number; // -2 to +2
  awayMentalTrack: number; // -2 to +2
  
  // Manager Cards
  homeManagerCards: ManagerCard[];
  awayManagerCards: ManagerCard[];
  homeActiveInPossessionManagerId: string;
  homeActiveOutOfPossessionManagerId: string;
  awayActiveInPossessionManagerId: string;
  awayActiveOutOfPossessionManagerId: string;
  
  // Ball
  ball: BallState;
  
  // Active Duel / Tactic in execution
  activeTactic?: {
    type: TacticType;
    attackerUnitId: string;
    targetPosition?: UnitPosition;
    targetTeammateId?: string;
    attackerCardFaceUp: boolean;
    attackerUsedPRA?: PhysicalAction;
    defenderUnitId?: string;
    defenderCardFaceUp?: boolean;
    defenderUsedPRA?: PhysicalAction;
    diceRollResult?: {
      attackerDice: number;
      defenderDice: number;
      attackerTotal: number;
      defenderTotal: number;
      attackerBreakdown: string[];
      defenderBreakdown: string[];
      outcomeDescription: string;
      success: boolean;
    };
  };
  
  // Logs
  matchLogs: MatchLogEntry[];
}
