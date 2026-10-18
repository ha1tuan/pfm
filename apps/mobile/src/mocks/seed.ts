import type { Bank, Budget, Goal, LinkedBankAccount, ManualEntry, Transaction, Wallet } from '@/domain/types';

export const BANKS: Bank[] = [
  { code: 'vcb', name: 'Vietcombank', short: 'VCB' },
  { code: 'tcb', name: 'Techcombank', short: 'TCB' },
  { code: 'mb', name: 'MB Bank', short: 'MB' },
  { code: 'acb', name: 'ACB', short: 'ACB' },
  { code: 'vpb', name: 'VPBank', short: 'VPB' },
  { code: 'tpb', name: 'TPBank', short: 'TPB' },
  { code: 'bidv', name: 'BIDV', short: 'BIDV' },
];

const bank = (code: Bank['code']) => BANKS.find((b) => b.code === code)!;

export const WALLET: Wallet = {
  id: 'W-0912345678',
  ownerName: 'Nguyễn Minh Anh',
  phone: '0912345678',
  availableBalance: 12_450_000,
  // Held for the seeded bank transfer that is still processing.
  heldBalance: 1_200_000,
};

export const LINKED_BANKS: LinkedBankAccount[] = [
  { id: 'lb1', bank: bank('vcb'), maskedNumber: '•••• 4821', holderName: 'NGUYEN MINH ANH', isDefault: true },
  { id: 'lb2', bank: bank('tcb'), maskedNumber: '•••• 0937', holderName: 'NGUYEN MINH ANH', isDefault: false },
  { id: 'lb3', bank: bank('mb'), maskedNumber: '•••• 2210', holderName: 'NGUYEN MINH ANH', isDefault: false },
];

export interface Contact {
  name: string;
  kind: 'wallet' | 'bank';
  phone?: string;
  bank?: Bank;
  accountNumber?: string;
}

export const CONTACTS: Contact[] = [
  { name: 'Trần Quốc Bảo', kind: 'wallet', phone: '0903112233' },
  { name: 'Lê Hà Vy', kind: 'bank', bank: bank('mb'), accountNumber: '0801 2233 4455' },
  { name: 'Phạm Gia Huy', kind: 'bank', bank: bank('vcb'), accountNumber: '0071 0003 8812' },
  { name: 'Đỗ Khánh Linh', kind: 'wallet', phone: '0966554433' },
];

/** Account-number → holder-name lookups the mock bank directory answers. */
export const BANK_DIRECTORY: Record<string, string> = {
  '007100038812': 'PHAM GIA HUY',
  '080122334455': 'LE HA VY',
  '190355210937': 'TRAN QUOC BAO',
};

export const WALLET_DIRECTORY: Record<string, string> = {
  '0903112233': 'Trần Quốc Bảo',
  '0966554433': 'Đỗ Khánh Linh',
  '0909888123': 'Lê Hà Vy',
};

const ago = (days: number, hour: number, minute: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const TRANSACTIONS: Transaction[] = [
  { id: 'FT26288080311', createdAt: ago(0, 8, 20), type: 'p2pTransfer', status: 'succeeded', amount: -500_000, fee: 0, counterpartyName: 'Trần Quốc Bảo', counterpartyDetail: 'Ví PFM · 0903 ••• 233', note: 'Trả tiền vé concert', categoryId: 'fun' },
  { id: 'FT26287170245', createdAt: ago(1, 17, 2), type: 'p2pTransfer', status: 'succeeded', amount: 15_000_000, fee: 0, counterpartyName: 'Công ty TNHH Nắng Mới', counterpartyDetail: 'Ví PFM · 0287 ••• 900', note: 'Lương tháng 10', categoryId: 'income' },
  { id: 'FT26287081501', createdAt: ago(1, 8, 15), type: 'bankTransfer', status: 'processing', amount: -1_200_000, fee: 0, counterpartyName: 'Lê Hà Vy', counterpartyDetail: 'MB Bank · 0801 2233 4455', note: 'Tiền nhà tháng 10', categoryId: 'bills' },
  { id: 'FT26286213018', createdAt: ago(2, 21, 30), type: 'p2pTransfer', status: 'succeeded', amount: -389_000, fee: 0, counterpartyName: 'Đỗ Khánh Linh', counterpartyDetail: 'Ví PFM · 0966 ••• 433', note: 'Góp quà sinh nhật', categoryId: 'shopping' },
  { id: 'FT26286070002', createdAt: ago(2, 7, 0), type: 'bankTransfer', status: 'failed', amount: -260_000, fee: 0, counterpartyName: 'Phạm Gia Huy', counterpartyDetail: 'Vietcombank · 0071 0003 8812', categoryId: 'transfer' },
  { id: 'FT26285101233', createdAt: ago(3, 10, 12), type: 'withdrawal', status: 'succeeded', amount: -2_000_000, fee: 4_000, counterpartyName: 'Techcombank', counterpartyDetail: '•••• 0937', categoryId: 'transfer' },
  { id: 'FT26285090011', createdAt: ago(3, 9, 0), type: 'topUp', status: 'succeeded', amount: 2_000_000, fee: 0, counterpartyName: 'MB Bank', counterpartyDetail: '•••• 2210', categoryId: 'topUp' },
  { id: 'FT26283200417', createdAt: ago(5, 20, 4), type: 'bankTransfer', status: 'succeeded', amount: -712_000, fee: 0, counterpartyName: 'EVN Hà Nội', counterpartyDetail: 'BIDV · 1200 0045 7781', note: 'Tiền điện tháng 9', categoryId: 'bills' },
];

export const MANUAL_ENTRIES: ManualEntry[] = [
  { id: 'me1', occurredAt: ago(0, 9, 41), amount: -65_000, categoryId: 'food', note: 'Highlands Coffee' },
  { id: 'me2', occurredAt: ago(1, 12, 5), amount: -42_000, categoryId: 'transport', note: 'Grab đi làm' },
  { id: 'me3', occurredAt: ago(2, 19, 30), amount: -480_000, categoryId: 'food', note: 'Lẩu với nhóm bạn' },
  { id: 'me4', occurredAt: ago(4, 15, 0), amount: -591_000, categoryId: 'shopping', note: 'Áo khoác mua ở chợ' },
  { id: 'me5', occurredAt: ago(6, 8, 0), amount: -378_000, categoryId: 'transport', note: 'Đổ xăng' },
  { id: 'me6', occurredAt: ago(7, 21, 0), amount: -200_000, categoryId: 'fun', note: 'Vé xem phim' },
  { id: 'me7', occurredAt: ago(8, 12, 0), amount: -1_105_000, categoryId: 'food', note: 'Đi chợ cả tuần' },
];

export const BUDGETS: Budget[] = [
  { categoryId: 'food', limit: 2_000_000 },
  { categoryId: 'shopping', limit: 1_000_000 },
  { categoryId: 'bills', limit: 2_200_000 },
  { categoryId: 'transport', limit: 800_000 },
  { categoryId: 'fun', limit: 600_000 },
];

export const GOALS: Goal[] = [
  { id: 'g1', name: 'Đà Lạt mùa hoa', icon: 'plane', target: 5_000_000, saved: 3_600_000 },
  { id: 'g2', name: 'MacBook mới', icon: 'laptop', target: 30_000_000, saved: 8_000_000 },
];
