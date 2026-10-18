// In-memory stand-in for the backend. Each function mirrors an endpoint the real
// API will expose; swapping to packages/api-client only touches src/api/*.
import dayjs from 'dayjs';
import type {
  AuditAction,
  AuditEntry,
  FeeConfigVersion,
  FeeRule,
  KycLevel,
  LimitConfigVersion,
  LimitRule,
  Page,
  Transaction,
  TransactionStatus,
  TransactionType,
  Wallet,
} from '@/domain/types';
import {
  AUDIT,
  CURRENT_STAFF,
  FEE_VERSIONS,
  LIMIT_VERSIONS,
  STAFF,
  TRANSACTIONS,
  WALLETS,
} from './seed';

const db = {
  transactions: [...TRANSACTIONS],
  wallets: WALLETS.map((w) => ({ ...w })),
  feeVersions: [...FEE_VERSIONS],
  limitVersions: [...LIMIT_VERSIONS],
  audit: [...AUDIT],
};

const latency = () => new Promise((r) => setTimeout(r, 180 + Math.random() * 220));

export class MockApiError extends Error {}

function audit(action: AuditAction, target: string, change: string) {
  const entry: AuditEntry = {
    id: `a${Date.now()}`,
    at: new Date().toISOString(),
    actorName: CURRENT_STAFF.name,
    actorRole: CURRENT_STAFF.role,
    action,
    target,
    change,
    ip: '10.0.4.21',
  };
  db.audit.unshift(entry);
}

export const staffName = (id?: string) => STAFF.find((s) => s.id === id)?.name ?? '—';
export const currentStaff = () => CURRENT_STAFF;

// ---------- Transactions ----------

export interface TransactionQuery {
  status?: TransactionStatus;
  type?: TransactionType;
  keyword?: string;
  from?: string;
  to?: string;
  minAmount?: number;
  walletId?: string;
  page: number;
  pageSize: number;
}

export async function listTransactions(q: TransactionQuery): Promise<Page<Transaction>> {
  await latency();
  const kw = q.keyword?.trim().toLowerCase();
  const filtered = db.transactions.filter(
    (t) =>
      (!q.status || t.status === q.status) &&
      (!q.type || t.type === q.type) &&
      (!q.walletId || t.walletId === q.walletId) &&
      (!q.minAmount || t.amount >= q.minAmount) &&
      (!q.from || dayjs(t.createdAt).isAfter(dayjs(q.from))) &&
      (!q.to || dayjs(t.createdAt).isBefore(dayjs(q.to))) &&
      (!kw || [t.id, t.walletId, t.userName, t.counterparty].some((v) => v.toLowerCase().includes(kw))),
  );
  const start = (q.page - 1) * q.pageSize;
  return { items: filtered.slice(start, start + q.pageSize), total: filtered.length };
}

export async function getTransaction(id: string): Promise<Transaction> {
  await latency();
  const tx = db.transactions.find((t) => t.id === id);
  if (!tx) throw new MockApiError(`Transaction ${id} not found`);
  return tx;
}

export async function reverseTransaction(id: string, reason: string): Promise<Transaction> {
  await latency();
  const original = db.transactions.find((t) => t.id === id);
  if (!original || original.status !== 'succeeded' || original.reversedById) {
    throw new MockApiError('Only an unreversed succeeded transaction can be reversed');
  }
  const reversal: Transaction = {
    ...original,
    id: `TXN-R-${original.id.slice(4)}`,
    createdAt: new Date().toISOString(),
    status: 'succeeded',
    reversalOfId: original.id,
    channel: 'Admin console',
    ip: '10.0.4.21',
    ledger: original.ledger.map((e) => ({ account: e.account, debit: e.credit, credit: e.debit })),
  };
  original.status = 'reversed';
  original.reversedById = reversal.id;
  db.transactions.unshift(reversal);
  audit('reverse', `txn/${original.id}`, `reason: ${reason}`);
  return reversal;
}

// ---------- Dashboard ----------

export type DashboardRange = '7d' | '30d' | '90d';

export interface DashboardData {
  volumeToday: number;
  volumeDeltaPct: number;
  countToday: number;
  countDeltaPct: number;
  activeWallets: number;
  activeWalletsDeltaPct: number;
  failureRatePct: number;
  failureRateDeltaPct: number;
  series: { label: string; value: number }[];
  mix: { type: TransactionType; pct: number }[];
  feeRevenueToday: number;
  latest: Transaction[];
}

export async function getDashboard(range: DashboardRange): Promise<DashboardData> {
  await latency();
  const points = range === '7d' ? 7 : range === '30d' ? 10 : 12;
  const stepDays = range === '7d' ? 1 : range === '30d' ? 3 : 7;
  const series = Array.from({ length: points }, (_, i) => {
    const day = dayjs().subtract((points - 1 - i) * stepDays, 'day');
    const wave = Math.sin(i * 1.3) * 140 + i * 38;
    return { label: day.format('DD/MM'), value: Math.round(820 + wave) };
  });
  return {
    volumeToday: 1_280_000_000,
    volumeDeltaPct: 12.4,
    countToday: 18_452,
    countDeltaPct: 8.1,
    activeWallets: 42_310,
    activeWalletsDeltaPct: 3.6,
    failureRatePct: 0.82,
    failureRateDeltaPct: 0.2,
    series,
    mix: [
      { type: 'p2pTransfer', pct: 46 },
      { type: 'bankTransfer', pct: 28 },
      { type: 'topUp', pct: 18 },
      { type: 'withdrawal', pct: 8 },
    ],
    feeRevenueToday: 18_420_000,
    latest: db.transactions.slice(0, 6),
  };
}

// ---------- Wallets ----------

const normalize = (s: string) => s.replace(/\s|-/g, '').toLowerCase();

export async function findWallet(query: string): Promise<Wallet | null> {
  await latency();
  const q = normalize(query);
  return db.wallets.find((w) => normalize(w.id) === q || normalize(w.phone) === q || normalize(w.id).endsWith(q)) ?? null;
}

export async function getWallet(id: string): Promise<Wallet> {
  await latency();
  const wallet = db.wallets.find((w) => w.id === id);
  if (!wallet) throw new MockApiError(`Wallet ${id} not found`);
  audit('view', `wallet/${id}`, '—');
  return wallet;
}

export async function listRecentWallets(): Promise<Wallet[]> {
  await latency();
  return db.wallets;
}

export async function setWalletLock(id: string, locked: boolean, reason: string): Promise<Wallet> {
  await latency();
  const wallet = db.wallets.find((w) => w.id === id);
  if (!wallet) throw new MockApiError(`Wallet ${id} not found`);
  wallet.status = locked ? 'locked' : 'active';
  audit(locked ? 'lock' : 'unlock', `wallet/${id}`, `reason: ${reason}`);
  return wallet;
}

export interface LimitUsage {
  transactionType: TransactionType;
  used: number;
  limit: number;
}

export async function getLimitUsageToday(walletId: string): Promise<LimitUsage[]> {
  await latency();
  const wallet = db.wallets.find((w) => w.id === walletId);
  const active = db.limitVersions.find((v) => v.kycLevel === wallet?.kycLevel && v.status === 'active');
  const startOfDay = dayjs().startOf('day');
  return (active?.rules ?? []).map((rule) => ({
    transactionType: rule.transactionType,
    limit: rule.daily,
    used: db.transactions
      .filter(
        (t) =>
          t.walletId === walletId &&
          t.type === rule.transactionType &&
          (t.status === 'succeeded' || t.status === 'processing') &&
          dayjs(t.createdAt).isAfter(startOfDay),
      )
      .reduce((sum, t) => sum + t.amount, 0),
  }));
}

// ---------- Config versions (maker–checker) ----------

type AnyVersion = FeeConfigVersion | LimitConfigVersion;

function decide<T extends AnyVersion>(list: T[], id: string, approve: boolean, target: string): T {
  const version = list.find((v) => v.id === id);
  if (!version || version.status !== 'pendingApproval') throw new MockApiError('Version is not pending approval');
  if (version.makerId === CURRENT_STAFF.id) throw new MockApiError('Maker cannot approve their own version');
  version.checkerId = CURRENT_STAFF.id;
  version.status = approve ? 'approved' : 'rejected';
  audit(approve ? 'approve' : 'reject', `${target}/v${version.version}`, `pendingApproval → ${version.status}`);
  return version;
}

export async function listFeeVersions(): Promise<FeeConfigVersion[]> {
  await latency();
  return [...db.feeVersions].sort((a, b) => b.version - a.version);
}

export async function createFeeVersion(input: { rules: FeeRule[]; effectiveFrom: string; note: string }): Promise<FeeConfigVersion> {
  await latency();
  const version = Math.max(...db.feeVersions.map((v) => v.version)) + 1;
  const created: FeeConfigVersion = {
    id: `fee-v${version}`,
    version,
    status: 'pendingApproval',
    makerId: CURRENT_STAFF.id,
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.feeVersions.push(created);
  audit('create', `fee/v${version}`, input.note);
  return created;
}

export async function decideFeeVersion(id: string, approve: boolean) {
  await latency();
  return decide(db.feeVersions, id, approve, 'fee');
}

export async function listLimitVersions(kycLevel: KycLevel): Promise<LimitConfigVersion[]> {
  await latency();
  return db.limitVersions.filter((v) => v.kycLevel === kycLevel).sort((a, b) => b.version - a.version);
}

export async function createLimitVersion(input: {
  kycLevel: KycLevel;
  rules: LimitRule[];
  effectiveFrom: string;
  note: string;
}): Promise<LimitConfigVersion> {
  await latency();
  const sameLevel = db.limitVersions.filter((v) => v.kycLevel === input.kycLevel);
  const version = Math.max(...sameLevel.map((v) => v.version)) + 1;
  const created: LimitConfigVersion = {
    id: `lim-${input.kycLevel}-v${version}`,
    version,
    status: 'pendingApproval',
    makerId: CURRENT_STAFF.id,
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.limitVersions.push(created);
  audit('create', `limit/kyc-${input.kycLevel}/v${version}`, input.note);
  return created;
}

export async function decideLimitVersion(id: string, approve: boolean) {
  await latency();
  const version = db.limitVersions.find((v) => v.id === id);
  return decide(db.limitVersions, id, approve, `limit/kyc-${version?.kycLevel}`);
}

// ---------- Audit ----------

export interface AuditQuery {
  keyword?: string;
  action?: AuditAction;
  role?: AuditEntry['actorRole'] | 'system';
  page: number;
  pageSize: number;
}

export async function listAudit(q: AuditQuery): Promise<Page<AuditEntry>> {
  await latency();
  const kw = q.keyword?.trim().toLowerCase();
  const filtered = db.audit.filter(
    (e) =>
      (!q.action || e.action === q.action) &&
      (!q.role || (q.role === 'system' ? e.actorRole === null : e.actorRole === q.role)) &&
      (!kw || [e.actorName, e.target, e.change].some((v) => v.toLowerCase().includes(kw))),
  );
  const start = (q.page - 1) * q.pageSize;
  return { items: filtered.slice(start, start + q.pageSize), total: filtered.length };
}
