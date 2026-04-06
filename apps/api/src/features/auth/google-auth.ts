import { OAuth2Client } from "google-auth-library";

type GoogleProfile = {
  googleUserId: string;
  name: string;
};

let client: OAuth2Client | null = null;

function getGoogleClient() {
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  return client;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error("GOOGLE_CLIENT_ID is required.");
  }

  const ticket = await getGoogleClient().verifyIdToken({
    idToken: credential,
    audience: googleClientId
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.name?.trim()) {
    throw new Error("Invalid Google credential payload.");
  }

  return {
    googleUserId: payload.sub,
    name: payload.name.trim()
  };
}
