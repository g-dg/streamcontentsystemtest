import { api } from "./api";

export class TextClient {
  static async listText(): Promise<Record<string, string>> {
    return await api("text", "GET");
  }

  static async getText(filename: string): Promise<string> {
    filename = encodeURIComponent(filename.replaceAll(/[^ 0-9A-Za-z-]/g, "_"));
    return await api(`text/${filename}`, "GET", undefined, {
      returnType: "text",
    });
  }

  static async setText(filename: string, text: string): Promise<void> {
    filename = encodeURIComponent(filename.replaceAll(/[^ 0-9A-Za-z-]/g, "_"));
    await api(`text/${filename}`, "PUT", text, { bodyJson: false });
  }
}
