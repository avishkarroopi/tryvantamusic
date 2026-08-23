"""Typed error hierarchy. Routers translate these to problem+json."""


class DomainError(Exception):
    status = 400
    code = "domain_error"


class NotFound(DomainError):
    status = 404
    code = "not_found"


class Unauthorized(DomainError):
    status = 401
    code = "unauthorized"


class Forbidden(DomainError):
    status = 403
    code = "forbidden"


class Conflict(DomainError):
    status = 409
    code = "conflict"
