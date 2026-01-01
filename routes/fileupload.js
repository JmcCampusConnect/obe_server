const express = require('express');
const route = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads' });
const XLSX = require('xlsx');
const fs = require('fs');
const academic = require('../models/academic');
const coursemapping = require('../models/coursemapping');
const report = require('../models/report');
const markentry = require('../models/markentry');
const scope = require('../models/scope');
const mentor = require('../models/mentor');
const hod = require('../models/hod');
const studentmaster = require('../models/studentmaster');
const staffmaster = require('../models/staffmaster');
const calculation = require('../models/calculation');
const rsmatrix = require('../models/rsmatrix');
const coursemaster = require('../models/coursemaster');

// ------------------------------------------------------------------------------------------------------- //

// PROGRESS STORE

const uploadProgress = {};

// ------------------------------------------------------------------------------------------------------- //

// GENERIC FUNCTION TO READ EXCEL

function readExcel(file) {
    const workbook = XLSX.readFile(file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet);
    fs.unlinkSync(file.path);
    return rows;
}

// ------------------------------------------------------------------------------------------------------- //

// STAFF MASTER

route.post('/staffmaster', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.staffmaster = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await staffmaster.upsert({
                staff_id: row.staff_id,
                staff_category: row.staff_category,
                staff_name: row.staff_name,
                staff_pass: row.staff_pass,
                staff_dept: row.staff_dept,
                dept_category: row.dept_category
            });
            uploadProgress.staffmaster.processed += 1;
        }
        uploadProgress.staffmaster.processed = uploadProgress.staffmaster.total;
        res.status(200).send('Staff Master Imported Successfully');
    } catch (error) {
        delete uploadProgress.staffmaster;
        console.error(error);
        res.status(500).send('Error uploading Staff Master');
    }
});

// ------------------------------------------------------------------------------------------------------- //
// STUDENT MASTER
route.post('/studentmaster', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.studentmaster = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await studentmaster.upsert({
                reg_no: row.reg_no,
                stu_name: row.stu_name,
                dept_id: row.dept_id,
                category: row.category,
                semester: row.semester,
                section: row.section,
                batch: row.batch
            });
            uploadProgress.studentmaster.processed += 1;
        }
        uploadProgress.studentmaster.processed = uploadProgress.studentmaster.total;
        res.status(200).send('Student Master Imported Successfully');
    } catch (error) {
        delete uploadProgress.studentmaster;
        console.error(error);
        res.status(500).send('Error uploading Student Master');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// COURSE MAPPING

route.post('/coursemapping', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        const activeAcademic = await academic.findOne({ where: { active_sem: 1 } });
        if (!activeAcademic) return res.status(400).send('No active academic year');

        uploadProgress.coursemapping = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await coursemapping.upsert({
                category: row.category,
                batch: row.batch,
                dept_id: row.dept_id,
                degree: row.degree,
                dept_name: row.dept_name,
                semester: row.semester,
                section: row.section,
                course_code: row.course_code,
                staff_id: row.staff_id,
                staff_name: row.staff_name,
                course_title: row.course_title,
                academic_sem: activeAcademic.academic_sem
            });
            await report.upsert({
                staff_id: row.staff_id,
                course_code: row.course_code,
                category: row.category,
                section: row.section,
                dept_name: row.dept_name,
                academic_sem: activeAcademic.academic_sem
            });
            uploadProgress.coursemapping.processed += 1;
        }
        uploadProgress.coursemapping.processed = uploadProgress.coursemapping.total;
        res.status(200).send('Course Mapping Imported Successfully');
    } catch (error) {
        delete uploadProgress.coursemapping;
        console.error(error);
        res.status(500).send('Error uploading Course Mapping');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// MARK ENTRY

route.post('/markentry', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.markentry = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await markentry.upsert({
                batch: row.batch,
                category: row.category,
                graduate: row.graduate,
                dept_id: row.dept_id,
                reg_no: row.reg_no,
                course_code: row.course_code,
                semester: row.semester,
                c1_lot: row.c1_lot,
                c1_mot: row.c1_mot,
                c1_hot: row.c1_hot,
                c1_total: row.c1_total,
                c2_lot: row.c2_lot,
                c2_mot: row.c2_mot,
                c2_hot: row.c2_hot,
                c2_total: row.c2_total,
                a1_lot: row.a1_lot,
                a2_lot: row.a2_lot,
                ese_lot: row.ese_lot,
                ese_mot: row.ese_mot,
                ese_hot: row.ese_hot,
                ese_total: row.ese_total,
                academic_sem: row.academic_sem,
                academic_year: row.academic_year
            });
            uploadProgress.markentry.processed += 1;
        }
        uploadProgress.markentry.processed = uploadProgress.markentry.total;
        res.status(200).send('Mark Entry Imported Successfully');
    } catch (error) {
        delete uploadProgress.markentry;
        console.error(error);
        res.status(500).send('Error uploading Mark Entry');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// HOD

route.post('/hod', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.hod = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await hod.upsert({
                graduate: row.graduate,
                dept_id: row.dept_id,
                category: row.category,
                dept_name: row.dept_name,
                staff_id: row.staff_id,
                hod_name: row.hod_name
            });
            uploadProgress.hod.processed += 1;
        }
        uploadProgress.hod.processed = uploadProgress.hod.total;
        res.status(200).send('HOD Imported Successfully');
    } catch (error) {
        delete uploadProgress.hod;
        console.error(error);
        res.status(500).send('Error uploading HOD');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// MENTOR

route.post('/mentor', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.mentor = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await mentor.upsert({
                graduate: row.graduate,
                dept_id: row.dept_id,
                category: row.category,
                degree: row.degree,
                dept_name: row.dept_name,
                section: row.section,
                batch: row.batch,
                staff_id: row.staff_id,
                staff_name: row.staff_name,
                academic_sem: row.academic_sem,
                academic_year: row.academic_year
            });
            uploadProgress.mentor.processed += 1;
        }
        uploadProgress.mentor.processed = uploadProgress.mentor.total;
        res.status(200).send('Mentor Imported Successfully');
    } catch (error) {
        delete uploadProgress.mentor;
        console.error(error);
        res.status(500).send('Error uploading Mentor');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// SCOPE

route.post('/scope', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.scope = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await scope.upsert({
                staff_id: row.staff_id,
                dashboard: row.dashboard,
                course_list: row.course_list,
                course_outcome: row.course_outcome,
                student_outcome: row.student_outcome,
                program_outcome: row.program_outcome,
                program_specific_outcome: row.program_specific_outcome,
                obe_report: row.obe_report,
                work_progress_report: row.work_progress_report,
                input_files: row.input_files,
                manage: row.manage,
                relationship_matrix: row.relationship_matrix,
                settings: row.settings
            });
            uploadProgress.scope.processed += 1;
        }
        uploadProgress.scope.processed = uploadProgress.scope.total;
        res.status(200).send('Scope Imported Successfully');
    } catch (error) {
        delete uploadProgress.scope;
        console.error(error);
        res.status(500).send('Error uploading Scope');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// CALCULATION

route.post('/calculation', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.calculation = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await calculation.upsert(row);
            uploadProgress.calculation.processed += 1;
        }
        uploadProgress.calculation.processed = uploadProgress.calculation.total;
        res.status(200).send('Calculation Imported Successfully');
    } catch (error) {
        delete uploadProgress.calculation;
        console.error(error);
        res.status(500).send('Error uploading Calculation');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// ACADEMIC

route.post('/academic', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.academic = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await academic.upsert({
                academic_year: row.academic_year,
                sem: row.sem,
                active_sem: row.active_sem
            });
            uploadProgress.academic.processed += 1;
        }
        uploadProgress.academic.processed = uploadProgress.academic.total;
        res.status(200).send('Academic Imported Successfully');
    } catch (error) {
        delete uploadProgress.academic;
        console.error(error);
        res.status(500).send('Error uploading Academic');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// RSMATRIX

route.post('/rsmatrix', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.rsmatrix = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await rsmatrix.upsert(row);
            uploadProgress.rsmatrix.processed += 1;
        }
        uploadProgress.rsmatrix.processed = uploadProgress.rsmatrix.total;
        res.status(200).send('RS Matrix Imported Successfully');
    } catch (error) {
        delete uploadProgress.rsmatrix;
        console.error(error);
        res.status(500).send('Error uploading RS Matrix');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// COURSEMASTER

route.post('/coursemaster', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.coursemaster = { total: rows.length, processed: 0 };
        for (const row of rows) {
            await coursemaster.upsert(row);
            uploadProgress.coursemaster.processed += 1;
        }
        uploadProgress.coursemaster.processed = uploadProgress.coursemaster.total;
        res.status(200).send('Coursemaster Imported Successfully');
    } catch (error) {
        delete uploadProgress.coursemaster;
        console.error(error);
        res.status(500).send('Error uploading Coursemaster');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// ESE

route.post('/ese', upload.single('file'), async (req, res) => {

    try {

        const rows = readExcel(req.file);
        if (rows.length === 0) return res.status(400).send('No data in file');

        uploadProgress.ese = { total: rows.length, processed: 0 };
        for (const row of rows) {
            const updateData = {
                ese_lot: Number(row.ese_lot) || -1,
                ese_mot: Number(row.ese_mot) || -1,
                ese_hot: Number(row.ese_hot) || -1,
                ese_total: Number(row.ese_total) || -1
            };
            await markentry.update(updateData, { where: { reg_no: row.reg_no, course_code: row.course_code } });
            uploadProgress.ese.processed += 1;
        }
        uploadProgress.ese.processed = uploadProgress.ese.total;
        res.status(200).send('ESE Marks Imported Successfully');
    } catch (error) {
        delete uploadProgress.ese;
        console.error(error);
        res.status(500).send('Error uploading ESE Marks');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// PROGRESS ENDPOINT

route.get('/progress/:type', (req, res) => {

    const { type } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const interval = setInterval(() => {
        const progress = uploadProgress[type];
        if (progress) {
            const percent = Math.round((progress.processed / progress.total) * 100);
            res.write(`data: ${percent}\n\n`);
            if (percent >= 100) {
                clearInterval(interval);
                delete uploadProgress[type];
                res.end();
            }
        }
    }, 300);

    req.on('close', () => clearInterval(interval));
});

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;