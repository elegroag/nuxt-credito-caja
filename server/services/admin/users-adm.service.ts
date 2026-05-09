import prisma from "~~/lib/prisma";
import { z } from "zod";

// Schema de validación para crear usuario
const createUserSchema = z.object({
  username: z
    .string()
    .min(1, "El username es requerido")
    .max(255, "El username no puede exceder 255 caracteres"),
  email: z
    .string()
    .email("El email no es válido")
    .max(255, "El email no puede exceder 255 caracteres"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  apellido: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "El apellido no puede exceder 100 caracteres"),
  roles: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  tipo_documento: z
    .string()
    .max(20, "El tipo de documento no puede exceder 20 caracteres")
    .optional(),
  numero_documento: z
    .string()
    .max(20, "El número de documento no puede exceder 20 caracteres")
    .optional(),
  telefono: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional(),
});

interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  roles?: string[];
  disabled?: boolean;
  tipo_documento?: string;
  numero_documento?: string;
  telefono?: string;
}

const usersAdmService = () => {
  // Validar datos de creación de usuario
  const validateCreateUser = (data: any): CreateUserParams => {
    return createUserSchema.parse(data);
  };

  // Verificar si el username ya existe
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    const user = await prisma.users.findUnique({
      where: { username },
    });
    return !!user;
  };

  // Verificar si el email ya existe
  const checkEmailExists = async (email: string): Promise<boolean> => {
    const user = await prisma.users.findUnique({
      where: { email },
    });
    return !!user;
  };

  // Hashear contraseña
  const hashPassword = async (password: string): Promise<string> => {
    // Usar bcrypt o similar para hashear la contraseña
    // Por ahora retornamos el password plano, pero debería implementarse hasheo real
    return password;
  };

  // Crear usuario
  const createUser = async (params: CreateUserParams) => {
    const {
      username,
      email,
      password,
      nombre,
      apellido,
      roles,
      disabled = false,
      tipo_documento,
      numero_documento,
      telefono,
    } = params;

    // Verificar unicidad de username
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      throw new Error("El username ya está en uso");
    }

    // Verificar unicidad de email
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      throw new Error("El email ya está en uso");
    }

    // Hashear contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash: passwordHash,
        full_name: `${nombre} ${apellido}`,
        nombres: nombre,
        apellidos: apellido,
        roles: roles || [],
        disabled,
        tipo_documento,
        numero_documento,
        phone: telefono,
        is_active: !disabled,
      },
    });

    return user;
  };

  // Obtener usuario por username
  const getUserByUsername = async (username: string) => {
    return await prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        nombres: true,
        apellidos: true,
        roles: true,
        disabled: true,
        is_active: true,
        tipo_documento: true,
        numero_documento: true,
        phone: true,
        created_at: true,
        updated_at: true,
      },
    });
  };

  // Obtener usuario por ID
  const getUserById = async (id: number) => {
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        nombres: true,
        apellidos: true,
        roles: true,
        disabled: true,
        is_active: true,
        tipo_documento: true,
        numero_documento: true,
        phone: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Convertir BigInt a string para evitar errores de serialización
    if (user) {
      return {
        ...user,
        id: String(user.id),
      };
    }

    return user;
  };

  // Listar usuarios con paginación
  const listUsers = async (limit: number = 20, offset: number = 0) => {
    const users = await prisma.users.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        nombres: true,
        apellidos: true,
        roles: true,
        disabled: true,
        is_active: true,
        tipo_documento: true,
        numero_documento: true,
        phone: true,
        created_at: true,
        updated_at: true,
      },
    });

    const total = await prisma.users.count();

    return {
      data: users,
      total,
      limit,
      offset,
    };
  };

  // Actualizar usuario
  const updateUser = async (id: number, params: Partial<CreateUserParams>) => {
    const {
      email,
      password,
      nombre,
      apellido,
      roles,
      disabled,
      tipo_documento,
      numero_documento,
      telefono,
    } = params;

    const updateData: any = {};

    if (email !== undefined) {
      // Verificar unicidad de email si se está actualizando
      if (email) {
        const emailExists = await prisma.users.findFirst({
          where: {
            email,
            NOT: { id },
          },
        });
        if (emailExists) {
          throw new Error("El email ya está en uso");
        }
      }
      updateData.email = email;
    }

    if (password) {
      updateData.password_hash = await hashPassword(password);
    }

    if (nombre !== undefined || apellido !== undefined) {
      const user = await prisma.users.findUnique({ where: { id } });
      if (user) {
        updateData.nombres = nombre ?? user.nombres;
        updateData.apellidos = apellido ?? user.apellidos;
        updateData.full_name = `${updateData.nombres} ${updateData.apellidos}`;
      }
    }

    if (roles !== undefined) {
      updateData.roles = roles;
    }

    if (disabled !== undefined) {
      updateData.disabled = disabled;
      updateData.is_active = !disabled;
    }

    if (tipo_documento !== undefined) {
      updateData.tipo_documento = tipo_documento;
    }

    if (numero_documento !== undefined) {
      updateData.numero_documento = numero_documento;
    }

    if (telefono !== undefined) {
      updateData.phone = telefono;
    }

    const user = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    return user;
  };

  // Eliminar usuario (soft delete)
  const deleteUser = async (id: number) => {
    return await prisma.users.update({
      where: { id },
      data: {
        disabled: true,
        is_active: false,
      },
    });
  };

  return {
    validateCreateUser,
    checkUsernameExists,
    checkEmailExists,
    createUser,
    getUserByUsername,
    getUserById,
    listUsers,
    updateUser,
    deleteUser,
  };
};

export default usersAdmService;
