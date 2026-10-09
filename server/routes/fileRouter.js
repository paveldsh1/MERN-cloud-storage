import express from 'express'
import { cors as authMiddleware } from '../middleware/authMiddleware.js'
import fileController from '../controllers/fileController.js'

export const getFileRouter = () => {
	const router = express.Router()

	router.post('', authMiddleware, fileController.createDir)
	router.post('/upload', authMiddleware, fileController.uploadFile)
	router.get('', authMiddleware, fileController.getFiles)
	router.get('/download', authMiddleware, fileController.downloadFile)
	router.delete('/', authMiddleware, fileController.deleteFile)


	return router
}