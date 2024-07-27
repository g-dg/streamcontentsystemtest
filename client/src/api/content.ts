import { api } from "./api";

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
}
