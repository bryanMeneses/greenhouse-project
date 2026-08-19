import { useLocation } from "react-router";

/**
 * Whether the app has a prior in-app step to return to. The router's initial
 * location carries the sentinel key "default"; every push replaces it with a
 * fresh key, so a fresh deep link (or first load) reports false. Replace-based
 * redirects keep "default" too, so a bounced Client never sees a phantom Back.
 */
export function useCanGoBack(): boolean {
  return useLocation().key !== "default";
}
