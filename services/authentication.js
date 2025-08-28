const JWT = require('jsonwebtoken');

const secret = "iwillchangethislater";

function createTokenForUser(user) {
  const payload = {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    profileImageURL: user.profileImageURL,
    role: user.role,
  };
  const token = JWT.sign(payload, secret, { expiresIn: '7d' });
  return token;
}


function createTokenForMerchantUser(user) {
  const merch_payload = {
    _id: user._id,
    businessName: user.businessName,
    ownerName: user.ownerName,
    phone: user.phone,
    address: user.address,
    pincode: user.pincode,
    businessType: user.businessType,
    email: user.email,
    profileImageURL: user.profileImageURL,
    role: user.role,
  };
  const merchanttoken = JWT.sign(merch_payload, secret, { expiresIn: '7d' });
  return merchanttoken;
}

function validateToken(token) {
  
  try {
    const payload = JWT.verify(token, secret);
    return payload;
  } catch (err) {
    console.error("JWT Error:", err.message); // log malformed or expired tokens
    throw err;
  }
}


function requireMerchant(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) throw new Error("No token found");
    

    const decoded = validateToken(token);
    if (decoded.role !== 'MERCHANT') throw new Error("Access denied");

    req.user = decoded; // optional: also set req.merchant
    next();

  } catch (err) {
    console.error("Authorization Error:", err.message);
    console.log("Token:", req.cookies.token);
    res.status(401).render("unauthorized", { message: "Unauthorized access - sign in as a merchant to continue." });
  }
}


function requireUser(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) throw new Error("No token found");

    const user = validateToken(token);
    if (user.role !== 'USER') throw new Error("Access denied");

    req.user = user;
    next();
  } catch (err) {
    console.error("User Auth Error:", err.message);
    res.status(401).json({ error: "Unauthorized access - USER only" });
  }
}

function requireAdmin(req, res, next) {
  try {
    const token = req.cookies.token;
    const user = validateToken(token);

    if (user.role !== 'ADMIN') throw new Error("Access denied");

    req.user = user;
    next();
  } catch {
    return res.status(401).render("unauthorized", { message: "Admin access only." });
  }
}


module.exports = {
  createTokenForUser,
  validateToken,
  createTokenForMerchantUser,
  requireMerchant,
  requireUser,
  requireAdmin,
};