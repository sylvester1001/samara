
/**
 * LaTeX 处理核心模块
 * 
 * 职责：
 * 1. 提供文本转义功能，确保普通文本中的特殊字符在 LaTeX 环境下正确显示
 * 2. 识别并分离 LaTeX 公式与普通文本
 * 3. 验证 LaTeX 代码的合法性（基础检查）
 */

// LaTeX 特殊字符及其转义映射
const LATEX_ESCAPES: Record<string, string> = {
    '&': '\\&',
    '%': '\\%',
    '$': '\\$',
    '#': '\\#',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
    '\\': '\\textbackslash{}'
};

/**
 * 转义普通文本中的 LaTeX 特殊字符
 * 注意：不要对已经包含 LaTeX 命令的字符串使用此函数，除非是想把代码这转义掉
 */
export function escapeLatexText(text: string): string {
    return text.replace(/[&%\$#_{}~^\\]/g, (char) => LATEX_ESCAPES[char]);
}

/**
 * 简单的公式检测
 * 检查字符串是否包含未转义的 $ 符号
 */
export function containsMath(text: string): boolean {
    // 这是一个简单的启发式检查，可能无法通过极其复杂的转义边缘情况
    // 但对于我们的单元格内容来说已经足够
    return /(?<!\\)\$/.test(text);
}

/**
 * 清理 MathLive 输出的 LaTeX 代码
 * MathLive 有时会生成一些冗余的 LaTeX 代码，这里可以做统一的清理
 */
export function cleanMathLiveLatex(latex: string): string {
    if (!latex) return '';
    return latex.trim();
}

/**
 * 将普通文本和公式组合成符合单元格存储规范的内容
 * 简单起见，我们目前认为用户插入公式时，我们将其包裹在 $...$ 中
 * 如果后续支持混合排版（文字+公式），这个函数及其调用方需要升级支持更复杂的拼接逻辑
 */
export function formatCellContent(text: string, isFormula: boolean = false): string {
    if (isFormula) {
        // 确保公式不被双重包裹
        if (text.startsWith('$') && text.endsWith('$')) {
            return text;
        }
        return `$${text}$`;
    }
    // 普通文本，不做转义存储到 Store ? 
    // 决策点：为了编辑方便，Store 里存储原始文本（如 "10%"），渲染和导出时再转义？
    // 还是 Store 里存储转义后的文本（如 "10\%"）？
    // 
    // 架构选择：Store 存储原始用户输入（Raw Input）。
    // 
    // 理由：
    // 1. 用户编辑 "10%" 时期望看到 "10%" 而不是 "10\%"
    // 2. 公式编辑器返回的是 standard latex。
    // 
    // 因此：
    // - 纯文本输入 -> Store: "10%" -> Render: escape("10%") -> Export: escape("10%")
    // - 公式输入 -> Store: "$E=mc^2$" -> Render: Katex("$E=mc^2$") -> Export: "$E=mc^2$"

    return text;
}
