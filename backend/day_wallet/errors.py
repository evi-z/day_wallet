class AppError(Exception):
    pass

class AuthError(AppError):
    pass

class CouchDBError(AppError):
    pass

class CouchDBUserNotFoundError(CouchDBError):
    pass