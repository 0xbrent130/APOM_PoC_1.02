export type GovernanceProposalStatus = "pending" | "active" | "passed" | "rejected" | "executed";

export interface GovernanceActionState {
  enabled: boolean;
  label: string;
  disabledReason: string | null;
}

export interface GovernanceProposalSummary {
  id: string;
  title: string;
  description: string;
  status: GovernanceProposalStatus;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  endsAt: string;
  timeline: string;
  updatedAt: string;
  actions: {
    vote: GovernanceActionState;
    discuss: GovernanceActionState;
  };
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVotingPower: number;
  totalQuorum: number;
}

export interface GovernanceOverview {
  proposals: GovernanceProposalSummary[];
  stats: GovernanceStats;
}

export interface SubmitVoteRequest {
  support: boolean;
  voteWeight?: number;
}

export interface SubmitVoteResponse {
  proposal: GovernanceProposalSummary;
  vote: {
    id: string;
    support: boolean;
    voteWeight: number;
    createdAt: string;
  };
  message: string;
}

export interface SubmitDiscussionRequest {
  message: string;
}

export interface SubmitDiscussionResponse {
  proposal: GovernanceProposalSummary;
  discussion: {
    proposalId: string;
    message: string;
    submittedAt: string;
  };
  message: string;
}
