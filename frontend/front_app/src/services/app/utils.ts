/**
 * Получить URL для подключения к CouchDB
 *
 * В dev режиме использует текущий хост браузера с путём /db (проксируется через Quasar dev server)
 * В production использует настроенный хост из env переменных
 */
export const getCouchDBURL = (dbName: string): string => {
    // В dev режиме используем текущий хост браузера + путь /db
    // Quasar dev server проксирует /db/* на CouchDB
    if (import.meta.env.DEV) {
        const protocol = window.location.protocol.replace(':', '');
        const host = window.location.hostname;
        const port = window.location.port;

        return `${protocol}://${host}:${port}/${dbName}`;
    }

    // В production используем настроенный URL из env переменных
    const COUCHDB_HOST = import.meta.env.VITE_COUCHDB_HOST;
    const COUCHDB_PORT = import.meta.env.VITE_COUCHDB_PORT;
    const COUCHDB_PROTOCOL = import.meta.env.VITE_COUCHDB_PROTOCOL;

    return `${COUCHDB_PROTOCOL}://${COUCHDB_HOST}:${COUCHDB_PORT}/${dbName}`;
}
