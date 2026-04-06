# AGENTS Rules

- `SPEC.md` を唯一の仕様書として扱う。
- フロントエンドで `import.meta.env` を直接読むのは禁止し、[apps/web/src/lib/env.ts](/Users/keita/Desktop/my-app/apps/web/src/lib/env.ts) 経由で参照する。
- フロントエンドの API base URL は [apps/web/src/lib/env.ts](/Users/keita/Desktop/my-app/apps/web/src/lib/env.ts) の `API_BASE_URL` に集約し、`VITE_API_BASE_URL` 未設定時は `http://localhost:3000` を使う。
- 認証・マスタ取得・レシピ取得・投稿・保存など、すべての API クライアントは共通の `API_BASE_URL` を使う。
- バックエンドでは `.env` 読み込みを env 依存モジュールより先に行う。API エントリポイントでは [apps/api/src/server.ts](/Users/keita/Desktop/my-app/apps/api/src/server.ts) で [apps/api/src/load-env.ts](/Users/keita/Desktop/my-app/apps/api/src/load-env.ts) を最初に読み込む。
- バックエンドの実行用環境変数は `apps/api/.env`、フロントエンドの実行用環境変数は `apps/web/.env.local` または `apps/web/.env` に置く。
