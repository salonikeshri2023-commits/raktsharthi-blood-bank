const mongoose = require("mongoose");
// const { listingSchema } = require("../schema");
const review = require("./review");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const bloodGroups = require("../utils/bloodGroups.js");

const listingSchema = new Schema({
    title:{ 
        type:String,
        required:true,
    },
    description:String,
    image:{
        url:String,
        filename:String
    },
    price: Number,
    bloodStock: {
        type: Number,
        min: 0
    },
    urgentBloodNeeded: {
        type: Boolean,
        default: false
    },
    bloodGroups: {
        type: [{
            type: String,
            enum: bloodGroups
        }],
        default: []
    },
    bloodGroupStock: {
        type: Map,
        of: {
            type: Number,
            min: 0
        },
        default: {}
    },
    location: String,
    country: String,
    reviews:[
        {
            type: Schema.Types.ObjectId,
            ref:"Review",
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },

    geometry:{
        type:{
            type:String, // Don't do '{location:{type:String}}'
            enum:['Point'],  //'location.type must be point'
            required:true
        },
        coordinates: {
            type: [Number],
            required:true
        }
    }

    });

listingSchema.post("findOneAndDelete",async (listing)=>{
    
        if(listing){
    await review.deleteMany({_id:{$in:listing.reviews}})}
})



const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;