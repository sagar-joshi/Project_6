const express = require("express");
const cors = require("cors");
const mongoose =require("mongoose");
const {generateFile}=require("./generateFile");

const {addJobToQueue} =require("./jobQueue");
const Job=require("./models/Job");



async function connectToDatabase() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/compilerapp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB!');
    // Your other initialization code or server startup logic can go here
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    // Handle the error or exit the application gracefully
  }
}

// Call the function to connect to the database
connectToDatabase();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/status",async(req, res) =>{
  const jobId =req.query.id;
  console.log("status requested",jobId);

  if(jobId ==undefined){
    return res.status(400).json({success: false,error:"missing id query para" })
  }
  try{
    const job =await Job.findById(jobId);
    if(job===undefined){
      return res.status(404).json({success:false,error:"invalid job id"});
    }
    return res.status(200).json({success:true,job});

  }catch(err){
    return res.status(400).json({success:false, error:JSON.stringify(err)});
  }
  
});

// app.get("/", (req, res) => {
    
//       return res.json({hello:"world"});
        
// });
app.post("/run", async(req, res) => {
    const { language = "cpp", code } = req.body;
    
  
    console.log(language, code.length);
  
    if (code === undefined) {
      return res.status(400).json({ success: false, error: "Empty code body!" });
    }
    let job;
    // need to generate a c++ file with content from the request
    try{
      const filepath=await generateFile(language,code);
       job=await new Job({language, filepath}).save();
      const jobId=job._id;
      addJobToQueue(jobId);
      console.log(job);
      res.status(201).json({success: true,jobId});
      
     
      
    }catch(err){
      
      res.status(500).json({success: false, err:JSON.stringify(err)});

    }
    
    
});
app.listen(5000, () => {
    console.log(`Listening on port 5000!`);
  });