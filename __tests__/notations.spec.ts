import { matchColors } from "../src/notations";

test("matchColors", () => {
  const text = `
    "#fffccc"
    #aabbcc
    #fff
    rgb(255, 255, 255)
    `;

  const matches = matchColors(text);
  expect(matches.map((m) => m.match[0])).toEqual([
    "#fffccc",
    "#aabbcc",
    "#fff",
    "rgb(255, 255, 255)",
  ]);
});
