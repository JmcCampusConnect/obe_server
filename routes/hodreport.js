const express = require('express');
const route = express.Router();
const { Op } = require('sequelize');
const hod = require('../models/hod');
const report = require('../models/report');
const academic = require('../models/academic');
const coursemapping = require('../models/coursemapping');

// ------------------------------------------------------------------------------------------------------- //

// Dept Status Coding

route.post('/deptStatus', async (req, res) => {

    const { staff_id } = req.body;

    try {
        const academicdata = await academic.findOne({ where: { active_sem: 1 } })

        const user = await hod.findAll({
            where: { staff_id },
            attributes: ['category', 'dept_id', 'dept_name'],
            raw: true
        })

        if (user.length > 0) {

            const reportDetails = [];
            for (const { category, dept_id, dept_name } of user) {
                const reportInfo = await report.findAll({
                    where: {
                        category: category,
                        dept_name: dept_name,
                        academic_sem: academicdata.academic_sem,
                        [Op.or]: [
                            { cia_1: { [Op.in]: [0, 1] } },
                            { cia_2: { [Op.in]: [0, 1] } },
                            { ass_1: { [Op.in]: [0, 1] } },
                            { ass_2: { [Op.in]: [0, 1] } }
                        ]
                    },
                    raw: true
                });

                // console.log(reportInfo.length)

                const courseInfo = await coursemapping.findAll({
                    where: {  category, dept_name, academic_sem: academicdata.academic_sem },
                    raw: true
                });

                // console.log(courseInfo.length)

                const details = reportInfo.map(userReport => {

                    const matchingStaff = courseInfo.find(staff =>
                        staff.staff_id === userReport.staff_id &&
                        staff.course_code === userReport.course_code &&
                        staff.category === userReport.category &&
                        staff.section === userReport.section &&
                        staff.dept_name === userReport.dept_name
                    )

                    return {
                        ...userReport,
                        cia_1: userReport ? (userReport.cia_1 === 2 ? 'Completed' : userReport.cia_1 === 1 ? 'Processing' : 'Incomplete') : 'N/A',
                        cia_2: userReport ? (userReport.cia_2 === 2 ? 'Completed' : userReport.cia_2 === 1 ? 'Processing' : 'Incomplete') : 'N/A',
                        ass_1: userReport ? (userReport.ass_1 === 2 ? 'Completed' : userReport.ass_1 === 1 ? 'Processing' : 'Incomplete') : 'N/A',
                        ass_2: userReport ? (userReport.ass_2 === 2 ? 'Completed' : userReport.ass_2 === 1 ? 'Processing' : 'Incomplete') : 'N/A',
                        course_title: matchingStaff.course_title,
                        dept_id: matchingStaff.dept_id,
                        staff_name: matchingStaff.staff_name,
                        semester: matchingStaff ?
                            (matchingStaff.semester === 1 || matchingStaff.semester === 2) ? 1 :
                                (matchingStaff.semester === 3 || matchingStaff.semester === 4) ? 2 : 3 : 'N/A'
                    };
                })
                reportDetails.push(...details);
            }
            res.json(reportDetails);
        }
        else {
            res.status(404).json({ message: "No records found for the given Staff ID." });
        }
    }
    catch (error) {
        console.error('Error during Dept Status Processing:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

module.exports = route;