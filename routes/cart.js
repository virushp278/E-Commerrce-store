const express = require("express");
const router = express.Router();
const { requireUser } = require("../services/authentication");
const User = require("../models/user");
const Product = require("../models/Product");

// Show user's cart
router.get("/", requireUser, async (req, res) => {
    try {
        // Fetch full user document from DB to access cart
        const user = await User.findById(req.user._id).populate("cart.product");

        const cartItems = user.cart.map(item => ({
            productId: item.product._id,
            name: item.product.productName,
            price: item.product.price,
            image: item.product.ProductImage,
            quantity: item.quantity
        }));

        res.render("cart", { cartItems });
    } catch (err) {
        console.error("Error fetching cart:", err);
        res.status(500).send("Server error");
    }
});

// Add to cart
router.post("/add", requireUser, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Fetch full user document
        const user = await User.findById(req.user._id);

        const existingItem = user.cart.find(item => item.product.equals(productId));
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            user.cart.push({ product: productId, quantity: parseInt(quantity) });
        }

        await user.save();
        res.redirect("/cart");
    } catch (err) {
        console.error("Error adding to cart:", err);
        res.status(500).send("Server error");
    }
});

// Update quantity
router.post("/update/:productId", requireUser, async (req, res) => {
    try {
        const { quantity } = req.body;
        const user = await User.findById(req.user._id);

        const item = user.cart.find(i => i.product.equals(req.params.productId));
        if (item) {
            item.quantity = parseInt(quantity);
            await user.save();
        }
        res.redirect("/cart");
    } catch (err) {
        console.error("Error updating cart:", err);
        res.status(500).send("Server error");
    }
});

// Remove item
router.post("/remove/:productId", requireUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        user.cart = user.cart.filter(i => !i.product.equals(req.params.productId));
        await user.save();
        res.redirect("/cart");
    } catch (err) {
        console.error("Error removing from cart:", err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
