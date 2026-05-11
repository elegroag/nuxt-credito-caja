<script setup lang="ts">
import { z } from "zod";

definePageMeta({
  layout: "public",
});

const formSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Asunto requerido"),
  message: z.string().min(10, "Mensaje muy corto"),
});

const form = ref({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);
const submitted = ref(false);
const focusedField = ref<string | null>(null);

const validateField = (field: keyof typeof form.value) => {
  const result = formSchema.safeParse({ ...form.value });
  if (!result.success) {
    const fieldError = result.error.issues.find((e) => e.path[0] === field);
    if (fieldError) {
      errors.value[field] = fieldError.message;
    } else {
      delete errors.value[field];
    }
  } else {
    delete errors.value[field];
  }
};

const submitForm = async () => {
  const result = formSchema.safeParse(form.value);
  if (!result.success) {
    errors.value = {};
    result.error.issues.forEach((e) => {
      errors.value[e.path[0] as string] = e.message;
    });
    return;
  }

  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  loading.value = false;
  submitted.value = true;
};

const contactInfo = [
  {
    icon: "i-lucide-mail",
    label: "Email",
    value: "info@comfaca.com",
    href: "mailto:info@comfaca.com",
    description: "Respondemos en 24h",
  },
  {
    icon: "i-lucide-phone",
    label: "Teléfono",
    value: "+57 300 123 4567",
    href: "tel:+573001234567",
    description: "Lun - Vie 8am - 5pm",
  },
  {
    icon: "i-lucide-map-pin",
    label: "Oficina",
    value: "Florencia, Caquetá",
    href: "#",
    description: "Colombia",
  },
];

const socialLinks = [
  { icon: "i-lucide-facebook", label: "Facebook", href: "#" },
  { icon: "i-lucide-instagram", label: "Instagram", href: "#" },
  { icon: "i-lucide-linkedin", label: "LinkedIn", href: "#" },
  { icon: "i-lucide-message-circle", label: "WhatsApp", href: "#" },
];
</script>

<template>
  <section class="min-h-screen bg-background">
    <!-- Hero Header -->
    <div class="relative overflow-hidden">
      <div
        class="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5"
      />
      <div
        class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center"
      >
        <h1
          class="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight"
        >
          Contáctanos
        </h1>
        <p class="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Estamos aquí para ayudarte. Completa el formulario y te responderemos
          en menos de 24 horas.
        </p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 mt-10">
      <!-- Contact Cards -->
      <div class="grid sm:grid-cols-3 gap-4 mb-12">
        <a
          v-for="info in contactInfo"
          :key="info.label"
          :href="info.href"
          class="group relative bg-card rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-primary/20"
        >
          <div
            class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
          >
            <UIcon :name="info.icon" class="w-5 h-5 text-primary" />
          </div>
          <p class="text-sm text-muted-foreground">{{ info.label }}</p>
          <p class="text-foreground font-medium mt-1">{{ info.value }}</p>
          <p class="text-xs text-muted-foreground mt-2">
            {{ info.description }}
          </p>
        </a>
      </div>

      <!-- Form Section -->
      <div class="relative">
        <div v-if="submitted" class="bg-card rounded-3xl p-12 text-center">
          <div
            class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <UIcon name="i-lucide-check" class="w-10 h-10 text-primary" />
          </div>
          <h2 class="text-2xl font-semibold text-foreground mb-2">
            ¡Mensaje enviado!
          </h2>
          <p class="text-muted-foreground mb-6">
            Gracias por contactarnos. Te responderemos pronto.
          </p>
          <UButton
            color="neutral"
            variant="soft"
            @click="
              submitted = false;
              form = {
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
              };
            "
          >
            Enviar otro mensaje
          </UButton>
        </div>

        <form
          v-else
          @submit.prevent="submitForm"
          class="bg-card rounded-3xl p-8 sm:p-12"
        >
          <div class="grid sm:grid-cols-2 gap-6 mb-6">
            <!-- Name -->
            <div class="relative">
              <label class="block text-sm font-medium text-foreground mb-2">
                Nombre <span class="text-primary">*</span>
              </label>
              <div class="relative">
                <UIcon
                  name="i-lucide-user"
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Tu nombre"
                  class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                  :class="{ 'ring-2 ring-red-500/20': errors.name }"
                  @blur="validateField('name')"
                  @focus="focusedField = 'name'"
                />
              </div>
              <p v-if="errors.name" class="mt-1 text-xs text-red-500">
                {{ errors.name }}
              </p>
            </div>

            <!-- Email -->
            <div class="relative">
              <label class="block text-sm font-medium text-foreground mb-2">
                Email <span class="text-primary">*</span>
              </label>
              <div class="relative">
                <UIcon
                  name="i-lucide-mail"
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="tu@email.com"
                  class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                  :class="{ 'ring-2 ring-red-500/20': errors.email }"
                  @blur="validateField('email')"
                  @focus="focusedField = 'email'"
                />
              </div>
              <p v-if="errors.email" class="mt-1 text-xs text-red-500">
                {{ errors.email }}
              </p>
            </div>

            <!-- Phone -->
            <div class="relative">
              <label class="block text-sm font-medium text-foreground mb-2"
                >Teléfono</label
              >
              <div class="relative">
                <UIcon
                  name="i-lucide-phone"
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                  @focus="focusedField = 'phone'"
                />
              </div>
            </div>

            <!-- Subject -->
            <div class="relative">
              <label class="block text-sm font-medium text-foreground mb-2">
                Asunto <span class="text-primary">*</span>
              </label>
              <div class="relative">
                <UIcon
                  name="i-lucide-message-square"
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                  v-model="form.subject"
                  type="text"
                  placeholder="¿En qué te ayudamos?"
                  class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                  :class="{ 'ring-2 ring-red-500/20': errors.subject }"
                  @blur="validateField('subject')"
                  @focus="focusedField = 'subject'"
                />
              </div>
              <p v-if="errors.subject" class="mt-1 text-xs text-red-500">
                {{ errors.subject }}
              </p>
            </div>
          </div>

          <!-- Message -->
          <div class="relative mb-8">
            <label class="block text-sm font-medium text-foreground mb-2">
              Mensaje <span class="text-primary">*</span>
            </label>
            <textarea
              v-model="form.message"
              rows="5"
              placeholder="Cuéntanos en qué podemos ayudarte..."
              class="w-full px-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all resize-none"
              :class="{ 'ring-2 ring-red-500/20': errors.message }"
              @blur="validateField('message')"
              @focus="focusedField = 'message'"
            />
            <p v-if="errors.message" class="mt-1 text-xs text-red-500">
              {{ errors.message }}
            </p>
          </div>

          <!-- Submit -->
          <div class="flex flex-col sm:flex-row items-center gap-4">
            <UButton
              type="submit"
              color="primary"
              size="xl"
              :loading="loading"
              class="w-full sm:w-auto px-8"
            >
              <template #leading>
                <UIcon v-if="!loading" name="i-lucide-send" class="w-4 h-4" />
              </template>
              Enviar mensaje
            </UButton>
            <p class="text-sm text-muted-foreground">
              <span class="text-primary">*</span> Campos requeridos
            </p>
          </div>
        </form>
      </div>

      <!-- Social Links -->
      <div class="mt-12 text-center">
        <p class="text-sm text-muted-foreground mb-4">Síguenos en redes</p>
        <div class="flex justify-center gap-3">
          <a
            v-for="social in socialLinks"
            :key="social.label"
            :href="social.href"
            class="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"
            :aria-label="social.label"
          >
            <UIcon :name="social.icon" class="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
