const Joi = require('joi');
const bloodGroups = require("./utils/bloodGroups.js");

module.exports.listingSchema = Joi.object({
    Listing: Joi.object({
        title:Joi.string().required(),
        description:Joi.string().required(),
        location:Joi.string().required(),
        country:Joi.string().required(),
        bloodStock:Joi.number().required().integer().min(0),
        bloodGroups:Joi.array().items(Joi.string().valid(...bloodGroups)).min(1).required(),
        bloodGroupStock:Joi.object(Object.fromEntries(
            bloodGroups.map((group) => [group, Joi.number().integer().min(0).allow("")])
        )),
        price:Joi.number().min(0),
        image: Joi.object({
            url: Joi.string().allow("", null)
        })
    }).required()
})


module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().required(),
    }).required()
})