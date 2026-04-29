<script lang="ts" setup></script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <SharedHeader />
    <main>
      <slot />
    </main>
    <PublicFooter />
  </div>
</template>
