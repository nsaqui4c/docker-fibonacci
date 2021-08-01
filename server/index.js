const keys = require('./keys')
const express= require('express')
const cors = require('cors')

const app = express()
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cors())


//postgress client setup
const {Pool}= require('pg')
const pgClient = new Pool({
    user:keys.pgUser,
    password:keys.pgPassword,
    database:keys.pgDatabase,
    port: keys.pgPort,
    host:keys.pgHost
})

pgClient.on('error',()=>{
    console.log("LOST PG CONNECTION")
})

pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err=>console.log(err))




//REdis client setup
const redis = require('redis')
const redisClient=redis.createClient({
    host:keys.redisHost,
    port:keys.redisPort,
    retry_strategy:()=>1000
})

const redisPublisher= redisClient.duplicate()
//according to redis documentation, a client which is subscribe or listening to oter services cannot be used for other purposes




//EXPRESS ROUTE HANDLER

app.get('/',(req,res)=>res.send('Hi, this webserver is working -  server'))

app.get('/value/all',async (req,res)=>{
    console.log('/VALUE/ALL - select * from values')
    const values=  await pgClient.query('SELECT * from values')
    console.log('/VALUE/ALL - select * from values', values)
    res.send(values.rows)
})

app.get('/value/current',async (req,res)=>{
    console.log('/VALUE/ALL - select * from values - REDIS')
   redisClient.hgetall('values',(err,values)=>res.send(values))
})

app.post('/value',(req,res)=>{
    const index= req.body.index
    if(index>40)
    res.status(400).send("Value is too high")

    redisClient.hset('values',index,'Not calculated yet!!!')
    redisPublisher.publish('insert',index)

    pgClient.query("INSERT INTO values(number) VALUES($1)",[index])

    res.send({working:true})
})


app.listen(5000,()=>{
    console.log("server started on port 5000")
})