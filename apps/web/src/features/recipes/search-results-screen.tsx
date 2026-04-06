import { useEffect, useState } from "react";
import { searchRecipesByFlavorId } from "../../lib/api/recipe-client";
import type { RecipeSearchItem } from "../../lib/api/recipe-types";

type SearchResultsScreenProps = {
  flavorId: number;
  flavorName: string;
  onBack: () => void;
  onOpenRecipe: (recipeId: number) => void;
};

export function SearchResultsScreen({
  flavorId,
  flavorName,
  onBack,
  onOpenRecipe
}: SearchResultsScreenProps) {
  const [recipes, setRecipes] = useState<RecipeSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipes() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await searchRecipesByFlavorId(flavorId);

        if (!cancelled) {
          setRecipes(response);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("エラーが発生しました。やり直してください");
          setRecipes([]);
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
  }, [flavorId]);

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Search Results</p>
          <h1>検索結果一覧画面</h1>
          <p className="lead">選択中のフレーバー: {flavorName}</p>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          ホームへ戻る
        </button>
      </div>

      {isLoading ? <p>検索結果を読み込んでいます。</p> : null}
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && recipes.length === 0 ? (
        <p className="status-note">該当するレシピはまだありません。</p>
      ) : null}

      {!isLoading && !errorMessage && recipes.length > 0 ? (
        <ul className="recipe-list">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <button
                className="recipe-list-item"
                type="button"
                onClick={() => onOpenRecipe(recipe.id)}
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
