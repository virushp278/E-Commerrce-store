const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const merchant = req.session.merchant;
  const user = req.session.user;

  if (merchant) {
    return res.render('home', {
      user: merchant,
      isMerchant: true,
    });
  } else if (user) {
    return res.render('home', {
      user,
      isMerchant: false,
    });
  } else {
    return res.render('home', {
      user: null,
      isMerchant: false,
    });
  }
});

module.exports = router;
