export const publicScreens = ["ログイン画面", "ホーム画面", "検索結果一覧画面", "レシピ詳細画面"] as const;

export const privateScreens = ["マイレシピ画面", "レシピ投稿画面"] as const;

export function canAccessPrivateScreen(isAuthenticated: boolean) {
  return isAuthenticated;
}
