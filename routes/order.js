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
        const { productId, quantity, shippingAddress } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found");
        }

        const totalAmount = product.price * quantity;

        const newOrder = new Order({
            product: productId,
            buyer: req.user._id,
            quantity,
            totalAmount,
            shippingAddress: [shippingAddress],
        });

        await newOrder.save();
        res.redirect("/orders"); // Redirect to order history page
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while placing the order.");
    }
});

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
