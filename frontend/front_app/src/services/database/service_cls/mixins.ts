import PouchDB from 'pouchdb'
import { BaseDatabaseService } from './base'

type Constructor<T = {}> = new (...args: any[]) => T
type RemoteDBChangeCallback = (doc: PouchDB.Core.ExistingDocument<object>) => void

/**
 * Миксин для добавления функциональности удаленной синхронизации
 * Применяется к любому потомку BaseDatabaseService
 */
export function DBWithRemoteSync<TBase extends Constructor<BaseDatabaseService>>(Base: TBase) {
    return class RemoteSyncMixin extends Base {
        private _remoteDB?: PouchDB.Database | undefined
        private _syncHandler?: PouchDB.Replication.Sync<{}> | undefined
        private _remoteDBChangeListeners: Record<string, RemoteDBChangeCallback[]> = {}


        protected get remoteDB() {
            return this._remoteDB
        }

        async _replicateFromRemote() {
            /** Подтягивает данные из удалённой БД в локальную */

            if (!this._remoteDB) {
                throw new Error('Remote DB not initialized')
            }

            return this.db.replicate.from(this._remoteDB).on('complete', function (info) {
                console.log('Replicate from remote complete')
            }).on('error', function (err) {
                console.error('Replicate from remote error:', err)
                throw new Error(`Replicate from remote error: ${err}`)
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
            }).on('change', (info) => {
                /** Вызывается при изменении данных в БД */
                if (info.direction === 'pull') {
                    info.change.docs.forEach(doc => {  /** Проходим по всем документам, которые были изменены */
                        /** Вызываем коллбэки на изменение документа */
                        if (this._remoteDBChangeListeners[doc._id]) this._remoteDBChangeListeners[doc._id]!.forEach(callback => callback(doc))
                    })
                }
            }).on('paused', function (info) {
                /** Вызывается при паузе синхронизации */
                console.log('Paused:', info)
            }).on('active', function () {
                /** Вызывается при активации синхронизации */
                console.log('Active')
            }).on('error', function (err) {
                /** Вызывается при ошибке синхронизации */
                console.log('Error:', err)
            }).on('complete', function (info) {
                /** Вызывается при завершении синхронизации */
                console.log('Complete:', info)
            })
        }

        stopSyncWithRemote() {
            if (this._syncHandler) {
                this._syncHandler.cancel()
                this._syncHandler = undefined
            }
        }

        async initSyncWithRemote(remoteDB: PouchDB.Database) {
            /** Инициализирует синхронизацию с удалённой БД */
            
            this._remoteDB = remoteDB
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