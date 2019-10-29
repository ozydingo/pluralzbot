// This is a funuction becase `exec` can only be rnu once?
function pattern() {
  // Rough cut: ends in s following not i, u, or s.
  return /(?<!\w\.)\b(\w{3,})(?<![ius])s([.?!]*)\b(?!\.\w)(?!\:\/)/g;
}

exports.replace = (text) => {
  if (/`/.test(text)) { return text; }

  return text.replace(pattern(), "$1z$2");
}

exports.hasPlural = (text) => {
  if (/`/.test(text)) { return false; }

  return Boolean(pattern().exec(text));
}

exports.hazPluralz = (text) => {
  return /\b(\w{2,})z([.?!]*)/.test(text);
}
