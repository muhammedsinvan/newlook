const { json } = require('express')
const { response } = require('express');
var express = require('express');
var router = express.Router();
const moment = require('moment')
const paypal = require('paypal-rest-sdk');
var { ObjectId } = require('mongodb').ObjectID
var adminhelper = require('../helpers/admin-helpers');
var userhelper = require('../helpers/user-helpers');

//otp twilio
const serviceid = "VA263769e4770757a6e87452d131f90b42"
const accoundsid = "ACcda0e78b1722b862a19e21c127c93e85"
const authtoken = "ae8f69933c5a8d17f2b22cef41956e6a"
const client = require('twilio')(accoundsid, authtoken)


//papal config
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AffQOet64ucC_wf844tRGvDeammER3DW5FbmnqS_N1Y7XYhal_RmOHoe7n1us3icMJoMp74BXq9z-bFt',
  'client_secret': 'ENUNHk2nKwjRX6bl2gUrwMjHd4CtO6Bgt4ltNWUeBQ6RS26beboAq-Q5iEx8KCtHcwwhYVxiGpa5QvbC'
});

let signup_body = {}


//checking login
const verifylogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/', async function (req, res, next) {
  user = req.session.user
  let cartcount = null
  if (req.session.user) {
    cartcount = await userhelper.getcartcount(req.session.user._id)
  }
  userhelper.getcatagory().then((catagory) => {
    userhelper.getbrandhome().then((brand) => {
      userhelper.getbanner().then((banner) => {
        userhelper.getallproducts().then((products) => {
          res.render('user/home', { layout: 'user/user', products, cartcount, user, banner, brand, catagory });
        })
      })
    })
  })
})


//login page
router.get('/user/login', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { layout: 'user/user', login: true, loginErr: req.session.loginErr })
    req.session.loginErr = false
  }
})

//signup page
router.get('/user/signup', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/signup', { layout: 'user/user', login: true, userExists: req.session.userExists })
    req.session.userExists = false
  }
})

//otp page
router.get('/user/otp', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/otp', { layout: 'user/user', login: true, errorsignup: req.session.errorsignup })
    req.session.errorsignup = false
  }
})

//posting signup page
router.post('/signup', (req, res, next) => {

  signup_body = req.body
  userhelper.Checkuser(req.body.number).then((response => {
    if (response) {
      req.session.userExists = true;
      res.redirect("/user/signup");
    } else {
      client.verify.services(serviceid).verifications.create({
        to: `+91${req.body.number}`,
        channel: "sms"

      })
        .then((response) => {
          console.log(response)
        })
      console.log(signup_body)
      res.redirect('/user/otp')
    }
  })

  )
})


//otp verification
router.post('/otp', ((req, res) => {
  let { otp } = req.body
  otp = otp.join("")
  console.log("otp: :" + otp)
  client.verify.services(serviceid).verificationChecks.create({
    to: `+91${signup_body.number}`,
    code: otp
  }).then((response) => {

    if (response.valid) {
      userhelper.dosignup(signup_body).then((response) => {
        req.session.userloggedIn = true
        req.session.user = response.user
        res.redirect('/')
      })
    } else {
      req.session.errorsignup = true
      res.redirect('/user/otp')

    }
  })

}))

//login with registered email and password
router.post('/login', (req, res) => {
  userhelper.getlogin(req.body).then((response) => {
    console.log(response);
    if (response.status) {
      if (response.user.permission) {
        req.session.userloggedIn = true
        req.session.user = response.user
        res.redirect('/')
      } else {
        req.session.blockErr = true
        res.redirect('/user/login')
      }
    } else {
      req.session.loginErr = true
      res.redirect('/user/login')
    }
  })
})


//cart page
router.get('/cart', verifylogin, async (req, res) => {
  catagory = await userhelper.getcatagory()
  cartcount = await userhelper.getcartcount(req.session.user._id)
  let products = await userhelper.getcartproduct(req.session.user._id)
  userhelper.getcatagory().then(async (catagory) => {
    let totalvalue = 0
    if (products.length > 0) {
      totalvalue = await userhelper.gettotalamount(req.session.user._id)
      newcarttotal = req.session.newcartamount
      usedcoupen = req.session.coupenused
      coupenvalue = req.session.coupenvalue
      newcartamount = true
      req.session.coupenused = true
      coupeninvalid = req.session.coupeninvalid
      res.render('user/cart', { layout: 'user/user', products, user: req.session.user._id, totalvalue, cartcount, catagory, newcarttotal, usedcoupen, coupenvalue, coupeninvalid })
      req.session.coupeninvalid = false
      newcartamount = false
      req.session.coupenused = false
      req.session.coupenvalue = false
    } else {
      console.log(products.products)
      res.render('user/emptycart', { layout: 'user/user', user: req.session.user._id, cartcount, catagory })
    }
  })
})


//adding product to cart
router.get('/add-to-cart/:id', (req, res) => {
  if (req.session.user) {
    userhelper.addtocart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true, user: true })
    })
  } else {
    res.json({ user: false })
  }
})

//buying product by clicking buynow
router.get('/go-to-cart-detail/:id', (req, res) => {
  userhelper.buytocart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

//count of quantity
router.post('/change-product-quantity', (req, res, next) => {

  userhelper.changeproductquantity(req.body).then(async (response) => {
    response.total = await userhelper.gettotalamount(req.body.user)
    res.json(response)
  })
})


//detail of a product
router.get('/productdetail/:id', async (req, res) => {
  if (req.session.user) {
    catagory = await userhelper.getcatagory()
    cartcount = await userhelper.getcartcount(req.session.user._id)
    let detail = await userhelper.productdetail(req.params.id)
    res.render('user/detail', { layout: 'user/user', detail, user: req.session.user, cartcount, catagory })
  } else {
    catagory = await userhelper.getcatagory()
    let detail = await userhelper.productdetail(req.params.id)
    res.render('user/detail', { layout: 'user/user', detail, catagory })
  }

})



//place order page
router.get('/checkout', async (req, res) => {
  catagory = await userhelper.getcatagory()
  cartcount = await userhelper.getcartcount(req.session.user._id)
  let products = await userhelper.getcartproductall(req.session.user._id)
  let totalamount = await userhelper.gettotalamount(req.session.user._id)
  address = null
  let status = await userhelper.addresscheck(req.session.user._id)
  if (status.address) {
    let addre = await userhelper.getuseraddress(req.session.user._id)
    address = addre
  }
  if (req.session.newcartamount) {
    total = req.session.newcartamount;
  } else {
    total = totalamount
  }
  res.render('user/placeorder', { layout: 'user/user', total, user: req.session.user, products, address, catagory, cartcount })
})

//posting the data of place order
router.post('/checkout', async (req, res) => {
  let address = await userhelper.getaddress(req.body.address2, req.session.user._id)
  let products = await userhelper.getcartproductdetail(req.session.user._id)
  let totalprice = await userhelper.gettotalamount(req.session.user._id)
  if (req.session.newcartamount) {
    total = req.session.newcartamount
  } else {
    req.session.total = totalprice
  }
  userhelper.placeorder(address, products, total, req.body.paymentmethod).then((orderid) => {
    if (req.body['paymentmethod'] === "cod") {
      req.session.newcartamount = null
      userhelper.usedcoupen(req.session.coupen, req.session.user._id).then(() => {
        res.json({ codsuccess: true })
      })
    } else if (req.body['paymentmethod'] === "online") {
      userhelper.generaterazorpay(orderid, total).then((response) => {
        userhelper.usedcoupen(req.session.coupen, req.session.user._id).then(() => {
          req.session.newcartamount = null
          res.json({ response: response, RazorpaySuccess: true })
        })
      })
    } else if (req.body['paymentmethod'] === "paypal") {

      val = total / 74
      total = val.toFixed(2)
      totals = total.toString()
      var create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "https://www.newlookcom.xyz/success",
          "cancel_url": "https://www.newlookcom.xyz/cancel"
        },
        "transactions": [{
          "item_list": {
            "items": [{

              "name": "cart Products",
              "sku": "001",
              "price": totals,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": totals
          },
          "description": "Payment description"
        }]
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            console.log(payment.links)
            if (payment.links[i].rel === 'approval_url') {
              let url = payment.links[i].href
              res.json({ url })

            } else {
              console.log("faileded")
            }
          }
        }
      });
    } else {
      console.log("paypal failed")
    }
  })
})

//rendreing the success page paypal
router.get('/success', (req, res) => {
  let val = req.session.total
  val = val / 74
  let total = val.toFixed(2)
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": total

      }
    }]
  };
  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      userhelper.clearcart(req.session.user._id).then(() => {
      })
      userhelper.usedcoupen(req.session.coupen, req.session.user._id).then(() => {
        req.session.newcartamount = null
        res.redirect('/sucess');
      })
    }

  });
});

//cancel page of papal
router.get('/cancel', (req, res) => {
  res.redirect('/user/checkout')
})

//sucess page of order
router.get('/sucess', async (req, res) => {
  cartcount = await userhelper.getcartcount(req.session.user._id)
  res.render('user/order-sucess', { layout: 'user/user', cartcount })
})



//login number page
router.get('/phonelogin', (req, res) => {
  res.render('user/phone-login', { layout: 'user/user', login: true, loginErrotp: req.session.loginErrotp })
  req.session.loginErrotp = false
})


//login otp pagereq.session.otperror=true
router.get('/otplogin', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/otp-login', { layout: 'user/user', login: true, otperrorone: req.session.otperrorone })
    req.session.otperrorone = false
  }
})


//posting the login with otp number
router.post("/loginphonenumber", (req, res, next) => {
  signup_body = req.body;
  userhelper.CheckUsernologin(req.body.number).then((response) => {
    if (response) {
      client.verify
        .services(serviceid)
        .verifications.create({
          to: `+91${req.body.number}`,
          channel: "sms",
        })
        .then((response) => {
          console.log(response);
        });
      console.log(signup_body);
      res.redirect("/otplogin");
    } else {
      req.session.loginErrotp = true;
      res.redirect("/phonelogin");
    }
  });
});


//posting the login otp page
router.post("/otplogin", (req, res) => {
  let { otp } = req.body;
  otp = otp.join("");
  console.log(otp);
  client.verify
    .services(serviceid)
    .verificationChecks.create({
      to: `+91${signup_body.number}`,
      code: otp,
    })
    .then((response) => {
      console.log(response.valid);
      if (response.valid) {
        userhelper.otpLogin(signup_body.number).then((userData) => {
          req.session.user = userData
          req.session.userloggedIn = true
          res.redirect("/");
        })

      } else {
        req.session.otperrorone = true
        res.redirect("/otplogin");

      }
    });
});


//remove item from cart 
router.get('/removeitemcart/:proId/:cartId', (req, res) => {
  userhelper.removecartitem(req.params.proId, req.params.cartId).then((response) => {
    if (response) {
      res.json(true)
    }

  })
})


//order history 
router.get('/order-history', async (req, res) => {
  let catagory = await userhelper.getcatagory()
  let orderhistory = await userhelper.orderhistory(req.session.user._id)
  for (x of orderhistory) {
    x.date = moment(x.date).format('ll')
  }
  if (req.session.user) {
    cartcount = await userhelper.getcartcount(req.session.user._id)
    user = req.session.user
    res.render('user/orders', { layout: 'user/user', user: req.session.user, orderhistory, catagory, cartcount, user })
  }
  res.render('user/orders', { layout: 'user/user', user: req.session.user, orderhistory, catagory, cartcount })
})

//ordered product detail
router.get('/view-order-products/:id', async (req, res) => {
  let catagory = await userhelper.getcatagory()
  userhelper.getorderproducts(req.params.id, req.session.user._id).then(async (products) => {
    console.log(products)
    if (req.session.user) {
      user = req.session.user
      cartcount = await userhelper.getcartcount(req.session.user._id)
      res.render('user/orderproductdetail', { layout: 'user/user', user: req.session.user._id, products, catagory, cartcount, user })
    }
    res.render('user/orderproductdetail', { layout: 'user/user', user: req.session.user._id, products, catagory, cartcount })
  })
})

//deleting the item from order history
router.get('/cancel-order/:id', async (req, res) => {
  let cancelorder = await userhelper.cancelorder(req.params.id)
  res.redirect('/order-history')
})


//adding item to wishlist
router.get('/add-to-wishlist/:id', (req, res) => {
  if (req.session.user) {
    userhelper.addtowishlist(req.params.id, req.session.user._id).then((response) => {
      if (response.productpresent) {
        res.json({ status: true, user: true })

      } else {
        res.json({ status: false, user: true })
      }
    })
  } else {
    res.json({ user: false })
  }
})

//showing wishlist page
router.get('/wishlist', verifylogin, async (req, res) => {
  let catagory = await userhelper.getcatagory()
  cartcount = await userhelper.getcartcount(req.session.user._id)
  let allwishlist = await userhelper.getwishlist(req.session.user._id)

  if (allwishlist.length > 0) {
    res.render('user/wishlist', { layout: 'user/user', allwishlist, cartcount, catagory, user: req.session.user._id })
  } else {

    res.render('user/emptywishlist', { layout: 'user/user', allwishlist, catagory, cartcount })
  }
})

//removing item from wishlist
router.get('/removeitemwishlist', (req, res) => {
  userhelper.removewishlistitem(req.query.proid, req.query.cartid).then((response) => {
    res.redirect('/wishlist')
  })
})

//view profile
router.get('/profile', async (req, res) => {
  let profile = await userhelper.getprofile(req.session.user)
  let catagory = await userhelper.getcatagory()

  let cartcount = null
  let id = req.session.user._id
  cartcount = await userhelper.getcartcount(id)
  address = null
  let status = await userhelper.addresscheck(req.session.user._id)
  if (status.address) {
    let addre = await userhelper.getuseraddress(req.session.user._id)
    address = addre
  }
  res.render('user/profile', { layout: 'user/user', user: req.session.user._id, profile, cartcount, address, catagory })
})

//editig profile
router.get('/edit-profile/:id', (req, res) => {
  profileid = req.params.id
  userhelper.getprofileedit(profileid).then((prefileedit) => {
    res.render('user/editprofile', { layout: 'user/user', prefileedit })
  })
})


//posting the user profile
router.post('/editprofile/:id', (req, res) => {
  userhelper.seteditprofile(req.params.id, req.body).then((id) => {
    if (req.files) {
      let Image1 = req.files.image1
      Image1.mv('./public/product-images/' + id + '66.jpg', (err1, done) => {
        if (!err1) {
          res.redirect('/profile')
        } else {
          res.redirect('/profile')
        }
      })
    } else {
      res.redirect('/profile')
    }
  })
})





//sending the edit profile data
router.post('/edited-profile/:id', (req, res) => {
  userhelpers.seteditprofile(req.params.id, req.body).then((id) => {
    if (req.files) {
      let image = req.files.profileimage
      image.mv('./public/product-images/' + req.params.id + '66.jpg', (err1, done) => {
        if (!err1) {
          res.redirect('/myprofile')
        } else {
          res.redirect('/myprofile')
        }
      })
    } else {
      res.redirect('/myprofile')
    }
  })
})

//add new address form
router.get('/add-address', (req, res) => {
  user = req.session.user
  res.render('user/add-address', { layout: 'user/user', user })
})

//posting the address
router.post('/add-address', (req, res) => {
  console.log(req.body)
  userhelper.addressadd(req.body).then((response) => {
    res.redirect('/profile')
  })
})

//editing address
router.get('/edit-address/:id', async (req, res) => {
  let address = await userhelper.geteditoneaddress(req.params.id, req.session.user._id)
  res.render('user/edit-address', { layout: 'user/user', address })
})

//posting address form
router.post('/edit-address', (req, res) => {
  console.log(req.body)
  userhelper.geteditaddress(req.body).then((response) => {
    res.redirect('/profile')
  })
})

//delete address
router.get('/delete-address/:id', (req, res) => {
  userhelper.deleteaddress(req.params.id, req.session.user._id).then((response) => {
    res.redirect('/profile')
  })
})

//delete address in place order page
router.get('/delete-addressplace/:id', (req, res) => {
  userhelper.deleteaddress(req.params.id, req.session.user._id).then((response) => {
    res.redirect('/checkout')
  })
})

//getting add adress form placeorder
router.get('/add-addressplace', (req, res) => {
  user = req.session.user
  res.render('user/addressplace', { layout: 'user/user', user })
})

//adding address from place orderpage
router.post("/add-addressplace", (req, res) => {
  userhelper.addressadd(req.body).then((response) => {
    res.redirect('/checkout')
  })
})

//edit address place
router.get('/edit-addressplace/:id', async (req, res) => {
  let address = await userhelper.geteditoneaddress(req.params.id, req.session.user._id)
  res.render('user/edit-addressplace', { layout: 'user/user', address })
})

//posting edit address page placeorder
router.post('edit-addressplace', (req, res) => {
  userhelper.geteditaddress(req.body).then((response) => {
    res.redirect('/checkout')
  })
})

//verifying the payment
router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  userhelper.verifyPayment(req.body).then(() => {
    userhelper.changepaymentstatus(req.body['order[receipt]']).then(() => {
      console.log('payment sucessful')
      req.session.newcartamount = null
      res.json({ status: true })
    })

  }).catch((err) => {
    res.json({ status: false, errmsg: '' })
  })
})

//getting the password page
router.get('/edit-password/:id', (req, res) => {
  res.render('user/changepass', { layout: 'user/user' })
})

//posting the password form
router.post('/change-password', (req, res) => {
  userhelper.changepassword(req.body, req.session.user._id).then((response) => {
    res.redirect('/profile')
  })
})

//geting catagory wise product
router.get('/get-catagory-products/:name', async (req, res) => {
  let catagoryproduct = await userhelper.getcatagoryproduct(req.params.name)
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()
  if (req.session.user) {

    cartcount = await userhelper.getcartcount(req.session.user._id)
    res.render('user/mens', { layout: 'user/user', catagoryproduct, cartcount, subcatagorys, catagory, user: req.session.user._id, color, type: req.params.name })
  }
  res.render('user/mens', { layout: 'user/user', catagoryproduct, catagory, subcatagorys, color, type: req.params.name })

})


//getting brand products
router.get('/brand-products/:name', async (req, res) => {
  let brandproduct = await userhelper.getbrandproduct(req.params.name)
  let catagoryproduct = await userhelper.getcatagoryproduct(req.params.name)
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()

  console.log(req.params.name);

  if (req.session.user) {
    cartcount = await userhelper.getcartcount(req.session.user._id)
    res.render('user/brand', { layout: 'user/user', brandproduct, cartcount, subcatagorys, catagoryproduct, user: req.session.user._id, color, catagory, type: req.params.name })
  } else {
    res.render('user/brand', {
      layout: 'user/user', brandproduct, catagoryproduct, subcatagorys, color, catagory,
      type: req.params.name
    })
  }
})


//applying coupen
router.post('/applycoupen', async (req, res) => {
  totalamount = await userhelper.gettotalamount(req.session.user._id)
  validcoupen = await userhelper.checkcoupen(req.body)
  if (validcoupen) {
    checkusecoupen = await useverifyloginrhelper.checkusecoupen(req.body.coupon, req.session.user._id)
    if (checkusecoupen) {
      coupenused = true
      req.session.coupenused = coupenused
    } else {
      coupenvalue = await userhelper.getcoupenvalue(req.body.coupon)
      req.session.coupenvalue = coupenvalue
      sum = (totalamount * coupenvalue) / 100
      total = totalamount - sum
      req.session.newcartamount = total
      req.session.coupen = req.body.coupon
    }
  } else {
    req.session.coupeninvalid = validcoupen
    console.log(req.session.couponinvalid)
  }
  res.redirect('/cart')
})

//wishlist color change
router.get("/find-product-in-wishlist", async (req, res) => {
  if (req.session.user) {
    let proId = await userhelper.findProducts(req.session.user._id)
    console.log(proId)
    res.json(proId)
  }
})

//get subcatagory product
router.get('/get-subcatagory-products/:names', async (req, res) => {
  let subcatagory = await userhelper.getsubcatagorys(req.params.names)
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()
  if (req.session.user) {
    cartcount = await userhelper.getcartcount(req.session.user._id)
    res.render('user/subcatagorry', { layout: 'user/user', subcatagory, catagory, subcatagorys, color, cartcount, user: req.session.user._id, type: req.params.names })
  }
  res.render('user/subcatagorry', { layout: 'user/user', subcatagory, catagory, subcatagorys, color, type: req.params.names })
})

//color sorting
router.get('/color-product/:color/:type', async (req, res) => {
  colors = req.params.color
  type = req.params.type
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()
  colorsort = await userhelper.getcolorsort(type, colors)
  res.render('user/brand', { layout: 'user/user', colorsort, color, catagory, subcatagorys, type: req.params.type })
})


//sorting by a to z
router.get('/sort-producta/:type', async (req, res) => {
  type = req.params.type
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()
  let sortingalpha = await userhelper.getallsorta(type)
  res.render('user/brand', { layout: 'user/user', sortingalpha, color, catagory, subcatagorys, type: req.params.type })
})

//sorting by z to a
router.get('/sort-productz/:type', async (req, res) => {
  type = req.params.type
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()
  let sortingalpha = await userhelper.getallsortaz(type)
  res.render('user/brand', { layout: 'user/user', sortingalpha, color, catagory, subcatagorys, type: req.params.type })
})

//sorting by 1 to 99
router.get('/sort-producto/:type', async (req, res) => {
  type = req.params.type
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()
  let sortingalpha = await userhelper.getallsortao(type)
  res.render('user/brand', { layout: 'user/user', sortingalpha, color, catagory, subcatagorys, type: req.params.type })
})

//sorting by 99 to 1
router.get('/sort-producth/:type', async (req, res) => {
  type = req.params.type
  let subcatagorys = await userhelper.getsubcatagory()
  let catagory = await userhelper.getcatagory()
  let color = await userhelper.getallcolors()
  let sortingalpha = await userhelper.getallsortah(type)

  res.render('user/brand', { layout: 'user/user', sortingalpha, color, catagory, subcatagorys, type: req.params.type })
})


//searching products
router.get('/search-produts', async (req, res) => {
  let catagory = await userhelper.getcatagory()
  let search = await userhelper.getsearchproduct(req.query.search)
  user = req.session.user
  data = req.query.search
  if (search.length > 0) {
    res.render('user/search', { layout: 'user/user', search, catagory, user })
  } else {
    res.render('user/emptysearch', { layout: 'user/user', search, catagory, data, user })
  }
})


//logouting the user page and distroying the seccion
router.get('/logout', (req, res) => {
  req.session.user = false

  res.redirect('/')
})

module.exports = router

