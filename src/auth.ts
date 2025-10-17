import { InteractionRequiredAuthError } from "@azure/msal-browser";

// auth.ts
export async function getGraphToken(): Promise<string | null> {
  try {
    const msalConfig = {
      auth: {
        clientId: import.meta.env.VITE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${
          import.meta.env.VITE_TENANT_ID
        }`,
        redirectUri: import.meta.env.VITE_REDIRECT_URL,
      },
    };
    const msalInstance = new (
      await import("@azure/msal-browser")
    ).PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    const accounts = msalInstance.getAllAccounts();
    let account = accounts[0];

    if (!account) {
      const loginResponse = await msalInstance.loginPopup({
        scopes: ["Files.ReadWrite"],
      });
      account = loginResponse.account;
    }

    let tokenResponse;
    try {
      tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ["Files.ReadWrite"],
        account,
      });
    } catch (err: unknown) {
      if (err instanceof InteractionRequiredAuthError) {
        tokenResponse = await msalInstance.acquireTokenPopup({
          scopes: ["Files.ReadWrite"],
        });
      } else {
        throw err;
      }
    }

    localStorage.setItem("loginToken", tokenResponse.accessToken);

    return tokenResponse.accessToken;
  } catch (err) {
    console.error("Graph 로그인 실패:", err);
    return null;
  }
}
