const mongoClient=require('mongodb').MongoClient

const state={
    db:null
}

module.exports.connect=function(done){
    const url='3.90.8.17:3001'
    const dbname='newlook'
    

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
}

module.exports.get=function(){
    return state.db 
}