import mongoose, { Schema, Types } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // One Who is Subscribing
        ref: "User"
    },

    channel: {
        type: Schema.Types.ObjectId, // One Who is Subscriber is Subscribing
        ref: "User"
    }
}, { timestamps: true })


export const Subscription = mongoose.model("Subscription", subscriptionSchema) 