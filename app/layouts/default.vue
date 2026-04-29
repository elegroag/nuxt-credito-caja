<template>
  <div class="flex flex-col h-screen">
    <SharedHeader />
    <main class="container mx-auto flex-1 mt-2">
      <slot />
    </main>
    <SharedFooter />
  </div>
</template>
