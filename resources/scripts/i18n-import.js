const path = require('path')
const fs = require('fs')

const STRING_FILES = fs.readdirSync(__dirname)

let exported = {}

for (let FILEPATH of STRING_FILES) {
	if (['i18n-export.js', 'i18n-import.js'].includes(FILEPATH)) continue
	const lang = FILEPATH.replace('.json', '')
	FILEPATH = path.join(__dirname, FILEPATH)
	if (FILEPATH.endsWith('strings.json')) {
		exported.en = JSON.parse(fs.readFileSync(FILEPATH)).en
		continue
	}
	const data = JSON.parse(fs.readFileSync(FILEPATH))
	exported[lang] = data.en
	console.log('read ' + FILEPATH)
}

fs.writeFileSync(path.join(__dirname, 'strings.json'), JSON.stringify(exported, null, 2))

const data = exported

for (const lang in data) {
	if (lang === 'en') continue
	const LANGPATH = path.join(__dirname, '..', 'i18n', lang)
	if (!fs.existsSync(LANGPATH)) fs.mkdirSync(LANGPATH)
	for (const key in data[lang]) {
		const FILEPATH = path.join(LANGPATH, key + '.json')
		fs.writeFileSync(FILEPATH, JSON.stringify(data[lang][key], null, 2))
		console.log('wrote to ' + FILEPATH)
	}
}

console.log('finished import')