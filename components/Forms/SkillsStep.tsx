
import React, { useState } from "react";
import Input from "../Input";
import Button from '../Ui/Button';
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

    if (!skill) {
      toast.showToast('Skills cannot be empty', 'warning', 3000);
      return;
    }

    // Split by comma and trim whitespace
    const skillsToAdd = skill.split(',').map(s => s.trim()).filter(s => s);

    let updatedSkills = [...skillsList];
    const skillType = type || 'General';

    for (const skillToAdd of skillsToAdd) {
      const existingType = updatedSkills.find((s) => s.type === skillType);

      if (existingType) {
        // If the type exists, check for duplicates
        if (existingType.skills?.includes(skillToAdd)) {
          toast.showToast(`Duplicate skill: ${skillToAdd}`, 'warning', 3000);
          continue;
        }
        // Add skill to existing type
        updatedSkills = updatedSkills.map((item) =>
          item.type === skillType
            ? { ...item, skills: [...(item.skills || []), skillToAdd] }
            : item
        );
      } else {
        // Create new type entry
        updatedSkills.push({ type: skillType, skills: [skillToAdd] });
      }
    }

    setSkills(updatedSkills);
    updateSkills(updatedSkills);
    setSkill('');
    setType('');
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
        {skillsList.length > 0 &&
          skillsList.map(({ type, skills }, index) => (
            <div key={index} className=' grid  px-2 text-sm gap-2 w-full p-4 dark:shadow-[0_0_2px_0_white] shadow-[0_0_2px_0_gray] rounded-2xl'>
              <h3 className='w-full flex items-center justify-between '>
                <span className='font-semibold'>{type || 'General'}</span>
                <FaTimes color='red' onClick={() => removeType(type || 'General')} />
              </h3>
              {/* Remove type button */}
              <div className='flex flex-wrap items-center gap-2'>
                {skills && skills.length > 0 &&
                  skills?.map((skill, i) => (
                    <span key={i} className=' whitespace-nowrap flex items-center gap-2 px-2 rounded-full leading-4 py-1'>
                      {skill} <FaTimes onClick={() => removeSkill(skill)} />
                    </span>
                  ))}
              </div>
            </div>
          ))}
      </div>
      <form onSubmit={addSkill} className='w-full grid gap-4 shadow'>
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
