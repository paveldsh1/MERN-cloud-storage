import express from 'express'
import { getAuthRouter } from './routes/authRoutes.js'
import { getRootRoute } from './routes/rootRouter.js'
import cors from 'cors'

export const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/auth', getAuthRouter())
app.use('/', getRootRoute())