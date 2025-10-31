const express = require('express');
const route = express.Router();
const XLSX = require('xlsx');

const coursemapping = require('../models/coursemapping');
const report = require('../models/report');
const studentmaster = require('../models/studentmaster');
const staffmaster = require('../models/staffmaster');
const markentry = require('../models/markentry');
const scope = require('../models/scope');
const mentor = require('../models/mentor');
const hod = require('../models/hod');
const calculation = require('../models/calculation');
const academic = require('../models/academic');
const rsmatrix = require('../models/rsmatrix');
const coursemaster = require('../models/coursemaster');

// ------------------------------------------------------------------------------------------------------- //

// Course Mapping Downlaod Excel 

route.get('/download/coursemap', async (req, res) => {

    try 
    {
        const courseData = await coursemapping.findAll();

        const formattedData = [
            ['s_no', 'category', 'batch', 'dept_id', 'degree', 'dept_name', 'semester',
                'section', 'course_code', 'staff_id', 'staff_name', 'course_title', 'academic_sem'],
            ...courseData.map(course => [
                course.s_no,
                course.category,
                course.batch,
                course.dept_id,
                course.degree,
                course.dept_name,
                course.semester,
                course.section,
                course.course_code,
                course.staff_id,
                course.staff_name,
                course.course_title,
                course.academic_sem
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Staff Course Mapping');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Staff Course Mapping Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/coursemapmodel', async (req, res) => {

    try 
    {
        const courseData = await coursemapping.findAll();

        const formattedData = [
            ['category', 'batch', 'dept_id', 'degree', 'dept_name', 'semester',
                'section', 'course_code', 'staff_id', 'staff_name', 'course_title',],
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Staff Course Mapping');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Staff Course Mapping Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})
// ------------------------------------------------------------------------------------------------------- //

// Staff Master Download Excel

route.get('/download/staff', async (req, res) => {

    try 
    {
        const staffData = await staffmaster.findAll();
        const formattedData = [
            ['staff_id', 'staff_category', 'staff_name', 'staff_pass', 'staff_dept', 'dept_category'],
            ...staffData.map(staff =>
                [
                    staff.staff_id,
                    staff.staff_category,
                    staff.staff_name,
                    staff.staff_pass,
                    staff.staff_dept,
                    staff.dept_category
                ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Staff Master');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Staff Master Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/staffmodel', async (req, res) => {

    try 
    {
        const staffData = await staffmaster.findAll();
        const formattedData = [
            ['staff_id', 'staff_category', 'staff_name', 'staff_pass', 'staff_dept', 'dept_category'],

        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Staff Master');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Staff Master Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Student Master Excel Download

route.get('/download/studentmaster', async (req, res) => {

    try 
    {
        const studentData = await studentmaster.findAll();

        const formattedData = [
            ['s_no', 'reg_no', 'stu_name', 'dept_id', 'category', 'semester',
                'section', 'batch', 'academic_sem'],
            ...studentData.map(student => [
                student.s_no,
                student.reg_no,
                student.stu_name,
                student.dept_id,
                student.category,
                student.semester,
                student.section,
                student.batch,
                student.academic_sem
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Master');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Student Master Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/studentmastermodel', async (req, res) => {

    try 
    {
        const studentData = await studentmaster.findAll();

        const formattedData = [
            ['reg_no', 'stu_name', 'dept_id', 'category', 'semester',
                'section', 'batch',],
        ];

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Master');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Student Master Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Scope Excel Download

route.get('/download/scope', async (req, res) => {

    try 
    {
        const scopeData = await scope.findAll();

        const formattedData =
        [
            ['staff_id', 'dashboard', 'course_list', 'course_outcome',
                'student_outcome', 'program_outcome', 'program_specific_outcome',
                'mentor_report', 'hod_report', 'report', 'input_files',
                'manage', 'relationship_matrix', 'settings',],

            ...scopeData.map(scope => [
                scope.staff_id,
                scope.dashboard,
                scope.course_list,
                scope.course_outcome,
                scope.student_outcome,
                scope.program_outcome,
                scope.program_specific_outcome,
                scope.mentor_report,
                scope.hod_report,
                scope.report,
                scope.input_files,
                scope.manage,
                scope.relationship_matrix,
                scope.settings,
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scope');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Scope.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/scopemodel', async (req, res) => {

    try 
    {
        const scopeData = await scope.findAll();

        const formattedData = [
            ['staff_id', 'dashboard', 'course_list', 'course_outcome',
                'student_outcome', 'program_outcome', 'program_specific_outcome',
                'mentor_report', 'hod_report', 'report', 'input_files',
                'manage', 'relationship_matrix', 'settings'],
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scope');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Scope Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Student Mark Entry Excel Download

route.get('/download/mark', async (req, res) => {

    try 
    {
        const markData = await markentry.findAll();
        const formattedData = [
            ['s_no', 'batch', 'graduate', 'category', 'dept_id', 'reg_no', 'course_code', 'semester', 'c1_lot', 'c1_mot', 'c1_hot', 'c1_total',
                'c2_lot', 'c2_mot', 'c2_hot', 'c2_total', 'a1_lot', 'a2_lot', 'ese_lot', 'ese_mot', 'ese_hot', 'ese_total', 'academic_sem', 'academic_year',],

            ...markData.map(student =>
            [
                student.s_no,
                student.batch,
                student.graduate,
                student.category,
                student.dept_id,
                student.reg_no,
                student.course_code,
                student.semester,
                student.c1_lot,
                student.c1_mot,
                student.c1_hot,
                student.c1_total,
                student.c2_lot,
                student.c2_mot,
                student.c2_hot,
                student.c2_total,
                student.a1_lot,
                student.a2_lot,
                student.ese_lot,
                student.ese_mot,
                student.ese_hot,
                student.ese_total,
                student.academic_sem,
                student.academic_year
            ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Course Mapping');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Student Course Mapping Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/markmodel', async (req, res) => {

    try 
    {
        const markData = await markentry.findAll();
        const formattedData = [
            ['batch', 'graduate', 'category', 'dept_id', 'reg_no', 'course_code', 'semester', 'c1_lot', 'c1_mot', 'c1_hot', 'c1_total',
                'c2_lot', 'c2_mot', 'c2_hot', 'c2_total', 'a1_lot', 'a2_lot', 'ese_lot', 'ese_mot', 'ese_hot', 'ese_total'],
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Course Mapping');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Student Course Mapping Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Dept Mark Entry Excel Download

route.get('/download/ese', async (req, res) => {

    try 
    {
        const markData = await markentry.findAll();

        const formattedData = [
            ['reg_no', 'course_code', 'ese_lot', 'ese_mot', 'ese_hot',
                'ese_total'],
            ...markData.map(entry => [
                entry.reg_no,
                entry.course_code,
                entry.ese_lot,
                entry.ese_mot,
                entry.ese_hot,
                entry.ese_total
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ESE Mark Entry');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = ESE Mark Entry Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/esemodel', async (req, res) => {

    try 
    {
        const markData = await markentry.findAll();

        const formattedData = [
            ['reg_no', 'course_code', 'ese_lot', 'ese_mot', 'ese_hot',
                'ese_total'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ESE Mark Entry');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = ESE Mark Entry Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Report Excel Download

route.get('/download/report', async (req, res) => {

    try 
    {
        const reportData = await report.findAll();

        const formattedData = [
            ['sno', 'staff_id', 'course_code', 'category', 'section', 'dept_name',
                'cia_1', 'cia_2', 'ass_1', 'ass_2', 'ese', 'academic_sem'],
            ...reportData.map((reports, index) =>
                [
                    index + 1,
                    reports.staff_id,
                    reports.course_code,
                    reports.category,
                    reports.section,
                    reports.dept_name,
                    reports.cia_1,
                    reports.cia_2,
                    reports.ass_1,
                    reports.ass_2,
                    reports.ese,
                    reports.academic_sem
                ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Report Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/reportmodel', async (req, res) => {

    try 
    {
        const reportData = await report.findAll();

        const formattedData = [
            ['staff_id', 'course_code', 'category', 'section', 'dept_name',
                'cia_1', 'cia_2', 'ass_1', 'ass_2', 'ese', 'academic_sem'],
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Report Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Mentor Excel Download

route.get('/download/mentor', async (req, res) => {

    try 
    {
        const mentorData = await mentor.findAll();

        const formattedData = [
            ['sno', 'graduate', 'dept_id', 'category', 'degree', 'dept_name', 'section', 'batch', 'staff_id', 'staff_name', 'academic_sem', 'academic_year'],
            ...mentorData.map((mentor, index) =>
                [
                    index + 1,
                    mentor.graduate,
                    mentor.dept_id,
                    mentor.category,
                    mentor.degree,
                    mentor.dept_name,
                    mentor.section,
                    mentor.batch,
                    mentor.staff_id,
                    mentor.staff_name,
                    mentor.academic_sem,
                    mentor.academic_year
                ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Mentor');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Mentor Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/mentormodel', async (req, res) => {

    try 
    {
        const mentorData = await mentor.findAll();

        const formattedData = [
            ['graduate', 'dept_id', 'category', 'degree', 'dept_name', 'section', 'batch', 'staff_id', 'staff_name',],
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Mentor');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Mentor Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Mentor Excel Download

route.get('/download/hod', async (req, res) => {

    try 
    {
        const hodData = await hod.findAll();

        const formattedData = [
            ['sno', 'graduate', 'dept_id', 'category', 'dept_name', 'staff_id', 'hod_name'],
            ...hodData.map((hod, index) =>
                [
                    index + 1,
                    hod.graduate,
                    hod.dept_id,
                    hod.category,
                    hod.dept_name,
                    hod.staff_id,
                    hod.hod_name,
                ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Hod');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Hod Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/hodmodel', async (req, res) => {

    try 
    {
        const mentorData = await hod.findAll();

        const formattedData = [
            ['graduate', 'dept_id', 'category', 'dept_name', 'staff_id', 'hod_name'],
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Hod');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Hod Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Calculation File Download


route.get('/download/calculation', async (req, res) => {

    try 
    {
        const calculationData = await calculation.findAll();

        const formattedData = [
            ['sno', 'active_sem', 'c1_lot', 'c1_mot', 'c1_hot', 'c2_lot', 'c2_mot', 'c2_hot', 'a1_lot', 'a1_mot', 'a1_hot',
                'a2_lot', 'a2_mot', 'a2_hot', 'c_lot', 'c_mot', 'c_hot', 'e_lot', 'e_mot', 'e_hot', 'so_l0_ug', 'so_l1_ug', 'so_l2_ug', 'so_l3_ug', 'so_l0_pg',
                'so_l1_pg', 'so_l2_pg', 'so_l3_pg', 'cia_weightage', 'ese_weightage', 'co_thresh_value'],

            ...calculationData.map((calculation) =>
                [
                    calculation.s_no,
                    calculation.active_sem,
                    calculation.c1_lot,
                    calculation.c1_mot,
                    calculation.c1_hot,
                    calculation.c2_lot,
                    calculation.c2_mot,
                    calculation.c2_hot,
                    calculation.a1_lot,
                    calculation.a1_mot,
                    calculation.a1_hot,
                    calculation.a2_lot,
                    calculation.a2_mot,
                    calculation.a2_hot,
                    calculation.c_lot,
                    calculation.c_mot,
                    calculation.c_hot,
                    calculation.e_lot,
                    calculation.e_mot,
                    calculation.e_hot,
                    calculation.so_l0_ug,
                    calculation.so_l1_ug,
                    calculation.so_l2_ug,
                    calculation.so_l3_ug,
                    calculation.so_l0_pg,
                    calculation.so_l1_pg,
                    calculation.so_l2_pg,
                    calculation.so_l3_pg,
                    calculation.cia_weightage,
                    calculation.ese_weightage,
                    calculation.co_thresh_value
                ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Calculation');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Calculation Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample Model File Download

route.get('/download/calculationmodel', async (req, res) => {

    try 
    {
        const calculationData = await calculation.findAll();

        const formattedData = [
            ['sno', 'active_sem', 'c1_lot', 'c1_mot', 'c1_hot', 'c2_lot', 'c2_mot', 'c2_hot', 'a1_lot', 'a1_mot', 'a1_hot',
                'a2_lot', 'a2_mot', 'a2_hot', 'c_lot', 'c_mot', 'c_hot', 'e_lot', 'e_mot', 'e_hot', 'so_l0_ug', 'so_l1_ug', 'so_l2_ug', 'so_l3_ug', 'so_l0_pg',
                'so_l1_pg', 'so_l2_pg', 'so_l3_pg', 'cia_weightage', 'ese_weightage', 'co_thresh_value']]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Calculation Data');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Calculation Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Academic File Download

route.get('/download/academic', async (req, res) => {

    try 
    {
        const academicData = await academic.findAll();

        const formattedData = [
            ['sno', 'academic_year', 'sem', 'active_sem'],

            ...academicData.map((academic) =>
                [
                    academic.s_no,
                    academic.academic_year,
                    academic.sem,
                    academic.active_sem,
                ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Academic Data');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Academic Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample File Download

route.get('/download/academicmodel', async (req, res) => {

    try 
    {
        const academicData = await academic.findAll();

        const formattedData = [
            ['sno', 'academic_year', 'sem', 'active_sem']]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Academic Data');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Academic Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// RS Matrix File Download

route.get('/download/rsmatrix', async (req, res) => {

    try 
    {
        const rsmatrixData = await rsmatrix.findAll();

        const formattedData = [
            ['s_no', 'academic_year', 'course_id', 'course_code', 'co1_po1', 'co1_po2', 'co1_po3', 'co1_po4', 'co1_po5',
                'co1_pso1', 'co1_pso2', 'co1_pso3', 'co1_pso4', 'co1_pso5', 'co1_mean', 'co2_po1', 'co2_po2', 'co2_po3',
                'co2_po4', 'co2_po5', 'co2_pso1', 'co2_pso2', 'co2_pso3', 'co2_pso4', 'co2_pso5', 'co2_mean', 'co3_po1',
                'co3_po2', 'co3_po3', 'co3_po4', 'co3_po5', 'co3_pso1', 'co3_pso2', 'co3_pso3', 'co3_pso4', 'co3_pso5',
                'co3_mean', 'co4_po1', 'co4_po2', 'co4_po3', 'co4_po4', 'co4_po5', 'co4_pso1', 'co4_pso2', 'co4_pso3',
                'co4_pso4', 'co4_pso5', 'co4_mean', 'co5_po1', 'co5_po2', 'co5_po3', 'co5_po4', 'co5_po5', 'co5_pso1',
                'co5_pso2', 'co5_pso3', 'co5_pso4', 'co5_pso5', 'co5_mean', 'mean', 'olrel'],

            ...rsmatrixData.map((rsmatrix) =>
            [
                rsmatrix.s_no,
                rsmatrix.academic_year,
                rsmatrix.course_id,
                rsmatrix.course_code,
                rsmatrix.co1_po1,
                rsmatrix.co1_po2,
                rsmatrix.co1_po3,
                rsmatrix.co1_po4,
                rsmatrix.co1_po5,
                rsmatrix.co1_pso1,
                rsmatrix.co1_pso2,
                rsmatrix.co1_pso3,
                rsmatrix.co1_pso4,
                rsmatrix.co1_pso5,
                rsmatrix.co1_mean,
                rsmatrix.co2_po1,
                rsmatrix.co2_po2,
                rsmatrix.co2_po3,
                rsmatrix.co2_po4,
                rsmatrix.co2_po5,
                rsmatrix.co2_pso1,
                rsmatrix.co2_pso2,
                rsmatrix.co2_pso3,
                rsmatrix.co2_pso4,
                rsmatrix.co2_pso5,
                rsmatrix.co2_mean,
                rsmatrix.co3_po1,
                rsmatrix.co3_po2,
                rsmatrix.co3_po3,
                rsmatrix.co3_po4,
                rsmatrix.co3_po5,
                rsmatrix.co3_pso1,
                rsmatrix.co3_pso2,
                rsmatrix.co3_pso3,
                rsmatrix.co3_pso4,
                rsmatrix.co3_pso5,
                rsmatrix.co3_mean,
                rsmatrix.co4_po1,
                rsmatrix.co4_po2,
                rsmatrix.co4_po3,
                rsmatrix.co4_po4,
                rsmatrix.co4_po5,
                rsmatrix.co4_pso1,
                rsmatrix.co4_pso2,
                rsmatrix.co4_pso3,
                rsmatrix.co4_pso4,
                rsmatrix.co4_pso5,
                rsmatrix.co4_mean,
                rsmatrix.co5_po1,
                rsmatrix.co5_po2,
                rsmatrix.co5_po3,
                rsmatrix.co5_po4,
                rsmatrix.co5_po5,
                rsmatrix.co5_pso1,
                rsmatrix.co5_pso2,
                rsmatrix.co5_pso3,
                rsmatrix.co5_pso4,
                rsmatrix.co5_pso5,
                rsmatrix.co5_mean,
                rsmatrix.mean,
                rsmatrix.olrel
            ])
        ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'RS Matrix Data');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = RS Matrix Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample File Download

route.get('/download/rsmatrixmodel', async (req, res) => {

    try 
    {
        const rsmatrixData = await rsmatrix.findAll();

        const formattedData = [
            ['s_no', 'academic_year', 'course_id', 'course_code', 'co1_po1', 'co1_po2', 'co1_po3', 'co1_po4', 'co1_po5',
                'co1_pso1', 'co1_pso2', 'co1_pso3', 'co1_pso4', 'co1_pso5', 'co1_mean', 'co2_po1', 'co2_po2', 'co2_po3',
                'co2_po4', 'co2_po5', 'co2_pso1', 'co2_pso2', 'co2_pso3', 'co2_pso4', 'co2_pso5', 'co2_mean', 'co3_po1',
                'co3_po2', 'co3_po3', 'co3_po4', 'co3_po5', 'co3_pso1', 'co3_pso2', 'co3_pso3', 'co3_pso4', 'co3_pso5',
                'co3_mean', 'co4_po1', 'co4_po2', 'co4_po3', 'co4_po4', 'co4_po5', 'co4_pso1', 'co4_pso2', 'co4_pso3',
                'co4_pso4', 'co4_pso5', 'co4_mean', 'co5_po1', 'co5_po2', 'co5_po3', 'co5_po4', 'co5_po5', 'co5_pso1',
                'co5_pso2', 'co5_pso3', 'co5_pso4', 'co5_pso5', 'co5_mean', 'mean', 'olrel']]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'RS Matrix Data');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = RS Matrix Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Coursemaster Excel Download

route.get('/download/coursemaster', async (req, res) => {

    try 
    {
        const coursemasterData = await coursemaster.findAll();

        const formattedData =
            [
                ['s_no', 'graduate', 'course_code', 'course_title', 'dept_id', 'dept_name', 'degree', 'semester',
                    'academic_sem', 'academic_year'],

                ...coursemasterData.map(coursemaster => [
                    coursemaster.s_no,
                    coursemaster.graduate,
                    coursemaster.course_code,
                    coursemaster.course_title,
                    coursemaster.dept_id,
                    coursemaster.dept_name,
                    coursemaster.degree,
                    coursemaster.semester,
                    coursemaster.academic_sem,
                    coursemaster.academic_year,
                ])
            ]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Course Master');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename = Course Master Data.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Sample File Download

route.get('/download/coursemastermodel', async (req, res) => {

    try 
    {
        const coursemasterData = await coursemaster.findAll();

        const formattedData = [
            ['graduate', 'course_code', 'course_title', 'dept_id', 'dept_name', 'degree', 'semester']]

        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Course Master');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename = Course Master Model.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    }
    catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error');
    }
})

module.exports = route;