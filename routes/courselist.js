const express = require('express');
const route = express.Router();
const coursemapping = require('../models/coursemapping');
const studentmaster = require('../models/studentmaster');
const markentry = require('../models/markentry');
const report = require('../models/report');
const academic = require('../models/academic');
const calculation = require('../models/calculation');
const { Op, Sequelize } = require("sequelize");

// ------------------------------------------------------------------------------------------------------- //

// Course Mapping Details Getting Coding

route.post('/coursemap', async (req, res) => {

    const { staff_id, academic_sem } = req.body;

    try {
        const courseMapping = await coursemapping.findAll({
            where: {
                staff_id: staff_id,
                academic_sem: academic_sem
            }
        });
        res.json(courseMapping);
    }
    catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Course Mapping Details Getting Coding

route.post('/maxmark', async (req, res) => {

    try {
        const academicdata = await academic.findOne({
            where: { active_sem: 1 }
        })

        const maxMark = await calculation.findOne({
            where: { academic_sem: academicdata.academic_sem }
        })

        res.json(maxMark);
    }
    catch (err) { res.status(500).json({ error: 'An error occurred while fetching data.' }) }
})

// ------------------------------------------------------------------------------------------------------- //

// Course Mapping Status Details Getting Coding

route.post('/report/status', async (req, res) => {

    const { category, dept_name, section, course_code, academic_sem } = req.body;

    try {

        const courseMappingStatus = await report.findAll({
            where: {
                category: category,
                dept_name: dept_name,
                section: section, academic_sem,
                course_code: course_code,
            }
        })

        // console.log(courseMappingStatus)

        const isCompleted = courseMappingStatus.length > 0 &&
            courseMappingStatus.every(
                (record) =>
                    record.cia_1 === 2 &&
                    record.cia_2 === 2 &&
                    record.ass_1 === 2 &&
                    record.ass_2 === 2
            )

        res.status(200).json({ status: isCompleted ? 'Completed' : 'Pending', courseMappingStatus });
    }
    catch (err) { res.status(500).json({ error: 'An error occurred while fetching data.' })}
})

// ------------------------------------------------------------------------------------------------------- //

// Students Data Fetching Coding

route.post('/studentdetails', async (req, res) => {

    const { dept_id, stu_section, stu_category, stu_course_code, 
        activeSection, academic_sem, semester } = req.body;

    // console.log(req.body)

    try {

        const studentDetails = await studentmaster.findAll({
            where: {
                dept_id: dept_id,
                section: stu_section,
                category: stu_category
            }
        });

        // console.log('First : ', studentDetails.length)

        const registerNumbers = studentDetails.map(student => student.reg_no);

        let markFields = {};

        switch (activeSection) {
            case '1':
                markFields = ['c1_lot', 'c1_mot', 'c1_hot', 'c1_total'];
                break;
            case '2':
                markFields = ['c2_lot', 'c2_mot', 'c2_hot', 'c2_total'];
                break;
            case '3':
                markFields = ['a1_lot'];
                break;
            case '4':
                markFields = ['a2_lot'];
                break;
            case '5':
                markFields = ['ese_lot', 'ese_mot', 'ese_hot', 'ese_total'];
                break;
            default:
                return res.status(400).json({ error: 'Invalid section' });
        }

        // console.log(registerNumbers)

        const stud_reg = await markentry.findAll({
            where: {
                course_code: stu_course_code,
                reg_no: registerNumbers,
                academic_sem: academic_sem
            },
            attributes: ['reg_no', ...markFields]
        })

        // console.log('Second : ', stud_reg.length)

        const stud_name = await studentmaster.findAll({
            where: {
                reg_no: stud_reg.map(entry => entry.reg_no),
                semester
            },
            attributes: ['reg_no', 'stu_name'],
            group: ['reg_no', 'stu_name']
        });

        // console.log(stud_name.length);

        const studentData = stud_name.map(student => {
            const marks = stud_reg.find(mark => mark.reg_no === student.reg_no) || {};
            return {
                reg_no: student.reg_no,
                stu_name: student.stu_name,
                lot: marks[`${activeSection === '1' ? 'c1_lot' : activeSection === '2' ? 'c2_lot' : activeSection === '3' ? 'a1_lot' : activeSection === '4' ? 'a2_lot' : 'ese_lot'}`] ?? (0 || ''),
                mot: marks[`${activeSection === '1' ? 'c1_mot' : activeSection === '2' ? 'c2_mot' : 'ese_mot'}`] ?? (0 || ''),
                hot: marks[`${activeSection === '1' ? 'c1_hot' : activeSection === '2' ? 'c2_hot' : 'ese_hot'}`] ?? (0 || ''),
                total: marks[`${activeSection === '1' ? 'c1_total' : activeSection === '2' ? 'c2_total' : 'ese_total'}`] ?? (0 || '')
            }
        })
        
        // console.log(studentData.length)

        res.json(studentData);
    }
    catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Getting Report Coding

route.get('/getreport', async (req, res) => {

    const { courseCode, deptName, section, category, academicSem } = req.query;

    const checkActive = await report.findOne({
        where: {
            course_code: courseCode, section: section,
            category: category, dept_name: deptName,
            academic_sem: academicSem
        }
    });
    res.json(checkActive);
})

// ------------------------------------------------------------------------------------------------------- //

// Mark Updation Coding

route.put('/updateMark', async (req, res) => {

    const { updates, activeSection, courseCode, academicSem } = req.body;
    const examType = activeSection;
    const regNumbers = Object.keys(updates);

    try {

        for (const regNo of regNumbers) {
            const updateData = updates[regNo];
            let updateFields = {};

            const setField = (value) => value === '' || value === undefined ? null : value;

            switch (examType) {
                case '1':
                    updateFields =
                    {
                        c1_lot: setField(updateData.lot),
                        c1_hot: setField(updateData.hot),
                        c1_mot: setField(updateData.mot),
                        c1_total: setField(updateData.total)
                    };
                    break;

                case '2':
                    updateFields =
                    {
                        c2_lot: setField(updateData.lot),
                        c2_hot: setField(updateData.hot),
                        c2_mot: setField(updateData.mot),
                        c2_total: setField(updateData.total)
                    };
                    break;

                case '3':
                    updateFields =
                    {
                        a1_lot: setField(updateData.lot)
                    };
                    break;

                case '4':
                    updateFields =
                    {
                        a2_lot: setField(updateData.lot)
                    };
                    break;

                case '5':
                    updateFields =
                    {
                        ese_lot: setField(updateData.lot),
                        ese_hot: setField(updateData.hot),
                        ese_mot: setField(updateData.mot),
                        ese_total: setField(updateData.total)
                    };
                    break;

                default:
                    console.log('Invalid section');
                    res.status(400).send({ error: "Invalid section" });
                    return;
            }

            await markentry.update(updateFields, {
                where: {
                    reg_no: regNo,
                    course_code: courseCode,
                    academic_sem: academicSem
                }
            });
        }
        res.status(200).send({ success: true, message: 'Marks updated successfully' });
    }
    catch (error) {
        console.error("Error updating marks:", error);
        res.status(500).send({ success: false, error: "Failed to update marks" });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Report Creating Code

route.put('/report', async (req, res) => {

    const { activeSection, courseCode, deptName, category, button_value, section, academicSem } = req.body;

    try {

        let cia_1 = 0, cia_2 = 0, ass_1 = 0, ass_2 = 0, ese = 0;
        const valueToSet = button_value === "0" ? 1 : 2;

        const existingReports = await report.findAll({
            where: {
                course_code: courseCode,
                section: section,
                category: category,
                dept_name: deptName,
                academic_sem: academicSem
            }
        });

        if (existingReports.length > 0) {

            for (const existingReport of existingReports) {

                switch (activeSection) {
                    case "1":
                        existingReport.cia_1 = valueToSet;
                        break;
                    case "2":
                        existingReport.cia_2 = valueToSet;
                        break;
                    case "3":
                        existingReport.ass_1 = valueToSet;
                        break;
                    case "4":
                        existingReport.ass_2 = valueToSet;
                        break;
                    case "5":
                        existingReport.ese = valueToSet;
                        break;
                    default:
                        console.log('Invalid activeSection');
                        break;
                }
                await existingReport.save();
            }
        }
        else {
            await report.create({
                course_code: courseCode,
                section: section,
                category: category,
                dept_name: deptName,
                academic_sem: academicSem,
                cia_1: activeSection === "1" ? valueToSet : null,
                cia_2: activeSection === "2" ? valueToSet : null,
                ass_1: activeSection === "3" ? valueToSet : null,
                ass_2: activeSection === "4" ? valueToSet : null,
                ese: activeSection === "5" ? valueToSet : null
            });
        }

        const updatedReports = await report.findAll({
            where: {
                course_code: courseCode,
                section: section,
                category: category,
                dept_name: deptName,
                academic_sem: academicSem
            }
        });

        updatedReports.forEach(r => {
            cia_1 = Math.max(cia_1, r.cia_1 || 0);
            cia_2 = Math.max(cia_2, r.cia_2 || 0);
            ass_1 = Math.max(ass_1, r.ass_1 || 0);
            ass_2 = Math.max(ass_2, r.ass_2 || 0);
            ese = Math.max(ese, r.ese || 0);
        });

        res.status(200).json({ cia_1, cia_2, ass_1, ass_2, ese });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
})

module.exports = route;