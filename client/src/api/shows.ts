import { api } from "./api";

/** Handles shows */
export class ShowClient {
  /** Lists all show files */
  static async listShows(): Promise<Array<string>> {
    return await api("shows", "GET");
  }

  /** Gets content of a show */
  static async getShow(filename: string): Promise<string> {
    filename = encodeURIComponent(filename);
    return await api(`shows/${filename}`, "GET", undefined, {
      returnType: "text",
    });
  }

  /** Sets content of a show */
  static async setShow(filename: string, content: string): Promise<void> {
    filename = encodeURIComponent(filename);
    return await api(`shows/${filename}`, "PUT", content, {
      bodyJson: false,
    });
  }

  /** Deletes a show */
  static async deleteShow(filename: string): Promise<void> {
    filename = encodeURIComponent(filename);
    return await api(`shows/${filename}`, "DELETE", undefined, {
      bodyJson: false,
    });
  }
}
