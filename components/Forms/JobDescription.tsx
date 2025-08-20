import React, {  useState } from "react";
import { AnalysisResult } from '@/types/types';
import Input from '../Input';

// import scrapeWebsite from "@/lib/scrape";
import Button from '../Button';
import { getJobDescription } from '@/services/resumeServices';

const JobDescription = () => {
  const [jobDescription, setJobDescription] = useState<string | null>();
  const [url, setUrl] = useState<string | null>();
  const [error, setError] = useState<string | null>();
  const updateJobDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null);
    setJobDescription(e.target.value);
  };
  const [analysis, setAnalysis] = useState<AnalysisResult | null>();
  const startAnalysis = async () => {
    if (!jobDescription) {
      return setError('No job descripiton');
    }
    setAnalysis(null); // Commenting out to fix unused variable lint error
  };

  const updateUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  const [loading, setLoading] = useState(false);

  const extractDescriptions = async () => {
    if (!url || !url.match(/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/)) {
      setLoading(false);
      return setError('No url for the job provided');
    }
    setLoading(true);
    const result = getJobDescription(url);
    if (result?.status !== 200) {
      return result;
    }
    // const fetchDescription = await scrapeWebsite(url)
    // console.log(fetchDescription)
    // console.log(fetchDescription)
    // if(fetchDescription){
    //   setLoading(false)
    //   setJobDescription(fetchDescription.description)
    // }
  };

  return (
    <div className='w-full p-2'>
      {analysis && (
        <div>
          <p>Matching Percentage: {analysis.matchingPercentage}%</p>
        </div>
      )}
      {error && <p className='text-red-900'>{error}</p>}
      <div className='py-4 grid gap-2'>
        {/* <h2>Extract the content from url</h2> */}
        <Input type={'text'} name={'url'} value={url ? url : ''} onChange={updateUrl} placeholder={'Enter the Url'} />
        <Button variant={'primary'} size={'small'} onClick={extractDescriptions} disabled={loading ? true : false}>
          {loading ? 'Extracting....' : 'Extract'}
        </Button>
      </div>
      <textarea onChange={updateJobDescription} value={jobDescription ? jobDescription : ''} className='w-full h-fit border shadow-md rounded-md p-2 outline-green-300 active:border-green-300 ' />
      <Button variant={'primary'} size={'small'} onClick={startAnalysis}>
        Analyse
      </Button>
    </div>
  );
};

export default JobDescription;
