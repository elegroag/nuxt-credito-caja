<template>
    <SectionCard 
        title="Información Económica"
        icon-bg-class="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
    >
        <template #icon>
            <TrendingUp class="h-5 w-5" />
        </template>
        
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoField 
                    label="Total Activos" 
                    :value="totalActivos"
                    value-class="font-bold text-cyan-600 dark:text-cyan-400 text-lg"
                />
                <InfoField 
                    label="Total Pasivos" 
                    :value="totalPasivos"
                    value-class="font-bold text-red-600 dark:text-red-400 text-lg"
                />
                <InfoField 
                    label="Arrendamientos" 
                    :value="arrendamientos"
                    value-class="font-semibold text-gray-900 dark:text-white"
                />
                <InfoField 
                    label="Otros Gastos" 
                    :value="otrosGastos"
                    value-class="font-semibold text-gray-900 dark:text-white"
                />
            </div>
            
            <div v-if="gastosDescripcion" class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                    Descripción Gastos
                </label>
                <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    {{ gastosDescripcion }}
                </p>
            </div>
            
            <div v-if="descripcionActividades" class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                    Descripción Actividades
                </label>
                <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    {{ descripcionActividades }}
                </p>
            </div>
        </div>
    </SectionCard>
</template>

<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next';
import SectionCard from './SectionCard.vue';
import InfoField from './InfoField.vue';

interface Props {
    totalActivos: string;
    totalPasivos: string;
    arrendamientos: string;
    otrosGastos: string;
    gastosDescripcion?: string;
    descripcionActividades?: string;
}

const props = defineProps<Props>();
</script>
