import { useCallback, useRef, useState } from "react";
import { Platform, TurboModuleRegistry } from "react-native";

type GoogleSignInModule =
  typeof import("@react-native-google-signin/google-signin");

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const isConfigured = Boolean(
  webClientId && (Platform.OS !== "ios" || iosClientId),
);
const hasNativeGoogleSignin = Boolean(
  TurboModuleRegistry.get("RNGoogleSignin"),
);
let googleSigninConfigured = false;

async function getGoogleSignInModule() {
  if (!hasNativeGoogleSignin) {
    throw new Error(
      "Bản ứng dụng hiện tại chưa có Google Sign-In. Vui lòng cài development build hoặc bản preview mới.",
    );
  }

  const googleSignInModule: GoogleSignInModule =
    await import("@react-native-google-signin/google-signin");

  if (!googleSigninConfigured) {
    googleSignInModule.GoogleSignin.configure({
      webClientId,
      ...(Platform.OS === "ios" ? { iosClientId } : {}),
      offlineAccess: false,
    });
    googleSigninConfigured = true;
  }

  return googleSignInModule;
}

function getGoogleSignInError(
  error: unknown,
  googleSignInModule: GoogleSignInModule,
) {
  const { isErrorWithCode, statusCodes } = googleSignInModule;

  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return new Error(
        "Google Play Services chưa có hoặc đã quá cũ. Vui lòng cập nhật rồi thử lại.",
      );
    }

    if (error.code === statusCodes.IN_PROGRESS) {
      return new Error("Đăng nhập Google đang được xử lý. Vui lòng chờ.");
    }

    if (error.code === statusCodes.NULL_PRESENTER) {
      return new Error(
        "Không thể mở cửa sổ đăng nhập Google. Vui lòng thử lại.",
      );
    }
  }

  return new Error(
    "Không thể đăng nhập bằng Google. Vui lòng kiểm tra kết nối và thử lại.",
  );
}

export function useGoogleOAuth(
  onGoogleToken: (idToken: string) => Promise<boolean>,
) {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);

  const signInWithGoogle = useCallback(async () => {
    if (!hasNativeGoogleSignin) {
      throw new Error(
        "Bản ứng dụng hiện tại chưa có Google Sign-In. Vui lòng cài development build hoặc bản preview mới.",
      );
    }

    if (!isConfigured) {
      throw new Error(
        Platform.OS === "ios"
          ? "Google OAuth chưa được cấu hình cho iOS. Hãy kiểm tra Web Client ID và iOS Client ID."
          : "Google OAuth chưa được cấu hình. Hãy kiểm tra Web Client ID.",
      );
    }

    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    let googleSignInModule: GoogleSignInModule | null = null;

    try {
      googleSignInModule = await getGoogleSignInModule();
      const {
        GoogleSignin,
        isCancelledResponse,
        isErrorWithCode,
        isSuccessResponse,
        statusCodes,
      } = googleSignInModule;

      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) return;
      if (!isSuccessResponse(response)) return;

      const idToken = response.data.idToken;

      if (!idToken) {
        throw new Error(
          "Google không trả về mã xác thực. Vui lòng kiểm tra cấu hình OAuth.",
        );
      }

      await onGoogleToken(idToken);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Google không trả về mã xác thực. Vui lòng kiểm tra cấu hình OAuth."
      ) {
        throw error;
      }

      if (!googleSignInModule) {
        throw new Error(
          "Không thể tải Google Sign-In trong bản ứng dụng hiện tại. Vui lòng cài lại development build hoặc bản preview mới.",
        );
      }

      const { isErrorWithCode, statusCodes } = googleSignInModule;

      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return;
      }

      throw getGoogleSignInError(error, googleSignInModule);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [onGoogleToken]);

  return {
    googleLoading: loading,
    googleReady: isConfigured && hasNativeGoogleSignin,
    signInWithGoogle,
  };
}
