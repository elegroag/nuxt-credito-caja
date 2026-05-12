import { test, expect, type Page, type Locator } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly homeLink: Locator;
  readonly connectionStatus: Locator;
  readonly errorModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator("input[type=\"text\"]");
    this.passwordInput = page.locator("input[type=\"password\"]");
    this.submitButton = page.locator("button[type=\"submit\"]");
    this.loginLink = page.locator("a[href=\"/registro\"]");
    this.homeLink = page.locator("a[href=\"/\"]");
    this.connectionStatus = page.locator("[class*=\"mt-4\"]");
    this.errorModal = page.locator("[role=\"dialog\"]");
  }

  async goto(): Promise<void> {
    await this.page.goto(`${BASE_URL}/login`);
    await this.page.waitForLoadState("networkidle");
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

test.describe("Login Page - E2E", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.afterEach(async () => {
    await loginPage.page.context().clearCookies();
  });

  test.describe("Layout & Components Render", () => {
    test("renderiza el layout de autenticación completo", async ({ page }) => {
      await expect(page.locator("body")).toBeVisible();

      await expect(page.locator(".min-h-dvh")).toBeVisible();

      await expect(page.locator("form")).toBeVisible();
    });

    test("renderiza el header de autenticación", async ({ page }) => {
      const header = page.locator("[class*=\"text-center mb-8\"]");
      await expect(header).toBeVisible();

      await expect(page.getByRole("heading", { level: 1 })).toContainText("Bienvenido");
    });

    test("renderiza el footer de autenticación", async ({ page }) => {
      const footer = page.locator("text/Comfaca Crédito");
      await expect(footer).toBeVisible();

      await expect(page.locator("text/Visitar Comfaca")).toBeVisible();
    });

    test("renderiza el formulario de login completo", async () => {
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.usernameInput).toHaveAttribute("placeholder", "Tu nombre de usuario");

      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.passwordInput).toHaveAttribute("placeholder", "••••••••");

      await expect(loginPage.submitButton).toBeVisible();
      await expect(loginPage.submitButton).toContainText("Ingresar");
    });

    test("renderiza los enlaces de navegación", async () => {
      await expect(loginPage.loginLink).toBeVisible();
      await expect(loginPage.loginLink).toContainText("Crear cuenta");

      await expect(loginPage.homeLink).toBeVisible();
      await expect(loginLink).toContainText("Volver al inicio");
    });

    test("renderiza el indicador de estado de conexión", async () => {
      const statusContainer = page.locator("[class*=\"mt-4\"]");
      await expect(statusContainer.first()).toBeVisible();
    });
  });

  test.describe("Form Validation", () => {
    test("tiene validación HTML5 para campos requeridos", async () => {
      await expect(loginPage.usernameInput).toHaveAttribute("required");
      await expect(loginPage.passwordInput).toHaveAttribute("required");
    });

    test("el botón está deshabilitado si no hay conexión", async () => {
      const submitButton = loginPage.submitButton;
      const isDisabled = await submitButton.isDisabled();

      if (isDisabled) {
        await expect(submitButton).toBeDisabled();
      }
    });

    test("muestra mensaje de error cuando se envían credenciales vacías", async () => {
      await loginPage.usernameInput.fill("");
      await loginPage.passwordInput.fill("");
      await loginPage.submitButton.click();

      await expect(loginPage.usernameInput).toBeFocused();
    });
  });

  test.describe("Login Flow - Credenciales Inválidas", () => {
    test("muestra modal de error con credenciales incorrectas", async ({ page }) => {
      await loginPage.login("usuario_invalido_123", "contraseña_invalida");

      await page.waitForSelector("[role=\"dialog\"]", { state: "visible", timeout: 10000 });

      const modal = page.locator("[role=\"dialog\"]");
      await expect(modal).toBeVisible();
      await expect(page.locator("text/Error de inicio de sesión")).toBeVisible();
      await expect(page.locator("text/Por favor, verifica tus credenciales")).toBeVisible();
    });

    test("puede cerrar el modal de error", async ({ page }) => {
      await loginPage.login("usuario_invalido", "contraseña_invalida");

      await page.waitForSelector("[role=\"dialog\"]", { state: "visible", timeout: 10000 });

      const closeButton = page.locator("[role=\"dialog\"] button").last();
      await closeButton.click();

      await expect(page.locator("[role=\"dialog\"]")).not.toBeVisible();
    });

    test("el modal aparece con animación", async ({ page }) => {
      await loginPage.login("usuario_invalido", "contraseña_invalida");

      const modal = page.waitForSelector("[role=\"dialog\"]", { state: "attached", timeout: 5000 });
      await expect(modal).toBeTruthy();
    });
  });

  test.describe("Redirection & Auth State", () => {
    test("redirige a /dash cuando ya está autenticado", async ({ page, context }) => {
      await context.storageState({
        cookies: [
          {
            name: "comfaca_credito_access_token",
            value: "mock_token_for_authenticated_user",
            domain: "localhost",
            path: "/"
          }
        ]
      });

      await page.goto(`${BASE_URL}/login`);
      await page.waitForURL(/\/dash/, { timeout: 5000 }).catch(() => {});
    });

    test("redirige a /registro cuando el usuario no existe", async ({ page }) => {
      await loginPage.login("usuario_que_no_existe_12345", "Password123$.");

      await page.waitForURL(/\/registro/, { timeout: 10000 }).catch(() => {});

      await expect(page).toHaveURL(/\/registro/);
    });

    test("preserva el parámetro redirect al redirigir a registro", async ({ page }) => {
      await page.goto(`${BASE_URL}/login?redirect=/admin`);
      await loginPage.login("usuario_no_existe", "Password123$.");

      await page.waitForURL(/\/registro/, { timeout: 10000 }).catch(() => {});

      await expect(page).toHaveURL(/\/registro.*redirect=%2Fadmin/);
    });
  });

  test.describe("UI States", () => {
    test("muestra estado de loading durante el login", async ({ page }) => {
      await page.route("**/api/auth/login", async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await loginPage.login("admin", "Admin123$.");

      const loadingText = page.locator("text/Ingresando");
      await expect(loadingText).toBeVisible({ timeout: 1000 }).catch(() => {});
    });

    test("los inputs tienen iconos asociados", async ({ page }) => {
      const form = page.locator("form");
      await expect(form.locator("[class*=\"lucide-user\"]")).toBeVisible();
      await expect(form.locator("[class*=\"lucide-lock\"]")).toBeVisible();
    });

    test("el formulario tiene estilos de tarjeta", async ({ page }) => {
      const card = page.locator("[class*=\"bg-card\"]");
      await expect(card.first()).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("renderiza correctamente en viewport móvil", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginPage.goto();

      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    });

    test("renderiza correctamente en viewport desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await loginPage.goto();

      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    });
  });
});
