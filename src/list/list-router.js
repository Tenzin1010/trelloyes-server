const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const {cards, lists} = require('../store');


const listRouter = express.Router();
const bodyParser = express.json();

listRouter 
    .route('/list')
    .get((req, res) => {
        res
            .json(lists);
    })
    .post(bodyParser, (req, res) => {
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
    })

listRouter 
    .route('/list/:id')
    .get((req, res) => {
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
    .delete(bodyParser, (req, res) => {
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

    module.exports = listRouter
    