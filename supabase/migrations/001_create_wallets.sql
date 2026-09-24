-- ============================================
-- TABLE: wallets
-- Stocke le solde de chaque utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
  game_balance DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (game_balance >= 0),
  currency TEXT DEFAULT 'FCFA' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Index pour les recherches rapides
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- ============================================
-- TABLE: transactions
-- Historique de toutes les transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'game_bet', 'game_win', 'mission_reward', 'referral_bonus', 'purchase')),
  amount DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  description TEXT,
  reference_id TEXT, -- ID de la transaction externe (payment, game round, etc.)
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les recherches par user et par date
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================
-- FONCTION: Mettre à jour updated_at automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour wallets
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne peuvent voir que leur propre wallet
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs ne peuvent modifier que leur propre wallet
CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leur propre wallet
CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs ne peuvent voir que leurs propres transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin peut tout voir (pour le dashboard admin)
CREATE POLICY "Admins can view all wallets"
  ON wallets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FONCTION: Créditer le wallet (sécurisé)
-- ============================================
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance DECIMAL;
  v_wallet_id UUID;
  v_result JSONB;
BEGIN
  -- Créer le wallet s'il n'existe pas
  INSERT INTO wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Mettre à jour le solde
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE user_id = p_user_id
  RETURNING balance, id INTO v_new_balance, v_wallet_id;

  -- Enregistrer la transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, metadata)
  VALUES (p_user_id, p_type, p_amount, v_new_balance, p_description, p_reference_id, p_metadata);

  -- Retourner le résultat
  v_result := jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'wallet_id', v_wallet_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION: Débiter le wallet (sécurisé)
-- ============================================
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_wallet_id UUID;
  v_result JSONB;
BEGIN
  -- Vérifier le solde
  SELECT balance, id INTO v_current_balance, v_wallet_id
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet non trouvé');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solde insuffisant');
  END IF;

  -- Mettre à jour le solde
  UPDATE wallets
  SET balance = balance - p_amount
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Enregistrer la transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, metadata)
  VALUES (p_user_id, p_type, -p_amount, v_new_balance, p_description, p_reference_id, p_metadata);

  v_result := jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'wallet_id', v_wallet_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION: Mise de jeu (débite wallet, ajoute game_balance)
-- ============================================
CREATE OR REPLACE FUNCTION place_game_bet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_game TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_new_game_balance DECIMAL;
  v_result JSONB;
BEGIN
  -- Vérifier le solde principal
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet non trouvé');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solde insuffisant');
  END IF;

  -- Déplacer du wallet principal vers le game_balance
  UPDATE wallets
  SET balance = balance - p_amount,
      game_balance = game_balance + p_amount
  WHERE user_id = p_user_id
  RETURNING balance, game_balance INTO v_new_balance, v_new_game_balance;

  -- Enregistrer la transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (p_user_id, 'game_bet', -p_amount, v_new_balance, 'Mise: ' || p_game, p_metadata);

  v_result := jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'game_balance', v_new_game_balance
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION: Gain de jeu (débite game_balance, crédit wallet)
-- ============================================
CREATE OR REPLACE FUNCTION collect_game_win(
  p_user_id UUID,
  p_amount DECIMAL,
  p_game TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance DECIMAL;
  v_new_game_balance DECIMAL;
  v_result JSONB;
BEGIN
  -- Ajouter les gains au wallet principal et déduire du game_balance
  UPDATE wallets
  SET balance = balance + p_amount,
      game_balance = GREATEST(game_balance - p_amount, 0)
  WHERE user_id = p_user_id
  RETURNING balance, game_balance INTO v_new_balance, v_new_game_balance;

  -- Enregistrer la transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (p_user_id, 'game_win', p_amount, v_new_balance, 'Gain: ' || p_game, p_metadata);

  v_result := jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'game_balance', v_new_game_balance
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
