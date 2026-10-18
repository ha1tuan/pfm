// TanStack Query hooks: the only door from UI to data. Today they call the mock
// server; later their bodies switch to packages/api-client with the same signatures.
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActivityItem, CategoryId } from '@/domain/types';
import * as api from '@/mocks/server';

export { ApiError } from '@/mocks/server';
export const { login, lookupWallet, lookupBankAccount, quoteTransfer, quoteWithdrawalFee } = api;

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
});

// The mock "server" pushes changes (e.g. a bank transfer settling) like a realtime channel would.
api.setChangeListener(() => {
  queryClient.invalidateQueries({ queryKey: ['wallet'] });
  queryClient.invalidateQueries({ queryKey: ['activity'] });
  queryClient.invalidateQueries({ queryKey: ['transaction'] });
  queryClient.invalidateQueries({ queryKey: ['linkedBanks'] });
});

export const useWallet = () => useQuery({ queryKey: ['wallet'], queryFn: api.getWallet });
export const useActivity = () => useQuery({ queryKey: ['activity'], queryFn: api.listActivity });
export const useTransaction = (id: string) =>
  useQuery({ queryKey: ['transaction', id], queryFn: () => api.getTransaction(id), enabled: !!id });
export const useManualEntry = (id: string) =>
  useQuery({ queryKey: ['activity', 'manual', id], queryFn: () => api.getManualEntry(id), enabled: !!id });
export const useLinkedBanks = () => useQuery({ queryKey: ['linkedBanks'], queryFn: api.listLinkedBanks });
export const useBankCatalog = () => useQuery({ queryKey: ['bankCatalog'], queryFn: api.listBankCatalog, staleTime: Infinity });
export const useContacts = () => useQuery({ queryKey: ['contacts'], queryFn: api.listContacts, staleTime: Infinity });
export const useRemainingLimit = () => useQuery({ queryKey: ['wallet', 'limit'], queryFn: api.getRemainingDailyLimit });
export const useBudgets = () => useQuery({ queryKey: ['budgets'], queryFn: api.getBudgets });
export const useGoals = () => useQuery({ queryKey: ['goals'], queryFn: api.getGoals });

export function useSetCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: { kind: ActivityItem['kind']; id: string; categoryId: CategoryId }) =>
      api.setCategory(v.kind, v.id, v.categoryId),
    onSuccess: () => client.invalidateQueries({ queryKey: ['activity'] }),
  });
}

export const useAddManualEntry = () => useMutation({ mutationFn: api.addManualEntry });
export const useLinkBank = () => useMutation({ mutationFn: api.linkBank });
export const useSubmitTransfer = () => useMutation({ mutationFn: api.submitTransfer });
export const useSubmitTopUp = () => useMutation({ mutationFn: api.submitTopUp });
export const useSubmitWithdrawal = () => useMutation({ mutationFn: api.submitWithdrawal });
