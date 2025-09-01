const { validateToken } = require("../services/authentication");
const Merchant = require("../models/merchant");
const User = require("../models/user");

function checkForAuthenticationCookie(cookieName) {
  return async (req, res, next) => {
    const token = req.cookies[cookieName];

    // 🟢 Reset state every request
    req.user = null;
    req.merchant = null;
    res.locals.user = null;
    res.locals.merchant = null;
    res.locals.isUser = false;
    res.locals.isMerchant = false;

    if (!token) {
      return next();
    }

    try {
      const decoded = validateToken(token); // { _id, role }

      if (decoded.role === "MERCHANT") {
        const merchantDoc = await Merchant.findById(decoded._id);
        if (!merchantDoc) throw new Error("Merchant not found");

        req.merchant = merchantDoc;
        res.locals.merchant = merchantDoc;
        res.locals.isMerchant = true;

      } else if (decoded.role === "USER") {
        const userDoc = await User.findById(decoded._id);
        if (!userDoc) throw new Error("User not found");

        req.user = userDoc;
        res.locals.user = userDoc;
        res.locals.isUser = true;
      }

    } catch (err) {
      console.error("❌ Token Validation Error:", err.message);
      res.clearCookie(cookieName);
    }

    return next();
  };
}

module.exports = { checkForAuthenticationCookie };
