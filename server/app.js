import express from 'express'
import { getAuthRouter, loginRouter } from './routes/authRouter.js'
import { getRootRoute } from './routes/rootRouter.js'

export const app = express()

app.use(express.json())

app.use('/api/auth', getAuthRouter(), loginRouter())
app.use('/', getRootRoute())