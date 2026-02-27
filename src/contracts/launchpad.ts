export type LaunchpadProjectStatus = "upcoming" | "live" | "completed" | "cancelled";

export interface LaunchpadActionState {
  enabled: boolean;
  label: string;
  disabledReason: string | null;
}

export interface LaunchpadProjectSummary {
  id: string;
  name: string;
  type: string;
  status: LaunchpadProjectStatus;
  raised: number;
  target: number;
  participants: number;
  deadline: string;
  timeline: string;
  progressPercentage: number;
  updatedAt: string;
  contributionAction: LaunchpadActionState;
}

export interface LaunchpadStats {
  totalProjects: number;
  liveProjects: number;
  totalRaised: number;
  totalParticipants: number;
}

export interface LaunchpadOverview {
  projects: LaunchpadProjectSummary[];
  stats: LaunchpadStats;
}

export interface LaunchpadProjectDetails {
  project: LaunchpadProjectSummary;
  recentContributions: {
    id: string;
    userId: string;
    amount: number;
    createdAt: string;
  }[];
}

export interface ContributeToProjectRequest {
  amount: number;
}

export interface ContributeToProjectResponse {
  project: LaunchpadProjectSummary;
  contribution: {
    id: string;
    projectId: string;
    amount: number;
    createdAt: string;
  };
  message: string;
}
