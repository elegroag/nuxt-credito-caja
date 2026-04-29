<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui";

const links = ref<ButtonProps[]>([
  {
    label: "Get started",
    color: "neutral",
  },
  {
    label: "Learn more",
    color: "neutral",
    variant: "subtle",
    trailingIcon: "i-lucide-arrow-right",
  },
]);

definePageMeta({
  layout: "public",
});
</script>

<template>
  <PublicHero />
  <UPageCTA
    title="Trusted and supported by our amazing community"
    description="We've built a strong, lasting partnership. Their trust is our driving force, propelling us towards shared success."
    orientation="horizontal"
    :links="links"
  >
    <img
      src="https://picsum.photos/640/728"
      width="320"
      height="364"
      alt="Illustration"
      class="w-full rounded-lg"
      loading="lazy"
    />
  </UPageCTA>
  <PublicProcess />
  <PublicTestimonials />
</template>
