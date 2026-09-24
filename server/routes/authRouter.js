import express from 'express'
import User from '../models/User.js'
import bcryptjs from 'bcryptjs'
import jwt from "jsonwebtoken"
import 'dotenv/config'
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

				const hashPassword = await bcryptjs.hash(password, 8)
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

export const loginRouter = () => {
	const router = express.Router()

	router.post('/login', async (req, res) => {
		try {
			const { email, password } = req.body
			const user = await User.findOne({ email })
			if (!user) return res.status(400).json({ message: 'User not found' })

			const isPassValid = bcryptjs.compareSync(password, user.password)
			if (!isPassValid) return res.status(400).json({ message: 'Invalid password' })

			const token = jwt.sign({ id: user.id }, process.env.secretKey, { expiresIn: '1h' })

			return res.json({
				token,
				user: {
					id: user.id,
					email: user.email,
					diskSpace: user.diskSpace,
					usedSpace: user.usedSpace,
					avatar: user.avatar
				}
			})
		}
		catch (error) {
			console.log(error)
			res.send({ message: 'Server error' })
		}
	})

	return router
}
