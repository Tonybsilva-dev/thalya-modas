import { env } from '../../shared/env';

export const authSessionCookieName = '@thalya-modas:session';

export function createAuthSessionCookie(token: string, maxAge: number): string {
	const attributes = [
		`${authSessionCookieName}=${encodeURIComponent(token)}`,
		'Path=/',
		`Max-Age=${maxAge}`,
		'HttpOnly',
		'SameSite=Lax',
	];

	if (env.NODE_ENV === 'production') {
		attributes.push('Secure');
	}

	return attributes.join('; ');
}

export function getAuthSessionTokenFromCookieHeader(
	cookieHeader: string | string[] | undefined,
): string | null {
	if (!cookieHeader || Array.isArray(cookieHeader)) return null;

	const cookies = parseCookieHeader(cookieHeader);
	const cookieValue = cookies.get(authSessionCookieName);

	if (!cookieValue) return null;

	try {
		return decodeURIComponent(cookieValue);
	} catch {
		return cookieValue;
	}
}

function parseCookieHeader(cookieHeader: string): Map<string, string> {
	const cookies = new Map<string, string>();

	for (const cookie of cookieHeader.split(';')) {
		const [name, ...valueParts] = cookie.trim().split('=');
		if (!name || valueParts.length === 0) continue;

		cookies.set(name, valueParts.join('='));
	}

	return cookies;
}
