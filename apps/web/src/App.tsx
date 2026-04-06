import { useState } from "react";
import { LoginScreen } from "./features/auth/login-screen";
import { HomeScreen } from "./features/home/home-screen";
import { MyRecipesScreen } from "./features/recipes/my-recipes-screen";
import { RecipeDetailEntryScreen } from "./features/recipes/recipe-detail-entry-screen";
import { RecipePostScreen } from "./features/recipes/recipe-post-screen";
import { SearchResultsScreen } from "./features/recipes/search-results-screen";

type ScreenState =
  | {
      name: "home";
    }
  | {
      name: "login";
    }
  | {
      initialTab: "bookmarks" | "my-posts";
      name: "my-recipes";
    }
  | {
      flavorId: number;
      flavorName: string;
      name: "search-results";
    }
  | {
      name: "recipe-detail";
      recipeId: number;
      returnTo:
        | {
            initialTab: "bookmarks" | "my-posts";
            name: "my-recipes";
          }
        | {
            flavorId: number;
            flavorName: string;
            name: "search-results";
          };
    }
  | {
      name: "recipe-post";
    };

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({
    name: "home"
  });

  return (
    <main className="app-shell">
      {screen.name === "home" ? (
        <HomeScreen
          onOpenLogin={() => {
            setScreen({ name: "login" });
          }}
          onOpenMyRecipes={() => {
            setScreen({
              initialTab: "bookmarks",
              name: "my-recipes"
            });
          }}
          onOpenPostRecipe={() => {
            setScreen({
              name: "recipe-post"
            });
          }}
          onSearch={({ flavorId, flavorName }) => {
            setScreen({
              flavorId,
              flavorName,
              name: "search-results"
            });
          }}
        />
      ) : null}

      {screen.name === "my-recipes" ? (
        <MyRecipesScreen
          initialTab={screen.initialTab}
          onBack={() => {
            setScreen({ name: "home" });
          }}
          onOpenRecipe={(recipeId) => {
            setScreen({
              name: "recipe-detail",
              recipeId,
              returnTo: {
                initialTab: screen.initialTab,
                name: "my-recipes"
              }
            });
          }}
        />
      ) : null}

      {screen.name === "search-results" ? (
        <SearchResultsScreen
          flavorId={screen.flavorId}
          flavorName={screen.flavorName}
          onBack={() => {
            setScreen({ name: "home" });
          }}
          onOpenRecipe={(recipeId) => {
            setScreen({
              name: "recipe-detail",
              recipeId,
              returnTo: {
                flavorId: screen.flavorId,
                flavorName: screen.flavorName,
                name: "search-results"
              }
            });
          }}
        />
      ) : null}

      {screen.name === "recipe-detail" ? (
        <RecipeDetailEntryScreen
          backLabel={screen.returnTo.name === "search-results" ? "検索結果一覧へ戻る" : "マイレシピへ戻る"}
          recipeId={screen.recipeId}
          onBack={() => {
            setScreen(screen.returnTo);
          }}
          onDeleted={() => {
            setScreen({
              initialTab: "my-posts",
              name: "my-recipes"
            });
          }}
          onRequireLogin={() => {
            setScreen({ name: "login" });
          }}
        />
      ) : null}

      {screen.name === "recipe-post" ? (
        <RecipePostScreen
          onBack={() => {
            setScreen({ name: "home" });
          }}
          onPosted={() => {
            setScreen({
              initialTab: "my-posts",
              name: "my-recipes"
            });
          }}
        />
      ) : null}

      {screen.name === "login" ? (
        <LoginScreen
          onBackHome={() => {
            setScreen({ name: "home" });
          }}
        />
      ) : null}
    </main>
  );
}
