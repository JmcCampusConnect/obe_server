const express = require('express');
const route = express.Router();
const report = require('../models/report');
const coursemapping = require('../models/coursemapping');
const rsmatrix = require('../models/rsmatrix');
const staffmaster = require('../models/staffmaster');
const academic =require('../models/academic');
const markentry = require('../models/markentry');

// ------------------------------------------------------------------------------------------------------- //

// Report Department Name Fetching Coding

route.post('/statusDeptName', async (req, res) => 
{
    const { academicSem } = req.body;

    try 
    {
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

route.post('/deptstatusreport', async (req, res) => 
{
    const { academic_sem, dept_name } = req.body;

    try 
    {
        let deptReportStatus;

        if (dept_name === "ALL") 
        {
            const reportData = await report.findAll({
                where: { academic_sem: academic_sem }
            });

            const staff = await coursemapping.findAll();

            const staffDetails = await Promise.all(staff.map(async (staffMember) => 
            {
                const staffDept = await staffmaster.findOne({
                    where: { staff_id: staffMember.staff_id },
                    attributes: ['staff_dept']
                })
                return {
                    ...staffMember.toJSON(),
                    dept_name: staffDept ? staffDept.staff_dept : 'unknown'
                }
            }))

            deptReportStatus = reportData.map(match => 
            {
                const matchStaff = staffDetails.find(
                    staff => staff.staff_id === match.staff_id && staff.course_code === match.course_code
                )
                return {
                    ...match.toJSON(),
                    staff_name: matchStaff ? matchStaff.staff_name : 'unknown',
                    dept_id: matchStaff ? matchStaff.dept_id : 'unknown',
                    dept_name: matchStaff ? matchStaff.dept_name : 'unknown'
                }
            })
        } 
        else 
        {
            const reportData = await report.findAll({
                where: {
                    academic_sem: academic_sem,
                    dept_name: dept_name
                }
            })

            const staff = await coursemapping.findAll();

            const staffDetails = await Promise.all(staff.map(async (staffMember) => 
            {
                const staffDept = await staffmaster.findOne({
                    where: { staff_id: staffMember.staff_id },
                    attributes: ['staff_dept']
                })
                return {
                    ...staffMember.toJSON(),
                    dept_name: staffDept ? staffDept.staff_dept : 'unknown'
                }
            }))

            deptReportStatus = reportData.map(match => 
            {
                const matchStaff = staffDetails.find(
                    staff => staff.staff_id === match.staff_id && staff.course_code === match.course_code
                )
                return {
                    ...match.toJSON(),
                    staff_name: matchStaff ? matchStaff.staff_name : 'unknown',
                    dept_id: matchStaff ? matchStaff.dept_id : 'unknown',
                    dept_name: matchStaff ? matchStaff.dept_name : 'unknown'
                }
            })
        }
        res.json(deptReportStatus);
    } 
    catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Matrix Status Report Fetching Coding

route.post('/allmatrixreport', async (req, res) => 
{
    const { academic_sem } = req.body;

    try 
    {
        const matrixAllReport = await coursemapping.findAll({
            where: { academic_sem: academic_sem }
        })

        if (!matrixAllReport) {
            throw new Error('No matrix report found.');
        }

        const rsMatrix = await rsmatrix.findAll({ where: { academic_sem: academic_sem }});

        if (!rsMatrix) {
            throw new Error('No rsmatrix data found.');
        }

        const reportWithStatus = matrixAllReport.map(report => 
        {
            const isCompleted = rsMatrix.some(matrix => matrix.course_code === report.course_code);
            return {
                ...report.dataValues,
                status: isCompleted ? 'Completed' : 'Incomplete'
            }
        })
        res.json(reportWithStatus);
    }
    catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Matrix Completed Count

route.post('/matrixcount', async (req, res) => 
{
    const { academic_sem } = req.body;

    try 
    {
        const uniqueCourseCount = await coursemapping.count({
            where: {
                academic_sem: academic_sem,
            },
            distinct: true,
            col: 'course_code'
        })

        const completeCount = await rsmatrix.count({
            where: {
                academic_sem: academic_sem,
            },
            distinct: true,
            col: 'course_code'
        })
        res.json({uniqueCourseCount, completeCount});
    }
    catch (err) {
        console.error('Error Fetching Data:', err);
        res.status(500).send('Error Fetching Data');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Ese Incomplete Code

route.get('/esereport', async (req, res) => 
{
    try 
    {
        const academicdata = await academic.findOne({
            where: { active_sem: 1 },
        })

        const markentryData = await markentry.findAll(
        {
            where: {
                academic_sem: String(academicdata.academic_sem),
            },
            attributes: ['course_code', 'ese_lot', 'ese_mot', 'ese_hot', 'ese_total'],
        })

        const uniqueCourseCodes = [...new Set(markentryData.map((entry) => entry.course_code))];

        const validCourseCodes = [];

        for (let course_code of uniqueCourseCodes) 
        {
            const courseRows = markentryData.filter((entry) => entry.course_code === course_code);

            const allEseValuesNotNull = courseRows.some(
                (row) =>
                    row.ese_lot !== null &&
                    row.ese_mot !== null &&
                    row.ese_hot !== null &&
                    row.ese_total !== null
            )

            if(!allEseValuesNotNull)
            {
                validCourseCodes.push(course_code);
            }
        }

        const codeAndTitle = await coursemapping.findAll(
        {
            where: {
                course_code: validCourseCodes, 
            },
            attributes: ['course_code', 'course_title'], 
        })

        const uniqueCodeAndTitle = Array.from(
            new Map(
                codeAndTitle.map((item) => [item.course_code, item])
            ).values()
        )
        res.status(200).json({ courses: uniqueCodeAndTitle });
    } 
    catch (error) {
        console.error('Error Processing Ese Report :', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = route;