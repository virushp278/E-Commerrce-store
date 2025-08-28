const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user", // User who commented
      required: true,
    },
    rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function () {
      return this.isReview === true; // only required if it's a review
    }
  },
  isReview: {
    type: Boolean,
    default: false, // merchant reply = false, user review = true
  },
    reply: {
      type: String, // Merchant's reply text
      default: null,
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: "merchant", // Only the merchant who owns the product can reply
      default: null,
    },
  },
  { timestamps: true }
);

const Comment = model("comment", commentSchema);
module.exports = Comment;
