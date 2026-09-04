import { toast } from 'svelte-sonner';
import { revealDownloadedFile } from '$lib/utils/downloads';
import { t } from '$lib/i18n';

export function showExportToast(filename: string) {
	toast(t('toast.exportComplete'), {
		description: t('toast.downloaded', { filename }),
		action: {
			label: t('toast.openFolder'),
			onClick: async () => {
				const opened = await revealDownloadedFile(filename);
				if (!opened) {
					toast(t('toast.openFolderFailed'));
				}
			}
		}
	});
}
