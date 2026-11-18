import PouchDB from 'pouchdb'
import { BaseDatabaseService } from './base'

type Constructor<T = {}> = new (...args: any[]) => T
type RemoteDBChangeCallback = (doc: PouchDB.Core.ExistingDocument<object>) => void
export type RemoteSyncStatus = 'syncing' | 'synced' | 'error'

type RemoteSyncOptions = {
    onStatus?: (status: RemoteSyncStatus, detail?: unknown) => void
}

/**
 * Миксин для добавления функциональности удаленной синхронизации
 * Применяется к любому потомку BaseDatabaseService
 */
export function DBWithRemoteSync<TBase extends Constructor<BaseDatabaseService>>(Base: TBase) {
    return class RemoteSyncMixin extends Base {
        private _remoteDB?: PouchDB.Database | undefined
        private _syncHandler?: PouchDB.Replication.Sync<{}> | undefined
        private _remoteDBChangeListeners: Record<string, RemoteDBChangeCallback[]> = {}
        private _syncStatusListener?: RemoteSyncOptions['onStatus']


        protected get remoteDB() {
            return this._remoteDB
        }

        private _notifySyncStatus(status: RemoteSyncStatus, detail?: unknown) {
            this._syncStatusListener?.(status, detail)
        }

        async _replicateFromRemote() {
            /** Подтягивает данные из удалённой БД в локальную */

            if (!this._remoteDB) {
                throw new Error('Remote DB not initialized')
            }

            // Важно дождаться именно результата репликации: событие error
            // само по себе не отклоняет промис.
            return new Promise<void>((resolve, reject) => {
                this.db.replicate.from(this._remoteDB!).on('complete', () => {
                    resolve()
                }).on('error', (err) => {
                    console.error('Replicate from remote error:', err)
                    reject(err)
                })
            })
        }

        _startSyncWithRemote() {
            if (!this._remoteDB) {
                throw new Error('Remote DB not initialized')
            }

            if (this._syncHandler) {
                console.warn('Sync already started')
                return
            }

            this._syncHandler = this.db.sync(this._remoteDB, {
                live: true,
                retry: true
            })

            this._syncHandler.on('change', (info) => {
                /** Вызывается при изменении данных в БД */
                if (info.direction === 'pull') {
                    info.change.docs.forEach(doc => {  /** Проходим по всем документам, которые были изменены */
                        /** Вызываем коллбэки на изменение документа */
                        if (this._remoteDBChangeListeners[doc._id]) this._remoteDBChangeListeners[doc._id]!.forEach(callback => callback(doc))
                    })
                }
            }).on('paused', (info) => {
                /** Обмен завершил текущую пачку изменений */
                const pending = (info as { pending?: number } | undefined)?.pending
                this._notifySyncStatus(pending ? 'syncing' : 'synced')
            }).on('active', () => {
                this._notifySyncStatus('syncing')
            }).on('error', (err) => {
                console.error('Sync error:', err)
                this._notifySyncStatus('error', err)
            })
            // complete наступает и при штатной отмене (logout) — статус не трогаем
        }

        stopSyncWithRemote() {
            if (this._syncHandler) {
                this._syncHandler.cancel()
                this._syncHandler = undefined
            }
        }

        async initSyncWithRemote(remoteDB: PouchDB.Database, options?: RemoteSyncOptions) {
            /** Инициализирует синхронизацию с удалённой БД */

            this._syncStatusListener = options?.onStatus
            this._remoteDB = remoteDB
            this._notifySyncStatus('syncing')
            await this._replicateFromRemote() // Подтягиваем данные из удалённой БД в локальную
            this._startSyncWithRemote() // Запускаем синхронизацию
        }

        get isSyncActive(): boolean {
            return !!this._syncHandler
        }

        addRemoteDBChangeListener(documentId: string, callback: RemoteDBChangeCallback) {
            /** Добавляет коллбэк на изменение документа в удалённой БД */
            // console.log('Add remote DB change listener for document:', documentId)

            if (!this._remoteDBChangeListeners[documentId]) this._remoteDBChangeListeners[documentId] = []
            this._remoteDBChangeListeners[documentId].push(callback)
        }
    }
}

export type InstanceOfDBWithRemoteSync = InstanceType<
    ReturnType<typeof DBWithRemoteSync<Constructor<BaseDatabaseService>>>
>
