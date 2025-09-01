const { Schema, model } = require("mongoose");

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: [
            "ELECTRONICS",
            "CLOTHING",
            "GROCERY",
            "HOME_APPLIANCES",
            "FURNITURE",
            "TOYS",
            "BOOKS",
            "STATIONERY",
            "BEAUTY",
            "HEALTH",
            "SPORTS",
            "AUTOMOTIVE",
            "FOOTWEAR",
            "ACCESSORIES",
            "JEWELRY",
            "BAGS",
            "PET_SUPPLIES",
            "TOOLS",
            "BABY_PRODUCTS",
            "GARDEN",
            "MUSIC",
            "SOFTWARE",
            "ART",
            "HANDMADE",
            "INDUSTRIAL",
            "GIFT_ITEMS",
            "OTHERS"
        ],
        required: true,
    },

    brand: {
        type: String,

    },
    price: {
        type: Number,
        required: true,
        
    },
    discountPrice: {
        type: Number,
        required: true,
        default:0,
    },
    stockQuantity: {
        type: Number,
        required: true,
    },
    SKU: {//product Code
        type: String,
    },

    //media_section.
    ProductImage: {
        type: String,
        required: true,
    },
    addImages: {
        type: [String],

    },

    //product Variant Fields
    AvailSizes: {
        type: [String],//seperated by commas,

    },
    colors: {
        type: [String],//seperated by commas,

    },
    Keywords: {
        type: [String]//seperated by commas,
    },

    createdBy: {
        type: Schema.Types.ObjectID,
        ref: "merchant",
    },
    referenceId: {
        type: String,
        unique: true,
        required: true
    }


}, { timestamps: true, });


const Product = model("product", productSchema);

module.exports = Product;
