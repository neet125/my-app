type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonConfiguration = {
  shape?: "pill" | "rectangular";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  theme?: "outline" | "filled_blue" | "filled_black";
};

type GoogleInitConfiguration = {
  callback: (response: GoogleCredentialResponse) => void | Promise<void>;
  client_id: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: GoogleInitConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
        };
      };
    };
  }
}

export {};
