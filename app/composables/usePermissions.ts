import { computed } from '#imports'
import { useSession } from '~/composables/useSession'

/**
 * Composable para manejo de permisos de usuario
 */
export const usePermissions = () => {
    const { session } = useSession()

    const userRoles = computed(() => session.value.user?.roles || [])
    const userPermissions = computed(() => session.value.user?.permissions || [])

    /**
     * Verifica si el usuario tiene un rol específico
     */
    const hasRole = (role: string): boolean => {
        return userRoles.value.includes(role)
    }

    /**
     * Verifica si el usuario es administrador
     */
    const isAdministrator = computed(() => hasRole('administrator'))

    /**
     * Verifica si el usuario es asesor
     */
    const isAdviser = computed(() => hasRole('adviser'))

    /**
     * Verifica si el usuario es trabajador
     */
    const isTrabajador = computed(() => hasRole('user_trabajador'))

    /**
     * Verifica si el usuario es empresa
     */
    const isEmpresa = computed(() => hasRole('user_empresa'))

    /**
     * Verifica si el usuario tiene un permiso específico
     */
    const hasPermission = (permission: string): boolean => {
        // Los administradores tienen todos los permisos
        if (isAdministrator.value) {
            return true
        }

        return userPermissions.value.includes(permission)
    }

    /**
     * Verifica si el usuario puede acceder a rutas de administración
     */
    const canAccessAdmin = computed(() => {
        return isAdministrator.value || isAdviser.value
    })

    /**
     * Verifica si el usuario puede gestionar firmas
     */
    const canManageFirmas = computed(() => {
        return hasPermission('firmas.manage') || isAdministrator.value
    })

    /**
     * Verifica si el usuario puede ver firmas
     */
    const canViewFirmas = computed(() => {
        return hasPermission('firmas.view') || canManageFirmas.value
    })

    /**
     * Verifica si el usuario puede gestionar convenios
     */
    const canManageConvenios = computed(() => {
        return hasPermission('convenios.manage') || isAdministrator.value
    })

    /**
     * Verifica si el usuario puede ver convenios
     */
    const canViewConvenios = computed(() => {
        return hasPermission('convenios.view') || canManageConvenios.value
    })

    /**
     * Verifica si el usuario puede gestionar solicitudes administrativas
     */
    const canManageSolicitudes = computed(() => {
        return hasPermission('solicitudes.manage') || isAdministrator.value
    })

    /**
     * Verifica si el usuario puede ver solicitudes administrativas
     */
    const canViewSolicitudes = computed(() => {
        return hasPermission('solicitudes.view') || canManageSolicitudes.value
    })

    /**
     * Verifica si el usuario puede gestionar usuarios
     */
    const canManageUsers = computed(() => {
        return hasPermission('users.manage') || isAdministrator.value
    })

    /**
     * Obtiene el display name del rol principal del usuario
     */
    const getPrimaryRoleDisplay = computed(() => {
        if (isAdministrator.value) return 'Administrador'
        if (isAdviser.value) return 'Asesor'
        if (isTrabajador.value) return 'Trabajador'
        if (isEmpresa.value) return 'Empresa'
        return 'Usuario'
    })

    return {
        userRoles,
        userPermissions,
        hasRole,
        hasPermission,
        isAdministrator,
        isAdviser,
        isTrabajador,
        isEmpresa,
        canAccessAdmin,
        canManageFirmas,
        canViewFirmas,
        canManageConvenios,
        canViewConvenios,
        canManageSolicitudes,
        canViewSolicitudes,
        canManageUsers,
        getPrimaryRoleDisplay
    }
}
