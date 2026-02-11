-- New Stack Relational Schema (PostgreSQL/MySQL compatible)
-- Notes:
-- - Uses UUID primary keys (recommended). In MySQL use CHAR(36) if needed.
-- - Keep location retention via scheduled cleanup (see retention section).

-- USERS + ROLES
CREATE TABLE users (
  id            UUID PRIMARY KEY,
  role          VARCHAR(20) NOT NULL, -- student|parent|admin|security
  name          VARCHAR(120) NULL,
  email         VARCHAR(254) NOT NULL UNIQUE,
  phone         VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active', -- active|inactive|suspended
  created_at    TIMESTAMP NOT NULL,
  updated_at    TIMESTAMP NOT NULL
);

CREATE TABLE students (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  roll_no     VARCHAR(40) NULL,
  hostel_name VARCHAR(80) NULL,
  room_no     VARCHAR(40) NULL,
  branch      VARCHAR(80) NULL,
  semester    INT NULL
);

CREATE TABLE parents (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  relationship VARCHAR(40) NULL
);

-- PASSES (Outpass/Homepass/Emergency)
CREATE TABLE passes (
  id               UUID PRIMARY KEY,
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pass_type        VARCHAR(20) NOT NULL, -- outpass|homepass|emergency
  destination      VARCHAR(120) NOT NULL,
  reason           TEXT NOT NULL,
  emergency_contact VARCHAR(30) NOT NULL,
  from_time        TIMESTAMP NOT NULL,
  to_time          TIMESTAMP NOT NULL,
  status           VARCHAR(30) NOT NULL, -- pending_parent|parent_approved|parent_rejected|approved|rejected|expired|returned
  risk_score       NUMERIC(6,2) NULL,
  risk_category    VARCHAR(10) NULL, -- low|medium|high
  parent_comments  TEXT NULL,
  admin_comments   TEXT NULL,
  parent_decided_at TIMESTAMP NULL,
  admin_decided_at  TIMESTAMP NULL,
  returned_at      TIMESTAMP NULL,
  created_at       TIMESTAMP NOT NULL,
  updated_at       TIMESTAMP NOT NULL
);

CREATE INDEX idx_passes_student_created ON passes(student_id, created_at DESC);
CREATE INDEX idx_passes_status ON passes(status);

-- APPROVAL AUDIT TRAIL
CREATE TABLE approvals (
  id          UUID PRIMARY KEY,
  pass_id     UUID NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role        VARCHAR(20) NOT NULL, -- parent|admin
  decision    VARCHAR(10) NOT NULL, -- approve|reject
  comments    TEXT NULL,
  decided_at  TIMESTAMP NOT NULL
);

CREATE INDEX idx_approvals_pass ON approvals(pass_id, decided_at DESC);

-- QR TOKENS (one-time use)
-- We store the JWT id (jti) and a nonce hash to prevent replay/tampering.
CREATE TABLE qr_tokens (
  id         UUID PRIMARY KEY,
  pass_id    UUID NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
  jti        VARCHAR(64) NOT NULL UNIQUE,
  nonce_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_qr_tokens_pass ON qr_tokens(pass_id, created_at DESC);
CREATE INDEX idx_qr_tokens_exp ON qr_tokens(expires_at);

-- SCAN EVENTS (security audit)
CREATE TABLE scan_events (
  id        UUID PRIMARY KEY,
  pass_id   UUID NULL REFERENCES passes(id) ON DELETE SET NULL,
  gate_id   VARCHAR(60) NOT NULL,
  result    VARCHAR(10) NOT NULL, -- allow|deny
  reason    VARCHAR(120) NULL,
  scanned_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_scan_events_pass ON scan_events(pass_id, scanned_at DESC);

-- LOCATION TRACKING (active pass only)
CREATE TABLE location_points (
  id        UUID PRIMARY KEY,
  pass_id   UUID NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
  lat       DOUBLE PRECISION NOT NULL,
  lon       DOUBLE PRECISION NOT NULL,
  accuracy  DOUBLE PRECISION NULL,
  recorded_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_location_points_pass_time ON location_points(pass_id, recorded_at DESC);

-- RETENTION POLICY (implement via scheduled job):
-- - Keep only last 30 days of location points:
--   DELETE FROM location_points WHERE recorded_at < NOW() - INTERVAL '30 days';


