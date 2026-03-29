/// <reference path="../.astro/types.d.ts" />

declare namespace App {
	interface Locals {
		user: { id: string; username: string } | null;
	}
}

interface ImportMetaEnv {
	readonly MONGODB_URI: string;
	readonly MONGODB_DB?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
