export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  id: string;
  role: string;
  expiresAt: string;
}

export interface AuthWallet {
  id: string;
  userId: string;
  address: string;
  chainId: number;
  isPrimary: boolean;
  linkedAt: string;
}

export interface EmailAuthResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface WalletVerifyResponse {
  user: AuthUser;
  session: AuthSession;
  wallet: AuthWallet;
}

export interface WalletLinkResponse {
  wallet: AuthWallet;
}

export interface WalletNonceResponse {
  address: string;
  chainId: number;
  nonce: string;
  nonceToken: string;
  expiresAt: string;
}
