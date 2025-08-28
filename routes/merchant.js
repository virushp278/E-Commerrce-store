// routes/merchant.js
const { Router } = require("express");
const Merchant = require("../models/merchant");
const Product = require("../models/Product");
const Order = require("../models/order");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireMerchant } = require("../services/authentication");



const router = Router();



//Routes-GET
router.get("/merchant-signup", (req, res) => {
    res.render("merchant-signup");
});

router.get("/merchant-signin", (req, res) => {
    res.render("merchant-signin");
});

router.get("/dashboard", requireMerchant, (req, res) => {
    res.render("merchant-dashboard", { user: req.user });
});


//storage using multer 

const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve("./public/uploads/merchants");
        ensureDirExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });



//Routes-POST
router.post("/merchant-signup", upload.single("profileImage"), async (req, res) => {
    try {
        const {
            businessName,
            ownerName,
            email,
            phone,
            address,
            pincode,
            gstNumber,
            panNumber,
            businessType,
            password,
        } = req.body;

        const profileImageURL = req.file
            ? `/uploads/merchants/${req.file.filename}`
            : "/images/merchant-default.jpg"; // fallback default

        await Merchant.create({
            businessName,
            ownerName,
            email,
            phone,
            address,
            pincode,
            gstNumber,
            panNumber,
            businessType,
            password,
            profileImageURL,
            verified: false,
        });



        return res.redirect("/");

    } catch (error) {
        // Handle Mongoose validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).render("merchant-signup", {
                errorMessages: errors
            });
        }

        // Log and handle other errors
        console.error("Merchant Signup Error:", error);
        return res.status(500).render("merchant-signup", {
            errorMessages: ["Something went wrong. Please try again."]
        });
    }
});





//POST -SIGNIN
router.post("/merchant-signin", async (req, res) => {
    const { email, password } = req.body;

    try {

        
        
        const {merchant , token}  = await Merchant.matchPasswordAndGenerateTokenMerchant(email, password);

       

        req.session.merchant = merchant;

        return res.cookie("token", token, {
            httpOnly: true,
            // secure: false, // true in production
            // maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        }).redirect('/merchant/dashboard');



    } catch (error) {
        console.error("Signin Error:", error);
        return res.render("merchant-signin", {
            error: "Incorrect Email or Password. Try Again!",
        });
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("token").redirect("/");
    });


})

router.get("/product/addProduct", (req, res) => {
    res.render("addProduct");
})

// Assuming you've already added authentication middleware
router.get("/my-products", requireMerchant, async (req, res) => {
    try {
        // 1. Get all products created by this merchant
        const products = await Product.find({ createdBy: req.user._id }).lean();

        // 2. Add order count to each product
        const productsWithOrders = await Promise.all(products.map(async (product) => {
            const orderCount = await Order.countDocuments({ product: product._id });
            return {
                ...product,
                orders: orderCount,
            };
        }));

        // 3. Render page
        res.render("merch_ProdList", {
            products: productsWithOrders,
            user: req.user,
        });

    } catch (err) {
        console.error("Failed to load merchant products:", err);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
