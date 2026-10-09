import express from 'express'
import { getRegistrationRouter, getLoginRouter, getAuthRouter } from './routes/authRouter.js'
import { cors } from './middleware/corsMiddleware.js'
import { getRootRoute } from './routes/rootRouter.js'
import { getFileRouter } from './routes/fileRouter.js'
import fileUpload from 'express-fileupload'
export const app = express()

app.use(fileUpload({}))
app.use(express.json())
app.use(cors)

app.use('/api/auth', getRegistrationRouter(), getLoginRouter(), getAuthRouter())
app.use('/api/files', getFileRouter())
app.use('/', getRootRoute())