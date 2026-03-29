const USER_RE = /^[a-z0-9_]{3,32}$/;

export function normalizeUsername(raw: string): string {
	return raw.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
	const u = normalizeUsername(username);
	if (!USER_RE.test(u)) {
		return 'Username must be 3–32 characters: lowercase letters, numbers, and underscores only.';
	}
	return null;
}

export function validatePassword(password: string): string | null {
	if (typeof password !== 'string' || password.length < 8) {
		return 'Password must be at least 8 characters.';
	}
	if (password.length > 128) {
		return 'Password is too long.';
	}
	return null;
}
