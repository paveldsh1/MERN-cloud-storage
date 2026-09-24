import { body } from 'express-validator'

export const passwordValidator = body('password')
	.isLength({min: 3, max: 12})
	.withMessage('Password must be longer than 3 and shorter than 12')