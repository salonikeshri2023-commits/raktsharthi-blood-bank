const mongoose = require("mongoose");

const urgentBloodNotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    requestingHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    }
}, { timestamps: true });

urgentBloodNotificationSchema.index(
    { recipient: 1, requestingHospital: 1 },
    { unique: true }
);

module.exports = mongoose.model("UrgentBloodNotification", urgentBloodNotificationSchema);
