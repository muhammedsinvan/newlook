var db = require('../config/connection')
var { ObjectId } = require('mongodb')
const { response } = require('express')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk');
const moment = require('moment')
const { resolve } = require('path')
const { rejects } = require('assert')


var instance = new Razorpay({
    key_id: 'rzp_test_kbEsZN8D8TcvTh',
    key_secret: 'cfuW9vlvkRYBgEua1c5A9JX4'
});



module.exports = {


    //user signup by bycrypting the data
    dosignup: (detail) => {

        return new Promise(async (resolve, reject) => {
            detail.permission = true
            detail.password = await bcrypt.hash(detail.password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(detail).then((data) => {
                resolve(data)
            })


        })

    },

    //user login with registered email and password
    getlogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('failed')
                        resolve({ status: false })
                    }
                })


            } else {
                console.log('login failed')
                resolve({status:false})
            }
        })
    },

    //chekking and adding the product to cart
    addtocart: (proid, userid) => {
        let proobj = {
            item: ObjectId(proid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let usercart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userid) })
            if (usercart) {
                let proexist = usercart.products.findIndex(product => product.item == proid)
                if (proexist != -1) {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userid), "products.item": ObjectId(proid) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then((response) => {
                            
                            resolve(response)
                        })
                } else {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userid) },

                            {
                                $push: { products: proobj }
                            }

                        ).then((response) => {
                            resolve(response)
                        })
                }

            } else {

                let cartobj = {
                    user: ObjectId(userid),
                    products: [proobj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve(response)
                })
            }
        })
    },


    //buing the product by clicking buynow
    buytocart: (proid, userid) => {
        let proobj = {
            item: ObjectId(proid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let usercart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userid) })
            if (usercart) {
                let proexist = usercart.products.findIndex(product => product.item == proid)        
                if (proexist != -1) {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userid), "products.item": ObjectId(proid) },
                            {
                                $inc: { 'products.$.quantity': 0 }
                            }
                        ).then((response) => {
                            resolve(response)
                        })
                } else {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userid) },

                            {
                                $push: { products: proobj }
                            }

                        ).then((response) => {
                            resolve(response)
                        })
                }

            } else {

                let cartobj = {
                    user: ObjectId(userid),
                    products: [proobj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve(response)
                })
            }
        })
    },


    //getting cart product
    getcartproduct: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cartitems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userid) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: 1,
                        total: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.price', to: 'int' } }] } }

                    }
                }
            ]).toArray()
            resolve(cartitems)
 
        })
    },



    getcartproductall: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cartitems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userid) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: 1,
                        total: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.price', to: 'int' } }] } }

                    }
                }
            ]).toArray()
            resolve(cartitems)
            console.log(cartitems)
        })
    },

    // getsubtotal:(userid,proid)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let subtotal=await db.get().collection(collections.CART_COLLECTION).aggregate([
    //             {
    //                 $match:{
    //                     user:ObjectId(userid)
    //                 }
    //             },
    //             {
    //                 $unwind:'$products'
    //             },
    //             {
    //                 $project:{ 
    //                     item:'$products.item',
    //                     quantity:'$products.quantity'
    //                 }
    //             },
    //             {
    //                 $lookup:{
    //                     from:collections.PRODUCT_COLLECTION,
    //                     localField:'item',
    //                     foreignField:'_id',
    //                     as:'products'
    //                 }
    //             },
    //             {
    //                 $match:{
    //                     item:ObjectId(proid)
    //                 }
    //             },
    //             {
    //                 $project:{
    //                     item:1,
    //                     quantity:1,
    //                     product:{$arrayElemAt:['$products',0]}
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     unitprice:{$toInt:'$product.price'},
    //                     quantity:{$toInt:'$quantity'}
    //                 }
    //             },
    //             {
    //                 $project:{
    //                     _id:null,
    //                     subtotal: {$sum :{$multiply: ['$quantity','$unitprice']}}
    //                 }
    //             }
    //         ]).toArray()
    //         if(subtotal.length>0){
    //             db.get().collection(collections.CART_COLLECTION).updateOne({user:ObjectId(userid),"products.item":ObjectId(proid)},
    //             {
    //                 $set:{
    //                     'products.$.subtotal':subtotal[0].subtotal
    //                 }
    //             }).then((response)=>{
    //                 console.log(subtotal[0].subtotal)
    //                 resolve(subtotal[0].subtotal)
    //             })
    //         }else{
    //             subtotal=0
    //             console.log(subtotal)
    //             resolve(subtotal)
    //         }
    //     })
    // },


    //to get all product
    getallproducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    // getting the cart of count
    getcartcount: (userid) => {
        let count = 0
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userid) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    //changing the product quantity
    changeproductquantity: (details) => {
        details.count = count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeproduct: true })
                    })
            } else {


                db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(details.cart), "products.item": ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },
    //checking the user it is already exit
    Checkuser: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let exists = false
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ number: userdata })
            if (user) {
                exists = true
            }
            resolve(exists)
        })
    },

    // total amount of cart
    gettotalamount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userid) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
                    }
                }

            ]).toArray()
            resolve(total[0].total)
        })
    },

    //taking the detail of product
    productdetail: (prodetail) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: ObjectId(prodetail) })
            
            let offercatagory=await db.get().collection(collections.OFFER_COLLECTION).findOne({type:detail.catagaries})
                resolve(detail)
        })

    },

    //ordering a product and adding to the order collection and removing the item from cart after ordering
    placeorder: (order, products, total, paymentmethod) => {
        return new Promise((resolve, reject) => {

            let status = 'placed'

            let dateIso = new Date()
            let orderObj = {
                userid:order[0]._id,
                firstname:order[0].address.firstname,
                lastname: order[0].address.lastname,
                email: order[0].address.email,
                number: order[0].address.number,
                house: order[0].address.house,
                address: order[0].address.address,
                state: order[0].address.state,
                city: order[0].address.city,
                postcode: order[0].address.postcode,                   
                useraddressid: ObjectId(order.userid),
                paymentmethod: paymentmethod,
                products: products,
                totalamount: total,
                status: status,
                date: dateIso
            }
            if(paymentmethod==="cod"){
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collections.CART_COLLECTION).removeOne({ user: ObjectId(order[0].address.userid) })
                resolve(response.ops[0]._id)
            })
        }else if(paymentmethod=="online"){
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                resolve(response.ops[0]._id)
            })
        }else{
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                resolve(response.ops[0]._id)
            })
        }

        })

    },

    //getting the ordered product detail
    getcartproductdetail: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userid)})
            resolve(cart)
        })
    },


    //checking the user it is already exist or not when the time of login
    CheckUsernologin: (userData) => {
        console.log('function started')
        return new Promise(async (resolve, reject) => {
            console.log(userData);
            let exists = false
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ number: userData })
            console.log(user);
            if (user) {
                exists = true
            }
            resolve(exists)
        })
    },

    //otp login
    otpLogin: (phnone) => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ number: phnone })

            resolve(user)
        })
    },

    //removing the item from cart
    removecartitem: (proid,cartid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CART_COLLECTION).updateOne({ _id: ObjectId(cartid) },
                {
                    $pull: { products: { item: ObjectId(proid) } }

                }).then((response) => {
                    resolve(true)

                })
        })
    },


    //order history
    orderhistory: (userids) => {
        return new Promise(async (resolve, reject) => {
            
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: {userid: ObjectId(userids) }
                },
                {
                    $unwind: "$products"
                }
            ]).toArray()
            console.log(orders)
            resolve(orders)
        })
    },


    //order history 
    getorderproducts: (orderid,userids) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: {userid: ObjectId(userids) }
                },
    
                {
                    $unwind: "$products"
                },
                {
                    $unwind: "$products.products"
                },
                {
                    $lookup:
                    {
                        from: collections.PRODUCT_COLLECTION,
                        localField: "products.products.item",
                        foreignField: "_id",
                        as: "orderProduct"
                    }
                },
                {
                    $unwind: "$orderProduct"
                },
                {
                    $match:{
                        _id:ObjectId(orderid)
                    }
                }
            ]).toArray()
            console.log(orders)
            resolve(orders)
        })
    },

    //adding item to wishlist
    addtowishlist: (proid, userid) => {
        return new Promise(async (resolve, reject) => {
            let wishobj = {
                item: ObjectId(proid)
            }
            let userwishlist = await db.get().collection(collections.WISHLIST_COLLECTION).findOne({ user: ObjectId(userid) })
            if (userwishlist) {
                let proexist = userwishlist.items.findIndex(element => element.item == proid)
                console.log(proexist)
                if (proexist != -1) {
                    console.log(ObjectId(userid))
                    db.get().collection(collections.WISHLIST_COLLECTION)
                        .updateOne({ user: ObjectId(userid) },
                            {
                                $pull: { items: { item: ObjectId(proid) } }
                            }).then((response)=>{
                                response.productpresent=true
                                resolve(response)
                            })

                } else {
                    db.get().collection(collections.WISHLIST_COLLECTION)
                        .updateOne({ user: ObjectId(userid) }, {
                            $push: { items: { item: ObjectId(proid) } }
                        }).then((response)=>{
                            response.productpresent=false
                            resolve(response)
                        })
                }
            } else {
                let whishobj = {
                    user: ObjectId(userid),
                    items: [wishobj]
                }
                db.get().collection(collections.WISHLIST_COLLECTION).insertOne(whishobj).then((response) => {
                    response.productpresent=false
                    resolve(response)
                })
            }
        })
    },
    //all item of wishlist
    getwishlist: (userid) => {
        return new Promise(async (resolve, reject) => {
            let wishitem = await db.get().collection(collections.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userid) }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'items.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                }
            ]).toArray()
            resolve(wishitem)
            console.log(wishitem)
        })
    },

    //removing item from wishlist
    removewishlistitem: (proid, wishlistid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.WISHLIST_COLLECTION)
                .updateOne({ _id: ObjectId(wishlistid) }, {
                    $pull: { items: { item: ObjectId(proid) } }
                }).then((response) => {
                    resolve({ removewishlist: true })
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

    //getting the profile of user
    getprofile: (userid) => {
        return new Promise(async (resolve, reject) => {
            let profile = await db.get().collection(collections.USER_COLLECTION).find({ _id: ObjectId(userid._id) }).toArray()
            resolve(profile)
            console.log(profile)
        })
    },

    //getting the edit page of profile
    getprofileedit: (userid) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.USER_COLLECTION).find({ _id: ObjectId(userid) }).sort({ $natural: -1 }).toArray()
            resolve(detail)
        })
    },

    //updating the new porfile
    seteditprofile: (userid, profdata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION)
                .updateOne({ _id: ObjectId(userid) },
                    {
                        $set: {
                            firstname: profdata.firstname,
                            lastname: profdata.lastname,
                            email: profdata.email,
                            number: profdata.number
                        }

                    }).then(() => {
                        resolve(userid)
                    })
        })
    },

//adding new address
    addressadd: (detail) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(detail.userid) })
            detail._id = ObjectId()
            if (user.address) {
                db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(detail.userid) },
                    {
                        $push: {
                            address: detail
                        }
                    }).then(() => {
                        resolve()
                    })
            } else {
                adre = [detail]
                db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(detail.userid) },
                    {
                        $set: {
                            address: adre
                        }
                    }).then((user) => {
                        resolve(user)
                    })
            }
        })
    },

    //razopay payment 
    generaterazorpay: (orderid, total) => {
        return new Promise((resolve, reject) => {

            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderid
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("new order:", order)
                    resolve(order)
                }
            })
        })
    },



verifyPayment: (data) => {
    console.log("helo1")
    console.log(data)
    return new Promise(async (resolve, reject) => {
      let orderid = data['order[receipt]']
      console.log("hai this is this" + orderid)
      let userid = await db.get().collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(orderid) }
          },
          {
            $project: { userid: 1, _id: 0 }
          }
        ]).toArray()
      let id = []
      for (x of userid) {
        id.push(x.userid)
      }
      let ID = id.toString()
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'cfuW9vlvkRYBgEua1c5A9JX4')
      hmac.update(data['payment[razorpay_order_id]'] + '|' + data['payment[razorpay_payment_id]']);
      hmac = hmac.digest('hex')
      if (hmac == data['payment[razorpay_signature]']) {
        await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: ObjectId(ID) }).then((response) => {
          resolve()
        })
      } else {
        db.get().collection(collections.ORDER_COLLECTION)
          .updateOne({ _id: ObjectId(orderid) },
            {
              $set: {
                Status: "payment failed"
              }
            }).then((response) => {
              reject()
            })
      }
    })
  },

   //changing payment status
    changepaymentstatus: (orderid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION)
                .updateOne({ _id: ObjectId(orderid) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },

    changepassword: (detail, userid) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userid) })
            console.log(user)
            console.log(detail.password)
            console.log(detail.currentpassword);
            if (user) {
                bcrypt.compare(detail.currentpassword, user.password).then(async (status) => {
                    if (status) {
                        detail.password = await bcrypt.hash(detail.password, 10)

                        db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userid) },
                            {
                                $set: {
                                    password: detail.password
                                }
                            })
                    } else {
                        console.log('failed')
                    }
                })
            } else {
                console.log('login failed')
            }
            resolve()
        })



    },
    addresscheck: (userid) => {
        return new Promise(async (resolve, reject) => {
            let status = {}
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userid) })
            if (user.address) {
                status.address = true
            }
            resolve(status)
        })
    },

    getuseraddress: (userid) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userid) })
            let address = user.address
            resolve(address)
        })
    },


    geteditoneaddress: (detail, userid) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: ObjectId(userid)
                    }
                },
                {
                    $unwind: "$address"
                },
                {
                    $match: {
                        "address._id": ObjectId(detail)
                    }
                },
                {
                    $project: {
                        address: 1,
                        _id: 0
                    }
                }
            ]).toArray()
            resolve(address)
            console.log(address)
        })
    },

    geteditaddress: (data) => {
        console.log(data)
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(data.userid), "address._id": ObjectId(data._id) },
                {
                    $set: {
                        "address.$.firstname": data.firstName,
                        "address.$.lastname": data.lastName,
                        "address.$.house": data.house,
                        "address.$.address": data.address,
                        "address.$.city": data.city,
                        "address.$.postcode": data.postcode,
                        "address.$.number": data.number,
                        "address.$.email": data.email,
                        "address.$.state": data.state
                    }
                }).then((response) => {
                    resolve(response).toArray()
                    console.log(response)
                })
        })

    },

    //address deleting
    deleteaddress: (addid, userid) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).find({ _id: ObjectId(userid) })

            if (user) {
                db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userid) },
                    {
                        $pull: {
                            address: { _id: ObjectId(addid) }
                        }
                    }).then((response) => {
                        resolve(response)
                    })
            }
        })
    },

    //brand logo showing home page
    getbrandhome: () => {
        return new Promise(async (resolve, reject) => {
            let brand = await db.get().collection(collections.BRAND_COLLECTION).find().toArray()
            resolve(brand)
        })
    },

    
    getaddress: (data, userid) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: ObjectId(userid)
                    }
                },
                {
                    $unwind: "$address"
                },
                {
                    $match: {
                        "address._id": ObjectId(data)
                    }
                },
                {
                    $project: {
                        address: 1,
                        _id: 1
                    }
                }
            ]).toArray()
            resolve(address)
            console.log(address)
        })
    },

    //cancelling the order 
    cancelorder:(orderid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
            {
                $set:{
                    status:'cancelled',
                    cancelled:true

                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },

    //getting all catagory name in home page
    getcatagory:()=>{
        return new Promise(async(resolve,reject)=>{
        let catagory=await db.get().collection(collections.CATAGORY_COLLECTION).find().toArray()
        resolve(catagory)
        })
        
    },

    //getting all catagory products
    getcatagoryproduct:(cat)=>{
        return new Promise(async(resolve,reject)=>{
         let catagory=await   db.get().collection(collections.PRODUCT_COLLECTION).find({catagaries:cat}).toArray()
            resolve(catagory)
        })
    },
  
    //getting all brand products
    getbrandproduct:(brandname)=>{
        return new Promise(async(resolve,reject)=>{
            let brands=await db.get().collection(collections.PRODUCT_COLLECTION).find({brand:brandname}).toArray()
            resolve(brands)
        
        })
    },

    //checking the coupen is valid
    checkcoupen:(coupen)=>{
        return new Promise(async(resolve,reject)=>{
            let checkcoupens=await db.get().collection(collections.COUPEN_COLLECTION).find({name:(coupen)})
            resolve(checkcoupens)
        })
    },

    //taking the value of coupen
     getcoupenvalue:(coupen)=>{
         return new Promise(async(resolve,reject)=>{
             let checkcoupenvalue=await db.get().collection(collections.COUPEN_COLLECTION).aggregate([
                 {
                     $match:{
                         name:(coupen)
                     }
                 },
                 {
                     $project:{
                         _id:0,
                         value:1
                     }
                 }
             ]).toArray()
             resolve(checkcoupenvalue[0].value)
             

         })
     },


     usedcoupen:(coupen,userid)=>{
         return new Promise(async(resolve,reject)=>{
             let usedcoupen=await db.get().collection(collections.USER_COLLECTION).findOne({_id:ObjectId(userid)})
             
             if(usedcoupen.usedcoupens){
                 db.get().collection(collections.USER_COLLECTION).updateOne({_id:ObjectId(userid)},
                 {
                     $push:{
                         usedcoupens:coupen
                     }
                 }).then(()=>{
                     resolve()
                 })
             }else{
                 db.get().collection(collections.USER_COLLECTION).updateOne({_id:ObjectId(userid)},
                 {
                     $set:{
                         usedcoupens:[coupen]
                     }
                 }).then((usedcoupen)=>{
                     resolve(usedcoupen)
                 })
             }
         })
     },

     checkusecoupen:(coupen,userid)=>{
         return new Promise(async(resolve,reject)=>{
            let checkingcoupen= await db.get().collection(collections.USER_COLLECTION).findOne({_id:ObjectId(userid),usedcoupens:{$elemMatch:{$eq:coupen}}})
            if(checkingcoupen){
                valid=true
                resolve(valid)
            }else{
                valid=false
                resolve(valid)
            }
         })
     },


     findProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
          let user = await db.get().collection(collections.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
          let productId = []
          if (user) {
            for (x of user.items) {
              productId.push(x.item)
            }
            resolve(productId)
    
          } else {
            console.log("user not found")
            resolve()
          }
        })
      },

      //taking sub catagory
      getsubcatagory:()=>{
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
          
      } ,

      //paypal clear cart
      clearcart:(userid)=>{
          return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: ObjectId(userid) }).then((response) => {
                resolve()
              })
          })
      },
      getsubcatagorys:(name)=>{
          return new Promise(async(resolve,reject)=>{
              let subcatagory=await db.get().collection(collections.PRODUCT_COLLECTION).find({subcatagory:name}).toArray()
              resolve(subcatagory)
          })
      },

      getallcolors:()=>{
          return new Promise(async(resolve,reject)=>{
              let allcolors=await db.get().collection(collections.PRODUCT_COLLECTION).find().project({color:1,_id:0}).toArray()
              let colours=[]
              for(x of allcolors){
                  if(!colours.includes(x.color)){
                    colours.push(x.color)
                  }
              }
              resolve(colours)
          })
      },

      //sorting by color
      getcolorsort:(type,color)=>{
          return new Promise(async(resolve,reject)=>{
              let getcolorproduct=await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                  {
                      $match:{
                          color:color
                      }
                  },
                  {
                    $match: {
                      $or:[
                        {'brand':type},
                        {'catagaries':type},
                        {'subcatagory':type}
                      ]
                    }
                  }
                  
              ]).toArray()
             resolve(getcolorproduct)
             

          })
      },

      //sorting by alaphbatic
      getallsorta:(type)=>{
          return new Promise(async(resolve,reject)=>{
              let sortbyalph=await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([

                {
                    $match: {
                      $or:[
                        {'brand':type},
                        {'catagaries':type},
                        {'subcatagory':type}
                      ]
                    }
                  },
                  {
                      $sort:{
                          name:1
                      }
                  }

              ]).toArray()
              resolve(sortbyalph)
            
          })
      },


      //sorting by alphabatic in z to a

      getallsortaz:(type)=>{
        return new Promise(async(resolve,reject)=>{
            let sortbyalph=await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([

              {
                  $match: {
                    $or:[
                      {'brand':type},
                      {'catagaries':type},
                      {'subcatagory':type}
                    ]
                  }
                },
                {
                    $sort:{
                        name:-1
                    }
                }

            ]).toArray()
            resolve(sortbyalph)
          
        })
    },


    //sorting by number 1 to 99
    getallsortao:(type)=>{
        return new Promise(async(resolve,reject)=>{
            let sortbyalph=await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([

              {
                  $match: {
                    $or:[
                      {'brand':type},
                      {'catagaries':type},
                      {'subcatagory':type}
                    ]
                  }
                },
                {
                    $sort:{
                        price:1
                    }
                }

            ]).toArray()
            resolve(sortbyalph)
          
        })
    },

    //sorting number by 99 to 1
    getallsortah:(type)=>{
        return new Promise(async(resolve,reject)=>{
            let sortbyalph=await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([

              {
                  $match: {
                    $or:[
                      {'brand':type},
                      {'catagaries':type},
                      {'subcatagory':type}
                    ]
                  }
                },
                {
                    $sort:{
                        price:-1
                    }
                }

            ]).toArray()
            resolve(sortbyalph)
          
        })
    },

      //search products
      getsearchproduct:(data)=>{ 
          return new Promise(async(resolve,reject)=>{
              let searchproduct=await db.get().collection(collections.PRODUCT_COLLECTION).find({name:{$regex:"."+data+"." , $options: 'is'}}).toArray()
              resolve(searchproduct)
            
          })
      }



      //updating the stock
//       updatestock:(orderid)=>{
//           return new Promise(async(resolve,reject)=>{
//              let stockchange=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
//                   {
//                       $match:{_id:ObjectId(orderid)}
//                   },
//                   {
//                       $unwind:"$products.products"
//                   },
//                   {
//                     $project: {
//                         item: '$products.item',
//                         quantity: '$products.quantity'
//                     }
//                 },
//                 {
//                         $lookup: {
//                             from: collections.PRODUCT_COLLECTION,
//                             localField: 'item',
//                             foreignField: '_id',
//                             as: 'products'
//                         }
//                 },
//                 {
//                     $unwind:"$products"
//                 },
//                 {
//                     $project: {
//                         item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] },
//                         newQty: { $subtract: [{ $arrayElemAt: ['$products.stock', 0] }, '$quantity'] }
//                     }
//                 }
//               ]).toArray()
//               let proLen = stockchange.length
//               console.log("")
//               for (let i = 0; i < proLen; i++) {
//                   let itemMain = stockchange[i]
//                   db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(itemMain.item) }, {
//                       $set: {
//                           stock: itemMain.newQty
//                       }
//                   })
//                   if (itemMain.newQty < 1) {
//                       db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(itemMain.item) }, {
//                           $set: {
//                               stockout: true
//                           }
//                       })
//                   } else {
//                       db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(itemMain.item) }, {
//                           $unset: {
//                               stockout: ""
//                           }
//                       })
//                   }
//               }
// console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")
// console.log(stockchange)
// console.log("llllllllllllllllllllllllllllllllllllllllllllll")
//                   resolve(stockchange)
//           })
//       }
      
    }
