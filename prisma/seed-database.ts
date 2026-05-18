import prisma from "../lib/prisma.ts";
import { estadosSolicitud } from "./seeders/estados-solicitud.seed";
import { users } from "./seeders/users.seed";
import { documentosPostulantes } from "./seeders/documentos-postulantes.seed";
import { empresasConvenio } from "./seeders/empresas-convenio.seed";
import { modules } from "./seeders/modules.seed";
import { notifications } from "./seeders/notifications.seed";
import { numeroSolicitudes } from "./seeders/numero-solicitudes.seed";
import { pdfsGenerados } from "./seeders/pdfs-generados.seed";
import { personalAccessTokens } from "./seeders/personal-access-tokens.seed";
import { roles } from "./seeders/roles.seed";
import { sessions } from "./seeders/sessions.seed";
import { solicitudDocumentos } from "./seeders/solicitud-documentos.seed";
import { solicitudPayload } from "./seeders/solicitud-payload.seed";
import { solicitudSolicitante } from "./seeders/solicitud-solicitante.seed";
import { solicitudTimeline } from "./seeders/solicitud-timeline.seed";
import { solicitudesCredito } from "./seeders/solicitudes-credito.seed";
import { tipoDocumentos } from "./seeders/tipo-documentos.seed";
import { firmantesSolicitud } from "./seeders/firmantes-solicitud.seed";
import { configurations } from "./seeders/configurations.seed";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  await seedEstadosSolicitud();
  await seedRoles();
  await seedModules();
  await seedTipoDocumentos();
  await seedEmpresasConvenio();
  await seedUsers();
  await seedSessions();
  await seedPersonalAccessTokens();
  // await seedNotifications();
  await resetUsersAndSolicitudes();
  await seedUsers();
  await seedNumeroSolicitudes();
  await seedSolicitudesCredito();
  await seedSolicitudSolicitante();
  await seedSolicitudPayload();
  await seedSolicitudTimeline();
  await seedSolicitudDocumentos();
  await seedDocumentosPostulantes();
  // await seedPdfsGenerados();
  await seedFirmantesSolicitud();
  await seedConfigurations();
}

async function _resetSolicitudesTables() {
  console.log("Limpiando tablas de solicitudes...");
  await prisma.solicitud_documentos.deleteMany({});
  await prisma.firmantes_solicitud.deleteMany({});
  await prisma.solicitud_timeline.deleteMany({});
  await prisma.solicitud_payload.deleteMany({});
  await prisma.solicitud_solicitante.deleteMany({});
  await prisma.solicitudes_credito.deleteMany({});
  await prisma.numero_solicitudes.deleteMany({});
  console.log("✅ Tablas de solicitudes limpiadas");
}

async function seedConfigurations() {
  console.log("Seeding configurations...");

  const countConfig = await prisma.configurations.count();
  if (countConfig == 0) {
    const configData = configurations.map((config) => {
      return {
        ...config,
        created_at: new Date(config.created_at).toISOString(),
        updated_at: new Date(config.updated_at).toISOString()
      };
    });
    await prisma.configurations.createMany({
      data: configData as unknown[]
    });
    console.log("✅ Configurations seeded");
  } else {
    console.log("⏭️  Configurations already seeded");
  }
}

async function seedEstadosSolicitud() {
  console.log("Seeding estados_solicitud...");

  const countEstados = await prisma.estados_solicitud.count();
  if (countEstados == 0) {
    await prisma.estados_solicitud.createMany({
      data: estadosSolicitud as unknown[]
    });
    console.log("✅ Estados de solicitud seeded");
  } else {
    console.log("⏭️  Estados de solicitud already seeded");
  }
}

async function seedUsers() {
  console.log("Seeding users...");

  const countUser = await prisma.users.count();
  if (countUser == 0) {
    const userData = users.map((user) => {
      const { password_hardcoded, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        password_hash: bcrypt.hashSync(password_hardcoded, 10),
        email_verified_at: user.email_verified_at
          ? new Date(user.email_verified_at).toISOString()
          : null,
        created_at: new Date(user.created_at).toISOString(),
        updated_at: new Date(user.updated_at).toISOString()
      };
    });

    await prisma.users.createMany({
      data: userData as unknown[]
    });
    console.log("✅ Users seeded");
  } else {
    console.log("⏭️  Users already seeded");
  }
}

async function resetUsersAndSolicitudes() {
  console.log("Limpiando users y solicitudes...");
  await prisma.solicitud_documentos.deleteMany({});
  await prisma.firmantes_solicitud.deleteMany({});
  await prisma.solicitud_timeline.deleteMany({});
  await prisma.solicitud_payload.deleteMany({});
  await prisma.solicitud_solicitante.deleteMany({});
  await prisma.solicitudes_credito.deleteMany({});
  await prisma.numero_solicitudes.deleteMany({});
  await prisma.users.deleteMany({});
  console.log("✅ Users y solicitudes limpiados");
}

async function seedRoles() {
  console.log("Seeding roles...");

  const countRoles = await prisma.roles.count();
  if (countRoles == 0) {
    const rolesData = roles.map((role) => {
      return {
        ...role,
        created_at: new Date(role.created_at).toISOString(),
        updated_at: new Date(role.updated_at).toISOString()
      };
    });

    await prisma.roles.createMany({
      data: rolesData as unknown[]
    });
    console.log("✅ Roles seeded");
  } else {
    console.log("⏭️  Roles already seeded");
  }
}

async function seedModules() {
  console.log("Seeding modules...");

  const countModules = await prisma.modules.count();
  if (countModules == 0) {
    const modulesData = modules.map((module) => {
      return {
        ...module,
        created_at: new Date(module.created_at).toISOString(),
        updated_at: new Date(module.updated_at).toISOString()
      };
    });
    await prisma.modules.createMany({
      data: modulesData as unknown[]
    });
    console.log("✅ Modules seeded");
  } else {
    console.log("⏭️  Modules already seeded");
  }
}

async function seedTipoDocumentos() {
  console.log("Seeding tipo_documentos...");

  const countTipoDocumentos = await prisma.tipo_documentos.count();
  if (countTipoDocumentos == 0) {
    const tipoDocumentosData = tipoDocumentos.map((tipo) => {
      return {
        ...tipo,
        created_at: new Date(tipo.created_at).toISOString(),
        updated_at: new Date(tipo.updated_at).toISOString()
      };
    });
    await prisma.tipo_documentos.createMany({
      data: tipoDocumentosData as unknown[]
    });
    console.log("✅ Tipo documentos seeded");
  } else {
    console.log("⏭️  Tipo documentos already seeded");
  }
}

async function seedEmpresasConvenio() {
  console.log("Seeding empresas_convenio...");

  const countEmpresas = await prisma.empresas_convenio.count();
  if (countEmpresas == 0) {
    const empresasData = empresasConvenio.map((empresa) => {
      return {
        ...empresa,
        created_at: new Date(empresa.created_at).toISOString(),
        updated_at: new Date(empresa.updated_at).toISOString(),
        fecha_convenio: new Date(empresa.fecha_convenio).toISOString(),
        fecha_vencimiento: new Date(empresa.fecha_vencimiento).toISOString()
      };
    });
    await prisma.empresas_convenio.createMany({
      data: empresasData as unknown[]
    });
    console.log("✅ Empresas convenio seeded");
  } else {
    console.log("⏭️  Empresas convenio already seeded");
  }
}

async function seedSessions() {
  console.log("Seeding sessions...");

  const countSessions = await prisma.sessions.count();
  if (countSessions == 0) {
    await prisma.sessions.createMany({
      data: sessions as unknown[]
    });
    console.log("✅ Sessions seeded");
  } else {
    console.log("⏭️  Sessions already seeded");
  }
}

async function seedPersonalAccessTokens() {
  console.log("Seeding personal_access_tokens...");

  const countTokens = await prisma.personal_access_tokens.count();
  if (countTokens == 0) {
    const tokensData = personalAccessTokens.map((token) => {
      return {
        ...token,
        last_used_at: token.last_used_at
          ? new Date(token.last_used_at).toISOString()
          : null,
        expires_at: token.expires_at
          ? new Date(token.expires_at).toISOString()
          : null,
        created_at: new Date(token.created_at).toISOString(),
        updated_at: new Date(token.updated_at).toISOString()
      };
    });
    await prisma.personal_access_tokens.createMany({
      data: tokensData as unknown[]
    });
    console.log("✅ Personal access tokens seeded");
  } else {
    console.log("⏭️  Personal access tokens already seeded");
  }
}

async function _seedNotifications() {
  console.log("Seeding notifications...");

  const countNotifications = await prisma.notifications.count();
  if (countNotifications == 0) {
    const notificationsData = notifications.map((notification) => {
      return {
        ...notification,
        read_at: notification.read_at
          ? new Date(notification.read_at).toISOString()
          : null,
        created_at: new Date(notification.created_at).toISOString(),
        updated_at: new Date(notification.updated_at).toISOString()
      };
    });
    await prisma.notifications.createMany({
      data: notificationsData as unknown[]
    });
    console.log("✅ Notifications seeded");
  } else {
    console.log("⏭️  Notifications already seeded");
  }
}

async function seedNumeroSolicitudes() {
  console.log("Seeding numero_solicitudes...");

  const countNumero = await prisma.numero_solicitudes.count();
  if (countNumero == 0) {
    const numeroData = numeroSolicitudes.map((numero) => {
      return {
        ...numero,
        created_at: new Date(numero.created_at).toISOString(),
        updated_at: new Date(numero.updated_at).toISOString()
      };
    });
    await prisma.numero_solicitudes.createMany({
      data: numeroData as unknown[]
    });
    console.log("✅ Numero solicitudes seeded");
  } else {
    console.log("⏭️  Numero solicitudes already seeded");
  }
}

async function seedSolicitudesCredito() {
  console.log("Seeding solicitudes_credito...");

  const countSolicitudes = await prisma.solicitudes_credito.count();
  if (countSolicitudes == 0) {
    const solicitudesData = solicitudesCredito.map((solicitud) => {
      return {
        ...solicitud,
        pdf_generado: solicitud.pdf_generado
          ? {
              ...solicitud.pdf_generado,
              generated_at: solicitud.pdf_generado.generated_at
                ? new Date(solicitud.pdf_generado.generated_at).toISOString()
                : null
            }
          : null,
        created_at: new Date(solicitud.created_at).toISOString(),
        updated_at: new Date(solicitud.updated_at).toISOString(),
        fecha_radicado: solicitud.fecha_radicado
          ? new Date(solicitud.fecha_radicado).toISOString()
          : null
      };
    });
    await prisma.solicitudes_credito.createMany({
      data: solicitudesData as unknown[]
    });
    console.log("✅ Solicitudes credito seeded");
  } else {
    console.log("⏭️  Solicitudes credito already seeded");
  }
}

async function seedSolicitudSolicitante() {
  console.log("Seeding solicitud_solicitante...");

  const countSolicitante = await prisma.solicitud_solicitante.count();
  if (countSolicitante == 0) {
    const solicitanteData = solicitudSolicitante.map((solicitante) => {
      return {
        ...solicitante,
        fecha_nacimiento: solicitante.fecha_nacimiento
          ? new Date(solicitante.fecha_nacimiento).toISOString()
          : null,
        fecha_expedicion: solicitante.fecha_expedicion
          ? new Date(solicitante.fecha_expedicion).toISOString()
          : null,
        created_at: new Date(solicitante.created_at).toISOString(),
        updated_at: new Date(solicitante.updated_at).toISOString()
      };
    });
    await prisma.solicitud_solicitante.createMany({
      data: solicitanteData as unknown[]
    });
    console.log("✅ Solicitud solicitante seeded");
  } else {
    console.log("⏭️  Solicitud solicitante already seeded");
  }
}

async function seedSolicitudPayload() {
  console.log("Seeding solicitud_payload...");

  const countPayload = await prisma.solicitud_payload.count();
  if (countPayload == 0) {
    const payloadData = solicitudPayload.map((payload) => {
      return {
        ...payload,
        created_at: new Date(payload.created_at).toISOString(),
        updated_at: new Date(payload.updated_at).toISOString()
      };
    });
    await prisma.solicitud_payload.createMany({
      data: payloadData as unknown[]
    });
    console.log("✅ Solicitud payload seeded");
  } else {
    console.log("⏭️  Solicitud payload already seeded");
  }
}

async function seedSolicitudTimeline() {
  console.log("Seeding solicitud_timeline...");

  const countTimeline = await prisma.solicitud_timeline.count();
  if (countTimeline == 0) {
    const timelineData = solicitudTimeline.map((timeline) => {
      return {
        ...timeline,
        fecha: new Date(timeline.fecha).toISOString(),
        created_at: new Date(timeline.created_at).toISOString(),
        updated_at: new Date(timeline.updated_at).toISOString()
      };
    });
    await prisma.solicitud_timeline.createMany({
      data: timelineData as unknown[]
    });
    console.log("✅ Solicitud timeline seeded");
  } else {
    console.log("⏭️  Solicitud timeline already seeded");
  }
}

async function seedSolicitudDocumentos() {
  console.log("Seeding solicitud_documentos...");

  const countDocumentos = await prisma.solicitud_documentos.count();
  if (countDocumentos == 0) {
    const documentosData = solicitudDocumentos.map((documento) => {
      return {
        ...documento,
        deleted_at: documento.deleted_at
          ? new Date(documento.deleted_at).toISOString()
          : null,
        created_at: new Date(documento.created_at).toISOString(),
        updated_at: new Date(documento.updated_at).toISOString()
      };
    });
    await prisma.solicitud_documentos.createMany({
      data: documentosData as unknown[]
    });
    console.log("✅ Solicitud documentos seeded");
  } else {
    console.log("⏭️  Solicitud documentos already seeded");
  }
}

async function seedDocumentosPostulantes() {
  console.log("Seeding documentos_postulantes...");

  const countPostulantes = await prisma.documentos_postulantes.count();
  if (countPostulantes == 0) {
    const postulantesData = documentosPostulantes.map((postulante) => {
      return {
        ...postulante,
        created_at: new Date(postulante.created_at).toISOString(),
        updated_at: new Date(postulante.updated_at).toISOString()
      };
    });
    await prisma.documentos_postulantes.createMany({
      data: postulantesData as unknown[]
    });
    console.log("✅ Documentos postulantes seeded");
  } else {
    console.log("⏭️  Documentos postulantes already seeded");
  }
}

async function _seedPdfsGenerados() {
  console.log("Seeding pdfs_generados...");

  const countPdfs = await prisma.pdfs_generados.count();
  if (countPdfs == 0) {
    const pdfsData = pdfsGenerados.map((pdf) => {
      return {
        ...pdf,
        created_at: new Date(pdf.created_at).toISOString(),
        updated_at: new Date(pdf.updated_at).toISOString(),
        generado_en: {
          fecha: new Date(pdf.generado_en.fecha).toISOString(),
          usuario: pdf.generado_en.usuario,
          version: pdf.generado_en.version
        }
      };
    });
    await prisma.pdfs_generados.createMany({
      data: pdfsData as unknown[]
    });
    console.log("✅ PDFs generados seeded");
  } else {
    console.log("⏭️  PDFs generados already seeded");
  }
}

async function seedFirmantesSolicitud() {
  console.log("Seeding firmantes_solicitud...");

  const countFirmantes = await prisma.firmantes_solicitud.count();
  if (countFirmantes == 0) {
    const firmantesData = firmantesSolicitud.map((firmante) => {
      return {
        ...firmante,
        created_at: new Date(firmante.created_at).toISOString(),
        updated_at: new Date(firmante.updated_at).toISOString()
      };
    });
    await prisma.firmantes_solicitud.createMany({
      data: firmantesData as unknown[]
    });
    console.log("✅ Firmantes solicitud seeded");
  } else {
    console.log("⏭️  Firmantes solicitud already seeded");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });