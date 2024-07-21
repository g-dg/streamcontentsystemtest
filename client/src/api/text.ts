import { api } from "./api";

export class TextClient {
  static async listText(): Promise<Record<string, string>> {
    return await api("text", "GET");
  }

  static async getText(filename: string): Promise<string> {
    filename = encodeURIComponent(filename);
    return await api(`text/${filename}`, "GET", undefined, {
      returnType: "text",
    });
  }

  static async setText(filename: string, text: string): Promise<void> {
    filename = encodeURIComponent(filename);
    await api(`text/${filename}`, "PUT", text, { bodyJson: false });
  }
}
