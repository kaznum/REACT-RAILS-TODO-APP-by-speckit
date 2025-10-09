// 日本語メッセージ定数

export const MESSAGES = {
  auth: {
    signInWithGoogle: 'Googleでログイン',
    signOut: 'ログアウト',
    welcome: 'ようこそ',
    loggingIn: 'ログイン中...',
    authenticationFailed: '認証に失敗しました'
  },

  dashboard: {
    title: 'TODOマネージャー',
    myTodos: 'マイTODO',
    addTodo: 'TODO追加',
    loading: 'TODO読み込み中...',
    error: 'TODOの読み込みに失敗しました'
  },

  todoForm: {
    createTitle: '新しいTODO作成',
    editTitle: 'TODO編集',
    nameLabel: 'TODO名',
    namePlaceholder: 'TODOを入力してください',
    priorityLabel: '優先度',
    deadlineLabel: '期限',
    saveButton: '保存',
    cancelButton: 'キャンセル',
    createButton: 'TODO作成',
    updateButton: 'TODO更新'
  },

  priority: {
    high: '高',
    medium: '中',
    low: '低',
    selectPlaceholder: '優先度を選択'
  },

  validation: {
    nameRequired: '名前は必須です',
    nameMaxLength: '名前は255文字以内で入力してください',
    priorityRequired: '優先度は必須です',
    deadlineRequired: '期限は必須です',
    saveFailed: 'TODOの保存に失敗しました。もう一度お試しください。'
  },

  actions: {
    delete: '削除',
    edit: '編集',
    confirmDelete: 'このTODOを削除してもよろしいですか？',
    yes: 'はい',
    no: 'いいえ'
  },

  status: {
    completed: '完了',
    incomplete: '未完了',
    noDeadline: '期限なし'
  },

  filters: {
    all: '全て',
    high: '高',
    medium: '中',
    low: '低'
  },

  emptyState: {
    noTodos: 'まだTODOがありません',
    getStarted: '最初のTODOを作成して始めましょう',
    createFirst: '最初のTODOを作成'
  },

  errors: {
    loadFailed: 'TODOの読み込みに失敗しました',
    createFailed: 'TODOの作成に失敗しました',
    updateFailed: 'TODOの更新に失敗しました',
    deleteFailed: 'TODOの削除に失敗しました',
    toggleFailed: 'TODOの状態変更に失敗しました'
  }
};
