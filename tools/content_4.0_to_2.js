#!/usr/bin/env node

// Converts from application version ^4.0 to file version 2

const fs = require("fs");

const filename = "./content.json";

const inputJson = fs.readFileSync(filename, "utf-8");
const input = JSON.parse(inputJson);

const output = {
	version: 2,
	items: Object.fromEntries(Object.entries(input).map(([songTitle, songContent]) => [
		songTitle,
		{
			group: songTitle.split(" ")[0].length > 0 ? songTitle.split(" ")[0] : undefined,
			data: [
				...(
					songContent.attribution != undefined
						? [{ name: "Song Attribution", value: songContent.attribution }]
						: []
				),
			],
			pages: Object.fromEntries(Object.entries(songContent.verses).map(([verseTitle, verseContent]) => [
				verseTitle,
				{
					data: { name: "Song Verse Content", value: verseContent },
				},
			])),
		}
	])),
};

const outputJson = JSON.stringify(output);
fs.writeFileSync(filename, outputJson, "utf-8");
