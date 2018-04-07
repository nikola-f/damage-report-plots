import express = require('express');
const router = express.Router();



router.get('/jobs', (req, res) => {
  res.json({ message: 'jobs' });
});


router.post('/job', (req, res) => {
  res.json({ message: 'job' });
});


module.exports = router;
