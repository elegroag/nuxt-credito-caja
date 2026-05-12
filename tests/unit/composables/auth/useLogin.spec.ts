import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

vi.mock("vue-router", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  })),
  useRoute: vi.fn(() => ({
    query: {},
    path: "/login"
  }))
}));

vi.mock("#imports", async () => {
  const actual = await vi.importActual("#imports");
  return {
    ...actual,
    navigateTo: vi.fn()
  };
});

const mockPostJson = vi.fn();
const mockSetSession = vi.fn();
const mockIsAuthenticated = ref(false);

vi.mock("~/composables/useApi", () => ({
  useApi: vi.fn(() => ({
    postJson: mockPostJson
  }))
}));

vi.mock("~/composables/useSession", () => ({
  useSession: vi.fn(() => ({
    isAuthenticated: mockIsAuthenticated,
    setSession: mockSetSession
  }))
}));

describe("useLogin composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.value = false;
    mockPostJson.mockReset();
    mockSetSession.mockReset();
  });

  describe("estado inicial", () => {
    it("inicializa username y password vacíos", async () => {
      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, password, loading, errorMsg } = useLogin();

      expect(username.value).toBe("");
      expect(password.value).toBe("");
      expect(loading.value).toBe(false);
      expect(errorMsg.value).toBe("");
    });
  });

  describe("login exitoso", () => {
    it("establece sesión y redirige a /dash cuando credenciales son válidas", async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: "mock-jwt-token",
          token_type: "bearer",
          user: {
            username: "admin",
            email: "admin@test.com",
            roles: ["admin"],
            permissions: [],
            nombres: "Admin",
            apellidos: "User"
          }
        }
      };

      mockPostJson.mockResolvedValue(mockResponse);

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, password, login } = useLogin();

      username.value = "admin";
      password.value = "Admin123$.";

      const result = await login();

      expect(result).toBe(true);
      expect(mockPostJson).toHaveBeenCalledWith("/api/auth/login", {
        username: "admin",
        password: "Admin123$."
      });
      expect(mockSetSession).toHaveBeenCalledWith({
        accessToken: "mock-jwt-token",
        tokenType: "bearer",
        user: expect.objectContaining({
          username: "admin",
          roles: ["admin"]
        })
      });
    });

    it("usa redirect de query string si está presente", async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: "mock-token",
          token_type: "bearer",
          user: {
            username: "admin",
            roles: [],
            permissions: []
          }
        }
      };

      mockPostJson.mockResolvedValue(mockResponse);

      const { useRoute } = await import("vue-router")
      ;(useRoute as ReturnType<typeof vi.fn>).mockReturnValue({
        query: { redirect: "/admin" },
        path: "/login"
      });

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { login } = useLogin();

      await login();

      const { navigateTo } = await import("#imports");
      expect(navigateTo).toHaveBeenCalledWith("/admin");
    });
  });

  describe("login con credenciales inválidas", () => {
    it("establece mensaje de error cuando credentials son incorrectas", async () => {
      mockPostJson.mockRejectedValue({
        statusCode: 401,
        data: { error: "Credenciales inválidas" }
      });

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, password, errorMsg, login } = useLogin();

      username.value = "wronguser";
      password.value = "wrongpass";

      const result = await login();

      expect(result).toBe(false);
      expect(errorMsg.value).toBe("Credenciales inválidas");
      expect(mockSetSession).not.toHaveBeenCalled();
    });

    it("maneja errores de red correctamente", async () => {
      mockPostJson.mockRejectedValue(new Error("Network error"));

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, password, errorMsg, login } = useLogin();

      username.value = "admin";
      password.value = "Admin123$.";

      const result = await login();

      expect(result).toBe(false);
      expect(errorMsg.value).toBe("Network error");
    });
  });

  describe("usuario no existe - redirect a registro", () => {
    it("redirige a /registro cuando usuario no existe (404)", async () => {
      mockPostJson.mockRejectedValue({
        statusCode: 404,
        data: { code: "USER_NOT_FOUND", error: "Usuario no encontrado" }
      });

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, password, login } = useLogin();

      username.value = "nonexistent";
      password.value = "somepassword";

      await login();

      const { navigateTo } = await import("#imports");
      expect(navigateTo).toHaveBeenCalledWith(
        expect.stringContaining("/registro")
      );
    });

    it("preserva username en query string al redirigir a registro", async () => {
      mockPostJson.mockRejectedValue({
        statusCode: 404,
        data: { code: "USER_NOT_FOUND" }
      });

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, login } = useLogin();

      username.value = "newuser";

      await login();

      const { navigateTo } = await import("#imports");
      expect(navigateTo).toHaveBeenCalledWith(
        expect.stringContaining("username=newuser")
      );
    });
  });

  describe("checkAuthAndRedirect", () => {
    it("redirige a /dash si usuario ya está autenticado", async () => {
      mockIsAuthenticated.value = true;

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { checkAuthAndRedirect } = useLogin();

      await checkAuthAndRedirect();

      const { navigateTo } = await import("#imports");
      expect(navigateTo).toHaveBeenCalledWith("/dash");
    });

    it("no redirige si usuario no está autenticado", async () => {
      mockIsAuthenticated.value = false;

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { checkAuthAndRedirect } = useLogin();

      await checkAuthAndRedirect();

      const { navigateTo } = await import("#imports");
      expect(navigateTo).not.toHaveBeenCalled();
    });
  });

  describe("manejo de loading state", () => {
    it("establece loading en true durante el login", async () => {
      mockPostJson.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { access_token: "token", token_type: "bearer", user: { username: "admin", roles: [], permissions: [] } }
        }), 50))
      );

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, password, loading, login } = useLogin();

      username.value = "admin";
      password.value = "Admin123$.";

      const loginPromise = login();
      expect(loading.value).toBe(true);

      await loginPromise;
      expect(loading.value).toBe(false);
    });

    it("restablece loading a false incluso si hay error", async () => {
      mockPostJson.mockRejectedValue(new Error("Error"));

      const { useLogin } = await import("~/composables/auth/useLogin");
      const { username, password, loading, login } = useLogin();

      username.value = "admin";
      password.value = "Admin123$.";

      await login();

      expect(loading.value).toBe(false);
    });
  });
});
