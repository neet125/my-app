import { useEffect, useMemo, useState } from "react";
import { getAlcohols, getFlavors } from "../../lib/api/master-client";
import type { FlavorItem, MasterItem } from "../../lib/api/master-types";
import { groupFlavorsByCategory } from "../../lib/flavor-groups";
import {
  createRecipe,
  RecipeCreateValidationError
} from "../../lib/api/recipe-create-client";
import type {
  RecipeCreateBody,
  RecipeCreateFieldErrors,
  RecipeSize
} from "../../lib/api/recipe-create-types";

type FlavorRow = {
  flavorId: string;
  gram: string;
};

type RecipePostScreenProps = {
  onBack: () => void;
  onPosted: () => void;
};

const MAX_FLAVOR_ROWS = 4;

const SIZE_OPTIONS: Array<{ label: string; value: RecipeSize }> = [
  { label: "ショート", value: "short" },
  { label: "レギュラー", value: "regular" },
  { label: "スペシャル", value: "special" }
];

const SIZE_GRAMS: Record<RecipeSize, number> = {
  regular: 12,
  short: 8,
  special: 15
};

function createEmptyFlavorRows(): FlavorRow[] {
  return Array.from({ length: MAX_FLAVOR_ROWS }, () => ({
    flavorId: "",
    gram: ""
  }));
}

function normalizeFieldErrors(fieldErrors: RecipeCreateFieldErrors) {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => {
      return Array.isArray(entry[1]) && entry[1].length > 0;
    })
  ) as RecipeCreateFieldErrors;
}

export function RecipePostScreen({ onBack, onPosted }: RecipePostScreenProps) {
  const [flavors, setFlavors] = useState<FlavorItem[]>([]);
  const [alcohols, setAlcohols] = useState<MasterItem[]>([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState(true);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RecipeCreateFieldErrors>({});

  const [name, setName] = useState("");
  const [size, setSize] = useState<RecipeSize | "">("");
  const [flavorRows, setFlavorRows] = useState<FlavorRow[]>(createEmptyFlavorRows);
  const [hasIceHose, setHasIceHose] = useState(false);
  const [hasAlcoholBottle, setHasAlcoholBottle] = useState(false);
  const [alcoholId, setAlcoholId] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMasters() {
      setIsLoadingMasters(true);
      setMasterError(null);

      try {
        const [flavorResponse, alcoholResponse] = await Promise.all([
          getFlavors(),
          getAlcohols()
        ]);

        if (!cancelled) {
          setFlavors(flavorResponse);
          setAlcohols(alcoholResponse);
        }
      } catch {
        if (!cancelled) {
          setMasterError("エラーが発生しました。やり直してください");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMasters(false);
        }
      }
    }

    void loadMasters();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFlavorCount = flavorRows.filter((row) => row.flavorId !== "").length;
  const totalGram = flavorRows.reduce((sum, row) => {
    const gram = Number(row.gram);
    return sum + (Number.isInteger(gram) && gram > 0 ? gram : 0);
  }, 0);
  const targetGram = size ? SIZE_GRAMS[size] : null;

  const frontFieldErrors = useMemo<RecipeCreateFieldErrors>(() => {
    const nextFieldErrors: RecipeCreateFieldErrors = {};
    const trimmedName = name.trim();
    const trimmedMemo = memo.trim();

    if (!trimmedName) {
      nextFieldErrors.name = ["レシピ名を入力してください"];
    }

    if (!size) {
      nextFieldErrors.size = ["サイズを選択してください"];
    }

    const selectedRows = flavorRows.filter((row) => row.flavorId !== "");

    if (selectedRows.length === 0) {
      nextFieldErrors.flavors = ["フレーバーを1つ以上選択してください"];
    } else {
      const duplicateCheck = new Set<string>();
      const flavorMessages: string[] = [];

      for (const row of selectedRows) {
        if (duplicateCheck.has(row.flavorId)) {
          flavorMessages.push("同じフレーバーは選択できません");
        }

        duplicateCheck.add(row.flavorId);

        const gram = Number(row.gram);

        if (!Number.isInteger(gram) || gram < 1) {
          flavorMessages.push("グラム数を入力してください");
        }
      }

      if (size && selectedRows.every((row) => Number.isInteger(Number(row.gram)) && Number(row.gram) >= 1)) {
        if (totalGram !== SIZE_GRAMS[size]) {
          flavorMessages.push("グラム合計をサイズ規定値に合わせてください");
        }
      }

      if (flavorMessages.length > 0) {
        nextFieldErrors.flavors = [...new Set(flavorMessages)];
      }
    }

    if (trimmedMemo.length > 30) {
      nextFieldErrors.memo = ["メモは30文字以内で入力してください"];
    }

    if (hasAlcoholBottle && !alcoholId) {
      nextFieldErrors.alcohol_id = ["アルコールを選択してください"];
    }

    return nextFieldErrors;
  }, [alcoholId, flavorRows, hasAlcoholBottle, memo, name, size, totalGram]);

  const displayedFieldErrors =
    Object.keys(fieldErrors).length > 0 ? fieldErrors : frontFieldErrors;
  const canSubmit =
    !isLoadingMasters &&
    !masterError &&
    Object.keys(frontFieldErrors).length === 0 &&
    !isSubmitting;

  function updateFlavorRow(index: number, patch: Partial<FlavorRow>) {
    setFlavorRows((currentRows) =>
      currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        const nextRow = { ...row, ...patch };

        if (patch.flavorId === "") {
          nextRow.gram = "";
        }

        return nextRow;
      })
    );
    setFieldErrors({});
    setSubmitMessage(null);
  }

  function handleSizeChange(nextSize: RecipeSize | "") {
    setSize(nextSize);
    setFlavorRows(createEmptyFlavorRows());
    setFieldErrors({});
    setSubmitMessage(null);
  }

  async function handleSubmit() {
    if (!canSubmit || !size) {
      return;
    }

    const body: RecipeCreateBody = {
      alcohol_id: hasAlcoholBottle ? Number(alcoholId) : null,
      flavors: flavorRows
        .filter((row) => row.flavorId !== "")
        .map((row) => ({
          flavor_id: Number(row.flavorId),
          gram: Number(row.gram)
        })),
      has_alcohol_bottle: hasAlcoholBottle,
      has_ice_hose: hasIceHose,
      memo: memo.trim() ? memo.trim() : null,
      name: name.trim(),
      size
    };

    setIsSubmitting(true);
    setFieldErrors({});
    setSubmitMessage(null);

    try {
      await createRecipe(body);
      onPosted();
    } catch (error) {
      if (error instanceof RecipeCreateValidationError) {
        setFieldErrors(normalizeFieldErrors(error.fieldErrors));
      } else {
        setSubmitMessage("エラーが発生しました。やり直してください");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Post Recipe</p>
          <h1>レシピ投稿画面</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          ホームへ戻る
        </button>
      </div>

      {isLoadingMasters ? <p>投稿に必要なデータを読み込んでいます。</p> : null}
      {masterError ? <p className="status-error">{masterError}</p> : null}

      {!isLoadingMasters && !masterError ? (
        <div className="detail-stack">
          <div className="form-block">
            <label className="field-label" htmlFor="recipe-name">
              レシピ名
            </label>
            <input
              className="field-input"
              id="recipe-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFieldErrors({});
                setSubmitMessage(null);
              }}
            />
            {displayedFieldErrors.name?.map((message) => (
              <p key={message} className="status-error">
                {message}
              </p>
            ))}
          </div>

          <div className="form-block">
            <label className="field-label" htmlFor="recipe-size">
              サイズ
            </label>
            <select
              className="field-input"
              id="recipe-size"
              value={size}
              onChange={(event) => {
                handleSizeChange(event.target.value as RecipeSize | "");
              }}
            >
              <option value="">選択してください</option>
              {SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {displayedFieldErrors.size?.map((message) => (
              <p key={message} className="status-error">
                {message}
              </p>
            ))}
          </div>

          <div className="detail-block">
            <h3 className="detail-heading">フレーバーと gram</h3>
            {flavorRows.map((row, index) => {
              const selectedFlavorIds = flavorRows
                .map((item, itemIndex) => (itemIndex === index ? "" : item.flavorId))
                .filter(Boolean);
              const availableFlavors = flavors.filter(
                (flavor) => !selectedFlavorIds.includes(String(flavor.id))
              );
              const flavorGroups = groupFlavorsByCategory(availableFlavors);

              return (
                <div className="flavor-row" key={`flavor-row-${index}`}>
                  <select
                    className="field-input"
                    value={row.flavorId}
                    disabled={!size}
                    onChange={(event) => {
                      updateFlavorRow(index, { flavorId: event.target.value });
                    }}
                  >
                    <option value="">フレーバー {index + 1}</option>
                    {flavorGroups.map((group) => (
                      <optgroup key={`${index}-${group.category}`} label={group.category}>
                        {group.items.map((flavor) => (
                          <option key={flavor.id} value={String(flavor.id)}>
                            {flavor.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    className="field-input gram-input"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="gram"
                    value={row.gram}
                    disabled={!row.flavorId}
                    onChange={(event) => {
                      updateFlavorRow(index, { gram: event.target.value });
                    }}
                  />
                </div>
              );
            })}
            {displayedFieldErrors.flavors?.map((message) => (
              <p key={message} className="status-error">
                {message}
              </p>
            ))}
            <p className="status-note">
              合計g数: {totalGram}
              {targetGram !== null ? ` / ${targetGram}` : ""}
            </p>
            {size ? (
              <p className="detail-subtle">サイズ変更時はフレーバーと gram をリセットします。</p>
            ) : (
              <p className="detail-subtle">サイズ選択後にフレーバーを入力できます。</p>
            )}
            <p className="detail-subtle">選択中フレーバー数: {selectedFlavorCount} / 4</p>
          </div>

          <div className="detail-block">
            <h3 className="detail-heading">オプション</h3>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={hasIceHose}
                onChange={(event) => {
                  setHasIceHose(event.target.checked);
                  setFieldErrors({});
                }}
              />
              <span>アイスホースあり</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={hasAlcoholBottle}
                onChange={(event) => {
                  const nextChecked = event.target.checked;
                  setHasAlcoholBottle(nextChecked);
                  setAlcoholId(nextChecked ? alcoholId : "");
                  setFieldErrors({});
                }}
              />
              <span>アルコールボトルあり</span>
            </label>
            <div className="form-block option-field">
              <label className="field-label" htmlFor="alcohol-id">
                アルコール種類
              </label>
              <select
                className="field-input"
                id="alcohol-id"
                value={alcoholId}
                disabled={!hasAlcoholBottle}
                onChange={(event) => {
                  setAlcoholId(event.target.value);
                  setFieldErrors({});
                }}
              >
                <option value="">選択してください</option>
                {alcohols.map((alcohol) => (
                  <option key={alcohol.id} value={String(alcohol.id)}>
                    {alcohol.name}
                  </option>
                ))}
              </select>
              {displayedFieldErrors.alcohol_id?.map((message) => (
                <p key={message} className="status-error">
                  {message}
                </p>
              ))}
            </div>
          </div>

          <div className="form-block">
            <label className="field-label" htmlFor="recipe-memo">
              メモ
            </label>
            <textarea
              className="field-input textarea-input"
              id="recipe-memo"
              value={memo}
              maxLength={30}
              onChange={(event) => {
                setMemo(event.target.value);
                setFieldErrors({});
                setSubmitMessage(null);
              }}
            />
            <p className="detail-subtle">文字数: {memo.length} / 30</p>
            {displayedFieldErrors.memo?.map((message) => (
              <p key={message} className="status-error">
                {message}
              </p>
            ))}
          </div>

          {submitMessage ? <p className="status-error">{submitMessage}</p> : null}

          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                void handleSubmit();
              }}
            >
              {isSubmitting ? "投稿中..." : "投稿"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
