declare module "qrcode" {
  export interface QRCodeOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    type?: "string" | "terminal" | "svg" | "utf8";
    width?: number;
    margin?: number;
    scale?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCode {
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options?: QRCodeOptions
    ): Promise<void>;
    toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
    toString(text: string, options?: QRCodeOptions): Promise<string>;
  }

  const QRCode: QRCode;
  export default QRCode;
}