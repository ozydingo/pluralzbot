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
})

test('ignores phrases with backticks', () => {
  expect(pluralz.hasPlural("`nuts`")).toBe(false);
})

test('does not match short words', () => {
  expect(pluralz.hasPlural("ns")).toBe(false);
})

test('does not match vowel-endings', () => {
  expect(pluralz.hasPlural("madras")).toBe(false);
})

test('does not match double s', () => {
  expect(pluralz.hasPlural("crass")).toBe(false);
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
  expect(pluralz.replace("madras")).toBe("madras");
  expect(pluralz.replace("crass")).toBe("crass");
  expect(pluralz.replace("nuts is the name")).toBe("nutz is the name");
  expect(pluralz.replace("nuts is the names")).toBe("nutz is the namez");
  expect(pluralz.replace("nuts is crass")).toBe("nutz is crass");
})
