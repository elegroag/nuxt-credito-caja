<script setup>
const footerLinks = {
  productos: [
    { name: "Libre Inversión", href: "#creditos" },
    { name: "Vivienda", href: "#creditos" },
    { name: "Educación", href: "#creditos" },
    { name: "Turismo", href: "#creditos" },
  ],
  empresa: [
    { name: "Quiénes Somos", href: "#nosotros" },
    { name: "Proceso", href: "#proceso" },
    { name: "Testimonios", href: "#testimonios" },
    { name: "Blog", href: "#" },
  ],
  legal: [
    { name: "Términos y Condiciones", href: "#" },
    { name: "Política de Privacidad", href: "#" },
    { name: "Protección de Datos", href: "#" },
  ],
};

const socialLinks = [
  { name: "Facebook", icon: "facebook", href: "#" },
  { name: "Instagram", icon: "instagram", href: "#" },
  { name: "LinkedIn", icon: "linkedin", href: "#" },
  { name: "WhatsApp", icon: "whatsapp", href: "#" },
];

const scrollToSection = (href) => {
  if (href.startsWith("#")) {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }
};
</script>

<template>
  <footer class="bg-foreground text-background">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12"
      >
        <!-- Brand Column -->
        <div class="col-span-2 lg:col-span-2">
          <a
            href="#inicio"
            class="flex items-center gap-2"
            @click.prevent="scrollToSection('#inicio')"
          >
            <div
              class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span class="text-xl font-semibold text-background"
              >CréditoFácil</span
            >
          </a>
          <p class="mt-4 text-background/70 text-sm max-w-xs">
            Tu aliado financiero. Transparencia, rapidez y seguridad en cada
            crédito.
          </p>

          <!-- Social Links -->
          <div class="flex gap-3 mt-6">
            <a
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.href"
              class="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
              :aria-label="social.name"
            >
              <!-- Facebook -->
              <svg
                v-if="social.icon === 'facebook'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              <!-- Instagram -->
              <svg
                v-else-if="social.icon === 'instagram'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                />
              </svg>
              <!-- LinkedIn -->
              <svg
                v-else-if="social.icon === 'linkedin'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
              <!-- WhatsApp -->
              <svg
                v-else-if="social.icon === 'whatsapp'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Productos -->
        <div>
          <h3
            class="text-sm font-semibold text-background uppercase tracking-wider mb-4"
          >
            Productos
          </h3>
          <ul class="space-y-3">
            <li v-for="link in footerLinks.productos" :key="link.name">
              <a
                :href="link.href"
                class="text-sm text-background/70 hover:text-primary transition-colors"
                @click.prevent="scrollToSection(link.href)"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Empresa -->
        <div>
          <h3
            class="text-sm font-semibold text-background uppercase tracking-wider mb-4"
          >
            Empresa
          </h3>
          <ul class="space-y-3">
            <li v-for="link in footerLinks.empresa" :key="link.name">
              <a
                :href="link.href"
                class="text-sm text-background/70 hover:text-primary transition-colors"
                @click.prevent="scrollToSection(link.href)"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h3
            class="text-sm font-semibold text-background uppercase tracking-wider mb-4"
          >
            Legal
          </h3>
          <ul class="space-y-3">
            <li v-for="link in footerLinks.legal" :key="link.name">
              <a
                :href="link.href"
                class="text-sm text-background/70 hover:text-primary transition-colors"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-12 pt-8 border-t border-background/10">
        <div
          class="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p class="text-sm text-background/50">
            &copy; {{ new Date().getFullYear() }} CréditoFácil. Todos los
            derechos reservados.
          </p>
          <div class="flex items-center gap-6">
            <a
              href="#"
              class="text-sm text-background/50 hover:text-background transition-colors"
            >
              Contacto: info@creditofacil.com
            </a>
            <span class="text-background/30">|</span>
            <a
              href="#"
              class="text-sm text-background/50 hover:text-background transition-colors"
            >
              Tel: +57 300 123 4567
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
