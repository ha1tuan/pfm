// In-memory stand-in for the backend. Each function mirrors an endpoint;
// swapping to packages/api-client only touches src/api/*.
import type {
  ActivityItem,
  Bank,
  CategoryId,
  LinkedBankAccount,
  ManualEntry,
  Recipient,
  Transaction,
  TransactionType,
  TransferQuote,
  Vnd,
} from '@/domain/types';
import {
  BANK_DIRECTORY,
  BANKS,
  BUDGETS,
  CONTACTS,
  GOALS,
  LINKED_BANKS,
  MANUAL_ENTRIES,
  TRANSACTIONS,
  WALLET,
  WALLET_DIRECTORY,
} from './seed';
import { maskPhone } from '@/lib/format';

export class ApiError extends Error {
  constructor(public code: 'wrongPassword' | 'overBalance' | 'overLimit' | 'notFound' | 'walletLocked') {
    super(code);
  }
}

const db = {
  wallet: { ...WALLET },
  transactions: [...TRANSACTIONS],
  manualEntries: [...MANUAL_ENTRIES],
  linkedBanks: [...LINKED_BANKS],
  budgets: [...BUDGETS],
  goals: [...GOALS],
  /** idempotency key → transaction id */
  idempotency: new Map<string, string>(),
  dailyLimit: 50_000_000,
};

const latency = (ms = 350) => new Promise((r) => setTimeout(r, ms + Math.random() * 200));

/** Called whenever money-moving state changes so UI caches can refresh. */
let onChange: () => void = () => {};
export const setChangeListener = (fn: () => void) => {
  onChange = fn;
};

const newRef = () => `FT${Date.now().toString().slice(-11)}`;

// ---------- Auth ----------

export async function login(phone: string, password: string) {
  await latency(600);
  if (password.length < 6) throw new ApiError('wrongPassword');
  return { accessToken: `mock.${phone}.${Date.now()}` };
}

// ---------- Wallet & activity ----------

export async function getWallet() {
  await latency(200);
  return { ...db.wallet };
}

export async function listActivity(): Promise<ActivityItem[]> {
  await latency();
  const items: ActivityItem[] = [
    ...db.transactions.map((item) => ({ kind: 'transaction' as const, at: item.createdAt, item })),
    ...db.manualEntries.map((item) => ({ kind: 'manualEntry' as const, at: item.occurredAt, item })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

export async function getTransaction(id: string) {
  await latency(200);
  const tx = db.transactions.find((t) => t.id === id);
  if (!tx) throw new ApiError('notFound');
  return tx;
}

export async function getManualEntry(id: string) {
  await latency(200);
  const entry = db.manualEntries.find((e) => e.id === id);
  if (!entry) throw new ApiError('notFound');
  return entry;
}

export async function setCategory(kind: ActivityItem['kind'], id: string, categoryId: CategoryId) {
  await latency(250);
  const list: { id: string; categoryId: CategoryId }[] = kind === 'transaction' ? db.transactions : db.manualEntries;
  const target = list.find((x) => x.id === id);
  if (target) target.categoryId = categoryId;
  onChange();
}

export async function addManualEntry(input: Omit<ManualEntry, 'id'>) {
  await latency(250);
  const entry = { ...input, id: `me${Date.now()}` };
  db.manualEntries.push(entry);
  onChange();
  return entry;
}

// ---------- Banks ----------

export const listBankCatalog = async (): Promise<Bank[]> => BANKS;

export async function listLinkedBanks() {
  await latency(250);
  return [...db.linkedBanks];
}

export async function linkBank(input: { bank: Bank; accountNumber: string; holderName: string; bankOtp: string }) {
  await latency(700);
  const digits = input.accountNumber.replace(/\D/g, '');
  const linked: LinkedBankAccount = {
    id: `lb${Date.now()}`,
    bank: input.bank,
    maskedNumber: `•••• ${digits.slice(-4)}`,
    holderName: input.holderName.toUpperCase(),
    isDefault: db.linkedBanks.length === 0,
  };
  db.linkedBanks.push(linked);
  onChange();
  return linked;
}

// ---------- Transfers ----------

export const listContacts = async () => CONTACTS;

export async function lookupWallet(phone: string) {
  await latency(400);
  const name = WALLET_DIRECTORY[phone.replace(/\D/g, '')];
  if (!name) throw new ApiError('notFound');
  return name;
}

export async function lookupBankAccount(accountNumber: string) {
  await latency(500);
  return BANK_DIRECTORY[accountNumber.replace(/\D/g, '')] ?? 'NGUYEN VAN A';
}

function feeFor(type: TransactionType, amount: Vnd): Vnd {
  if (type === 'withdrawal') return Math.max(3_300, Math.round(amount * 0.002));
  if (type === 'bankTransfer' && amount > 10_000_000) return 5_500;
  return 0;
}

function usedToday(): Vnd {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return db.transactions
    .filter((t) => t.amount < 0 && t.status !== 'failed' && new Date(t.createdAt) >= start)
    .reduce((sum, t) => sum - t.amount, 0);
}

export async function quoteTransfer(recipient: Recipient, amount: Vnd): Promise<TransferQuote> {
  await latency(250);
  const fee = feeFor(recipient.kind === 'wallet' ? 'p2pTransfer' : 'bankTransfer', amount);
  return { amount, fee, total: amount + fee, remainingDailyLimit: Math.max(0, db.dailyLimit - usedToday()) };
}

export async function getRemainingDailyLimit() {
  await latency(150);
  return Math.max(0, db.dailyLimit - usedToday());
}

interface MoneyCommand {
  idempotencyKey: string;
  smartOtp: string;
}

function debit(total: Vnd) {
  if (total > db.wallet.availableBalance) throw new ApiError('overBalance');
  if (total > db.dailyLimit - usedToday()) throw new ApiError('overLimit');
  db.wallet.availableBalance -= total;
}

/** Bank-facing transactions settle later, like a real provider callback. */
function settleLater(tx: Transaction, outcome: 'succeeded' | 'failed' = 'succeeded') {
  setTimeout(() => {
    tx.status = outcome;
    if (tx.amount < 0) db.wallet.heldBalance -= -tx.amount + tx.fee;
    if (outcome === 'failed' && tx.amount < 0) db.wallet.availableBalance += -tx.amount + tx.fee;
    if (outcome === 'succeeded' && tx.amount > 0) db.wallet.availableBalance += tx.amount;
    onChange();
  }, 4000);
}

function replay(key: string) {
  const id = db.idempotency.get(key);
  return id ? db.transactions.find((t) => t.id === id) : undefined;
}

export async function submitTransfer(cmd: MoneyCommand & { recipient: Recipient; amount: Vnd; note: string }) {
  await latency(900);
  const existing = replay(cmd.idempotencyKey);
  if (existing) return existing;

  const { recipient } = cmd;
  const type: TransactionType = recipient.kind === 'wallet' ? 'p2pTransfer' : 'bankTransfer';
  const fee = feeFor(type, cmd.amount);
  debit(cmd.amount + fee);

  const tx: Transaction = {
    id: newRef(),
    createdAt: new Date().toISOString(),
    type,
    status: type === 'p2pTransfer' ? 'succeeded' : 'processing',
    amount: -cmd.amount,
    fee,
    counterpartyName: recipient.name,
    counterpartyDetail:
      recipient.kind === 'wallet' ? `Ví PFM · ${maskPhone(recipient.phone)}` : `${recipient.bank.name} · ${recipient.accountNumber}`,
    note: cmd.note || undefined,
    categoryId: 'transfer',
  };
  db.transactions.push(tx);
  db.idempotency.set(cmd.idempotencyKey, tx.id);
  if (tx.status === 'processing') {
    db.wallet.heldBalance += cmd.amount + fee;
    settleLater(tx);
  }
  onChange();
  return tx;
}

export async function submitTopUp(cmd: MoneyCommand & { bankAccount: LinkedBankAccount; amount: Vnd }) {
  await latency(900);
  const existing = replay(cmd.idempotencyKey);
  if (existing) return existing;
  const tx: Transaction = {
    id: newRef(),
    createdAt: new Date().toISOString(),
    type: 'topUp',
    status: 'succeeded',
    amount: cmd.amount,
    fee: 0,
    counterpartyName: cmd.bankAccount.bank.name,
    counterpartyDetail: cmd.bankAccount.maskedNumber,
    categoryId: 'topUp',
  };
  db.wallet.availableBalance += cmd.amount;
  db.transactions.push(tx);
  db.idempotency.set(cmd.idempotencyKey, tx.id);
  onChange();
  return tx;
}

export async function submitWithdrawal(cmd: MoneyCommand & { bankAccount: LinkedBankAccount; amount: Vnd }) {
  await latency(900);
  const existing = replay(cmd.idempotencyKey);
  if (existing) return existing;
  const fee = feeFor('withdrawal', cmd.amount);
  debit(cmd.amount + fee);
  const tx: Transaction = {
    id: newRef(),
    createdAt: new Date().toISOString(),
    type: 'withdrawal',
    status: 'processing',
    amount: -cmd.amount,
    fee,
    counterpartyName: cmd.bankAccount.bank.name,
    counterpartyDetail: cmd.bankAccount.maskedNumber,
    categoryId: 'transfer',
  };
  db.wallet.heldBalance += cmd.amount + fee;
  db.transactions.push(tx);
  db.idempotency.set(cmd.idempotencyKey, tx.id);
  settleLater(tx);
  onChange();
  return tx;
}

export const quoteWithdrawalFee = (amount: Vnd) => feeFor('withdrawal', amount);

// ---------- Personal finance ----------

export async function getBudgets() {
  await latency(200);
  return [...db.budgets];
}

export async function getGoals() {
  await latency(200);
  return [...db.goals];
}
