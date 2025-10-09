# Feature Specification: Japanese UI Localization

**Feature Branch**: `002-japanese-ui`
**Created**: 2025-10-09
**Status**: Draft
**Parent Feature**: 001-todo-google-oauth2
**Input**: "アプリケーションのUIは日本語とする。メッセージも日本語で表示する。"

## Summary

既存のTODO管理アプリケーションのUI要素とメッセージを全て日本語に翻訳し、日本語ユーザーに最適化されたユーザー体験を提供する。

## User Scenarios & Testing

### User Story 1 - 日本語UI表示

日本語ユーザーが全ての画面で日本語のラベル、ボタン、メッセージを見ることができる。

**Acceptance Scenarios**:

1. **Given** ユーザーがログインページにアクセスした時、**When** ページが表示される、**Then** "Sign in with Google"が"Googleでログイン"と表示される
2. **Given** 認証済みユーザーがダッシュボードを表示した時、**When** ページが表示される、**Then** "My TODOs"が"マイTODO"、"Add TODO"が"TODO追加"と表示される
3. **Given** ユーザーがTODOフォームを開いた時、**When** フォームが表示される、**Then** 全てのラベル（TODO名、優先度、期限）が日本語で表示される
4. **Given** バリデーションエラーが発生した時、**When** エラーメッセージが表示される、**Then** エラーメッセージが日本語で表示される
5. **Given** ユーザーが削除確認ダイアログを見た時、**When** ダイアログが表示される、**Then** 確認メッセージが日本語で表示される

## Requirements

### Functional Requirements

- **FR-001**: 全てのUIテキスト（ボタン、ラベル、タイトル）を日本語で表示する
- **FR-002**: 全てのエラーメッセージを日本語で表示する
- **FR-003**: 全てのシステムメッセージ（成功、警告、情報）を日本語で表示する
- **FR-004**: 優先度の表示（High/Medium/Low）を日本語（高/中/低）にする
- **FR-005**: 日付フォーマットを日本式（YYYY年MM月DD日）で表示する
- **FR-006**: 空状態メッセージを日本語で表示する
- **FR-007**: ローディング状態のメッセージを日本語で表示する

### Key Translations

#### Authentication
- "Sign in with Google" → "Googleでログイン"
- "Sign Out" → "ログアウト"
- "Welcome" → "ようこそ"

#### Dashboard
- "TODO Manager" → "TODOマネージャー"
- "My TODOs" → "マイTODO"
- "Add TODO" → "TODO追加"

#### TODO Form
- "Create New TODO" → "新しいTODO作成"
- "Edit TODO" → "TODO編集"
- "TODO Name" → "TODO名"
- "Priority" → "優先度"
- "Deadline" → "期限"
- "High" → "高"
- "Medium" → "中"
- "Low" → "低"
- "Save" → "保存"
- "Cancel" → "キャンセル"
- "Create TODO" → "TODO作成"
- "Update TODO" → "TODO更新"

#### Validation Messages
- "Name is required" → "名前は必須です"
- "Name must be less than 255 characters" → "名前は255文字以内で入力してください"
- "Priority is required" → "優先度は必須です"
- "Deadline is required" → "期限は必須です"

#### Actions
- "Delete" → "削除"
- "Edit" → "編集"
- "Are you sure you want to delete this TODO?" → "このTODOを削除してもよろしいですか？"

#### Status Messages
- "Loading TODOs..." → "TODO読み込み中..."
- "Failed to load todos" → "TODOの読み込みに失敗しました"
- "Failed to save TODO. Please try again." → "TODOの保存に失敗しました。もう一度お試しください。"
- "No TODOs yet" → "まだTODOがありません"
- "Get started by creating your first TODO item" → "最初のTODOを作成して始めましょう"

#### Filters
- "All" → "全て"

#### Empty States
- "No deadline" → "期限なし"

## Success Criteria

- **SC-001**: 全てのUI要素が日本語で表示される
- **SC-002**: エラーメッセージが自然な日本語で表示される
- **SC-003**: 日付が日本式フォーマットで表示される
- **SC-004**: 優先度フィルターが日本語で動作する

## Out of Scope

- 多言語切り替え機能（英語との切り替え）
- バックエンドエラーメッセージの翻訳（バックエンドは英語のまま）
- ブラウザ言語検出による自動言語切り替え
