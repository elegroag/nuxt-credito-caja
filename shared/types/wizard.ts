import type { ParametrosData } from "./response";

export interface WizardStep {
  key: string;
  title: string;
  short: string;
}

export interface WizardState {
  step: number;
  successModalOpen: boolean;
}

export interface WizardProps {
  parametros?: ParametrosData | null;
  initialStep?: string;
  fechaRadicado?: string;
}
