'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import WithdrawModal from '@/components/WithdrawModal';
import DepositModal from '@/components/DepositModal';

export default function WalletPage() {
  const {
    balance,
    gameBalance,
    currency,
    loading,
    transactions,
    transactionsLoading,
    fetchTransactions,
    fetchWallet,
  } = useWallet();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    fetchTransactions(20);
  }, [fetchTransactions]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Depot';
      case 'withdraw':
        return 'Retrait';
      case 'game_bet':
        return 'Mise de jeu';
      case 'game_win':
        return 'Gain de jeu';
      case 'mission_reward':
        return 'Recompense mission';
      case 'referral_bonus':
        return 'Bonus parrainage';
      case 'purchase':
        return 'Achat';
      default:
        return type;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Mon Wallet</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Gerez vos fonds et transactions
        </p>
      </div>

      {/* Balance Card */}
      <div
        style={{
          background: 'var(--ink)',
          padding: '32px',
          color: 'white',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Main Balance */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '8px' }}>
              Solde principal
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, marginBottom: '24px' }}>
              {loading ? '...' : `${balance.toLocaleString()} ${currency}`}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeposit(true)}
                style={{
                  padding: '10px 20px',
                  background: '#00744a',
                  color: 'white',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Deposer
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retirer
              </button>
            </div>
          </div>

          {/* Game Balance */}
          <div
            style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.05)',
              minWidth: '180px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '4px' }}>
              Solde jeux
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#b8320d' }}>
              {loading ? '...' : `${gameBalance.toLocaleString()} ${currency}`}
            </div>
            <a
              href="/games"
              style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '6px 12px',
                background: 'var(--sky)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Jouer
            </a>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        onDepositSuccess={() => {
          fetchWallet();
          fetchTransactions(20);
          setShowDeposit(false);
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={balance}
        onWithdrawSuccess={() => {
          fetchWallet();
          fetchTransactions(20);
          setShowWithdraw(false);
        }}
      />

      {/* Transactions */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Historique des transactions</h2>
          <button
            onClick={() => fetchTransactions(50)}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Actualiser
          </button>
        </div>

        {transactionsLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            Chargement...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            Aucune transaction pour l&apos;instant
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>
                    {tx.description || getTypeLabel(tx.type)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: tx.amount > 0 ? '#00744a' : '#b8320d',
                    }}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toLocaleString()} {currency}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Solde: {tx.balanceAfter.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
