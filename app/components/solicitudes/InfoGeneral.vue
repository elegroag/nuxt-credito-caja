<template>
    <SectionCard 
        title="Información General"
        icon-bg-class="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    >
        <template #icon>
            <FileText class="h-5 w-5" />
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoField 
                label="Número de Solicitud" 
                :value="numeroSolicitud"
                value-class="font-semibold text-gray-900 dark:text-white"
            />
            <InfoField 
                label="Monto Solicitado" 
                :value="montoSolicitado"
                value-class="font-bold text-emerald-600 dark:text-emerald-400 text-lg"
            />
            <InfoField 
                label="Plazo" 
                :value="`${plazoMeses} meses`"
                value-class="font-semibold text-gray-900 dark:text-white"
            />
            <InfoField 
                label="Fecha de Creación" 
                :value="fechaCreacion"
            />
            <InfoField 
                label="Línea de Crédito" 
                :value="lineaCredito"
                value-class="text-gray-700 dark:text-gray-300"
            />
        </div>
    </SectionCard>
</template>

<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import SectionCard from './SectionCard.vue';
import InfoField from './InfoField.vue';

interface Props {
    numeroSolicitud: string;
    montoSolicitado: string;
    plazoMeses: number;
    fechaCreacion: string;
    lineaCredito: string;
}

const props = defineProps<Props>();
</script>
