// Rough cut: ends in s following not i, u, or s.
const pluralsPattern = /(?<=\s|^)(\w{3,})(?<![ius])s([?!.,]*)(?=\s|$)/g;
const pluralzPattern = /\b(\w{2,})z([.?!]*)\b/;

exports.replace = (text) => {
  if (/`/.test(text)) { return text; }
  return text.replace(pluralsPattern, "$1z$2");
}

exports.hasPlural = (text) => {
  if (/`/.test(text)) { return false; }
  return Boolean(text.match(pluralsPattern));
}

exports.hazPluralz = (text) => {
  return Boolean(text.match(pluralzPattern));
}
