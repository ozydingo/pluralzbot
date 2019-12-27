const pos = require("ni-pos");
const pluralize = require("pluralize");

const ACCEPTED_TAG_TYPE = ["NNS", "NNPS"];
const SYMBOL_TAG_TYPE = [",", ".", ":", "$", "#", '"', ")", "("];

function isAnEmoji(currentIndex, taggedWords) {
  return (
    taggedWords[currentIndex + 2] &&
    taggedWords[currentIndex + 2][0] === ":"
  );
}

function replacez(sentence){
  const sentenceWordz = sentence.split(" ");
  const words = new pos.Lexer().lex(sentence);
  const wordz = [];
  const tagger = new pos.Tagger();
  const taggedWords = tagger.tag(words);
  for (let ii = 0; ii < taggedWords.length; ii++) {
    const taggedWord = taggedWords[ii];
    let word = taggedWord[0];
    const tag = taggedWord[1];

    if (ACCEPTED_TAG_TYPE.includes(tag) && pluralize.isPlural(word)) {
      word = pluralize.singular(word) + "z";
    }

    if (SYMBOL_TAG_TYPE.includes(tag)) {
      // Combine current word with the next 2, if emoji
      // Slack emoji format example :partyparrot:
      if (word === ":" && isAnEmoji(Number(ii), taggedWords)) {
        word = word + taggedWords[ii + 1][0] + ":";
        ii += 2;
      }

      // Lexer treats symbols as a type. To check if the symbol had a space between itself and the previous word
      // 1. combine the symbol with the previous word and see if that word exists in the original sentence
      // 2. if so, push the combined word to the new word array
      // 3. if not, push the previous word, followed by the symbol to the new array
      previousWord = wordz.pop();
      wordWithSymbol = previousWord + word;
      if (sentenceWordz.includes(wordWithSymbol)) {
        word = wordWithSymbol;
      } else {
        wordz.push(previousWord);
      }
    }
    wordz.push(word);
  }
  return wordz.join(" ");
}

module.exports = {
  replacez
}
