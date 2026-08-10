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
  // Thai script has no spaces between words, so react-pdf's default line-wrapping (which only
  // breaks at spaces) treats a whole run of Thai text as one unbreakable "word" — confirmed via
  // a standalone test that long Thai text (e.g. a line-item description) silently overflows past
  // its box/page instead of wrapping, which is exactly what showed up as "missing" text. Splitting
  // Thai runs into individual characters gives the layout engine a break point wherever needed.
  // English/numeric text is left untouched so it keeps wrapping at normal word boundaries.
  Font.registerHyphenationCallback((word) => (/[฀-๿]/.test(word) ? word.split("") : [word]));
  registered = true;
}
