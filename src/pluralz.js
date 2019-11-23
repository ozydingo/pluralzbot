// Rough cut: ends in s following not i, u, or s.
const pluralsPattern = /(?<=\s|^)(\w{3,})(?<![ius])s([?!.,]*)(?=\s|$)/g;
const pluralzPattern = /\b(\w{2,})z([.?!]*)\b/;

const z = require("./z");

exports.replace = (text) => {
  if (/`/.test(text)) { return text; }
  return z.replacez(text);
}

exports.hasPlural = (text) => {
  if (/`/.test(text)) { return false; }
  return Boolean(text.match(pluralsPattern));
}

exports.hazPluralz = (text) => {
  return Boolean(text.match(pluralzPattern));
}
