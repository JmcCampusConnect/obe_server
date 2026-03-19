const express = require('express');
const route = express.Router();
const markentry = require('../models/markentry');
const studentmaster = require('../models/studentmaster');
const calculation = require('../models/calculation');
const academic = require('../models/academic');
const mentor = require('../models/mentor');
const coursemapping = require('../models/coursemapping');
const hod = require('../models/hod');
const rsmatrix = require('../models/rsmatrix');

// ------------------------------------------------------------------------------------------------------- //

// Role of StaffId (Tutor, Course Handler, HOD)

route.post('/chkstaffId', async (req, res) => {

    const { staff_id } = req.body;

    const academicdata = await academic.findOne({ where: { active_sem: 1 } });

    const courseHandleStaffId = await coursemapping.findOne({
        where: { staff_id: staff_id, academic_sem: academicdata.academic_sem }
    });

    const tutorHandleStaffId = await mentor.findOne({
        where: { staff_id: staff_id, academic_year: academicdata.academic_year }
    });

    const hodHandleStaffId = await hod.findOne({
        where: { staff_id: staff_id }
    });

    res.json({ courseHandleStaffId, tutorHandleStaffId, hodHandleStaffId });
});

// ------------------------------------------------------------------------------------------------------- //
// -------------------- COMMON COURSE OUTCOME CALCULATION FUNCTION --------------------------------------- //
// ------------------------------------------------------------------------------------------------------- //

async function calculateCourseOutcome(courseCodes, cal, academicSem) {

    if (!courseCodes || courseCodes.length === 0) {
        return {};
    }

    // Fetch all marks for the given course codes and academic semester
    const marks = await markentry.findAll({
        where: {
            course_code: courseCodes,
            academic_sem: academicSem
        }
    });

    // Structures to hold counts of students above threshold per course and per type
    let countAboveThreshold = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {} };
    const studentCountsByCourse = {};

    // First pass: count students above threshold for each course and each type
    marks.forEach(entry => {
        const {
            course_code,
            c1_lot = 0, c2_lot = 0, a1_lot = 0, a2_lot = 0,
            c1_mot = 0, c2_mot = 0,
            c1_hot = 0, c2_hot = 0,
            ese_lot = 0, ese_mot = 0, ese_hot = 0
        } = entry.dataValues;

        // Calculate percentages
        const lot_percentage = ((c1_lot || 0) + (c2_lot || 0) + (a1_lot || 0) + (a2_lot || 0)) / (cal.c_lot || 1) * 100;
        const mot_percentage = ((c1_mot || 0) + (c2_mot || 0)) / (cal.c_mot || 1) * 100;
        const hot_percentage = ((c1_hot || 0) + (c2_hot || 0)) / (cal.c_hot || 1) * 100;
        const elot_percentage = (ese_lot || 0) / (cal.ese_lot || 1) * 100;
        const emot_percentage = (ese_mot || 0) / (cal.ese_mot || 1) * 100;
        const ehot_percentage = (ese_hot || 0) / (cal.ese_hot || 1) * 100;

        // Initialize counters for this course if not already
        ['lot', 'mot', 'hot', 'elot', 'emot', 'ehot'].forEach(type => {
            if (!countAboveThreshold[type][course_code]) {
                countAboveThreshold[type][course_code] = 0;
            }
        });
        if (!studentCountsByCourse[course_code]) {
            studentCountsByCourse[course_code] = 0;
        }
        studentCountsByCourse[course_code]++;

        // Increment if above threshold
        if (lot_percentage >= cal.co_thresh_value) countAboveThreshold.lot[course_code]++;
        if (mot_percentage >= cal.co_thresh_value) countAboveThreshold.mot[course_code]++;
        if (hot_percentage >= cal.co_thresh_value) countAboveThreshold.hot[course_code]++;
        if (elot_percentage >= cal.co_thresh_value) countAboveThreshold.elot[course_code]++;
        if (emot_percentage >= cal.co_thresh_value) countAboveThreshold.emot[course_code]++;
        if (ehot_percentage >= cal.co_thresh_value) countAboveThreshold.ehot[course_code]++;
    });

    // Calculate percentage of students above threshold per course and per type
    let percentageAboveThreshold = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {} };
    for (const course_code of courseCodes) {
        const totalStudents = studentCountsByCourse[course_code] || 1;

        percentageAboveThreshold.lot[course_code] = (countAboveThreshold.lot[course_code] / totalStudents) * 100;
        percentageAboveThreshold.mot[course_code] = (countAboveThreshold.mot[course_code] / totalStudents) * 100;
        percentageAboveThreshold.hot[course_code] = (countAboveThreshold.hot[course_code] / totalStudents) * 100;
        percentageAboveThreshold.elot[course_code] = (countAboveThreshold.elot[course_code] / totalStudents) * 100;
        percentageAboveThreshold.emot[course_code] = (countAboveThreshold.emot[course_code] / totalStudents) * 100;
        percentageAboveThreshold.ehot[course_code] = (countAboveThreshold.ehot[course_code] / totalStudents) * 100;
    }

    // Convert percentages to attainment levels (0-3)
    let attainedScores = { lot: {}, mot: {}, hot: {}, elot: {}, emot: {}, ehot: {}, overall: {}, grade: {}, capso: {} };

    for (const course_code of courseCodes) {
        attainedScores.lot[course_code] = await calculateCategory(percentageAboveThreshold.lot[course_code]);
        attainedScores.mot[course_code] = await calculateCategory(percentageAboveThreshold.mot[course_code]);
        attainedScores.hot[course_code] = await calculateCategory(percentageAboveThreshold.hot[course_code]);
        attainedScores.elot[course_code] = await calculateCategory(percentageAboveThreshold.elot[course_code]);
        attainedScores.emot[course_code] = await calculateCategory(percentageAboveThreshold.emot[course_code]);
        attainedScores.ehot[course_code] = await calculateCategory(percentageAboveThreshold.ehot[course_code]);

        // Overall score combining CIA and ESE weightages
        attainedScores.overall[course_code] = {
            lot: (attainedScores.lot[course_code] * (cal.cia_weightage / 100)) +
                (attainedScores.elot[course_code] * (cal.ese_weightage / 100)),
            mot: (attainedScores.mot[course_code] * (cal.cia_weightage / 100)) +
                (attainedScores.emot[course_code] * (cal.ese_weightage / 100)),
            hot: (attainedScores.hot[course_code] * (cal.cia_weightage / 100)) +
                (attainedScores.ehot[course_code] * (cal.ese_weightage / 100))
        };

        const avgOverallScore = (
            attainedScores.overall[course_code].lot +
            attainedScores.overall[course_code].mot +
            attainedScores.overall[course_code].hot
        ) / 3;

        attainedScores.grade[course_code] = calculateGrade(avgOverallScore);

        // CAPSO calculation for this course
        const cop = await rsmatrix.findAll({ where: { course_code: course_code } });
        const lot = attainedScores.overall[course_code]?.lot;
        const mot = attainedScores.overall[course_code]?.mot;
        const hot = attainedScores.overall[course_code]?.hot;

        for (const entry of cop) {
            const capso1 = ((lot * entry.co1_pso1) + (lot * entry.co2_pso1) +
                (mot * entry.co3_pso1) + (mot * entry.co4_pso1) +
                (hot * entry.co5_pso1)) /
                (entry.co1_pso1 + entry.co2_pso1 + entry.co3_pso1 + entry.co4_pso1 + entry.co5_pso1);
            const capso2 = ((lot * entry.co1_pso2) + (lot * entry.co2_pso2) +
                (mot * entry.co3_pso2) + (mot * entry.co4_pso2) +
                (hot * entry.co5_pso2)) /
                (entry.co1_pso2 + entry.co2_pso2 + entry.co3_pso2 + entry.co4_pso2 + entry.co5_pso2);
            const capso3 = ((lot * entry.co1_pso3) + (lot * entry.co2_pso3) +
                (mot * entry.co3_pso3) + (mot * entry.co4_pso3) +
                (hot * entry.co5_pso3)) /
                (entry.co1_pso3 + entry.co2_pso3 + entry.co3_pso3 + entry.co4_pso3 + entry.co5_pso3);
            const capso4 = ((lot * entry.co1_pso4) + (lot * entry.co2_pso4) +
                (mot * entry.co3_pso4) + (mot * entry.co4_pso4) +
                (hot * entry.co5_pso4)) /
                (entry.co1_pso4 + entry.co2_pso4 + entry.co3_pso4 + entry.co4_pso4 + entry.co5_pso4);
            const capso5 = ((lot * entry.co1_pso5) + (lot * entry.co2_pso5) +
                (mot * entry.co3_pso5) + (mot * entry.co4_pso5) +
                (hot * entry.co5_pso5)) /
                (entry.co1_pso5 + entry.co2_pso5 + entry.co3_pso5 + entry.co4_pso5 + entry.co5_pso5);

            attainedScores.capso[course_code] = {
                capso1, capso2, capso3, capso4, capso5,
                capso: (capso1 + capso2 + capso3 + capso4 + capso5) / 5,
            };
        }
    }

    return attainedScores;
}

// ------------------------------------------------------------------------------------------------------- //
// -------------------- TUTOR COURSE OUTCOME ------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------- //

route.post('/checkTutorCOC', async (req, res) => {

    const { staff_id } = req.body;

    const academicdata = await academic.findOne({ where: { active_sem: 1 } });
    const tutorHandleStaffId = await mentor.findOne({ where: { staff_id: staff_id } });

    // Get all students under this tutor
    const stuRegNo = await studentmaster.findAll({
        where: {
            category: tutorHandleStaffId.category,
            dept_id: tutorHandleStaffId.dept_id,
            batch: tutorHandleStaffId.batch,
            section: tutorHandleStaffId.section
        },
        attributes: ['reg_no']
    });
    const stud_regs = stuRegNo.map(student => student.reg_no);

    const course_codes = await markentry.findAll({
        where: { reg_no: stud_regs, academic_sem: academicdata.academic_sem },
        attributes: ['course_code']
    });
    const stud_coursecodes = [...new Set(course_codes.map(entry => entry.course_code))];

    const cal = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } });

    const attainedScores = await calculateCourseOutcome(stud_coursecodes, cal, academicdata.academic_sem);

    if (stud_coursecodes.length > 0) {
        let totalCapso1 = 0, totalCapso2 = 0, totalCapso3 = 0, totalCapso4 = 0, totalCapso5 = 0;
        for (const course_code of stud_coursecodes) {
            const cap = attainedScores.capso[course_code];
            if (cap) {
                totalCapso1 += cap.capso1;
                totalCapso2 += cap.capso2;
                totalCapso3 += cap.capso3;
                totalCapso4 += cap.capso4;
                totalCapso5 += cap.capso5;
            }
        }
        const totalCourses = stud_coursecodes.length;
        attainedScores.meanScores = {
            pso1: totalCapso1 / totalCourses,
            pso2: totalCapso2 / totalCourses,
            pso3: totalCapso3 / totalCourses,
            pso4: totalCapso4 / totalCourses,
            pso5: totalCapso5 / totalCourses,
            pso: (totalCapso1 + totalCapso2 + totalCapso3 + totalCapso4 + totalCapso5) / (5 * totalCourses)
        };
    }

    res.json({ attainedScores });
});

// ------------------------------------------------------------------------------------------------------- //
// -------------------- ADMIN COURSE OUTCOME ------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------- //

route.post('/checkAdminCOC', async (req, res) => {

    const academicdata = await academic.findOne({ where: { active_sem: 1 } });

    const course_codes = await markentry.findAll({
        where: { academic_sem: academicdata.academic_sem },
        attributes: ['course_code']
    });
    const stud_coursecodes = [...new Set(course_codes.map(entry => entry.course_code))];

    const cal = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } });

    const attainedScores = await calculateCourseOutcome(stud_coursecodes, cal, academicdata.academic_sem);

    res.json({ attainedScores });
});

// ------------------------------------------------------------------------------------------------------- //
// -------------------- COURSE HANDLER COURSE OUTCOME ---------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------- //

route.post('/checkCourseCOC', async (req, res) => {

    const { staff_id } = req.body;

    const academicdata = await academic.findOne({ where: { active_sem: 1 } });

    const courseHandleStaffId = await coursemapping.findAll({
        where: { staff_id: staff_id, academic_sem: academicdata.academic_sem },
        attributes: ['course_code']
    });

    const stud_coursecodes = [...new Set(courseHandleStaffId.map(entry => entry.course_code))];
    const cal = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } });
    const attainedScores = await calculateCourseOutcome(stud_coursecodes, cal, academicdata.academic_sem);
    res.json({ attainedScores });
});

// ------------------------------------------------------------------------------------------------------- //
// -------------------- HOD COURSE OUTCOME --------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------- //

route.post('/checkHodCOC', async (req, res) => {

    const { staff_id } = req.body;

    const academicdata = await academic.findOne({ where: { active_sem: 1 } });

    const hodDeptHandle = await hod.findAll({ where: { staff_id }, attributes: ['dept_id'] });
    const hod_dept_id = [...new Set(hodDeptHandle.map(entry => entry.dept_id))];

    const courseHandleStaffId = await markentry.findAll({
        where: { dept_id: hod_dept_id, academic_sem: academicdata.academic_sem },
        attributes: ['course_code']
    });

    const stud_coursecodes = [...new Set(courseHandleStaffId.map(entry => entry.course_code))];
    const cal = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } });
    const attainedScores = await calculateCourseOutcome(stud_coursecodes, cal, academicdata.academic_sem);
    res.json({ attainedScores });
});

// ------------------------------------------------------------------------------------------------------- //
// -------------------- HELPER FUNCTIONS (unchanged) ----------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------- //

async function calculateCategory(percentage) {
    try {
        const academicdata = await academic.findOne({ where: { active_sem: 1 } });
        if (!academicdata) {
            console.error("Academic data not found");
            return null;
        }
        const data = await calculation.findOne({ where: { academic_sem: academicdata.academic_sem } });
        if (!data) {
            console.error("Calculation data not found for the specified academic year");
            return null;
        }
        if (percentage >= data.so_l3_ug) return 3;
        else if (percentage >= data.so_l2_ug) return 2;
        else if (percentage >= data.so_l1_ug) return 1;
        else if (percentage > data.so_l0_ug) return 0;
        return 0;
    } catch (error) {
        console.error('Error fetching academic or calculation data:', error);
    }
}

// ------------------------------------------------------------------------------------------------------- //

function calculateGrade(overallAverage) {
    if (overallAverage >= 2.5) return 'High';
    else if (overallAverage >= 1.5 && overallAverage < 2.5) return 'Medium';
    else if (overallAverage >= 0) return 'Low';
    else return 'N/A';
}

// ------------------------------------------------------------------------------------------------------- //

module.exports = route;