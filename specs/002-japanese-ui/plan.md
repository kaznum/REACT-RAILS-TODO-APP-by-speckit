# Implementation Plan: Japanese UI Localization

**Branch**: `002-japanese-ui` | **Date**: 2025-10-09 | **Spec**: [spec.md](./spec.md)
**Input**: "アプリケーションのUIは日本語とする。メッセージも日本語で表示する。"

## Summary

既存のReact TODO管理アプリケーションの全てのUI要素とメッセージを日本語に翻訳します。ハードコードされた英語文字列を定数ファイルに集約し、日本語テキストに置き換えます。

## Technical Context

**Language/Version**: JavaScript/ES6+ (React 18), Ruby 3.x (Rails 7.1 - バックエンドは変更なし)
**Primary Dependencies**: React 18 (既存), 追加ライブラリ不要
**Approach**: 定数ファイルによる翻訳管理（i18nライブラリは使用しない - シンプルさ優先）
**Testing**: 既存のコンポーネントテストは変更不要（表示内容のみ変更）
**Target Platform**: Web browser (変更なし)
**Scope**: フロントエンドのみ（バックエンドは英語のまま）

## Constitution Check

✅ **Code Quality**: 既存のコード品質基準を維持（リファクタリングのみ）
✅ **Test-First Development**: N/A（既存機能の翻訳のみ、新機能追加なし）
✅ **UX Consistency**: 既存のUIコンポーネント構造を維持
✅ **API Contract Stability**: バックエンドAPIは変更なし
⚠️ **Automated Testing**: 既存テストは英語のまま（日本語テストは追加しない - 複雑さ回避）

### Complexity Justification

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| テストの日本語化スキップ | テスト自体は技術的なものであり、開発者が理解できればよい | テストを日本語化すると保守コストが増加し、国際化時に英語に戻す必要がある |

## Project Structure

### Documentation (this feature)

```
specs/002-japanese-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output (翻訳管理アプローチ)
└── quickstart.md        # Phase 1 output (実装手順)
```

### Source Code Modifications

```
frontend/src/
├── constants/
│   └── messages.js      # NEW: 全ての日本語メッセージ定数
├── utils/
│   └── dateFormat.js    # NEW: 日本語日付フォーマット関数
├── components/
│   ├── auth/
│   │   ├── LoginPage.jsx          # MODIFY: messages.jsを使用
│   │   └── OAuthCallback.jsx      # MODIFY: messages.jsを使用
│   ├── dashboard/
│   │   └── Dashboard.jsx          # MODIFY: messages.jsを使用
│   ├── todos/
│   │   ├── TodoList.jsx           # MODIFY: messages.jsを使用
│   │   ├── TodoItem.jsx           # MODIFY: messages.jsを使用、日付フォーマット
│   │   ├── TodoForm.jsx           # MODIFY: messages.jsを使用
│   │   └── EmptyState.jsx         # MODIFY: messages.jsを使用
│   └── common/
│       ├── Button.jsx             # NO CHANGE: props経由で表示
│       ├── Checkbox.jsx           # NO CHANGE: props経由で表示
│       ├── Modal.jsx              # NO CHANGE: props経由で表示
│       └── DatePicker.jsx         # MODIFY: labels使用
└── hooks/
    └── useTodos.js                # MODIFY: エラーメッセージを日本語化
```

**Structure Decision**: 既存のReact/Railsウェブアプリケーション構造を維持。フロントエンドのみ修正。

## Phase 0: Research

**Output**: research.md

### Research Tasks

1. **翻訳管理アプローチ**:
   - 決定: 単一の`messages.js`定数ファイル
   - 理由: アプリケーションが小規模（~20コンポーネント）、単一言語のみ、i18nライブラリのオーバーヘッド不要
   - 代替案（却下）: react-i18next → 多言語切り替えが不要なため過剰

2. **日付フォーマット**:
   - 決定: カスタム`dateFormat.js`ユーティリティ
   - 理由: `Intl.DateTimeFormat`のネイティブサポート、ライブラリ不要
   - フォーマット: "2025年10月9日" (YYYY年MM月DD日)

3. **優先度マッピング**:
   - 決定: messages.jsに`PRIORITY = { high: '高', medium: '中', low: '低' }`
   - 理由: バックエンドは'high'/'medium'/'low'を返すため、フロントエンドでマッピング

## Phase 1: Design

**Output**: quickstart.md

### Implementation Steps

1. **Create messages.js** (~50 strings):
   ```javascript
   export const MESSAGES = {
     auth: {
       signInWithGoogle: 'Googleでログイン',
       signOut: 'ログアウト',
       welcome: 'ようこそ'
     },
     dashboard: {
       title: 'TODOマネージャー',
       myTodos: 'マイTODO',
       addTodo: 'TODO追加'
     },
     // ... 他のカテゴリ
   };
   ```

2. **Create dateFormat.js**:
   ```javascript
   export const formatJapaneseDate = (dateString) => {
     if (!dateString) return '期限なし';
     const date = new Date(dateString);
     return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
   };
   ```

3. **Update Components** (12 files):
   - Import `MESSAGES` and `formatJapaneseDate`
   - Replace hardcoded strings
   - Update date rendering

4. **Verify**: Manual testing of all screens

### Translation Coverage

- Authentication: 3 strings
- Dashboard: 6 strings
- TODO Form: 15 strings
- Validation: 8 strings
- Actions: 5 strings
- Status: 8 strings
- Filters: 4 strings
- Empty States: 3 strings

**Total**: ~52 strings to translate

## Timeline

- Phase 0 (Research): Complete (simple approach, no unknowns)
- Phase 1 (Implementation): 2-3 hours
  - messages.js creation: 30 min
  - dateFormat.js creation: 15 min
  - Component updates: 90 min
  - Testing: 30 min
