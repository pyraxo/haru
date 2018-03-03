const path = require('path')
const fs = require('fs')

const STRINGS = path.join(__dirname, '..', 'i18n', 'en')
const STRING_FILES = fs.readdirSync(STRINGS)

let exported = { en: {} }

for (let FILEPATH of STRING_FILES) {
	FILEPATH = path.join(STRINGS, FILEPATH)
	const data = JSON.parse(fs.readFileSync(FILEPATH))
	exported.en[path.basename(FILEPATH).replace('.json', '')] = data
	console.log('read ' + FILEPATH)
}

fs.writeFileSync(path.join(__dirname, 'strings.json'), JSON.stringify(exported, null, 2))
console.log('finished export')