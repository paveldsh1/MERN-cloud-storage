import mongoose from 'mongoose'
import 'dotenv/config'

const mongoUri = process.env.mongoURI

export async function runDb() {
  try {
    console.log('CONNECTING MONGO')

    await mongoose.connect(mongoUri)

    console.log('MONGO CONNECTED')
  } catch (err) {
    console.log('MONGO CONNECTION ERROR', err)
  }
}

export async function closeDb() {
  console.log('CLOSING MONGO')

  await mongoose.connection.close()

  console.log('MONGO CLOSED')
}