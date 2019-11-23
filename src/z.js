var pos = require("ni-pos");
var pluralize = require("pluralize");

const ACCEPTED_TAG_TYPE = ["NNS", "NNPS"];
const SYMBOL_TAG_TYPE = [",", ".", ":", "$", "#", '"', ")", "("];

function isAnEmoji(currentIndex, taggedWords) {
  return (
    taggedWords[currentIndex + 2] && 
    taggedWords[currentIndex + 2][0] === ":"
  );
}

function replacez(sentence){
  var sentenceWordz = sentence.split(" ");
  var words = new pos.Lexer().lex(sentence);
  var wordz = [];
  var tagger = new pos.Tagger();
  var taggedWords = tagger.tag(words);
  for (var i = 0; i < taggedWords.length; i++) {
    var taggedWord = taggedWords[i];
    var word = taggedWord[0];
    var tag = taggedWord[1];

    if (ACCEPTED_TAG_TYPE.includes(tag) && pluralize.isPlural(word)) {
      word = pluralize.singular(word) + "z";
    }

    if (SYMBOL_TAG_TYPE.includes(tag)) {
      // Combine current word with the next 2, if emoji
      // Slack emoji format example :partyparrot:
      if (word === ":" && isAnEmoji(Number(i), taggedWords)) {
        word = word + taggedWords[i + 1][0] + ":";
        i += 2;
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