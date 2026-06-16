import { useCallback, useEffect, useMemo, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

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

  const platformClientId = Platform.select({
    android: googleClientIds.androidClientId,
    ios: googleClientIds.iosClientId,
    web: googleClientIds.webClientId,
    default: googleClientIds.webClientId,
  });

  const isConfigured = Boolean(platformClientId);

  const requestConfig = useMemo(
    () => ({
      webClientId: googleClientIds.webClientId || fallbackClientId,
      androidClientId: googleClientIds.androidClientId || fallbackClientId,
      iosClientId: googleClientIds.iosClientId || fallbackClientId,
      clientId: platformClientId || fallbackClientId,
      selectAccount: true,
    }),
    [platformClientId],
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
        "Google OAuth chưa được cấu hình cho nền tảng này. Hãy thêm EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID khi chạy trên Android.",
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
