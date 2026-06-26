import prisma from "~~/lib/prisma";

/**
 * Serializa un usuario de Prisma para que sea seguro enviarlo como JSON.
 * Convierte BigInt (común en columnas autoincrementales de MySQL/MariaDB) a number.
 * También normaliza Date a ISO string.
 */
const serializeUser = <T extends Record<string, unknown> | null>(user: T): T => {
  if (!user || typeof user !== "object") return user;
  return JSON.parse(
    JSON.stringify(user, (_, value) => {
      if (typeof value === "bigint") {
        return Number(value);
      }
      return value;
    })
  ) as T;
};

const userService = () => {
  const findByUsername = async (username: string) => {
    return serializeUser(await prisma.users.findUnique({
      where: {
        username
      }
    }));
  };

  const findById = async (id: number) => {
    return serializeUser(await prisma.users.findUnique({
      where: {
        id
      }
    }));
  };

  const updateLastLogin = async (userId: number) => {
    return serializeUser(await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        last_login: new Date().toISOString()
      }
    }));
  };

  const createUserTrabajador = async (data: Record<string, unknown>) => {
    const user = await prisma.users.create({
      data: data as Parameters<typeof prisma.users.create>[0]['data']
    });
    return serializeUser(user);
  };

  return {
    findByUsername,
    updateLastLogin,
    createUserTrabajador,
    findById
  };
};

export default userService;
