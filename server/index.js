import { app } from './app.js'
import { runDb } from './db/db.js'
import 'dotenv/config'

const PORT = process.env.PORT

const startApp = async () => {
  await runDb()
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

startApp()