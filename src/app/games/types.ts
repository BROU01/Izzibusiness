export type GameId = 'spin' | 'apple' | 'aviator';

export interface GamesRules {
  minBet: number;
  maxBet: number;
  rtp: number;
  spinSegments: number[];
  appleLevels: number;
  appleColumns: number;
  appleMultipliers: number[];
  aviatorGrowthRate: number;
  aviatorMaxMultiplier: number;
}

export interface ActiveRound {
  id: string;
  game: GameId;
  bet: number;
  state: Record<string, unknown>;
  serverSeedHash: string;
  startedAt: string;
}

export interface RecentRound {
  id: string;
  game: GameId;
  bet: number;
  status: 'won' | 'lost';
  multiplier: number;
  payout: number;
  startedAt: string;
}

export interface GamesState {
  isMember: boolean;
  accepted: boolean;
  balance: number;
  enabled: Record<GameId, boolean>;
  rules: GamesRules;
  active: ActiveRound[];
  recent: RecentRound[];
}

export interface GameProps {
  rules: GamesRules;
  balance: number;
  onBalance: (balance: number) => void;
  onRoundEnd: () => void;
}
