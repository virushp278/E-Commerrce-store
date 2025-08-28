const { validateToken } = require("../services/authentication");
const Merchant = require("../models/merchant");
const User = require("../models/user"); // if you have a separate user model

function checkForAuthenticationCookie(cookieName) {
  return async (req, res, next) => {
    const token = req.cookies[cookieName];
    if (!token) {
      res.locals.user = null;
      res.locals.merchant = null;
      res.locals.isMerchant = false;
      return next();
    }

    try {
      const decoded = validateToken(token); // { _id, role, ... }

      if (decoded.role === "MERCHANT") {
        const merchant = await Merchant.findById(decoded._id);
        if (!merchant) throw new Error("Merchant not found");
        req.merchant = merchant;
        res.locals.merchant = merchant;
        res.locals.user = null;
        res.locals.isMerchant = true;
      } else {
        const user = await User.findById(decoded._id);
        if (!user) throw new Error("User not found");
        req.user = user;
        res.locals.user = user;
        res.locals.merchant = null;
        res.locals.isMerchant = false;
      }
    } catch (err) {
      console.error("Token Validation Error:", err.message);
      res.clearCookie("token"); // 🧹 clear corrupted token
      req.user = null;
      req.merchant = null;
      res.locals.user = null;
      res.locals.merchant = null;
      res.locals.isMerchant = false;
    }

    return next();
  };
}

module.exports = {
  checkForAuthenticationCookie,
};


//********************************************************************************************************************** */
//2nd alteration//
// const { validateToken } = require("../services/authentication");

// function checkForAuthenticationCookie(cookieName) {
//   return (req, res, next) => {
//     const token = req.cookies[cookieName];
//     if (!token) {
//       res.locals.user = null;
//       res.locals.isMerchant = false;
//       return next();
//     }

//     try {
//       const userPayload = validateToken(token);
//       req.user = userPayload;
//       res.locals.user = userPayload;
//       res.locals.isMerchant = userPayload.role === "MERCHANT";
//     } catch (err) {
//       res.locals.user = null;
//       res.locals.isMerchant = false;
//     }

//     return next();
//   };
// }

// module.exports = {
//   checkForAuthenticationCookie,
// };
//********************************************************************************************************************* */
//1st alteration.
// const { validateToken } = require("../services/authentication");

// function checkForAuthenticationCookie(cookieName){
//     return (req,res, next) =>{
//         const tokenCookievalue = req.cookies[cookieName];
//         if(!tokenCookievalue){
//             res.locals.user = null;
//             return next();
//         }

//         try {
//             const userPayload = validateToken(tokenCookievalue);
//             req.user= userPayload;
//             res.locals.user = userPayload;
//         } catch (error) {
//             res.locals.user = null;
//         }
//         return next();
//     };
// }
// module.exports={
//     checkForAuthenticationCookie,
// }