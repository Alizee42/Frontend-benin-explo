const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

function getCurrentHostname(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }

  return window.location.hostname;
}

export function getApiBaseUrl(): string {
  const hostname = getCurrentHostname();

  if (LOCAL_HOSTNAMES.has(hostname)) {
    return '';
  }

  return 'http://217.160.69.180:8081';
}

export function resolveApiUrl(url: string): string {
  if (!url || /^https?:\/\//i.test(url) || url.startsWith('//')) {
    return url;
  }

  if (!url.startsWith('/')) {
    return url;
  }

  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl ? `${apiBaseUrl}${url}` : url;
}