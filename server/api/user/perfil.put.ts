// frontend/server/api/auth/perfil.put.ts
export default defineEventHandler(async (event) => {
    try {
        // Obtener el header de autorización
        const authorization = getHeader(event, 'authorization')

        if (!authorization) {
            throw createError({
                statusCode: 401,
                statusMessage: 'No autorizado'
            })
        }

        // Obtener el body de la solicitud
        const body = await readBody(event)

        // Reenviar la solicitud al backend de Python
        const config = useRuntimeConfig()

        const response = await $fetch(`${config.backendBaseUrl}/api/auth/perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json'
            },
            body: body
        })

        return response
    } catch (error: any) {
        console.error('Error en endpoint /api/auth/perfil (PUT):', error)

        // Si el error ya tiene un statusCode, lo mantenemos
        if (error.statusCode) {
            throw error
        }

        // Para otros errores, devolvemos un error genérico
        throw createError({
            statusCode: 500,
            statusMessage: 'Error al actualizar el perfil del usuario'
        })
    }
})
