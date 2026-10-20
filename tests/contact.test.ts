import { describe, expect, it } from "vitest";
import { contactRequestError, isBot, toolSubmissionError, toolSubmissionMessage, topicLabel, type ContactRequest } from "@/lib/contact";

const base: ContactRequest = {
  topic: "familiada", name: "", email: "jan@example.com", organization: "", message: "", consent: true, source: "home", website: "",
};

describe("contact", () => {
  it("wymaga poprawnego e-maila i zgody", () => {
    expect(contactRequestError(base)).toBeNull();
    expect(contactRequestError({ ...base, email: "jan@" })).toMatch(/e-mail/);
    expect(contactRequestError({ ...base, consent: false })).toMatch(/zgod/);
  });

  it("wypełnione ukryte pole oznacza bota", () => {
    expect(isBot(base)).toBe(false);
    expect(isBot({ ...base, website: "http://spam" })).toBe(true);
  });

  it("nazwa tematu po polsku", () => {
    expect(topicLabel("spiewnik")).toBe("Śpiewnik");
    expect(topicLabel("xyz")).toBe("xyz");
  });

  it("zgłoszenie narzędzia składa się w czytelną wiadomość", () => {
    const t = { toolName: " Kahoot! ", url: "https://kahoot.com", own: false, description: "Quizy." };
    expect(toolSubmissionError(t)).toBeNull();
    expect(toolSubmissionError({ ...t, toolName: " " })).toMatch(/nazwę/);
    expect(toolSubmissionMessage(t)).toBe(
      "Narzędzie: Kahoot!\nAdres: https://kahoot.com\nPolecenie cudzego narzędzia\n\nQuizy.",
    );
    expect(toolSubmissionMessage({ ...t, url: "", description: "", own: true })).not.toMatch(/Adres/);
  });
});
