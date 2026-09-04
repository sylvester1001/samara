<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import "mathlive";
    import { t } from "$lib/i18n";

    interface Props {
        open: boolean;
        initialValue?: string;
        onOpenChange: (open: boolean) => void;
        onConfirm: (latex: string) => void;
    }

    let { open, initialValue = "", onOpenChange, onConfirm }: Props = $props();

    let mathFieldElement: HTMLElement | null = $state(null);

    $effect(() => {
        if (open) {
            // 短暂延时以确保 Dialog 动画开始且 DOM 已渲染
            setTimeout(() => {
                if (mathFieldElement) {
                    const mf = mathFieldElement as any;

                    // 配置
                    mf.sounds = null;
                    mf.mathVirtualKeyboardPolicy = "manual"; // 由用户点击图标触发

                    // 设置值
                    mf.setValue(initialValue);

                    // 聚焦
                    mf.focus();
                }
            }, 100);

            // 清理函数：当 open 变为 false 或组件销毁时执行
            return () => {
                // @ts-ignore
                if (window.mathVirtualKeyboard) {
                    // @ts-ignore
                    window.mathVirtualKeyboard.hide();
                }
            };
        }
    });

    function handleConfirm() {
        // @ts-ignore
        const value = mathFieldElement?.getValue() || "";
        onConfirm(value);
        onOpenChange(false);
    }

    function handleInput(e: Event) {
        // 可选：处理实时输入
    }
</script>

<Dialog.Root {open} {onOpenChange}>
    <Dialog.Content
        class="sm:max-w-[600px] !translate-y-0 !top-[15%]"
        interactOutsideBehavior="ignore"
        trapFocus={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
    >
        <Dialog.Header>
            <Dialog.Title>{t('formula.title')}</Dialog.Title>
            <Dialog.Description>
                {t('formula.description')}
            </Dialog.Description>
        </Dialog.Header>

        <div class="py-4 w-full">
            <!-- MathLive Component -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <math-field
                bind:this={mathFieldElement}
                oninput={handleInput}
                class="w-full text-xl p-4 border rounded-md bg-background text-foreground block"
                style="width: 100%; box-sizing: border-box;"
            >
            </math-field>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={() => onOpenChange(false)}
                >{t('common.cancel')}</Button
            >
            <Button onclick={handleConfirm}>{t('formula.confirm')}</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<style>
    math-field {
        --keyboard-zindex: 9999 !important;
        z-index: 50;
        /* 关键修复：允许选中，防止因继承 user-select: none 导致无法聚焦 */
        user-select: text !important;
        -webkit-user-select: text !important;
        isolation: isolate;
    }

    /* 保证键盘在 Dialog 之上 */
    :global(.ML__keyboard),
    :global(.ML__popover),
    :global(.ML__virtual-keyboard-plate) {
        z-index: 9999 !important;
    }

    :global(.dark) math-field {
        --smart-fence-color: #fff;
        --text-color: #fff;
    }
</style>
