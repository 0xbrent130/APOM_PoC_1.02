export type GamingStatus = "live" | "coming_soon" | "maintenance" | "archived";

export interface GameActionState {
  enabled: boolean;
  label: string;
  disabledReason: string | null;
}

export interface GamingGame {
  id: string;
  slug: string;
  title: string;
  genre: string;
  status: GamingStatus;
  rewardRate: string;
  activePlayers: number;
  updatedAt: string;
  action: GameActionState;
}

export interface GamingStats {
  totalGames: number;
  liveGames: number;
  totalActivePlayers: number;
  rewardPrograms: number;
}

export interface GamingOverview {
  games: GamingGame[];
  stats: GamingStats;
}

export interface PlayGameRequest {
  wallet?: string;
}

export interface PlayGameResponse {
  game: {
    slug: string;
    title: string;
  };
  participation: {
    id: string;
    action: string;
    occurredAt: string;
  };
}
