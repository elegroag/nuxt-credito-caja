/**
 * Composable para manejar validación de autenticación
 * Ejemplo de uso de los métodos de validación de token
 */
export const useAuthValidation = () => {
    const { validateToken, validateTokenForce, isAuthenticated, clearSession } = useSession()

    /**
     * Verifica si el usuario está autenticado con validación de token
     * Útil para acciones críticas que requieren confirmación de sesión
     */
    const checkAuthStatus = async (): Promise<boolean> => {
        if (!isAuthenticated.value) {
            return false
        }

        return await validateToken()
    }

    /**
     * Verificación forzada sin cache
     * Útil para operaciones sensibles como cambios de contraseña o pagos
     */
    const forceAuthCheck = async (): Promise<boolean> => {
        if (!isAuthenticated.value) {
            return false
        }

        return await validateTokenForce()
    }

    /**
     * Cierra sesión manualmente y limpia todo
     */
    const logout = async (): Promise<void> => {
        await clearSession()
        await navigateTo('/login')
    }

    /**
     * Verificación periódica para mantener sesión activa
     */
    const startPeriodicValidation = (intervalMinutes: number = 10): (() => void) => {
        const interval = setInterval(async () => {
            const isValid = await validateToken()
            if (!isValid) {
                clearInterval(interval)
                await logout()
            }
        }, intervalMinutes * 60 * 1000)

        return () => clearInterval(interval)
    }

    return {
        checkAuthStatus,
        forceAuthCheck,
        logout,
        startPeriodicValidation
    }
}
