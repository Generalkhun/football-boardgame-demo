'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GameState,
  TeamSide,
  UnitOnField,
  UnitPosition,
  TacticType,
  PhysicalAction,
  ColumnLabel,
  RowNumber,
} from '../types/game';
import {
  HOME_STARTING_11,
  AWAY_STARTING_11,
  HOME_SUBS,
  AWAY_SUBS,
  INITIAL_MANAGERS,
  SoundEffects,
  COLUMNS,
  ROWS,
} from '../lib/constants';
import {
  getInitialStartingPositions,
  getFormationPreset,
  getRepoAdjacentPositions,
  canPlaceUnitAt,
  getUnitsInZoneForTactics,
  addFatigueTokens,
  positionToKey,
  arePositionsEqual,
  positionToCoords,
  DuelResult,
  getContainerZones,
} from '../lib/gameRules';
import { PitchBoard } from '../components/PitchBoard';
import { Scoreboard } from '../components/Scoreboard';
import { UnitCardHand } from '../components/UnitCardHand';
import { MatchLog } from '../components/MatchLog';
import { FormationScreenModal } from '../components/FormationScreenModal';
import { ManagerCardModal } from '../components/ManagerCardModal';
import { TacticExecutionModal } from '../components/TacticExecutionModal';
import { RulesModal } from '../components/RulesModal';
import { Trophy, Play, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Home() {
  // Initialize game state
  const initializeGame = (): GameState => {
    const homeStartingPos = getInitialStartingPositions('home');
    const awayStartingPos = getInitialStartingPositions('away');

    const unitsRecord: Record<string, UnitOnField> = {};

    HOME_STARTING_11.forEach((card) => {
      unitsRecord[card.id] = {
        id: card.id,
        card,
        team: 'home',
        position: homeStartingPos[card.id] || { type: 'inside', col: 'C', row: 3 },
        fatigueSlot1: 0,
        fatigueSlot2: 0,
        minorInjuries: 0,
        majorInjuries: 0,
        hasCardDeployed: true,
        isDeployedFaceUp: true,
      };
    });

    AWAY_STARTING_11.forEach((card) => {
      unitsRecord[card.id] = {
        id: card.id,
        card,
        team: 'away',
        position: awayStartingPos[card.id] || { type: 'inside', col: 'D', row: 9 },
        fatigueSlot1: 0,
        fatigueSlot2: 0,
        minorInjuries: 0,
        majorInjuries: 0,
        hasCardDeployed: true,
        isDeployedFaceUp: true,
      };
    });

    return {
      homeScore: 0,
      awayScore: 0,
      matchMinute: 0,
      half: 1,
      isGameOver: false,
      currentTurnTeam: 'home',
      turnPhase: 'reorg-attacking',
      units: unitsRecord,
      homeStarting11Ids: HOME_STARTING_11.map((c) => c.id),
      awayStarting11Ids: AWAY_STARTING_11.map((c) => c.id),
      homeSubs: [...HOME_SUBS],
      awaySubs: [...AWAY_SUBS],
      homeFormation: '4-3-3',
      awayFormation: '4-3-3',
      homeMentalTrack: 0,
      awayMentalTrack: 0,
      homeManagerCards: [...INITIAL_MANAGERS],
      awayManagerCards: [...INITIAL_MANAGERS],
      homeActiveInPossessionManagerId: 'mgr-pep',
      homeActiveOutOfPossessionManagerId: 'mgr-arteta',
      awayActiveInPossessionManagerId: 'mgr-klopp',
      awayActiveOutOfPossessionManagerId: 'mgr-mourinho',
      ball: {
        status: 'dead-ball',
        possessionTeam: 'home',
        possessionUnitId: 'h-10', // Haaland starts with ball at kick-off
        freeBallPosition: null,
        deadBallType: 'kick-off',
        deadBallSpot: { type: 'inside', col: 'D', row: 6 },
      },
      matchLogs: [
        {
          id: 'log-0',
          minute: 0,
          half: 1,
          message: 'Match start: Dead Ball (Kick-off). Reorganization phase: Attacking side (Sky Blue City) reorgs first! Unit with the ball (#9 Haaland) must remain still.',
          type: 'whistle',
          team: 'home',
        },
      ],
    };
  };

  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>('h-10');
  const [targetPosition, setTargetPosition] = useState<UnitPosition | null>(null);
  const [validTargets, setValidTargets] = useState<UnitPosition[]>([]);
  const [activeTacticAction, setActiveTacticAction] = useState<TacticType | null>(null);

  // Modals state
  const [formationModalTeam, setFormationModalTeam] = useState<TeamSide | null>(null);
  const [managerModalTeam, setManagerModalTeam] = useState<TeamSide | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isDuelModalOpen, setIsDuelModalOpen] = useState<boolean>(false);

  // Sound and AI preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(false);

  // Reposition (Repo) tracking state
  const [repoMovesUsed, setRepoMovesUsed] = useState<Record<string, number>>({});
  const [repoRunUnits, setRepoRunUnits] = useState<Record<string, boolean>>({});

  const getUnitMaxRepoMoves = (unitId: string): number => {
    return repoRunUnits[unitId] ? 2 : 1;
  };

  const getUnitRemainingRepoMoves = (unitId: string): number => {
    const used = repoMovesUsed[unitId] || 0;
    return Math.max(0, getUnitMaxRepoMoves(unitId) - used);
  };

  const handleToggleRepoRunPRA = (unitId: string) => {
    if (repoRunUnits[unitId]) return;

    const unit = gameState.units[unitId];
    if (!unit) return;

    const fRes = addFatigueTokens(unit, 1);
    setGameState((prev) => ({
      ...prev,
      units: {
        ...prev.units,
        [unitId]: fRes.unit,
      },
    }));

    setRepoRunUnits((prev) => ({ ...prev, [unitId]: true }));
    SoundEffects.playKick();
    addLog(
      `⚡ Run [PRA] activated for #${unit.card.number} ${unit.card.name}! Gains +1 move (total 2 moves) and receives +1 Fatigue token.`,
      'possession',
      unit.team
    );

    if (fRes.convertedMinor) {
      addLog(`🩹 ${unit.card.name} sustained a Minor Injury from fatigue!`, 'injury', unit.team);
    }
    if (fRes.convertedMajor) {
      addLog(`🚑 CRITICAL: ${unit.card.name} suffered a Major Injury!`, 'injury', unit.team);
    }

    if (selectedUnitId === unitId) {
      const targets = getRepoAdjacentPositions(unit.position, gameState.units, unit.id);
      setValidTargets(targets);
    }
  };

  const handleFinishDefendingRepo = () => {
    const inPossTeam =
      gameState.ball.possessionTeam || (gameState.currentTurnTeam === 'home' ? 'away' : 'home');

    setGameState((prev) => ({
      ...prev,
      turnPhase: 'repo-attacking',
      currentTurnTeam: inPossTeam,
    }));
    setSelectedUnitId(null);
    setValidTargets([]);
    setTargetPosition(null);
    setRepoMovesUsed({});
    setRepoRunUnits({});
    SoundEffects.playWhistle();
    addLog(
      `Defending Reposition complete. Attacking side (${
        inPossTeam === 'home' ? 'Home' : 'Away'
      }) now repositions!`,
      'possession',
      inPossTeam
    );
  };

  const handleFinishAttackingRepo = () => {
    const inPossTeam = gameState.ball.possessionTeam || gameState.currentTurnTeam;

    setGameState((prev) => ({
      ...prev,
      turnPhase: 'select-action',
      currentTurnTeam: inPossTeam,
    }));
    setSelectedUnitId(gameState.ball.possessionUnitId);
    setValidTargets([]);
    setTargetPosition(null);
    setRepoMovesUsed({});
    setRepoRunUnits({});
    SoundEffects.playWhistle();
    addLog(
      `Reposition complete for both sides! Resuming tactical execution for ${
        inPossTeam === 'home' ? 'Home' : 'Away'
      }.`,
      'whistle',
      inPossTeam
    );
  };

  // Add match log helper
  const addLog = useCallback(
    (message: string, type: GameState['matchLogs'][0]['type'], team?: TeamSide) => {
      setGameState((prev) => ({
        ...prev,
        matchLogs: [
          {
            id: `log-${Date.now()}-${Math.random()}`,
            minute: Math.min(90, Math.floor(prev.matchMinute)),
            half: prev.half,
            message,
            type,
            team,
          },
          ...prev.matchLogs,
        ],
      }));
    },
    []
  );

  // Check Halftime and Fulltime
  const advanceTime = useCallback(
    (minutes: number) => {
      setGameState((prev) => {
        let newMin = prev.matchMinute + minutes;
        let newHalf = prev.half;
        let gameOver = prev.isGameOver;

        if (prev.half === 1 && newMin >= 45) {
          newMin = 45;
          newHalf = 2;
          SoundEffects.playWhistle();
        } else if (newMin >= 90) {
          newMin = 90;
          gameOver = true;
          SoundEffects.playWhistle();
        }

        return {
          ...prev,
          matchMinute: newMin,
          half: newHalf,
          isGameOver: gameOver,
        };
      });
    },
    []
  );

  // Calculate valid target positions for Dribble or Pass
  const calculateValidTargets = (unit: UnitOnField, tactic: TacticType): UnitPosition[] => {
    const targets: UnitPosition[] = [];
    const currentCoords = positionToCoords(unit.position);
    const maxDistance = tactic === 'Dribble' ? 1.6 : tactic === 'Short Pass' ? 3.0 : 6.0;

    // Check inside zones
    for (const col of COLUMNS) {
      for (const row of ROWS) {
        const testPos: UnitPosition = { type: 'inside', col, row };
        const d = Math.hypot(positionToCoords(testPos).x - currentCoords.x, positionToCoords(testPos).y - currentCoords.y);
        if (d > 0.1 && d <= maxDistance) {
          if (tactic === 'Dribble') {
            const check = canPlaceUnitAt(testPos, gameState.units, unit.id);
            if (check.allowed) targets.push(testPos);
          } else {
            targets.push(testPos);
          }
        }
      }
    }

    // Check lines
    for (const col of COLUMNS) {
      for (const row of ROWS) {
        if (row < 11) {
          const testPos: UnitPosition = { type: 'line', orientation: 'horizontal', col, row };
          const d = Math.hypot(positionToCoords(testPos).x - currentCoords.x, positionToCoords(testPos).y - currentCoords.y);
          if (d > 0.1 && d <= maxDistance) {
            if (tactic === 'Dribble') {
              const check = canPlaceUnitAt(testPos, gameState.units, unit.id);
              if (check.allowed) targets.push(testPos);
            } else {
              targets.push(testPos);
            }
          }
        }
        if (col !== 'F') {
          const testPos: UnitPosition = { type: 'line', orientation: 'vertical', col, row };
          const d = Math.hypot(positionToCoords(testPos).x - currentCoords.x, positionToCoords(testPos).y - currentCoords.y);
          if (d > 0.1 && d <= maxDistance) {
            if (tactic === 'Dribble') {
              const check = canPlaceUnitAt(testPos, gameState.units, unit.id);
              if (check.allowed) targets.push(testPos);
            } else {
              targets.push(testPos);
            }
          }
        }
      }
    }

    // Check corners
    for (const col of COLUMNS.slice(0, 5)) {
      for (const row of ROWS.slice(0, 10)) {
        const testPos: UnitPosition = { type: 'corner', col, row };
        const d = Math.hypot(positionToCoords(testPos).x - currentCoords.x, positionToCoords(testPos).y - currentCoords.y);
        if (d > 0.1 && d <= maxDistance) {
          targets.push(testPos);
        }
      }
    }

    return targets;
  };

  // Calculate valid target positions for Reorganization
  const calculateValidReorgTargets = (unit: UnitOnField): UnitPosition[] => {
    const targets: UnitPosition[] = [];
    const minRow = unit.team === 'home' ? 1 : 6;
    const maxRow = unit.team === 'home' ? 6 : 11;

    // Inside zones
    for (const col of COLUMNS) {
      for (let r = minRow; r <= maxRow; r++) {
        const row = r as RowNumber;
        const testPos: UnitPosition = { type: 'inside', col, row };
        if (canPlaceUnitAt(testPos, gameState.units, unit.id).allowed) {
          targets.push(testPos);
        }
      }
    }

    // Lines
    for (const col of COLUMNS) {
      for (let r = minRow; r <= maxRow; r++) {
        const row = r as RowNumber;
        if (row < 11) {
          const testPos: UnitPosition = { type: 'line', orientation: 'horizontal', col, row };
          if (canPlaceUnitAt(testPos, gameState.units, unit.id).allowed) {
            targets.push(testPos);
          }
        }
        if (col !== 'F') {
          const testPos: UnitPosition = { type: 'line', orientation: 'vertical', col, row };
          if (canPlaceUnitAt(testPos, gameState.units, unit.id).allowed) {
            targets.push(testPos);
          }
        }
      }
    }

    // Corners (never count towards container limit)
    for (const col of COLUMNS.slice(0, 5)) {
      for (let r = minRow; r < maxRow; r++) {
        const row = r as RowNumber;
        const testPos: UnitPosition = { type: 'corner', col, row };
        targets.push(testPos);
      }
    }

    return targets;
  };

  // Handle selecting a unit on field or from hand
  const handleSelectUnit = (unit: UnitOnField) => {
    const isReorg =
      gameState.turnPhase === 'reorg-attacking' || gameState.turnPhase === 'reorg-defending';

    if (isReorg) {
      const attackingTeam = gameState.ball.possessionTeam || 'home';
      const defendingTeam = attackingTeam === 'home' ? 'away' : 'home';
      const activeReorgTeam =
        gameState.turnPhase === 'reorg-attacking' ? attackingTeam : defendingTeam;

      if (unit.team !== activeReorgTeam) {
        addLog(
          `It is currently ${activeReorgTeam === 'home' ? 'Home' : 'Away'}'s Reorganization turn.`,
          'whistle'
        );
        return;
      }

      if (unit.id === gameState.ball.possessionUnitId) {
        addLog(
          `⚠️ Rule: Only the Unit with the Ball (#${unit.card.number} ${unit.card.name}) must remain still during Reorganization!`,
          'whistle'
        );
        setSelectedUnitId(unit.id);
        setValidTargets([]);
        setTargetPosition(null);
        return;
      }

      setSelectedUnitId(unit.id);
      setTargetPosition(null);
      const targets = calculateValidReorgTargets(unit);
      setValidTargets(targets);
      return;
    }

    // Reposition (Repo) unit selection
    const isRepo =
      gameState.turnPhase === 'repo-defending' || gameState.turnPhase === 'repo-attacking';

    if (isRepo) {
      const inPossTeam = gameState.ball.possessionTeam || 'home';
      const defTeam = inPossTeam === 'home' ? 'away' : 'home';
      const activeRepoTeam = gameState.turnPhase === 'repo-defending' ? defTeam : inPossTeam;

      if (unit.team !== activeRepoTeam) {
        addLog(
          `It is currently ${activeRepoTeam === 'home' ? 'Home' : 'Away'}'s Reposition phase.`,
          'whistle'
        );
        return;
      }

      const used = repoMovesUsed[unit.id] || 0;
      const maxMoves = repoRunUnits[unit.id] ? 2 : 1;
      if (used >= maxMoves) {
        addLog(
          `Unit #${unit.card.number} ${unit.card.name} has already used all moves (${used}/${maxMoves}).`,
          'whistle'
        );
        setSelectedUnitId(unit.id);
        setValidTargets([]);
        setTargetPosition(null);
        return;
      }

      setSelectedUnitId(unit.id);
      setTargetPosition(null);
      const targets = getRepoAdjacentPositions(unit.position, gameState.units, unit.id);
      setValidTargets(targets);
      return;
    }

    // Normal play
    setSelectedUnitId(unit.id);
    setTargetPosition(null);
    setValidTargets([]);
    setActiveTacticAction(null);
  };

  // Handle selecting a target pitch position
  const handleSelectPosition = (pos: UnitPosition) => {
    const isReorg =
      gameState.turnPhase === 'reorg-attacking' || gameState.turnPhase === 'reorg-defending';

    if (isReorg) {
      if (selectedUnitId && selectedUnitId !== gameState.ball.possessionUnitId) {
        const unit = gameState.units[selectedUnitId];
        if (unit) {
          const check = canPlaceUnitAt(pos, gameState.units, unit.id);
          if (check.allowed) {
            setGameState((prev) => ({
              ...prev,
              units: {
                ...prev.units,
                [unit.id]: {
                  ...unit,
                  position: pos,
                },
              },
            }));
            SoundEffects.playKick();
            addLog(
              `Reorganized #${unit.card.number} ${unit.card.name} to ${pos.type} ${pos.col}${pos.row}.`,
              'possession'
            );
            setTargetPosition(null);
            setValidTargets(calculateValidReorgTargets(unit));
          } else {
            addLog(`Cannot place unit: ${check.reason || 'Zone full'}`, 'whistle');
          }
        }
      }
      return;
    }

    const isRepo =
      gameState.turnPhase === 'repo-defending' || gameState.turnPhase === 'repo-attacking';

    if (isRepo) {
      if (selectedUnitId) {
        const unit = gameState.units[selectedUnitId];
        if (unit) {
          const used = repoMovesUsed[unit.id] || 0;
          const maxMoves = repoRunUnits[unit.id] ? 2 : 1;
          if (used >= maxMoves) {
            addLog(
              `Unit #${unit.card.number} ${unit.card.name} has no moves remaining.`,
              'whistle'
            );
            return;
          }

          const validList = getRepoAdjacentPositions(unit.position, gameState.units, unit.id);
          const isTargetValid = validList.some((p) => arePositionsEqual(p, pos));
          if (!isTargetValid) {
            addLog(
              `Invalid Repo move: Can only move 1 step to adjacent Zone, Line, or Corner.`,
              'whistle'
            );
            return;
          }

          const check = canPlaceUnitAt(pos, gameState.units, unit.id);
          if (check.allowed) {
            const newUsed = used + 1;
            setRepoMovesUsed((prev) => ({ ...prev, [unit.id]: newUsed }));

            setGameState((prev) => {
              const updatedUnits = {
                ...prev.units,
                [unit.id]: {
                  ...unit,
                  position: pos,
                },
              };

              let updatedBall = prev.ball;
              if (prev.ball.status === 'in-possession' && prev.ball.possessionUnitId === unit.id) {
                updatedBall = {
                  ...prev.ball,
                  deadBallSpot: null,
                };
              }

              return {
                ...prev,
                units: updatedUnits,
                ball: updatedBall,
              };
            });

            SoundEffects.playKick();
            addLog(
              `Repositioned #${unit.card.number} ${unit.card.name} to ${pos.type} ${pos.col}${pos.row} (Moves: ${newUsed}/${maxMoves}).`,
              'possession'
            );

            if (newUsed < maxMoves) {
              const nextTargets = getRepoAdjacentPositions(pos, gameState.units, unit.id);
              setValidTargets(nextTargets);
            } else {
              setValidTargets([]);
              setTargetPosition(null);
            }
          } else {
            addLog(`Cannot place unit: ${check.reason || 'Zone full (2/2)'}`, 'whistle');
          }
        }
      }
      return;
    }

    if (!selectedUnitId) return;

    if (activeTacticAction) {
      setTargetPosition(pos);
      // Open duel modal
      setIsDuelModalOpen(true);
    } else {
      setTargetPosition(pos);
    }
  };

  // Reorganization Preset & Finish Handlers
  const handleApplyFormationPreset = (formation: string) => {
    const attackingTeam = gameState.ball.possessionTeam || 'home';
    const defendingTeam = attackingTeam === 'home' ? 'away' : 'home';
    const activeReorgTeam =
      gameState.turnPhase === 'reorg-attacking' ? attackingTeam : defendingTeam;
    const isAttacking = gameState.turnPhase === 'reorg-attacking';

    const newPositions = getFormationPreset(formation, activeReorgTeam, isAttacking);
    const ballUnitId = gameState.ball.possessionUnitId;

    setGameState((prev) => {
      const updated = { ...prev.units };
      Object.entries(newPositions).forEach(([uid, newPos]) => {
        // "Only Unit have the Ball must remain still."
        if (uid === ballUnitId && prev.units[uid]) {
          return;
        }
        if (updated[uid]) {
          updated[uid] = {
            ...updated[uid],
            position: newPos,
          };
        }
      });

      return {
        ...prev,
        units: updated,
        [activeReorgTeam === 'home' ? 'homeFormation' : 'awayFormation']: formation,
      };
    });

    SoundEffects.playKick();
    addLog(
      `Applied ${formation} formation reorganization for ${
        activeReorgTeam === 'home' ? 'Home' : 'Away'
      }.`,
      'possession'
    );
  };

  const handleFinishAttackingReorg = () => {
    const attackingTeam = gameState.ball.possessionTeam || 'home';
    const defendingTeam = attackingTeam === 'home' ? 'away' : 'home';

    setGameState((prev) => ({
      ...prev,
      turnPhase: 'reorg-defending',
      currentTurnTeam: defendingTeam,
    }));
    setSelectedUnitId(null);
    setValidTargets([]);
    setTargetPosition(null);
    SoundEffects.playWhistle();
    addLog(
      `Attacking Reorg complete. ${
        defendingTeam === 'home' ? 'Home' : 'Away'
      } (Defending side) now reorganizes!`,
      'whistle'
    );
  };

  const handleFinishDefendingReorg = () => {
    const attackingTeam = gameState.ball.possessionTeam || 'home';

    setGameState((prev) => ({
      ...prev,
      turnPhase: 'select-action',
      currentTurnTeam: attackingTeam,
      ball: {
        ...prev.ball,
        status: 'in-possession', // Live in play!
      },
    }));
    setSelectedUnitId(gameState.ball.possessionUnitId);
    setValidTargets([]);
    setTargetPosition(null);
    SoundEffects.playWhistle();
    addLog(
      `Reorganization complete! Kick-off underway by ${
        attackingTeam === 'home' ? 'Home' : 'Away'
      }. Ball is live!`,
      'whistle'
    );
  };

  // Initiate Tactic from UI button
  const handleInitiateTactic = (unitId: string, tactic: TacticType) => {
    const unit = gameState.units[unitId];
    if (!unit) return;

    setSelectedUnitId(unitId);
    setActiveTacticAction(tactic);

    if (tactic === 'Shoot') {
      // Direct shot at goal!
      setTargetPosition(unit.position);
      setIsDuelModalOpen(true);
      return;
    }

    const valid = calculateValidTargets(unit, tactic);
    setValidTargets(valid);
  };

  // Find defenders in target or adjacent area
  const getNearbyDefenders = (attacker: UnitOnField, targetPos?: UnitPosition): UnitOnField[] => {
    const oppTeam = attacker.team === 'home' ? 'away' : 'home';
    const allOpponents = Object.values(gameState.units).filter((u) => u.team === oppTeam);

    if (activeTacticAction === 'Shoot') {
      // Find goalkeeper first, plus any defender near goal box
      const gk = allOpponents.find((u) => u.card.isGoalkeeper);
      const others = allOpponents.filter((u) => !u.card.isGoalkeeper);
      return gk ? [gk, ...others] : allOpponents;
    }

    const targetCoord = targetPos ? positionToCoords(targetPos) : positionToCoords(attacker.position);
    return allOpponents
      .map((u) => ({
        unit: u,
        dist: Math.hypot(positionToCoords(u.position).x - targetCoord.x, positionToCoords(u.position).y - targetCoord.y),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4)
      .map((item) => item.unit);
  };

  // Handle resolution of the duel
  const handleDuelCompleted = (
    result: DuelResult,
    attackerUsedPRA?: PhysicalAction,
    defenderUsedPRA?: PhysicalAction
  ) => {
    setIsDuelModalOpen(false);

    if (!selectedUnitId) return;
    const attacker = gameState.units[selectedUnitId];
    if (!attacker) return;

    // Apply PRA Fatigue tokens
    let updatedUnits = { ...gameState.units };

    if (attackerUsedPRA) {
      const fRes = addFatigueTokens(attacker, 1);
      updatedUnits[attacker.id] = fRes.unit;
      if (fRes.convertedMinor) {
        addLog(`🩹 ${attacker.card.name} sustained a Minor Injury from fatigue!`, 'injury', attacker.team);
      }
      if (fRes.convertedMajor) {
        addLog(`🚑 CRITICAL: ${attacker.card.name} suffered a Major Injury!`, 'injury', attacker.team);
      }
    }

    // Time consumption for tactical play (1 to 3 minutes)
    advanceTime(2);

    // Apply tactical outcome
    if (result.outcomeType === 'goal') {
      // GOAL SCORED!
      const isHomeScorer = attacker.team === 'home';
      const newAttackingTeam: TeamSide = isHomeScorer ? 'away' : 'home';
      const kickOffCarrierId = isHomeScorer ? 'a-10' : 'h-10';
      const kickOffSpot: UnitPosition = isHomeScorer
        ? { type: 'inside', col: 'C', row: 6 }
        : { type: 'inside', col: 'D', row: 6 };

      if (updatedUnits[kickOffCarrierId]) {
        updatedUnits[kickOffCarrierId] = {
          ...updatedUnits[kickOffCarrierId],
          position: kickOffSpot,
        };
      }

      setGameState((prev) => ({
        ...prev,
        homeScore: isHomeScorer ? prev.homeScore + 1 : prev.homeScore,
        awayScore: !isHomeScorer ? prev.awayScore + 1 : prev.awayScore,
        homeMentalTrack: isHomeScorer
          ? Math.min(2, prev.homeMentalTrack + 1)
          : Math.max(-2, prev.homeMentalTrack - 1),
        awayMentalTrack: !isHomeScorer
          ? Math.min(2, prev.awayMentalTrack + 1)
          : Math.max(-2, prev.awayMentalTrack - 1),
        units: updatedUnits,
        currentTurnTeam: newAttackingTeam,
        turnPhase: 'reorg-attacking',
        ball: {
          status: 'dead-ball',
          possessionTeam: newAttackingTeam,
          possessionUnitId: kickOffCarrierId,
          freeBallPosition: null,
          deadBallType: 'kick-off',
          deadBallSpot: kickOffSpot,
        },
      }));

      setSelectedUnitId(null);
      setValidTargets([]);
      setTargetPosition(null);
      addLog(
        `⚽ GOAL! ${attacker.card.name} scores for ${attacker.team === 'home' ? 'Home' : 'Away'}!`,
        'goal',
        attacker.team
      );
      addLog(
        `Dead Ball (Kick-off awarded). Reorganization Phase begins: ${
          newAttackingTeam === 'home' ? 'Home' : 'Away'
        } reorgs first! Unit with the ball must remain still.`,
        'whistle'
      );
    } else if (result.outcomeType === 'save') {
      // SAVED BY GOALKEEPER -> Possession to defender
      const oppTeam = attacker.team === 'home' ? 'away' : 'home';
      const oppGK = Object.values(updatedUnits).find((u) => u.team === oppTeam && u.card.isGoalkeeper);

      setGameState((prev) => ({
        ...prev,
        units: updatedUnits,
        currentTurnTeam: oppTeam,
        ball: {
          status: 'in-possession',
          possessionTeam: oppTeam,
          possessionUnitId: oppGK ? oppGK.id : null,
          freeBallPosition: null,
          deadBallType: null,
          deadBallSpot: null,
        },
      }));

      addLog(`🧤 Spectacular save by the goalkeeper! Possession secured by ${oppTeam}.`, 'tackle', oppTeam);
      // Prompt manager card adjustment on possession change
      setManagerModalTeam(oppTeam);
    } else if (result.outcomeType === 'pass-completed') {
      // PASS COMPLETED -> Move ball to target position/teammate
      if (targetPosition) {
        // Find if a teammate is in the target zone/spot
        const teamUnits = Object.values(updatedUnits).filter((u) => u.team === attacker.team && u.id !== attacker.id);
        const closestTeammate = teamUnits
          .map((u) => ({
            unit: u,
            d: Math.hypot(
              positionToCoords(u.position).x - positionToCoords(targetPosition).x,
              positionToCoords(u.position).y - positionToCoords(targetPosition).y
            ),
          }))
          .sort((a, b) => a.d - b.d)[0]?.unit;

        const receiver = closestTeammate || attacker;

        setGameState((prev) => ({
          ...prev,
          units: updatedUnits,
          ball: {
            status: 'in-possession',
            possessionTeam: attacker.team,
            possessionUnitId: receiver.id,
            freeBallPosition: null,
            deadBallType: null,
            deadBallSpot: null,
          },
        }));

        setSelectedUnitId(receiver.id);
        addLog(`🎯 Pass received cleanly by ${receiver.card.name}!`, 'pass', attacker.team);
      }
    } else if (result.outcomeType === 'dribble-won') {
      // DRIBBLE WON -> Move attacker to targetPosition
      if (targetPosition) {
        const check = canPlaceUnitAt(targetPosition, updatedUnits, attacker.id);
        if (check.allowed) {
          updatedUnits[attacker.id] = {
            ...attacker,
            position: targetPosition,
          };
          setGameState((prev) => ({
            ...prev,
            units: updatedUnits,
          }));
          addLog(`⚡ ${attacker.card.name} skillfully moved to new position!`, 'pass', attacker.team);
        } else {
          addLog(`Zone full, unit held position.`, 'pass');
        }
      }
    } else if (result.outcomeType === 'tackled' || result.outcomeType === 'intercepted') {
      // TURNOVER -> Ball won by opponent
      const oppTeam = attacker.team === 'home' ? 'away' : 'home';
      const defenders = getNearbyDefenders(attacker, targetPosition || attacker.position);
      const winner = defenders[0];

      setGameState((prev) => ({
        ...prev,
        units: updatedUnits,
        currentTurnTeam: oppTeam,
        ball: {
          status: 'in-possession',
          possessionTeam: oppTeam,
          possessionUnitId: winner ? winner.id : null,
          freeBallPosition: null,
          deadBallType: null,
          deadBallSpot: null,
        },
      }));

      addLog(`🛑 Turnover! ${winner ? winner.card.name : 'Opponent'} wins possession!`, 'tackle', oppTeam);
      // Manager adjustment rule: freely adjust manager card on possession change
      setManagerModalTeam(oppTeam);
    } else if (result.outcomeType === 'free-ball') {
      // FREE BALL (No possession)
      setGameState((prev) => ({
        ...prev,
        units: updatedUnits,
        ball: {
          status: 'free-ball',
          possessionTeam: null,
          possessionUnitId: null,
          freeBallPosition: targetPosition || attacker.position,
          deadBallType: null,
          deadBallSpot: null,
        },
      }));
      addLog(`⚡ Free Ball! Loose ball in open territory!`, 'possession');
    } else if (result.outcomeType === 'dead-ball-foul') {
      // DEAD BALL (Foul)
      setGameState((prev) => ({
        ...prev,
        units: updatedUnits,
        ball: {
          status: 'dead-ball',
          possessionTeam: attacker.team,
          possessionUnitId: attacker.id,
          freeBallPosition: null,
          deadBallType: 'free-kick',
          deadBallSpot: attacker.position,
        },
      }));
      addLog(
        `🟨 Foul committed! Free kick awarded to ${
          attacker.team === 'home' ? 'Home' : 'Away'
        }.`,
        'foul',
        attacker.team
      );
    }

    setTargetPosition(null);
    setValidTargets([]);
    setActiveTacticAction(null);

    // If NOT a goal, initiate Reposition (Repo) Phase!
    // "after complete tactical execution, defending side can Repo each defending side Unit 1 move then attacking side follow.
    // Each side may perform Run [PRA] action which gain additional 1 move to designated Unit. After both side complete repo, repeat tactical execution."
    if (result.outcomeType !== 'goal') {
      const inPossTeam =
        result.outcomeType === 'save' ||
        result.outcomeType === 'tackled' ||
        result.outcomeType === 'intercepted'
          ? attacker.team === 'home'
            ? 'away'
            : 'home'
          : attacker.team;

      const defTeam: TeamSide = inPossTeam === 'home' ? 'away' : 'home';

      setGameState((prev) => ({
        ...prev,
        turnPhase: 'repo-defending',
        currentTurnTeam: defTeam,
      }));

      setSelectedUnitId(null);
      setValidTargets([]);
      setTargetPosition(null);
      setRepoMovesUsed({});
      setRepoRunUnits({});

      addLog(
        `Tactical play complete. Reposition (Repo) begins: Defending side (${
          defTeam === 'home' ? 'Home' : 'Away'
        }) repositions first! (1 move each, Run [PRA] for +1 move).`,
        'possession',
        defTeam
      );
    }
  };

  // Pass initiative / End turn manually
  const handleEndTurn = () => {
    setGameState((prev) => {
      const nextTeam: TeamSide = prev.currentTurnTeam === 'home' ? 'away' : 'home';
      return {
        ...prev,
        currentTurnTeam: nextTeam,
      };
    });
    advanceTime(1);
    addLog(`Initiative passed to ${gameState.currentTurnTeam === 'home' ? 'Away' : 'Home'}.`, 'possession');
  };

  // Automated AI opponent turn when AI is enabled
  useEffect(() => {
    if (!isAiEnabled || gameState.isGameOver) return;

    // AI Reorganization handling
    if (gameState.turnPhase === 'reorg-attacking' && gameState.currentTurnTeam === 'away') {
      const timer = setTimeout(() => {
        handleApplyFormationPreset('4-3-3');
        setTimeout(() => {
          handleFinishAttackingReorg();
        }, 500);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (gameState.turnPhase === 'reorg-defending' && gameState.currentTurnTeam === 'away') {
      const timer = setTimeout(() => {
        handleApplyFormationPreset('4-3-3');
        setTimeout(() => {
          handleFinishDefendingReorg();
        }, 500);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // AI Reposition handling
    if (gameState.turnPhase === 'repo-defending' && gameState.currentTurnTeam === 'away') {
      const timer = setTimeout(() => {
        handleFinishDefendingRepo();
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (gameState.turnPhase === 'repo-attacking' && gameState.currentTurnTeam === 'away') {
      const timer = setTimeout(() => {
        handleFinishAttackingRepo();
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (
      gameState.currentTurnTeam !== 'away' ||
      gameState.turnPhase.startsWith('reorg') ||
      gameState.turnPhase.startsWith('repo')
    ) {
      return;
    }

    const timer = setTimeout(() => {
      // AI Logic:
      const awayUnits = Object.values(gameState.units).filter((u) => u.team === 'away');
      const hasBall =
        gameState.ball.status === 'in-possession' && gameState.ball.possessionTeam === 'away';

      if (hasBall && gameState.ball.possessionUnitId) {
        const carrier = gameState.units[gameState.ball.possessionUnitId];
        if (!carrier) return;

        // If in shooting range (rows 1-3 for Away), shoot!
        if (carrier.position.row <= 3) {
          setSelectedUnitId(carrier.id);
          setActiveTacticAction('Shoot');
          setTargetPosition(carrier.position);
          setIsDuelModalOpen(true);
        } else {
          // Pass forward towards row 1
          const forwardTargets = calculateValidTargets(carrier, 'Short Pass').filter(
            (p) => p.row < carrier.position.row
          );
          const pickTarget = forwardTargets[0] || carrier.position;
          setSelectedUnitId(carrier.id);
          setActiveTacticAction('Short Pass');
          setTargetPosition(pickTarget);
          setIsDuelModalOpen(true);
        }
      } else {
        // Defending: AI presses ball carrier
        handleEndTurn();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    gameState.currentTurnTeam,
    gameState.turnPhase,
    isAiEnabled,
    gameState.ball,
    gameState.isGameOver,
  ]);

  // Restart match
  const handleRestartMatch = () => {
    setGameState(initializeGame());
    setSelectedUnitId('h-10');
    setTargetPosition(null);
    setValidTargets([]);
    setActiveTacticAction(null);
  };

  // Hand cards for current turn team
  const currentHandCards =
    gameState.currentTurnTeam === 'home' ? HOME_STARTING_11 : AWAY_STARTING_11;

  const currentAttacker = selectedUnitId ? gameState.units[selectedUnitId] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation & App Title */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-md text-white font-black">
              ⚽
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Football Boardgame
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  2-Player Turn-Based Prototype
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">
                6×11 Tactical Grid • Inside / Line / Corner Rules • 2-Slot Fatigue • Manager Synergies • d6 Duels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
            >
              📖 Rulebook
            </button>
            <button
              onClick={handleRestartMatch}
              className="flex items-center gap-1 rounded-lg bg-red-950/80 hover:bg-red-900 px-3 py-1.5 text-xs font-bold text-red-300 border border-red-800 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Match
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Game Over Modal / Banner if Finished */}
        {gameState.isGameOver && (
          <div className="rounded-2xl border-4 border-amber-500 bg-gradient-to-r from-amber-950 via-zinc-950 to-amber-950 p-6 text-center shadow-2xl">
            <Trophy className="mx-auto h-12 w-12 text-amber-400 mb-2 animate-bounce" />
            <h2 className="text-2xl font-black text-white">Full Time Reached!</h2>
            <p className="text-lg font-bold text-amber-300 mt-1">
              Final Score: Sky Blue City {gameState.homeScore} - {gameState.awayScore} Crimson United
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={handleRestartMatch}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-black uppercase text-black shadow-lg cursor-pointer"
              >
                Play Rematch
              </button>
            </div>
          </div>
        )}

        {/* Live Scoreboard */}
        <Scoreboard
          gameState={gameState}
          isAiEnabled={isAiEnabled}
          onToggleAi={() => setIsAiEnabled(!isAiEnabled)}
          onOpenFormationModal={(team) => setFormationModalTeam(team)}
          onOpenManagerModal={(team) => setManagerModalTeam(team)}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
          onRestartMatch={handleRestartMatch}
          onEndTurn={handleEndTurn}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />

        {/* Reorganization Action Banner or Standard Action Prompt Banner */}
        {gameState.turnPhase.startsWith('reorg') ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 px-4 py-3 text-xs shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-black uppercase text-amber-300 border border-amber-500/40 animate-pulse">
                  🔄{' '}
                  {gameState.turnPhase === 'reorg-attacking'
                    ? 'Step 1/2: Attacking Reorganization'
                    : 'Step 2/2: Defending Reorganization'}
                </span>
                <span className="font-bold text-white text-sm">
                  {gameState.turnPhase === 'reorg-attacking'
                    ? gameState.ball.possessionTeam === 'home'
                      ? 'Sky Blue City (Attacking Side)'
                      : 'Crimson United (Attacking Side)'
                    : gameState.ball.possessionTeam === 'home'
                    ? 'Crimson United (Defending Side)'
                    : 'Sky Blue City (Defending Side)'}
                </span>
              </div>
              <div className="text-zinc-300 text-[11px] flex flex-wrap items-center gap-1.5">
                <span className="text-amber-400 font-bold">Rule:</span>
                <span>
                  Each side can move <b>All units</b> freely on their side (click unit then click pitch target).
                  {gameState.turnPhase === 'reorg-attacking' ? (
                    <span className="text-amber-300 font-bold ml-1">
                      ⚠️ Only the Unit with the Ball (
                      {gameState.ball.possessionUnitId
                        ? `#${gameState.units[gameState.ball.possessionUnitId]?.card.number} ${
                            gameState.units[gameState.ball.possessionUnitId]?.card.name
                          }`
                        : 'Striker'}
                      ) must remain still!
                    </span>
                  ) : (
                    <span className="text-emerald-300 font-bold ml-1">
                      Defending side can reposition all units to counter opponent formation.
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Reorg Quick Actions & Step Finish */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-700">
                <span className="text-[10px] text-zinc-400 font-semibold mr-1">Presets:</span>
                {['4-3-3', '4-4-2', '3-5-2', '5-3-2'].map((f) => (
                  <button
                    key={f}
                    onClick={() => handleApplyFormationPreset(f)}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-200 border border-zinc-700 hover:text-white transition-all cursor-pointer"
                  >
                    {f}
                  </button>
                ))}
              </div>

              {gameState.turnPhase === 'reorg-attacking' ? (
                <button
                  onClick={handleFinishAttackingReorg}
                  className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 px-4 py-2 text-xs font-black uppercase text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Finish Attacking Reorg ➔
                </button>
              ) : (
                <button
                  onClick={handleFinishDefendingReorg}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-4 py-2 text-xs font-black uppercase text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Finish Defending Reorg & Kick-off! ⚽
                </button>
              )}
            </div>
          </div>
        ) : gameState.turnPhase === 'repo-defending' || gameState.turnPhase === 'repo-attacking' ? (
          /* Reposition (Repo) Action Banner */
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-sky-500/60 bg-gradient-to-r from-sky-950/80 via-zinc-900 to-sky-950/80 px-4 py-3 text-xs shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-black uppercase text-sky-300 border border-sky-500/40 animate-pulse">
                  🔄 Reposition Phase (Repo):{' '}
                  {gameState.turnPhase === 'repo-defending' ? 'Defending Side' : 'Attacking Side'}
                </span>
                <span className="font-bold text-white text-sm">
                  {gameState.currentTurnTeam === 'home' ? 'Sky Blue City' : 'Crimson United'}
                </span>
              </div>
              <div className="text-zinc-300 text-[11px] flex flex-wrap items-center gap-2">
                <span className="text-sky-400 font-bold">1-Move Rule:</span>
                <span>
                  Zone ↔ Line ↔ Corner. Click unit then click adjacent highlighted spot.
                  {selectedUnitId && gameState.units[selectedUnitId] && (
                    <span className="ml-1 text-white font-semibold">
                      Selected: #{gameState.units[selectedUnitId]?.card.number}{' '}
                      {gameState.units[selectedUnitId]?.card.name} (Moves:{' '}
                      {repoMovesUsed[selectedUnitId] || 0}/{getUnitMaxRepoMoves(selectedUnitId)})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Run PRA Button & Step Finish Button */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedUnitId &&
                gameState.units[selectedUnitId]?.team === gameState.currentTurnTeam &&
                !repoRunUnits[selectedUnitId] && (
                  <button
                    onClick={() => handleToggleRepoRunPRA(selectedUnitId)}
                    className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1"
                    title="Gain +1 extra move for designated unit at cost of +1 Fatigue token"
                  >
                    ⚡ Perform Run [PRA] (+1 Move, +1 Fatigue)
                  </button>
                )}

              {gameState.turnPhase === 'repo-defending' ? (
                <button
                  onClick={handleFinishDefendingRepo}
                  className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-4 py-2 text-xs font-black uppercase text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Finish Defending Repo ➔ Attacking Repo
                </button>
              ) : (
                <button
                  onClick={handleFinishAttackingRepo}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-4 py-2 text-xs font-black uppercase text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Finish Attacking Repo ➔ Resume Tactics! ⚽
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Standard Action Prompt Banner */
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400">Tactical Guidance:</span>
              {selectedUnitId ? (
                <span className="text-zinc-200">
                  Selected: <b className="text-white">#{gameState.units[selectedUnitId]?.card.number} {gameState.units[selectedUnitId]?.card.name}</b>
                  {activeTacticAction ? (
                    <span className="text-amber-300 font-bold ml-1">
                      — Choose target spot on pitch or in hand for [{activeTacticAction}]
                    </span>
                  ) : (
                    <span className="text-zinc-400 ml-1">
                      — Click Pass, Dribble, or Shoot below to initiate action!
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-zinc-400">
                  Click any player on the pitch or in your hand to select and command.
                </span>
              )}
            </div>

            {activeTacticAction && (
              <button
                onClick={() => {
                  setActiveTacticAction(null);
                  setValidTargets([]);
                  setTargetPosition(null);
                }}
                className="rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-300"
              >
                Cancel Tactic
              </button>
            )}
          </div>
        )}

        {/* Football Pitch Board */}
        <PitchBoard
          units={gameState.units}
          ball={gameState.ball}
          selectedUnitId={selectedUnitId}
          onSelectUnit={handleSelectUnit}
          onSelectPosition={handleSelectPosition}
          targetPosition={targetPosition}
          validTargetPositions={validTargets}
          currentTurn={gameState.currentTurnTeam}
        />

        {/* Lower Row: Hand of Unit Cards & Match Commentary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Active Hand of Unit Cards (2 Columns) */}
          <div className="lg:col-span-2">
            <UnitCardHand
              team={gameState.currentTurnTeam}
              handCards={currentHandCards}
              units={gameState.units}
              selectedUnitId={selectedUnitId}
              onSelectUnit={handleSelectUnit}
              onInitiateTactic={handleInitiateTactic}
              ballCarrierId={
                gameState.ball.status === 'in-possession'
                  ? gameState.ball.possessionUnitId
                  : null
              }
              isCurrentTurn={true}
              isTeamInPossession={gameState.ball.possessionTeam === gameState.currentTurnTeam}
              isRepo={
                gameState.turnPhase === 'repo-defending' ||
                gameState.turnPhase === 'repo-attacking'
              }
              repoMovesUsed={repoMovesUsed}
              repoRunUnits={repoRunUnits}
              onToggleRepoRunPRA={handleToggleRepoRunPRA}
            />
          </div>

          {/* Match Log / Live Commentary (1 Column) */}
          <div className="lg:col-span-1">
            <MatchLog logs={gameState.matchLogs} />
          </div>
        </div>
      </main>

      {/* Formation & Squad Modal */}
      {formationModalTeam && (
        <FormationScreenModal
          isOpen={true}
          onClose={() => setFormationModalTeam(null)}
          team={formationModalTeam}
          units={gameState.units}
          subs={formationModalTeam === 'home' ? gameState.homeSubs : gameState.awaySubs}
          formation={
            formationModalTeam === 'home' ? gameState.homeFormation : gameState.awayFormation
          }
          mentalTrack={
            formationModalTeam === 'home'
              ? gameState.homeMentalTrack
              : gameState.awayMentalTrack
          }
          onUpdateFormation={(team, newFormation) => {
            setGameState((prev) => ({
              ...prev,
              [team === 'home' ? 'homeFormation' : 'awayFormation']: newFormation,
            }));
            addLog(`${team === 'home' ? 'Home' : 'Away'} changed formation to ${newFormation}.`, 'possession', team);
          }}
          onUpdateMentalTrack={(team, newMental) => {
            setGameState((prev) => ({
              ...prev,
              [team === 'home' ? 'homeMentalTrack' : 'awayMentalTrack']: newMental,
            }));
          }}
          onUpdateUnitFatigue={(unitId, slot1, slot2, minor, major) => {
            setGameState((prev) => {
              const u = prev.units[unitId];
              if (!u) return prev;
              return {
                ...prev,
                units: {
                  ...prev.units,
                  [unitId]: {
                    ...u,
                    fatigueSlot1: slot1,
                    fatigueSlot2: slot2,
                    minorInjuries: minor,
                    majorInjuries: major,
                  },
                },
              };
            });
          }}
          onSubstitute={(starterId, subId) => {
            setGameState((prev) => {
              const starter = prev.units[starterId];
              const isHome = starter.team === 'home';
              const subsList = isHome ? prev.homeSubs : prev.awaySubs;
              const subCard = subsList.find((s) => s.id === subId);
              if (!starter || !subCard) return prev;

              // Swap starter with sub
              const newUnit: UnitOnField = {
                id: subCard.id,
                card: subCard,
                team: starter.team,
                position: starter.position,
                fatigueSlot1: 0,
                fatigueSlot2: 0,
                minorInjuries: 0,
                majorInjuries: 0,
                hasCardDeployed: true,
                isDeployedFaceUp: true,
              };

              const newUnits = { ...prev.units };
              delete newUnits[starterId];
              newUnits[subCard.id] = newUnit;

              const remainingSubs = subsList.filter((s) => s.id !== subId);
              remainingSubs.push(starter.card);

              return {
                ...prev,
                units: newUnits,
                [isHome ? 'homeSubs' : 'awaySubs']: remainingSubs,
              };
            });
            addLog(`Substitution: ${starterId} replaced by ${subId}.`, 'whistle');
          }}
        />
      )}

      {/* Manager Strategy Cards Modal */}
      {managerModalTeam && (
        <ManagerCardModal
          isOpen={true}
          onClose={() => setManagerModalTeam(null)}
          team={managerModalTeam}
          managerCards={
            managerModalTeam === 'home'
              ? gameState.homeManagerCards
              : gameState.awayManagerCards
          }
          activeInPossessionId={
            managerModalTeam === 'home'
              ? gameState.homeActiveInPossessionManagerId
              : gameState.awayActiveInPossessionManagerId
          }
          activeOutOfPossessionId={
            managerModalTeam === 'home'
              ? gameState.homeActiveOutOfPossessionManagerId
              : gameState.awayActiveOutOfPossessionManagerId
          }
          onSelectInPossession={(team, cardId) => {
            setGameState((prev) => ({
              ...prev,
              [team === 'home'
                ? 'homeActiveInPossessionManagerId'
                : 'awayActiveInPossessionManagerId']: cardId,
            }));
            const card = gameState.homeManagerCards.find((c) => c.id === cardId);
            addLog(`${team === 'home' ? 'Home' : 'Away'} selected In-Possession Strategy: ${card?.name}.`, 'possession', team);
          }}
          onSelectOutOfPossession={(team, cardId) => {
            setGameState((prev) => ({
              ...prev,
              [team === 'home'
                ? 'homeActiveOutOfPossessionManagerId'
                : 'awayActiveOutOfPossessionManagerId']: cardId,
            }));
            const card = gameState.homeManagerCards.find((c) => c.id === cardId);
            addLog(`${team === 'home' ? 'Home' : 'Away'} selected Out-of-Possession Strategy: ${card?.name}.`, 'possession', team);
          }}
          currentFormation={
            managerModalTeam === 'home'
              ? gameState.homeFormation
              : gameState.awayFormation
          }
          ballStatus={gameState.ball.status}
          isTeamInPossession={gameState.ball.possessionTeam === managerModalTeam}
        />
      )}

      {/* Tactical Duel & Dice Rolling Modal */}
      {isDuelModalOpen && currentAttacker && (
        <TacticExecutionModal
          isOpen={true}
          onClose={() => setIsDuelModalOpen(false)}
          tacticType={activeTacticAction || 'Short Pass'}
          attackerUnit={currentAttacker}
          possibleDefenders={getNearbyDefenders(currentAttacker, targetPosition || currentAttacker.position)}
          attackerManager={
            currentAttacker.team === 'home'
              ? gameState.homeManagerCards.find((m) => m.id === gameState.homeActiveInPossessionManagerId)
              : gameState.awayManagerCards.find((m) => m.id === gameState.awayActiveInPossessionManagerId)
          }
          defenderManager={
            currentAttacker.team === 'home'
              ? gameState.awayManagerCards.find((m) => m.id === gameState.awayActiveOutOfPossessionManagerId)
              : gameState.homeManagerCards.find((m) => m.id === gameState.homeActiveOutOfPossessionManagerId)
          }
          attackerMental={
            currentAttacker.team === 'home'
              ? gameState.homeMentalTrack
              : gameState.awayMentalTrack
          }
          defenderMental={
            currentAttacker.team === 'home'
              ? gameState.awayMentalTrack
              : gameState.homeMentalTrack
          }
          targetPosition={targetPosition || undefined}
          onDuelCompleted={handleDuelCompleted}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
}

