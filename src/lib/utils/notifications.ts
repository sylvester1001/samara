import { toast } from 'svelte-sonner';
import { revealDownloadedFile } from '$lib/utils/downloads';

export function showExportToast(filename: string) {
	toast('Export complete', {
		description: `${filename} downloaded`,
		action: {
			label: 'Open folder',
			onClick: async () => {
				const opened = await revealDownloadedFile(filename);
				if (!opened) {
					toast('Unable to open downloads folder');
				}
			}
		}
	});
}
