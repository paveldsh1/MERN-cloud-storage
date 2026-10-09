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
			const fileId = req.query.id

			if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
				return res.status(400).json({
					message: 'Invalid file ID'
				})
			}

			const file = await File.findOne({
				_id: fileId,
				user: req.user.id
			})

			if (!file) {
				return res.status(404).json({
					message: 'File not found'
				})
			}

			if (file.type === 'dir') {
				return res.status(400).json({
					message: 'Cannot download a directory'
				})
			}

			const userRoot = path.resolve(
				process.env.filePath,
				String(req.user.id)
			)

			const filePath = path.resolve(userRoot, file.path)

			// Проверяем, что путь находится внутри папки пользователя
			if (!filePath.startsWith(userRoot + path.sep)) {
				return res.status(400).json({
					message: 'Invalid file path'
				})
			}

			const stats = await fs.promises.stat(filePath).catch(() => null)

			if (!stats || !stats.isFile()) {
				return res.status(404).json({
					message: 'File not found on disk'
				})
			}

			return res.download(filePath, file.name, (error) => {
				if (error) {
					console.error('Download error:', error)

					if (!res.headersSent) {
						res.status(500).json({
							message: 'Download error'
						})
					}
				}
			})
		} catch (error) {
			console.error(error)

			if (!res.headersSent) {
				return res.status(500).json({
					message: 'Download error'
				})
			}
		}
	}
}

export default new FileController()