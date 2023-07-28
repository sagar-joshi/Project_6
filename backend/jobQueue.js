const Queue = require("bull");


// const { executeCpp } = require("./executeCpp");
// const { executePy } = require("./executePy");

const jobQueue = new Queue("job-queue");
const NUM_WORKERS = 5;
const Job = require("./models/Job");
const{executeCpp}=require("./executeCpp");
const{executePy}=require("./executePy");

jobQueue.process(NUM_WORKERS, async ({data}) => {
    console.log(data);
    
  const jobId = data.id;
  const job = await Job.findById(jobId);
  if (job === undefined) {
    throw Error(`cannot find Job with id ${jobId}`);
  }
  console.log("fetched Job",job);
  


  try {
    
    job["startedAt"] = new Date();
    if (job.language === "cpp") {
      output = await executeCpp(job.filepath);
    } else if (job.language === "py") {
      output = await executePy(job.filepath);
    }
    job["completedAt"] = new Date();
    job["output"] = output;
    job["status"] = "success";
    await job.save();
    
  } catch (err) {
    job["completedAt"] = new Date();
    job["output"] = JSON.stringify(err);
    job["status"] = "error";
    await job.save();
    
  }
  return true;
});


jobQueue.on("failed", (error) => {
  console.log(error.data.id, "failed",error.failedReason);
});

const addJobToQueue = async (jobId) => {
  await jobQueue.add({id: jobId,});
};

module.exports = {
  addJobToQueue,
};