const path = require('path')
const fs = require('fs')

const FOLDERPATH = path.join(__dirname, '..', 'i18n')
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'strings.json')))
for (const lang in data) {
	if (lang === 'en') continue
	const LANGPATH = path.join(__dirname, '..', 'i18n', lang)
	for (const key in data[lang]) {
		const FILEPATH = path.join(LANGPATH, key + '.json')
		fs.writeFileSync(FILEPATH, JSON.stringify(data[lang][key], null, 2))
		console.log('wrote to ' + FILEPATH)
	}
}

console.log('finished import')