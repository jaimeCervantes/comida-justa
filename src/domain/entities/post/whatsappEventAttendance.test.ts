import { describe, expect, it } from "vitest";
import {
  buildWhatsappEventAttendanceLink,
  buildWhatsappEventAttendanceMessage,
} from "./whatsappEventAttendance";

const labels = {
  intro: "Hola, quiero asistir a este evento:",
  when: "Horario",
};

const request = {
  title: "Meditacion guiada en el parque",
  when: "domingo, 23 de agosto, 07:30",
  url: "https://hazlosano.com/meditacion-guiada-en-el-parque",
};

describe("buildWhatsappEventAttendanceMessage", () => {
  it("identifica el evento con titulo, horario y enlace", () => {
    expect(buildWhatsappEventAttendanceMessage(request, labels)).toBe(
      "Hola, quiero asistir a este evento:\n\nMeditacion guiada en el parque\nHorario: domingo, 23 de agosto, 07:30\nhttps://hazlosano.com/meditacion-guiada-en-el-parque",
    );
  });
});

describe("buildWhatsappEventAttendanceLink", () => {
  it("usa el WhatsApp declarado antes que el telefono general", () => {
    const link = buildWhatsappEventAttendanceLink({
      ...request,
      labels,
      whatsapp: "52 278 111 2233",
      phone: "2781092116",
    });

    expect(link?.startsWith("https://wa.me/522781112233?text=")).toBe(true);
    expect(decodeURIComponent(link?.split("text=")[1] ?? "")).toContain(
      "Meditacion guiada en el parque",
    );
  });

  it("cae al telefono general cuando no hay WhatsApp dedicado", () => {
    expect(
      buildWhatsappEventAttendanceLink({
        ...request,
        labels,
        phone: "2781092116",
      }),
    ).toContain("https://wa.me/522781092116?");
  });

  it("no arma enlace sin numero util", () => {
    expect(
      buildWhatsappEventAttendanceLink({
        ...request,
        labels,
        phone: "",
      }),
    ).toBeNull();
  });
});
