// This is a funuction becase `exec` can only be rnu once?
function pattern() {
  return /\b(\w+)s([.?!]*)$/g;
}

exports.replace = (text) => {
  return text.replace(pattern(), "$1z$2");
}

exports.hasPlural = (text) => {
  // Rough cut: ends in s following a non-s consonant,
  // and is at least four letters long
  if (text.length < 4) { return false; }
  if (/`/.test(text)) { return false; }

  const result = pattern().exec(text);
  if (!result) { return false; }

  const [, ...matches] = result;
  return matches.slice(0, -1).filter(match => (
    match.length > 0
  )).map(match => (
    !/[aeious]/.test(match[match.length-1])
  ))
}

exports.hazPluralz = (text) => {
  return /\b(\w{2,})z([.?!]*)/.test(text);
}
