# REACT-RAILS-TODO-APP

Google OAuth2認証を使用したReact + RailsのTODO管理アプリケーション

## 機能

- **Google OAuth2認証** - Googleアカウントでのログイン
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
- Nginx (リバースプロキシ)

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
   http://localhost:3000/api/v1/auth/google_oauth2/callback
   ```
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

## 開発

### テストの実行

```bash
# Backend (RSpec) - 73 tests
docker-compose exec backend bundle exec rspec

# Frontend (Jest) - 52 tests
docker-compose exec frontend npm test -- --watchAll=false
```

### Lintの実行

```bash
# Backend (RuboCop)
docker-compose exec backend bundle exec rubocop

# 自動修正
docker-compose exec backend bundle exec rubocop -A

# Frontend (ESLint)
docker-compose exec frontend npm run lint

# 自動修正
docker-compose exec frontend npm run lint:fix
```

### データベース操作

```bash
# マイグレーション実行
docker-compose exec backend rails db:migrate

# データベースリセット
docker-compose exec backend rails db:reset

# Rails コンソール
docker-compose exec backend rails console
```

## プロジェクト構成

```
.
├── backend/                 # Rails API
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
│   ├── public/            # 静的ファイル
│   └── src/
│       ├── components/    # Reactコンポーネント
│       ├── hooks/         # カスタムフック
│       ├── services/      # API通信
│       └── constants/     # 定数
│
└── docker-compose.yml     # Docker構成
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

## テストカバレッジ

### Backend (73 tests)
- **Models**: User, Todo のバリデーション、アソシエーション
- **Controllers**: 認証、TODO CRUD、フィルタリング、認可
- **Services**: JWT、Google OAuth処理

### Frontend (52 tests)
- **Components**: TodoList、App
- **Hooks**: useAuth
- **Services**: authService、todoService

## トラブルシューティング

### ポートが使用中の場合

```bash
# コンテナを停止
docker-compose down

# ポート使用状況確認
lsof -i :3000
lsof -i :3001
```

### データベースのリセット

```bash
docker-compose exec backend rails db:drop db:create db:migrate
```

### コンテナの再ビルド

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

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
