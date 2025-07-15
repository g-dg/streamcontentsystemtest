import { uuid } from "./random";

// Note that placeholders are whitespace sensitive and case-sensitive
// `{` and `}` can be eacaped by substituting with `{{<}}` and `{{>}}` respectively
// `{`, `}`, `#`, `^`, `/`, `<`, `>` are not allowed in placeholder names
// `{{#placeholder}}content{{/placeholder}}` will only render `content` if the placeholder is present and not an empty string
// `{{^placeholder}}content{{/placeholder}}` will only render `content` if the placeholder is not present or is an empty string
// All text going into the placeholder template will be html escaped (TODO: support not htmlescaping with `{{&placeholder}}`)
// You can do dynamic placeholder names with `{{{{placeholderName}}}}` (since the internal set will get replaced with the name, causing the outer set to become a placeholder)

export function resolvePlaceholders(placeholders: Record<string, string>, templateContent: string, errors?: Array<string>): string {
	const debug = true;

	// tests if the string contains a `{{` and `}}` that doesn't contain any of `{`, `}`, `<`, `>`
	const matchUncompletedNonEscapePlaceholdersRegex = /\{\{[^\{\}\<\>]*\}\}/gs;

	// matches conditional and inverse conditional placeholders and all their content
	const matchConditionalPlaceholderAndContentRegex = /\{\{[\#\^](?<placeholder>[^\{\}\<\>]*)\}\}.*?\{\{\/\k<placeholder>\}\}/gs;

	// include template content as a placeholder (the name doesn't matter since nothing will reference it)
	const templateContentPlaceholderName = `_templateContent_${uuid()}`;
	const placeholdersWithTemplate = {
		...placeholders,
		[templateContentPlaceholderName]: templateContent,
	};

	// Step 1: recursively resolve placeholder tags that have no substitutions remaining (i.e. are complete) until there are no more state changes
	// This prevents self-referential recursion issues since any templates with self-referential recursion will never be completely substituted.

	const placeholderMap = new Map(Object.entries(placeholdersWithTemplate));
	const fullySubstitutedPlaceholders = new Set<string>();

	// matches anything in between a `{{` and `}}` that doesn't contain any of `{`, `}`, `#`, `^`, `/`, `<`, `>`
	const matchSubstitutePlaceholdersRegex = /\{\{(?<placeholder>[^\{\}\#\^\/\<\>]*)\}\}/gs;

	let substituteChangeCount = 0;
	do {
		substituteChangeCount = 0;

		for (const [key, value] of placeholderMap.entries()) {
			let transformedValue = value;

			// find all substitution placeholders
			const foundPlaceholders = new Set(
				transformedValue.matchAll(matchSubstitutePlaceholdersRegex)
					.map(x => x.groups!.placeholder)
			);

			// substitute all placeholders that are complete
			for (const foundPlaceholder of foundPlaceholders) {
				if (fullySubstitutedPlaceholders.has(foundPlaceholder)) {
					const foundPlaceholderValue = placeholderMap.get(foundPlaceholder)!;
					// if the content is going into the root template, escape any html in it
					const escapedPlaceholdervalue = key != templateContentPlaceholderName
						? foundPlaceholderValue
						: htmlEscape(foundPlaceholderValue);
					// replace all instances of the placeholder tag with the value
					transformedValue = transformedValue.replaceAll(`{{${foundPlaceholder}}}`, escapedPlaceholdervalue);
				}
			}

			// update working placeholder map with new transformed value
			if (value != transformedValue) {
				substituteChangeCount++;
				placeholderMap.set(key, transformedValue);
			}

			// if placeholder has no more substitutions, save it to the map of completed placeholders
			if (!matchSubstitutePlaceholdersRegex.test(transformedValue)) {
				fullySubstitutedPlaceholders.add(key);
				substituteChangeCount++;
			}
		}
	} while (substituteChangeCount > 0);


	// Step 2: Remove any remaining substitution tags from placeholders

	for (const key of placeholderMap.keys()) {
		const existingValue = placeholderMap.get(key)!;
		const replacedValue = existingValue.replaceAll(matchSubstitutePlaceholdersRegex, "");
		if (replacedValue != existingValue) {
			placeholderMap.set(key, replacedValue);
			if (debug) {
				console.info(`Some placeholders were not fully substitued for content "${key}"`);
			}
		}
	}


	// Step 3: For each placeholder, remove all conditionals that have a concrete evaluation (i.e. their final state is known)
	// This also prevents self-referential recursion.
	/*
		- if the conditional is normal (i.e. not inverted):
			- if the placeholder exists:
				- if the placeholder content is empty:
					- remove tags and content (placeholder will not receive content anymore)
				- else if the placeholder has content:
					- if the placeholder content has no conditionals:
						- remove tags and keep content (placeholder content will not change)
					- else:
						- continue iteration (since the placeholder may be resolved to be empty later)
			- else if the placeholder doesn't exist:
				- remove tags and content (the placeholder will not start existing in future iterations)
		- else if value is only shown if placeholder doesn't exist (i.e. conditional is inverted):
			- if the placeholder exists:
				- if the placeholder content is empty:
					- remove tags and keep content (placeholder will not receive content anymore)
				- else if the placeholder has content:
					- if the placeholder content has no conditionals:
						- remove tags and content (placeholder content will not change)
					- else if the placeholder content still has conditionals:
						- continue iteration (since the placeholder may be resolved to empty later)
			- else if the placeholder doesn't exist:
				- remove tags and keep content (the placeholder will not start existing in future iterations)

		---

		operation = !placeholderValueExists || placeholderValueIsEmptyString ? !isNotInvertedConditional : placeholderValueIsComplete ? isNotInvertedConditional : undefined
		// ^^^: true: keep inner (remove tags), false: discard inner (including tags), undefined: skip this iteration
	*/

	const fullyProcessedConditionalPlaceholders = new Set<string>();

	// matches like a regular placeholder, but starting with `#` or `^` or `/`
	const matchConditionalPlaceholderRegex = /\{\{(?<operation>[\#\^\/])(?<placeholder>[^\{\}\#\/\<\>]*)\}\}/gs;

	let conditionalChangeCount = 0;
	do {
		conditionalChangeCount = 0;

		for (const [key, value] of placeholderMap.entries()) {
			if (fullyProcessedConditionalPlaceholders.has(key)) {
				continue;
			}

			const allConditionalPlaceholderMatches = [...value.matchAll(matchConditionalPlaceholderRegex)];

			// skip processing if no placeholders were found
			if (allConditionalPlaceholderMatches.length > 0) {
				const firstMatch = allConditionalPlaceholderMatches[0];
				const matchedPlaceholder = firstMatch.groups!.placeholder;
				const matchedOperation = firstMatch.groups!.operation;

				// if first match is not an opening tag, simply remove it
				if (!["#", "^"].includes(matchedOperation)) {
					// remove unbalanced end tag
					const newValue = value.slice(0, firstMatch.index) + value.slice(firstMatch.index + firstMatch[0].length);
					placeholderMap.set(key, newValue);
					conditionalChangeCount++;
					if (debug) {
						console.info(`Closing conditional tag "${matchedPlaceholder}" found without opening tag in content "${key}"`);
					}
				} else {
					// else if first match is an opening tag, find its closing tag
					let nestedLevel = 1;
					// start at index 1 since we've already checked the first match
					let matchIndex = 1;
					for (matchIndex = 1; matchIndex < allConditionalPlaceholderMatches.length; matchIndex++) {
						const currentMatch = allConditionalPlaceholderMatches[matchIndex];
						
						// only process tags that are the same as the initially matched placeholder
						if (currentMatch.groups!.placeholder == matchedPlaceholder) {
							const currentOperation = currentMatch.groups!.operation;
							// if another opening tag, increase nest level
							if (["#", "^"].includes(currentOperation)) {
								nestedLevel++;
							} else {
								nestedLevel--;
							}
						}

						// if we found the matching end tag
						if (nestedLevel == 0) {
							//         __ ____            __
							//       _/_//_/ /_____  ____/ /___
							//     _/_//_// __/ __ \/ __  / __ \
							//   _/_//_/ / /_/ /_/ / /_/ / /_/ /
							//  /_//_/   \__/\____/\__,_/\____/
							//todo: evaluate conditional

							// Because we don't continue when the first conditional isn't resolved, putting a non-resolving conditional in a placeholder value will cause all subsequent conditionals to also not resolve.
							// TODO: see if I can still resolve other ones. Nested conditionals won't matter since the unresolved one will be completely removed,
							// but it is a problem with other sibling conditionals.

							// break out of loop
							break;
						}
					}

					// if the start tag was not closed by the end of the loop, remove it
					if (nestedLevel > 0) {
						// remove unclosed start tag
						const newValue = value.slice(0, firstMatch.index) + value.slice(firstMatch.index + firstMatch[0].length);
						placeholderMap.set(key, newValue);
						conditionalChangeCount++;
						if (debug) {
							console.info(`Unclosed conditional tag "${matchedPlaceholder}" found in content "${key}"`);
						}
					}
				}
			} else {
				// no more conditionals, skip this placeholder in the future
				fullyProcessedConditionalPlaceholders.add(key);
			}
		}
	} while (conditionalChangeCount > 0);


	// Step 4: Remove any remaining conditional placeholder tags, including inverted placeholders
	//         __ ____            __
	//       _/_//_/ /_____  ____/ /___
	//     _/_//_// __/ __ \/ __  / __ \
	//   _/_//_/ / /_/ /_/ / /_/ / /_/ /
	//  /_//_/   \__/\____/\__,_/\____/
	//todo: Remove unresolved conditionals


	// Step 5: Unescape `{{<}}` and `{{>}}` as `{` and `}`
	//         __ ____            __
	//       _/_//_/ /_____  ____/ /___
	//     _/_//_// __/ __ \/ __  / __ \
	//   _/_//_/ / /_/ /_/ / /_/ / /_/ /
	//  /_//_/   \__/\____/\__,_/\____/
	//todo: Unescape escaped `{` and `}`

	return templateContent;
}

/** 
 * Escapes HTML
 */
export function htmlEscape(input: string): string {
	return input
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#x27;");
}
