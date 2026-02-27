import { apiClient } from "@/lib/api-client";
import type {
  GovernanceOverview,
  SubmitDiscussionRequest,
  SubmitDiscussionResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
} from "@/contracts";

export function getGovernanceOverview() {
  return apiClient.get<GovernanceOverview>("/governance/overview");
}

export function submitProposalVote(proposalId: string, payload: SubmitVoteRequest) {
  return apiClient.post<SubmitVoteResponse, SubmitVoteRequest>(
    `/governance/proposals/${proposalId}/vote`,
    payload,
  );
}

export function submitProposalDiscussion(proposalId: string, payload: SubmitDiscussionRequest) {
  return apiClient.post<SubmitDiscussionResponse, SubmitDiscussionRequest>(
    `/governance/proposals/${proposalId}/discuss`,
    payload,
  );
}
