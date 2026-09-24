-- ============================================
-- TABLE: contact_messages
-- Messages envoyés depuis le formulaire /contact
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  email TEXT CHECK (email IS NULL OR char_length(btrim(email)) BETWEEN 5 AND 120),
  message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 2000),
  status TEXT DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- N'importe qui peut envoyer un message (formulaire public),
-- mais personne ne peut lire ni modifier les messages via le client.
CREATE POLICY "Public can submit contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Lecture / mise à jour réservées au service_role (le client anon n'a
-- aucune policy SELECT/UPDATE/DELETE : tout accès est refusé par défaut).

-- ============================================
-- Nettoyage : supprimer les messages résolus de plus de 12 mois
-- (à appeler périodiquement, ex. via pg_cron)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_resolved_contact_messages()
RETURNS VOID AS $$
BEGIN
  DELETE FROM contact_messages
  WHERE status = 'resolved'
    AND created_at < NOW() - INTERVAL '12 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
