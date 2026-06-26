/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PrismaClient } from "../generated/prisma/client";

/**
 * Seed del CMS dinámico de páginas públicas.
 *
 * Se inserta en la tabla `configurations` con `categoria = "cms"` y
 * `clave = "cms.<slug>.<seccion>.<campo>"`. La fecha de "actualización"
 * se deja en null para que la página indique "recién creado".
 */

const ahora = () => new Date();

const makeField = (
  clave: string,
  valor: string,
  tipo: "text" | "html" | "image" | "json",
  descripcion?: string
) => ({
  clave,
  valor,
  tipo,
  categoria: "cms",
  descripcion: descripcion ?? null,
  editable: true,
  required: false,
  created_at: ahora(),
  updated_at: ahora()
});

const productos = [
  // Hero
  makeField(
    "cms.productos.hero.titulo",
    "Nuestros créditos",
    "text",
    "Título principal de la página de productos"
  ),
  makeField(
    "cms.productos.hero.subtitulo",
    "Soluciones financieras diseñadas para cada momento de tu vida. Encuentra el crédito perfecto para ti.",
    "text",
    "Subtítulo del hero de productos"
  ),
  // Features
  makeField(
    "cms.productos.features.items",
    JSON.stringify([
      { icono: "i-lucide-zap", titulo: "Aprobación rápida", descripcion: "Respuesta en minutos" },
      { icono: "i-lucide-shield-check", titulo: "100% Seguro", descripcion: "Tus datos protegidos" },
      { icono: "i-lucide-file-check", titulo: "Sin papeleo", descripcion: "Todo digital" },
      { icono: "i-lucide-clock", titulo: "24/7", descripcion: "Solicita cuando quieras" }
    ]),
    "json",
    "Lista de características destacadas del hero"
  ),
  // Productos
  makeField(
    "cms.productos.productos.items",
    JSON.stringify([
      {
        nombre: "Libre Inversión",
        descripcion: "Haz realidad lo que tienes en mente. Sin restricciones de uso, libre destinación.",
        icono: "i-lucide-sparkles",
        color: "primary",
        monto: "$1M - $50M",
        plazo: "12 - 60 meses",
        destacado: true
      },
      {
        nombre: "Vivienda",
        descripcion: "El hogar de tus sueños empieza aquí. Tasas preferenciales y plazos extendidos.",
        icono: "i-lucide-home",
        color: "accent",
        monto: "$50M - $500M",
        plazo: "60 - 240 meses",
        destacado: false
      },
      {
        nombre: "Educación",
        descripcion: "Invierte en tu futuro profesional. Financia tu educación o la de tu familia.",
        icono: "i-lucide-graduation-cap",
        color: "secondary",
        monto: "$1M - $30M",
        plazo: "12 - 48 meses",
        destacado: false
      },
      {
        nombre: "Turismo",
        descripcion: "Escápate sin preocupaciones. Vive experiencias únicas en cualquier destino.",
        icono: "i-lucide-plane",
        color: "primary",
        monto: "$500K - $20M",
        plazo: "6 - 24 meses",
        destacado: false
      },
      {
        nombre: "Vestuario",
        descripcion: "Renueva tu estilo hoy mismo. Aprobación inmediata para tu guardarropa.",
        icono: "i-lucide-shirt",
        color: "accent",
        monto: "$500K - $10M",
        plazo: "3 - 18 meses",
        destacado: false
      },
      {
        nombre: "Personalizado",
        descripcion: "Soluciones a tu medida. Cuéntanos qué necesitas y lo hacemos realidad.",
        icono: "i-lucide-settings",
        color: "muted",
        monto: "A convenir",
        plazo: "Flexible",
        destacado: false
      }
    ]),
    "json",
    "Listado de productos (cards)"
  ),
  // CTA
  makeField("cms.productos.cta.titulo", "¿Necesitas ayuda para elegir?", "text"),
  makeField(
    "cms.productos.cta.descripcion",
    "Nuestros asesores te guiarán para encontrar la mejor opción según tus necesidades.",
    "text"
  ),
  makeField("cms.productos.cta.primary_label", "Hablar con un asesor", "text"),
  makeField("cms.productos.cta.primary_href", "/contact", "text"),
  makeField("cms.productos.cta.secondary_label", "Simular crédito", "text"),
  makeField("cms.productos.cta.secondary_href", "/", "text")
];

const nosotros = [
  // Hero
  makeField("cms.nosotros.hero.titulo", "Tu aliado financiero", "text"),
  makeField(
    "cms.nosotros.hero.subtitulo",
    "Más de 10 años ayudando a familias colombianas a cumplir sus sueños. Transparencia, rapidez y seguridad en cada crédito.",
    "text"
  ),
  // Stats
  makeField(
    "cms.nosotros.stats.items",
    JSON.stringify([
      { valor: "10+", label: "Años de experiencia" },
      { valor: "50K+", label: "Clientes satisfechos" },
      { valor: "98%", label: "Tasa de aprobación" },
      { valor: "24h", label: "Tiempo de respuesta" }
    ]),
    "json",
    "Indicadores clave en cards"
  ),
  // Valores
  makeField("cms.nosotros.valores.titulo", "Nuestros valores", "text"),
  makeField("cms.nosotros.valores.subtitulo", "Lo que nos define cada día", "text"),
  makeField(
    "cms.nosotros.valores.items",
    JSON.stringify([
      {
        icono: "i-lucide-file-check",
        titulo: "Sin trámites",
        descripcion: "Proceso 100% digital. Olvídate de las filas y el papeleo tradicional."
      },
      {
        icono: "i-lucide-zap",
        titulo: "Rapidez",
        descripcion: "Respuesta en minutos, no en días. Tu tiempo es lo más valioso."
      },
      {
        icono: "i-lucide-shield-check",
        titulo: "Seguridad",
        descripcion: "Tus datos están protegidos con los más altos estándares de seguridad."
      },
      {
        icono: "i-lucide-handshake",
        titulo: "Transparencia",
        descripcion: "Sin letras pequeñas. Términos claros desde el primer momento."
      }
    ]),
    "json",
    "Lista de valores"
  ),
  // Equipo
  makeField(
    "cms.nosotros.equipo.items",
    JSON.stringify([
      {
        nombre: "Equipo Comfaca",
        rol: "Tu aliado financiero",
        descripcion:
          "Más de una década ayudando a familias colombianas a cumplir sus sueños."
      }
    ]),
    "json",
    "Equipo"
  ),
  // CTA
  makeField("cms.nosotros.cta.titulo", "¿Listo para empezar?", "text"),
  makeField(
    "cms.nosotros.cta.descripcion",
    "Descubre cómo podemos ayudarte a alcanzar tus metas financieras.",
    "text"
  ),
  makeField("cms.nosotros.cta.primary_label", "Ver productos", "text"),
  makeField("cms.nosotros.cta.primary_href", "/products", "text"),
  makeField("cms.nosotros.cta.secondary_label", "Contactar", "text"),
  makeField("cms.nosotros.cta.secondary_href", "/contact", "text")
];

const contacto = [
  // Hero
  makeField("cms.contacto.hero.titulo", "Contáctanos", "text"),
  makeField(
    "cms.contacto.hero.subtitulo",
    "Estamos aquí para ayudarte. Completa el formulario y te responderemos en menos de 24 horas.",
    "text"
  ),
  // Cards de contacto
  makeField(
    "cms.contacto.contacto_info.items",
    JSON.stringify([
      {
        icono: "i-lucide-mail",
        label: "Email",
        valor: "info@comfaca.com",
        href: "mailto:info@comfaca.com",
        descripcion: "Respondemos en 24h"
      },
      {
        icono: "i-lucide-phone",
        label: "Teléfono",
        valor: "+57 300 123 4567",
        href: "tel:+573001234567",
        descripcion: "Lun - Vie 8am - 5pm"
      },
      {
        icono: "i-lucide-map-pin",
        label: "Oficina",
        valor: "Florencia, Caquetá",
        href: "#",
        descripcion: "Colombia"
      }
    ]),
    "json",
    "Tarjetas de contacto (email, teléfono, oficina)"
  ),
  // Redes
  makeField(
    "cms.contacto.redes.items",
    JSON.stringify([
      { icono: "i-lucide-facebook", label: "Facebook", href: "#" },
      { icono: "i-lucide-instagram", label: "Instagram", href: "#" },
      { icono: "i-lucide-linkedin", label: "LinkedIn", href: "#" },
      { icono: "i-lucide-message-circle", label: "WhatsApp", href: "#" }
    ]),
    "json",
    "Redes sociales"
  )
];

const inicio = [
  // Carrusel del hero (página principal)
  makeField(
    "cms.inicio.carrusel.slides",
    JSON.stringify([
      {
        id: "slide-1",
        eyebrow: "100% Online y Seguro",
        titulo: "El impulso que necesitas,",
        titulo_acento: "a un clic de distancia",
        descripcion:
          "Obtén el crédito que necesitas de forma rápida, segura y sin trámites físicos. Tu aliado financiero para hacer realidad tus proyectos.",
        imagen: "",
        primary_label: "Ver opciones de crédito",
        primary_href: "/products",
        secondary_label: "Conoce el proceso",
        secondary_href: "#proceso",
        alineacion: "left"
      },
      {
        id: "slide-2",
        eyebrow: "Comfaca Créditos",
        titulo: "Tu aliado financiero",
        titulo_acento: "de confianza",
        descripcion:
          "Más de 10 años ayudando a familias colombianas a cumplir sus sueños. Transparencia, rapidez y seguridad en cada crédito.",
        imagen: "",
        primary_label: "Conócenos",
        primary_href: "/about",
        secondary_label: "Hablar con un asesor",
        secondary_href: "/contact",
        alineacion: "left"
      },
      {
        id: "slide-3",
        eyebrow: "Solicita en minutos",
        titulo: "Créditos diseñados",
        titulo_acento: "para cada momento",
        descripcion:
          "Libre inversión, vivienda, educación, turismo y más. Encuentra el crédito perfecto para ti y solicítalo 100% en línea.",
        imagen: "",
        primary_label: "Ver productos",
        primary_href: "/products",
        secondary_label: "Simular crédito",
        secondary_href: "/",
        alineacion: "left"
      }
    ]),
    "json",
    "Slides del carrusel hero de la página principal"
  )
];

export const cmsContenido = [...productos, ...nosotros, ...contacto, ...inicio];

export async function seedCmsContenido(prisma: PrismaClient) {
  for (const field of cmsContenido) {
    await prisma.configurations.upsert({
      where: { clave: field.clave },
      create: field as any,
      update: {
        valor: field.valor,
        tipo: field.tipo,
        descripcion: field.descripcion,
        updated_at: field.updated_at
      }
    });
  }
  return cmsContenido.length;
}