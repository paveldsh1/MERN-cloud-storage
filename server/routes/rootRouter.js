import express from 'express'

export const getRootRoute = () => {
	const router = express.Router()
	//handler of request
	router.get('/', (req, res) => {
		res.json({
			message: 'Server is working'
		})
	})

	return router
}