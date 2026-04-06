import { useEffect } from "react";
import { GoogleLoginButton } from "./google-login-button";
import { useAuth } from "./auth-context";

type LoginScreenProps = {
  onBackHome: () => void;
};

export function LoginScreen({ onBackHome }: LoginScreenProps) {
  const { isAuthenticated, isLoading, session } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      onBackHome();
    }
  }, [isAuthenticated, onBackHome]);

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Login</p>
          <h1>Googleログイン</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onBackHome}>
          ホームへ戻る
        </button>
      </div>
      <p className="lead">
        ログインすると、投稿・保存・マイレシピ画面を利用できます。
      </p>
      {isLoading ? <p>ログイン状態を確認しています。</p> : null}
      {isAuthenticated ? (
        <p className="status-ok">{session.user?.name ?? "ユーザー"} としてログイン済みです。</p>
      ) : (
        <GoogleLoginButton />
      )}
    </section>
  );
}
