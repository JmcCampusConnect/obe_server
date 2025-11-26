const express = require('express');
const router = express.Router();
const coursemapping = require('../models/coursemapping');
const report = require('../models/report');
const academic = require('../models/academic');

// ------------------------------------------------------------------------------------------------------- //

// Get all staff course details

router.get('/staffcoursemanage', async (req, res) => {

    try {

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        const staffcourse = await coursemapping.findAll({
            where: { academic_sem: activeAcademic.academic_sem },
        })
        res.json(staffcourse);
    }
    catch (error) {
        console.error('Error fetching Staff Course Data :', error);
        res.status(500).json({ error: 'Error fetching Staff Data' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Fetch Staff Id

router.get('/staffId', async (req, res) => {

    try {

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        const staffData = await coursemapping.findAll({
            where: {
                academic_sem: activeAcademic.academic_sem
            },
            attributes: ['staff_id'],
        })

        const uniqueStaffIds = [...new Set(staffData.map(entry => entry.staff_id))];
        res.json(uniqueStaffIds)
    }
    catch (error) {
        console.error('Error fetching Staff Id :', error);
        res.status(500).json({ error: 'Error fetching Staff Id' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

router.post('/staffname', async (req, res) => {

    try {

        const { staff_id } = req.body;

        const staffData = await coursemapping.findAll({
            where: { staff_id: staff_id },
            attributes: ['staff_name'],
        })

        const uniqueStaffNames = [...new Set(staffData.map(entry => entry.staff_name))];
        res.json(uniqueStaffNames)
    }
    catch (error) {
        console.error('Error fetching Staff Name :', error);
        res.status(500).json({ error: 'Error fetching Staff Name' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

router.post('/depId', async (req, res) => {

    try {

        const { category } = req.body;

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        const deptId = await coursemapping.findAll({
            where: {
                academic_sem: activeAcademic.academic_sem,
                category: category
            },
            attributes: ['dept_id']
        })

        const uniqueDeptIds = [...new Set(deptId.map(entry => entry.dept_id))];
        res.json(uniqueDeptIds)
    }
    catch (error) {
        console.error('Error fetching staff course data:', error);
        res.status(500).json({ error: 'Error fetching staff data' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

router.post('/departmentname', async (req, res) => {

    try {

        const { dept_id } = req.body;

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        const deptData = await coursemapping.findAll({
            where: { dept_id: dept_id },
            attributes: ['dept_name', 'degree']
        });

        const semester = await coursemapping.findAll({
            where: { academic_sem: activeAcademic.academic_sem, dept_id: dept_id },
            attributes: ['semester']
        })

        const uniqueDeptNames = [...new Set(deptData.map(entry => entry.dept_name))];
        const uniqueDegrees = [...new Set(deptData.map(entry => entry.degree))];
        const uniqueSemester = [...new Set(semester.map(entry => entry.semester))];

        // Respond with Dept Id, uniqueDeptNames, uniqueDegrees, and deptData

        res.json({ uniqueDeptNames: uniqueDeptNames, uniqueDegrees: uniqueDegrees, uniqueSemester: uniqueSemester })
    }
    catch (error) {
        console.error('Error fetching Department Data :', error);
        res.status(500).json({ error: 'Error fetching Department Data' });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Fetch section

router.post('/scmsection', async (req, res) => {

    try {
        const { semester, dept_id, category } = req.body;
        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        const section = await coursemapping.findAll({
            where: { academic_sem: activeAcademic.academic_sem, semester: semester, dept_id: dept_id, category: category },
            attributes: ['section', 'course_code']
        })
        const uniqueSection = [...new Set(section.map(entry => entry.section))];
        const uniqueCourse = [...new Set(section.map(entry => entry.course_code))];

        res.json({ section: uniqueSection, courseCode: uniqueCourse })
    }
    catch (error) { console.log(error) }
})

// ------------------------------------------------------------------------------------------------------- //

router.post('/scmcoursetitle', async (req, res) => {

    try {

        const { courseCode } = req.body;
        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        const courseTitle = await coursemapping.findAll({
            where: { course_code: courseCode },
            attributes: ['course_title']
        })
        const batch = await coursemapping.findAll({
            where: { academic_sem: activeAcademic.academic_sem, course_code: courseCode },
            attributes: ['batch']
        })
        const uniqueBatch = [...new Set(batch.map(entry => entry.batch))];

        const uniqueCourseTitle = [...new Set(courseTitle.map(entry => entry.course_title))];

        res.json({ courseTitle: uniqueCourseTitle, batch: uniqueBatch })
    }
    catch (error) {
        console.error('Error fetching Department Data :', error);
        res.status(500).json({ error: 'Error fetching Department Data' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Course Manage Add

router.post('/scmNewStaff', async (req, res) => {

    try {

        const { staff_id, staff_name, category, dept_id, dept_name, degree,
            semester, section, course_code, course_title, batch } = req.body;

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        if (!activeAcademic) { return res.status(404).json({ error: "Active academic year not found" }) }

        const activeSemester = activeAcademic.academic_sem;

        const newStaffCourse = await coursemapping.create({
            staff_id, staff_name, category, dept_id, dept_name,
            degree, semester, section, course_code, course_title,
            batch, academic_sem: activeSemester,
        })

        const newReport = await report.create({
            staff_id, course_code, category, section,
            dept_name, cia_1: 0, cia_2: 0, ass_1: 0,
            ass_2: 0, ese: 0, academic_sem: activeSemester,
        })

        res.status(201).json({ message: "Staff course mapping saved Successfully", data: newStaffCourse })
    }
    catch (error) {
        console.error('Error saving staff course mapping:', error);
        res.status(500).json({ error: 'Error saving staff course mapping' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Course Manage Edit

router.post('/staffCourseEdit', async (req, res) => {

    const editData = req.body;

    if (!editData.s_no) { return res.status(400).json({ ok: false, error: "Missing s_no for update." }) }

    try {
        const {
            s_no, staff_id, staff_name, category, batch, section, dept_id, degree,
            dept_name, semester, course_code, course_title, academic_sem, active_sem
        } = editData;

        const updated = await coursemapping.update(
            {
                staff_id, staff_name, category, batch,
                section, dept_id, degree, dept_name,
                semester, course_code, course_title,
                active_sem: academic_sem || active_sem,
            },
            { where: { s_no } }
        );

        const updatedReport = await report.update(
            { staff_id, course_code, category, section, dept_name },
            { where: { s_no } }
        );

        return res.json({
            ok: true, message: "Updated successfully",
            updated, updatedReport
        });

    } catch (error) {
        console.error('Error updating staff course : ', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Course Manage Delete

router.delete('/deletestaff', async (req, res) => {

    const { staff_id, course_code, category, section, dept_id } = req.query;

    try {

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })

        if (!activeAcademic) { return res.status(404).json({ error: "Active academic year not found" }) }

        const activeSemester = activeAcademic.academic_sem;
        const deptName = await coursemapping.findOne({ where: { dept_id: dept_id } })

        const deletedStaffCourse = await coursemapping.destroy({
            where: {
                staff_id: staff_id, course_code: course_code, dept_id: dept_id,
                category: category, section: section, academic_sem: activeSemester,
            }
        })

        if (!deletedStaffCourse) { return res.status(404).json({ error: "Staff Course Entry not found" }) }

        const deletedreport = await report.destroy({
            where: {
                staff_id: staff_id, course_code: course_code, dept_name: deptName.dept_name,
                category: category, section: section, academic_sem: activeSemester,
            }
        })

        if (!deletedreport) { return res.status(404).json({ error: "Report Entry not found" }) }

        res.status(200).json({ message: "Staff Course and Report has been deleted Successfully" })
    }
    catch (error) {
        console.error("Error deleting Staff Course Entry :", error);
        res.status(500).json({ error: "Error Deleting Staff Course Entry" });
    }
})

// ------------------------------------------------------------------------------------------------------- //

module.exports = router;