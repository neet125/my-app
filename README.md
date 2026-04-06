# my-app

このリポジトリは、[SPEC.md](C:/Users/keita/Desktop/my-app/SPEC.md) を唯一の仕様書として扱う前提で、MVP向けの初期構成だけを用意したものです。

## 技術スタック候補

1. Next.js + Auth.js + Prisma + PostgreSQL
   - 立ち上がりは速いですが、フロントとバックエンドの責務が同一アプリ内で混ざりやすく、今回の制約と少し相性が弱いです。
2. React + Vite + Fastify + PostgreSQL
   - 構成が単純で、Google ログインと API を分離しやすく、MVPを最短で進めやすいです。
3. React + NestJS + PostgreSQL
   - 拡張性は高いですが、MVPの初期段階としてはやや重めです。

## 採用する技術スタック

- フロントエンド: React + Vite + TypeScript
- バックエンド: Fastify + TypeScript
- 認証: Google Identity Services + `google-auth-library`
- DB: PostgreSQL
- DBアクセス: `pg` を使った最小構成
- ワークスペース: npm workspaces

## 採用理由

MVP優先で必要十分な構成に留めるためです。`React + Vite` は画面側を軽く始めやすく、`Fastify` は API と認証処理を最小コストで分離できます。Google ログインはフロントで Google の認証結果を受け、バックエンドで検証してユーザーに紐づける流れが [SPEC.md](C:/Users/keita/Desktop/my-app/SPEC.md) の `POST /auth/google-login` と噛み合います。DB は PostgreSQL 前提に合わせ、MVP段階では ORM を増やさず `pg` で十分と判断しました。

## ディレクトリ構成

```text
my-app/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  ├─ components/
│  │  │  ├─ features/
│  │  │  ├─ lib/
│  │  │  ├─ routes/
│  │  │  ├─ App.tsx
│  │  │  ├─ index.css
│  │  │  └─ main.tsx
│  │  ├─ .env.example
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ vite.config.ts
│  └─ api/
│     ├─ src/
│     │  ├─ app/
│     │  ├─ db/
│     │  ├─ plugins/
│     │  ├─ routes/
│     │  ├─ services/
│     │  └─ server.ts
│     ├─ .env.example
│     ├─ package.json
│     └─ tsconfig.json
├─ db/
│  └─ migrations/
├─ SPEC.md
├─ package.json
├─ tsconfig.base.json
└─ .gitignore
```

## セットアップ

1. Node.js 20 以上と PostgreSQL を用意します。
2. 依存関係をインストールします。

```bash
npm install
```

3. 環境変数を作成します。

```bash
copy apps\web\.env.example apps\web\.env
copy apps\api\.env.example apps\api\.env
```

4. Google ログイン用の認証情報を設定します。
   - `apps/web/.env` に Google Client ID を設定
   - `apps/api/.env` に Google Client ID、PostgreSQL 接続文字列、`SESSION_SECRET` を設定

5. DB スキーマとマスターデータを投入します。

```bash
npm run db:migrate:sql
npm run db:seed:sql
```

`flavors` と `alcohols` の初期データは [001_master_data.sql](C:/Users/keita/Desktop/my-app/db/seeds/001_master_data.sql) を使います。

6. 開発サーバーを起動します。

```bash
npm run dev:web
npm run dev:api
```

## 現時点の範囲

- 画面本実装は未着手
- API本実装は未着手
- DBマイグレーションは未着手
- 仕様に不明点がある箇所は、実装時に `TODO` として残す方針
