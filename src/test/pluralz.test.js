const pluralz = require('pluralz');

test('matches normal plural words', () => {
  expect(pluralz.hasPlural("nuts")).toBe(true);
  expect(pluralz.hasPlural("notes")).toBe(true);
})

test('matches with punctuation', () => {
  expect(pluralz.hasPlural("nuts.")).toBe(true);
  expect(pluralz.hasPlural("nuts!")).toBe(true);
  expect(pluralz.hasPlural("nuts?")).toBe(true);
  expect(pluralz.hasPlural("nuts!!!")).toBe(true);
  expect(pluralz.hasPlural("bananas")).toBe(true);
})

test('ignores phrases with backticks', () => {
  expect(pluralz.hasPlural("`nuts`")).toBe(false);
})

test('does not match short words', () => {
  expect(pluralz.hasPlural("ns")).toBe(false);
  expect(pluralz.hasPlural("ans")).toBe(false);
})

test('does not match i, u, s endings', () => {
  expect(pluralz.hasPlural("crass")).toBe(false);
  expect(pluralz.hasPlural("fabulous")).toBe(false);
  expect(pluralz.hasPlural("this")).toBe(false);
})

test('matches mid-phrase plurals', () => {
  expect(pluralz.hasPlural("nuts is the name")).toBe(true);
})

test('replaces plurals correctly', () => {
  expect(pluralz.replace("ns")).toBe("ns");
  expect(pluralz.replace("nuts")).toBe("nutz");
  expect(pluralz.replace("`nuts`")).toBe("`nuts`");
  expect(pluralz.replace("notes")).toBe("notez");
  expect(pluralz.replace("nuts?")).toBe("nutz?");
  expect(pluralz.replace("bananas")).toBe("bananaz");
  expect(pluralz.replace("crass")).toBe("crass");
  expect(pluralz.replace("nuts is the name")).toBe("nutz is the name");
  expect(pluralz.replace("nuts is the names")).toBe("nutz is the namez");
  expect(pluralz.replace("nuts is crass")).toBe("nutz is crass");
})

test('does not replace URL content', () => {
  expect(pluralz.replace("https://www.nuts.com/")).toBe("https://www.nuts.com/")
  expect(pluralz.replace("nuts here: https://www.nuts.com/")).toBe("nutz here: https://www.nuts.com/")
})
