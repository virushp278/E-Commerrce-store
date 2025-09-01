const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const merchant = req.session.merchant;
  const user = req.session.user;

  if (merchant) {
    return res.render('home', {
      merchant,
      user: null,
      isMerchant: true,
      isUser: false
    });
  } else if (user) {
    return res.render('home', {
      user,
      merchant: null,
      isMerchant: false,
      isUser: true
    });
  } else {
    return res.render('home', {
      user: null,
      merchant: null,
      isMerchant: false,
      isUser: false
    });
  }
});

module.exports = router;
