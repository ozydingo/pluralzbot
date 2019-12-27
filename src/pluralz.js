// Rough cut: ends in s following not i, u, or s.
const pluralzPattern = /\b(\w{2,})z([.?!]*)\b/;

const { Z } = require("./z");

exports.replace = (text) => {
  if (/`/.test(text)) { return text; }
  return (new Z(text)).replace()
}

exports.hasPlural = (text) => {
  if (/`/.test(text)) { return false; }
  return (new Z(text)).hasPlurals();
}

exports.hazPluralz = (text) => {
  return Boolean(text.match(pluralzPattern));
}
