<template>
  <div class="mx-auto max-w-4xl p-4 sm:p-8">
    <!-- Tarjeta principal de agradecimiento -->
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
      >
        <CheckCircle class="h-8 w-8 text-green-600" />
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        ¡Gracias por completar tu solicitud!
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Tu solicitud de crédito ha sido enviada exitosamente para validación por
        nuestros asesores.
      </p>
    </div>

    <!-- Información de seguimiento -->
    <UCard class="mb-8">
      <h2 class="text-xl font-semibold mb-4 text-center">
        Información de seguimiento
      </h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-500"
              >Número de solicitud</label
            >
            <div class="mt-1">
              <span class="text-lg font-semibold text-gray-900">{{
                solicitudId
              }}</span>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-500"
              >Estado actual</label
            >
            <div class="mt-1">
              <Badge variant="secondary" class="text-sm">
                Enviado para validación
              </Badge>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-500"
              >Fecha de envío</label
            >
            <div class="mt-1">
              <span class="text-gray-900">{{ fechaEnvio }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-500"
              >Próximos pasos</label
            >
            <div class="mt-1 text-sm text-gray-600">
              <ul class="space-y-2">
                <li class="flex items-start">
                  <CheckCircle
                    class="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0"
                  />
                  <span>Revisión por equipo de asesores</span>
                </li>
                <li class="flex items-start">
                  <Clock class="h-4 w-4 text-blue-500 mr-2 mt-0.5 shrink-0" />
                  <span>Validación de documentos</span>
                </li>
                <li class="flex items-start">
                  <Mail class="h-4 w-4 text-purple-500 mr-2 mt-0.5 shrink-0" />
                  <span>Notificación por correo electrónico</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Timeline del proceso -->
    <SolicitudTimeline
      :estados="estadosTimeline"
      :estado-actual-id="'ENVIADO_VALIDACION'"
      :fecha-envio="fechaEnvio"
    />

    <!-- Alerta de error o información -->
    <div v-if="mostrarAlerta" class="mb-6">
      <UCard class="bg-yellow-50 border-yellow-300">
        <div class="flex items-start gap-3">
          <AlertCircle class="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm text-yellow-800">{{ mensajeAlerta }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Acciones disponibles -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center mt-6">
      <UButton
        @click="handleVisualizarPDF"
        variant="outline"
        :disabled="pdfLoading"
        class="flex items-center gap-2 bg-white text-gray-900"
      >
        <Eye v-if="!pdfLoading" class="h-4 w-4" />
        <span
          v-if="pdfLoading"
          class="loading loading-spinner loading-xs"
        ></span>
        {{ pdfLoading ? "Cargando..." : "Ver documento" }}
      </UButton>

      <UButton
        @click="handleDescargarPDF"
        variant="outline"
        :disabled="pdfLoading"
        class="flex items-center gap-2 bg-white text-gray-900"
      >
        <Download v-if="!pdfLoading" class="h-4 w-4" />
        <span
          v-if="pdfLoading"
          class="loading loading-spinner loading-xs"
        ></span>
        {{ pdfLoading ? "Descargando..." : "Descargar PDF" }}
      </UButton>

      <UButton
        @click="irAlInicio"
        class="flex items-center gap-2 w-full sm:w-auto"
      >
        <Home class="h-4 w-4" />
        Ir al dashboard
      </UButton>
    </div>

    <!-- Información de contacto -->
    <UCard class="mt-8 bg-green-50 border-green-300">
      <div class="text-center">
        <h3 class="text-lg font-semibold text-green-900 mb-2">
          ¿Necesitas ayuda?
        </h3>
        <p class="text-gray-500 mb-4">
          Puedes contactarnos para cualquier pregunta sobre tu solicitud
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center text-sm">
          <div class="flex items-center gap-2 text-green-700">
            <Mail class="h-4 w-4" />
            <span>creditos@comfaca.com</span>
          </div>
          <div class="flex items-center gap-2 text-blue-700">
            <Phone class="h-4 w-4" />
            <span>+(57) 1 234 5678</span>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Download,
  Home,
  FileText,
  Eye,
  AlertCircle,
} from "lucide-vue-next";

import Badge from "@/components/shared/Badge.vue";
import SolicitudTimeline from "~/components/shared/SolicitudTimeline.vue";
import { useSpecialThanksPage } from "~/composables/solicitud/useSpecialThanksPage";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const {
  // Estado y datos
  solicitudId,
  mostrarAlerta,
  mensajeAlerta,
  fechaEnvio,
  estadosTimeline,

  // Estado del PDF
  pdfLoading,
  pdfError,
  tienePDF,
  estadoPdf,

  // Funciones
  handleVisualizarPDF,
  handleDescargarPDF,
  irAlInicio,
} = useSpecialThanksPage();
</script>
