const express = require('express')

const app = express()
const PORT = process.env.PORT || 5000

app.get('/', (req, res) => {
  res.json({ message: 'Book More — Hello World' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
