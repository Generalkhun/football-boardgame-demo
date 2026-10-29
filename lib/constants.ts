import { ColumnLabel, RowNumber, ManagerCard, UnitCard } from '../types/game';

export const COLUMNS: ColumnLabel[] = ['A', 'B', 'C', 'D', 'E', 'F'];
export const ROWS: RowNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2'];

// Initial Manager Cards inspired by the user's uploaded demo images
export const INITIAL_MANAGERS: ManagerCard[] = [
  {
    id: 'mgr-pep',
    name: 'Guardiola',
    preferredFormation: '4-3-3',
    quote: 'More than you believe, I am happy.',
    image: '/demo/S__105578508_0.jpg',
    inPossessionTactic: {
      name: 'Positional Tiki-Taka',
      description: 'Patient build-up: +2 to Passing and +1 to Dribbling rolls when inside opponent half.',
      bonusStat: 'passing',
      bonusValue: 2,
    },
    outOfPossessionTactic: {
      name: 'Rest Defence',
      description: 'Quick recovery: +2 to Tackling when defending counter attacks.',
      bonusStat: 'tackling',
      bonusValue: 2,
    },
  },
  {
    id: 'mgr-klopp',
    name: 'Klopp',
    preferredFormation: '4-3-3',
    quote: 'Our identity is intensity.',
    image: '/demo/S__105578509_0.jpg',
    inPossessionTactic: {
      name: 'Heavy Metal Wing Attack',
      description: 'Direct wide overload: +2 to Long Passes & Crosses.',
      bonusStat: 'passing',
      bonusValue: 2,
    },
    outOfPossessionTactic: {
      name: 'Gegenpress',
      description: 'Immediate suffocating pressure: +2 to High Press rolls in middle & final third.',
      bonusStat: 'pace',
      bonusValue: 2,
    },
  },
  {
    id: 'mgr-mourinho',
    name: 'Mourinho',
    preferredFormation: '4-3-3',
    quote: 'I am the Special One.',
    image: '/demo/S__105578507_0.jpg',
    inPossessionTactic: {
      name: 'Clinical Direct Strike',
      description: 'Fast break: +2 to Shooting when in transition.',
      bonusStat: 'shooting',
      bonusValue: 2,
    },
    outOfPossessionTactic: {
      name: 'Park The Bus',
      description: 'Ironclad low block: Opponents suffer -2 to Shooting and -1 to Dribbling in your box.',
      bonusStat: 'tackling',
      bonusValue: 2,
    },
  },
  {
    id: 'mgr-ancelotti',
    name: 'Ancelotti',
    preferredFormation: '4-4-2',
    quote: 'Football is the most important of the least important things.',
    image: '/demo/S__105578502_0.jpg',
    inPossessionTactic: {
      name: 'Fluid Individual Brilliance',
      description: 'Star freedom: +2 to Dribbling and 1 reroll on 1s.',
      bonusStat: 'dribbling',
      bonusValue: 2,
    },
    outOfPossessionTactic: {
      name: 'Calm Mid-Block',
      description: 'Composed positioning: Negates opponent mental bonus.',
      bonusStat: 'stamina',
      bonusValue: 1,
    },
  },
  {
    id: 'mgr-arteta',
    name: 'Arteta',
    preferredFormation: '4-3-3',
    quote: 'Trust the process and control the duels.',
    image: '/demo/S__105578501_0.jpg',
    inPossessionTactic: {
      name: 'Inverted Overloads',
      description: 'Box midfield dominance: +2 to Short Passes in Central zones (C & D).',
      bonusStat: 'passing',
      bonusValue: 2,
    },
    outOfPossessionTactic: {
      name: 'Aggressive Compact Line',
      description: 'High line compactness: +2 to Intercepting line passes.',
      bonusStat: 'tackling',
      bonusValue: 2,
    },
  },
];

// Home Team (Sky Blue - City Lions)
export const HOME_STARTING_11: UnitCard[] = [
  {
    id: 'h-1',
    name: 'Ederson',
    number: 31,
    team: 'home',
    role: 'GK',
    positionName: 'GK',
    isGoalkeeper: true,
    preferredPRA: ['Aerial Duel'],
    stats: { pace: 3, passing: 4, dribbling: 2, tackling: 4, shooting: 1, stamina: 4 },
  },
  {
    id: 'h-2',
    name: 'Walker',
    number: 2,
    team: 'home',
    role: 'DF',
    positionName: 'RB',
    isGoalkeeper: false,
    preferredPRA: ['Sprint', 'Slide Tackle'],
    stats: { pace: 5, passing: 3, dribbling: 3, tackling: 4, shooting: 1, stamina: 5 },
  },
  {
    id: 'h-3',
    name: 'Dias',
    number: 3,
    team: 'home',
    role: 'DF',
    positionName: 'CB',
    isGoalkeeper: false,
    preferredPRA: ['Aerial Duel', 'Slide Tackle'],
    stats: { pace: 3, passing: 3, dribbling: 2, tackling: 5, shooting: 1, stamina: 4 },
  },
  {
    id: 'h-4',
    name: 'Akanji',
    number: 25,
    team: 'home',
    role: 'DF',
    positionName: 'CB',
    isGoalkeeper: false,
    preferredPRA: ['Slide Tackle'],
    stats: { pace: 4, passing: 3, dribbling: 2, tackling: 4, shooting: 1, stamina: 4 },
  },
  {
    id: 'h-5',
    name: 'Gvardiol',
    number: 24,
    team: 'home',
    role: 'DF',
    positionName: 'LB',
    isGoalkeeper: false,
    preferredPRA: ['Sprint', 'High Press'],
    stats: { pace: 4, passing: 3, dribbling: 3, tackling: 4, shooting: 2, stamina: 4 },
  },
  {
    id: 'h-6',
    name: 'Rodri',
    number: 16,
    team: 'home',
    role: 'MF',
    positionName: 'CDM',
    isGoalkeeper: false,
    preferredPRA: ['High Press', 'Power Shot'],
    stats: { pace: 3, passing: 5, dribbling: 4, tackling: 5, shooting: 4, stamina: 5 },
  },
  {
    id: 'h-7',
    name: 'De Bruyne',
    number: 17,
    team: 'home',
    role: 'MF',
    positionName: 'CAM',
    isGoalkeeper: false,
    preferredPRA: ['Power Shot'],
    stats: { pace: 3, passing: 6, dribbling: 4, tackling: 2, shooting: 5, stamina: 4 },
  },
  {
    id: 'h-8',
    name: 'Bernardo',
    number: 20,
    team: 'home',
    role: 'MF',
    positionName: 'CM',
    isGoalkeeper: false,
    preferredPRA: ['High Press'],
    stats: { pace: 4, passing: 4, dribbling: 5, tackling: 3, shooting: 3, stamina: 5 },
  },
  {
    id: 'h-9',
    name: 'Foden',
    number: 47,
    team: 'home',
    role: 'FW',
    positionName: 'RW',
    isGoalkeeper: false,
    preferredPRA: ['Sprint', 'Power Shot'],
    stats: { pace: 4, passing: 4, dribbling: 5, tackling: 2, shooting: 4, stamina: 4 },
  },
  {
    id: 'h-10',
    name: 'Haaland',
    number: 9,
    team: 'home',
    role: 'FW',
    positionName: 'ST',
    isGoalkeeper: false,
    preferredPRA: ['Power Shot', 'Aerial Duel', 'Sprint'],
    stats: { pace: 5, passing: 2, dribbling: 3, tackling: 1, shooting: 6, stamina: 4 },
  },
  {
    id: 'h-11',
    name: 'Doku',
    number: 11,
    team: 'home',
    role: 'FW',
    positionName: 'LW',
    isGoalkeeper: false,
    preferredPRA: ['Sprint'],
    stats: { pace: 6, passing: 3, dribbling: 6, tackling: 1, shooting: 3, stamina: 3 },
  },
];

export const HOME_SUBS: UnitCard[] = [
  {
    id: 'h-sub-1',
    name: 'Ortega',
    number: 18,
    team: 'home',
    role: 'GK',
    positionName: 'GK',
    isGoalkeeper: true,
    preferredPRA: ['Aerial Duel'],
    stats: { pace: 3, passing: 3, dribbling: 2, tackling: 4, shooting: 1, stamina: 3 },
  },
  {
    id: 'h-sub-2',
    name: 'Stones',
    number: 5,
    team: 'home',
    role: 'DF',
    positionName: 'CB',
    isGoalkeeper: false,
    preferredPRA: ['Slide Tackle'],
    stats: { pace: 3, passing: 4, dribbling: 3, tackling: 4, shooting: 2, stamina: 4 },
  },
  {
    id: 'h-sub-3',
    name: 'Kovacic',
    number: 8,
    team: 'home',
    role: 'MF',
    positionName: 'CM',
    isGoalkeeper: false,
    preferredPRA: ['High Press'],
    stats: { pace: 3, passing: 4, dribbling: 4, tackling: 3, shooting: 2, stamina: 4 },
  },
  {
    id: 'h-sub-4',
    name: 'Grealish',
    number: 10,
    team: 'home',
    role: 'FW',
    positionName: 'LW',
    isGoalkeeper: false,
    preferredPRA: ['Sprint'],
    stats: { pace: 3, passing: 4, dribbling: 5, tackling: 2, shooting: 3, stamina: 4 },
  },
  {
    id: 'h-sub-5',
    name: 'Alvarez',
    number: 19,
    team: 'home',
    role: 'FW',
    positionName: 'ST',
    isGoalkeeper: false,
    preferredPRA: ['High Press', 'Power Shot'],
    stats: { pace: 4, passing: 3, dribbling: 4, tackling: 3, shooting: 5, stamina: 5 },
  },
];

// Away Team (Crimson Red - Red Dragons)
export const AWAY_STARTING_11: UnitCard[] = [
  {
    id: 'a-1',
    name: 'Alisson',
    number: 1,
    team: 'away',
    role: 'GK',
    positionName: 'GK',
    isGoalkeeper: true,
    preferredPRA: ['Aerial Duel'],
    stats: { pace: 3, passing: 4, dribbling: 2, tackling: 5, shooting: 1, stamina: 4 },
  },
  {
    id: 'a-2',
    name: 'Alexander-Arnold',
    number: 66,
    team: 'away',
    role: 'DF',
    positionName: 'RB',
    isGoalkeeper: false,
    preferredPRA: ['Power Shot'],
    stats: { pace: 3, passing: 6, dribbling: 3, tackling: 3, shooting: 4, stamina: 4 },
  },
  {
    id: 'a-3',
    name: 'Van Dijk',
    number: 4,
    team: 'away',
    role: 'DF',
    positionName: 'CB',
    isGoalkeeper: false,
    preferredPRA: ['Aerial Duel', 'Slide Tackle'],
    stats: { pace: 4, passing: 4, dribbling: 2, tackling: 6, shooting: 2, stamina: 5 },
  },
  {
    id: 'a-4',
    name: 'Konate',
    number: 5,
    team: 'away',
    role: 'DF',
    positionName: 'CB',
    isGoalkeeper: false,
    preferredPRA: ['Slide Tackle', 'Aerial Duel'],
    stats: { pace: 4, passing: 2, dribbling: 2, tackling: 5, shooting: 1, stamina: 4 },
  },
  {
    id: 'a-5',
    name: 'Robertson',
    number: 26,
    team: 'away',
    role: 'DF',
    positionName: 'LB',
    isGoalkeeper: false,
    preferredPRA: ['Sprint', 'High Press'],
    stats: { pace: 5, passing: 4, dribbling: 3, tackling: 4, shooting: 2, stamina: 5 },
  },
  {
    id: 'a-6',
    name: 'Mac Allister',
    number: 10,
    team: 'away',
    role: 'MF',
    positionName: 'CM',
    isGoalkeeper: false,
    preferredPRA: ['High Press'],
    stats: { pace: 3, passing: 5, dribbling: 4, tackling: 4, shooting: 4, stamina: 4 },
  },
  {
    id: 'a-7',
    name: 'Szoboszlai',
    number: 8,
    team: 'away',
    role: 'MF',
    positionName: 'CAM',
    isGoalkeeper: false,
    preferredPRA: ['Power Shot', 'Sprint'],
    stats: { pace: 4, passing: 4, dribbling: 4, tackling: 3, shooting: 5, stamina: 5 },
  },
  {
    id: 'a-8',
    name: 'Gravenberch',
    number: 38,
    team: 'away',
    role: 'MF',
    positionName: 'CDM',
    isGoalkeeper: false,
    preferredPRA: ['High Press'],
    stats: { pace: 4, passing: 4, dribbling: 4, tackling: 4, shooting: 2, stamina: 4 },
  },
  {
    id: 'a-9',
    name: 'Salah',
    number: 11,
    team: 'away',
    role: 'FW',
    positionName: 'RW',
    isGoalkeeper: false,
    preferredPRA: ['Sprint', 'Power Shot'],
    stats: { pace: 5, passing: 4, dribbling: 5, tackling: 2, shooting: 6, stamina: 4 },
  },
  {
    id: 'a-10',
    name: 'Nunez',
    number: 9,
    team: 'away',
    role: 'FW',
    positionName: 'ST',
    isGoalkeeper: false,
    preferredPRA: ['Sprint', 'Aerial Duel', 'Power Shot'],
    stats: { pace: 5, passing: 2, dribbling: 3, tackling: 2, shooting: 5, stamina: 4 },
  },
  {
    id: 'a-11',
    name: 'Diaz',
    number: 7,
    team: 'away',
    role: 'FW',
    positionName: 'LW',
    isGoalkeeper: false,
    preferredPRA: ['Sprint', 'High Press'],
    stats: { pace: 5, passing: 3, dribbling: 5, tackling: 3, shooting: 4, stamina: 4 },
  },
];

export const AWAY_SUBS: UnitCard[] = [
  {
    id: 'a-sub-1',
    name: 'Kelleher',
    number: 62,
    team: 'away',
    role: 'GK',
    positionName: 'GK',
    isGoalkeeper: true,
    preferredPRA: ['Aerial Duel'],
    stats: { pace: 3, passing: 3, dribbling: 2, tackling: 4, shooting: 1, stamina: 3 },
  },
  {
    id: 'a-sub-2',
    name: 'Gomez',
    number: 2,
    team: 'away',
    role: 'DF',
    positionName: 'CB',
    isGoalkeeper: false,
    preferredPRA: ['Slide Tackle'],
    stats: { pace: 4, passing: 2, dribbling: 2, tackling: 4, shooting: 1, stamina: 4 },
  },
  {
    id: 'a-sub-3',
    name: 'Jones',
    number: 17,
    team: 'away',
    role: 'MF',
    positionName: 'CM',
    isGoalkeeper: false,
    preferredPRA: ['High Press'],
    stats: { pace: 3, passing: 4, dribbling: 4, tackling: 3, shooting: 3, stamina: 4 },
  },
  {
    id: 'a-sub-4',
    name: 'Gakpo',
    number: 18,
    team: 'away',
    role: 'FW',
    positionName: 'LW',
    isGoalkeeper: false,
    preferredPRA: ['Power Shot'],
    stats: { pace: 4, passing: 3, dribbling: 4, tackling: 2, shooting: 4, stamina: 4 },
  },
  {
    id: 'a-sub-5',
    name: 'Jota',
    number: 20,
    team: 'away',
    role: 'FW',
    positionName: 'ST',
    isGoalkeeper: false,
    preferredPRA: ['Aerial Duel', 'High Press'],
    stats: { pace: 4, passing: 3, dribbling: 4, tackling: 2, shooting: 5, stamina: 4 },
  },
];

// Audio synthesizer for boardgame sounds using Web Audio API
export class SoundEffects {
  private static ctx: AudioContext | null = null;

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public static playWhistle() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(2600, ctx.currentTime);
    osc2.frequency.setValueAtTime(2800, ctx.currentTime);

    // Trill
    osc1.frequency.linearRampToValueAtTime(2900, ctx.currentTime + 0.15);
    osc1.frequency.linearRampToValueAtTime(2500, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  }

  public static playKick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  public static playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;
    // Series of quick gentle clicks
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 400, ctx.currentTime + i * 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.04);
    }
  }

  public static playCheer() {
    const ctx = this.getContext();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  public static playTackle() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }
}
