// TanStack Query hooks: the only door from UI to data. Today they call the mock
// server; later their bodies switch to packages/api-client with the same signatures.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeeRule, KycLevel, LimitRule } from '@/domain/types';
import * as api from '@/mocks/server';

export type { AuditQuery, DashboardRange, TransactionQuery } from '@/mocks/server';
export const staffName = api.staffName;
export const currentStaff = api.currentStaff;

export const queryKeys = {
  dashboard: (range: api.DashboardRange) => ['dashboard', range] as const,
  transactions: (q: api.TransactionQuery) => ['transactions', q] as const,
  transaction: (id: string) => ['transaction', id] as const,
  wallet: (id: string) => ['wallet', id] as const,
  walletUsage: (id: string) => ['wallet', id, 'usage'] as const,
  recentWallets: ['wallets', 'recent'] as const,
  feeVersions: ['feeVersions'] as const,
  limitVersions: (level: KycLevel) => ['limitVersions', level] as const,
  audit: (q: api.AuditQuery) => ['audit', q] as const,
};

export const useDashboard = (range: api.DashboardRange) =>
  useQuery({ queryKey: queryKeys.dashboard(range), queryFn: () => api.getDashboard(range), placeholderData: keepPreviousData });

export const useTransactions = (q: api.TransactionQuery) =>
  useQuery({ queryKey: queryKeys.transactions(q), queryFn: () => api.listTransactions(q), placeholderData: keepPreviousData });

export const useTransaction = (id: string | null) =>
  useQuery({ queryKey: queryKeys.transaction(id ?? ''), queryFn: () => api.getTransaction(id!), enabled: !!id });

export const useWallet = (id: string) =>
  useQuery({ queryKey: queryKeys.wallet(id), queryFn: () => api.getWallet(id) });

export const useWalletUsage = (id: string) =>
  useQuery({ queryKey: queryKeys.walletUsage(id), queryFn: () => api.getLimitUsageToday(id) });

export const useRecentWallets = () =>
  useQuery({ queryKey: queryKeys.recentWallets, queryFn: api.listRecentWallets });

export const findWallet = api.findWallet;

export const useFeeVersions = () => useQuery({ queryKey: queryKeys.feeVersions, queryFn: api.listFeeVersions });

export const useLimitVersions = (level: KycLevel) =>
  useQuery({ queryKey: queryKeys.limitVersions(level), queryFn: () => api.listLimitVersions(level) });

export const useAudit = (q: api.AuditQuery) =>
  useQuery({ queryKey: queryKeys.audit(q), queryFn: () => api.listAudit(q), placeholderData: keepPreviousData });

// ---------- Mutations ----------

function useInvalidate() {
  const client = useQueryClient();
  return (...prefixes: string[]) =>
    Promise.all([...prefixes, 'audit'].map((p) => client.invalidateQueries({ queryKey: [p] })));
}

export function useReverseTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.reverseTransaction(id, reason),
    onSuccess: () => invalidate('transactions', 'transaction', 'dashboard', 'wallet'),
  });
}

export function useSetWalletLock() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, locked, reason }: { id: string; locked: boolean; reason: string }) =>
      api.setWalletLock(id, locked, reason),
    onSuccess: () => invalidate('wallet', 'wallets'),
  });
}

export function useCreateFeeVersion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { rules: FeeRule[]; effectiveFrom: string; note: string }) => api.createFeeVersion(input),
    onSuccess: () => invalidate('feeVersions'),
  });
}

export function useDecideFeeVersion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => api.decideFeeVersion(id, approve),
    onSuccess: () => invalidate('feeVersions'),
  });
}

export function useCreateLimitVersion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { kycLevel: KycLevel; rules: LimitRule[]; effectiveFrom: string; note: string }) =>
      api.createLimitVersion(input),
    onSuccess: () => invalidate('limitVersions', 'wallet'),
  });
}

export function useDecideLimitVersion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => api.decideLimitVersion(id, approve),
    onSuccess: () => invalidate('limitVersions', 'wallet'),
  });
}
