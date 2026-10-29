require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const xirr = require('xirr');
const cron = require('node-cron');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const userModel = require('./models/user');
const mutualModel = require('./models/mutual_fund');
const fixedModel = require('./models/fixed_deposit');
const helpModel = require('./models/help');
const trackFundModel = require('./models/tracked_fund');
const trackedFixedModel = require('./models/tracked_fd');
const bondModel = require('./models/bond');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

const mongoURI = (process.env.MONGO_URI && !process.env.MONGO_URI.includes('<username>'))
  ? process.env.MONGO_URI
  : 'mongodb://127.0.0.1:27017/vise';

mongoose.connect(mongoURI).then(() => {
  console.log("MongoDB connected");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

async function getNAV(fundCode) {
  const res = await fetch(`https://api.mfapi.in/mf/${fundCode}/latest`);
  const rec = await res.json()
  
  return rec.data[0].nav
}

cron.schedule('00 10 * * *', async () => {
  console.log("Running daily mutual fund NAV check...");
  
  const funds = await trackFundModel.find({});
//   console.log(funds)
  for(const fund of funds) {
    if(fund.status == 0) continue;
    try {
      let nav = await getNAV(fund.fundCode);
    //   console.log(nav)
      let logMsg = fund.latestLog;
      
      if (nav < fund.targetNAV) {
        await sendEmail(fund.email, fund.name, nav);
        logMsg = `Target reached on ${new Date().toLocaleDateString()}`
      }

      fund.latestLog = logMsg;
      fund.lastUpdated = new Date().toLocaleDateString();
      await fund.save();

      console.log(logMsg);
    } catch (error) {
      console.error(`Error processing ${fund.name}:`, error.message);
    }
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }
});

async function sendEmail(to, fundName, nav) {
//   console.log('Email:', process.env.MAIL_USER);
//   console.log('Pass:', process.env.MAIL_PASS ? 'Loaded' : 'Missing');

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: `Alert: NAV Dropped for ${fundName}`,
    text: `The NAV for ${fundName} has dropped to ₹${nav}. Please review your portfolio.`
  });
}

cron.schedule('00 11 * * *', async () => {
  console.log("Running daily fixed deposits maturity check...");
  
  const funds = await trackedFixedModel.find({});
//   console.log(funds)
  for(const fund of funds) {
    if(fund.status == 0) continue;
    try {
      let investedDate =  fund.date;
      let maturityPeriod = fund.maturityPeriod 
      maturityPeriod = maturityPeriod.toLowerCase().replace(/\s+/g, '');
      let newDate = new Date(investedDate);
    //   console.log(maturityPeriod)
      if(maturityPeriod == "1months") {
        newDate.setMonth(newDate.getMonth() + 1);
      }else if(maturityPeriod == "3months") {
        newDate.setMonth(newDate.getMonth() + 3);
      }else if(maturityPeriod == "6months") {
        newDate.setMonth(newDate.getMonth() + 6);
      }else if(maturityPeriod == "1years") {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }else if(maturityPeriod == "3years") {
        newDate.setFullYear(newDate.getFullYear() + 3);
      }else if(maturityPeriod == "5years") {
        newDate.setFullYear(newDate.getFullYear() + 5);
      }else if(maturityPeriod == "10years") {
        newDate.setFullYear(newDate.getFullYear() + 10);
      }else{
        console.log("Invalid maturityPeriod");
      }
     
      
      let logMsg = fund.lastLog;
      let today = new Date()
      logMsg = `Last Updated on ${today.toLocaleDateString()}`
      if (newDate <= today) {
        await sendEmailForFd(fund.userName, fund.fdName, newDate, fund.fdInvestment);
        logMsg = `Fund matured on ${newDate.toLocaleDateString()}`
        console.log('Fund reached')
      }

      fund.lastLog = logMsg;
      fund.lastUpdated = new Date().toLocaleDateString();
      await fund.save();

    //   console.log(logMsg);
    } catch (error) {
      console.error(`Error processing ${fund.name}:`, error.message);
    }
  }
});

async function sendEmailForFd(to, fundName,newDate,investedAmount) {
//   console.log('Email:', process.env.MAIL_USER);
//   console.log('Pass:', process.env.MAIL_PASS ? 'Loaded' : 'Missing');

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: `Alert: ${fundName} has reached maturity`,
    text: `Hi,
We hope you're doing well!
We're pleased to inform you that your investment in the following Fixed Deposit has reached its maturity:

Fund Name: ${fundName}
Maturity Date: ${newDate.toLocaleDateString()}
Invested Amount: ₹${investedAmount}`
  });
}


const isLogged = (req, res, next) => {
    let token = req.cookies.token;
    if (!token) {
      return res.redirect('/login');
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user_email) => {
      if (err) {
        return res.redirect('/login');
      }
      req.user = user_email;
      next();
    });
};
app.get('/',(req,res)=>{
    res.render('landing');
})
app.get('/create',(req,res)=>{
    res.render('create-account');
})
app.get('/dashboard',isLogged,(req,res)=>{
    res.render('dashboard');
})
app.get('/login',(req,res)=>{
    console.log(req.cookies)
    res.render('login_account')
})

app.post('/create-account', async (req, res) => {
    try {
        let {
            name,
            email,
            mobileno,
            username,
            password,
            confirmpassword
        } = req.body;

        // Stop execution if passwords do not match
        if (password !== confirmpassword) {
            return res.render('create-account', {
                ok: 'failed'
            });
        }

        // Hash the password
        const hash = await bcrypt.hash(password, 10)

        // Create the user in MongoDB
        await userModel.create({
            name: name,
            email: email,
            mobileno: mobileno,
            username: username,
            password: hash
        });

        // Generate authentication token
        const token = jwt.sign(
            { email: email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie before redirecting
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect('/login');

    } catch (err) {
        console.error('Signup error:', err);

        if (err.code === 11000) {
            return res.status(409).send(
                'An account with these details already exists.'
            );
        }

        return res.status(500).send(
            'Account creation failed. Please try again.'
        );
    }
});
app.post('/add_mutual_fund',isLogged, async (req, res) => {
    let { fund_name, fund_code, nav, invested_amount, invested_date, investment_type } = req.body;
    let token = req.cookies.token;
    let decoded = jwt.verify(token, process.env.JWT_SECRET);

    let mutual = await mutualModel.findOne({ fundName: fund_name, userName: decoded.email });

    if (mutual) { 
        console.log("Mutual fund is already there");
        console.log(mutual);

        let updatedUser = await mutualModel.findOneAndUpdate(
            { userName: decoded.email, fundName: fund_name }, 
            {
                $push: {
                    navArr : nav,
                    investedAmount: invested_amount,
                    boughtUnits: invested_amount / nav,
                    buyingDates: invested_date,
                    assettClass: investment_type
                }
            },
            { new: true }
        );
        console.log(updatedUser);
    } else {
        let createdMutual = await mutualModel.create({  
            userName: decoded.email,
            fundName: fund_name,
            fundCode: fund_code,
            navArr : [nav],
            investedAmount: [invested_amount],  
            boughtUnits: [invested_amount / nav],
            buyingDates: [invested_date],
            assettClass: [investment_type]
        });
    }

    res.redirect('/add-mutual');
});

app.post('/login-account',async (req,res)=>{
    let {email,password} = req.body;
    // console.log("Received email:", req.body.email);
    let user = await userModel.findOne({email:email});
    if(!user){
        return res.redirect('/login')
    }
    bcrypt.compare(password, user.password, (err, isValid) => {
        if (err){
            console.error("Error comparing passwords:", err);
            return res.redirect('/login');
        }
        if (!isValid) {
            console.log("Invalid credentials.");
            return res.redirect('/login');
        }
        let token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.redirect('/dashboard');
    });
})
app.get('/add-mutual',isLogged,(req,res)=>{
    res.render('add-mutual');
})

app.get('/api/mutual-funds', async (req, res) => {
    try {
        let token = req.cookies.token;
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        let allmutuals = await mutualModel.find({ userName: decoded.email}) || [];
        
        res.json(
            JSON.parse(
                JSON.stringify(allmutuals, (_, value) =>
                    typeof value === "bigint" ? value.toString() : value
                )
            )
        );
    } catch (error) {
        console.error("Error fetching mutual funds:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get('/api/fixed-deposit', async (req, res) => {
    try {
        let token = req.cookies.token;
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        let allfixeds = await fixedModel.find({ userName: decoded.email}) || [];
        
        res.json(
            JSON.parse(
                JSON.stringify(allfixeds, (_, value) =>
                    typeof value === "bigint" ? value.toString() : value
                )
            )
        );
    } catch (error) {
        console.error("Error fetching mutual funds:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get('/api/bonds', async (req, res) => {
    try {
        let token = req.cookies.token;
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        let allBonds = await bondModel.find({ userName: decoded.email}) || [];
        
        res.json(
            JSON.parse(
                JSON.stringify(allBonds, (_, value) =>
                    typeof value === "bigint" ? value.toString() : value
                )
            )
        );
    } catch (error) {
        console.error("Error fetching Bonds:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/calculateXirr',async (req,res)=>{
    let funds = req.body
    let xirrarr = []
    console.log(funds)
    for(let i = 0;i<funds.length;i++){
        let cashflows = []
        let totalunits = 0
        for(let j = 0;j<funds[i].boughtUnits.length;j++){
            cashflows.push({
                amount : -1*parseFloat(funds[i].investedAmount[j]),
                when: new Date(funds[i].buyingDates[j])
            })
            totalunits += parseFloat(funds[i].boughtUnits[j])
        }
        cashflows.push({
            amount : parseFloat(totalunits)*parseFloat(funds[i].latestNav),
            when: new Date()
        })
        console.log(cashflows)
        try {
            const calculated = xirr(cashflows);
            xirrarr.push(calculated);
        } catch (err) {
            console.error(`XIRR failed for fund ${funds[i].name}`, err.message);
            xirrarr.push(null); // or -1 or "Error"
        }
    }
    res.send(xirrarr)
})

app.get('/logout',(req,res)=>{
    res.cookie('token','');
    res.redirect('/')
})

app.get('/mutual-funds',isLogged,async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    let allmutuals = await mutualModel.find({userName : decoded.email})
    console.log(allmutuals)
    console.log(req.cookies.token)
    res.render('mutual-funds',{allmutuals : allmutuals});
})
app.get('/mf-detail',isLogged,async (req,res)=>{
    let token = req.cookies.token;
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
  
    let allmutuals = await mutualModel.find({userName : decoded.email})
    // console.log(allmutuals)
    res.render('mf-detail',{allmutuals : allmutuals})
})
app.get('/fixed-deposits',isLogged,async (req,res)=>{
    res.render('fixed-deposit')
})
app.get('/add-fixed-deposit',isLogged,async (req,res)=>{
    res.render('add-fixed-deposit')
})
app.post('/add_fixed_deposit',async (req,res)=>{
    let {fdName , fdType, maturityPeriod,startDate,investedAmount,interestRate} = req.body
    let token = req.cookies.token;
    let decoded = jwt.verify(token, 'shhhhh');
    
    let createdfixedDeposit= await fixedModel.create({  
        userName: decoded.email,
        fdName : fdName + "-"+ startDate,
        fdType : fdType,
        maturityPeriod : maturityPeriod,
        date : startDate,
        fdInvestment : investedAmount,
        interestRate : interestRate
    });
    let createdtrackedFixedModel= await trackedFixedModel.create({  
        userName: decoded.email,
        fdName : fdName + "-"+ startDate,
        fdType : fdType,
        maturityPeriod : maturityPeriod,
        date : startDate,
        fdInvestment : investedAmount,
        interestRate : interestRate,
        status : 1,
        lastLog : 'No Logs found',
        lastUpdated : 'Not Updated yet'
    });
    res.redirect('/fixed-deposits')
});
app.post('/add_bonds',async (req,res)=>{
    let {bondName , bondIssuer, maturityPeriod,startDate,faceValue,couponRate} = req.body
    let token = req.cookies.token;
    let decoded = jwt.verify(token, 'shhhhh');
    
    let createdBond= await bondModel.create({  
        userName: decoded.email,
        bondName : bondName,
        bondIssuer : bondIssuer,
        maturityPeriod : maturityPeriod,
        date : startDate,
        faceValue : faceValue,
        couponRate : couponRate
    });
    res.redirect('/bonds')
});
app.get('/help',(req,res)=>{
    res.render('help')
})
app.post('/register_help',async (req,res)=>{
    let {firstName,lastName,email,countryCode,phoneNumber,description} = req.body
    let token = req.cookies.token
    let decoded = jwt.verify(token,'shhhhh')
    let createdHelp = await helpModel.create({
        user : decoded.email,
        firstName : firstName,
        lastName : lastName,
        email : email,
        countryCode : countryCode,
        phoneNumber : phoneNumber,
        description : description
    })
    res.redirect('/help')
})
app.get('/mutual-funds/xirr',(req,res)=>{
    res.render('xirr')
})
app.post('/api/mutual-funds/track',(req,res)=>{
    let token = req.cookies.token;
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(req.body)
    let createdtrackedFund = trackFundModel.create({
        name : req.body[0],
        amcName : req.body[4],
        fundCode : parseFloat(req.body[3]),
        targetNAV : parseFloat(req.body[2]),
        status : 1,
        latestLog : 'No logs Found',
        lastUpdated : new Date(),
        email : decoded.email
    })
    res.redirect('/mutual-funds/track')
})

app.get('/api/mutual-funds/track',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    let trackedFundsForUser =await trackFundModel.find({
        email : decoded.email
    })
    // console.log(trackedFundsForUser)
    res.send(trackedFundsForUser)
})
app.get('/api/fixed-deposits/track',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    let trackedFDsForUser =await trackedFixedModel.find({
        userName : decoded.email
    })
    // console.log(trackedFundsForUser)
    res.send(trackedFDsForUser)
})
app.get('/mutual-funds/track',async (req,res)=>{
    res.render('track-mutual');
})
app.post('/mutual-funds/track/pause/:id',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log(req.params.id)
    const fund = await trackFundModel.findOne({
        email : decoded.email,
        _id : req.params.id
    });
    fund.status = 0
    await fund.save();
    // console.log(fund);
    res.redirect('/mutual-funds/track')

});
app.post('/mutual-funds/track/resume/:id',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log(req.params.id)
    const fund = await trackFundModel.findOne({
        email : decoded.email,
        _id : req.params.id
    });
    fund.status = 1
    await fund.save();
    // console.log(fund);
    res.redirect('/mutual-funds/track')

});
app.post('/mutual-funds/track/remove/:id',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log(req.params.id)
    const fund = await trackFundModel.deleteOne({
        email : decoded.email,
        _id : req.params.id
    });
    
    res.redirect('/mutual-funds/track')

});



app.post('/fixed-deposits/track/pause/:id',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log(req.params.id)
    const fund = await trackedFixedModel.findOne({
        userName : decoded.email,
        _id : req.params.id
    });
    fund.status = 0
    await fund.save();
    // console.log(fund);
    res.redirect('/fixed-deposits/track')

});
app.post('/fixed-deposits/track/resume/:id',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log(req.params.id)
    const fund = await trackedFixedModel.findOne({
        userName : decoded.email,
        _id : req.params.id
    });
    fund.status = 1
    await fund.save();
    // console.log(fund);
    res.redirect('/fixed-deposits/track')

});
app.post('/fixed-deposits/track/remove/:id',async (req,res)=>{
    let token = req.cookies.token
    let decoded = jwt.verify(token,process.env.JWT_SECRET)
    console.log(req.params.id)
    const fund = await trackedFixedModel.deleteOne({
        userName : decoded.email,
        _id : req.params.id
    });
    
    res.redirect('/fixed-deposits/track')

});
app.get('/fd-detail',(req,res)=>{
    res.render('fd-detail')
})
app.get('/fixed-deposits/track',(req,res)=>{
    res.render('track_fd')
})
app.get('/bonds',(req,res)=>{
    res.render('bonds')
})
app.get('/add-bonds',(req,res)=>{
    res.render('add-bonds')
})
// Get all mutual fund schemes
app.get('/api/mf-schemes', async (req, res) => {
    try {
        const response = await fetch('https://api.mfapi.in/mf');

        if (!response.ok) {
            return res.status(502).json({
                error: 'Failed to fetch mutual fund schemes'
            });
        }

        const schemes = await response.json();
        return res.json(schemes);
    } catch (error) {
        console.error('MFAPI schemes error:', error.message);
        return res.status(502).json({
            error: 'Unable to fetch mutual fund schemes'
        });
    }
});

// Get NAV history for a specific scheme
app.get('/api/mf-schemes/:schemeCode', async (req, res) => {
    try {
        const { schemeCode } = req.params;

        if (!/^\d+$/.test(schemeCode)) {
            return res.status(400).json({
                error: 'Invalid scheme code'
            });
        }

        const response = await fetch(
            `https://api.mfapi.in/mf/${schemeCode}`
        );

        if (!response.ok) {
            return res.status(502).json({
                error: 'Failed to fetch NAV history'
            });
        }

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('MFAPI NAV error:', error.message);
        return res.status(502).json({
            error: 'Unable to fetch NAV history'
        });
    }
});
app.listen(4000,()=>{
    console.log('running');
});