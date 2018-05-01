import * as express from 'express';
const router = express.Router();

// FIXME /me は静的コンテンツに振る。サーバ側処理は/api/maps,statsで。
router.get('/', (req, res) => {
  if(!req.isAuthenticated()) {
    res.redirect('/../auth/signin');
  }

  console.log('me/req/user:', req.user);
  console.log('me/req/session:', req.session);

  res.json(req.user);




});




module.exports = router;
