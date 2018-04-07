import express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  if(req.isAuthenticated()) {
    console.log('me/req/user:', req.user);
    console.log('me/req/session:', req.session);
  
    res.json(req.user);

  }else{
    res.redirect('/../auth/signin');
  }
});




module.exports = router;
