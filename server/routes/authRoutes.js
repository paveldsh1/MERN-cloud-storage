import express from 'express'
import User from '../models/User.js'
import bcryptjs from 'bcryptjs'
import { passwordValidator } from '../validators/passwordValidator.js'
import { emailValidator } from '../validators/emailValidator.js'
import { validationResult } from 'express-validator'

export const getAuthRouter = () => {
	const router = express.Router()

	router.post('/registration',
		emailValidator,
		passwordValidator,
		async (req, res) => {
			try {
				const errors = validationResult(req)
				if (!errors.isEmpty()) {
					return res.status(400).json({
						message: 'Uncorrect request',
						errors: errors.array()
					})
				}

				const { email, password } = req.body
				const candidate = await User.findOne({ email })
				console.log(candidate)

				if (candidate) {
					return res.status(400).json({ message: `User with email ${email} already exist` })
				}

				const hashPassword = await bcryptjs.hash(password, 15)
				const user = new User({ email, password: hashPassword })
				await user.save()
				return res.json({ message: 'User was created' })

			}
			catch (error) {
				console.log(error)
				res.send({ message: 'Server error' })
			}
		})

	return router
}
