const express = require('express');
const route = express.Router();
const scope = require('../models/scope');

// ------------------------------------------------------------------------------------------------------- //

// Scope Setting Coding

route.get('/scopeset', async (req, res) => {

    try {
        const scopeData = await scope.findAll();
        res.json(scopeData);
    } catch (error) {
        console.error('Error fetching scope data : ', error);
        res.status(500).json({ message: 'Failed to fetch scope data', error: error.message });
    }
});


// ------------------------------------------------------------------------------------------------------- //

// Scope Update Coding

route.put('/updateScope', async (req, res) => {

    const { updates } = req.body;
    const staffIds = Object.keys(updates);

    try {

        for (const staffId of staffIds) {
            const updateData = updates[staffId];
            await scope.update(updateData, { where: { staff_id: staffId } });
        }
        res.status(200).send({ success: true, message: 'Scope data updated successfully' });
    }
    catch (error) {
        console.error("Error updating scope data : ", error);
        res.status(500).send({ success: false, error: "Failed to update Scope Data" });
    }
})

module.exports = route;