BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE recipe_size AS ENUM ('short', 'regular', 'special');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE alcohols (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  CONSTRAINT alcohols_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE flavors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  CONSTRAINT flavors_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size recipe_size NOT NULL,
  has_ice_hose BOOLEAN NOT NULL,
  has_alcohol_bottle BOOLEAN NOT NULL,
  alcohol_id BIGINT NULL REFERENCES alcohols(id),
  memo VARCHAR(30),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT recipes_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT recipes_alcohol_consistency CHECK (
    (has_alcohol_bottle = FALSE AND alcohol_id IS NULL)
    OR
    (has_alcohol_bottle = TRUE AND alcohol_id IS NOT NULL)
  )
);

CREATE TABLE recipe_flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  flavor_id BIGINT NOT NULL REFERENCES flavors(id),
  gram INTEGER NOT NULL,
  CONSTRAINT recipe_flavors_gram_positive CHECK (gram >= 1),
  CONSTRAINT recipe_flavors_recipe_flavor_unique UNIQUE (recipe_id, flavor_id)
);

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bookmarks_user_recipe_unique UNIQUE (user_id, recipe_id)
);

CREATE INDEX idx_recipes_user_id_created_at
  ON recipes (user_id, created_at DESC);

CREATE INDEX idx_recipe_flavors_recipe_id
  ON recipe_flavors (recipe_id);

CREATE INDEX idx_recipe_flavors_flavor_id
  ON recipe_flavors (flavor_id);

CREATE INDEX idx_bookmarks_user_id_created_at
  ON bookmarks (user_id, created_at DESC);

CREATE INDEX idx_bookmarks_recipe_id
  ON bookmarks (recipe_id);

CREATE TRIGGER set_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
