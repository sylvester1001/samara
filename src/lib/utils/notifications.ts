import { toast } from 'svelte-sonner';

export function showExportToast(filename: string) {
	toast('Export complete', {
		description: `${filename} downloaded`
	});
}
