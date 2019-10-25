exports.replace = (text) => {
  return text.replace(/\b(\w+)s$/g, "$1z");
}

exports.hasPlural = (text) => {
  // Rough cut: ends in s following a non-s consonant,
  // and is at least four letters long
  return (
    text.length >= 4 &&
    /\w+s$/.test(text) &&
    !/[aeious]/.test(text[text.length-2])
  )
}
