-- Honeypot Logs Table
-- Loggt jeden Bot der in die Falle tappt (visits zu /honeypot, /secret-admin, etc.)

CREATE TABLE IF NOT EXISTS honeypot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bot Info
  user_agent text,
  ip_address text,
  referrer text,

  -- Welche Falle wurde ausgelöst?
  honeypot_path text NOT NULL, -- z.B. "/honeypot", "/secret-admin"

  -- Klassifizierung
  bot_type text DEFAULT 'unknown', -- "good", "bad", "unknown"
  is_blocked boolean DEFAULT false, -- Wurde dieser Bot vorher schon als böse erkannt?

  -- Metadata
  visited_at timestamp with time zone DEFAULT now(),

  -- Request Details (optional)
  request_method text, -- GET, POST, etc.
  query_params jsonb, -- Query parameters falls vorhanden

  CONSTRAINT honeypot_path_check CHECK (honeypot_path IN (
    '/honeypot',
    '/secret-admin',
    '/wp-admin/',
    '/hidden-data'
  ))
);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_honeypot_logs_visited_at ON honeypot_logs(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_honeypot_logs_bot_type ON honeypot_logs(bot_type);
CREATE INDEX IF NOT EXISTS idx_honeypot_logs_ip ON honeypot_logs(ip_address);

-- Row Level Security (RLS) aktivieren
ALTER TABLE honeypot_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder darf INSERT (damit Logs geschrieben werden können)
CREATE POLICY "Anyone can insert honeypot logs" ON honeypot_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: Nur Admins können lesen (später können wir auth prüfen)
CREATE POLICY "Only admins can read honeypot logs" ON honeypot_logs
  FOR SELECT
  USING (true); -- Vorerst alle, später: auth.role() = 'admin'

COMMENT ON TABLE honeypot_logs IS 'Logs aller Bots die in Honeypot-Fallen getappt sind (robots.txt ignoriert)';
