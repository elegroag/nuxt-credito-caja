<template>
  <SharedHeader />
  <div
    class="min-h-dvh bg-background from-blue-50 to-indigo-100 flex justify-center p-4 sm:items-center sm:py-8"
  >
    <!-- Contenedor principal responsive -->
    <div
      :class="[
        'w-full space-y-8 lg:space-y-10',
        // Diferentes anchos máximos según la ruta
        $route.path.includes('adviser')
          ? 'max-w-md lg:max-w-lg xl:max-w-xl'
          : $route.path.includes('registro')
            ? 'max-w-4xl lg:max-w-5xl xl:max-w-6xl'
            : 'max-w-md lg:max-w-lg xl:max-w-xl'
      ]"
    >
      <AuthHeader />
      <!-- Card responsive -->
      <slot />
      <!-- Footer con información de Comfaca -->
      <AuthFooter />
    </div>
  </div>
</template>
