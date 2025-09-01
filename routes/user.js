const { Router } = require("express");
const User = require('../models/user');
const { requireUser } = require('../services/authentication');
const Order = require("../models/order");
const Product = require("../models/Product")


const router = Router();

router.get("/signin", (req, res) => {
    return res.render("signin");
});

router.get("/signup", (req, res) => {
    return res.render("signup");
});

router.post("/signup", async (req, res) => {
    const { fullname, email, dob, password } = req.body;
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
        const { user, token } = await User.matchPasswordAndGenerateToken(email, password);
        console.log("Generated Token:", token); // 🟢 Debug line
        req.session.user = user;


        req.session.save(() => {
            res.cookie("token", token, { httpOnly: true }).redirect('/');
        });
    } catch (error) {
        console.error("Signin Error:", error);
        return res.render("signin", {
            error: "Incorrect Email or Password. Try Again!",
        });
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) console.error("Session Destroy Error:", err);
        res.clearCookie("token").redirect("/");
    });
});





// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



router.get("/orders", requireUser, async (req, res) => {
    const orders = await Order.find({ buyer: req.user._id })
        .populate("product")
        .exec();

    res.render("user-orders", {
        orders,
        user: req.user
    });
});


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


router.post("/address/add", requireUser, async (req, res) => {
    const { street,
        landmark,
        city,
        state,
        zipCode,
        country } = req.body

    const user = await User.findById(req.user._id)
    
    user.addresses.push({ street:street,
        landmark:landmark,
        city:city,
        state:state,
        zipCode:zipCode,
        country:country})

    await user.save();
    res.redirect("/order/checkout")

})


router.get("/add-address", requireUser, (req, res) => {

    return res.render("user_addAddress");
   

})





module.exports = router;