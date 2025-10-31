const express = require('express');
const route = express.Router();
const studentmaster = require('../models/studentmaster');
const staffmaster = require('../models/staffmaster');
const report = require('../models/report');
const academic = require('../models/academic')
const coursemapping = require('../models/coursemapping');
const markentry = require('../models/markentry');
const coursemaster = require('../models/coursemaster');
const { Sequelize } = require('sequelize');

// ------------------------------------------------------------------------------------------------------- //

// Student Staff Programme Course Count

route.get('/counts', async (req, res) => {

    try {

        const academicdata = await academic.findOne({ where: { active_sem: 1 } })
        const studentCount = await markentry.count({
            where: { academic_sem: String(academicdata.academic_sem) },
            distinct: true,
            col: 'reg_no'
        });
        const staffCount = await staffmaster.count();

        const uniqueCourseCount = await coursemaster.count({
            where: { academic_sem: String(academicdata.academic_sem) },
            distinct: true,
            col: 'course_code'
        });

        const uniqueProgramCount = await coursemapping.count({
            where: { academic_sem: String(academicdata.academic_sem) },
            distinct: true,
            col: 'dept_id'
        });

        res.json({
            studentCount, staffCount,
            courseCount: uniqueCourseCount,
            programCount: uniqueProgramCount
        });
    }
    catch (error) {
        console.error('Error fetching counts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Student Piechart

route.get('/studentpiechart', async (req, res) => {

    try {

        const academicdata = await academic.findOne({ where: { active_sem: 1 } })
        const totalStudents = await studentmaster.count();
        const aidedCount = await studentmaster.count({ where: { category: "AIDED" } });
        const sfmCount = await studentmaster.count({ where: { category: "SFM" } });
        const sfwCount = await studentmaster.count({ where: { category: "SFW" } });

        const result =
        {
            total: totalStudents,
            categories: [
                { label: 'AIDED', count: aidedCount, percentage: ((aidedCount / totalStudents) * 100).toFixed(1) },
                { label: 'SFM', count: sfmCount, percentage: ((sfmCount / totalStudents) * 100).toFixed(1) },
                { label: 'SFW', count: sfwCount, percentage: ((sfwCount / totalStudents) * 100).toFixed(1) },
            ]
        }

        res.json(result);
    }
    catch (error) {
        console.error('Error Fetching Student Pie Data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Staff Piechart

route.get('/staffpiechart', async (req, res) => {

    try {

        const totalStaff = await staffmaster.count();
        const aidedCount = await staffmaster.count({ where: { staff_category: 'AIDED' } });
        const sfmCount = await staffmaster.count({ where: { staff_category: 'SFM' } });
        const sfwCount = await staffmaster.count({ where: { staff_category: 'SFW' } });

        const result =
        {
            total: totalStaff,
            categories: [
                { label: 'AIDED', count: aidedCount, percentage: ((aidedCount / totalStaff) * 100).toFixed(1) },
                { label: 'SFM', count: sfmCount, percentage: ((sfmCount / totalStaff) * 100).toFixed(1) },
                { label: 'SFW', count: sfwCount, percentage: ((sfwCount / totalStaff) * 100).toFixed(1) },
            ]
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching staff pie data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Course Mapping Completion Status

route.post('/componentreport', async (req, res) => {

    try {

        const academicdata = await academic.findOne({ where: { active_sem: 1 } })

        const totalCount = await report.count({
            where: { academic_sem: String(academicdata.academic_sem) }
        });

        const cia_1 = await report.count({
            where: {
                academic_sem: academicdata.academic_sem,
                cia_1: '2'
            }
        });

        const cia_2 = await report.count({
            where: {
                academic_sem: academicdata.academic_sem,
                cia_2: '2'
            }
        });

        const ass_1 = await report.count({
            where: {
                academic_sem: String(academicdata.academic_sem),
                ass_1: '2'
            }
        });

        const ass_2 = await report.count({
            where: {
                academic_sem: String(academicdata.academic_sem),
                ass_2: '2'
            },
        });

        const ese = await report.count({
            where: {
                academic_sem: String(academicdata.academic_sem),
                ese: '2'
            },
        });

        res.json({ cia_1, cia_2, ass_1, ass_2, ese, totalCount });
    }
    catch (error) {
        console.error('Error fetching counts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

route.post('/processedChartData', async (req, res) => {

    try {

        const academicdata = await academic.findOne({ where: { active_sem: 1 } });
        const courseCode = await report.findAll({
            where: { academic_sem: String(academicdata.academic_sem) },
            attributes: ['course_code'],
        });

        const unique_coursecodes = [...new Set(courseCode.map((entry) => entry.course_code))];

        const countUniqueCourseCodes = unique_coursecodes.length;

        const course_codes = await report.findAll(
            {
                where: { academic_sem: String(academicdata.academic_sem) },
                attributes: ['course_code', 'cia_1', 'cia_2', 'ass_1', 'ass_2', 'ese'],
            });

        const markentryData = await markentry.findAll({
            where: {
                academic_sem: String(academicdata.academic_sem),
            },
            attributes: ['course_code', 'ese_lot', 'ese_mot', 'ese_hot', 'ese_total'],
        });

        const counts =
        {
            cia_1: 0,
            cia_2: 0,
            ass_1: 0,
            ass_2: 0,
            ese: 0,
        };

        const stud_coursecodes = [...new Set(course_codes.map((entry) => entry.course_code))];

        for (let course_code of stud_coursecodes) {
            const courseRows = course_codes.filter((entry) => entry.course_code === course_code);
            const allCia1Equal2 = courseRows.every((row) => row.cia_1 === 2);
            const allCia2Equal2 = courseRows.every((row) => row.cia_2 === 2);
            const allAss1Equal2 = courseRows.every((row) => row.ass_1 === 2);
            const allAss2Equal2 = courseRows.every((row) => row.ass_2 === 2);

            if (allCia1Equal2) counts.cia_1++;
            if (allCia2Equal2) counts.cia_2++;
            if (allAss1Equal2) counts.ass_1++;
            if (allAss2Equal2) counts.ass_2++;
        }

        const markentry_coursecodes = [...new Set(markentryData.map((entry) => entry.course_code))];

        for (let course_code of markentry_coursecodes) {
            const courseRows = markentryData.filter((entry) => entry.course_code === course_code);

            const allEseValuesNotNull = courseRows.some(
                (row) =>
                    row.ese_lot !== null &&
                    row.ese_mot !== null &&
                    row.ese_hot !== null &&
                    row.ese_total !== null
            );

            if (allEseValuesNotNull) counts.ese++;
        }

        res.status(200).json({ countUniqueCourseCodes, counts });
    }
    catch (error) {
        console.error('Error processing chart data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = route;