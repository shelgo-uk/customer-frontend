/** Block competitor / external next domains from customer navigation */
const BLOCKED_HOSTS = [
  'next.co.uk',
  'www.next.co.uk',
  'next.uk',
  'www.next.uk',
  'next.com',
  'www.next.com'
];

export function isBlockedExternalUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://shelgo.uk');
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    return BLOCKED_HOSTS.some(b => host === b.replace(/^www\./, '') || host.endsWith('.' + b.replace(/^www\./, '')));
  } catch {
    return /next\.co\.uk|next\.uk/i.test(url);
  }
}

/** Safe navigation — internal paths or allowed external URLs only */
export function resolveSafeUrl(url: string): string | null {
  if (!url || !String(url).trim()) return null;
  const trimmed = String(url).trim();

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return isBlockedExternalUrl(trimmed) ? null : trimmed;
  }

  if (trimmed.startsWith('//')) {
    return isBlockedExternalUrl('https:' + trimmed) ? null : 'https:' + trimmed;
  }

  return '/' + trimmed.replace(/^\//, '');
}

export function openSafeUrl(url: string, router?: { navigateByUrl: (u: string) => void }, newTab = false): boolean {
  const safe = resolveSafeUrl(url);
  if (!safe) return false;

  if (safe.startsWith('http')) {
    if (newTab) window.open(safe, '_blank', 'noopener,noreferrer');
    else window.location.href = safe;
    return true;
  }

  if (router) {
    router.navigateByUrl(safe);
    return true;
  }

  window.location.href = safe;
  return true;
}
