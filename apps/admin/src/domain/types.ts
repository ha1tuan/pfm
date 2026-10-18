// Domain types for the admin console. Names follow GLOSSARY.md.
// Replaced by types from packages/api-client once the backend exists.

export type TransactionType = 'topUp' | 'withdrawal' | 'p2pTransfer' | 'bankTransfer';
export const TRANSACTION_TYPES: TransactionType[] = ['p2pTransfer', 'bankTransfer', 'topUp', 'withdrawal'];

export type TransactionStatus =
  | 'initiated'
  | 'pendingAuth'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'reversed';

/** Integer VND. */
export type Vnd = number;

export interface LedgerEntry {
  account: string;
  debit: Vnd;
  credit: Vnd;
}

export interface Transaction {
  id: string;
  createdAt: string; // ISO
  type: TransactionType;
  status: TransactionStatus;
  amount: Vnd;
  fee: Vnd;
  walletId: string;
  userName: string;
  counterparty: string;
  channel: string;
  ip: string;
  failureReason?: string;
  reversedById?: string;
  reversalOfId?: string;
  ledger: LedgerEntry[];
}

export type KycLevel = 1 | 2;

export type WalletStatus = 'active' | 'locked';

export interface LinkedBankAccount {
  id: string;
  bankName: string;
  bankShort: string;
  brandColor: 'vcb' | 'tcb' | 'mb' | 'acb' | 'vpb' | 'tpb';
  maskedNumber: string;
  isDefault: boolean;
}

export interface BoundDevice {
  model: string;
  os: string;
  boundAt: string;
}

export interface Wallet {
  id: string;
  userName: string;
  phone: string;
  email: string;
  kycLevel: KycLevel;
  status: WalletStatus;
  availableBalance: Vnd;
  heldBalance: Vnd;
  createdAt: string;
  lastLoginAt: string;
  device: BoundDevice;
  linkedBankAccounts: LinkedBankAccount[];
}

export type StaffRole = 'admin' | 'operations' | 'control';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
}

export type ConfigVersionStatus =
  | 'draft'
  | 'pendingApproval'
  | 'approved'
  | 'active'
  | 'superseded'
  | 'rejected';

interface ConfigVersionBase {
  id: string;
  version: number;
  status: ConfigVersionStatus;
  effectiveFrom: string; // ISO
  makerId: string;
  checkerId?: string;
  createdAt: string;
  note: string;
}

export type FeeKind = 'free' | 'fixed' | 'percent' | 'percentPlusFixed';

export interface FeeRule {
  transactionType: TransactionType;
  /** Inclusive lower bound of the amount band; 0 when the rule covers every amount. */
  minAmount: Vnd;
  /** Inclusive upper bound; null = no upper bound. */
  maxAmount: Vnd | null;
  kind: FeeKind;
  fixed: Vnd;
  /** Basis points: 20 = 0,2%. */
  percentBps: number;
  minFee: Vnd;
}

export interface FeeConfigVersion extends ConfigVersionBase {
  rules: FeeRule[];
}

export interface LimitRule {
  transactionType: TransactionType;
  perTransaction: Vnd;
  daily: Vnd;
  monthly: Vnd;
  dailyCount: number;
}

export interface LimitConfigVersion extends ConfigVersionBase {
  kycLevel: KycLevel;
  rules: LimitRule[];
}

export type AuditAction =
  | 'login'
  | 'view'
  | 'create'
  | 'approve'
  | 'reject'
  | 'lock'
  | 'unlock'
  | 'reverse'
  | 'kycApprove';

export interface AuditEntry {
  id: string;
  at: string;
  actorName: string;
  /** null = automated system job. */
  actorRole: StaffRole | null;
  action: AuditAction;
  target: string;
  change: string;
  ip: string;
}

export interface Page<T> {
  items: T[];
  total: number;
}
