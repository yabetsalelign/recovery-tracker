import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";

type BackHandler = () => void;
interface BackNavigationValue {
  goBack: (fallback?: string) => void;
  registerOverlay: (handler: BackHandler) => () => void;
}

const BackNavigationContext = createContext<BackNavigationValue | null>(null);
const ROOT_PATHS = new Set(["/home"]);

export function getBackFallback(pathname: string): string {
  if (pathname === "/day") return "/calendar";
  if (pathname === "/tracker" || pathname.startsWith("/tracker/")) return "/home";
  if (["/counter", "/streaks", "/sesh", "/weed", "/porn"].includes(pathname)) return "/progress";
  if (pathname === "/add-addiction") return "/home";
  if (pathname === "/") return "/home";
  return "/home";
}

export const BackNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const historyStack = useRef<Array<{ key: string; pathname: string }>>([]);
  const locationRef = useRef(location);
  const overlayHandlers = useRef<BackHandler[]>([]);
  const keyboardVisible = useRef(false);

  useLayoutEffect(() => {
    locationRef.current = location;
    const entry = { key: location.key, pathname: location.pathname };
    const existingIndex = historyStack.current.findIndex((item) => item.key === location.key);
    if (navigationType === "POP") {
      if (existingIndex >= 0) historyStack.current = historyStack.current.slice(0, existingIndex + 1);
      else historyStack.current = [entry];
    } else if (navigationType === "REPLACE" && historyStack.current.length) {
      historyStack.current[historyStack.current.length - 1] = entry;
    } else if (historyStack.current[historyStack.current.length - 1]?.key !== location.key) {
      historyStack.current.push(entry);
    }
  }, [location, navigationType]);

  const registerOverlay = useCallback((handler: BackHandler) => {
    overlayHandlers.current.push(handler);
    return () => {
      const index = overlayHandlers.current.lastIndexOf(handler);
      if (index >= 0) overlayHandlers.current.splice(index, 1);
    };
  }, []);

  const goBack = useCallback((fallback?: string) => {
    if (historyStack.current.length > 1) {
      historyStack.current.pop();
      navigate(-1);
      return;
    }
    navigate(fallback || getBackFallback(locationRef.current.pathname), { replace: true });
  }, [navigate]);

  const handleNativeBack = useCallback(async () => {
    const topOverlay = overlayHandlers.current[overlayHandlers.current.length - 1];
    if (topOverlay) {
      topOverlay();
      return;
    }
    if (keyboardVisible.current) {
      try { await Keyboard.hide(); } catch { /* Android may already have dismissed the IME. */ }
      return;
    }
    if (historyStack.current.length > 1) {
      historyStack.current.pop();
      navigate(-1);
      return;
    }
    const pathname = locationRef.current.pathname;
    if (ROOT_PATHS.has(pathname)) {
      if (window.confirm("Exit Recovery Tracker?")) await App.exitApp();
      return;
    }
    navigate(getBackFallback(pathname), { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    let disposed = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];
    const add = async (promise: Promise<{ remove: () => Promise<void> }>) => {
      const handle = await promise;
      if (disposed) await handle.remove();
      else handles.push(handle);
    };
    void add(App.addListener("backButton", () => { void handleNativeBack(); }));
    void add(Keyboard.addListener("keyboardDidShow", () => { keyboardVisible.current = true; }));
    void add(Keyboard.addListener("keyboardDidHide", () => { keyboardVisible.current = false; }));
    return () => {
      disposed = true;
      handles.forEach((handle) => { void handle.remove(); });
    };
  }, [handleNativeBack]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const topOverlay = overlayHandlers.current[overlayHandlers.current.length - 1];
      if (!topOverlay) return;
      event.preventDefault();
      topOverlay();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  return <BackNavigationContext.Provider value={{ goBack, registerOverlay }}>{children}</BackNavigationContext.Provider>;
};

export function useBackNavigation(): BackNavigationValue {
  const context = useContext(BackNavigationContext);
  if (!context) throw new Error("Back navigation must be used inside BackNavigationProvider.");
  return context;
}

export function useOverlayBackHandler(open: boolean, handler: BackHandler): void {
  const { registerOverlay } = useBackNavigation();
  useEffect(() => open ? registerOverlay(handler) : undefined, [handler, open, registerOverlay]);
}
