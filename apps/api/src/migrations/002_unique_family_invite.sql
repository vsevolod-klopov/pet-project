-- One invite record per family (unique family_id)
BEGIN;

DELETE FROM family_invites fi
WHERE fi.id NOT IN (
  SELECT DISTINCT ON (family_id) id
  FROM family_invites
  ORDER BY family_id, expires_at DESC, id DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_family_invites_family_id ON family_invites (family_id);

COMMIT;
