const express = require('express');
const route = express.Router();
const { Op } = require('sequelize');
const mentor = require('../models/mentor');
const report = require('../models/report');
const academic = require('../models/academic');
const coursemapping = require('../models/coursemapping');

// ------------------------------------------------------------------------------------------------------- //

// Dept Status Coding

route.post('/tutorStatusReport', async (req, res) => 
{
    const { staff_id } = req.body;

    // console.log(staff_id)

    try {

        const academicdata = await academic.findOne({
            where: { active_sem: 1 }
        })

        const user = await mentor.findOne({
            where: {
                staff_id: staff_id,
                academic_year: academicdata.academic_year
            },
            attributes: ['dept_id', 'category', 'section', 'batch'],
            raw: true
        })

        // console.log(user);

        const courseInfo = await coursemapping.findAll({
            where: {
                category: user.category,
                section: user.section,
                dept_id: user.dept_id,
                batch: user.batch,
                academic_sem: academicdata.academic_sem
            },
            raw: true
        })

        // console.log(courseInfo);

        const reportDetails = await Promise.all(courseInfo.map(async (details) => {

            const reportInfo = await report.findOne({
                where: {
                    staff_id: details.staff_id,
                    course_code: details.course_code,
                    category: details.category,
                    section: details.section,
                    dept_name: details.dept_name,
                    academic_sem: academicdata.academic_sem,
                },
                raw: true
            })
            return {

                ...details,
                cia_1: reportInfo.cia_1 === 2 ? 'Completed' : reportInfo.cia_1 === 1 ? 'Processing' : 'Incomplete',
                cia_2: reportInfo.cia_2 === 2 ? 'Completed' : reportInfo.cia_2 === 1 ? 'Processing' : 'Incomplete',
                ass_1: reportInfo.ass_1 === 2 ? 'Completed' : reportInfo.ass_1 === 1 ? 'Processing' : 'Incomplete',
                ass_2: reportInfo.ass_2 === 2 ? 'Completed' : reportInfo.ass_2 === 1 ? 'Processing' : 'Incomplete',
                semester: reportInfo ?
                    (reportInfo.semester === 1 || reportInfo.semester === 2) ? 1 :
                    (reportInfo.semester === 3 || reportInfo.semester === 4) ? 2 : 3 : 'N/A'
            }
        }))
        res.json(reportDetails);
    }
    catch (err) { }
})

module.exports = route;