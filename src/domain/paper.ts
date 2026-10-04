import type { PaperSize } from "../types/wcif";

export const paperSizes: Record<
  PaperSize,
  { label: string; detail: string; cssName: string }
> = {
  a4: { label: "A4", detail: "A4 (210 × 297 mm)", cssName: "A4" },
  letter: {
    label: "Letter",
    detail: "Letter (8.5 × 11 in)",
    cssName: "letter",
  },
};

export const getPaperSize = (paperSize: PaperSize | undefined): PaperSize =>
  paperSize === "letter" ? "letter" : "a4";

export const applyPageSize = (paper: PaperSize) => {
  let style = document.querySelector<HTMLStyleElement>("#page-size");

  if (!style) {
    style = document.createElement("style");
    style.id = "page-size";
    document.head.append(style);
  }

  style.textContent = `@page { size: ${paperSizes[paper].cssName} portrait; margin: 0; }`;
};
