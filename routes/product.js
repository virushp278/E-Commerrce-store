const { Router } = require("express");
const Product = require("../models/Product")
const multer = require("multer");
const path = require("path");
const { attachUser } = require("../services/attachUser");
const {requireUser ,requireMerchant } = require("../services/authentication");
const fs = require("fs");
const { populate } = require("../models/merchant");
const Merchant = require("../models/merchant");
const Comment = require("../models/comments")

const prouter = Router();

//******************************************************************************************************************** */
// Multer storage config



const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve("./public/uploads/products");
        ensureDirExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});


const upload = multer({ storage });
//******************************************************************************************************************** */








//adding new product for merchants
prouter.post("/addProduct", requireMerchant, upload.fields([
    { name: "ProductImage", maxCount: 1 },
    { name: "addImages", maxCount: 5 } // adjust maxCount as needed
]), async (req, res) => {
    try {

        const referenceId = `PRD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        // Example: PRD-1752715912345-4823

        const {
            productName, description, category, brand,
            price, discountPrice, stockQuantity, SKU,
            AvailSizes, colors, Keywords
        } = req.body;

        const ProductImage = req.files["ProductImage"]?.[0]?.path
            .replace(/\\/g, "/")                  // Windows -> web slashes
            .replace(/.*public/, "") || null;     // ✅ remove everything up to and including 'public'

        const addImages = req.files["addImages"]?.map(file =>
            file.path.replace(/\\/g, "/").replace(/.*public/, "")
        ) || [];

        const product = await Product.create({
            productName,
            description,
            category,
            brand,
            price,
            discountPrice,
            stockQuantity,
            SKU,
            ProductImage,
            addImages,
            AvailSizes: AvailSizes.split(",").map(i => i.trim()),
            colors: colors.split(",").map(i => i.trim()),
            Keywords: Keywords.split(",").map(i => i.trim()),
            createdBy: req.user._id,
            referenceId,
        });

        res.render("productSuccess", {
            product,
            merchant: product.createdBy
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Something went wrong.");
    }
});


prouter.get("user/signin", async (req, res) => {
    res.render("signin");
})

// routes/product.js (prouter)
prouter.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("createdBy");

        if (!product) {
            return res.status(404).send("Product not found");
        }

        const comments = await Comment.find({ productId: product._id }).populate("createdBy");

        let viewMode = "guest"; // default

        if (req.user) {
            if (req.user.role === "USER") {
                viewMode = "user";
            } else if (req.user.role === "MERCHANT") {
                if (product.createdBy._id.equals(req.user._id)) {
                    viewMode = "merchant-owner";
                } else {
                    viewMode = "merchant-other";
                }
            }
        }

        return res.render("product", {
            product,
            comments,
            viewMode,
            user: res.locals.user || res.locals.merchant,
            isMerchant: res.locals.isMerchant,// may be merchant or user
        });

    } catch (err) {
        console.error("Error fetching product:", err);
        return res.status(500).send("Server error");
    }
});
//router for comments

prouter.post("/:productId/comments", requireUser, async (req, res) => {
  try {
    await Comment.create({
      content: req.body.content,
      rating: req.body.rating, // ⭐ user adds rating
      isReview: true,
      productId: req.params.productId,
      createdBy: req.user._id,
    });
    res.redirect(`/product/${req.params.productId}`);
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).send("Error adding review");
  }
});

// Merchant replies to a specific comment
// Merchant replies to a specific comment
prouter.post("/:productId/comments/:commentId/reply", requireMerchant, async (req, res) => {
  try {
    const { productId, commentId } = req.params;

    await Comment.findByIdAndUpdate(commentId, {
      reply: req.body.reply,          // ✅ merchant’s reply text
      repliedBy: req.user._id         // ✅ who replied (merchant)
    });

    res.redirect(`/product/${productId}`);
  } catch (err) {
    console.error("Error replying to comment:", err);
    res.status(500).send("Error replying to comment");
  }
});



// //for MERCHANTS
// // Create new product
// router.post("/add", requireMerchant, async (req, res) => {
//     // create product
// });

// // Edit existing product
// router.post("/edit/:id", requireMerchant, async (req, res) => {
//     // update product
// });

// // Delete product
// router.post("/delete/:id", requireMerchant, async (req, res) => {
//     // delete logic
// });

// // View all products by this merchant
// router.get("/my-products", requireMerchant, async (req, res) => {
//     // get all products listed by current merchant
// });

// // View analytics / dashboard info
// router.get("/:id/dashboard", requireMerchant, async (req, res) => {
//     // show product orders, returns, views, etc.
// });






// ////for USERS
// // View single product (product details page)
// router.get("/view/:id", async (req, res) => {
//     // show product to anyone (login optional)
// });

// // Add to wishlist
// router.post("/:id/wishlist", requireUser, async (req, res) => {
//     // logic to add to user's wishlist
// });

// // Leave a review
// router.post("/:id/review", requireUser, async (req, res) => {
//     // logic for user to submit a review
// });

// // View all reviews for product
// router.get("/:id/reviews", async (req, res) => {
//     // list of all reviews
// });


module.exports = prouter;