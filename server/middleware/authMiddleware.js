import jwt from 'jsonwebtoken'
import 'dotenv/config'

export const cors = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next()
	}

	try {
		const token = req.headers.authorization.split(' ')[1]
		if (!token) {
			return res.status(401).json({ message: 'Auth error' })
		}
		const decoded = jwt.verify(token, process.env.secretKey)
		req.user = decoded
		next()
	} catch (e) {
		return res.status(401).json({ message: 'Auth error' })
	}
}