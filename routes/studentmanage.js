const express = require("express");
const route = express.Router();
const studentmaster = require('../models/studentmaster');
const markentry = require('../models/markentry');
const academic = require("../models/academic");
const coursemapping = require("../models/coursemapping");
const { Op, where, col, fn, Sequelize } = require('sequelize');

// ------------------------------------------------------------------------------------------------------- //

// Student Details Fetching 

route.get('/studetails', async (req, res) => {
	const activeAcademic = await academic.findOne({
		where: { active_sem: 1 },
	})

	const studata = await studentmaster.findAll({
		where: { academic_sem: activeAcademic.academic_sem },
	})

	res.json(studata);
})

// ------------------------------------------------------------------------------------------------------- //

// Fetch Category

route.get('/category', async (req, res) => {
	try {
		const activeAcademic = await academic.findOne({
			where: { active_sem: 1 },
		});

		if (!activeAcademic) {
			console.log('No active academic year found');
			return res.status(404).json({ error: 'Active academic year not found' });
		}

		const activeSemester = activeAcademic.academic_sem;

		const categories = await studentmaster.findAll({
			where: { academic_sem: activeSemester },
			attributes: ['category'],
		})

		const uniqueCategory = [...new Set(categories.map(entry => entry.category))];

		res.json(uniqueCategory);
	}
	catch (error) {
		console.error('Error fetching categories:', error);
		res.status(500).json({ error: 'Failed to fetch categories' });
	}
})

//-----------------------------------------------------------------------------------------------------------//

// Get Course Id based on the Selected Category

route.post('/deptId', async (req, res) => {
	try {
		const { category } = req.body;

		const activeAcademic = await academic.findOne({
			where: { active_sem: 1 },
		})

		if (!activeAcademic) {
			return res.status(404).json({ error: "Active Academic Year not Found" });
		}

		const activeSemester = activeAcademic.academic_sem;

		const deptId = await studentmaster.findAll(
			{
				where: {
					academic_sem: activeSemester,
					category: category
				},
				attributes: ['dept_id'],
			})

		const uniqueDeptId = [...new Set(deptId.map((course) => course.dept_id))]
		res.status(200).json(uniqueDeptId);
	}
	catch (error) {
		console.error("Error in Course Id Route:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
})

//-----------------------------------------------------------------------------------------------------------//

// Get Semester based on selected Course Id

route.post('/semester', async (req, res) => {
	try {
		const { category, deptId } = req.body;

		const activeAcademic = await academic.findOne({
			where: { active_sem: 1 },
		})

		if (!activeAcademic) {
			return res.status(404).json({ error: "Active Academic Year Not Found" });
		}

		const activeSemester = activeAcademic.academic_sem;

		const semesters = await studentmaster.findAll({
			where: {
				academic_sem: activeSemester,
				category: category,
				dept_id: deptId,
			},
			attributes: ['semester'],
		});

		const uniqueSemesters = [...new Set(semesters.map((entry) => entry.semester))]
		res.status(200).json(uniqueSemesters);

	}
	catch (error) {
		console.error("Error in Semester Route:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
})

//-----------------------------------------------------------------------------------------------------------//

// To fetch the Section 

route.post('/section', async (req, res) => {
	try {
		const { category, deptId, semester } = req.body;

		const activeAcademic = await academic.findOne({
			where: { active_sem: 1 },
		});

		if (!activeAcademic) {
			return res.status(404).json({ error: "Active academic year not found" });
		}

		const activeSemester = activeAcademic.academic_sem;

		const sections = await studentmaster.findAll({
			where: {
				academic_sem: activeSemester,
				category: category,
				dept_id: deptId,
				semester: semester,
			},
			attributes: ['section'],
		});

		const uniqueSections = [...new Set(sections.map((entry) => entry.section))]

		res.status(200).json(uniqueSections);

	}
	catch (error) {
		console.error("Error in Section Route:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
})

//-----------------------------------------------------------------------------------------------------------//

route.post('/coursecode', async (req, res) => {
	try {
		const { category, deptId, semester, section } = req.body;

		const activeAcademic = await academic.findOne({
			where: { active_sem: 1 },
		});

		if (!activeAcademic) {
			return res.status(404).json({ error: "Active academic year not found" });
		}

		const activeSemester = activeAcademic.academic_sem;

		const courseCodes = await markentry.findAll({
			where: {
				academic_sem: activeSemester,
				category: category,
				dept_id: deptId,
				semester: semester
			},
			attributes: ['course_code'],
		})

		if (courseCodes.length === 0) {
			return res.status(404).json({ error: "No course code found for the provided details." });
		}

		const uniqueCourseCodes = [...new Set(courseCodes.map((entry) => entry.course_code))];

		res.status(200).json(uniqueCourseCodes);

	}
	catch (error) {
		console.error("Error in /coursecode route:", error);
		res.status(500).json({ error: "Internal server error" });
	}
})

//-----------------------------------------------------------------------------------------------------------//

// Add new Student 

route.post("/addstudent", async (req, res) => {
	try {
		const { stu_name, reg_no, batch, emis, section, semester, mentor,
			category, dept_id, course_codes } = req.body;

		const activeAcademic = await academic.findOne({
			where: { active_sem: 1 },
		});

		if (!activeAcademic) {
			return res.status(404).json({ error: "Active academic year not found" });
		}

		const activeSemester = activeAcademic.academic_sem;

		if (!stu_name || !reg_no) {
			return res.status(400).json({ error: "Student name and registration number are required." });
		}

		const newStudent = await studentmaster.create({
			stu_name: stu_name, reg_no: reg_no, batch: batch,
			emis: emis, section: section, semester: semester,
			mentor: mentor, category: category, dept_id: dept_id,
			academic_sem: activeSemester
		});

		const markEntryPromises = course_codes.map(async (course_code) => {
			if (typeof course_code !== 'string') {
				throw new Error(`Invalid course_code: ${course_code} should be a string.`);
			}

			return await markentry.create({
				stu_name: stu_name, reg_no: reg_no, semester: semester, batch: batch,
				category: category, dept_id: dept_id, course_code: course_code,
				academic_sem: activeSemester, c1_lot: null, c1_hot: null, c1_mot: null,
				c1_total: null, c2_lot: null, c2_mot: null, c2_hot: null, c2_total: null,
				a1_lot: null, a2_lot: null, ese_lot: null, ese_hot: null, ese_mot: null,
				ese_total: null,
			})
		})

		const markEntries = await Promise.all(markEntryPromises);

		res.status(201).json({
			message: "Student and Mark Entries Added Successfully",
			student: newStudent,
			markEntries: markEntries,
		})
	}
	catch (error) {
		console.error("Error Adding Student:", error);
		res.status(500).json({ error: "Failed to Add Student" });
	}
})

// ------------------------------------------------------------------------------------------------------- //

route.delete('/deletestudent/:reg_no', async (req, res) => {
	try {
		const { reg_no } = req.params;

		const deletedMarks = await markentry.destroy({
			where: { reg_no }
		})

		const deletedStudent = await studentmaster.destroy({
			where: { reg_no }
		});

		if (deletedStudent) {
			res.status(200).json({
				message: 'Student and Associated Marks Deleted Successfully!'
			})
		}
		else {
			res.status(404).json({ error: 'Student not Found!' });
		}
	}
	catch (error) {
		console.error('Error deleting Student and Associated Marks:', error);
		res.status(500).json({ error: 'Failed to delete Student and Associated Marks' });
	}
})



















// ------------------------------------------------------------------------------------------------------- //

// Dropdown values for student manage ( Student List Table )

route.get('/student/manage/dropdownValues', async (req, res) => {

	try {

		const academicYear = await academic.findOne({ where: { active_sem: 1 } })

		// console.log(academicYear)

		const uniqueSemester = await coursemapping.findAll({
			where: { academic_sem: academicYear.academic_sem },
			attributes: [
				[Sequelize.fn('DISTINCT', Sequelize.col('semester')), 'semester']
			],
			raw: true
		});

		const uniqueDeptId = await coursemapping.findAll({
			attributes: [
				[Sequelize.fn('DISTINCT', Sequelize.col('dept_id')), 'dept_id']
			],
			raw: true
		})

		return res.status(200).json({ uniqueSemester, uniqueDeptId });

	} catch (error) {
		console.log('Error in fetching student manage dropdown values : ', error);
		return res.status(500).json({ message: 'Error fetching values' });
	}
})

// ------------------------------------------------------------------------------------------------------- //

// Fetch students based on dropdown values

route.post('/student/manage/studentsList', async (req, res) => {

	const { semester, department, category } = req.body;

	try {

		const academicYear = await academic.findOne({ where: { active_sem: 1 } })

		const registerNos = await markentry.findAll({
			where: {
				semester, dept_id: department, category, academic_sem: academicYear.academic_sem
			},
			attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('reg_no')), 'reg_no']],
			raw: true
		})

		// console.log(registerNos)

		const studentDetails = await studentmaster.findAll({
			where: { semester, dept_id: department, category }
		})

		const studentsList = registerNos.map(student => {
			const details = studentDetails.find(info => student.reg_no === info.reg_no)
			return {
				reg_no: student.reg_no,
				stu_name: details?.stu_name || null,
				category: details?.category || null,
				dept_id: details?.dept_id || null,
				semester: details?.semester || null,
				section: details?.section || null,
				batch: details?.batch || null,
			}
		})

		return res.status(200).json({ studentsList });

	} catch (error) {
		console.log('Error in fetching students list for student manage : ', error);
		return res.status(500).json({ message: 'Error fetching values' });
	}
})

// ------------------------------------------------------------------------------------------------------- //

// Fetch dropdown values for Student Manage for Add

route.get('/student/manage/add/dropdownValues', async (req, res) => {

	try {

		const academicYear = await academic.findOne({ where: { active_sem: 1 } })

		// console.log(academicYear)

		const uniqueSemester = await coursemapping.findAll({
			where: { academic_sem: academicYear.academic_sem },
			attributes: [
				[Sequelize.fn('DISTINCT', Sequelize.col('semester')), 'semester']
			],
			raw: true
		});

		const uniqueDeptId = await coursemapping.findAll({
			attributes: [
				[Sequelize.fn('DISTINCT', Sequelize.col('dept_id')), 'dept_id']
			],
			raw: true
		})

		const uniqueBatch = await studentmaster.findAll({
			attributes: [
				[Sequelize.fn('DISTINCT', Sequelize.col('batch')), 'batch']
			],
			raw: true
		})

		const uniqueSection = await studentmaster.findAll({
			attributes: [
				[Sequelize.fn('DISTINCT', Sequelize.col('section')), 'section']
			],
			raw: true
		})

		res.status(200).json({
			uniqueSemester: uniqueSemester.map(item => item.semester),
			uniqueDeptId: uniqueDeptId.map(item => item.dept_id),
			uniqueBatch: uniqueBatch.map(item => item.batch),
			uniqueSection: uniqueSection.map(item => item.section)
		});

	} catch (error) {
		console.log('Error in fetching student manage dropdown values : ', error);
		return res.status(500).json({ message: 'Error fetching values' });
	}
})

// ------------------------------------------------------------------------------------------------------- //

// Student Add

route.post('/newStudentAdd', async (req, res) => {

	const { reg_no, stu_name, dept_id, category, semester, section, batch } = req.body;

	try {

		const existingStudent = await studentmaster.findOne({ where: { reg_no, semester } })
		// console.log(existingStudent)
		if (existingStudent) {
			return res.json({ message: 'Already existing register number' })
		}
		else {
			await studentmaster.create({
				reg_no, stu_name, dept_id, category, semester, section, batch
			})
			res.status(201).json({ message: "New Student Added" });
		}

	} catch (error) {
		console.log('Error in fetching student manage dropdown values : ', error);
		return res.status(500).json({ message: 'Error fetching values' });
	}
})

// ------------------------------------------------------------------------------------------------------- //

// Student Delete

route.delete('/student/delete', async (req, res) => {

	const { reg_no } = req.body;
	// console.log(reg_no)  

	try {
		const deletedCount = await studentmaster.destroy({ where: { reg_no } });

		if (deletedCount > 0) {
			return res.json({ message: 'Deleted successfully' });
		} else {
			return res.status(404).json({ message: 'Student not found' });
		}
	} catch (error) {
		console.error('Error in deleting student : ', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
})


module.exports = route;