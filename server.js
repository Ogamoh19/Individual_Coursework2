const express = require('express');
const mongodb = require('mongodb');
require('dotenv').config();
const cors = require('cors');

const MongoClient = require('mongodb').MongoClient;
const app = express();

const logger = require('./middleware/logger');

var db;
const port = process.env.PORT;
const mongo_url = process.env.MONGO_URI;

app.use(express.json())
app.use(cors());
app.use(express.static('img'))

app.get('/lessons', logger, function (req, res) {
    db.collection('lessons').find({}).toArray(function(err, result) {
      res.setHeader('Access-Control-Allow-Origin', "*")
      res.json(result)
    })
});

app.post('/order_info', function (req, res) {
  console.log(req.body)
  db.collection('order_info').insertOne(req.body, function (
    err,
    result
  ) {
    res.setHeader('Access-Control-Allow-Origin', "*")
    res.json(result)
  })
});;

function createOrder(order){
    db.collection('order_info').insertOne(order, function (
      err,
      result
    ) {
      console.log(result)
    })
  }

  app.put('/buy-lessons',logger, function (req, res) {
    // return res.json(req.body.user)
      req.body.cart.forEach(data => {
        db.collection('lessons').findOne({_id : new mongodb.ObjectId(data._id)})
        .then(obj => {
          if (obj.spaces == 0) {
            db.collection('lessons').findOne({_id : new mongodb.ObjectId(data._id)})
            .then(obj => {
              res.json(obj)
            })
          }else{
            let updatedData = { $set: {space : obj.spaces-data.reserved} }
            db.collection('lessons').findOneAndUpdate({_id : new mongodb.ObjectId(data._id)}, updatedData)
            .then(obj => {
              let order = {
                courseName: data.name,
                full_name: req.body.user.full_name,
                phone: req.body.user.phone,
                quantity: data.reserved
              }
              createOrder(order);
              res.json(obj)
            })
          }
        })
      });
  });

  app.get('/search-lessons', logger, function (req, res) {
    console.log(req.query.keyword)
    db.collection('lessons').find({"$or":[
      {'name': {'$regex': req.query.keyword, '$options' : 'i'}},
      {'location': {'$regex': req.query.keyword, '$options' : 'i'}}
    ]}).toArray(function(err, result) {
      res.setHeader('Access-Control-Allow-Origin', "*")
      res.json(result)
    })
});

app.use((req, res) => {
    res.send({
        "error": "Bad Request"
    })
})

app.listen(port, () => {
    console.log(`server listening on port: ${port}`);

    MongoClient.connect(mongo_url, (err, client) => {
        if (err) throw err;
        console.log('database connected!!');

        db = client.db('School_work')
    })
})