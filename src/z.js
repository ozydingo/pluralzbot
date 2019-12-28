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

function isPlural(word, tag) {
  return ACCEPTED_TAG_TYPE.includes(tag) && pluralize.isPlural(word);
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
    const wordz = this.taggedWords.map(({ word, tag, whitespace }) => {
      if (isPlural(word, tag)) {
        word = pluralize.singular(word) + "z";
      }
      return word + whitespace;
    })
    return wordz.join("");
  }
}

module.exports = {
  Z
}
