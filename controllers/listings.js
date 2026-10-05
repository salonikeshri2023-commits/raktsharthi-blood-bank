// const { response } = require("express");
const Listing = require("../models/listing");
const UrgentBloodNotification = require("../models/urgentBloodNotification");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const bloodGroups = require("../utils/bloodGroups.js");
// const { ConnectionStates } = require("mongoose");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index =async(req,res)=>{
    const searchQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const searchFilter = searchQuery
        ? new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
        : null;
    const allListings = await Listing.find(searchFilter ? {
        $or: [
            {title: searchFilter},
            {location: searchFilter},
            {country: searchFilter},
            {bloodGroups: searchFilter}
        ]
    } : {}).populate("owner", "username");

    res.render("listings/index.ejs", {allListings, searchQuery});
};

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs", { bloodGroups })
}

module.exports.dashboard = async(req,res)=>{
    const listings = await Listing.find({});
    const availableBloodGroups = new Set();
    const bloodGroupTotals = Object.fromEntries(
        bloodGroups.map((group)=>[group, {units: 0, hospitals: 0, hospitalsReportingUnits: 0}])
    );
    const hospitalStockData = listings.map((listing)=>{
        const groups = listing.bloodGroups || [];
        const groupStock = Object.fromEntries(listing.bloodGroupStock || []);
        const groupDetails = groups.map((group)=>{
            availableBloodGroups.add(group);

            const groupSummary = bloodGroupTotals[group];
            groupSummary.hospitals += 1;
            if (Object.prototype.hasOwnProperty.call(groupStock, group)) {
                const units = Number(groupStock[group]);
                groupSummary.units += units;
                groupSummary.hospitalsReportingUnits += 1;
                return {group, units};
            }

            return {group, units: null};
        });

        return {
            name: listing.title || "Unnamed hospital",
            units: Number(listing.bloodStock ?? listing.price ?? 0),
            groups: groupDetails
        };
    });
    const totalBloodStock = listings.reduce((total, listing)=>{
        return total + Number(listing.bloodStock ?? listing.price ?? 0);
    }, 0);
    const maxHospitalStock = Math.max(0, ...hospitalStockData.map(({units})=>units));
    const maxBloodGroupUnits = Math.max(0, ...Object.values(bloodGroupTotals).map(({units})=>units));

    hospitalStockData.forEach((hospital)=>{
        hospital.percentage = maxHospitalStock
            ? Math.round(hospital.units / maxHospitalStock * 100)
            : 0;
    });
    const bloodGroupData = bloodGroups.map((group)=>({
        group,
        ...bloodGroupTotals[group],
        percentage: maxBloodGroupUnits
            ? Math.round(bloodGroupTotals[group].units / maxBloodGroupUnits * 100)
            : 0
    }));

    res.render("listings/dashboard.ejs", {
        hospitalCount: listings.length,
        totalBloodStock,
        bloodGroupCount: availableBloodGroups.size,
        hospitalStockData,
        bloodGroupData
    });
};


module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }

    const bloodGroupStock = Object.fromEntries(listing.bloodGroupStock || []);
    let urgentNotifications = [];
    if (req.user && listing.owner._id.equals(req.user._id)) {
        urgentNotifications = await UrgentBloodNotification.find({
            recipient: listing._id,
            requestingHospital: { $ne: listing._id }
        })
            .populate("requestingHospital", "title bloodGroups")
            .sort({ createdAt: -1 });
    }

    // Check whether geometry is missing or invalid
    const coordinates = listing.geometry?.coordinates;

    if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !Number.isFinite(Number(coordinates[0])) ||
        !Number.isFinite(Number(coordinates[1]))
    ) {

        const response = await geocodingClient
            .forwardGeocode({
                query: listing.location,
                limit: 1
            })
            .send();

        if (response.body.features.length > 0) {

            listing.geometry = response.body.features[0].geometry;

            await listing.save();

        } else {
            req.flash("error", "Location could not be found on map");
        }
    }

    res.render("listings/show.ejs", { listing, bloodGroupStock, urgentNotifications });
};

module.exports.updateUrgentStatus = async (req, res) => {
    const { urgentBloodNeeded } = req.body;
    if (urgentBloodNeeded !== "true" && urgentBloodNeeded !== "false") {
        return res.status(400).json({ error: "A valid urgent blood status is required." });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        return res.status(404).json({ error: "Hospital listing not found." });
    }

    const isUrgent = urgentBloodNeeded === "true";
    let notificationsSent = 0;

    if (isUrgent) {
        const otherHospitals = await Listing.find({
            _id: { $ne: listing._id }
        }).select("_id");

        if (otherHospitals.length) {
            await UrgentBloodNotification.bulkWrite(
                otherHospitals.map(({ _id: recipientHospital }) => ({
                    updateOne: {
                        filter: { recipient: recipientHospital, requestingHospital: listing._id },
                        update: {
                            $setOnInsert: {
                                recipient: recipientHospital,
                                requestingHospital: listing._id
                            }
                        },
                        upsert: true
                    }
                }))
            );
        }
        notificationsSent = otherHospitals.length;
    } else {
        await UrgentBloodNotification.deleteMany({ requestingHospital: listing._id });
    }

    listing.urgentBloodNeeded = isUrgent;
    await listing.save();

    res.json({ urgentBloodNeeded: listing.urgentBloodNeeded, notificationsSent });
};

module.exports.createListng = async(req,res)=>{
        const response =  await geocodingClient.forwardGeocode({
        query:req.body.Listing.location,
        limit:1
    })
    .send();

    if (!response.body.features.length) {
    req.flash("error", "Location not found!");
    return res.redirect("/listings/new");
}

    
    let url = req.file.path;
    let filename = req.file.filename;
    console.log(url,"..." ,filename);

    const newListing = new Listing(req.body.Listing);
    newListing.owner = req.user._id;
    
    newListing.image = {url,filename};
    newListing.geometry = response.body.features[0].geometry;

    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
}




module.exports.renderEditForm = async(req,res,next)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);

    let originalUrlImage = listing.image.url;
    originalUrlImage = originalUrlImage.replace("/upload","/upload/w_250");
    const bloodGroupStock = Object.fromEntries(listing.bloodGroupStock || []);
    const hasBloodGroupStock = Object.keys(bloodGroupStock).length > 0;
    const totalBloodStock = hasBloodGroupStock
        ? Object.values(bloodGroupStock).reduce((total, units) => total + Number(units), 0)
        : Number(listing.bloodStock ?? listing.price ?? 0);
    res.render("listings/edit.ejs",{
        listing,
        originalUrlImage,
        bloodGroups,
        bloodGroupStock,
        totalBloodStock
    });
}



module.exports.updateListing = async(req,res)=>{
    let {id} = req.params;
    const submittedStock = req.body.Listing.bloodGroupStock || {};
    const selectedGroups = Array.isArray(req.body.Listing.bloodGroups)
        ? req.body.Listing.bloodGroups
        : [req.body.Listing.bloodGroups];
    const bloodGroupStock = Object.fromEntries(
        Object.entries(submittedStock)
            .filter(([group, units]) => selectedGroups.includes(group) && units !== "")
            .map(([group, units]) => [group, Number(units)])
    );

    req.body.Listing.bloodGroupStock = bloodGroupStock;
    if (Object.keys(bloodGroupStock).length > 0) {
        req.body.Listing.bloodStock = Object.values(bloodGroupStock)
            .reduce((total, units) => total + units, 0);
    }

    let listing = await Listing.findByIdAndUpdate(id,{...req.body.Listing});

    


    if(req.file){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
        await listing.save();
    }

    req.flash("success","Listing updated");
    res.redirect("/listings");
}


module.exports.destroyListing =async(req,res)=>{
    let {id} =req.params;
    let deltedListing = await Listing.findByIdAndDelete(id);
    if (deltedListing) {
        await UrgentBloodNotification.deleteMany({
            $or: [
                { requestingHospital: deltedListing._id },
                { recipient: deltedListing._id }
            ]
        });
    }
    console.log(deltedListing);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
}
