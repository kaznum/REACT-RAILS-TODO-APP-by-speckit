# frozen_string_literal: true

# Clear existing data (development only)
if Rails.env.development?
  Rails.logger.debug 'Clearing existing data...'
  Todo.destroy_all
  User.destroy_all
end

# Create sample users
Rails.logger.debug 'Creating sample users...'

user1 = User.create!(
  google_id: 'dev_user_1',
  email: 'user1@example.com',
  name: '山田太郎'
)

user2 = User.create!(
  google_id: 'dev_user_2',
  email: 'user2@example.com',
  name: '佐藤花子'
)

Rails.logger.debug { "Created #{User.count} users" }

# Create sample TODOs for user1
Rails.logger.debug 'Creating sample TODOs for 山田太郎...'

Todo.create!([
  {
    user: user1,
    name: 'プロジェクトの提案書を作成',
    priority: :high,
    deadline: Time.zone.today + 2.days,
    completed: false
  },
  {
    user: user1,
    name: 'クライアントミーティングの準備',
    priority: :high,
    deadline: Time.zone.today + 1.day,
    completed: false
  },
  {
    user: user1,
    name: '週次レポートの提出',
    priority: :medium,
    deadline: Time.zone.today + 5.days,
    completed: false
  },
  {
    user: user1,
    name: 'コードレビューの実施',
    priority: :medium,
    deadline: Time.zone.today + 3.days,
    completed: true
  },
  {
    user: user1,
    name: '新機能の設計書を読む',
    priority: :low,
    deadline: Time.zone.today + 7.days,
    completed: false
  },
  {
    user: user1,
    name: 'チームビルディングイベントの参加',
    priority: :low,
    deadline: Time.zone.today + 10.days,
    completed: false
  },
  {
    user: user1,
    name: 'バグ修正: ログイン画面の問題',
    priority: :high,
    deadline: Time.zone.today,
    completed: false
  }
])

# Create sample TODOs for user2
Rails.logger.debug 'Creating sample TODOs for 佐藤花子...'

Todo.create!([
  {
    user: user2,
    name: '四半期目標の設定',
    priority: :high,
    deadline: Time.zone.today + 3.days,
    completed: false
  },
  {
    user: user2,
    name: 'テストケースの作成',
    priority: :medium,
    deadline: Time.zone.today + 4.days,
    completed: false
  },
  {
    user: user2,
    name: 'ドキュメントの更新',
    priority: :low,
    deadline: Time.zone.today + 8.days,
    completed: true
  }
])

Rails.logger.debug { "Created #{Todo.count} TODOs" }
Rails.logger.debug 'Seed data created successfully!'
