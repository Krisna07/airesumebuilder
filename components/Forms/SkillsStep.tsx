
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

// A skill group's "type" is optional/nullable in stored data (legacy resumes may
// have '' or undefined). Every comparison below must go through this helper so a
// group is matched by its *displayed* label, not by the raw stored string --
// otherwise '' and 'General' are treated as different groups even though they
// render identically, which was silently duplicating "General" groups and
// deleting the wrong one when a user clicked the "x" on what looked like an
// empty duplicate.
const normalizeType = (t?: string | null): string => t?.trim() || 'General';

const SkillsStep: React.FC<SkillsStepProps> = ({ data, updateSkills }) => {
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

    let updatedSkills = [...data];
    const skillType = normalizeType(type);

    for (const skillToAdd of skillsToAdd) {
      const existingType = updatedSkills.find((s) => normalizeType(s.type) === skillType);

      if (existingType) {
        // If the type exists, check for duplicates
        if (existingType.skills?.includes(skillToAdd)) {
          toast.showToast(`Duplicate skill: ${skillToAdd}`, 'warning', 3000);
          continue;
        }
        // Add skill to existing type (keep the group's existing stored type value,
        // so we don't rewrite e.g. a legacy '' into 'General' on every edit)
        updatedSkills = updatedSkills.map((item) =>
          normalizeType(item.type) === skillType
            ? { ...item, skills: [...(item.skills || []), skillToAdd] }
            : item
        );
      } else {
        // Create new type entry
        updatedSkills.push({ type: skillType, skills: [skillToAdd] });
      }
    }

    updateSkills(updatedSkills);
    setSkill('');
    setType('');
  };

  const removeSkill = (skillToRemove: string) => {
    const restSkills = data
      .map((item) => ({
        ...item,
        skills: item.skills?.filter((skill) => skill !== skillToRemove)
      }))
      .filter((item) => item.skills && item.skills.length > 0); // Filter out empty skill types
    updateSkills(restSkills);
  };

  const removeType = (typeToRemove?: string) => {
    // Compare by normalized/displayed label (see normalizeType) so this removes
    // the exact group whose "x" was clicked, not a different group that happens
    // to share the same displayed "General" label but a different raw type value.
    const restSkills = data.filter((item) => normalizeType(item.type) !== normalizeType(typeToRemove));
    updateSkills(restSkills);
  };

  return (
    <>
      <div className='flex flex-wrap items-center gap-2'>
        {data.length > 0 &&
          // Hide empty groups entirely -- a group with no skills (e.g. a legacy
          // seeded placeholder) has nothing useful to show, and previously could
          // be visually indistinguishable from a real "General" group, leading
          // users to delete the wrong one by clicking what looked like an empty
          // duplicate's "x".
          data.filter((item) => item.skills && item.skills.length > 0).map(({ type, skills }, index) => (
            <div key={index} className=' grid  px-2 text-sm gap-2 w-full p-4 dark:shadow-[0_0_2px_0_white] shadow-[0_0_2px_0_gray] rounded-2xl'>
              <h3 className='w-full flex items-center justify-between '>
                <span className='font-semibold'>{normalizeType(type)}</span>
                <FaTimes color='red' onClick={() => removeType(type)} />
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
