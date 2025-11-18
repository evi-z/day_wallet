import { AppDate } from "src/utils/date"
import { PeriodDocumentDBData } from "src/models/database"
import { PeriodDocCalendarRow } from "./models"

/** Возвращает массив дат (AppDate) в периоде документа */
export const getDaysInPeriodDocument = (document: PeriodDocumentDBData): AppDate[] => {
    const [aFromDate, aToDate] = [
        AppDate.fromFriendlyFormat(document.from_date),
        AppDate.fromFriendlyFormat(document.to_date)
    ]

    const days: AppDate[] = []
    for (let aDate = aFromDate; aDate.date <= aToDate.date; aDate = aDate.add({ days: 1 })) {
        days.push(aDate)
    }
    return days
}

export const getPeriodDocumentCalendarDataRows = (document: PeriodDocumentDBData): PeriodDocCalendarRow[] => {
    const days = getDaysInPeriodDocument(document)
    return days.map(date => ({
        date: date,
        plan: 0,
    } as PeriodDocCalendarRow))
}
