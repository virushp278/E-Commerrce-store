const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/Product");
const User = require("../models/user");
const { requireUser } = require("../services/authentication");
const { localsName } = require("ejs");

// Place a new order
router.post("/buy", requireUser, async (req, res) => {
    try {
        let { productId, quantity, shippingAddress } = req.body;

        // If multiple items (from cart), they will come as arrays
        if (!Array.isArray(productId)) {
            productId = [productId];
            quantity = [quantity];
        }

        for (let i = 0; i < productId.length; i++) {
            const product = await Product.findById(productId[i]);
            if (!product) continue; // skip missing products

            const totalAmount = product.price * quantity[i];

            const newOrder = new Order({
                product: productId[i],
                buyer: req.user._id,
                quantity: quantity[i],
                totalAmount,
                shippingAddress: [shippingAddress], // same address for all items
            });

            await newOrder.save();
        }

        // Clear user's cart after checkout
        await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

        res.redirect("/orders"); // Redirect to order history page
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).send("Something went wrong while placing the order.");
    }
});


// routes/order.js

// Checkout page (GET)
router.get("/checkout", requireUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("cart.product");

        if (!user.cart || user.cart.length === 0) {
            return res.redirect("/cart");
        }

        const cartItems = user.cart.map(item => ({
            productId: item.product._id,
            name: item.product.productName,
            price: item.product.price,
            image: item.product.ProductImage,
            quantity: item.quantity
        }));

        res.render("buy", {
            cartItems,
            user
        });
    } catch (err) {
        console.error("Error during checkout:", err);
        res.status(500).send("Server error during checkout");
    }
});

module.exports = router;

// View user orders
router.get("/", requireUser, async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.user._id })
            .populate("product")
            .sort({ placedAt: -1 });

        res.render("user-order", {
            orders,
            user: req.user,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching your orders.");
    }
});

router.get("/buy/:productId", requireUser, async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).send("Product not found");
    }

    const user = await User.findById(req.user._id); // If you want to get existing addresses

    res.render("buy", {
        product,
        user, // pass this if you're using user info
    });
});




module.exports = router;
