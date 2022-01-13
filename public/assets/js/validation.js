function validation() {
  var CustomerFirstName = document.getElementById("CustomerFirstName").value;
  var password = document.getElementById("Password").value;
  var CustomerLastName = document.getElementById("CustomerLastName").value;
  var emailAddresse = document.getElementById("CustomerEmail").value;
  var phonenumber = document.getElementById("phonenumber").value;
  var confirmPassword = document.getElementById("ConfirmPassworde").value;


  if (CustomerFirstName == "") {
    document.getElementById("FirstNames").innerHTML =
      "Please enter your name";
    return false;
  }
  if (CustomerFirstName.length <= 2 || CustomerFirstName.length > 20) {
    document.getElementById("FirstNames").innerHTML =
      " The length is to short ";
    return false;
  }
  if (!isNaN(CustomerFirstName)) {
    document.getElementById("FirstNames").innerHTML =
      " Enter the valid characters";
    return false;
  }



  if (CustomerLastName == "") {
    document.getElementById("LastNames").innerHTML =
      " Please Enter your last name";
    return false;
  }
  if (CustomerLastName.length <= 2 || CustomerLastName.length > 20) {
    document.getElementById("LastNames").innerHTML =
      "Please enter more than 2 characters and shorter than 20 characters";
    return false;
  }
  if (!isNaN(CustomerLastName)) {
    document.getElementById("LastNames").innerHTML =
      " Only enter characters";
    return false;
  }

  if (phonenumber = "") {
    document.getElementById("PhoneNumbers").innerHTML =
      "Please enter the number"
    return false
  }

  // if (phonenumber.length != 10) {
  //   document.getElementById("PhoneNumbers").innerHTML =
  //     "please Enter valid number"
  //   return false
  // }

  if (emailAddresse == "") {
    document.getElementById("EmailAddresss").innerHTML =
      " Please fill the fieled";
    return false;
  }

  if (emailAddresse.indexOf("@") <= 0) {
    document.getElementById("EmailAddresss").innerHTML = " ** Invalid Email";
    return false;
  }

  if (
    emailAddresse.charAt(emailAddresse.length - 4) != "." &&
    emailAddresse.charAt(emailAddresse.length - 3) != "."
  ) {
    document.getElementById("EmailAddresss").innerHTML = " ** Invalid Email";
    return false;
  }




  if (password == "") {
    document.getElementById("Passwords").innerHTML =
      " Please enter the fieled";
    return false;
  }


  if (confirmPassword == "") {
    document.getElementById("ConfirmPasswords").innerHTML =
      " please enter the fieled";
    return false;
  }
  if (password.length <= 6 || password.length > 16) {
    document.getElementById("Passwords").innerHTML =
      " Password lenght must be between  6 and 16";
    return false;
  }

  if (password != confirmPassword) {
    document.getElementById("ConfirmPasswords").innerHTML =
      "  Password does not match ";
    return false;
  }
}


function loginvalidation() {
  var email = document.getElementById("email").value;
  var pass = document.getElementById("pass").value;

  if (email == "") {
    document.getElementById("EmailAddress").innerHTML =
      "  Please enter the Email ";
    return false;
  }

  if (email.indexOf("@") <= 0) {
    document.getElementById("EmailAddress").innerHTML = " ** Invalid Email";
    return false;
  }

  if (
    email.charAt(email.length - 4) != "." &&
    email.charAt(email.length - 3) != "."
  ) {
    document.getElementById("EmailAddress").innerHTML = " ** Invalid Email";
    return false;
  }

  if (pass == "") {
    document.getElementById("Password").innerHTML =
      " ** Please fill the password field";
    return false;
  }
}