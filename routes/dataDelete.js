const express = require('express');
const router = express.Router();
const sequelize_conn = require('../models/dbconnection');
const studentmaster = require('../models/studentmaster');
const mentor = require('../models/mentor');
const markentry = require('../models/markentry');
const report = require('../models/report');
const hod = require('../models/hod');
const staffmaster = require('../models/staffmaster');
const { Op } = require('sequelize');

// ------------------------------------------------------------------------------------------------------- //

// Returns all distinct values needed by Data Deletion UI in a single call

router.get('/data-delete/options', async (req, res) => {

    try {

        const batchesRaw = await studentmaster.findAll({
            attributes: [[sequelize_conn.fn('DISTINCT', sequelize_conn.col('batch')), 'batch']],
            where: { batch: { [Op.ne]: null } },
            raw: true
        });
        const batches = batchesRaw.map(r => r.batch).filter(Boolean).sort();

        const mentorYearsRaw = await mentor.findAll({
            attributes: [[sequelize_conn.fn('DISTINCT', sequelize_conn.col('academic_year')), 'academic_year']],
            where: { academic_year: { [Op.ne]: null } },
            raw: true
        });
        const mentorAcademicYears = mentorYearsRaw.map(r => r.academic_year).filter(Boolean).sort();

        const markEntryYearsRaw = await markentry.findAll({
            attributes: [[sequelize_conn.fn('DISTINCT', sequelize_conn.col('academic_year')), 'academic_year']],
            where: { academic_year: { [Op.ne]: null } },
            raw: true
        });
        const markEntryAcademicYears = markEntryYearsRaw.map(r => r.academic_year).filter(Boolean).sort();

        const reportSemsRaw = await report.findAll({
            attributes: [[sequelize_conn.fn('DISTINCT', sequelize_conn.col('academic_sem')), 'academic_sem']],
            where: { academic_sem: { [Op.ne]: null } },
            raw: true
        });
        const reportAcademicSems = reportSemsRaw.map(r => r.academic_sem).filter(Boolean).sort();

        const mentorSemsRaw = await mentor.findAll({
            attributes: [[sequelize_conn.fn('DISTINCT', sequelize_conn.col('academic_sem')), 'academic_sem']],
            where: { academic_sem: { [Op.ne]: null } },
            raw: true
        });
        const mentorAcademicSems = mentorSemsRaw.map(r => r.academic_sem).filter(Boolean).sort();

        const markEntrySemsRaw = await markentry.findAll({
            attributes: [[sequelize_conn.fn('DISTINCT', sequelize_conn.col('academic_sem')), 'academic_sem']],
            where: { academic_sem: { [Op.ne]: null } },
            raw: true
        });
        const markEntryAcademicSems = markEntrySemsRaw.map(r => r.academic_sem).filter(Boolean).sort();
        const hodAllCount = await hod.count();
        const staffAllCount = await staffmaster.count({ where: { staff_category: { [Op.ne]: 'ADMIN' } } });

        res.json({
            batches, mentorAcademicYears, markEntryAcademicYears,
            reportAcademicSems, mentorAcademicSems, markEntryAcademicSems,
            hodAllCount, staffAllCount
        });
    }
    catch (err) {
        console.error('Error in fetching data deletion option : ', err);
        res.status(500).json({ error: 'Failed to fetch delete options' });
    }
});

// ------------------------------------------------------------------------------------------------------- //

router.post('/data-delete/preview', async (req, res) => {

    try {

        const {
            studentBatches = [], mentorYears = [], markEntryYears = [],
            reportSems = [], hodSems = [], staffAll = false
        } = req.body;

        // student batch counts
        const studentCounts = await Promise.all(studentBatches.map(async (b) => {
            const count = await studentmaster.count({ where: { batch: b } });
            return { value: b, count };
        }));

        // mentor year counts
        const mentorCounts = await Promise.all(mentorYears.map(async (y) => {
            const count = await mentor.count({ where: { academic_year: y } });
            return { value: y, count };
        }));

        // mark entry year counts
        const markEntryCounts = await Promise.all(markEntryYears.map(async (y) => {
            const count = await markentry.count({ where: { academic_year: y } });
            return { value: y, count };
        }));

        // report sem counts
        const reportCounts = await Promise.all(reportSems.map(async (s) => {
            const count = await report.count({ where: { academic_sem: s } });
            return { value: s, count };
        }));

        // hod sem counts (we still use the report table as HOD-related per-sem data)
        const hodCounts = await Promise.all(hodSems.map(async (s) => {
            const count = await report.count({ where: { academic_sem: s } });
            return { value: s, count };
        }));

        // if caller asked for hodAll, count hod table rows
        let hodAllCount = 0;
        if (req.body.hodAll) {
            hodAllCount = await hod.count();
        }

        // staff count (exclude admin if staff_category exists)
        let staffAllCount = 0;
        if (staffAll) {
            const condition = { staff_id: { [Op.ne]: 'ADMIN' } };
            staffAllCount = await staffmaster.count({ where: condition });
        }

        res.json({
            studentCounts,
            mentorCounts,
            markEntryCounts,
            reportCounts,
            hodCounts,
            hodAllCount,
            staffAllCount
        });
    }
    catch (err) {
        console.error('Data deletion count error : ', err);
        res.status(500).json({ error: 'Failed to build preview summary' });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Execute deletion with password verification for ADMIN

router.post('/data-delete/execute', async (req, res) => {

    const { password, studentBatches = [], mentorYears = [], markEntryYears = [], reportSems = [], hodSems = [], hodAll = false, staffAll = false } = req.body;

    try {

        const admin = await staffmaster.findOne({ where: { staff_pass: password, staff_id: 'ADMIN' } });
        if (!admin) return res.status(401).json({ success: false, message: 'Password not matching' });

        const t = await sequelize_conn.transaction();

        try {

            const deleted = {
                students: 0, mentors: 0, markEntries: 0,
                reports: 0, hods: 0, staff: 0
            };

            if (studentBatches && studentBatches.length) {
                deleted.students = await studentmaster.count({ where: { batch: { [Op.in]: studentBatches } }, transaction: t });
                await studentmaster.destroy({ where: { batch: { [Op.in]: studentBatches } }, transaction: t });
            }

            if (mentorYears && mentorYears.length) {
                deleted.mentors = await mentor.count({ where: { academic_year: { [Op.in]: mentorYears } }, transaction: t });
                await mentor.destroy({ where: { academic_year: { [Op.in]: mentorYears } }, transaction: t });
            }

            if (markEntryYears && markEntryYears.length) {
                deleted.markEntries = await markentry.count({ where: { academic_year: { [Op.in]: markEntryYears } }, transaction: t });
                await markentry.destroy({ where: { academic_year: { [Op.in]: markEntryYears } }, transaction: t });
            }

            if (reportSems && reportSems.length) {
                deleted.reports = await report.count({ where: { academic_sem: { [Op.in]: reportSems } }, transaction: t });
                await report.destroy({ where: { academic_sem: { [Op.in]: reportSems } }, transaction: t });
            }

            if (hodSems && hodSems.length) {
                deleted.hods = await report.count({ where: { academic_sem: { [Op.in]: hodSems } }, transaction: t });
                await report.destroy({});
            }
            if (hodAll) {
                deleted.hods = await hod.count({ transaction: t });
                await hod.destroy({ where: {}, transaction: t });
            }
            if (staffAll) {
                const condition = { staff_category: { [Op.ne]: 'ADMIN' } };
                deleted.staff = await staffmaster.count({ where: condition, transaction: t });
                await staffmaster.destroy({ where: condition, transaction: t });
            }

            await t.commit();
            res.json({ success: true, deleted });

        } catch (err) {
            await t.rollback();
            console.error('data-delete/execute transaction error: ', err);
            res.status(500).json({ success: false, message: 'Deletion failed' });
        }
    } catch (err) {
        console.error('data-delete/execute error: ', err);
        res.status(500).json({ success: false, message: 'Server error during deletion' });
    }
});

// ------------------------------------------------------------------------------------------------------- //

module.exports = router;