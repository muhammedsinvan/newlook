var express = require('express');
var router = express.Router();
var adminhelper = require('../helpers/admin-helpers');
const Admin = require('mongodb/lib/admin');
var { ObjectId } = require('mongodb').ObjectID
const { response } = require('express');
const { getlog } = require('../helpers/admin-helpers');
const { registerHelper } = require('hbs');
const e = require('express');
const moment = require('moment')

// const AWS = require("aws-sdk")
// const KEY_ID = "AKIAQZAS56M6MCD5S7OF"
// const SECRE_KEY="GPXmrx9FOXm+PrD9TQlmIblbteCP6lp8FjvP2DVv"

// const BUCKET_NAME ="image1f11s";
// const s3 = new AWS.S3({
//     accessKeyId: KEY_ID,
//     secretAccessKey: SECRE_KEY,
// });

// const params = {
//     Bucket:BUCKET_NAME
// }

// s3.createBucket(params,(err,data)=>{
//     if(err){
//         console.log(err)
//     }
//     else{
//         console.log("Bucket created successfuly",data.Location)


//     }
// })


// const uploadfile = (filename) =>{
//     const fileContent = fs.readFileSync(filename);
//     const params = {
//         Bucket:BUCKET_NAME,
//         Key:'photo.jpg',
//         Body:fileContent,
//         ContentType:"image/JPG"
//     }
   
//     s3.upload(params,(err,data)=>{
//         if(err){
//             console.log(err)
//         }
//         else{
//             console.log("file upload successfully".data.location)
//         }
//     })


// }

//checking the admin
const verifylogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/admin')
  }
}

/* GET users listing. */
//login page of admin
router.get('/', async function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/admin/admin-home')
  } else {
    res.render('admin/admin-login', { 'loginErr': req.session.loginErr, layout: 'admin/admin', adminlogin: true });
    req.session.loginErr = false
    req.session.loggedIn = false
  }
});



//getting admin home page
router.get('/admin-home',verifylogin, async(req, res) => {
  let totalusers =await adminhelper.getallusers()
  let totalorders=await adminhelper.getallorders()
  let totalsale=await adminhelper.gettotalsales()
  let topbrand=await adminhelper.gettopthreebrand()

  let brandname=[]
  let brandcount=[]

  for(x of topbrand){
    brandname.push(x._id)
  }

  for(x of topbrand){
    brandcount.push(x.count)
  }

  let catagorysales=await adminhelper.getcatagorysales()

  let catagoryname=[]
  let catagorycount=[]

  for(x of catagorysales){
    catagoryname.push(x._id)
  }

  for(x of catagorysales){
    catagorycount.push(x.count)
  }

  let recenthistory =await adminhelper.getrecenthistory()

  for(x of recenthistory){
    x.date=moment(x.date).format('ll')
  }

  res.render('admin/admin-home', { layout: 'admin/admin' ,totalusers,totalorders,totalsale,topbrand,brandname,brandcount,catagorysales,catagoryname,catagorycount,recenthistory})
})

//posting login page to home page
router.post('/', (req, res) => {
  adminhelper.getlog(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/admin/admin-home')
    } else {
      res.redirect('/admin')
      req.session.loginErr = true
    }
  })
})


//showing the page of add product
router.get('/admin-addproduct', (req, res) => {
  adminhelper.getcatagory().then((catagory) => {
    adminhelper.getbrand().then((brand) => {
      res.render('admin/admin-addproduct', { layout: 'admin/admin', catagory, brand })
    })
  })

})


//viewing the the all product
router.get('/admin-allproduct', (req, res) => {
  adminhelper.getallproducts().then((products) => {
    res.render('admin/admin-allproduct', { layout: 'admin/admin', products })
  })

})


//Adding products
router.post('/admin-addproduct', (req, res) => {
  adminhelper.addproduct(req.body).then((id) => {
    console.log(req.files);
    let Image1 = req.files.image1
    let Image2 = req.files.image2
    let Image3 = req.files.image3
    let Image4 = req.files.image4

    //adding the four images of products

    Image1.mv('./public/product-images/' + id + '11.jpg', (err1, done) => {
      if (!err1) {
        Image2.mv('./public/product-images/' + id + '22.jpg', (err2, done) => {
          if (!err2) {
            Image3.mv('./public/product-images/' + id + '33.jpg', (err3, done) => {
              if (!err3) {
                Image4.mv('./public/product-images/' + id + '44.jpg', (err4, done) => {
                  if (!err4) {
                    res.redirect('/admin/admin-addproduct')
                  }
                })
              }
            })
          }
        })
      }
    })
  })
})


//to delete a product
router.get('/delete-product/:id', (req, res) => {
  let proid = req.params.id
  adminhelper.deleteproduct(proid).then((response) => {
    if(response){
      res.json(true)
    }
  })
})


//edit product
router.get('/admin-editproduct/:id', (req, res) => {
  adminhelper.getallproductsedit(req.params.id).then((product) => {
    adminhelper.getbrand().then((brand) => {
      adminhelper.getcatagory().then((catagory) => {
        res.render('admin/admin-editproduct', { layout: 'admin/admin', product, brand, catagory })
      })
    })
  })
})


//posting the page of edit product
router.post('/admin-editproduct/:id', (req, res) => {
  adminhelper.updateproduct(req.params.id, req.body).then((id) => {
    res.redirect('/admin/admin-allproduct')
    if (req.files.image1) {
      let image1 = req.files.image1
      image1.mv('./public/product-images/' + id + '11.jpg')
    }
     if (req.files.image2) {
      let image2 = req.files.image2
      image2.mv('./public/product-images/' + id + '22.jpg')
    } if (req.files.image3) {
      let image3 = req.files.image3
      image3.mv('./public/product-images/' + id + '33.jpg')
    } if (req.files.image4) {
      let image4 = req.files.image4
      image4.mv('./public/product-images/' + id + '44.jpg')
    }
  })
})

//view catagory page
router.get('/admin-addcatagory', (req, res) => {
  adminhelper.getcatagory().then((catagory) => {
    res.render('admin/admin-addcatagory', { layout: 'admin/admin', catagory })
  })

})

//adding the catagaries
router.post('/admin-addcatagory', (req, res) => {
  adminhelper.addcatagory(req.body).then((response) => {
    console.log(response)
    res.redirect('/admin/admin-addcatagory')
  })
})

//view brand page
router.get('/admin-viewbrand', (req, res) => {
  adminhelper.getbrand().then((brand) => {
    res.render('admin/admin-viewbrand', { layout: 'admin/admin', brand })
  })

})

//view addbrand
router.get('/admin-addbrand',(req,res)=>{
  res.render('admin/admin-addbrand',{layout:'admin/admin'})
})

//adding the brand 
router.post('/admin-addbrand', (req, res) => {
  adminhelper.addbrand(req.body).then((id) => {
    let image = req.files.logoimage
    if (req.files.logoimage) {
      image.mv('./public/product-images/' + id + '2.jpg', (err, done) => {
        if (!err) {
          res.redirect('/admin/admin-addbrand')
        } else {
          console.log('error')
        }
      })
    } else {
      res.redirect('admin/admin-addbrand')
    }

  })
})

//viewing all the details of user
router.get('/admin-userdetail', (req, res) => {
  adminhelper.getalldetail().then((details) => {
    res.render('admin/admin-userdetail', { layout: 'admin/admin', details })

  })
})

//blocking the user
router.get('/block-user/:id', (req, res) => {
  adminhelper.blockuser(req.params.id).then((response) => {
    res.redirect('/admin/admin-userdetail')
  })
})

//banner viewing page
router.get('/admin-banner', (req, res) => {
  adminhelper.getbanner().then((banner) => {
    res.render('admin/admin-banner', { layout: 'admin/admin', banner })
  })

})


//posting banner page
router.post('/add-banner', (req, res) => {
  adminhelper.addbanner(req.body).then((id) => {
    let image = req.files.bannerimage
    if (req.files.bannerimage) {
      image.mv('./public/product-images/' + id + '1.jpg', (err, done) => {
        if (!err) {
          res.redirect('/admin/admin-banner')
        } else {
          console.log('error')
        }
      })
    } else {
      res.redirect('/admin/admin-banner')
    }
  })
})

// //edting the banner
router.get('/edit-banner/:id', (req, res) => {
  proid = req.params.id
  adminhelper.geteditBanner(proid).then((product) => {

    res.render('admin/admin-editbanner', { layout: 'admin/admin', product })

  })
})

//deleting the banner
router.get('/delete-banner/:id', (req, res) => {
  proid = req.params.id
  adminhelper.deletebanner(proid).then((response) => {
    res.redirect('/admin/admin-banner')
  })
})

//editing page
router.post('/edit-banner/:id', (req, res) => {
  adminhelper.editBanner(req.params.id, req.body).then((response) => {
    res.redirect('/admin/admin-banner')
    let bannerImg = req.files.bannerImage
    if (req.files.bannerImage) {
      bannerImg.mv('./public/product-images/' + req.params.id + '1.jpg')
      if (!err) {
        res.redirect('/admin/admin-banner')
      } else {
        res.redirect('/admin/admin-banner')
      }
    } else {
      res.redirect('/admin/admin-banner')
    }
  })
})


//deleting brand
router.get('/delete-brand/:id', (req, res) => {
  brandid = req.params.id
  adminhelper.deletebrand(brandid).then((response) => {
    res.redirect('/admin/admin-viewbrand')
  })
})

//delteting the catagory
router.get('/delete-catagory/:id',(req,res)=>{
  catid=req.params.id
  adminhelper.deletecatagory(catid).then((response)=>{
    res.redirect('/admin/admin-addcatagory')
  })
})


//all orders
router.get('/order-history', async (req, res) => {
  let history = await adminhelper.allorder()
  for(x of history){
    x.date=moment(x.date).format('ll')
  }
  res.render('admin/admin-allorders', { layout: 'admin/admin', history })
})


//change order status

router.get("/placed/:id", (req, res) => {
  status = "placed"
  adminhelper.changeorderstatus(req.params.id, status).then(() => {
    res.redirect('/admin/order-history')
  })
})

router.get("/shipped/:id", (req, res) => {
  status = "shipped"
  adminhelper.changeorderstatus(req.params.id, status).then(() => {
    res.redirect('/admin/order-history')
  })
})


router.get("/delivered/:id", (req, res) => {
  status = "delivered"
  adminhelper.changeorderstatus(req.params.id, status).then(() => {
    res.redirect('/admin/order-history')
  })
})

router.get("/cancelled/:id", (req, res) => {
  status = "cancelled"
  adminhelper.changeorderstatus(req.params.id, status).then(() => {
    res.redirect('/admin/order-history')
  })
})


//getting add offer page
router.get('/admin-offercat',async (req, res) => {
  let subcatagory=await adminhelper. getallsubcatagory()
  let catagory=await adminhelper.getcatagory()
  res.render('admin/admin-offercat', { layout: 'admin/admin',catagory ,subcatagory})
})


//posting offer
router.post('/add-offer',(req,res)=>{
  adminhelper.addoffer(req.body).then((response)=>{
    res.redirect('/admin/admin-offercat')
  })
})


//deletting the offer
router.get('/offer-catagory/:id',(req,res)=>{
  adminhelper.deleteoffer(req.params.id).then((response)=>{
    res.redirect('/admin/admin-viewoffercat')
  })
})


//viewing offer page
router.get('/admin-viewoffercat',async(req,res)=>{
  let alloffer=await adminhelper.getalloffer()
  for(x of alloffer ){
    x.enddate=moment(x.enddate).format('ll')
  }
  res.render('admin/admin-viewoffercat',{layout:'admin/admin',alloffer})
})



//getting coupen page
router.get('/admin-coupen',(req,res)=>{
  res.render('admin/admin-addcoupen',{layout:'admin/admin'})
   })

//adding a coupen
router.post('/add-coupen',(req,res)=>{
  adminhelper.addcoupen(req.body).then(()=>{
    res.redirect('/admin/admin-coupen')
  })
})

//deleting the coupen
router.get('/delete-coupen/:id',(req,res)=>{
  adminhelper.deletecoupen(req.params.id).then((resolve)=>{
    res.redirect('/admin/admin-viewcoupen')
  })
})

//geting veiw coupenpage
router.get('/admin-viewcoupen',async(req,res)=>{
  let coupen =await adminhelper.getcoupen()
    for(x of coupen){
      x.enddate=moment(x.enddate).format('ll')
    }
  res.render('admin/admin-viewcoupen',{layout:'admin/admin',coupen})
})

//sales reprot
router.get('/salesreport',async(req,res)=>{
  let allsalesreport=await adminhelper.getallsalesreports()
  for(x of allsalesreport){
    x.date=moment(x.date).format('ll')
  }
  res.render('admin/admin-salesreport',{layout:'admin/admin',allsalesreport})
})

//getting the user report
router.get('/userreport',async(req,res)=>{
  let userreport=await adminhelper.getalluserreport()
  for(x of userreport){
    x.date=moment(x.date).format('ll')
  }
  res.render('admin/admin-userreprot',{layout:'admin/admin',userreport})
})

//sending date
router.post('/getdateproduct',async(req,res)=>{
  let from= req.body.startdate
  let to = req.body.enddate
  let allsalesreport=await adminhelper.getdatesalesreport(from,to)
  for(x of allsalesreport){
    x.date=moment(x.date).format('ll')
  }
  res.render('admin/admin-salesreport',{layout:'admin/admin',allsalesreport})
})


//stock report page
router.get('/stockreport',async(req,res)=>{
  let product=await adminhelper.getproductstock()
  res.render('admin/admin-stockreport',{layout:'admin/admin',product})
})

//adding product offer
router.post('/add-prooffer',(req,res)=>{
  adminhelper.addprooffer(req.body).then((proOfferExists)=>{
    res.redirect('/admin/add-offer')
  })
})

//viewing the product offer
router.get('/viewprooffer',async(req,res)=>{
let viewprooffers =await adminhelper.viewprooffer()
for(x of viewprooffers){
  x.enddate=moment(x.enddate).format('ll')
}

res.render('admin/admin-viewprooffer',{layout:'admin/admin',viewprooffers})
})

//viewing the add product offer page 
router.get('/add-offer',(req,res)=>{
  res.render('admin/admin-addprooffer',{layout:'admin/admin'})
})

//deleting the product Offer
router.get('/offer-product/:id',(req,res)=>{
  adminhelper.deleteprooffer(req.params.id).then((resolve)=>{
    res.redirect('/admin/viewprooffer')
  })
})

//logout of admin page
router.get('/admin-logout', (req, res) => {
  req.session.loggedIn=false
  res.redirect('/admin')
})


module.exports = router;