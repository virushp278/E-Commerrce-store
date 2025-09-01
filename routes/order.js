const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/Product");
const User = require("../models/user");
const { requireUser } = require("../services/authentication");

// ------------------ Place a new order ------------------
router.post("/buy", requireUser, async (req, res) => {
    try {
        let { productId, quantity, shippingAddress } = req.body;

        if (!Array.isArray(productId)) {
            productId = [productId];
            quantity = [quantity];
        }

        for (let i = 0; i < productId.length; i++) {
            const product = await Product.findById(productId[i]);
            if (!product) continue;

            const totalAmount = product.price * quantity[i];

            const newOrder = new Order({
                product: productId[i],
                buyer: req.user._id,
                quantity: quantity[i],
                totalAmount,
                shippingAddress: [shippingAddress],
            });

            await newOrder.save();
        }

        await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

        res.redirect("/orders"); // Redirect to order history page
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).send("Something went wrong while placing the order.");
    }
});

// ------------------ Checkout page ------------------
router.get("/checkout", requireUser, async (req, res) => {
    try {
        const { productId } = req.query; // check if single product

        const user = await User.findById(req.user._id).populate("cart.product");

        let itemsToBuy = [];

        if (productId) {
            const product = await Product.findById(productId);
            if (!product) return res.status(404).send("Product not found");

            itemsToBuy = [{
                _id: product._id,
                productName: product.productName,
                price: product.price,
                quantity: 1,
                image: product.ProductImage
            }];
        } else {
            // Cart checkout
            if (!user.cart || user.cart.length === 0) {
                return res.redirect("/cart");
            }

            itemsToBuy = user.cart
                .filter(item => item.product)
                .map(item => ({
                    _id: item.product._id,
                    productName: item.product.productName,
                    price: item.product.price,
                    quantity: item.quantity,
                    image: item.product.ProductImage
                }));
        }

        res.render("buy", { cartItems: itemsToBuy, user });
    } catch (err) {
        console.error("Error during checkout:", err);
        res.status(500).send("Server error during checkout");
    }
});


// ------------------ View all user orders ------------------
router.get("/your-orders", requireUser, async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.user._id })
            .populate("product")
            .sort({ placedAt: -1 });

        res.render("user-orders", {
            orders,
            user: req.user
        });
    } catch (err) {
        console.error("Error fetching user orders:", err);
        res.status(500).send("Error fetching your orders.");
    }
});

// ------------------for Buying a single product ------------------
router.get("/buy/:productId", requireUser, async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).send("Product not found");

        const user = await User.findById(req.user._id);

        // Redirect to checkout page with query param
        return res.redirect(`/order/checkout?productId=${productId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error.");
    }
});

module.exports = router;
