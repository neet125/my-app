export type AuthSession =
  | {
      authenticated: false;
      user: null;
    }
  | {
      authenticated: true;
      user: {
        id: string;
        name: string;
      };
    };
