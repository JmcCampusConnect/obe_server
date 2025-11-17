const express = require('express');
const route = express.Router();
const staffmaster = require('../models/staffmaster');
const scope = require('../models/scope');
const hod = require('../models/hod');
const mentor = require('../models/mentor');
const coursemapping = require('../models/coursemapping');
const academic = require('../models/academic');
const report = require('../models/report');
const { Op, where, col, fn, Sequelize } = require('sequelize');

// ------------------------------------------------------------------------------------------------------- //

// Staff Master Display

route.get('/staffdetails', async (req, res) => {
    const staffDetails = await staffmaster.findAll();
    res.json(staffDetails);
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Add

route.post('/newstaff', async (req, res) => {

    const { staff_id, staff_name, staff_dept, staff_category, password, dept_category, permissions } = req.body;

    try {

        const newStaff = await staffmaster.create({
            staff_id: staff_id,
            staff_name: staff_name,
            staff_dept: staff_dept,
            dept_category: dept_category,
            staff_category: staff_category,
            staff_pass: password
        })

        await scope.create({
            staff_id: staff_id, staff_name: staff_name,
            dashboard: permissions.dashboard ? 1 : 0,
            course_list: permissions.course ? 1 : 0,
            relationship_matrix: permissions.rsm ? 1 : 0,
            course_outcome: permissions.co ? 1 : 0,
            student_outcome: permissions.so ? 1 : 0,
            program_outcome: permissions.po ? 1 : 0,
            program_specific_outcome: permissions.pso ? 1 : 0,
            work_progress_report: permissions.wpr ? 1 : 0,
            input_files: permissions.input ? 1 : 0,
            manage: permissions.manage ? 1 : 0,
            obe_report: permissions.obereport ? 1 : 0,
            settings: permissions.setting ? 1 : 0,
        })
        return res.json({ message: 'New Staff and Permissions Added Successfully', newStaff });
    }
    catch (err) {
        console.error('Error Inserting Data into the DataBase:', err);
        return res.status(500).json({ message: 'Database error' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Updation 

route.put('/staffupdate', async (req, res) => {

    const { newstaffid, newstaffname, newpassword, newdept,
        newStaffCategory, newDeptCategory, oldpassword } = req.body;

    try {

        await staffmaster.update({
            staff_name: newstaffname,
            staff_pass: newpassword || oldpassword,
            staff_dept: newdept,
            staff_category: newStaffCategory,
            dept_category: newDeptCategory
        }, { where: { staff_id: newstaffid }, returning: true })

        const updatedStaff = await staffmaster.findOne({ where: { staff_id: newstaffid } });

        await coursemapping.update({
            category: newStaffCategory,
            staff_name: newstaffname
        }, { where: { staff_id: newstaffid } })

        await report.update({
            category: newStaffCategory,
            staff_name: newstaffname
        }, { where: { staff_id: newstaffid } })

        await hod.update({
            category: newStaffCategory,
            hod_name: newstaffname
        }, { where: { staff_id: newstaffid } })

        await mentor.update({
            category: newStaffCategory,
            staff_name: newstaffname
        }, { where: { staff_id: newstaffid } })

        res.json({ message: 'Staff Updated Successfully', updatedStaff })
    }
    catch (err) { console.log("Error while Update", err) }
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Deletion

route.post('/staffdelete', async (req, res) => {

    const { deletestaffid } = req.body;

    try {
        await staffmaster.destroy({ where: { staff_id: deletestaffid } })
        await coursemapping.destroy({ where: { staff_id: deletestaffid } })
        await mentor.destroy({ where: { staff_id: deletestaffid } })
        await hod.destroy({ where: { staff_id: deletestaffid } })
        await scope.destroy({ where: { staff_id: deletestaffid } })
        await report.destroy({ where: { staff_id: deletestaffid } })
        res.json({ message: "Staff Successfully Deleted" })
    }
    catch (err) { console.log("Error in Deleting Staff : ", err) }
})

// ------------------------------------------------------------------------------------------------------- //

// Tutor Display

route.get('/mentor', async (req, res) => {

    try {

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })
        const mentorData = await mentor.findAll({ where: { academic_sem: activeAcademic.academic_sem } })
        const allStaff = await staffmaster.findAll({ attributes: ['staff_id', 'staff_name'] })
        const staffDeptDetails = await mentor.findAll({ attributes: ['graduate', 'dept_id', 'category', 'degree', 'dept_name', 'section', 'batch'] })
        res.json({ mentorData: mentorData, staff_data: allStaff, 'deptDetails': staffDeptDetails });
    }
    catch (err) {
        console.error('Error in fetching tutor details : ', err);
        res.status(500).json({ error: 'An error occurred while fetching data from the Mentor Table.' });
    }
})

// ---------------------------------D---------------------------------------------------------------------- //

// Tutor Add

route.post('/newtutoradded', async (req, res) => {

    try {

        const { staff_id, staff_name, graduate, category, dept_name, dept_id, batch, degree, section } = req.body;

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })
        const academic_sem = activeAcademic.academic_sem
        const academic_year = activeAcademic.academic_year

        const existTutor = await mentor.findAll({
            where: {
                staff_id, staff_name, graduate, category, academic_year,
                dept_id, dept_name, batch, degree, section, academic_sem
            }
        })

        if (existTutor.length > 0) { return res.status(409).json({ message: "Tutor Already Exists" }) }

        const newMentorCreated = await mentor.create({
            staff_id, staff_name, graduate, category, academic_year,
            dept_id, dept_name, batch, degree, section, academic_sem
        })

        res.status(201).json({ message: "New Tutor Added", mentor: newMentorCreated });
    }
    catch (err) {
        console.error('Error in adding new tutor : ', err);
        res.status(500).json({ error: "An error occurred while adding the record." });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Tutor Edit

route.put("/mentor/:id", async (req, res) => {

    const { batch, staff_name, category, academic_sem, academic_year, degree, dept_name, section, s_no, staff_id } = req.body;

    try {

        const [updated] = await mentor.update(
            { batch, staff_name, category, degree, dept_name, section, staff_id },
            { where: { s_no: s_no, academic_sem, academic_year } }
        )
        if (updated) { res.status(200).json({ message: 'Mentor with staff ID ${id} updated successfully.' }) }
        else { res.status(404).json({ error: 'Mentor with staff ID ${id} not found.' }) }
    }
    catch (err) {
        console.error('Error in updating tutor : ', err);
        res.status(500).json({ error: "An error occurred while updating the record." });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Tutor Delete

route.delete('/mentor/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        const deleted = await mentor.destroy({
            where: { staff_id: id, academic_sem: activeAcademic.academic_sem }
        })

        if (deleted) { res.status(200).json({ message: `Mentor with Staff Id ${id} deleted Successfully.` }) }
        else { res.json({ error: `Mentor with Staff Id ${id} not found.` }) }

    }
    catch (err) {
        console.error('Error in deleting tutor : ', err);
        res.status(500).json({ error: "An error occurred while deleting the record." });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Hod Display

route.get('/hod', async (req, res) => {

    try {
        const hodData = await hod.findAll();
        res.json(hodData);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching data from the HOD Table.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Dropdown Values for Hod

route.get('/hodDropDownValues', async (req, res) => {

    try {

        const uniqueStaffs = await staffmaster.findAll({
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('staff_id')), 'staff_id'], 'staff_name'
            ],
            raw: true
        });

        const uniqueDepts = await coursemapping.findAll({
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('dept_id')), 'dept_id'], 'dept_name'
            ],
            raw: true
        })

        return res.status(200).json({ uniqueDepts, uniqueStaffs });

    } catch (error) {
        console.log('Error in fetching Hod Dropdown values : ', error);
        return res.status(500).json({ message: 'Error fetching values' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// New Hod Add

route.post('/newhodadded', async (req, res) => {

    const { staff_id, hod_name, category, dept_id, dept_name, graduate } = req.body;
    // console.log(req.body)

    try {

        const existhod = await hod.findAll({
            where: { staff_id, hod_name, graduate, dept_id, category, dept_name }
        })

        if (existhod.length > 0) { res.json({ message: "Hod Already exist" }) }

        else {
            const newHod = await hod.create({ staff_id, hod_name, graduate, dept_id, category, dept_name })
            res.json({ message: "New Hod Added", newHod })
        }
    }
    catch (err) { console.error("Error adding HOD : ", err) }
})

// ------------------------------------------------------------------------------------------------------- //

// Hod Update

route.put('/hod/:id', async (req, res) => {

    const { id } = req.params;
    const { hod_name, graduate, dept_id, category, dept_name, s_no, staff_id } = req.body;
    // console.log(req.body, req.params)

    try {
        const [updated] = await hod.update(
            { hod_name, graduate, dept_id, category, dept_name, staff_id },
            { where: { s_no: s_no } }
        )
        // console.log(updated)
        if (updated) {
            res.status(200).json({ message: `HOD with staff ID ${id} updated Successfully.` });
        }
        else {
            res.status(404).json({ error: `HOD with staff ID ${id} not found.` });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while updating the record.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Hod Delete

route.delete('/hod/:id', async (req, res) => {

    const { dept_id, staff_id, category, graduate } = req.body;
    // console.log(req.body)

    try {

        const deleted = await hod.destroy({ where: { staff_id, dept_id, category, graduate } })
        // console.log(deleted)

        if (deleted) {
            res.status(200).json({ message: `HOD with staff ID ${staff_id} deleted successfully.` });
            const scopeFind = await hod.findAll({ where: { staff_id } })
            if (scopeFind.length > 0) { return null }
            else { await scope.update({ hod_report: 0 }, { where: { staff_id } }) }
        }
        else { res.status(404).json({ error: `HOD with staff ID ${staff_id} not found.` }) }
    }
    catch (err) {
        console.error('Error in deleting Hod : ', err);
        res.status(500).json({ error: 'An error occurred while deleting the record.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

route.get('/staffdepartments', async (req, res) => {

    try {
        const dept_category = await staffmaster.findAll({
            attributes: [[fn('DISTINCT', col('staff_dept')), 'staff_dept']]
        });

        if (dept_category.length > 0) {
            res.json(dept_category);
        } else {
            console.log("No Staff Department Data Found");
            res.status(404).json({ message: "No Staff Department Data Found" });
        }
    } catch (err) {
        console.error("Server Error in staffdepartments route:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
})

// ------------------------------------------------------------------------------------------------------- //

route.get('/getstaff', async (req, res) => {

    const { newTuturId } = req.query;

    try {

        if (!newTuturId || newTuturId.trim() === "") {
            return res.status(400).json({ message: "Invalid or missing newTuturId" });
        }

        const staff_get = await staffmaster.findAll({
            where: { staff_id: { [Op.like]: `%${newTuturId.trim()}%` } },
            attributes: ['staff_id']
        })

        if (staff_get.length === 0) {
            return res.status(404).json({ message: "No staff found" });
        }
        res.status(200).json(staff_get);
    }
    catch (error) {
        console.error("Error fetching staff : ", error);
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Data from Staff Master

route.get('/staffdata', async (req, res) => {

    try {

        const { newTuturId } = req.query;

        if (!newTuturId || newTuturId.trim() === "") { return res.status(400).json({ message: "Invalid or missing newTuturId" }) }

        const staff_get = await staffmaster.findAll({ where: { staff_id: newTuturId } })

        if (staff_get.length > 0) { res.json(staff_get) }
        else { res.status(404).json({ message: "Staff not found" }) }
    }
    catch (err) { console.log('Error in Tutor : ', err) }
})

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;