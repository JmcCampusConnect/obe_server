const express = require('express');
const route = express.Router();
const markentry = require('../models/markentry');
const studentmaster = require('../models/studentmaster');
const calculation = require('../models/calculation');
const academic = require('../models/academic');
const mentor = require('../models/mentor');
const coursemapping = require('../models/coursemapping');
const hod = require('../models/hod');
const chalk = require("chalk").default;

// -----------------------------------------------------------------------
// Helper: Get unique values from array of objects
// -----------------------------------------------------------------------

const getUniqueValues = (data, key) => [...new Set(data.map(entry => entry[key]))];

// -----------------------------------------------------------------------
// Helper: Calculate category attainment (NO database queries inside)
// -----------------------------------------------------------------------

function calculateCategory(percentage, calcData) {
    if (!calcData) return 0;
    if (percentage >= calcData.so_l3_ug) return 3;
    if (percentage >= calcData.so_l2_ug) return 2;
    if (percentage >= calcData.so_l1_ug) return 1;
    if (percentage > calcData.so_l0_ug) return 0;
    return 0;
}

// -----------------------------------------------------------------------
// COMMON STUDENT OUTCOME FUNCTION (optimized with single DB fetches)
// -----------------------------------------------------------------------

async function getStudentOutcome({ academicSem, semester, dept_id, category, section, staff_id }) {

    // 1. Get all students in the class
    const students = await studentmaster.findAll({
        where: { semester, dept_id, category, section },
        attributes: ['reg_no']
    });
    const stud_regs = students.map(s => s.reg_no);
    if (stud_regs.length === 0) return [];

    // 2. Get course codes for this staff (if staff_id provided)
    let course_codes = [];
    if (staff_id) {
        const courseMapping = await coursemapping.findAll({
            where: { academic_sem: academicSem, semester, dept_id, category, section, staff_id },
            attributes: ['course_code']
        });
        course_codes = courseMapping.map(m => m.course_code);
        if (course_codes.length === 0) return [];
    }

    // 3. Fetch mark entries
    const markWhere = { reg_no: stud_regs, academic_sem: academicSem };
    if (staff_id && course_codes.length) markWhere.course_code = course_codes;
    const marks = await markentry.findAll({ where: markWhere });
    if (marks.length === 0) return [];

    // 4. Fetch academic and calculation data ONCE
    const academicData = await academic.findOne({ where: { active_sem: 1 } });
    if (!academicData) throw new Error("Active academic semester not found");
    const calcData = await calculation.findOne({ where: { academic_sem: academicData.academic_sem } });
    if (!calcData) throw new Error("Calculation thresholds not found");

    // 5. Process each mark entry
    const calculatedData = marks.map(entry => {
        const {
            c1_lot = 0, c2_lot = 0, a1_lot = 0, a2_lot = 0, ese_lot = 0,
            c1_mot = 0, c2_mot = 0, ese_mot = 0,
            c1_hot = 0, c2_hot = 0, ese_hot = 0
        } = entry.dataValues;

        const lot_total = (calcData.c1_lot || 0) + (calcData.c2_lot || 0) + (calcData.a1_lot || 0) + (calcData.a2_lot || 0);
        const mot_total = (calcData.c1_mot || 0) + (calcData.c2_mot || 0);
        const hot_total = (calcData.c1_hot || 0) + (calcData.c2_hot || 0);
        const cia_weightage = calcData.cia_weightage || 0;
        const ese_weightage = calcData.ese_weightage || 0;

        const lot_percentage = ((c1_lot + c2_lot + a1_lot + a2_lot) / (lot_total || 1)) * 100;
        const mot_percentage = ((c1_mot + c2_mot) / (mot_total || 1)) * 100;
        const hot_percentage = ((c1_hot + c2_hot) / (hot_total || 1)) * 100;
        const elot_percentage = (ese_lot / (calcData.e_lot || 1)) * 100;
        const emot_percentage = (ese_mot / (calcData.e_mot || 1)) * 100;
        const ehot_percentage = (ese_hot / (calcData.e_hot || 1)) * 100;

        const lot_attainment = calculateCategory(lot_percentage, calcData);
        const mot_attainment = calculateCategory(mot_percentage, calcData);
        const hot_attainment = calculateCategory(hot_percentage, calcData);
        const elot_attainment = calculateCategory(elot_percentage, calcData);
        const emot_attainment = calculateCategory(emot_percentage, calcData);
        const ehot_attainment = calculateCategory(ehot_percentage, calcData);

        const overAll_lot = (lot_attainment * (cia_weightage / 100)) + (elot_attainment * (ese_weightage / 100));
        const overAll_mot = (mot_attainment * (cia_weightage / 100)) + (emot_attainment * (ese_weightage / 100));
        const overAll_hot = (hot_attainment * (cia_weightage / 100)) + (ehot_attainment * (ese_weightage / 100));

        const avg = (overAll_lot + overAll_mot + overAll_hot) / 3;
        let final_grade = "N / A";
        if (avg >= 2.5) final_grade = "High";
        else if (avg >= 1.5) final_grade = "Medium";
        else if (avg >= 0) final_grade = "Low";

        return {
            ...entry.dataValues,
            lot_percentage, mot_percentage, hot_percentage,
            elot_percentage, emot_percentage, ehot_percentage,
            lot_attainment, mot_attainment, hot_attainment,
            elot_attainment, emot_attainment, ehot_attainment,
            overAll_lot, overAll_mot, overAll_hot,
            final_grade
        };
    });

    return calculatedData;
    
}

// -----------------------------------------------------------------------
// ROUTES (only the ones actually used – cleaned up duplicates)
// -----------------------------------------------------------------------

// Check staff role

route.post('/checkstaffId', async (req, res) => {

    const { staff_id } = req.body;

    try {
        const academicdata = await academic.findOne({ where: { active_sem: 1 } });
        const courseHandleStaffId = await coursemapping.findOne({
            where: { staff_id, academic_sem: academicdata.academic_sem }
        });
        const tutorHandleStaffId = await mentor.findOne({
            where: { staff_id, academic_year: academicdata.academic_year }
        });
        const hodHandleStaffId = await hod.findOne({ where: { staff_id } });
        res.json({ courseHandleStaffId, tutorHandleStaffId, hodHandleStaffId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Get unique filter values for markentry (used elsewhere)

route.get('/markentry', async (req, res) => {

    try {

        const entries = await markentry.findAll({
            attributes: ['batch', 'active_sem', 'dept_id', 'category', 'course_code']
        });
        res.json({
            batch: getUniqueValues(entries, 'batch'),
            academic_sem: getUniqueValues(entries, 'active_sem'),
            dept_id: getUniqueValues(entries, 'dept_id'),
            category: getUniqueValues(entries, 'category'),
            course_code: getUniqueValues(entries, 'course_code')
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching mark entries' });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Academic years

route.get("/academic", async (req, res) => {
    try {
        const data = await academic.findAll();
        res.json({ academic_data: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching academic data." });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Course mapping (generic, used by frontend dropdowns)

route.get("/coursemapping", async (req, res) => {
    try {
        const { academic_sem, category, dept_name, dept_id, section, semester } = req.query;
        const filters = {};
        if (academic_sem) filters.academic_sem = academic_sem;
        if (category) filters.category = category;
        if (dept_name) filters.dept_name = dept_name;
        if (dept_id) filters.dept_id = dept_id;
        if (semester) filters.semester = semester;
        if (section) filters.section = section;
        const data = await coursemapping.findAll({ where: filters });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching course mapping data." });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// HOD department

route.post("/hodDept", async (req, res) => {
    const { staff_id, category } = req.body;
    try {
        const hodDept = await hod.findAll({
            where: { staff_id, category },
            attributes: ['dept_name'],
            raw: true
        });
        const uniqueDept = [...new Set(hodDept.map(h => h.dept_name))];
        res.json(uniqueDept);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching HOD department." });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Unique sections

route.get('/studentmaster', async (req, res) => {
    try {
        const students = await studentmaster.findAll({ attributes: ['section'] });
        const uniqueSections = [...new Set(students.map(s => s.section))];
        res.json(uniqueSections);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching sections' });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Tutor details

route.post('/tutordetails', async (req, res) => {

    const { staffId } = req.body;

    try {

        const ac = await academic.findOne({ where: { active_sem: 1 } });
        const tutorDetails = await mentor.findOne({
            where: { staff_id: staffId, academic_year: ac.academic_year }
        });
        const maxSemester = await studentmaster.max('semester', {
            where: {
                dept_id: tutorDetails.dept_id,
                section: tutorDetails.section,
                category: tutorDetails.category,
                batch: tutorDetails.batch,
            }
        });
        res.json({ tutorDetails, studentSem: { semester: maxSemester } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching tutor details' });
    }
});

// ------------------------------------------------------------------------------------------------------- //

//  Categories for a staff 

route.get('/category/:staffId', async (req, res) => {

    const { staffId } = req.params;
    try {
        const staffCategory = await coursemapping.findAll({
            where: { staff_id: staffId }
        });
        res.json(staffCategory);
    } catch (err) {
        console.error("Error fetching category:", err);
        res.status(500).json({ error: "Error fetching category" });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Course mapping for student outcome dropdowns (supports all filter combos)

route.get("/stucoursemapping", async (req, res) => {

    try {

        const { academic_sem, category, dept_name, dept_id, section, semester, staff_id } = req.query;
        const filters = {};
        if (academic_sem) filters.academic_sem = academic_sem;
        if (staff_id) filters.staff_id = staff_id;
        if (category) filters.category = category;
        if (dept_name) filters.dept_name = dept_name;
        if (dept_id) filters.dept_id = dept_id;
        if (section) filters.section = section;
        if (semester) filters.semester = semester;
        const data = await coursemapping.findAll({ where: filters });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching course mapping data." });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// HOD categories

route.get('/hoddata', async (req, res) => {

    const { staffId } = req.query;

    try {

        const hoddata = await hod.findAll({
            where: { staff_id: staffId },
            attributes: ['category'],
            raw: true
        });
        const uniqueCategory = [...new Set(hoddata.map(h => h.category))];
        res.json(uniqueCategory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching HOD data" });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Classes for a given academicSem + category + department

route.get('/courseid', async (req, res) => {

    const { academicSem, categories, departments } = req.query;

    if (!academicSem || !categories || !departments) {
        return res.status(400).json({ error: "Missing required parameters." });
    }
    try {
        const classes = await coursemapping.findAll({
            where: {
                academic_sem: academicSem,
                category: categories,
                dept_name: departments
            }
        });
        res.json(classes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch class data" });
    }
});

// -----------------------------------------------------------------------
// MAIN STUDENT OUTCOME ENDPOINT (single endpoint, reused for all roles)
// -----------------------------------------------------------------------

route.post('/staffstuoutcome', async (req, res) => {

    const { academicSem, selectedCategory, selectedClass, selectedSection, selectedSemester, staffId } = req.body;

    try {
        const data = await getStudentOutcome({
            academicSem: academicSem,
            semester: selectedSemester,
            dept_id: selectedClass,
            category: selectedCategory,
            section: selectedSection,
            staff_id: staffId
        });
        res.json(data);
    } catch (error) {
        console.error('Error in /staffstuoutcome:', error);
        res.status(500).json({ message: error.message || 'Error fetching student outcome' });
    }
});

// -----------------------------------------------------------------------
// Additional endpoints for other roles (they reuse the same function)
// -----------------------------------------------------------------------

route.post('/adminstuoutcome', async (req, res) => {

    const { academicSem, selectedCategory, selectedClass, selectedSection, selectedSemester } = req.body;

    try {
        const data = await getStudentOutcome({
            academicSem, semester: selectedSemester, dept_id: selectedClass,
            category: selectedCategory, section: selectedSection
        });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// ------------------------------------------------------------------------------------------------------- //

route.post('/tutorstuoutcome', async (req, res) => {
    const { category, deptId, semester, section, academicSem } = req.body;
    try {
        const data = await getStudentOutcome({
            academicSem, semester, dept_id: deptId, category, section
        });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// ------------------------------------------------------------------------------------------------------- //

route.post('/hoduoutcome', async (req, res) => {

    const { category, deptId, semester, section, academicSem } = req.body;

    try {
        const data = await getStudentOutcome({
            academicSem, semester, dept_id: deptId, category, section
        });
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;