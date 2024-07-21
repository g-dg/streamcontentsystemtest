#!/usr/bin/env python3

srcDir = "./songs"
destDir = "./songs_json"

import json
import re
import os
from xml.dom import minidom

files = os.listdir(srcDir)

verseRePattern = re.compile("^v[0-9]+.*$")

for file in files:
	print(file)
	file = os.path.join(srcDir, file)
	dom = minidom.parse(file)
	title = dom.getElementsByTagName("title")[0].firstChild.nodeValue
	verses = dom.getElementsByTagName("verse")
	output = {}
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
		output[verseName] = fullVerse
	outputJson = json.dumps(output)
	outputFileName = title
	with open(os.path.join(destDir, outputFileName), "w") as outfd:
		outfd.write(outputJson)
