const express = require ('express');
const route = express.Router();
const staffmaster = require('../models/staffmaster');

// ------------------------------------------------------------------------------------------------------- //

// Scope Setting Coding

route.post('/passwordchange', async (req, res) => 
{
    const { staff_id, staff_pass } = req.body;

    try 
    {
        const user = await staffmaster.findOne({
            where: { staff_id: staff_id }
        });
        if (user) 
        {
            await user.update({ staff_pass: staff_pass });
            return res.json({ success: true, message: "Password Updated Successfully" });
        }
    } 
    catch (error) {
        console.error('Error during Password Update:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
})
 
module.exports = route;