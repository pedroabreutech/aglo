const LEGACY_P2PNET_RESULT_PREFIX = "p2pnet-result-";

export function clearLegacyP2pnetSessionCache(): void {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(LEGACY_P2PNET_RESULT_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }
}
