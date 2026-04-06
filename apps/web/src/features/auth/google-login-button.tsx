import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-context";
import { GOOGLE_CLIENT_ID } from "../../lib/env";

const GOOGLE_SCRIPT_ID = "google-identity-services";

function loadGoogleScript() {
  if (document.getElementById(GOOGLE_SCRIPT_ID)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script."));
    document.head.appendChild(script);
  });
}

export function GoogleLoginButton() {
  const { signInWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;

    if (!clientId) {
      setErrorMessage("VITE_GOOGLE_CLIENT_ID is not configured.");
      return;
    }

    let cancelled = false;

    void loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) {
          return;
        }

        containerRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          callback: async (response) => {
            if (!response.credential) {
              setErrorMessage("Google credential was not returned.");
              return;
            }

            try {
              setErrorMessage(null);
              await signInWithGoogle(response.credential);
            } catch {
              setErrorMessage("ログインに失敗しました。やり直してください。");
            }
          },
          client_id: clientId
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          shape: "pill",
          size: "large",
          text: "signin_with",
          theme: "outline"
        });
      })
      .catch(() => {
        setErrorMessage("Google ログインの初期化に失敗しました。");
      });

    return () => {
      cancelled = true;
    };
  }, [signInWithGoogle]);

  return (
    <div className="login-button-block">
      <div ref={containerRef} />
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
    </div>
  );
}
