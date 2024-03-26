// require('dotenv').config({ path: './env' });  // Older syntax

import express from 'express';
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js'

dotenv.config({
  path: './.env'
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server listening at port :${process.env.PORT}`);
    })
  })
  .catch((error) => {
    console.log("MongoDb Connection Failed", error);
  });

