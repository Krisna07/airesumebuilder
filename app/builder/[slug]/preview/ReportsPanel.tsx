/* eslint-disable @typescript-eslint/no-explicit-any */
import JobDescription from "@/components/Forms/JobDescription";
import Button from "@/components/UI/Button";
import JobAnalysisReport from "@/components/UI/JobAnalysisReport";
import { BotIcon, FileUser } from "lucide-react";
import { useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";

const ReportsPanel = ({
  reports,
  analysisData,
  selectedAnalysis,
  setSelectedAnalysis,
  handleReAnalysis,
  handleRegerate,
  resumeData,
  analyzing,
  generating,
  reportsRef,
  generatingCoverLetter,
  generateCoverLetter
}: any) => {

  const [jobDetailsForm, showJobDetailsForm] = useState(false)
  return (
    <div onClick={(e) => e.stopPropagation()} ref={reportsRef} className='w-full h-full flex flex-col shadow'>
      {reports && analysisData?.length > 0 ? 
        <div className='pt-4 flex flex-col h-full'>
          <h3 className='font-bold'>Analysis Reports</h3>
          <div className='overflow-auto mt-2'>
          {analysisData.map((analysis: any, count: number) => {
            const isSelected = selectedAnalysis?._analysisId === (analysis as any)._analysisId;
            return <div onClick={() => setSelectedAnalysis(analysis)} key={count} className={`py-2 w-fit h-fit grid gap-2 items-center px-2   m-1 rounded shadow relative ${isSelected ? 'ring-2 ring-blue-300' : ''} ${isSelected && (generatingCoverLetter || generating) ? 'animate-pulse' : ''}`}>
              <JobAnalysisReport {...analysis} />
              <div className='flex flex-wrap items-center gap-2'>
                <Button disabled={generating || generatingCoverLetter} variant='primary' className={`w-fit ${isSelected && generatingCoverLetter ? 'animate-pulse' : ''}`} size='small' onClick={() => handleRegerate(resumeData, analysis)} ><BotIcon size={14} />{isSelected && generating ? 'Optimising Resume' : 'Optimise Resume'}</Button>
                <Button disabled={generating || generatingCoverLetter} variant='secondary' className={`w-fit ${isSelected && generatingCoverLetter ? 'animate-pulse' : ''}`} size='small' onClick={() => generateCoverLetter(analysis)} ><FileUser size={14} />{isSelected && generatingCoverLetter ? 'Generating Cover Letter' : 'Generate Cover Letter'}</Button>
                <Button variant='secondary' size='small' className='w-fit' onClick={() => handleReAnalysis(analysis)}><FaMagnifyingGlass /> {isSelected && analyzing ? 'Analysing' : 'Re-Analyse'}</Button>
              </div>
            </div>
          })
          } 
        </div>
          <JobDescription resumeId={resumeData.id} hideAnalysis={true} hideTitle={true} handleRegenerate={handleRegerate} resumeData={resumeData} />
        </div>

      :
        <div className='w-full text-center grid place-items-center font-semibold text-sm  shadow p-4 gap-2'>
          <div className='w-full text-left grid gap-2 '>
            <Button variant='primary' size='small' onClick={() => showJobDetailsForm(!jobDetailsForm)}>Job Details Form</Button>
            <JobDescription resumeId={resumeData.id} hideAnalysis={true} />
          </div>
        </div>
      }
    </div>
  )
};

export default ReportsPanel;