const {Router} = require("express");
const User = require('../models/user');
const { requireUser } = require('../services/authentication');
const Order = require("../models/order");



const router = Router();

router.get("/signin",(req,res)=>{
    return res.render("signin");
});

router.get("/signup",(req,res)=>{
    return res.render("signup");
});

router.post("/signup", async (req,res)=>{
    const{fullname, email, dob , password}= req.body;
    await User.create({
        fullname,
        email,
        dob,
        password,
    });
    return res.redirect("/");
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const token = await User.matchPasswordAndGenerateToken(email, password);
        return res.cookie("token", token).redirect('/');
    } catch (error) {
        console.error("Signin Error:", error);
        return res.render("signin", {
            error: "Incorrect Email or Password. Try Again!",
        });
    }
});

router.get("/logout",(req,res)=>{
    res.clearCookie("token").redirect("/");
})

router.get("/orders", requireUser, async (req, res) => {
    const orders = await Order.find({ buyer: req.user._id })
        .populate("product")
        .exec();

    res.render("user-orders", {
        orders,
        user: req.user
    });
});


module.exports = router;