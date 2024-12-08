const express = require('express')
const app = express();

const SaleRouters = require('./routes/sales.js')
const userRoutes = require('./routes/use.js')
const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(bodyParser.json())

app.use('/api',saleRouters)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));