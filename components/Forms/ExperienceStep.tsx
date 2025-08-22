import React, { useState } from "react";
import Input from "../Input";
import { Experience } from "@/types/types"
import Button from '../UI/Button';
// import "react-quill/dist/quill.snow.css";
import { FaTimes } from "react-icons/fa";
import { Trash2 } from "lucide-react";

import "react-datepicker/dist/react-datepicker.css"; // Import the necessary CSS
import Datepicker from "./Datepicker";

interface ExperienceStepProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({ data, onChange }) => {
  const [responsibility, setResponsibility] = useState<string>("");

  const addResponsibility = (index: number) => {
    if (!responsibility) {
      return alert("Make sure to add the responsibility");
    }
    const newData = [...data];
    newData[index].responsibilities = [
      ...(newData[index].responsibilities || []),
      responsibility,
    ];
    onChange(newData);
    setResponsibility("");
  };

  const removeResponsibility = (index: number, responsibilityIndex: number) => {
    const newData = [...data];
    newData[index].responsibilities = (
      newData[index].responsibilities || []
    ).filter((_, idx) => idx !== responsibilityIndex);
    onChange(newData);
  };

  const addExperience = () => {
    if (
      data.length > 0 &&
      (!data[0].title || !data[0].company || !data[0].startDate)
    ) {
      return alert("Make sure to add details for first");
    }
    onChange([
      ...data,
      {
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: [],
      },
    ]);
  };

  const removeExperience = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const toggleCurrentEmployment = (index: number, checked: boolean) => {
    const newData = [...data];
    newData[index] = { ...newData[index], current: checked };
    onChange(newData);
  };

  return (
    <>
      {data.map((experience, index) => (
        <div
          key={index}
          className="w-full grid grid-cols-1 gap-4 place-items-start"
        >
          <div className="w-full grid gap-2 relative">
            <div className="flex items-center justify-between gap-4">
              <Input
                type="text"
                name="title"
                required
                value={experience.title}
                onChange={(e) =>
                  updateExperience(index, "title", e.target.value)
                }
                placeholder="Title"
              />
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <Input
              type="text"
              name="company"
              required
              value={experience.company}
              onChange={(e) =>
                updateExperience(index, "company", e.target.value)
              }
              placeholder="Company"
            />
            <Input
              type="text"
              name="location"
              required
              value={experience.location}
              onChange={(e) =>
                updateExperience(index, "location", e.target.value)
              }
              placeholder="Location"
            />
            <div className="w-full flex gap-2 items-center justify-between">
              <Datepicker
                index={index}
                target="startDate"
                value={experience.startDate ? experience.startDate : ""}
                update={updateExperience}
              />
              <Datepicker
                index={index}
                current={experience.current}
                target="endDate"
                value={experience.endDate ? experience.endDate : ""}
                update={updateExperience}
              />
            </div>
            <label className="w-fit flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="current"
                checked={experience.current}
                className="sr-only peer"
                onChange={(e) =>
                  toggleCurrentEmployment(index, e.target.checked)
                }
              />
              <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium">
                Currently Employed
              </span>
            </label>

            <form
              className="w-full grid gap-1 transition-all ease-in-out text-[14px] font-sans"
              onSubmit={(e) => {
                e.preventDefault();
                addResponsibility(index);
              }}
            >
              <label className="w-full font-semibold px-1">
                Responsibilities
              </label>
              <div className="grid gap-1">
                {experience.responsibilities &&
                  experience.responsibilities.map((resp, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-start gap-1">
                        <span className="text-sm font-semibold">
                          {" "}
                          {idx + 1}.{" "}
                        </span>
                        {resp}
                      </span>
                      <FaTimes
                        onClick={() => removeResponsibility(index, idx)}
                      />
                    </li>
                  ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  name="responsibility"
                  value={responsibility}
                  placeholder="Add responsibility"
                  onChange={(e) => setResponsibility(e.target.value)}
                  className="w-full outline-none focus:ring-1 focus:ring-green-600 transition-all ease-in-out duration-300 px-[8px] py-[4px] text-[14px] rounded-md relative z-10"
                />
                <button
                  type="button"
                  onClick={() => addResponsibility(index)}
                  className="text-green-600 font-semibold"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      ))}
      <div className="w-full flex gap-4 items-start p-2">
        <Button
          type="submit"
          variant="secondary"
          size="small"
          onClick={addExperience}
        >
          Add Experience
        </Button>
      </div>
    </>
  );
};

export default ExperienceStep;
