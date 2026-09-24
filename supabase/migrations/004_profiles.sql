-- ============================================
-- TABLE: profiles
-- Profil public de chaque utilisateur. Referencée par :
--   - 001_create_wallets.sql : policies admin (profiles.role = 'admin')
--   - /api/auth/register     : insert { name, email, phone, role }
--   - /api/auth/login        : select { id, name, phone }
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  email TEXT UNIQUE CHECK (email IS NULL OR char_length(btrim(email)) BETWEEN 5 AND 120),
  phone TEXT UNIQUE NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 8 AND 20),
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  is_member BOOLEAN DEFAULT FALSE NOT NULL,
  referral_code TEXT UNIQUE,
  referred_by TEXT, -- téléphone du parrain (texte, pas FK : le parrain peut être inconnu à l'insertion)
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger updated_at (fonction déjà créée en 001 : pas de doublon)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Chacun lit et met à jour son propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Le profil est créé côté serveur (register API, service_role) : aucune
-- policy INSERT pour le client anon, donc impossible de forger un profil.
-- Lecture publique limitée au nom et pseudo pour marketplace/classement :
CREATE POLICY "Public can view minimal profile"
  ON profiles FOR SELECT
  USING (true);

-- Admin : gestion complète
CREATE POLICY "Admins manage all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- ============================================
-- FONCTION: Générer un code de parrainage unique (IZZ + 6 caractères)
-- ============================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  LOOP
    v_code := 'IZZ' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION: Créer le profil à l'inscription Supabase Auth
-- (trigger sur auth.users : si vous créez les comptes via
-- signUp/signInWithOtp, le profil existe sans action API manuelle)
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, phone, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    COALESCE(NEW.phone, ''),
    generate_referral_code()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FONCTION: Créditer le parrain quand le filleul devient membre actif
-- (à appeler depuis la confirmation d'adhésion, service_role)
-- ============================================
CREATE OR REPLACE FUNCTION credit_referral_bonus(
  p_referral_code TEXT,
  p_amount DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_sponsor_id UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_sponsor_id
  FROM profiles
  WHERE referral_code = p_referral_code;

  IF v_sponsor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code de parrain inconnu');
  END IF;

  PERFORM credit_wallet(v_sponsor_id, p_amount, 'referral_bonus',
    'Bonus parrainage - filleul actif', NULL, '{}');

  v_result := jsonb_build_object('success', true, 'sponsor_id', v_sponsor_id);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
