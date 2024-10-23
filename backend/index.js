import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import staffRoutes from './routes/staffRoutes.js';
import editorialRoutes from './routes/editorialRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import eicRoutes from './routes/eicRoutes.js';

dotenv.config();
const app = express();

app.use('/staff', staffRoutes);
app.use('/editorial', editorialRoutes);
app.use('/task', taskRoutes);
app.use('/eic', eicRoutes);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('landing page');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});