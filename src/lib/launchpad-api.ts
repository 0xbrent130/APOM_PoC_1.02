import { apiClient } from "@/lib/api-client";
import type {
  ContributeToProjectRequest,
  ContributeToProjectResponse,
  LaunchpadOverview,
  LaunchpadProjectDetails,
} from "@/contracts";

export function getLaunchpadOverview() {
  return apiClient.get<LaunchpadOverview>("/launchpad/overview");
}

export function getLaunchpadProjectDetails(projectId: string) {
  return apiClient.get<LaunchpadProjectDetails>(`/launchpad/projects/${projectId}`);
}

export function contributeToProject(projectId: string, payload: ContributeToProjectRequest) {
  return apiClient.post<ContributeToProjectResponse, ContributeToProjectRequest>(
    `/launchpad/projects/${projectId}/contribute`,
    payload,
  );
}
