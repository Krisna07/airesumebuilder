
import React, { useState } from "react";
import Input from "../Input";
import Button from '../UI/Button';
import { FaTimes } from "react-icons/fa";
import { skills } from "@/types/types";
import { useToast } from "@/context/PopupContext";

interface SkillsStepProps {
  data: skills[];
  updateSkills: (skills: skills[]) => void; // Update to accept an array of objects
}

const SkillsStep: React.FC<SkillsStepProps> = ({ data, updateSkills }) => {
  const [skillsList, setSkills] = useState<skills[]>(data);
  const [skill, setSkill] = useState<string>('');
  const [type, setType] = useState<string>('');
  const toast = useToast()

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skill) {
      const existingType = skillsList.find((s) => s.type === type);
      if (existingType) {
        // If the type exists, add the skill to that type
        if (!existingType.skills?.includes(skill)) {
          const updatedSkills = skillsList.map((item) => (item.type === type ? { ...item, skills: [...(item.skills || []), skill] } : item));
          setSkills(updatedSkills);
          updateSkills(updatedSkills);
        } else {
          toast.showToast('Duplicate skill', 'warning', 3000)
        }
      } else {
        // If the type does not exist, create a new entry
        const newSkill = { type: type || 'General', skills: [skill] };
        setSkills((prevState) => [...prevState, newSkill]);
        updateSkills([...skillsList, newSkill]);
      }
      setSkill(''); // Clear the skill input
      // Clear the type input
    } else {
                toast.showToast('Skills cannot be empty', 'warning', 3000)

    }
  };

  const removeSkill = (skillToRemove: string) => {
    const restSkills = skillsList
      .map((item) => ({
        ...item,
        skills: item.skills?.filter((skill) => skill !== skillToRemove)
      }))
      .filter((item) => item.skills && item.skills.length > 0); // Filter out empty skill types
    setSkills(restSkills);
    updateSkills(restSkills);
  };

  const removeType = (typeToRemove: string) => {
    const restSkills = skillsList.filter((item) => item.type !== typeToRemove); // Remove the entire type
    setSkills(restSkills);
    updateSkills(restSkills);
  };

  return (
    <>
      <div className='flex flex-wrap items-center gap-2'>
        {skillsList.length &&
          skillsList.map(({ type, skills }, index) => (
            <div key={index} className=' grid bg-gray-100 px-2 text-sm gap-2 w-full p-4'>
              <h3 className='w-full flex items-center justify-between '>
                <span className='font-semibold'>{type || 'General'}</span>
                <FaTimes color='red' onClick={() => removeType(type || 'General')} />
              </h3>
              {/* Remove type button */}
              <div className='flex flex-wrap items-center gap-2'>
                {skills?.length &&
                  skills?.map((skill, i) => (
                    <span key={i} className='bg-gray-300 whitespace-nowrap flex items-center gap-2 px-2 rounded-full leading-4 py-1'>
                      {skill} <FaTimes onClick={() => removeSkill(skill)} />
                    </span>
                  ))}
              </div>
            </div>
          ))}
      </div>
      <form onSubmit={addSkill} className='w-full grid gap-4'>
        <Input type='text' name='type' value={type} onChange={(e) => setType(e.target.value)} placeholder='Enter skill type (optional)' />
        <Input type='text' name='skill' value={skill} onChange={(e) => setSkill(e.target.value)} placeholder='Add a skill' />
        <Button type='submit' variant='secondary' size='small' fullWidth={false}>
          Add Skill
        </Button>
      </form>
    </>
  );
};

export default SkillsStep;
