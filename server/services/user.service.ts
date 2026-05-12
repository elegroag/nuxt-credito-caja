import prisma from "~~/lib/prisma";

const userService = () => {
  const findByUsername = async (username: string) => {
    return await prisma.users.findUnique({
      where: {
        username
      }
    });
  };

  const findById = async (id: number) => {
    return await prisma.users.findUnique({
      where: {
        id
      }
    });
  };

  const updateLastLogin = async (userId: number) => {
    return await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        last_login: new Date().toISOString()
      }
    });
  };

  const createUserTrabajador = async (data: any) => {
    const user = await prisma.users.create({
      data: data as any
    });
    return user;
  };

  return {
    findByUsername,
    updateLastLogin,
    createUserTrabajador,
    findById
  };
};

export default userService;
