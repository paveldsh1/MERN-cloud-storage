import fs from 'fs'
import 'dotenv/config'

class FileService {
	createDir(file) {
		const filePath = `${process.env.filePath}\\${file.user}\\${file.path}`
		return new Promise((resolve, reject) => {
			try {
				if (!fs.existsSync(filePath)) {
					fs.mkdirSync(filePath)
					return resolve({ message: 'File was created' })
				}
				else {
					return reject({ message: 'File already exist' })
				}
			}
			catch (error) {
				return reject({ message: 'File error' })
			}
		})
	}
}

export default new FileService()