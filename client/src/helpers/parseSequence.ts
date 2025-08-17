export const SPACE_CHARS = [" ", "\u00a0", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200a", "\u202f", "\u205f"];
export const SEPARATOR_CHARS = [","];
export const RANGE_CHARS = ["-", "\u2013", "\u2014"];
export const NUMBER_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// parses number sequence strings
// supports positive numbers only
// supports spaces and commas for separating numbers
// supports dashes for specifying ranges (only ascending works)
export function parseSequence(
	title: string,
	maxSequenceLength: number = 65536
): Array<string> {
	// current number we're building (empty if no current number)
	let currentNumber = "";

	// start of sequence we're building (empty if no sequence)
	let sequenceStart = "";

	// output array
	let output = [];

	// iterate through all characters, including an undefined at the end
	for (let i = 0; i <= title.length; i++) {
		const c = title[i];

		// if whitespace and not building number
		if (SPACE_CHARS.includes(c) && currentNumber == "") {
			// next character
			continue;
		}

		// if a digit
		if (NUMBER_CHARS.includes(c)) {
			// add to current number
			currentNumber += c;
			// next character
			continue;
		}

		// if number is finished building
		if ([...SEPARATOR_CHARS, ...RANGE_CHARS, ...SPACE_CHARS, undefined].includes(c)) {
			// if we have a number we're building
			if (currentNumber != "") {
				// don't exceed max sequence length
				if (output.length >= maxSequenceLength) throw new Error();
				// add number to list
				output.push(currentNumber);
			}

			// if building sequence
			if (sequenceStart.length != 0) {
				// parse start
				const start = parseInt(sequenceStart);
				// parse end
				const end = parseInt(currentNumber);
				// remove number that just got added
				output.pop();
				// create sequence
				for (let n = start + 1; n <= end; n++) {
					// don't exceed max sequence length
					if (output.length >= maxSequenceLength) throw new Error();
					// add to list
					output.push(n.toString());
				}
				// reset sequence start
				sequenceStart = "";
			}

			// if starting a sequence
			if (RANGE_CHARS.includes(c)) {
				// save the sequence start
				sequenceStart = output[output.length - 1];
			}

			// reset current number
			currentNumber = "";
		}
	}

	return output;
}
