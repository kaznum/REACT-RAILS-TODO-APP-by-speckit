# REACT-RAILS-TODO-APP

Google OAuth2認証を使用したReact + RailsのTODO管理アプリケーション

## 機能

- **Google OAuth2認証** - Googleアカウントでのログイン
  - セキュアなトークン管理（Access Token: 15分、Refresh Token: 7日間）
  - URL fragmentによるトークン受け渡し（ログ・履歴への露出を防止）
  - トークンタイプ検証（Refresh tokenでのAPI不正利用を防止）
- **TODO管理** - タスクの作成、編集、削除、完了/未完了の切り替え
- **優先度設定** - 高・中・低の3段階で優先度を設定
- **期限管理** - タスクに期限を設定
- **フィルタリング** - 優先度でタスクをフィルタリング
- **自動ソート** - 優先度と期限で自動的にソート
- **日本語UI** - 全てのUIが日本語に対応

## 技術スタック

### Backend
- Ruby 3.x
- Rails 7.1
- SQLite3
- JWT認証
- Google OAuth2 (OmniAuth)
- RSpec (テスト)

### Frontend
- React 18.2
- React Router 6
- Axios
- Jest & React Testing Library (テスト)

### インフラ
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## 前提条件

- Docker
- Docker Compose
- Google Cloud Platform アカウント (OAuth2認証用)

## セットアップ

### 1. Google OAuth2の設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. 「APIとサービス」→「認証情報」でOAuth 2.0クライアントIDを作成
3. 承認済みのリダイレクトURIに以下を追加:
   ```
   http://localhost:3000/auth/google_oauth2/callback
   ```
   **注意**: `/api/v1`は含めません。OmniAuthのコールバックはルートパスに設定されます。
4. クライアントIDとクライアントシークレットを取得

### 2. 環境変数の設定

`backend/.env`ファイルを作成:

```bash
# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL
REACT_APP_FRONTEND_URL=http://localhost:3001
```

`frontend/.env`ファイルを作成:

```bash
REACT_APP_API_URL=http://localhost:3000/api/v1
```

### 3. アプリケーションの起動

```bash
# コンテナのビルドと起動
docker-compose up --build

# データベースのセットアップ（初回のみ）
docker-compose exec backend rails db:create db:migrate
```

アプリケーションにアクセス:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1

## CI/CD

このプロジェクトはGitHub Actionsを使用して自動テストとLintを実行します。

### 自動実行
- **プルリクエスト作成時**: 全てのテストとLintが自動実行
- **プルリクエスト更新時**: 新しいコミットがプッシュされると自動的に再実行
- **並列実行**: 4つのジョブが並列実行（約5分で完了）
  - Backend Tests (RSpec) - 74 tests
  - Frontend Tests (Jest) - 55 tests
  - Backend Lint (RuboCop)
  - Frontend Lint (ESLint)

### ワークフロー
- 設定ファイル: `.github/workflows/ci.yml`
- Docker Composeを使用してローカル環境と同じ環境でテスト実行
- 環境ファイル（`.env`）は`.env.example`から自動生成
- データベースマイグレーションも自動実行

詳細は [specs/003-pull-request-github/quickstart.md](specs/003-pull-request-github/quickstart.md) を参照してください。

## 開発

### テストの実行

```bash
# Backend (RSpec) - 74 tests
docker compose exec backend bundle exec rspec

# Frontend (Jest) - 55 tests
docker compose exec frontend npm test -- --watchAll=false
```

### Lintの実行

```bash
# Backend (RuboCop)
docker compose exec backend bundle exec rubocop

# 自動修正
docker compose exec backend bundle exec rubocop -A

# Frontend (ESLint)
docker compose exec frontend npm run lint

# 自動修正
docker compose exec frontend npm run lint:fix
```

### データベース操作

```bash
# マイグレーション実行
docker compose exec backend rails db:migrate

# データベースリセット
docker compose exec backend rails db:reset

# Rails コンソール
docker compose exec backend rails console
```

## プロジェクト構成

```
.
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD設定
│
├── backend/                # Rails API
│   ├── app/
│   │   ├── controllers/    # APIコントローラー
│   │   ├── models/         # データモデル
│   │   ├── serializers/    # JSONシリアライザー
│   │   └── services/       # ビジネスロジック
│   ├── config/             # 設定ファイル
│   ├── db/                 # データベース
│   └── spec/               # RSpecテスト
│
├── frontend/               # React SPA
│   ├── public/             # 静的ファイル
│   └── src/
│       ├── components/     # Reactコンポーネント
│       ├── hooks/          # カスタムフック
│       ├── services/       # API通信
│       └── constants/      # 定数
│
├── specs/                  # 機能仕様とドキュメント
│   ├── 001-todo-google-oauth2/  # Google OAuth2機能
│   └── 003-pull-request-github/ # CI/CD機能
│
└── docker-compose.yml      # Docker構成
```

## API エンドポイント

### 認証
- `GET /api/v1/auth/google` - Google OAuth開始
- `GET /api/v1/auth/google_oauth2/callback` - OAuthコールバック
- `POST /api/v1/auth/refresh` - トークンリフレッシュ
- `DELETE /api/v1/auth/sign_out` - ログアウト
- `GET /api/v1/auth/current_user` - 現在のユーザー取得

### TODO
- `GET /api/v1/todos` - TODO一覧取得
- `GET /api/v1/todos?priority=high` - 優先度でフィルタリング
- `POST /api/v1/todos` - TODO作成
- `PATCH /api/v1/todos/:id` - TODO更新
- `DELETE /api/v1/todos/:id` - TODO削除

## セキュリティ

### 認証・認可
- **JWT トークン**: Access Token（15分）とRefresh Token（7日間）の二段階認証
- **トークンタイプ検証**: Refresh tokenでの保護されたAPI利用を防止
- **httpOnly Cookie**: Refresh tokenはhttpOnly cookieで保存し、XSS攻撃を防止
- **URL Fragment**: OAuth callbackでaccess tokenをURL fragment（#）で受け渡し、以下を防止：
  - サーバーログへの露出
  - ブラウザ履歴への記録
  - Referrerヘッダーでの漏洩
  - アクセス解析ツールへの送信

### データアクセス制御
- **ユーザー分離**: 各ユーザーは自身のTODOのみアクセス可能
- **認証必須**: 全てのAPI エンドポイント（認証系を除く）で認証を要求

## テストカバレッジ

### Backend (74 tests)
- **Models**: User, Todo のバリデーション、アソシエーション
- **Controllers**: 認証、TODO CRUD、フィルタリング、認可、トークンタイプ検証
- **Services**: JWT、Google OAuth処理

### Frontend (55 tests)
- **Components**: TodoList、TodoItem、App
- **Hooks**: useAuth
- **Services**: authService（URL fragment対応）、todoService

## トラブルシューティング

### ポートが使用中の場合

```bash
# コンテナを停止
docker compose down

# ポート使用状況確認
lsof -i :3000
lsof -i :3001
```

### データベースのリセット

```bash
docker compose exec backend rails db:drop db:create db:migrate
```

### コンテナの再ビルド

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

### WebSocketエラーが出る場合

フロントエンドで`WebSocket connection failed`エラーが出る場合、`frontend/.env.local`に以下を追加：

```bash
WDS_SOCKET_PORT=0
```

これにより、開発サーバーはWebSocketの代わりにポーリングを使用します。

## ライセンス

MIT License

## 貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 作成者

🤖 Generated with [Claude Code](https://claude.com/claude-code)
