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
	deleteFile(file) {
		const path = this.getPath(file)
		if (file.type === 'dir') {
			fs.rmdirSync(path)
		} else {
			fs.unlinkSync(path)
		}
	}
	getPath(file) {
		return process.env.filePath + '\\' + file.user + '\\' + file.path
	}
}

export default new FileService()