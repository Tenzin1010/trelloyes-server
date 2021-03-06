require ('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const winston = require('winston')
const {NODE_ENV} = require('./config')
const uuid = require('uuid/v4')


const app = express();

const morganOption = (NODE_ENV === 'production') ? 'tiny': 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors())
app.use(express.json())


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

//create a cards and lists array
const cards = [{
  id: 1,
  title: 'Task One',
  content: 'This is card one'
}];
const lists = [{
  id: 1,
  header: 'List One',
  cardIds: [1]
}];



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


//POST new Card in the Cards array
app.post('/card', (req, res) => {
  const {title, content} = req.body;

//validate for title & content 
if(!title) {
  logger.error(`Title is required`)
  res
    .status(400)
    .send('Invalid data')
}

if(!content) {
  logger.error(`Content is require`)
  res
    .status(400)
    .send('Invalid data')
}

//generate ID if title & content exists & add to the cards array
const id = uuid();

const card = {
  id, 
  title,
  content
}
cards.push(card)

//logging the creation of a new card & a location header
logger.info(`Card with ${id} was created`);

res
  .status(201)
  .location(`http://localhost:8000/card/${id}`)
  .json(card);
})

//POST new list in the list array
app.post('/list', (req, res) => {
  const { header, cardIds = [] } = req.body;

  if (!header) {
    logger.error(`Header is required`);
    return res
      .status(400)
      .send('Invalid data');
  }

  // check card IDs
  if (cardIds.length > 0) {
    let valid = true;
     cardIds.forEach(cid => {
      const card = cards.find(c => c.id == cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array.`);
        valid = false;
      }
    });

    if (!valid) {
      return res
        .status(400)
        .send('Invalid data');
    }
  }

  // get an id 
  const id = uuid();

  const list = {
    id,
    header,
    cardIds
  };

  lists.push(list);

  logger.info(`List with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8000/list/${id}`)
    .json({id});
});

//DELETE List 
//1. set the value of id entered by user const {id}
//2. get the value of id (findIndex)
//3. validate if id matches id in array & send error response (400)
//4. delete the matching id (splice)
//5. log response (logger.inf)(status 204)
app.delete('/list/:id', (req, res) => {
  const {id} = req.params;

  //findIndex locates the index of the matching id value and stores in listIndex
  //if found listIndex = value of the the Index of first match from the function 
  //otherwise it returns -1 which is used in the validation step
  const listIndex = lists.findIndex(li => li.id == id);

  //validate if listIndex exists
  if (listIndex === -1) {
    logged.error(`List with ${id} not found`)
    .status(400)
    .send('Not found')
  }
//IF id matched delete it. splice(a, b) a is the index value of the element to be removed
//b is the number of elements to remove, in this case only 1
  lists.splice(listIndex, 1)

  logger.info(`List with id ${id} deleted`)
  res
    .status(204)
    .end()
})

//Delete Card
//1. set the value of id entered by user const {id}
//2. get the value of id (findIndex)
//3. validate if id matches id in array & send response (if) (status 400)
//4. before deleting the card it must be removed from the list as well since the card is present in the list as well
//5. delete the matching id (splice)
//6. log response (logger.info) (status 204)
app.delete('/card/:id', (req, res) => {
  const { id } = req.params;

  const cardIndex = cards.findIndex(c => c.id == id);

  if (cardIndex === -1) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Not found');
  }
 
//remove card from lists
  //assume cardIds are not duplicated in the cardIds array
  lists.forEach(list => {
    const cardIds = list.cardIds.filter(cid => cid !== id);
    list.cardIds = cardIds;
  });

  cards.splice(cardIndex, 1);

  logger.info(`Card with id ${id} deleted.`);

  res
    .status(204)
    .end();
});


//GET card 
app.get('/card', (req, res) => {
  res
    .json(cards);
})
//GET list
app.get('/list', (req, res) => {
  res
    .json(lists);
})


//get individual list with a query param

app.get('/list/:id', (req, res) => {
  const {id} = req.params;
  const list = lists.find(l => l.id == id)

  if(!list) {
    logger.error(`Cannot find list of ${id}`)
    res
      .status(404)
      .send('List not found')
  }
  res.json(list)
})


//get individual card in query param
//get in Postman with "localhost:8000/card/1"
app.get('/card/:id', (req, res) => {
  const {id} = req.params;
  const card = cards.find(c => c.id == id)

  if (!card) {
    logger.error(`Card with id ${id} not found.`); //res returned in terminal & ./info.log file, created with winston
    return res
      .status(404) 
      .send('Card Not Found'); //logged in postman response
  }
  res.json(card);
})

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