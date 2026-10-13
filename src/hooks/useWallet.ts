'use client';

import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  balance: number;
  gameBalance: number;
  currency: string;
  loading: boolean;
  error: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceId: string | null;
  status: string;
  createdAt: string;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    gameBalance: 0,
    currency: 'FCFA',
    loading: true,
    error: null,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Récupérer le wallet — le loading initial vient de l'état initial du hook,
  // les mises à jour ne se font qu'après réponse (pas de setState synchrone).
  const fetchWallet = useCallback(async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();

      if (data.success) {
        setWallet({
          balance: data.wallet.balance,
          gameBalance: data.wallet.gameBalance,
          currency: data.wallet.currency,
          loading: false,
          error: null,
        });
      } else {
        setWallet((prev) => ({
          ...prev,
          loading: false,
          error: data.message || 'Erreur lors du chargement du wallet',
        }));
      }
    } catch {
      setWallet((prev) => ({
        ...prev,
        loading: false,
        error: 'Erreur de connexion',
      }));
    }
  }, []);

  // Récupérer les transactions
  const fetchTransactions = useCallback(async (limit = 20, type?: string) => {
    try {
      setTransactionsLoading(true);

      const params = new URLSearchParams({ limit: limit.toString() });
      if (type) params.append('type', type);

      const response = await fetch(`/api/wallet/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Charger le wallet au montage — IIFE async : les setState ne surviennent
  // qu'après la réponse réseau, jamais de façon synchrone dans l'effet.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/wallet');
        const data = await response.json();
        if (cancelled) return;
        if (data.success) {
          setWallet({
            balance: data.wallet.balance,
            gameBalance: data.wallet.gameBalance,
            currency: data.wallet.currency,
            loading: false,
            error: null,
          });
        } else {
          setWallet((prev) => ({
            ...prev,
            loading: false,
            error: data.message || 'Erreur lors du chargement du wallet',
          }));
        }
      } catch {
        if (!cancelled) {
          setWallet((prev) => ({ ...prev, loading: false, error: 'Erreur de connexion' }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...wallet,
    transactions,
    transactionsLoading,
    fetchWallet,
    fetchTransactions,
  };
}
