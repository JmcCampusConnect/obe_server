const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize_conn = require('./models/dbconnection');
const staffmaster = require('./models/staffmaster');
const studentmaster = require('./models/studentmaster');
const scope = require('./models/scope');
const report = require('./models/report');
const markentry = require('./models/markentry');
const coursemapping = require('./models/coursemapping');
const academic = require('./models/academic');
const rsmatrix = require('./models/rsmatrix');
const mentor = require('./models/mentor');
const calculation = require('./models/calculation');
const hod = require('./models/hod');
const coursemaster = require('./models/coursemaster')

const dashboard = require('./routes/dash');
const courselist = require('./routes/courselist');
const scopemanage = require('./routes/scopemanage');
const fileupload = require('./routes/fileupload');
const filedownload = require('./routes/filedownload');
const statusreport = require('./routes/statusreport');
const settings = require('./routes/settings');
const rsmatrixall = require('./routes/rsmatrix');
const studentmanage = require('./routes/studentmanage');
const staffmanage = require('./routes/staffmanage');
const markrelease = require('./routes/markrelease');
const studentoutcome = require('./routes/studentoutcome');
const markmanage = require('./routes/markmanage');
const courseoutcome = require('./routes/courseoutcome');
const staffcoursemanage = require('./routes/staffcoursemanage');
const hodreport = require('./routes/hodreport');
const tutorreport = require('./routes/tutorreport');
const prospecificoutcome = require('./routes/prospecificoutcome');
const prooutcome = require('./routes/prooutcome');
const showblock = require('./routes/showblock');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/api', dashboard);
app.use('/api', courselist);
app.use('/api', scopemanage);
app.use('/api', fileupload);
app.use('/api', filedownload);
app.use('/api', statusreport);
app.use('/api', settings);
app.use('/api', rsmatrixall);
app.use('/api', studentmanage);
app.use('/api', staffmanage);
app.use('/api', studentoutcome);
app.use('/api', markrelease);
app.use('/api', markmanage);
app.use('/api', courseoutcome);
app.use('/api', staffcoursemanage);
app.use('/api', hodreport);
app.use('/api', tutorreport);
app.use('/api', prospecificoutcome);
app.use('/api', prooutcome);
app.use('/api', showblock);

app.use(bodyParser.json({ limit: '10mb' }));

require('dotenv').config({ quiet: true });

const port = process.env.PORT || 5001;
const clientUrl = process.env.CLIENT_URL;
const secretKey = process.env.SECRET_KEY;

// ------------------------------------------------------------------------------------------------------- //

// Tables ( Model ) Synchronization Coding

// async function dbconncheck() 
// {
//     try 
//     {
//         // // Synchronize the Staff Master Model
//         // await staffmaster.sync();
//         // console.log('Staffmaster Table Synced');

//         // // Synchronize the Student Master Model
//         // await studentmaster.sync();
//         // console.log('Studentmaster Table Synced');

//         // // Synchronize the Academic Model
//         // await academic.sync();
//         // console.log('Academic Table Synced');

//         // // Synchronize the Coursemapping Model
//         // await coursemapping.sync();
//         // console.log('Course Mapping Table Synced');

//         // // Synchronize the Scope Model
//         // await scope.sync();
//         // console.log('Scope Table Synced');

//         // // Synchronize the Mark Entry Model
//         // await markentry.sync();
//         // console.log('Markentry Table Synced');

//         // // Synchronize the Report Model
//         // await report.sync();
//         // console.log('Report Table Synced');

//         // // Synchronize the Rs Matrix Model
//         // await rsmatrix.sync();
//         // console.log('Rs Matrix Table Synced');

//         // // Synchronize the Mentor Model
//         // await mentor.sync();
//         // console.log('Mentor Table Synced');

//         // // Synchronize the Calculation Model
//         // await calculation.sync();
//         // console.log('Calculaton Table Synced');

//         // // Synchronize the Hod Model
//         // await hod.sync();
//         // console.log('Hod Table Synced');

//         // // Synchronize the Hod Model
//         // await coursemaster.sync();
//         // console.log('Course Master Table Synced');
//     }
//     catch (error) {
//         console.log('Error Occurred:', error.message);
//     }
// }

// dbconncheck();

// ------------------------------------------------------------------------------------------------------- //

// Import Staff Data Into Database

// const staffmasterDataXL = XLSX.readFile('C:\\Users\\ACER\\Music\\Haneef\\Documents\\Obe Data Files\\Main Data\\Staff Master.xlsx');
// const staffmasterSheetNo = staffmasterDataXL.SheetNames[0];
// const staffmasterWorksheet = staffmasterDataXL.Sheets[staffmasterSheetNo];

// const staffdata = XLSX.utils.sheet_to_json(staffmasterWorksheet, { header: 1 });

// const mappedStaffData = staffdata.slice(1).map((row) => 
// {
//     if (row.length === 0) return null;
//     return {
//         staff_id: row[0],
//         staff_name: row[1],
//         staff_pass: row[2],
//         staff_dept: row[3],
//         category: row[4]
//     };
// }).filter(Boolean);

// const staffImportData = async () => 
// {
//     try {
//         const staffExistingRecords = await staffmaster.findAll();
//         if (staffExistingRecords.length > 0) {
//             await staffmaster.destroy({ where: {} });
//             console.log('Existing records deleted.');
//         }
//         await staffmaster.bulkCreate(mappedStaffData, { ignoreDuplicates: true });
//         console.log('Staff Master Data Inserted Successfully!');
//     }
//     catch (err) {
//         console.error('Error Importing Data:', err.stack);
//     }
// }

// staffImportData();

// ------------------------------------------------------------------------------------------------------- //

// Import Course Mapping Data Into Database

// const coursemappingDataXL = XLSX.readFile('C:\\Users\\Lenovo PC\\OneDrive\\Documents\\Obe Data Files\\Staff Course Mapping.XLSX');
// const coursemappingSheetNo = coursemappingDataXL.SheetNames[0]; 
// const coursemappingWorksheet = coursemappingDataXL.Sheets[coursemappingSheetNo];
// const coursemappingdata = XLSX.utils.sheet_to_json(coursemappingWorksheet, { header: 1 });

// const mappedCourseMappingData = coursemappingdata.slice(1).map((row) => ({
//     category: row[0],          
//     batch: row[1],  
//     dept_id: row[2],         
//     degree: row[3],       
//     branch: row[4],    
//     semester: row[5],       
//     section: row[6],         
//     course_code: row[7],           
//     staff_id: row[8],          
//     staff_name: row[9],
//     course_title: row[10]            
// }));

// const courseMappingImportData = async () => 
// {
//     try {
//         const coursemappingExistingRecords = await coursemapping.findAll();
//         if (coursemappingExistingRecords.length > 0) {
//             await coursemapping.destroy({ where: {} });
//             console.log('Existing records deleted.');
//         }
//         await sequelize_conn.query('ALTER TABLE coursemapping AUTO_INCREMENT = 1');
//         await coursemapping.bulkCreate(mappedCourseMappingData, { ignoreDuplicates: true });
//         console.log('Course Mapping Data Inserted Successfully!');
//     } 
//     catch (err) {
//         console.error('Error Importing Data :', err);
//     }
// };

// courseMappingImportData();

// ------------------------------------------------------------------------------------------------------- //

// Import Student Tables Data Into Database

// const studentmasterDataXL = XLSX.readFile('C:\\Users\\Lenovo PC\\OneDrive\\Documents\\Obe Data Files\\Student Master.XLSX');
// const studentmasterSheetNo = studentmasterDataXL.SheetNames[0];
// const studentmasterWorksheet = studentmasterDataXL.Sheets[studentmasterSheetNo];
// const studentdata = XLSX.utils.sheet_to_json(studentmasterWorksheet, { header: 1 });

// const mappedStudentData = studentdata.slice(1).map((row) => ({
//     reg_no: row[0],          
//     stu_name: row[1],           
//     dept_id: row[2],       
//     category: row[3],    
//     semester: row[4],       
//     section: row[5],         
//     batch: row[6],           
//     mentor: row[7],          
//     emis: row[8]             
// }));

// const studentImportData = async () => 
// {
//     try {
//         const studentExistingRecords = await studentmaster.findAll();

//         if (studentExistingRecords.length > 0) {
//             await studentmaster.destroy({ where: {} });
//             console.log('Existing records deleted.');
//         }
//         await studentmaster.bulkCreate(mappedStudentData, { ignoreDuplicates: true });
//         console.log('Student Master Data Inserted Successfully!');
//     } 
//     catch (err) {
//         console.error('Error Importing Data:', err);
//     }
// }

// studentImportData();

// ------------------------------------------------------------------------------------------------------- //

// Markenty Table Data Insertion

// const markentryDataXL = XLSX.readFile('C:\\Users\\Lenovo PC\\OneDrive\\Documents\\Obe Data Files\\Student Course Mapping.XLSX');
// const markentrySheetNo = markentryDataXL.SheetNames[0]; 
// const markentryWorksheet = markentryDataXL.Sheets[markentrySheetNo];
// const markentryData = XLSX.utils.sheet_to_json(markentryWorksheet, { header: 1 });

// const mappedMarkEntryData = markentryData.slice(1).map((row) => ({
//     batch: row[0],          
//     category: row[1],       
//     dept_id: row[2],      
//     reg_no: row[3],        
//     course_code: row[4],    
//     semester: row[5],       
//     c1_lot: row[6],         
//     c1_hot: row[7],         
//     c1_mot: row[8],         
//     c1_total: row[9],       
//     c2_lot: row[10],        
//     c2_hot: row[11],       
//     c2_mot: row[12],        
//     c2_total: row[13],      
//     a1_lot: row[14],        
//     a2_lot: row[15],       
//     ese_lot: row[16],       
//     ese_hot: row[17],       
//     ese_mot: row[18],      
//     ese_total: row[19]      
// }));

// const markEntryImportData = async () => 
// {
//     try {
//         const markEntryExistingRecords = await markentry.findAll();
//         if (markEntryExistingRecords.length > 0) {
//             await markentry.destroy({ where: {} });
//             console.log('Existing records deleted.');
//         }
//         await sequelize_conn.query('ALTER TABLE markentry AUTO_INCREMENT = 1');
//         await markentry.bulkCreate(mappedMarkEntryData, { ignoreDuplicates: true });
//         console.log('Mark Entry Data Inserted Successfully!');
//     } 
//     catch (err) {
//         console.error('Error Importing Data :', err);
//     }
// };

// markEntryImportData();

// ------------------------------------------------------------------------------------------------------- //

// Scope Table Data Insertion

// const scopeDataXL = XLSX.readFile('C:\\Users\\ACER\\Music\\Haneef\\Documents\\Obe Data Files\\Main Data\\Scope.xlsx');
// const scopeSheetNo = scopeDataXL.SheetNames[0];
// const scopeWorksheet = scopeDataXL.Sheets[scopeSheetNo];
// const scopedata = XLSX.utils.sheet_to_json(scopeWorksheet, { header: 1 });

// const mappedScopeData = scopedata.slice(1).map((row) => ({
//     staff_id: row[0],
//     role: row[1],
//     dashboard: row[2],
//     course_list: row[3],
//     course_outcome: row[4],
//     student_outcome: row[5],
//     program_outcome: row[6],
//     program_specific_outcome: row[7],
//     mentor_report: row[8],
//     hod_report: row[9],
//     report: row[10],
//     input_files: row[11],
//     manage: row[12],
//     relationship_matrix: row[13],
//     settings: row[14]
// }));

// const scopeImportData = async () => 
// {
//     try {
//         const scopeExistingRecords = await scope.findAll();

//         if (scopeExistingRecords.length > 0) {
//             await scope.destroy({ where: {} });
//             console.log('Existing scope records deleted.');
//         }

//         await scope.bulkCreate(mappedScopeData, { ignoreDuplicates: true });
//         console.log('Scope Data Inserted Successfully!');
//     }
//     catch (err) {
//         console.error('Error Importing Scope Data:', err.stack);
//     }
// }

// scopeImportData();

// ------------------------------------------------------------------------------------------------------- //


app.post('/login', async (req, res) => {

    const { staff_id, staff_pass } = req.body;

    try {

        const user = await staffmaster.findOne({ where: { staff_id } });

        if (!user) {
            return res.json({ success: false, message: "User Not Found" });
        }

        if (user.staff_pass !== staff_pass) {
            return res.json({ success: false, message: "Invalid Password" });
        }

        const isWeakPassword =
            user.staff_pass.length < 8 ||
            !/[A-Z]/.test(user.staff_pass) ||
            !/[a-z]/.test(user.staff_pass) ||
            !/\d/.test(user.staff_pass) ||
            !/[!@#$%^&*()_+={}[\]:;"'<,>.?/\\|~-]/.test(user.staff_pass);

        const needsPasswordChange = user.is_default_password === true || isWeakPassword;

        if (needsPasswordChange) {
            return res.json({
                success: true,
                message: "Password change required",
                needsPasswordChange: true
            });
        }

        return res.json({
            success: true,
            message: "Login Successful",
            needsPasswordChange: false
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

// ------------------------------------------------------------------------------------------------------- //

// Password Update for staff for weak password

app.post('/update-password', async (req, res) => {

    const { staff_id, old_password, new_password } = req.body;

    try {

        const user = await staffmaster.findOne({ where: { staff_id } });

        if (!user) {
            return res.json({ success: false, message: "User Not Found" });
        }

        if (user.staff_pass !== old_password) {
            return res.json({ success: false, message: "Old password is incorrect" });
        }

        const isWeakPassword =
            new_password.length < 8 ||
            !/[A-Z]/.test(new_password) ||
            !/[a-z]/.test(new_password) ||
            !/\d/.test(new_password) ||
            !/[!@#$%^&*()_+={}[\]:;"'<,>.?/\\|~-]/.test(new_password);

        if (isWeakPassword) {
            return res.json({
                success: false,
                message: "New password does not meet strength requirements."
            });
        }

        await staffmaster.update(
            {
                staff_pass: new_password,
                is_default_password: false 
            },
            { where: { staff_id } }
        );

        return res.json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (error) {
        console.error("Password update error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Scope Options Validating Coding

app.get('/scope/:staffId', async (req, res) => {

    const { staffId } = req.params;

    try {
        const scopeDetails = await scope.findOne({
            where: { staff_id: staffId }
        })
        res.json(scopeDetails);
    }
    catch (err) {
        console.error('Error fetching scope details:', err);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Database Authenticate Coding

app.post('/staffName', async (req, res) => {

    const { staffId } = req.body;

    const user = await staffmaster.findOne({
        where: { staff_id: staffId },
        attributes: ['staff_name'],
        raw: true
    })

    res.json(user)
})

// ------------------------------------------------------------------------------------------------------- //

// Database Authenticate Coding

sequelize_conn.authenticate()

    .then(() => {
        console.log('Database Connected');
        app.listen(port, () => {
            console.log(`Server running on http:/localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the Database:', err);
    });

// ------------------------------------------------------------------------------------------------------- //

// Academic Year Setting Coding

app.put('/academic', async (req, res) => {

    const { academicsem } = req.body;

    try {
        await academic.update(
            { active_sem: 0 },
            { where: {} }
        )

        const academicupdate = await academic.findOne({
            where: {
                academic_sem: academicsem,
            }
        })

        if (academicupdate) {
            academicupdate.active_sem = 1;
            await academicupdate.save();
            res.json(academicupdate);
        }
        else {
            res.status(404).json({ error: "Academic Year Not Found" });
        }
    }
    catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ error: "Something went wrong with the Server" });
    }
})

// ------------------------------------------------------------------------------------------------------- //

// Active Sem Fetching Coding

app.post('/activesem', async (req, res) => {
    const activeAcademic = await academic.findOne({
        where: { active_sem: 1 }
    })
    res.json(activeAcademic);
})

// ------------------------------------------------------------------------------------------------------- //