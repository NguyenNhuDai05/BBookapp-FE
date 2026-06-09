import { useCallback, useEffect, useMemo, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const googleClientIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

const fallbackClientId = "missing-google-client-id.apps.googleusercontent.com";

export function useGoogleOAuth(
  onGoogleToken: (idToken: string) => Promise<boolean>,
) {
  const [loading, setLoading] = useState(false);
  const isConfigured = Boolean(
    googleClientIds.webClientId ||
      googleClientIds.androidClientId ||
      googleClientIds.iosClientId,
  );

  const requestConfig = useMemo(
    () => ({
      ...googleClientIds,
      clientId:
        googleClientIds.webClientId ||
        googleClientIds.androidClientId ||
        googleClientIds.iosClientId ||
        fallbackClientId,
      selectAccount: true,
    }),
    [],
  );

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest(requestConfig);

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type !== "success") return;

      const idToken =
        response.params?.id_token || response.authentication?.idToken;

      if (!idToken) {
        setLoading(false);
        return;
      }

      await onGoogleToken(idToken);
      setLoading(false);
    };

    handleResponse();
  }, [onGoogleToken, response]);

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured || !request) {
      throw new Error(
        "Google OAuth chua duoc cau hinh. Hay them EXPO_PUBLIC_GOOGLE_*_CLIENT_ID vao moi truong Expo.",
      );
    }

    setLoading(true);
    const result = await promptAsync();

    if (result.type !== "success") {
      setLoading(false);
    }
  }, [isConfigured, promptAsync, request]);

  return {
    googleLoading: loading,
    googleReady: isConfigured && Boolean(request),
    signInWithGoogle,
  };
}
