import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const fallbackClientId = "missing-google-client-id.apps.googleusercontent.com";

export function useGoogleOAuth(
  onGoogleToken: (idToken: string) => Promise<boolean>,
) {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);
  const isConfigured = Boolean(webClientId);

  const requestConfig = useMemo(
    () => ({
      webClientId: webClientId || fallbackClientId,
      clientId: webClientId || fallbackClientId,
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
        inFlightRef.current = false;
        setLoading(false);
        return;
      }

      try {
        await onGoogleToken(idToken);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    };

    void handleResponse();
  }, [onGoogleToken, response]);

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured || !request) {
      throw new Error(
        "Google OAuth chưa được cấu hình cho web. Hãy kiểm tra EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
      );
    }

    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);

    try {
      const result = await promptAsync();

      if (result.type !== "success") {
        inFlightRef.current = false;
        setLoading(false);
      }
    } catch (error) {
      inFlightRef.current = false;
      setLoading(false);
      throw error;
    }
  }, [isConfigured, promptAsync, request]);

  return {
    googleLoading: loading,
    googleReady: isConfigured && Boolean(request),
    signInWithGoogle,
  };
}
