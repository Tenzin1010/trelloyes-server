require ('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {NODE_ENV} = require('./config')


const cardRouter = require('./card/card-router')
const listRouter = require('./list/list-router');

const app = express();

const morganOption = (NODE_ENV === 'production') ? 'tiny': 'common';

app.use(morgan((morganOption)));
app.use(helmet());
app.use(cors())
app.use(cardRouter)
app.use(listRouter)



//authorization middleware, validates with Authorization header, Server-side programming/9. POST and DELETE request
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')
  
  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' })
  }
  // move to the next middleware
  next()
})

app.use(card-router)
app.use(list-router)

//DELETE List 
//1. set the value of id entered by user const {id}
//2. get the value of id (findIndex)
//3. validate if id matches id in array & send error response (400)
//4. delete the matching id (splice)
//5. log response (logger.inf)(status 204)


//Delete Card
//1. set the value of id entered by user const {id}
//2. get the value of id (findIndex)
//3. validate if id matches id in array & send response (if) (status 400)
//4. before deleting the card it must be removed from the list as well since the card is present in the list as well
//5. delete the matching id (splice)
//6. log response (logger.info) (status 204)

app.use(function errorHandler(error, req, res, next) {
       let response
       if (NODE_ENV === 'production') {
         response = { error: { message: 'server error' } }
       } else {
         console.error(error)
         response = { message: error.message, error }
       }
       res.status(500).json(response)
     })
module.exports = app;