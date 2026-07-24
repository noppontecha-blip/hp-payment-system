import path from "node:path";
import { Font } from "@react-pdf/renderer";

// next/font only exposes Noto Sans Thai as a CSS variable for the DOM — PDF rendering needs the
// raw .ttf files directly, so they're committed under public/fonts and registered here once per
// process. Default Helvetica has no Thai glyphs and renders garbage without this.
let registered = false;
export function registerThaiFont() {
  if (registered) return;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoSansThai",
    fonts: [
      { src: path.join(fontsDir, "NotoSansThai-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(fontsDir, "NotoSansThai-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  registered = true;
}
