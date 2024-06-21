// This file is adapted from the tortoise repository
// https://github.com/neonbjb/tortoise-tts/blob/main/tortoise/utils/text.py

/**
 * Split text it into chunks of a desired length trying to keep sentences intact.
 */
export function splitAndRecombineText(
  textIn: string,
  desiredLength = 200,
  maxLength = 300
) {
  // normalize text, remove redundant whitespace and convert non-ascii quotes to ascii
  const text = textIn
    .replace(/\n\n+/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"');

  let inQuote = false;
  let current = "";
  let splitPos = [] as number[];
  let pos = -1;
  const endPos = text.length - 1;

  const seek = (delta) => {
    for (let i = 0; i < Math.abs(delta); i++) {
      if (delta < 0) {
        pos--;
        current = current.slice(0, -1);
      } else {
        pos++;
        current += text[pos];
      }
      if (text[pos] === '"') {
        inQuote = !inQuote;
      }
    }
    return text[pos];
  };

  const peek = (delta) => {
    const p = pos + delta;
    return p < endPos && p >= 0 ? text[p] : "";
  };

  const rv = [] as string[];
  function commit() {
    rv.push(current);
    current = "";
    splitPos = [];
  }

  while (pos < endPos) {
    var c = seek(1);
    // do we need to force a split?
    if (current.length >= maxLength) {
      if (splitPos.length > 0 && current.length > desiredLength / 2) {
        // we have at least one sentence and we are over half the desired length, seek back to the last split
        var d = pos - splitPos[splitPos.length - 1];
        seek(-d);
      } else {
        // no full sentences, seek back until we are not in the middle of a word and split there
        while (
          !["!", "?", ".", "\n", " "].includes(c) &&
          pos > 0 &&
          current.length > desiredLength
        ) {
          c = seek(-1);
        }
      }
      commit();
    }
    // check for sentence boundaries
    else if (
      !inQuote &&
      (["!", "?", "\n"].includes(c) ||
        (c === "." && ["\n", " "].includes(peek(1))))
    ) {
      // Seek forward if we have consecutive boundary markers but still within the max length
      while (
        pos < text.length - 1 &&
        current.length < maxLength &&
        ["!", "?", "."].includes(peek(1))
      ) {
        c = seek(1);
      }
      splitPos.push(pos);
      if (current.length >= desiredLength) {
        commit();
      }
    }
    // treat end of quote as a boundary if its followed by a space or newline
    else if (inQuote && peek(1) == '"' && ["\n", " "].includes(peek(2))) {
      seek(2);
      splitPos.push(pos);
    }
  }
  rv.push(current);

  // clean up, remove lines with only whitespace or punctuation
  return rv
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^[\s\.,;:!?]*$/.test(s));
}

if (require.main === module) {
  const assert = require("assert");

  const test_splitAndRecombineText = () => {
    const text = `
            This is a sample sentence.
            This is another sample sentence.
            This is a longer sample sentence that should force a split inthemiddlebutinotinthislongword.
            "Don't split my quote... please"
            `;
    assert.deepEqual(splitAndRecombineText(text, 20, 40), [
      "This is a sample sentence.",
      "This is another sample sentence.",
      "This is a longer sample sentence that",
      "should force a split",
      "inthemiddlebutinotinthislongword.",
      '"Don\'t split my quote... please"',
    ]);
  };

  const test_splitAndRecombineText_2 = () => {
    const text = `
            When you are really angry sometimes you use consecutive exclamation marks!!!!!! Is this a good thing to do?!?!?!
            I don't know but we should handle this situation..........................
            `;
    assert.deepEqual(splitAndRecombineText(text, 30, 50), [
      "When you are really angry sometimes you use",
      "consecutive exclamation marks!!!!!!",
      "Is this a good thing to do?!?!?!",
      "I don't know but we should handle this situation.",
    ]);
  };

  const test_splitAndRecombineText_3 = () => {
    const text = `Once upon a time there lived in a certain village a little country girl, the prettiest creature who was ever seen. Her mother was excessively fond of her; and her grandmother doted on her still more. This good woman had a little red riding hood made for her. It suited the girl so extremely well that everybody called her Little Red Riding Hood.
One day her mother, having made some cakes, said to her, "Go, my dear, and see how your grandmother is doing, for I hear she has been very ill. Take her a cake, and this little pot of butter."

Little Red Riding Hood set out immediately to go to her grandmother, who lived in another village.

As she was going through the wood, she met with a wolf, who had a very great mind to eat her up, but he dared not, because of some woodcutters working nearby in the forest. He asked her where she was going. The poor child, who did not know that it was dangerous to stay and talk to a wolf, said to him, "I am going to see my grandmother and carry her a cake and a little pot of butter from my mother."

"Does she live far off?" said the wolf

"Oh I say," answered Little Red Riding Hood; "it is beyond that mill you see there, at the first house in the village."

"Well," said the wolf, "and I'll go and see her too. I'll go this way and go you that, and we shall see who will be there first."

The wolf ran as fast as he could, taking the shortest path, and the little girl took a roundabout way, entertaining herself by gathering nuts, running after butterflies, and gathering bouquets of little flowers. It was not long before the wolf arrived at the old woman's house. He knocked at the door: tap, tap.

"Who's there?"

"Your grandchild, Little Red Riding Hood," replied the wolf, counterfeiting her voice; "who has brought you a cake and a little pot of butter sent you by mother."

The good grandmother, who was in bed, because she was somewhat ill, cried out, "Pull the bobbin, and the latch will go up."

The wolf pulled the bobbin, and the door opened, and then he immediately fell upon the good woman and ate her up in a moment, for it been more than three days since he had eaten. He then shut the door and got into the grandmother's bed, expecting Little Red Riding Hood, who came some time afterwards and knocked at the door: tap, tap.

"Who's there?"

Little Red Riding Hood, hearing the big voice of the wolf, was at first afraid; but believing her grandmother had a cold and was hoarse, answered, "It is your grandchild Little Red Riding Hood, who has brought you a cake and a little pot of butter mother sends you."

The wolf cried out to her, softening his voice as much as he could, "Pull the bobbin, and the latch will go up."

Little Red Riding Hood pulled the bobbin, and the door opened.

The wolf, seeing her come in, said to her, hiding himself under the bedclothes, "Put the cake and the little pot of butter upon the stool, and come get into bed with me."

Little Red Riding Hood took off her clothes and got into bed. She was greatly amazed to see how her grandmother looked in her nightclothes, and said to her, "Grandmother, what big arms you have!"

"All the better to hug you with, my dear."

"Grandmother, what big legs you have!"

"All the better to run with, my child."

"Grandmother, what big ears you have!"

"All the better to hear with, my child."

"Grandmother, what big eyes you have!"

"All the better to see with, my child."

"Grandmother, what big teeth you have got!"

"All the better to eat you up with."

And, saying these words, this wicked wolf fell upon Little Red Riding Hood, and ate her all up.`;
    assert.deepEqual(splitAndRecombineText(text), [
      "Once upon a time there lived in a certain village a little country girl, the prettiest creature who was ever seen. Her mother was excessively fond of her; and her grandmother doted on her still more. This good woman had a little red riding hood made for her.",
      'It suited the girl so extremely well that everybody called her Little Red Riding Hood. One day her mother, having made some cakes, said to her, "Go, my dear, and see how your grandmother is doing, for I hear she has been very ill. Take her a cake, and this little pot of butter."',
      "Little Red Riding Hood set out immediately to go to her grandmother, who lived in another village. As she was going through the wood, she met with a wolf, who had a very great mind to eat her up, but he dared not, because of some woodcutters working nearby in the forest.",
      'He asked her where she was going. The poor child, who did not know that it was dangerous to stay and talk to a wolf, said to him, "I am going to see my grandmother and carry her a cake and a little pot of butter from my mother." "Does she live far off?" said the wolf "Oh I say,"',
      'answered Little Red Riding Hood; "it is beyond that mill you see there, at the first house in the village." "Well," said the wolf, "and I\'ll go and see her too. I\'ll go this way and go you that, and we shall see who will be there first."',
      "The wolf ran as fast as he could, taking the shortest path, and the little girl took a roundabout way, entertaining herself by gathering nuts, running after butterflies, and gathering bouquets of little flowers.",
      'It was not long before the wolf arrived at the old woman\'s house. He knocked at the door: tap, tap. "Who\'s there?" "Your grandchild, Little Red Riding Hood," replied the wolf, counterfeiting her voice; "who has brought you a cake and a little pot of butter sent you by mother."',
      'The good grandmother, who was in bed, because she was somewhat ill, cried out, "Pull the bobbin, and the latch will go up."',
      "The wolf pulled the bobbin, and the door opened, and then he immediately fell upon the good woman and ate her up in a moment, for it been more than three days since he had eaten.",
      "He then shut the door and got into the grandmother's bed, expecting Little Red Riding Hood, who came some time afterwards and knocked at the door: tap, tap. \"Who's there?\"",
      'Little Red Riding Hood, hearing the big voice of the wolf, was at first afraid; but believing her grandmother had a cold and was hoarse, answered, "It is your grandchild Little Red Riding Hood, who has brought you a cake and a little pot of butter mother sends you."',
      'The wolf cried out to her, softening his voice as much as he could, "Pull the bobbin, and the latch will go up." Little Red Riding Hood pulled the bobbin, and the door opened.',
      'The wolf, seeing her come in, said to her, hiding himself under the bedclothes, "Put the cake and the little pot of butter upon the stool, and come get into bed with me." Little Red Riding Hood took off her clothes and got into bed.',
      'She was greatly amazed to see how her grandmother looked in her nightclothes, and said to her, "Grandmother, what big arms you have!" "All the better to hug you with, my dear." "Grandmother, what big legs you have!" "All the better to run with, my child." "Grandmother, what big ears you have!"',
      '"All the better to hear with, my child." "Grandmother, what big eyes you have!" "All the better to see with, my child." "Grandmother, what big teeth you have got!" "All the better to eat you up with." And, saying these words, this wicked wolf fell upon Little Red Riding Hood, and ate her all up.',
    ]);
  };

  test_splitAndRecombineText();
  test_splitAndRecombineText_2();
  test_splitAndRecombineText_3();
}
