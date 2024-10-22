const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const port = 3000;
app.use('/user', userRoutes);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (req, res) => {
    res.send('landing page');
});



app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});