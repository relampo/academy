function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAppBaseUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL as
    | string
    | undefined;

  if (configuredUrl?.trim()) {
    return trimTrailingSlash(configuredUrl.trim());
  }

  const { origin, pathname } = window.location;
  const normalizedPath = pathname.endsWith("/")
    ? pathname
    : pathname.slice(0, pathname.lastIndexOf("/") + 1);

  return trimTrailingSlash(`${origin}${normalizedPath}`);
}

export function getHashUrl(hashPath: string) {
  const normalizedHash = hashPath.startsWith("/") ? hashPath : `/${hashPath}`;

  return `${getAppBaseUrl()}#${normalizedHash}`;
}
