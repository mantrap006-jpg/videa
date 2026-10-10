import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

const WEBSITE_URL = "https://videa-khaki.vercel.app";

export default function App() {
  const webView = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);

  const goBack = useCallback(() => {
    if (canGoBack && webView.current) {
      webView.current.goBack();
      return true;
    }
    return false;
  }, [canGoBack]);

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", goBack);
    return () => subscription.remove();
  }, [goBack]);

  const reload = () => {
    setHasError(false);
    setLoading(true);
    webView.current?.reload();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#101827" />
      <ExpoStatusBar style="light" backgroundColor="#101827" />
      <View style={styles.topBar}>
        <View style={styles.logoMark}><Text style={styles.logoMarkText}>V</Text></View>
        <View style={styles.brandCopy}>
          <Text style={styles.brand}>VIDEA</Text>
          <Text style={styles.tagline}>Watch. Discover. Earn.</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh Videa"
          onPress={reload}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading && !hasError && (
        <View style={styles.loadingBar}>
          <View style={[styles.loadingProgress, { width: `${Math.max(8, progress * 100)}%` }]} />
        </View>
      )}

      {hasError ? (
        <View style={styles.errorScreen}>
          <View style={styles.errorIcon}><Text style={styles.errorIconText}>!</Text></View>
          <Text style={styles.errorTitle}>You're offline</Text>
          <Text style={styles.errorMessage}>Videa couldn't load. Check your internet connection and try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={reload} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webView}
          source={{ uri: WEBSITE_URL }}
          style={styles.webView}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          onLoadStart={() => { setLoading(true); setHasError(false); }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setHasError(true); }}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 500) setHasError(true);
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          pullToRefreshEnabled={Platform.OS === "android"}
          originWhitelist={["https://*", "http://*"]}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webLoading}>
              <ActivityIndicator size="large" color="#6D7CFF" />
              <Text style={styles.loadingText}>Loading Videa…</Text>
            </View>
          )}
        />
      )}
      {loading && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#6D7CFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#101827" },
  topBar: { height: 62, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#101827", borderBottomWidth: 1, borderBottomColor: "#263247" },
  logoMark: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#6D7CFF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoMarkText: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  brandCopy: { flex: 1 },
  brand: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  tagline: { color: "#A8B4C8", fontSize: 11, marginTop: 1 },
  refreshButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#1C2940", alignItems: "center", justifyContent: "center" },
  refreshText: { color: "#FFFFFF", fontSize: 25, lineHeight: 29 },
  loadingBar: { height: 2, backgroundColor: "#263247" },
  loadingProgress: { height: 2, backgroundColor: "#6D7CFF" },
  webView: { flex: 1, backgroundColor: "#F7F9FC" },
  webLoading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#101827" },
  loadingText: { color: "#D9E2F2", marginTop: 12, fontSize: 14 },
  loadingOverlay: { position: "absolute", top: 72, right: 16, padding: 8, borderRadius: 16, backgroundColor: "rgba(16,24,39,0.88)" },
  errorScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#F7F9FC" },
  errorIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: "#E8EBFF", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  errorIconText: { fontSize: 30, fontWeight: "800", color: "#5665E8" },
  errorTitle: { color: "#172033", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  errorMessage: { color: "#637087", textAlign: "center", fontSize: 14, lineHeight: 21, marginBottom: 20 },
  retryButton: { backgroundColor: "#5968F2", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 13 },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
});
