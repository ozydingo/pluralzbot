// This is a funuction becase `exec` can only be rnu once?
function pattern() {
  // Rough cut: ends in s following a non-s consonant,
  // and is at least four letters long
  return /\b(\w+)(?<![aious])s([.?!]*)\b/g;
}

exports.replace = (text) => {
  if (text.length < 4) { return text; }
  if (/`/.test(text)) { return text; }

  return text.replace(pattern(), "$1z$2");
}

exports.hasPlural = (text) => {
  if (text.length < 4) { return false; }
  if (/`/.test(text)) { return false; }

  return Boolean(pattern().exec(text));
}

exports.hazPluralz = (text) => {
  return /\b(\w{2,})z([.?!]*)/.test(text);
}
