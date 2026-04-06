import { useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { getFlavors } from "../../lib/api/master-client";
import type { FlavorItem } from "../../lib/api/master-types";
import { groupFlavorsByCategory } from "../../lib/flavor-groups";

type HomeScreenProps = {
  onOpenLogin: () => void;
  onOpenMyRecipes: () => void;
  onOpenPostRecipe: () => void;
  onSearch: (input: { flavorId: number; flavorName: string }) => void;
};

export function HomeScreen({
  onOpenLogin,
  onOpenMyRecipes,
  onOpenPostRecipe,
  onSearch
}: HomeScreenProps) {
  const { isAuthenticated } = useAuth();
  const [flavors, setFlavors] = useState<FlavorItem[]>([]);
  const [selectedFlavorId, setSelectedFlavorId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFlavors() {
      setIsLoading(true);

      try {
        const response = await getFlavors();

        if (!cancelled) {
          setFlavors(response);
          setErrorMessage(null);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("エラーが発生しました。やり直してください");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFlavors();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch() {
    if (!selectedFlavorId) {
      return;
    }

    const selectedFlavor = flavors.find((flavor) => String(flavor.id) === selectedFlavorId);

    if (!selectedFlavor) {
      setNoticeMessage("選択したフレーバーを確認できませんでした。");
      return;
    }

    onSearch({
      flavorId: selectedFlavor.id,
      flavorName: selectedFlavor.name
    });
  }

  function handleProtectedNavigation(targetName: "マイレシピ" | "投稿") {
    if (isAuthenticated) {
      if (targetName === "マイレシピ") {
        onOpenMyRecipes();
      } else {
        onOpenPostRecipe();
      }
      return;
    }

    setNoticeMessage(`${targetName}を利用するにはログインが必要です。`);
    onOpenLogin();
  }

  const flavorGroups = groupFlavorsByCategory(flavors);

  return (
    <section className="card">
      <p className="eyebrow">Home</p>
      <h1>ホーム画面</h1>
      <p className="lead">
        フレーバーを1つ選んで検索できます。検索と詳細閲覧は未ログインでも利用できます。
      </p>

      <div className="form-block">
        <label className="field-label" htmlFor="flavor-select">
          フレーバー選択
        </label>
        <select
          className="field-input"
          id="flavor-select"
          value={selectedFlavorId}
          onChange={(event) => {
            setSelectedFlavorId(event.target.value);
            setNoticeMessage(null);
          }}
          disabled={isLoading || !!errorMessage}
        >
          <option value="">選択してください</option>
          {flavorGroups.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.items.map((flavor) => (
                <option key={flavor.id} value={String(flavor.id)}>
                  {flavor.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {isLoading ? <p>フレーバー一覧を読み込んでいます。</p> : null}
        {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
      </div>

      <div className="button-row">
        <button
          className="primary-button"
          type="button"
          onClick={handleSearch}
          disabled={!selectedFlavorId}
        >
          検索
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => handleProtectedNavigation("マイレシピ")}
        >
          マイレシピ
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => handleProtectedNavigation("投稿")}
        >
          投稿
        </button>
      </div>

      {noticeMessage ? <p className="status-note">{noticeMessage}</p> : null}
    </section>
  );
}
