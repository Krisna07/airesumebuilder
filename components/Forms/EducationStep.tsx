import React from "react";
import Input from "../Input";
import Button from "../Button";

import { Trash2 } from "lucide-react";
import Datepicker from "./Datepicker";
import { Education } from "@/types/types";

interface EducationStepProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const EducationStep: React.FC<EducationStepProps> = ({ data, onChange }) => {
  const addEducation = () => {
    if (
      data.length > 0 &&
      (!data[0].degree || !data[0].university || !data[0].startDate)
    ) {
      return alert("Make sure to add details for the first education entry.");
    }
    onChange([
      ...data,
      {
        degree: "",
        university: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
      },
    ]);
  };

  const removeEducation = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const toggleCurrentEducation = (index: number, checked: boolean) => {
    const newData = [...data];
    newData[index] = { ...newData[index], current: checked };
    onChange(newData);
  };

  return (
    <>
      {data.map((education, index) => (
        <div key={index} className="w-full grid gap-2 border rounded p-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              type="text"
              name="degree"
              value={education.degree}
              onChange={(e) => updateEducation(index, "degree", e.target.value)}
              placeholder="Degree"
            />
            <button
              type="button"
              onClick={() => removeEducation(index)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <Input
            type="text"
            name="university"
            value={education.university}
            onChange={(e) =>
              updateEducation(index, "university", e.target.value)
            }
            placeholder="University"
          />

          <div className="w-full flex gap-2 items-center justify-between">
            <Datepicker
              index={index}
              target="startDate"
              value={education.startDate}
              update={updateEducation}
            />
            <Datepicker
              index={index}
              target="endDate"
              value={education.endDate ? education.endDate : ""}
              update={updateEducation}
            />
          </div>

          <label className="w-fit flex items-start cursor-pointer">
            <input
              type="checkbox"
              name="current"
              checked={education.current}
              className="sr-only peer"
              onChange={(e) => toggleCurrentEducation(index, e.target.checked)}
            />
            <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute  after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium">Still Studying</span>
          </label>

          <Input
            type="text"
            name="location"
            value={education.location}
            onChange={(e) => updateEducation(index, "location", e.target.value)}
            placeholder="Location"
          />
        </div>
      ))}

      <Button
        variant={"secondary"}
        size={"small"}
        onClick={addEducation}
        type="submit"
      >
        Add Education
      </Button>
    </>
  );
};

export default EducationStep;
