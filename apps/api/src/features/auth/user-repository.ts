import { getPool } from "../../db/pool";

export type AuthUser = {
  googleUserId: string;
  id: string;
  name: string;
};

export async function upsertUserFromGoogleLogin(input: {
  googleUserId: string;
  name: string;
}): Promise<AuthUser> {
  const result = await getPool().query<AuthUser>(
    `
      INSERT INTO users (google_user_id, name)
      VALUES ($1, $2)
      ON CONFLICT (google_user_id)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id, google_user_id AS "googleUserId", name
    `,
    [input.googleUserId, input.name]
  );

  return result.rows[0];
}
