import { apiClient } from "@/lib/api-client";
import type {
  EmailAuthResponse,
  WalletLinkResponse,
  WalletNonceResponse,
  WalletVerifyResponse,
} from "@/contracts/auth";

export function loginWithEmail(payload: { email: string; password: string }) {
  return apiClient.post<EmailAuthResponse, { email: string; password: string }>(
    "/api/auth/login",
    payload,
  );
}

export function registerWithEmail(payload: {
  email: string;
  password: string;
  displayName: string;
}) {
  return apiClient.post<EmailAuthResponse, { email: string; password: string; displayName: string }>(
    "/api/auth/register",
    payload,
  );
}

export function logoutAuthSession() {
  return apiClient.post<{ message: string }>("/api/auth/logout");
}

export function requestWalletNonce(payload: { address: string; chainId: number }) {
  return apiClient.post<WalletNonceResponse, { address: string; chainId: number }>(
    "/api/auth/wallet/nonce",
    payload,
  );
}

export function verifyWalletSession(payload: {
  message: string;
  signature: string;
  nonceToken: string;
}) {
  return apiClient.post<WalletVerifyResponse, { message: string; signature: string; nonceToken: string }>(
    "/api/auth/wallet/verify",
    payload,
  );
}

export function linkWalletToSession(payload: {
  message: string;
  signature: string;
  nonceToken: string;
}) {
  return apiClient.post<WalletLinkResponse, { message: string; signature: string; nonceToken: string }>(
    "/api/auth/link/wallet",
    payload,
  );
}
