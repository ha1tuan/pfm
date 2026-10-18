import dayjs from 'dayjs';
import type {
  AuditEntry,
  FeeConfigVersion,
  LedgerEntry,
  LimitConfigVersion,
  LimitRule,
  Staff,
  Transaction,
  TransactionStatus,
  TransactionType,
  Wallet,
} from '@/domain/types';

export const STAFF: Staff[] = [
  { id: 's1', name: 'Phan Bảo Ngọc', role: 'admin' },
  { id: 's2', name: 'Lý Thành Đạt', role: 'operations' },
  { id: 's3', name: 'Trịnh Mai', role: 'control' },
];

/** The signed-in Staff for this mock session. */
export const CURRENT_STAFF = STAFF[0];

export const LEDGER_ACCOUNTS = {
  bankClearing: 'Tiền chờ xử lý với ngân hàng',
  feeRevenue: 'Doanh thu phí',
};

const walletAccount = (walletId: string) => `Ví ${walletId}`;

export const WALLETS: Wallet[] = [
  {
    id: 'W-0912345678',
    userName: 'Nguyễn Minh Anh',
    phone: '0912 345 678',
    email: 'minhanh.ng@gmail.com',
    kycLevel: 2,
    status: 'active',
    availableBalance: 12_450_000,
    heldBalance: 1_500_000,
    createdAt: '2025-03-02T08:10:00+07:00',
    lastLoginAt: dayjs().subtract(18, 'minute').toISOString(),
    device: { model: 'iPhone 15', os: 'iOS 18.2', boundAt: '2026-08-12T10:21:00+07:00' },
    linkedBankAccounts: [
      { id: 'b1', bankName: 'Vietcombank', bankShort: 'VCB', brandColor: 'vcb', maskedNumber: '•••• 4821', isDefault: true },
      { id: 'b2', bankName: 'Techcombank', bankShort: 'TCB', brandColor: 'tcb', maskedNumber: '•••• 0937', isDefault: false },
      { id: 'b3', bankName: 'MB Bank', bankShort: 'MB', brandColor: 'mb', maskedNumber: '•••• 2210', isDefault: false },
    ],
  },
  {
    id: 'W-0903112233',
    userName: 'Trần Quốc Bảo',
    phone: '0903 112 233',
    email: 'quocbao.tran@outlook.com',
    kycLevel: 2,
    status: 'active',
    availableBalance: 4_812_000,
    heldBalance: 0,
    createdAt: '2025-06-18T14:02:00+07:00',
    lastLoginAt: dayjs().subtract(2, 'hour').toISOString(),
    device: { model: 'Galaxy S24', os: 'Android 15', boundAt: '2026-01-04T09:00:00+07:00' },
    linkedBankAccounts: [
      { id: 'b4', bankName: 'Techcombank', bankShort: 'TCB', brandColor: 'tcb', maskedNumber: '•••• 5521', isDefault: true },
    ],
  },
  {
    id: 'W-0988776655',
    userName: 'Lê Hà Vy',
    phone: '0988 776 655',
    email: 'havy.le@gmail.com',
    kycLevel: 1,
    status: 'active',
    availableBalance: 860_000,
    heldBalance: 0,
    createdAt: '2026-09-21T19:44:00+07:00',
    lastLoginAt: dayjs().subtract(1, 'day').toISOString(),
    device: { model: 'iPhone 13', os: 'iOS 17.6', boundAt: '2026-09-21T19:45:00+07:00' },
    linkedBankAccounts: [
      { id: 'b5', bankName: 'MB Bank', bankShort: 'MB', brandColor: 'mb', maskedNumber: '•••• 4455', isDefault: true },
    ],
  },
  {
    id: 'W-0966554433',
    userName: 'Đỗ Khánh Linh',
    phone: '0966 554 433',
    email: 'khanhlinh.do@yahoo.com',
    kycLevel: 2,
    status: 'locked',
    availableBalance: 23_100_000,
    heldBalance: 0,
    createdAt: '2024-11-30T07:30:00+07:00',
    lastLoginAt: dayjs().subtract(3, 'hour').toISOString(),
    device: { model: 'Pixel 9', os: 'Android 15', boundAt: '2026-10-10T22:13:00+07:00' },
    linkedBankAccounts: [
      { id: 'b6', bankName: 'ACB', bankShort: 'ACB', brandColor: 'acb', maskedNumber: '•••• 6601', isDefault: true },
      { id: 'b7', bankName: 'VPBank', bankShort: 'VPB', brandColor: 'vpb', maskedNumber: '•••• 1180', isDefault: false },
    ],
  },
  {
    id: 'W-0944332211',
    userName: 'Vũ Thanh Tâm',
    phone: '0944 332 211',
    email: 'thanhtam.vu@gmail.com',
    kycLevel: 1,
    status: 'active',
    availableBalance: 1_250_000,
    heldBalance: 0,
    createdAt: '2026-02-14T11:11:00+07:00',
    lastLoginAt: dayjs().subtract(40, 'minute').toISOString(),
    device: { model: 'Redmi Note 13', os: 'Android 14', boundAt: '2026-02-14T11:12:00+07:00' },
    linkedBankAccounts: [
      { id: 'b8', bankName: 'TPBank', bankShort: 'TPB', brandColor: 'tpb', maskedNumber: '•••• 7712', isDefault: true },
    ],
  },
];

const COUNTERPARTIES: Record<TransactionType, string[]> = {
  p2pTransfer: ['Ví 0909 888 123', 'Ví 0933 221 100', 'Ví 0977 001 122', 'Ví 0912 345 678'],
  bankTransfer: ['Vietcombank •••• 8812', 'ACB •••• 6688', 'BIDV •••• 3301', 'Techcombank •••• 0937'],
  topUp: ['Vietcombank •••• 4821', 'Techcombank •••• 5521', 'MB Bank •••• 4455'],
  withdrawal: ['Vietcombank •••• 4821', 'ACB •••• 6601', 'TPBank •••• 7712'],
};

const AMOUNTS = [50_000, 120_000, 250_000, 389_000, 500_000, 712_000, 1_000_000, 1_500_000, 2_000_000, 3_200_000, 5_000_000, 12_000_000];
const TYPES: TransactionType[] = ['p2pTransfer', 'p2pTransfer', 'bankTransfer', 'topUp', 'p2pTransfer', 'withdrawal', 'bankTransfer', 'topUp'];
const STATUSES: TransactionStatus[] = ['succeeded', 'succeeded', 'succeeded', 'processing', 'succeeded', 'failed', 'succeeded', 'pendingAuth', 'succeeded', 'succeeded'];
const FAILURE_REASONS = ['Từ chối: vượt hạn mức ngày', 'Ngân hàng nhận từ chối: sai số tài khoản', 'Hết thời gian xác thực Smart OTP'];
const CHANNELS = ['Mobile app · iOS 18.2', 'Mobile app · Android 15', 'Mobile app · iOS 17.6'];

export function feeFor(type: TransactionType, amount: number): number {
  if (type === 'withdrawal') return Math.max(3_300, Math.round(amount * 0.002));
  if (type === 'bankTransfer' && amount > 10_000_000) return 5_500;
  return 0;
}

export function ledgerFor(t: Pick<Transaction, 'type' | 'status' | 'amount' | 'fee' | 'walletId'>): LedgerEntry[] {
  if (t.status === 'failed' || t.status === 'initiated' || t.status === 'pendingAuth') return [];
  const wallet = walletAccount(t.walletId);
  if (t.type === 'topUp') {
    return [
      { account: LEDGER_ACCOUNTS.bankClearing, debit: t.amount, credit: 0 },
      { account: wallet, debit: 0, credit: t.amount },
    ];
  }
  const destination =
    t.type === 'p2pTransfer' ? 'Ví người nhận' : LEDGER_ACCOUNTS.bankClearing;
  const entries: LedgerEntry[] = [
    { account: wallet, debit: t.amount + t.fee, credit: 0 },
    { account: destination, debit: 0, credit: t.amount },
  ];
  if (t.fee > 0) entries.push({ account: LEDGER_ACCOUNTS.feeRevenue, debit: 0, credit: t.fee });
  return entries;
}

function buildTransactions(): Transaction[] {
  const now = dayjs();
  const list: Transaction[] = [];
  for (let i = 0; i < 64; i++) {
    const wallet = WALLETS[i % WALLETS.length];
    const type = TYPES[i % TYPES.length];
    const status = STATUSES[(i * 7) % STATUSES.length];
    const amount = AMOUNTS[(i * 5) % AMOUNTS.length];
    const fee = feeFor(type, amount);
    const createdAt = now.subtract(i * 47 + (i % 3) * 13, 'minute').toISOString();
    const base = { type, status, amount, fee, walletId: wallet.id };
    list.push({
      id: `TXN-${(0x8f3a2c - i * 3).toString(16).toUpperCase()}`,
      createdAt,
      ...base,
      userName: wallet.userName,
      counterparty: COUNTERPARTIES[type][i % COUNTERPARTIES[type].length],
      channel: CHANNELS[i % CHANNELS.length],
      ip: `113.161.72.${10 + (i % 80)}`,
      failureReason: status === 'failed' ? FAILURE_REASONS[i % FAILURE_REASONS.length] : undefined,
      ledger: ledgerFor(base),
    });
  }
  return list;
}

export const TRANSACTIONS = buildTransactions();

const DAY = (offset: number) => dayjs().startOf('day').add(offset, 'day').toISOString();

const baseFeeRules: FeeConfigVersion['rules'] = [
  { transactionType: 'p2pTransfer', minAmount: 0, maxAmount: null, kind: 'free', fixed: 0, percentBps: 0, minFee: 0 },
  { transactionType: 'bankTransfer', minAmount: 0, maxAmount: 10_000_000, kind: 'free', fixed: 0, percentBps: 0, minFee: 0 },
  { transactionType: 'bankTransfer', minAmount: 10_000_001, maxAmount: null, kind: 'fixed', fixed: 5_500, percentBps: 0, minFee: 0 },
  { transactionType: 'withdrawal', minAmount: 0, maxAmount: null, kind: 'percent', fixed: 0, percentBps: 20, minFee: 3_300 },
  { transactionType: 'topUp', minAmount: 0, maxAmount: null, kind: 'free', fixed: 0, percentBps: 0, minFee: 0 },
];

export const FEE_VERSIONS: FeeConfigVersion[] = [
  {
    id: 'fee-v5',
    version: 5,
    status: 'superseded',
    effectiveFrom: DAY(-120),
    makerId: 's2',
    checkerId: 's1',
    createdAt: DAY(-122),
    note: 'Phí rút 0,15%, tối thiểu 3.300 ₫',
    rules: baseFeeRules.map((r) => (r.transactionType === 'withdrawal' ? { ...r, percentBps: 15 } : r)),
  },
  {
    id: 'fee-v6',
    version: 6,
    status: 'active',
    effectiveFrom: DAY(-14),
    makerId: 's1',
    checkerId: 's3',
    createdAt: DAY(-16),
    note: 'Tăng phí rút lên 0,2% theo biểu phí ngân hàng đối tác',
    rules: baseFeeRules,
  },
  {
    id: 'fee-v7',
    version: 7,
    status: 'pendingApproval',
    effectiveFrom: DAY(3),
    makerId: 's3',
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    note: 'Miễn phí chuyển ra ngân hàng đến 20tr cho chương trình Q4',
    rules: [
      baseFeeRules[0],
      { ...baseFeeRules[1], maxAmount: 20_000_000 },
      { ...baseFeeRules[2], minAmount: 20_000_001 },
      baseFeeRules[3],
      baseFeeRules[4],
    ],
  },
];

const limitRules = (level: 1 | 2): LimitRule[] => {
  const k = level === 1 ? 1 : 10;
  return [
    { transactionType: 'p2pTransfer', perTransaction: 5_000_000 * k, daily: 20_000_000 * (level === 1 ? 1 : 5), monthly: 100_000_000 * (level === 1 ? 1 : 5), dailyCount: 50 },
    { transactionType: 'bankTransfer', perTransaction: 5_000_000 * k, daily: 20_000_000 * (level === 1 ? 1 : 5), monthly: 100_000_000 * (level === 1 ? 1 : 5), dailyCount: 30 },
    { transactionType: 'withdrawal', perTransaction: 2_000_000 * k, daily: 10_000_000 * (level === 1 ? 1 : 5), monthly: 50_000_000 * (level === 1 ? 1 : 5), dailyCount: 10 },
    { transactionType: 'topUp', perTransaction: 10_000_000 * k, daily: 50_000_000 * (level === 1 ? 1 : 4), monthly: 200_000_000 * (level === 1 ? 1 : 5), dailyCount: 20 },
  ];
};

export const LIMIT_VERSIONS: LimitConfigVersion[] = [
  { id: 'lim-1-v3', version: 3, kycLevel: 1, status: 'active', effectiveFrom: DAY(-60), makerId: 's2', checkerId: 's1', createdAt: DAY(-62), note: 'Hạn mức mặc định cho tài khoản chưa eKYC đầy đủ', rules: limitRules(1) },
  { id: 'lim-2-v4', version: 4, kycLevel: 2, status: 'superseded', effectiveFrom: DAY(-90), makerId: 's2', checkerId: 's3', createdAt: DAY(-92), note: 'Khởi tạo hạn mức eKYC cấp 2', rules: limitRules(2).map((r) => ({ ...r, daily: Math.round(r.daily * 0.8) })) },
  { id: 'lim-2-v5', version: 5, kycLevel: 2, status: 'active', effectiveFrom: DAY(-30), makerId: 's3', checkerId: 's1', createdAt: DAY(-31), note: 'Nâng hạn mức ngày lên 100tr cho chuyển tiền', rules: limitRules(2) },
  {
    id: 'lim-2-v6',
    version: 6,
    kycLevel: 2,
    status: 'pendingApproval',
    effectiveFrom: DAY(2),
    makerId: 's1',
    createdAt: dayjs().subtract(35, 'minute').toISOString(),
    note: 'Tăng số GD rút tối đa/ngày lên 15',
    rules: limitRules(2).map((r) => (r.transactionType === 'withdrawal' ? { ...r, dailyCount: 15 } : r)),
  },
];

const ago = (minutes: number) => dayjs().subtract(minutes, 'minute').toISOString();

export const AUDIT: AuditEntry[] = [
  { id: 'a1', at: ago(35), actorName: 'Phan Bảo Ngọc', actorRole: 'admin', action: 'create', target: 'limit/kyc-2/v6', change: 'withdrawal.dailyCount: 10 → 15', ip: '10.0.4.21' },
  { id: 'a2', at: ago(120), actorName: 'Trịnh Mai', actorRole: 'control', action: 'create', target: 'fee/v7', change: 'bankTransfer free ≤ 10tr → ≤ 20tr', ip: '10.0.5.12' },
  { id: 'a3', at: ago(170), actorName: 'Phan Bảo Ngọc', actorRole: 'admin', action: 'lock', target: 'wallet/W-0966554433', change: 'reason: nghi gian lận', ip: '10.0.4.21' },
  { id: 'a4', at: ago(190), actorName: 'Phan Bảo Ngọc', actorRole: 'admin', action: 'view', target: 'wallet/W-0966554433', change: '—', ip: '10.0.4.21' },
  { id: 'a5', at: ago(260), actorName: 'Lý Thành Đạt', actorRole: 'operations', action: 'reverse', target: 'txn/TXN-8F3A0F', change: 'reversal: TXN-R-8F3A0F', ip: '10.0.4.37' },
  { id: 'a6', at: ago(300), actorName: 'Hệ thống', actorRole: null, action: 'create', target: 'report/daily', change: '—', ip: '127.0.0.1' },
  { id: 'a7', at: ago(330), actorName: 'Trịnh Mai', actorRole: 'control', action: 'kycApprove', target: 'user/0988776655', change: 'kyc: 0 → 1', ip: '10.0.5.12' },
  { id: 'a8', at: ago(380), actorName: 'Lý Thành Đạt', actorRole: 'operations', action: 'login', target: 'session', change: '2FA OK', ip: '10.0.4.37' },
  { id: 'a9', at: ago(1440 * 14 + 30), actorName: 'Trịnh Mai', actorRole: 'control', action: 'approve', target: 'fee/v6', change: 'pendingApproval → approved', ip: '10.0.5.12' },
  { id: 'a10', at: ago(1440 * 30 + 10), actorName: 'Phan Bảo Ngọc', actorRole: 'admin', action: 'approve', target: 'limit/kyc-2/v5', change: 'pendingApproval → approved', ip: '10.0.4.21' },
];
