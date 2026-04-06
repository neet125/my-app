import { useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { getMyBookmarks, getMyRecipes } from "../../lib/api/recipe-client";
import type { RecipeSearchItem } from "../../lib/api/recipe-types";

type MyRecipesTab = "bookmarks" | "my-posts";

type MyRecipesScreenProps = {
  initialTab: MyRecipesTab;
  onBack: () => void;
  onOpenRecipe: (recipeId: number) => void;
};

export function MyRecipesScreen({
  initialTab,
  onBack,
  onOpenRecipe
}: MyRecipesScreenProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<MyRecipesTab>(initialTab);
  const [recipes, setRecipes] = useState<RecipeSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRecipes([]);
      setIsLoading(false);
      setErrorMessage("マイレシピを利用するにはログインが必要です。");
      return;
    }

    let cancelled = false;

    async function loadRecipes() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response =
          activeTab === "bookmarks" ? await getMyBookmarks() : await getMyRecipes();

        if (!cancelled) {
          setRecipes(response);
        }
      } catch {
        if (!cancelled) {
          setRecipes([]);
          setErrorMessage("エラーが発生しました。やり直してください");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipes();

    return () => {
      cancelled = true;
    };
  }, [activeTab, isAuthenticated]);

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="eyebrow">My Recipes</p>
          <h1>マイレシピ画面</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          ホームへ戻る
        </button>
      </div>

      <div className="tab-row">
        <button
          className={activeTab === "bookmarks" ? "tab-button tab-button-active" : "tab-button"}
          type="button"
          onClick={() => {
            setActiveTab("bookmarks");
          }}
        >
          保存済み
        </button>
        <button
          className={activeTab === "my-posts" ? "tab-button tab-button-active" : "tab-button"}
          type="button"
          onClick={() => {
            setActiveTab("my-posts");
          }}
        >
          自分の投稿
        </button>
      </div>

      {isLoading ? <p>一覧を読み込んでいます。</p> : null}
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && recipes.length === 0 ? (
        <p className="status-note">
          {activeTab === "bookmarks"
            ? "保存済みレシピはまだありません。"
            : "自分の投稿レシピはまだありません。"}
        </p>
      ) : null}

      {!isLoading && !errorMessage && recipes.length > 0 ? (
        <ul className="recipe-list">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <button
                className="recipe-list-item"
                type="button"
                onClick={() => {
                  onOpenRecipe(recipe.id);
                }}
              >
                <span className="recipe-title">{recipe.name}</span>
                <span className="recipe-flavors">
                  {recipe.flavors.map((flavor) => flavor.name).join(" / ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
