
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL      PRIMARY KEY,
    token_id    UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    expire_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    is_revoked  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_id   ON refresh_tokens (token_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens (is_revoked);
