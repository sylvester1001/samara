const hasTauri = () =>
	typeof window !== 'undefined' &&
	(!!(window as typeof window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
		!!(window as typeof window & { __TAURI__?: unknown }).__TAURI__);

export async function revealDownloadedFile(filename: string): Promise<boolean> {
	if (!hasTauri()) return false;

	try {
		const [{ downloadDir, join }, { revealItemInDir, openPath }] = await Promise.all([
			import('@tauri-apps/api/path'),
			import('@tauri-apps/plugin-opener')
		]);
		const dir = await downloadDir();
		const filePath = await join(dir, filename);

		try {
			await revealItemInDir(filePath);
		} catch {
			await openPath(dir);
		}
		return true;
	} catch {
		return false;
	}
}
