// services/attachUser.js
module.exports.attachUser = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
    } else if (req.session && req.session.merchant) {
        req.user = req.session.merchant;
    }
    next();
};
