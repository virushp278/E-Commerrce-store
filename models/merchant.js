const { Schema, model } = require("mongoose");
const { createHmac, randomBytes } = require("crypto");
const { createTokenForMerchantUser } = require("../services/authentication");


const merchantSchema = new Schema({
  businessName: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: [true, "Owner name is required."],
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required."],
    match: [/^[6-9]\d{9}$/, "Entered wrong phone number. Please make sure it is a valid 10-digit Indian mobile number."],
  },
  address: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  gstNumber: {
    type: String,
    required: false, // Optional for small businesses, required for B2B
    // test GST number: 22ABCDE1234F1Z5
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  },
  panNumber: {
    type: String,
    required: [true, "PAN number is required."],
    // testing pan number ABCDE1234F
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format."],
  },  
  businessType: {
    type: String,
    enum: ["Individual", "Proprietorship", "Partnership", "Private Limited", "LLP"],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
  },
  profileImageURL: {
    type: String,
    default: "/images/merchant-default.jpg",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["ADMIN", "MERCHANT"],
    default: "MERCHANT",
  }
}, { timestamps: true });


merchantSchema.pre('save', function (next) {
  const merchantUser = this;

  if (!merchantUser.isModified("password")) return next();

  const salt = randomBytes(16).toString("hex");
  const hashedPassword = createHmac('sha256', salt).update(merchantUser.password).digest("hex");
  const hashedPanNumber = createHmac('sha256', salt).update(merchantUser.panNumber).digest("hex");

  if (merchantUser.gstNumber) {
    this.gstNumber = createHmac('sha256', salt).update(merchantUser.gstNumber).digest("hex");
  }


  this.salt = salt;
  this.password = hashedPassword;
  this.panNumber = hashedPanNumber;

  next();
});


merchantSchema.static('matchPasswordAndGenerateTokenMerchant', async function (email, password) {
  const user_merchant = await this.findOne({ email });
  if (!user_merchant) throw new Error('Merchant ID not found!');

  const salt = user_merchant.salt;
  const hashedPassword = user_merchant.password;


  const merch_userProvidedash = createHmac('sha256', salt).update(password).digest("hex");

  if (hashedPassword !== merch_userProvidedash) throw new Error("incorrect Password, please try again");

  const merchanttoken = createTokenForMerchantUser(user_merchant);
  return { merchant: user_merchant, token: merchanttoken };
;
})

const Merchant = model("merchant", merchantSchema);

module.exports = Merchant;