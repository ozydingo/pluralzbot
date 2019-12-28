const { Pluralz } = require('pluralz');

test('matches normal plural words', () => {
  expect((new Pluralz("nuts")).hasPlurals()).toBe(true);
  expect((new Pluralz("notes")).hasPlurals()).toBe(true);
  expect((new Pluralz("ns")).hasPlurals()).toBe(true);
})

test('matches with punctuation', () => {
  expect((new Pluralz("nuts.")).hasPlurals()).toBe(true);
  expect((new Pluralz("nuts!")).hasPlurals()).toBe(true);
  expect((new Pluralz("nuts?")).hasPlurals()).toBe(true);
  expect((new Pluralz("nuts!!!")).hasPlurals()).toBe(true);
  expect((new Pluralz("bananas")).hasPlurals()).toBe(true);
})

test('ignores phrases with backticks', () => {
  expect((new Pluralz("`nuts`")).hasPlurals()).toBe(false);
})

test('does not match i, u, s endings', () => {
  expect((new Pluralz("crass")).hasPlurals()).toBe(false);
  expect((new Pluralz("fabulous")).hasPlurals()).toBe(false);
  expect((new Pluralz("this")).hasPlurals()).toBe(false);
})

test('matches mid-phrase plurals', () => {
  expect((new Pluralz("nuts is the name")).hasPlurals()).toBe(true);
})

test('matches pluralz', () => {
  expect((new Pluralz("nutz")).hasPluralz()).toBe(true);
  expect((new Pluralz("nuts")).hasPluralz()).toBe(false);
  expect((new Pluralz("bazzar")).hasPluralz()).toBe(false);
  expect((new Pluralz("this is nutz, yo")).hasPluralz()).toBe(true);
})

test('replaces plurals correctly', () => {
  expect((new Pluralz("nuts")).replace()).toBe("nutz");
  expect((new Pluralz("notes")).replace()).toBe("notez");
  expect((new Pluralz("bananas")).replace()).toBe("bananaz");
  expect((new Pluralz("crass")).replace()).toBe("crass");
  expect((new Pluralz("nuts is the name")).replace()).toBe("nutz is the name");
  expect((new Pluralz("nuts is the names")).replace()).toBe("nutz is the namez");
})

test('does not replace singular words with s endings', () => {
  expect((new Pluralz("nuts is crass")).replace()).toBe("nutz is crass");
  expect((new Pluralz("this is nuts")).replace()).toBe("this is nutz");
})

test('does not replace anything when backticks are present', () => {
  expect((new Pluralz("`nuts`")).replace()).toBe("`nuts`");
  expect((new Pluralz("nuts `nuts`")).replace()).toBe("nuts `nuts`");
})

test('handles punctuation', () => {
  expect((new Pluralz("nuts?")).replace()).toBe("nutz?");
  expect((new Pluralz("this is nuts, yo")).replace()).toBe("this is nutz, yo");
  expect((new Pluralz("So many mice, geese, and other animals in the house.")).replace()).
    toBe("So many mousez, goosez, and other animalz in the house.");
})

test('does not replace URL content', () => {
  expect((new Pluralz("https://www.nuts.com/")).replace()).toBe("https://www.nuts.com/")
  expect((new Pluralz("nuts here: https://www.nuts.com/")).replace()).toBe("nutz here: https://www.nuts.com/")
  expect((new Pluralz("things.com")).replace()).toBe("things.com")
  expect((new Pluralz("docs.domain.com")).replace()).toBe("docs.domain.com")
  expect((new Pluralz("this.is.nuts")).replace()).toBe("this.is.nuts")
  expect((new Pluralz("www.foo-bars-baz.com")).replace()).toBe("www.foo-bars-baz.com")
  expect((new Pluralz("www.nuts.com/this/is/nuts")).replace()).toBe("www.nuts.com/this/is/nuts")
  expect((new Pluralz("www.nuts.com/this-is-nuts")).replace()).toBe("www.nuts.com/this-is-nuts")
})

test('does not modify emoji', () => {
  expect((new Pluralz("This is nuts :nuts:")).replace()).toBe("This is nutz :nuts:");
})
