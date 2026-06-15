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
const coursemaster = require('./models/coursemaster');

// ------------------------------------------------------------------------------------------------------- //

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
const dataDelete = require('./routes/dataDelete');
const obereport = require('./routes/obereport');

// ------------------------------------------------------------------------------------------------------- //

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ------------------------------------------------------------------------------------------------------- //

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
app.use('/api', dataDelete);
app.use('/api', dataDelete);
app.use('/api', obereport);

// ------------------------------------------------------------------------------------------------------- //

app.use(bodyParser.json({ limit: '10mb' }));
require('dotenv').config({ quiet: true });
const port = process.env.PORT || 5001;
const clientUrl = process.env.CLIENT_URL;
const secretKey = process.env.SECRET_KEY;

// ------------------------------------------------------------------------------------------------------- //

// Database Authenticate Coding

sequelize_conn.authenticate()

    .then(() => {
        console.log('Database Connected');
        app.listen(port, '0.0.0.0', () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the Database:', err);
    });

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

app.post('/login', async (req, res) => {

    const { staff_id, staff_pass } = req.body;

    try {

        const user = await staffmaster.findOne({ where: { staff_id } });
        console.log(`User found: ${user ? 'Yes' : 'No'}`);

        if (!user) {
            console.warn('Login attempt failed: User not found');
            return res.json({ success: false, message: "User not found" });
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
            return res.json({ success: false, message: "User not found" });
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
    const activeAcademic = await academic.findOne({ where: { active_sem: 1 } })
    res.json(activeAcademic);
})

// ------------------------------------------------------------------------------------------------------- //