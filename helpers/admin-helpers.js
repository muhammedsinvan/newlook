var db = require('../config/connection')
var { ObjectId } = require('mongodb')
const { response } = require('express')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
const moment = require('moment')
const Collection = require('mongodb/lib/collection')




module.exports = {
    //admin login
    getlog: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = true
            let response = {}
            let user = await db.get().collection(collections.ADMIN_COLLECTION).findOne({ email: adminData.email })
            if (user) {
                console.log(adminData.password);
                console.log(user.password);

                if (adminData.password === user.password) {
                    console.log("done")
                    response.user = user
                    response.status = true
                    resolve(response)
                } else {
                    console.log('failed')
                    resolve({ status: false })
                }


            } else {
                console.log('login failed')
                resolve({ status: false })
            }
        })
    },

    //add product 
    addproduct: (product) => {

        console.log("add product function called")
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                resolve(data.insertedId)
            })
        })
    },

    //view all prooduct that admin add
    getallproducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    //to delete a product
    deleteproduct: (prodid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: ObjectId(prodid) }).then((response) => {
                resolve(true)
            })
        })

    },

    //edit a product
    getallproductsedit: (proid) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proid) })
            console.log(product);
            resolve(product)
        })
    },

    //updating the edit product
    updateproduct: (proid, prodetail) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION)
                .updateOne({ _id: ObjectId(proid) }, {
                    $set: {
                        name: prodetail.name,
                        price: prodetail.price,
                        packof: prodetail.packof,
                        fabric: prodetail.fabric,
                        brand: prodetail.brand,
                        catagaries: prodetail.category,
                        stock:prodetail.stock

                    }
                }).then(() => {
                    resolve(proid)
                 
                })
        })
    },

    //adding brand and catagaries
    addcatagory: (catagorydata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATAGORY_COLLECTION).insertOne(catagorydata).then((response) => {
                resolve(response)
            })
        })
    },
    //getting the catagory to add product
    getcatagory: () => {
        return new Promise((resolve, reject) => {
            let catagory = db.get().collection(collections.CATAGORY_COLLECTION).find().toArray()
            resolve(catagory)
        })
    },
    //adding the brand and catagory
    addbrand: (branddata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BRAND_COLLECTION).insertOne(branddata).then((response) => {
                resolve(response.insertedId)
            })
        })
    },

    //getting the branding to product
    getbrand: () => {
        return new Promise((resolve, reject) => {
            let brand = db.get().collection(collections.BRAND_COLLECTION).find().toArray()
            resolve(brand)
        })
    },

    //get all the details of user
    getalldetail: () => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(details)
        })
    },

    //blocking the user
    blockuser: (userid) => {
        return new Promise(async (resolve, reject) => {
            let blkuser = await db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userid) })
            console.log(blkuser)
            if (blkuser.permission) {

                value = blkuser.permission = false

            } else {

                value = blkuser.permission = true

            }
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userid) }, { $set: { permission: (value) } }).then((response) => {

                resolve()
            })
        })
    },
    //addin banner detail 
    addbanner: (bannerdata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).insertOne(bannerdata).then((response) => {
                resolve(response.insertedId)
            })
        })
    },

    //getting the banner
    getbanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collections.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },

    deletebanner: (proid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).removeOne({ _id: ObjectId(proid) }).then((response) => {
                resolve(response)
            })
        })
    },
    //edit banner
    geteditBanner: (proid) => {

        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collections.BANNER_COLLECTION).findOne({ _id: ObjectId(proid) })
            resolve(product)
        })
    },

    //posting edit page
    editBanner: (proid, prodata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).updateOne({ _id: ObjectId(proid) },
                {
                    $set: {
                        title: prodata.title,
                        subtitle: prodata.subtitle,
                        value: prodata.value

                    }
                }).then((response) => {
                    console.log(response)
                    resolve(response)
                })
        })
    },
    deletebrand:(bradid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.BRAND_COLLECTION).removeOne({_id:ObjectId(bradid)}).then((response)=>{
                resolve(response)
            })
        })
    },
    allorder:()=>{
        return new Promise(async(resolve,reject)=>{
          let orderfullhistory= await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
          resolve(orderfullhistory)
        })
    },

    //changing all status
    changeorderstatus:(orderid,statu)=>{
        return new Promise((resolve,reject)=>{
            if(statu=="placed"){
                db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
                {
                    $set:{
                        status:statu,
                        placed:true
                    }
                }).then(()=>{
                    resolve()
                })
            }else if(statu=="shipped"){
                db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
                {
                    $set:{
                        status:statu,
                        shipped:true
                    }
                }).then(()=>{
                    resolve()
                })
            }else if(statu=="delivered"){
                db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
                {
                    $set:{
                        status:statu,
                        placed:true
                    }
                }).then((response)=>{
                    resolve()
                })
            }else if(statu=="cancelled"){
                db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
                {
                    $set:{
                        status:statu,
                        cancelled:true
                    }
                }).then(()=>{
                    resolve()
                })
            }else{
                db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
                {
                    $set:{
                        status:statu,
                    }.then(()=>{
                        resolve()
                    })
                })
            }
        })
    },

//adding coupen
    addcoupen:(coupendata)=>{
        coupendata.enddate=new Date(coupendata.enddate)
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.COUPEN_COLLECTION).insertOne(coupendata)
            db.get().collection(collections.COUPEN_COLLECTION).createIndex({"enddate":1}, {expireAfterSeconds:0}).then((response)=>{
                resolve(response)
            })
            })
        
    },

    //viewing all coupen
    getcoupen:()=>{
        return new Promise(async(resolve,reject)=>{
            let coupen = await db.get().collection(collections.COUPEN_COLLECTION).find().toArray()
            resolve(coupen)
        })
    },

    //deleting the coupen
    deletecoupen:(coupenid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.COUPEN_COLLECTION).removeOne({_id:ObjectId(coupenid)}).then((response)=>{
                resolve(response)
            })
        })
    },

    //deleting the catagory
    deletecatagory:(catid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.CATAGORY_COLLECTION).removeOne({_id:ObjectId(catid)}).then((response)=>{
                resolve(response)
            })
        })
    },

    getallusers:()=>{
        return new Promise(async(resolve,reject)=>{
           let allusers=await db.get().collection(collections.USER_COLLECTION).find().count()
           resolve(allusers)
        })
    },

    getallorders:()=>{
        return new Promise(async(resolve,reject)=>{
            let allorders =await db.get().collection(collections.ORDER_COLLECTION).find().count()
            resolve(allorders)
        })
    },

    gettotalsales:()=>{
        return new Promise(async(resolve,reject)=>{
            let allprofit=await db.get().collection(collections.ORDER_COLLECTION).find().project({totalamount:1,_id:0}).toArray()
            let total=0
            for (const x of allprofit) {
                    total +=x.totalamount
            }
            resolve(total)
        })
    },

    gettopthreebrand:()=>{
        return new Promise(async(resolve,reject)=>{
            let topthreebrand=await db.get().collection(collections.ORDER_COLLECTION).aggregate([

                {
                    $unwind:'$products'
                },
                {
                    $unwind:"$products.products"
                },
                {
                   $lookup:
                      {
                          from: collections.PRODUCT_COLLECTION,
                          localField: "products.products.item",
                          foreignField: "_id",
                          as:"productDetails"

                      }
                },
                {
                    $unwind:"$productDetails"
                },
                {
                    $group:
                       {
                           _id:"$productDetails.brand",
                           count: { $sum: 1 }
                       }
                },
                {
                    $limit:(3)
                }
            ]).toArray()
            resolve(topthreebrand)
        })
    },


    getcatagorysales:()=>{
        return new Promise(async(resolve,reject)=>{
            let catagorysales=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $unwind:'$products'
                },
                {
                    $unwind:'$products.products'
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:"products.products.item",
                        foreignField:"_id",
                        as:"allproductdetail"
                    }
                },
                {
                    $unwind:"$allproductdetail"
                },
                {
                    $group:{
                        _id:"$allproductdetail.catagaries",
                        count: { $sum: 1 }
                    }
                }
            ]).toArray()
            resolve(catagorysales)
            console.log(catagorysales)
        })
    },

    //sales report
    getallsalesreports:()=>{
        return new Promise(async(resolve,reject)=>{
            let salesreportall=await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
            resolve(salesreportall)
        })
    },

    //recent orders
    getrecenthistory:()=>{
        return new Promise(async(resolve,reject)=>{
            let recentoder =await db.get().collection(collections.ORDER_COLLECTION).find().limit(10).toArray()
            resolve(recentoder)
        })
    },

    //getting all user report
    getalluserreport:()=>{
        return new Promise(async(resolve,reject)=>{
            let userreport=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $unwind:"$products"
                },
                
                {
                    $group: {
                        _id: "$userid",
                        allorders: { "$sum": 1 },
                        total: { "$sum": "$totalamount" },
                        totalquantity: { "$sum": "$products.products.quantity" }    
                   }
                }
                
            ]).toArray()
           resolve(userreport)
            console.log(userreport)
        })
    },

    
    //posting the offer
    addoffer:(offer)=>{
        catname=offer.type
        catvalue=offer.value
        offer.enddate=new Date(offer.enddate)
        return new Promise(async(resolve,reject)=>{
            let checkoffer=await db.get().collection(collections.OFFER_COLLECTION).findOne({type:offer.type})
            let prooffer=await db.get().collection(collections.PRODUCT_OFFER).find({prooffer:offer.type}).toArray()

            let productname=[]
            for(x of prooffer){
                productname.push(x.productname)
            }
            if(!checkoffer){
                db.get().collection(collections.OFFER_COLLECTION).insertOne(offer).then(async(response)=>{
                    if(prooffer!=""){
                    var catagory=await db.get().collection(collections.PRODUCT_COLLECTION).find({catagaries:catname,name:{$nin:productname}}).toArray()

                    }else{
                        var catagory=await db.get().collection(collections.PRODUCT_COLLECTION).find({catagaries:catname}).toArray()
                    }


                   var bulkOp = db.get().collection(collections.PRODUCT_COLLECTION).initializeOrderedBulkOp();

                   var count=0

                   let result=await db.get().collection(collections.PRODUCT_COLLECTION).find({catagaries:catname,name:{$nin:productname}}).forEach(function(doc){

                    bulkOp.find({'_id':doc._id,}).updateOne({
                        '$set':{
                            'offer':true,
                            'oldPrize':parseInt(doc.price),
                            'value':catvalue,
                            'price':(parseInt(doc.price)-parseInt(doc.price*catvalue/100)).toFixed(0)
                        }
                    })
                    count++
                    if(count % catagory.length===0){
                        bulkOp.execute();
                        bulkOp =db.get().collection(collections.PRODUCT_COLLECTION).initializeOrderedBulkOp();
                    }
                   })

                   resolve(response)
                })
            }else{
                resolve({catofferpresent:true})
            }

        // db.get().collection(collections.OFFER_COLLECTION).createIndex({"enddtae":1}, {expireAfterSeconds:0}).then((response)=>{
        //         resolve(response)
        //     })
        })
    },

    //getting all the offer
    getalloffer:()=>{
return new Promise(async(resolve,reject)=>{
    let alloffer=await db.get().collection(collections.OFFER_COLLECTION).find().toArray()
    resolve(alloffer)
})
    },

    //deleting the offer
    deleteoffer:(offerid)=>{
        return new Promise(async(resolve,reject)=>{
            let offerdata=await db.get().collection(collections.OFFER_COLLECTION).findOne({_id:ObjectId(offerid)})
            let product= await db.get().collection(collections.PRODUCT_COLLECTION).findOne({catagaries:offerdata.type})

            db.get().collection(collections.OFFER_COLLECTION).deleteOne({_id:ObjectId(offerid)}).then(async(response)=>{
                let product=db.get().collection(collections.PRODUCT_COLLECTION).find({catagaries:offerdata.type}).toArray()

                var bulkOp = db.get().collection(collections.PRODUCT_COLLECTION).initializeOrderedBulkOp();
                var count = 0;
                await db.get().collection(collections.PRODUCT_COLLECTION).find({catagaries:offerdata.type}).forEach(function(doc){
                    bulkOp.find({_id:doc._id}).updateOne({
                        $set:{
                            offer:false,
                            price:doc.oldPrice
                        }
                    })
                    count++
                    if(count%product.length === 0){
                        bulkOp.execute();
                        bulkOp =db.get().collection(collections.PRODUCT_COLLECTION).initializeOrderedBulkOp();   
                     }
            })
            if(count > 0 ){
                console.log("third")
                bulkOp.execute();
            }    
            resolve(response)
        })
    })
    },
          //taking sub catagory
          getallsubcatagory:()=>{
            return new Promise(async (resolve,reject)=>{
                let subcatagorys=await db.get().collection(collections.PRODUCT_COLLECTION).find().project({subcatagory:1,_id:0}).toArray()
              let subCatogory = []
              for(x of subcatagorys){
                  if(!subCatogory.includes(x.subcatagory)){
  
                      subCatogory.push(x.subcatagory)
                  }
              }
              resolve(subCatogory)
            })
            
        },

        //tacking sales report by date
        getdatesalesreport:(start,end)=>{
            return new Promise(async(resolve,reject)=>{
                let report=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $match:{date:{$gte:new Date(start),$lt:new Date(end)}}
                    },
                    {
                        $sort:{date:-1}
                    }               
                ]).toArray()
                resolve(report)
            })
        },

        //get product stock
        getproductstock:()=>{
            return new Promise(async(resolve,reject)=>{
                let allproductreport=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
                resolve(allproductreport)
            })
        },


        //adding product offer
        addprooffer:(data)=>{
            data.enddate = new Date(data.enddate)
          
            return new Promise(async(resolve,reject)=>{
               let product=await db.get().collection(collections.PRODUCT_COLLECTION).findOne({name:data.prooffer})
                let productOffer = await db.get().collection(collections.PRODUCT_OFFER).findOne({prooffer:data.prooffer})             
                let catoffer=await db.get().collection(collections.OFFER_COLLECTION).findOne({type:product.catagaries})
               
              
            
                if(!productOffer){
                    if(!catoffer){
                    db.get().collection(collections.PRODUCT_OFFER).insertOne(data).then(async(response)=>{
                        db.get().collection(collections.PRODUCT_COLLECTION).updateOne({name:data.prooffer},{
        
                            $set:
                            {
                                offer:true,
                                oldPrize:product.price,
                                value:data.value,
                                price:parseInt((product.price - product.price * data.value/100))
                            }
                        })
                        resolve(response)
                    })
        
                }else{
                    if(data.value>catoffer.value){
                        db.get().collection(collections.PRODUCT_OFFER).insertOne(data).then(async(response)=>{
                            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({name:data.prooffer},{
                                $set:{
                                    offer:true,
                                    oldPrize:parseInt(product.oldPrize),
                                    value:parseInt(data.value),
                                    price:parseInt((product.oldPrize - product.oldPrize * data.value/100)).toFixed(0)
                                }
                            })
                        })
                }else{
                    resolve({proOffervalueless:true})
                }
            }
        }else{
            resolve({proOfferExists:true})
        }
            
            })
        },



//view product offer
        viewprooffer:()=>{
            return new Promise((resolve,reject)=>{
                let offerpro=db.get().collection(collections.PRODUCT_OFFER).find().toArray()
                resolve(offerpro)
            })
        },

  //deleting the product offer
deleteprooffer:(offerid)=>{
    return new Promise(async(resolve,reject)=>{
        let offerdata= await db.get().collection(collections.PRODUCT_OFFER).findOne({_id:ObjectId(offerid)})
        let product = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({name:offerdata.prooffer})
         console.log(product)
        db.get().collection(collections.PRODUCT_OFFER)
         .deleteOne({_id:ObjectId(offerid)}).then((response)=>{
             db.get().collection(collections.PRODUCT_COLLECTION).updateOne({name:offerdata.prooffer},{
                 $set:{
                     offer:false,
                     price:product.oldPrize
                     }
             })
             resolve(response)
         }).catch((err)=>{
             console.log(err)
         })
    })
}
}