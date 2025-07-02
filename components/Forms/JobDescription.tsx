import React, {  useState } from "react";
import { AnalysisResult, ResumeData } from "@/types/types";
import Input from "../Input";
import { analyseResumeToJobDescription } from "@/lib/ai-actions";
// import scrapeWebsite from "@/lib/scrape";
import Button from "../Button";

interface JobDescriptionProps{
  handleJobDescription : (data:string)=> void,
  // handleResumeAnalysis : (data:AnalysisResult)=>void,
  formData:ResumeData
}

const JobDescription:React.FC<JobDescriptionProps>= ({handleJobDescription, formData}) => {
 const [jobDescription, setJobDescription] = useState<string | null>()
 const [url, setUrl] = useState<string|null>()
 const [error, setError] = useState<string| null>()
  const updateJobDescription =(e:React.ChangeEvent<HTMLTextAreaElement>)=>{
    setError(null)
        setJobDescription(e.target.value)
  }
  const [analysis, setAnalysis] = useState<AnalysisResult|null>()
  const startAnalysis = async()=>{
  if(!jobDescription){
    return setError('No job descripiton')
  }
  const analysisResult:AnalysisResult = await analyseResumeToJobDescription(formData, jobDescription)
  if(analysisResult){
     setAnalysis(analysisResult)
     handleJobDescription(analysisResult.jobDescription)
     console.log(analysis)
  }
}

const updateUrl = (e:React.ChangeEvent<HTMLInputElement>)=>{
  setUrl(e.target.value)
}
const[loading, setLoading] = useState(false)

const extractDescriptions=async()=>{
  if(!url){
    return setError("No url for the job provided")
  }
  setLoading(true)
  // const appPath:string = window.location.href
  // const fetchDescription = await scrapeWebsite(url)
  // console.log(fetchDescription)
  // console.log(fetchDescription)
  // if(fetchDescription){
  //   setLoading(false)
  //   setJobDescription(fetchDescription.description)
  // }

}

  return (
  <div  className="w-full p-2">
    {analysis && 
    <div>
      <p>Matching Percentage: {analysis.matchingPercentage}%</p>
    </div>
    }
    {error && <p className="text-red-900">{error}</p>}
    <div className="py-4 grid gap-2">
      {/* <h2>Extract the content from url</h2> */}
      <Input type={"text"} name={'url'} value={url?url:""} onChange={updateUrl} placeholder={"Enter the Url"} />
      <Button variant={"primary"} size={"small"} onClick={extractDescriptions} disabled={loading?true:false}>
      {loading?"Extracting....":"Extract"}
      </Button>
    </div>
        <textarea onChange={updateJobDescription} value={jobDescription?jobDescription:''} className="w-full h-fit border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 "/>
        <Button variant={"primary"} size={"small"} onClick={startAnalysis}>Analyse</Button>
  </div>
    
  );
};

export default JobDescription;
