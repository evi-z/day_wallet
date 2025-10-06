export const TableCellType = {
    text: 'text',
    input: 'input',
} as const

export type TableCellTypeMap = typeof TableCellType[keyof typeof TableCellType]

export const TableCellFormatType = {
    plain: 'plain',
    currency: 'currency',
} as const

export type TableCellFormatTypeMap = typeof TableCellFormatType[keyof typeof TableCellFormatType]

export type TableCellAlign = 'left' | 'right' | 'center'