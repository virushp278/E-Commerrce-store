// services/attachUser.js
module.exports.attachUser = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        res.locals.isUser = true;
        res.locals.isMerchant = false;
        res.locals.user = req.session.user;
    } else if (req.session && req.session.merchant) {
        req.user = req.session.merchant;
        res.locals.isUser = false;
        res.locals.isMerchant = true;
        res.locals.merchant = req.session.merchant;
    } else {
        req.user = null;
        res.locals.isUser = false;
        res.locals.isMerchant = false;
        res.locals.user = null;
        res.locals.merchant = null;
    }
    // console.log("Debug attachUser → user:", req.session.user, "| merchant:", req.session.merchant);

    next();
};
