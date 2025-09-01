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
prouter.get("/:id", attachUser, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("createdBy");

        if (!product) return res.status(404).send("Product not found");

        const comments = await Comment.find({ productId: product._id }).populate("createdBy");

        let viewMode = "guest"; // default

        // Use the user or merchant from locals
        const currentUser = req.user || res.locals.merchant;

        if (currentUser) {
            if (currentUser.role === "USER") {
                viewMode = "user";
            } else if (currentUser.role === "MERCHANT") {
                // Convert both to string to avoid ObjectId mismatch
                if (product.createdBy._id.toString() === currentUser._id.toString()) {
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
            user: currentUser,
            isMerchant: currentUser?.role === "MERCHANT",
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

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */



// // Edit existing product
// GET edit product page
prouter.get("/:id/edit", requireMerchant, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    // Check if the logged-in merchant is the owner
    if (!product.createdBy.equals(req.user._id)) {
      return res.status(403).send("Unauthorized");
    }

    res.render("editProduct", { product });
  } catch (err) {
    console.error("Error fetching product for edit:", err);
    res.status(500).send("Server error");
  }
});

// POST update product details
prouter.post("/:id/edit", requireMerchant, upload.fields([
    { name: "ProductImage", maxCount: 1 },
    { name: "addImages", maxCount: 5 }
]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    if (!product.createdBy.equals(req.user._id)) {
      return res.status(403).send("Unauthorized");
    }

    const {
      productName, description, category, brand,
      price, discountPrice, stockQuantity, SKU,
      AvailSizes, colors, Keywords
    } = req.body;

    // Update product fields
    product.productName = productName;
    product.description = description;
    product.category = category;
    product.brand = brand;
    product.price = price;
    product.discountPrice = discountPrice;
    product.stockQuantity = stockQuantity;
    product.SKU = SKU;
    product.AvailSizes = AvailSizes.split(",").map(i => i.trim());
    product.colors = colors.split(",").map(i => i.trim());
    product.Keywords = Keywords.split(",").map(i => i.trim());

    // Update images if new ones uploaded
    if (req.files["ProductImage"]?.[0]) {
      product.ProductImage = req.files["ProductImage"][0].path.replace(/\\/g, "/").replace(/.*public/, "");
    }
    if (req.files["addImages"]?.length) {
      product.addImages = req.files["addImages"].map(file =>
        file.path.replace(/\\/g, "/").replace(/.*public/, "")
      );
    }

    await product.save();
    res.redirect(`/product/${product._id}`);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Server error");
  }
});

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

// // Delete product
prouter.post("/:id/delete", requireMerchant, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Delete main product image
    if (product.ProductImage) {
      const productImagePath = path.join(__dirname, "..", "public", product.ProductImage);
      if (fs.existsSync(productImagePath)) {
        fs.unlinkSync(productImagePath);
      }
    }

    // Delete additional images
    if (product.addImages && product.addImages.length > 0) {
      product.addImages.forEach(img => {
        const imgPath = path.join(__dirname, "..", "public", img);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });
    }

    // Remove the product from DB
    await Product.findByIdAndDelete(req.params.id);

    res.redirect("/merchant/my-products"); // or wherever you want to redirect
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Error deleting product");
  }
});



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