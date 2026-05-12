export class LoginPage {
  private baseURL: string;

  constructor(baseURL: string = "http://localhost:3000") {
    this.baseURL = baseURL;
  }

  get loginURL(): string {
    return `${this.baseURL}/login`;
  }

  selectors = {
    form: "form",
    usernameInput: "input[type=\"text\"]",
    passwordInput: "input[type=\"password\"]",
    submitButton: "button[type=\"submit\"]",
    loginLink: "a[href=\"/registro\"]",
    homeLink: "a[href=\"/\"]",
    connectionStatus: "[class*=\"mt-4\"]",
    loadingText: "text/Ingresando",
    errorModal: "[role=\"dialog\"]",
    modalTitle: "text/Error de inicio de sesión",
    modalDescription: "text/Por favor, verifica tus credenciales",
    closeModalButton: "button[class*=\"outline\"]"
  };

  async goto(): Promise<void> {
    await chrome.devtools_navigate_page({ type: "url", url: this.loginURL });
  }

  async getSnapshot(): Promise<any> {
    return await chrome.devtools_take_snapshot({ verbose: true });
  }

  async fillUsername(username: string): Promise<void> {
    const snapshot = await this.getSnapshot();
    const inputEl = snapshot.elements?.find(
      (el: any) => el.placeholder?.includes("Tu nombre de usuario")
    );
    if (inputEl) {
      await chrome.devtools_fill({ uid: inputEl.uid, value: username });
    }
  }

  async fillPassword(password: string): Promise<void> {
    const snapshot = await this.getSnapshot();
    const inputEl = snapshot.elements?.find(
      (el: any) => el.placeholder?.includes("••••••••")
    );
    if (inputEl) {
      await chrome.devtools_fill({ uid: inputEl.uid, value: password });
    }
  }

  async submit(): Promise<void> {
    const snapshot = await this.getSnapshot();
    const buttonEl = snapshot.elements?.find(
      (el: any) => el.role === "button" && el.tagName === "button" && el.type === "submit"
    );
    if (buttonEl) {
      await chrome.devtools_click({ uid: buttonEl.uid });
    }
  }

  async waitForConnectionCheck(): Promise<void> {
    await chrome.devtools_wait_for({
      text: ["Conexión exitosa", "Verificando conexión", "Error de conexión"],
      timeout: 10000
    });
  }

  async waitForModal(): Promise<void> {
    await chrome.devtools_wait_for({
      text: ["Error de inicio de sesión"],
      timeout: 5000
    });
  }

  async closeModal(): Promise<void> {
    const snapshot = await this.getSnapshot();
    const closeButton = snapshot.elements?.find(
      (el: any) => el.tagName === "button" && el.classes?.some((c: string) => c.includes("outline"))
    );
    if (closeButton) {
      await chrome.devtools_click({ uid: closeButton.uid });
    }
  }

  async isSubmitEnabled(): Promise<boolean> {
    const snapshot = await this.getSnapshot();
    const buttonEl = snapshot.elements?.find(
      (el: any) => el.role === "button" && el.type === "submit"
    );
    return buttonEl ? !buttonEl.disabled : false;
  }

  async hasLoadingState(): Promise<boolean> {
    const snapshot = await this.getSnapshot();
    return snapshot.text?.some((t: string) => t.includes("Ingresando")) ?? false;
  }

  async getConnectionStatus(): Promise<string | null> {
    const snapshot = await this.getSnapshot();
    const statusEl = snapshot.elements?.find(
      (el: any) => el.tagName === "div" && el.classes?.some((c: string) => c.includes("mt-4"))
    );
    return statusEl?.text ?? null;
  }
}
