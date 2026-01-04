export interface Cell {
	content: string;
	colspan?: number;
	rowspan?: number;
	align?: 'left' | 'center' | 'right' | 'decimal';
	backgroundColor?: string;
	textColor?: string;
	isBold?: boolean;
	isItalic?: boolean;
	isMerged?: boolean;
}

export interface TableData {
	rows: Cell[][];
	columnWidths: number[];
	rowHeights: number[];
}

export type BorderStyle = 'none' | 'thin' | 'thick' | 'double';

export interface BorderConfig {
	top: BorderStyle;
	bottom: BorderStyle;
	headerBottom: BorderStyle;
	vertical: BorderStyle;
	horizontal: BorderStyle;
}

export interface TableStyle {
	preset: 'booktabs' | 'bordered' | 'minimal';
	fontFamily: 'computer-modern' | 'times' | 'arial';
	fontSize: number;
	scale: number;
	padding: 'compact' | 'normal' | 'loose' | number;
	borders: BorderConfig;
}

export interface CanvasConfig {
	width: number | 'auto';
	height: number | 'auto';
	padding: number;
	backgroundColor: string;
}

export const DEFAULT_CELL: Cell = {
	content: '',
	colspan: 1,
	rowspan: 1,
	align: 'center',
	isMerged: false
};

export const DEFAULT_BORDER_CONFIG: BorderConfig = {
	top: 'thick',
	bottom: 'thick',
	headerBottom: 'thin',
	vertical: 'none',
	horizontal: 'none'
};

export const DEFAULT_TABLE_STYLE: TableStyle = {
	preset: 'booktabs',
	fontFamily: 'computer-modern',
	fontSize: 12,
	scale: 1,
	padding: 'normal',
	borders: DEFAULT_BORDER_CONFIG
};

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
	width: 'auto',
	height: 'auto',
	padding: 20,
	backgroundColor: '#ffffff'
};
