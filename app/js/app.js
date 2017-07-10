
    $(document).ready(function() {
    $("#btnLogin").on("click", function(){
         console.log("Clicked");
    });
});

(function() {

    
  console.log('does this get called even?');
  // Initialize Firebase
  const config = {
    apiKey: "AIzaSyASB9RhrUzNme-rGkVrzEXmF3nL7PwMgvQ",
    authDomain: "konvivandroid.firebaseapp.com",
    databaseURL: "https://konvivandroid.firebaseio.com",
    projectId: "konvivandroid",
    storageBucket: "konvivandroid.appspot.com",
    messagingSenderId: "41760220514" 




    // apiKey: "AIzaSyD10H6NAii6s3rGCBKUxMYUsMn7lIG-jkg",
    // authDomain: "konviv-attempt.firebaseapp.com",
    // databaseURL: "https://konviv-attempt.firebaseio.com",
    // projectId: "konviv-attempt",
    // storageBucket: "konviv-attempt.appspot.com",
    // messagingSenderId: "129647908445"
  };
  var app=firebase.initializeApp(config);
  var ref = firebase.database().ref("users/");
  
  //Get elements
  const txtEmail=document.getElementById('txtEmail')
  const txtPassword=document.getElementById('txtPassword')
  const btnLogin=document.getElementById('btnLogin')
  const btnSignup=document.getElementById('btnSignup')
  const btnLogout=document.getElementById('btnLogout')
  
  
  //Add login event
  btnLogin.addEventListener('click', e => {
      const email=txtEmail.value;
      const pass=txtPassword.value;
      const auth=firebase.auth();
      //Sign in
      const promise =auth.signInWithEmailAndPassword(email,pass);
      promise.catch(e => console.log(e.message));
      
  });
  //Add signup event
  btnSignup.addEventListener('click', e => {
      const email=txtEmail.value; //EMAIL VALIDATION
      const pass=txtPassword.value;
      const auth=firebase.auth();
      //Sign in
      const promise =auth.createUserWithEmailAndPassword(email,pass);
      promise.catch(e =>console.log(e.message));
  });
  
  //Add logout event
  btnLogout.addEventListener('click', e=>{
      firebase.auth().signOut();
  });
  
  //Add a listener for auth state changed
  firebase.auth().onAuthStateChanged(firebaseUser => {
      if(firebaseUser){
          console.log(firebaseUser);
          btnLogout.classList.remove('hide');
          
          var user = firebase.auth().currentUser;
          var name, email, photoUrl, uid;

          if (user != null) {
            //name = user.displayName;
            email = user.email;
            //photoUrl = user.photoURL;
            uid = user.uid;
            
            //console.log(uid)
          } 
          checkIfUserExists(uid,email)
          
          if (firebaseUser){
             
          }
      } 
      else {
          console.log('NOT LOGGED IN');
          btnLogout.classList.add('hide');
       //   location.href="index.html"

          //location.href="index.html"
      }
  });
  
  //FOR KIKI --- TO WRITE TO A FIREBASE, WE JUST NEED TO FORM A PATH AND THEN ITS EASY!!!
  function writeUserData(userId, email) { 
    firebase.database().ref('users/' + userId).set({
    //username: name,
    email: email
    //profile_picture : imageUrl
    });
    console.log("DONE!!")
    return "Success"
  }
  function userExistsCallback(userId, email, exists) {
    if (exists) {
      alert('user ' + userId + ' exists!');
    } 
    else {
      alert('user ' + userId + ' does not exist!');
      var status=writeUserData(userId,email)
    }
    location.href= "../views/index.ejs"

    // COMMENT THIS OUT 
  }
  function checkIfUserExists(userId,email) {
    var usersRef = firebase.database().ref('users/');
    usersRef.child(userId).once('value', function(snapshot) {
      var exists = (snapshot.val() !== null);
      userExistsCallback(userId, email, exists);
    });
  }
  
   
}());


