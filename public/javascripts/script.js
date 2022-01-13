
   //adding elements to cart and adding the count on header
   function addtocart(proid){
        $.ajax({
            url:'/add-to-cart/'+proid,
            method:'get',
            success:(response)=>{
                if(response.user){
                if(response.status){
                    let count=$('#cart-count').html()
                    count=parseInt(count)+1
                    $("#cart-count").html(count)
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top',
                        showConfirmButton: false,
                        timer: 1000,
                        timerProgressBar: false,
                
                      })
                      
                      Toast.fire({
                        icon: 'success',
                        title: 'successfully added to cart'
                      })
                }
            }else{
                Swal.fire('Please login')
            }   
            }  
        })
    }



   //adding elements to cart and adding the count on header
   function addtowishlist(event,proid){
    $.ajax({
        url:'/add-to-wishlist/'+proid,
        method:'get',
        success:(response)=>{
            if(response.user){
            if(response.status){
                event.target.classList.remove( "icon","text-danger")
                // let count=$('#wishlist-count').html()
                // count=parseInt(count)+1
                // $("#wishlist-count").html(count)
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: false,
            
                  })
                  
                  Toast.fire({
                    icon: 'success',
                    title: 'Item added to wishlist'
                  })            
            }else{
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 1000,
                    timerProgressBar: false,
            
                  })
                  
                  Toast.fire({
                    icon: 'success',
                    title: 'Item removed from wishlist'
                  })
            }
        }else{
            Swal.fire('Please login')
        }
         
        }  
    })
}


function makepusrchase(){
    var deliveryaddress = document.querySelector('input[name ="address2" ]:checked').value;
    var paymentmethod = document.querySelector('input[name = "paymentmethod" ]:checked').value;


    $.ajax({
        url:'/checkout',
        data:{
            deliveryaddress,
            paymentmethod
        },
        method:'post',
        success:(response)=>{
            if(response.codsuccess){
                location.href="/sucess"
            }else{
                razorpaypayment(response)
            }
        }
    })
}



