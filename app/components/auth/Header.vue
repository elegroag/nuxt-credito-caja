<template>
  <div class="text-center mb-8">
    <!-- Logo Icon -->
    <div
      class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
    >
      <UIcon :name="getIcon()" class="w-8 h-8 text-primary" />
    </div>
    <!-- Title -->
    <h1 class="text-2xl font-bold text-foreground">{{ getTitle() }}</h1>
    <p class="text-sm text-muted-foreground mt-1">{{ getSubtitle() }}</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const getIcon = () => {
  if (route.path.includes("adviser")) return "i-lucide-briefcase";
  if (route.path.includes("registro")) return "i-lucide-user-plus";
  return "i-lucide-user";
};

const getTitle = () => {
  if (route.path.includes("adviser")) return "Portal de Asesores";
  if (route.path.includes("registro")) return "Crear cuenta";
  return "Bienvenido";
};

const getSubtitle = () => {
  if (route.path.includes("adviser"))
    return "Acceso exclusivo para asesores SISU";
  if (route.path.includes("registro"))
    return "Completa los pasos para registrarte";
  return "Ingresa tus credenciales para continuar";
};
</script>
