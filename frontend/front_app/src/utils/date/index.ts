import { date, DateOptions, DateUnitOptions } from "quasar"

export const FRIENDLY_DATE_FORMAT = 'DD.MM.YYYY'
export const FRIENDLY_DATE_TIME_FORMAT = 'DD.MM.YYYY, HH:mm:ss'
export const ISO_DATE_FORMAT = 'YYYY-MM-DD'
export const ISO_DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss'

export function useDateUtils() {
    return {
        dateToISOFromat: (d: Date) => date.formatDate(d, ISO_DATE_FORMAT),  // Date -> ISO Date String (YYYY-MM-DD)
        ISODateToDate: (dStr: string) => date.extractDate(dStr, ISO_DATE_FORMAT),  // ISO Date String (YYYY-MM-DD) -> Date
        ISODateTimeToDate: (dStr: string) => new Date(dStr),  // ISO DateTime String (YYYY-MM-DDTHH:mm:ss) -> Date
        ISOToFriendlyDate: (dStr: string) => {  // ISO Date String (YYYY-MM-DD) -> Friendly Date String (DD.MM.YYYY)
            return date.formatDate(date.extractDate(dStr, ISO_DATE_FORMAT), FRIENDLY_DATE_FORMAT)
        },
        ISOToFriendlyDateTime: (dStr: string) => {
            // ISO DateTime String (YYYY-MM-DDTHH:mm:ss) -> Friendly DateTime String (DD.MM.YYYY, HH:mm:ss)
            return date.formatDate(new Date(dStr), FRIENDLY_DATE_TIME_FORMAT)
        },
    }
}

export class AppDate {
    date: Date
    private _iso: string | undefined
    private _friendly: string | undefined
    private _dayOfWeek: number | undefined
    private _dayOfWeekString: string | undefined

    private constructor(date: Date, cache?: { iso?: string, friendly?: string }) {
        this.date = date
        this._iso = cache?.iso
        this._friendly = cache?.friendly
    }

    static today() {
        return new this(new Date())
    }

    static fromDate(d: Date) {  // Date -> AppDate
        return new this(d)
    }

    static fromISOFormat(dStr: string) {  // ISO Date String (YYYY-MM-DD) -> AppDate
        return new this(new Date(dStr), { iso: dStr })
    }

    static fromFriendlyFormat(dStr: string) {  // Friendly Date String (DD.MM.YYYY) -> AppDate
        return new this(date.extractDate(dStr, FRIENDLY_DATE_FORMAT), { friendly: dStr })
    }

    get iso() {
        return this._iso || (
            this._iso = date.formatDate(this.date, ISO_DATE_FORMAT)
        )
    }

    get friendly() {
        return this._friendly || (
            this._friendly = date.formatDate(this.date, FRIENDLY_DATE_FORMAT)
        )
    }

    get dayOfWeek() {
        return this._dayOfWeek || (
            this._dayOfWeek = date.getDayOfWeek(this.date)
        )
    }

    get dayOfWeekString() {
        return this._dayOfWeekString || (
            this._dayOfWeekString = date.formatDate(this.date, 'ddd')
        )
    }

    isWeekend() {
        return this.dayOfWeek === 5 || this.dayOfWeek === 6
    }

    isToday() {
        return this.friendly === AppDate.today().friendly
    }

    add(options: DateOptions): AppDate {
        /**
         * Добавляет опции к дате, возвращает новую дату
         * https://quasar.dev/quasar-utils/date-utils#add-subtract
         * */
        return AppDate.fromDate(date.addToDate(this.date, options))
    }

    diff(subtractDate: Date | AppDate, unit?: Parameters<typeof date.getDateDiff>[2]): number {
        /**
         * Возвращает разницу в днях между датой и текущей датой
         * https://quasar.dev/quasar-utils/date-utils#difference
         * */

        if (subtractDate instanceof AppDate) subtractDate = subtractDate.date
        return date.getDateDiff(this.date, subtractDate, unit)
    }

    isAfter(date: Date | AppDate): boolean {
        /** Больше переданной даты */
        if (date instanceof Date) date = AppDate.fromDate(date)
        return this.iso > date.iso
    }

    isAfterOrEqual(date: Date | AppDate): boolean {
        /** Больше или равно переданной даты */
        if (date instanceof Date) date = AppDate.fromDate(date)
        return this.iso >= date.iso
    }

    isBefore(date: Date | AppDate): boolean {
        /** Меньше переданной даты */
        if (date instanceof Date) date = AppDate.fromDate(date)
        return this.iso < date.iso
    }

    isBeforeOrEqual(date: Date | AppDate): boolean {
        /** Меньше или равно переданной даты */
        if (date instanceof Date) date = AppDate.fromDate(date)
        return this.iso <= date.iso
    }

}
