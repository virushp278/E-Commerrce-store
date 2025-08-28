const {createHmac,randomBytes} = require("crypto");
const { Schema,model} = require("mongoose");
const { createTokenForUser } = require("../services/authentication");

const userSchema = new Schema({
    fullname:{
        type: String,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required:true,
    },
    dob:{
        type:Date,
        required: true
    },
    salt:{
        type:String,
    },

    password:{
        type:String,
        required:true,

    },
    profileImageURL:{
        type:String,
        default:"..public/images/default.jpg"
        
    },
    role:{type:String,
        enum:["USER","ADMIN","MERCHANT"],
        default:"USER",
    }
},{timestamps:true,});

userSchema.pre('save', function (next){
    const user = this;

    if(!user.isModified("password")) return next();
    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac("sha256",salt).update(user.password).digest("hex");

    this.salt = salt;
    this.password = hashedPassword;

    next();
});

userSchema.static('matchPasswordAndGenerateToken',async function(email,password){
    const user = await this.findOne({email});
    if(!user) throw new Error('user not found');
    const salt = user.salt;
    const hashedPassword = user.password;
    const userProvidedHash = createHmac("sha256",salt).update(password).digest("hex");

    if(hashedPassword!==userProvidedHash) throw new Error("Incorrect Password, Please try again");

    const token = createTokenForUser(user);
    return token;

})

const User = model("user",userSchema);

module.exports = User;