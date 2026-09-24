import { Schema, model, Types } from 'mongoose'

const User = new Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	diskSpace: { type: Number, default: 1024 ** 3 * 10 },
	usedSpace: { type: Number, default: 0 },
	avatar: { type: String },
	files: [{ type: Types.ObjectId, ref: 'File' }]
})

export default model('User', User)