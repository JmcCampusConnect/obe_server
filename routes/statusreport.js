const express = require('express');
const route = express.Router();
const report = require('../models/report');
const coursemapping = require('../models/coursemapping');
const rsmatrix = require('../models/rsmatrix');
const staffmaster = require('../models/staffmaster');
const academic = require('../models/academic');
const markentry = require('../models/markentry');
const { Sequelize } = require('sequelize');

// ------------------------------------------------------------------------------------------------------- //

// Report Department Name Fetching Coding

route.post('/statusDeptName', async (req, res) => {

    const { academicSem } = req.body;

    try {
        const reportDeptMapping = await report.findAll({
            where: { academic_sem: academicSem },
            attributes: ['dept_name']
        })
        const uniqueDeptNames = [...new Set(reportDeptMapping.map(item => item.dept_name))];
        res.json(uniqueDeptNames);
    }
    catch (err) {
        res.status(500).json({ error: 'An error occurred while Fetching Data.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Department Status Report Fetching Coding

route.post('/deptstatusreport', async (req, res) => {

    const { academic_sem, dept_name } = req.body;

    try {

        let deptReportStatus;

        if (dept_name === "ALL") {

            const reportData = await report.findAll({ where: { academic_sem: academic_sem } });
            const staff = await coursemapping.findAll();

            const staffDetails = await Promise.all(staff.map(async (staffMember) => {
                const staffDept = await staffmaster.findOne({
                    where: { staff_id: staffMember.staff_id },
                    attributes: ['staff_dept']
                })
                return {
                    ...staffMember.toJSON(), course_title: staffMember.course_title || '',
                    dept_name: staffDept ? staffDept.staff_dept : 'unknown',
                }
            }))

            deptReportStatus = reportData.map(match => {
                const matchStaff = staffDetails.find(
                    staff => staff.staff_id === match.staff_id && staff.course_code === match.course_code
                )
                return {
                    ...match.toJSON(),
                    staff_name: matchStaff ? matchStaff.staff_name : 'unknown',
                    dept_id: matchStaff ? matchStaff.dept_id : 'unknown',
                    dept_name: matchStaff ? matchStaff.dept_name : 'unknown',
                    course_title: matchStaff ? matchStaff.course_title : ''
                }
            })
        }
        else {

            const reportData = await report.findAll({ where: { academic_sem: academic_sem, dept_name: dept_name } })
            const staff = await coursemapping.findAll();

            const staffDetails = await Promise.all(staff.map(async (staffMember) => {
                const staffDept = await staffmaster.findOne({
                    where: { staff_id: staffMember.staff_id },
                    attributes: ['staff_dept']
                })
                return {
                    ...staffMember.toJSON(),
                    dept_name: staffDept ? staffDept.staff_dept : 'unknown'
                }
            }))

            deptReportStatus = reportData.map(match => {
                const matchStaff = staffDetails.find(
                    staff => staff.staff_id === match.staff_id && staff.course_code === match.course_code
                )
                return {
                    ...match.toJSON(),
                    staff_name: matchStaff ? matchStaff.staff_name : 'unknown',
                    dept_id: matchStaff ? matchStaff.dept_id : 'unknown',
                    dept_name: matchStaff ? matchStaff.dept_name : 'unknown',
                    course_title: matchStaff ? matchStaff.course_title : ''
                }
            })
        }
        res.json(deptReportStatus);
    }
    catch (err) {
        console.error('Error fetching dept report data : ', err);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Matrix Status Report Fetching Coding

route.post('/allmatrixreport', async (req, res) => {

    const { academic_sem } = req.body;

    try {

        const matrixAllReport = await coursemapping.findAll({ where: { academic_sem: academic_sem } })
        if (!matrixAllReport) { throw new Error('No matrix report found.') }
        const rsMatrix = await rsmatrix.findAll();
        if (!rsMatrix) { throw new Error('No rsmatrix data found.') }

        const reportWithStatus = matrixAllReport.map(report => {
            const isCompleted = rsMatrix.some(matrix => matrix.course_code === report.course_code);
            return { ...report.dataValues, status: isCompleted ? 'Completed' : 'Incomplete' }
        })
        res.json(reportWithStatus);
    }
    catch (err) {
        console.error('Error fetching martic report data : ', err);
        res.status(500).send('Error fetching data');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Matrix Completed Count

route.post('/matrixcount', async (req, res) => {

    const { academic_sem } = req.body;

    try {

        const courses = await coursemapping.findAll({
            where: { academic_sem },
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('course_code')), 'course_code']
            ],
            raw: true
        });

        const courseCodeList = courses.map(item => item.course_code);
        const completeCount = await rsmatrix.count({
            where: { course_code: courseCodeList },
            distinct: true,
            col: 'course_code'
        });

        const uniqueCourseCount = courseCodeList.length;
        res.json({ uniqueCourseCount, completeCount });
    }
    catch (err) {
        console.error('Error fetching matrix count : ', err);
        res.status(500).send('Error Fetching Data');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Ese Incomplete Code

route.get('/esereport', async (req, res) => {

    try {

        const academicData = await academic.findOne({ where: { active_sem: 1 } });
        if (!academicData) {
            return res.status(404).json({ message: 'Active semester not found' });
        }

        const markEntries = await markentry.findAll({
            where: { academic_sem: String(academicData.academic_sem) },
            attributes: ['course_code', 'ese_lot', 'ese_mot', 'ese_hot', 'ese_total'],
        });

        const courseStatusMap = {};
        markEntries.forEach(entry => {
            if (!courseStatusMap[entry.course_code]) {
                courseStatusMap[entry.course_code] = 'Complete';
            }
            if (
                entry.ese_lot === null ||
                entry.ese_mot === null ||
                entry.ese_hot === null ||
                entry.ese_total === null
            ) {
                courseStatusMap[entry.course_code] = 'Incomplete';
            }
        });

        const coursesWithTitles = await coursemapping.findAll({
            where: { course_code: Object.keys(courseStatusMap) },
            attributes: ['course_code', 'course_title'],
        });

        const resultMap = new Map();
        coursesWithTitles.forEach(course => {
            resultMap.set(course.course_code, {
                course_code: course.course_code,
                course_title: course.course_title,
                status: courseStatusMap[course.course_code] || 'Incomplete',
            });
        });

        const result = Array.from(resultMap.values());
        res.status(200).json({ courses: result });

    } catch (error) {
        console.error('Error processing Ese report : ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;