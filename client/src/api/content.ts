import { api } from "./api";

/** Handles content */
export class ContentClient {
  /** Lists all content from all files */
  static async listContent(): Promise<Record<string, string>> {
    return await api("content", "GET");
  }

  /** Gets content of a file */
  static async getContent(filename: string): Promise<string> {
    filename = encodeURIComponent(filename);
    return await api(`content/${filename}`, "GET", undefined, {
      returnType: "text",
    });
  }

  /** Sets content of a file */
  static async setContent(filename: string, content: string): Promise<void> {
    filename = encodeURIComponent(filename);
    return await api(`content/${filename}`, "PUT", content, {
      bodyJson: false,
    });
  }
}
