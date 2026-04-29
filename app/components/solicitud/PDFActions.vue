<template>
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <h2 class="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Documento PDF de Solicitud
            </h2>

            <!-- Estado del PDF -->
            <div v-if="tienePDF && !loading" class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <div class="font-bold">PDF disponible</div>
                    <div class="text-xs">{{ pdfFilename }}</div>
                </div>
            </div>

            <!-- Mensaje de error -->
            <div v-if="error" class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ error }}</span>
            </div>

            <!-- Mensaje de progreso -->
            <div v-if="loading" class="alert alert-info">
                <span class="loading loading-spinner loading-sm"></span>
                <span>{{ mensajeProgreso }}</span>
            </div>

            <!-- Acciones -->
            <div class="card-actions justify-end gap-2">
                <button
                    v-if="!tienePDF"
                    class="btn btn-primary"
                    :disabled="loading"
                    @click="handleGenerarPDF"
                >
                    <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="loading loading-spinner loading-sm" v-else></span>
                    Generar PDF
                </button>

                <button
                    v-if="tienePDF"
                    class="btn btn-secondary"
                    :disabled="loading"
                    @click="handleDescargarPDF"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar PDF
                </button>

                <button
                    v-if="tienePDF && mostrarBotonRegenenar"
                    class="btn btn-outline"
                    :disabled="loading"
                    @click="handleRegenerarPDF"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerar
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from '#imports';
import { usePDFGenerator } from '~/composables/solicitud/usePDFGenerator';

interface Props {
    solicitudId: string;
    mostrarBotonRegenenar?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    mostrarBotonRegenenar: false
});

const emit = defineEmits<{
    pdfGenerado: [data: any];
    pdfDescargado: [];
    error: [error: string];
}>();

const {
    loading,
    error,
    pdfData,
    tienePDF,
    pdfFilename,
    mensajeProgreso,
    generarPDF,
    descargarPDF,
    verificarEstadoPDF
} = usePDFGenerator();

onMounted(async () => {
    await verificarEstadoPDF(props.solicitudId);
});

const handleGenerarPDF = async () => {
    const exito = await generarPDF(props.solicitudId);
    if (exito) {
        emit('pdfGenerado', pdfData.value);
        // Verificar estado actualizado
        await verificarEstadoPDF(props.solicitudId);
    } else if (error.value) {
        emit('error', error.value);
    }
};

const handleDescargarPDF = async () => {
    await descargarPDF(props.solicitudId);
    if (!error.value) {
        emit('pdfDescargado');
    } else {
        emit('error', error.value);
    }
};

const handleRegenerarPDF = async () => {
    const exito = await generarPDF(props.solicitudId);
    if (exito) {
        emit('pdfGenerado', pdfData.value);
        await verificarEstadoPDF(props.solicitudId);
    } else if (error.value) {
        emit('error', error.value);
    }
};
</script>
