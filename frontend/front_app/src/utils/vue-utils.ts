import { nextTick, WatchHandle } from "vue"
import { watchPausable, WatchPausableReturn } from "@vueuse/core"

/** Оборачивает вызов функции в отдельный tick */
export const wrapCallOneTick = async (fn: () => Promise<void>) => {
    await nextTick()
    await fn()
    await nextTick()
}

/** Оборачивает вызов функции в паузу переданных наблюдателей */
export const wrapCallWithPauseWatchers = async (
    fn: () => Promise<void>, watchers: Array<WatchHandle | WatchPausableReturn>, resume: boolean = true
) => {
    watchers.forEach(watcher => watcher.pause())
    await wrapCallOneTick(fn)
    if (resume) watchers.forEach(watcher => watcher.resume())
}
