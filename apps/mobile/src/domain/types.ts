// Domain types for the mobile app. Names follow GLOSSARY.md.
// Replaced by packages/api-client types once the backend exists.

/** Integer VND. */
export type Vnd = number;

export type TransactionType = 'topUp' | 'withdrawal' | 'p2pTransfer' | 'bankTransfer';

export type TransactionStatus =
  | 'initiated'
  | 'pendingAuth'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'reversed';

export type CategoryId =
  | 'food'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'fun'
  | 'saving'
  | 'transfer'
  | 'income'
  | 'topUp';

export interface Transaction {
  id: string;
  createdAt: string;
  type: TransactionType;
  status: TransactionStatus;
  /** Signed from the Wallet's point of view: money in > 0, money out < 0. */
  amount: Vnd;
  fee: Vnd;
  counterpartyName: string;
  counterpartyDetail: string;
  note?: string;
  categoryId: CategoryId;
}

/** User-typed income/expense. Never touches the Ledger or the Wallet balance. */
export interface ManualEntry {
  id: string;
  occurredAt: string;
  amount: Vnd;
  categoryId: CategoryId;
  note: string;
}

export type ActivityItem =
  | { kind: 'transaction'; at: string; item: Transaction }
  | { kind: 'manualEntry'; at: string; item: ManualEntry };

export interface Wallet {
  id: string;
  ownerName: string;
  phone: string;
  availableBalance: Vnd;
  heldBalance: Vnd;
}

export type BankBrand = 'vcb' | 'tcb' | 'mb' | 'acb' | 'vpb' | 'tpb' | 'bidv';

export interface Bank {
  code: BankBrand;
  name: string;
  short: string;
}

export interface LinkedBankAccount {
  id: string;
  bank: Bank;
  maskedNumber: string;
  holderName: string;
  isDefault: boolean;
}

export type Recipient =
  | { kind: 'wallet'; name: string; phone: string }
  | { kind: 'bank'; name: string; bank: Bank; accountNumber: string };

export interface TransferQuote {
  amount: Vnd;
  fee: Vnd;
  total: Vnd;
  remainingDailyLimit: Vnd;
}

export interface Budget {
  categoryId: CategoryId;
  limit: Vnd;
}

export interface Goal {
  id: string;
  name: string;
  icon: 'plane' | 'laptop' | 'home' | 'gift';
  target: Vnd;
  saved: Vnd;
}
