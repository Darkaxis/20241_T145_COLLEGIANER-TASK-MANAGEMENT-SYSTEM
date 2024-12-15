import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import editorialServices from '../services/editorialServices.js';
import jwt from 'jsonwebtoken';



dotenv.config();


const eicRoutes = express.Router();
eicRoutes.use(bodyParser.json());
eicRoutes.use(bodyParser.urlencoded({ extended: true }));



export default eicRoutes;