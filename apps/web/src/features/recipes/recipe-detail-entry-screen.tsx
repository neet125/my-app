import {
  bookmarkRecipe,
  deleteRecipe,
  getRecipeDetail,
  RecipeBookmarkConflictError,
  RecipeDeleteForbiddenError,
  RecipeDetailNotFoundError,
  unbookmarkRecipe
} from "../../lib/api/recipe-client";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import type { RecipeDetailResponse } from "../../lib/api/recipe-types";

type RecipeDetailEntryScreenProps = {
  backLabel: string;
  recipeId: number;
  onBack: () => void;
  onDeleted: () => void;
  onRequireLogin: () => void;
};

function hasBookmarkState(
  recipe: RecipeDetailResponse
): recipe is RecipeDetailResponse & { is_bookmarked: boolean } {
  return "is_bookmarked" in recipe;
}

export function RecipeDetailEntryScreen({
  backLabel,
  recipeId,
  onBack,
  onDeleted,
  onRequireLogin
}: RecipeDetailEntryScreenProps) {
  const { isAuthenticated, session } = useAuth();
  const [recipe, setRecipe] = useState<RecipeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarkSubmitting, setIsBookmarkSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [isUnbookmarkDialogOpen, setIsUnbookmarkDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookmarkNotice, setBookmarkNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipeDetail() {
      setIsLoading(true);
      setErrorMessage(null);
      setBookmarkNotice(null);

      try {
        const response = await getRecipeDetail(recipeId);

        if (!cancelled) {
          setRecipe(response);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof RecipeDetailNotFoundError) {
            setErrorMessage("レシピが見つかりません。");
          } else {
            setErrorMessage("エラーが発生しました。やり直してください");
          }

          setRecipe(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipeDetail();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const isOwnRecipe =
    isAuthenticated &&
    session.authenticated &&
    !!recipe &&
    session.user.name === recipe.creator_name;
  const isBookmarked = recipe && hasBookmarkState(recipe) ? recipe.is_bookmarked : false;
  const bookmarkIcon = isBookmarked ? "★" : "☆";

  async function handleBookmarkClick() {
    if (!recipe || isBookmarkSubmitting || isUnbookmarkDialogOpen) {
      return;
    }

    if (!isAuthenticated) {
      setBookmarkNotice("保存するにはログインが必要です。");
      onRequireLogin();
      return;
    }

    if (isBookmarked) {
      setBookmarkNotice(null);
      setIsUnbookmarkDialogOpen(true);
      return;
    }

    setIsBookmarkSubmitting(true);
    setBookmarkNotice(null);

    try {
      await bookmarkRecipe(recipe.id);
      setRecipe((currentRecipe) => {
        if (!currentRecipe) {
          return currentRecipe;
        }

        return {
          ...currentRecipe,
          is_bookmarked: true
        };
      });
    } catch (error) {
      if (error instanceof RecipeBookmarkConflictError) {
        setRecipe((currentRecipe) => {
          if (!currentRecipe) {
            return currentRecipe;
          }

          return {
            ...currentRecipe,
            is_bookmarked: true
          };
        });
        return;
      }

      if (error instanceof RecipeDetailNotFoundError) {
        setErrorMessage("レシピが見つかりません。");
        setRecipe(null);
        return;
      }

      setBookmarkNotice("エラーが発生しました。やり直してください");
    } finally {
      setIsBookmarkSubmitting(false);
    }
  }

  async function handleUnbookmarkConfirm() {
    if (!recipe || !isBookmarked || isBookmarkSubmitting) {
      return;
    }

    setIsBookmarkSubmitting(true);
    setBookmarkNotice(null);

    try {
      await unbookmarkRecipe(recipe.id);
      setRecipe((currentRecipe) => {
        if (!currentRecipe || !hasBookmarkState(currentRecipe)) {
          return currentRecipe;
        }

        return {
          ...currentRecipe,
          is_bookmarked: false
        };
      });
      setIsUnbookmarkDialogOpen(false);
    } catch (error) {
      if (error instanceof RecipeDetailNotFoundError) {
        setErrorMessage("レシピが見つかりません。");
        setRecipe(null);
        setIsUnbookmarkDialogOpen(false);
        return;
      }

      setBookmarkNotice("エラーが発生しました。やり直してください");
    } finally {
      setIsBookmarkSubmitting(false);
    }
  }

  async function handleDeleteClick() {
    if (!recipe || !isOwnRecipe || isDeleteSubmitting) {
      return;
    }

    if (!window.confirm("このレシピを削除しますか？")) {
      return;
    }

    setIsDeleteSubmitting(true);
    setBookmarkNotice(null);

    try {
      await deleteRecipe(recipe.id);
      onDeleted();
    } catch (error) {
      if (error instanceof RecipeDetailNotFoundError) {
        setErrorMessage("レシピが見つかりません。");
        setRecipe(null);
        return;
      }

      if (error instanceof RecipeDeleteForbiddenError) {
        setBookmarkNotice("投稿者本人のみ削除できます。");
        return;
      }

      setBookmarkNotice("エラーが発生しました。やり直してください");
    } finally {
      setIsDeleteSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Recipe Detail</p>
          <h1>レシピ詳細画面</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          {backLabel}
        </button>
      </div>

      {isLoading ? <p>レシピ詳細を読み込んでいます。</p> : null}
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && recipe ? (
        <div className="detail-stack">
          <div className="detail-header-row">
            <div>
              <h2 className="detail-title">{recipe.name}</h2>
              <p className="detail-subtle">作成者: {recipe.creator_name}</p>
            </div>
            <button
              aria-label="保存状態"
              className="bookmark-button"
              type="button"
              disabled={isBookmarkSubmitting}
              onClick={() => {
                void handleBookmarkClick();
              }}
            >
              {isBookmarkSubmitting ? "..." : bookmarkIcon}
            </button>
          </div>

          <div className="detail-grid">
            <div className="detail-block">
              <h3 className="detail-heading">サイズ</h3>
              <p>{recipe.size}</p>
            </div>

            <div className="detail-block">
              <h3 className="detail-heading">フレーバー</h3>
              <ul className="detail-list">
                {recipe.flavors.map((flavor) => (
                  <li key={flavor.id}>
                    {flavor.name}: {flavor.gram}g
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-block">
              <h3 className="detail-heading">オプション</h3>
              <ul className="detail-list">
                <li>アイスホース: {recipe.has_ice_hose ? "あり" : "なし"}</li>
                <li>アルコールボトル: {recipe.has_alcohol_bottle ? "あり" : "なし"}</li>
                {recipe.has_alcohol_bottle ? (
                  <li>アルコール名: {recipe.alcohol_name ?? "未設定"}</li>
                ) : null}
              </ul>
            </div>

            <div className="detail-block">
              <h3 className="detail-heading">メモ</h3>
              <p>{recipe.memo && recipe.memo.trim() ? recipe.memo : "なし"}</p>
            </div>
          </div>

          {bookmarkNotice ? <p className="status-note">{bookmarkNotice}</p> : null}

          {isUnbookmarkDialogOpen ? (
            <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="unbookmark-title">
              <p className="dialog-title" id="unbookmark-title">
                保存を解除しますか？
              </p>
              <div className="button-row">
                <button
                  className="primary-button"
                  type="button"
                  disabled={isBookmarkSubmitting}
                  onClick={() => {
                    void handleUnbookmarkConfirm();
                  }}
                >
                  {isBookmarkSubmitting ? "解除中..." : "はい"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isBookmarkSubmitting}
                  onClick={() => {
                    setIsUnbookmarkDialogOpen(false);
                  }}
                >
                  いいえ
                </button>
              </div>
            </div>
          ) : null}

          {isOwnRecipe ? (
            <div className="detail-block detail-block-muted">
              <h3 className="detail-heading">投稿者向け操作</h3>
              <p>削除するとこのレシピに紐づく情報もあわせて削除されます。</p>
              <button
                className="danger-button"
                type="button"
                disabled={isDeleteSubmitting}
                onClick={() => {
                  void handleDeleteClick();
                }}
              >
                {isDeleteSubmitting ? "削除中..." : "このレシピを削除"}
              </button>
              {isDeleteSubmitting ? (
                <p className="detail-subtle">削除が完了するまでお待ちください。</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
