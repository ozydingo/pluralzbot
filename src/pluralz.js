exports.replace = (text) => {
  return text.replace(/\b(\w+)s$/g, "$1z");
}

exports.suggestion = 'Hi therez! It lookz like you may have made some errorz in spelling plural words. Would you like to correct your mistakez by using "z" for pluralz?';

exports.hasPlural = (text) => {
  // Rough cut: ends in s following a non-s consonant,
  // and is at least four letters long
  return (
    text.length >= 4 &&
    /\w+s$/.test(text) &&
    !/[aeious]/.test(text[text.length-2])
  )
}
