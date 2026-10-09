import fileService from '../services/fileService.js'
import File from '../models/File.js'
import User from '../models/User.js'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'

// Работаем непосредственно с запросами
class FileController {
	// Создание папки
	async createDir(req, res) {
		try {
			const { name, type, parent } = req.body

			if (!name || !type) {
				return res.status(400).json({
					message: 'Name and type are required'
				})
			}

			let parentFile = null

			if (parent) {
				if (!mongoose.Types.ObjectId.isValid(parent)) {
					return res.status(400).json({
						message: 'Invalid parent ID'
					})
				}

				parentFile = await File.findOne({
					_id: parent,
					user: req.user.id,
					type: 'dir'
				})

				if (!parentFile) {
					return res.status(404).json({
						message: 'Parent directory not found'
					})
				}
			}

			const relativePath = parentFile
				? path.join(parentFile.path, name)
				: name

			// Создаём директорию на диске
			const userRoot = path.join(
				process.env.filePath,
				String(req.user.id)
			)

			const dirPath = path.join(userRoot, relativePath)

			// Проверяем, что путь остаётся внутри директории пользователя
			if (!dirPath.startsWith(userRoot + path.sep)) {
				return res.status(400).json({
					message: 'Invalid directory path'
				})
			}

			if (fs.existsSync(dirPath)) {
				return res.status(400).json({
					message: 'Directory already exists'
				})
			}

			const file = new File({
				name,
				type: 'dir',
				path: relativePath,
				parent: parentFile?._id,
				user: req.user.id
			})

			await fileService.createDir(file)

			await file.save()

			if (parentFile) {
				parentFile.childs.push(file._id)
				await parentFile.save()
			}

			return res.json(file)
		} catch (error) {
			console.error(error)

			return res.status(500).json({
				message: 'Create directory error'
			})
		}
	}

	// Получение файлов и папок
	async getFiles(req, res) {
		try {
			const parentId = req.query.parent

			const filter = {
				user: req.user.id
			}

			if (parentId) {
				if (!mongoose.Types.ObjectId.isValid(parentId)) {
					return res.status(400).json({
						message: 'Invalid parent ID'
					})
				}

				filter.parent = parentId
			} else {
				filter.parent = null
			}

			const files = await File.find(filter)

			return res.json(files)
		} catch (error) {
			console.error(error)

			return res.status(500).json({
				message: "Can't get files"
			})
		}
	}

	// Загрузка файла
	async uploadFile(req, res) {
		let uploadPath

		try {
			if (!req.files?.file) {
				return res.status(400).json({
					message: 'File was not provided'
				})
			}

			const file = req.files.file
			const parentId = req.body?.parent

			let parent = null

			if (parentId) {
				if (!mongoose.Types.ObjectId.isValid(parentId)) {
					return res.status(400).json({
						message: 'Invalid parent ID'
					})
				}

				parent = await File.findOne({
					_id: parentId,
					user: req.user.id,
					type: 'dir'
				})

				if (!parent) {
					return res.status(404).json({
						message: 'Parent directory not found'
					})
				}
			}

			const user = await User.findById(req.user.id)

			if (!user) {
				return res.status(404).json({
					message: 'User not found'
				})
			}

			if (user.usedSpace + file.size > user.diskSpace) {
				return res.status(400).json({
					message: 'There is no space on the disk'
				})
			}

			const relativePath = parent
				? path.join(parent.path, file.name)
				: file.name

			const userRoot = path.resolve(
				process.env.filePath,
				String(user._id)
			)

			uploadPath = path.resolve(userRoot, relativePath)

			// Защита от выхода за пределы папки пользователя
			if (!uploadPath.startsWith(userRoot + path.sep)) {
				return res.status(400).json({
					message: 'Invalid file path'
				})
			}

			// Убеждаемся, что целевая папка существует
			await fs.promises.mkdir(path.dirname(uploadPath), {
				recursive: true
			})

			if (fs.existsSync(uploadPath)) {
				return res.status(400).json({
					message: 'File already exists'
				})
			}

			// Сначала сохраняем файл на диск
			await file.mv(uploadPath)

			const type = file.name.includes('.')
				? file.name.split('.').pop()
				: 'unknown'

			const dbFile = new File({
				name: file.name,
				type,
				size: file.size,
				path: relativePath,
				parent: parent?._id ?? null,
				user: user._id
			})

			user.usedSpace += file.size

			await dbFile.save()
			await user.save()

			return res.json(dbFile)
		} catch (error) {
			console.error(error)

			// Если запись в БД не удалась, удаляем загруженный файл
			if (uploadPath && fs.existsSync(uploadPath)) {
				try {
					await fs.promises.unlink(uploadPath)
				} catch (unlinkError) {
					console.error('Failed to remove uploaded file:', unlinkError)
				}
			}

			return res.status(500).json({
				message: 'Upload file error'
			})
		}
	}

	// Скачивание файла
	async downloadFile(req, res) {
		try {
			const { id } = req.query

			// 1. Validate ID
			if (!id || !mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({
					message: 'Invalid file ID'
				})
			}

			// 2. Find file belonging to the current user
			const file = await File.findOne({
				_id: id,
				user: req.user.id
			})

			if (!file) {
				return res.status(404).json({
					message: 'File not found'
				})
			}

			// 3. Prevent downloading directories
			if (file.type === 'dir') {
				return res.status(400).json({
					message: 'Cannot download a directory'
				})
			}

			// 4. Get the absolute file path
			const userRoot = path.resolve(
				process.env.filePath,
				String(req.user.id)
			)

			const filePath = path.resolve(userRoot, file.path)

			// 5. Prevent path traversal
			if (!filePath.startsWith(userRoot + path.sep)) {
				return res.status(403).json({
					message: 'Invalid file path'
				})
			}

			// 6. Check if the file exists
			let stats

			try {
				stats = await fs.promises.stat(filePath)
			} catch (error) {
				console.error('File lookup error:', error)

				return res.status(404).json({
					message: 'File does not exist on disk'
				})
			}

			if (!stats.isFile()) {
				return res.status(404).json({
					message: 'The specified path is not a file'
				})
			}

			// 7. Set download response headers
			res.setHeader(
				'Content-Type',
				'application/octet-stream'
			)

			res.setHeader(
				'Content-Disposition',
				`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
			)

			res.setHeader(
				'Content-Length',
				stats.size
			)

			// 8. Stream the file to the response
			const stream = fs.createReadStream(filePath)

			stream.on('error', (error) => {
				console.error('File read error:', error)

				if (!res.headersSent) {
					res.status(500).json({
						message: 'Error downloading file'
					})
				} else {
					res.destroy(error)
				}
			})

			stream.pipe(res)

		} catch (error) {
			console.error('Download error:', error)

			if (!res.headersSent) {
				return res.status(500).json({
					message: 'Server error while downloading file'
				})
			}

			res.destroy(error)
		}
	}

	async deleteFile(req, res) {
		try {
			const file = await File.findOne({ _id: req.query.id, user: req.user.id })
			if (!file) {
				return res.status(400).json({ message: 'file not found' })
			}
			fileService.deleteFile(file)
			await file.deleteOne()
			return res.json({ message: 'File was deleted' })
		} catch (error) {
			console.error(error)
			return res.status(500).json({
				message: 'Delete file error'
			})
		}
	}
}

export default new FileController()