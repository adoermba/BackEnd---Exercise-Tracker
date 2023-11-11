const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Use BodyParser
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false}));

// MongoDB
const dotenv = require('dotenv');
dotenv.config({path: 'sample.env'});

let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {
    type:String,
    required: true
  },
  log : [{
    description : String,
    duration : Number,
    date: String
     }]
});

let User = mongoose.model('User', userSchema);



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


app.get("/api/users", async function(req, res){
  const userArr = await User.find();
  let outputArr = [];

  userArr.map(user => {
    outputArr.push({
      _id: user._id,
      username: user.username,
      __v: user.__v
    })
  })
  res.json(outputArr)
});


app.post("/api/users", async function(req, res){
  const userName = req.body.username;

  let userDB = await User.findOne({username: userName})
  if (!userDB) {
    let newUser = new User({
      username: userName
    });
    userDB = await newUser.save({username: userName});
  }
  res.json({username: userName, _id: userDB._id})

});



app.post('/api/users/:_id/exercises', async function(req, res){
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const strDate = date.toDateString()

  const user = await User.findById(id);
  if (!user) {
    console.log("")
    res.send("Couldn't find User with ID " + id + ".")
  } else {
    let exercise = {description : description,
                   duration : duration,
                   date: strDate};
    //await User.update({_id:id}, {$push: {log: exercise } });
    user.log.push(exercise);
    user.save()
  }
  
  res.json({
    _id: id,
    username: user.username,
    date: strDate,
    duration: parseInt(duration),
    description: description
  });
})


app.get('/api/users/:_id/logs', async function(req, res){
  const id = req.params._id;
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const limit = parseInt(req.query.limit);

  const user = await User.findById(id);
  if (!user) {
    console.log("")
    res.send("Couldn't find User with ID " + id + ".")
  } else {
    let logArr = [];
    let count = 0;

    user.log.map(exe => {
      let date = new Date(exe.date);
      let isIn = true;
      
      if ((from && from > date) || (to && to < date)){
        isIn = false;
      }
      if (limit && count >= limit){
        isIn = false;
      }

      if (isIn){
        count++;
        logArr.push({
          description: exe.description,
          duration: exe.duration,
          date: exe.date
          })
      }
    })

    res.json({
      _id: user._id,
      username: user.username,
      count: logArr.length,
      log: logArr
    })
 
  }
    
});
