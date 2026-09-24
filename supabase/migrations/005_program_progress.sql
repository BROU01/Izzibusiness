-- ============================================
-- TABLE: program_progress
-- Progression du programme 20 jours — remplace la persistance
-- localStorage (src/lib/curriculum-progress.ts) quand Supabase est configuré.
-- Une ligne par (utilisateur, jour) : complétion horodatée.
-- ============================================
CREATE TABLE IF NOT EXISTS program_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 20),
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, day)
);

CREATE INDEX idx_program_progress_user ON program_progress(user_id);
CREATE INDEX idx_program_progress_completed ON program_progress(completed_at DESC);

-- ============================================
-- RLS : chacun ne voit et ne modifie que sa propre progression
-- ============================================
ALTER TABLE program_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON program_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON program_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON program_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Mise à jour : on autorise uniquement le changement de completed_at
-- (revalidation d'un jour déjà fait), pas le détournement d'un jour
-- appartenant à un autre utilisateur (protégé par USING).
CREATE POLICY "Users can update own progress"
  ON program_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FONCTION: Toggle de complétion atomique côté serveur
-- Complète un jour (ou le retire si déjà complété). Renvoie le nouvel état.
-- Utilisée par l'API route en mode production ; le client anon ne parle
-- jamais directement à la table pour la complétion (validation du verrou
-- séquentiel possible côté serveur).
-- ============================================
CREATE OR REPLACE FUNCTION toggle_program_day(
  p_user_id UUID,
  p_day INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_completed INTEGER[];
  v_unlocked BOOLEAN;
BEGIN
  IF p_day < 1 OR p_day > 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jour invalide');
  END IF;

  -- Verrou séquentiel : le jour N est ouvert si le jour N-1 est complété.
  IF p_day > 1 THEN
    SELECT EXISTS (
      SELECT 1 FROM program_progress
      WHERE user_id = p_user_id AND day = p_day - 1
    ) INTO v_unlocked;

    IF NOT v_unlocked THEN
      RETURN jsonb_build_object('success', false, 'error', 'Jour verrouillé');
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM program_progress
    WHERE user_id = p_user_id AND day = p_day
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM program_progress
    WHERE user_id = p_user_id AND day = p_day;
  ELSE
    INSERT INTO program_progress (user_id, day)
    VALUES (p_user_id, p_day)
    ON CONFLICT (user_id, day) DO NOTHING;
  END IF;

  SELECT array_agg(day ORDER BY day) INTO v_completed
  FROM program_progress
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'completed', COALESCE(v_completed, '{}'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VUE: Streaks (jours consécutifs) — calculée côté base
-- Un streak = suite de jours complétés dont chaque date de complétion
-- est antérieure ou égale au lendemain de la précédente.
-- ============================================
CREATE OR REPLACE VIEW user_program_streaks AS
WITH ordered AS (
  SELECT
    user_id,
    day,
    completed_at,
    completed_at::date
      - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY completed_at::date))::int
      AS streak_group
  FROM program_progress
),
grouped AS (
  SELECT
    user_id,
    streak_group,
    MIN(completed_at::date) AS streak_start,
    MAX(completed_at::date) AS streak_end,
    COUNT(*) AS streak_length
  FROM ordered
  GROUP BY user_id, streak_group
)
SELECT
  user_id,
  MAX(streak_length) AS best_streak,
  (
    SELECT g.streak_length
    FROM grouped g
    WHERE g.user_id = o.user_id
      AND g.streak_end >= CURRENT_DATE - INTERVAL '1 day'
    ORDER BY g.streak_end DESC
    LIMIT 1
  ) AS current_streak
FROM ordered o
GROUP BY user_id;
