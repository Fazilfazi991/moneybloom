CREATE TABLE IF NOT EXISTS money_bloom_sync (
  key_hash text PRIMARY KEY,
  data jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
