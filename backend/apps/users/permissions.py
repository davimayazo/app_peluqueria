from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Permite acceso solo a usuarios con rol 'admin'."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'admin'
        )


class IsClient(BasePermission):
    """Permite acceso solo a usuarios con rol 'cliente'."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'cliente'
        )


class IsStaff(BasePermission):
    """Permite acceso a usuarios con rol 'admin' o 'barbero'."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ['admin', 'barbero']
        )


class IsStaffOrReadOnly(BasePermission):
    """Lectura pública, escritura solo para staff (admin o barbero)."""

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ['admin', 'barbero']
        )


class IsAdminOrReadOnly(BasePermission):
    """Lectura pública, escritura solo admin."""

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'admin'
        )
