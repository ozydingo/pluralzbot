const pos = require("ni-pos");
const pluralize = require("pluralize");

const ACCEPTED_TAG_TYPE = ["NNS", "NNPS"];
const EMOJI_REGEXP = /:\w+:/

const lexer = new pos.Lexer();
// Add support for Slack emoji in lexing
lexer.regexs = [EMOJI_REGEXP, ...lexer.regexs]
const tagger = new pos.Tagger();

function findWhitespace(word, containingText) {
  // Make RegExp safe
  const escapedWord = word.replace(/([^\w])/g, '\\$1')
  const whitespacePattern = new RegExp(escapedWord + "(\\s*)");
  const match = whitespacePattern.exec(containingText);
  const whitespace = match ? match[1] : '';
  return whitespace;
}

class Z {
  constructor(sentence) {
    this.taggedWords = this.tagWords(sentence)
  }

  // Get POS tagging and keep track of whitespace after word
  tagWords(sentence) {
    const words = lexer.lex(sentence);
    const posTagged = tagger.tag(words);
    let index = 0;
    const taggedWords = posTagged.map(([word, tag]) => {
      const whitespace = findWhitespace(word, sentence.slice(index))
      index += word.length + whitespace.length;
      return { word, tag, whitespace };
    })
    return taggedWords;
  }

  hasPlurals() {
    return this.taggedWords.some(({ word, tag }) => {
      return ACCEPTED_TAG_TYPE.includes(tag) && pluralize.isPlural(word)
    });
  }

  replace() {
    const wordz = []
    for (let ii = 0; ii < this.taggedWords.length; ii++) {
      let { word, tag, whitespace } = this.taggedWords[ii];

      if (ACCEPTED_TAG_TYPE.includes(tag) && pluralize.isPlural(word)) {
        word = pluralize.singular(word) + "z";
      }

      wordz.push(word + whitespace);
    }
    return wordz.join("");
  }
}

module.exports = {
  Z
}
