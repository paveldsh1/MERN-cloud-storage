import { body } from 'express-validator'

export const emailValidator = body('email')
	.isEmail()
	.withMessage('Uncorrect email')