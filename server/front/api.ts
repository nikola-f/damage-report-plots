import express = require('express');
const router = express.Router();



router.get('/jobs', function (req, res) {
  res.json({ message: 'jobs' });
});


router.post('/job', function (req, res) {
  res.json({ message: 'job' });
});


module.exports = router;
