#!/usr/bin/env python3

inputDir = "./songs"
outputFile = "./songs.json"

import json
import re
import os
from xml.dom import minidom

inputFiles = os.listdir(inputDir)

naturalSort = lambda s: [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\\d+)", s)]
inputFiles = sorted(inputFiles, key=naturalSort)

verseRePattern = re.compile(r"^v[0-9]+.*$")

output = {}

for file in inputFiles:
	file = os.path.join(inputDir, file)
	dom = minidom.parse(file)
	title = dom.getElementsByTagName("title")[0].firstChild.nodeValue
	verses = dom.getElementsByTagName("verse")
	songOutput = {}
	for verse in verses:
		verseName = verse.getAttribute("name")
		if verseRePattern.match(verseName) != None:
			verseName = verseName[1:]
		content = verse.getElementsByTagName("lines")[0].childNodes
		fullVerse = ""
		for line in content:
			if line.nodeValue == None:
				fullVerse += "\n"
			else:
				fullVerse += line.nodeValue
		songOutput[verseName] = fullVerse
	output[title] = songOutput

outputJson = json.dumps(output, separators=(',', ':'))
with open(outputFile, "w") as outfd:
	outfd.write(outputJson)
