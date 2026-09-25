import express from 'express'
import { getAuthRouter, loginRouter } from './routes/authRouter.js'
import { getRootRoute } from './routes/rootRouter.js'
import { cors } from './middleware/corsMiddleware.js'

export const app = express()

app.use(express.json())
app.use(cors)

app.use('/api/auth', getAuthRouter(), loginRouter())
app.use('/', getRootRoute())