<template>
  <div class="mx-auto max-w-5xl p-4 sm:p-8">
    <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 class="text-2xl font-semibold tracking-tight">Documentos</h1>
      <p class="mt-2 text-sm text-zinc-600">
        Este módulo estará disponible próximamente.
      </p>

      <div class="mt-4">
        <NuxtLink
          to="/"
          class="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Volver al dashboard
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})
</script>
