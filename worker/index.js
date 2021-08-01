const key =require('./key')
const redis=  require('redis')

console.log(key.test,key.tri)

const redisClient=redis.createClient({
    host:key.redisHost,
    port:key.redisPort,
    retry_strategy:()=>1000
})

const sub= redisClient.duplicate()
//according to redis documentation, a client which is subscribe or listening to oter services cannot be used for other purposes
function fib(index){
    if (index<2)
    return 1

    return (fib(index-1)+fib(index-2))
}

sub.on("message",(channel,message)=>{
    redisClient.hset('values',message,fib(parseInt(message)))
    //adding fib value in hashset with key = message
})

sub.subscribe('insert')