const pluralz = require('pluralz');

test('matches normal plural words', () => {
  expect(pluralz.hasPlural("nuts")).toBe(true);
  expect(pluralz.hasPlural("notes")).toBe(true);
  expect(pluralz.hasPlural("ns")).toBe(true);
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

test('does not match i, u, s endings', () => {
  expect(pluralz.hasPlural("crass")).toBe(false);
  expect(pluralz.hasPlural("fabulous")).toBe(false);
  expect(pluralz.hasPlural("this")).toBe(false);
})

test('matches mid-phrase plurals', () => {
  expect(pluralz.hasPlural("nuts is the name")).toBe(true);
})

test('matches pluralz', () => {
  expect(pluralz.hazPluralz("nutz")).toBe(true);
  expect(pluralz.hazPluralz("nuts")).toBe(false);
  expect(pluralz.hazPluralz("bazzar")).toBe(false);
  expect(pluralz.hazPluralz("this is nutz, yo")).toBe(true);
})

test('replaces plurals correctly', () => {
  expect(pluralz.replace("nuts")).toBe("nutz");
  expect(pluralz.replace("notes")).toBe("notez");
  expect(pluralz.replace("bananas")).toBe("bananaz");
  expect(pluralz.replace("crass")).toBe("crass");
  expect(pluralz.replace("nuts is the name")).toBe("nutz is the name");
  expect(pluralz.replace("nuts is the names")).toBe("nutz is the namez");
})

test('does not replace singular words with s endings', () => {
  expect(pluralz.replace("nuts is crass")).toBe("nutz is crass");
  expect(pluralz.replace("this is nuts")).toBe("this is nutz");
})

test('does not replace anything when backticks are present', () => {
  expect(pluralz.replace("`nuts`")).toBe("`nuts`");
  expect(pluralz.replace("nuts `nuts`")).toBe("nuts `nuts`");
})

test('handles punctuation', () => {
  expect(pluralz.replace("nuts?")).toBe("nutz?");
  expect(pluralz.replace("this is nuts, yo")).toBe("this is nutz, yo");
  expect(pluralz.replace("So many mice, geese, and other animals in the house.")).
    toBe("So many mousez, goosez, and other animalz in the house.");
})

test('does not replace URL content', () => {
  expect(pluralz.replace("https://www.nuts.com/")).toBe("https://www.nuts.com/")
  expect(pluralz.replace("nuts here: https://www.nuts.com/")).toBe("nutz here: https://www.nuts.com/")
  expect(pluralz.replace("things.com")).toBe("things.com")
  expect(pluralz.replace("docs.domain.com")).toBe("docs.domain.com")
  expect(pluralz.replace("this.is.nuts")).toBe("this.is.nuts")
  expect(pluralz.replace("www.foo-bars-baz.com")).toBe("www.foo-bars-baz.com")
  expect(pluralz.replace("www.nuts.com/this/is/nuts")).toBe("www.nuts.com/this/is/nuts")
  expect(pluralz.replace("www.nuts.com/this-is-nuts")).toBe("www.nuts.com/this-is-nuts")
})

test('does not modify emoji', () => {
  expect(pluralz.replace("This is nuts :nuts:")).toBe("This is nutz :nuts:");
})
