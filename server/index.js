import 'dotenv/config';
import { createApp } from './app.js';
import express from 'express';
import { resolve } from 'node:path';
const port = Number(process.env.SERVER_PORT || 4000);
const app = createApp();
app.use(express.static(resolve('dist')));
app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Lets Link API listening on ${port}`));
