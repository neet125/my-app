BEGIN;

INSERT INTO flavors (name, category, sort_order)
VALUES
  ('Double Apple', '定番', 10),
  ('Mint', '定番', 20),
  ('Lemon', 'シトラス', 10),
  ('Blueberry', 'フルーツ', 10),
  ('Grape', 'フルーツ', 20)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;

INSERT INTO alcohols (name)
VALUES
  ('Jack Daniel''s'),
  ('Gin'),
  ('Vodka')
ON CONFLICT (name) DO NOTHING;

COMMIT;
