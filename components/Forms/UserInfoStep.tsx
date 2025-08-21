import React from "react";
import Input from "../Input";

import { Profile } from "@/types/types";
import Button from '../UI/Button';
import { FaTrash } from "react-icons/fa6";

interface UserInfoStepProps {
  data: Profile;
  onChange: (updatedData: Profile) => void;
}
const UserInfoStep: React.FC<UserInfoStepProps> = ({ data, onChange }) => {
  const addLink = () => {
    onChange({
      ...data,
      links: [
        ...data.links,
        {
          type: "",
          url: "",
        },
      ],
    });
  };

  const removeLink = (index: number) => {
    const updatedLinks = data.links.filter((_, i) => i !== index);
    onChange({ ...data, links: updatedLinks });
  };

  return (
    <>
      <Input type='text' name='fullname' required={true} value={data.fullname} onChange={(e) => onChange({ ...data, fullname: e.target.value })} placeholder='Fullname' />
      <Input type='email' name='email' required={true} value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder='Email' />
      <Input type='text' name='phone' required={true} value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} placeholder='Phone' />
      <Input type='text' name='location' required={true} value={data.location} onChange={(e) => onChange({ ...data, location: e.target.value })} placeholder='Location' />

      {data?.links?.map((link, index) => (
        <div key={index} className='flex gap-2 relative'>
          <Input
            type='text'
            name='type'
            value={link.type}
            onChange={(e) => {
              const updatedLinks = [...data.links];
              updatedLinks[index] = {
                ...updatedLinks[index],
                type: e.target.value
              };
              onChange({ ...data, links: updatedLinks });
            }}
            placeholder='Link Type (e.g., GitHub)'
          />
          <Input
            type='url'
            name='url'
            value={link.url}
            onChange={(e) => {
              const updatedLinks = [...data.links];
              updatedLinks[index] = {
                ...updatedLinks[index],
                url: e.target.value
              };
              onChange({ ...data, links: updatedLinks });
            }}
            placeholder='URL'
          />

          <FaTrash onClick={() => removeLink(index)} color='red' size={12} className='absolute right-0 top-2' />
        </div>
      ))}
      <Button type='button' variant='secondary' size='small' onClick={addLink}>
        Add Link
      </Button>

      <div className='w-full grid gap-1 transition-all ease-in-out text-[14px] font-sans'>
        <label className='w-full font-semibold transition-all ease-in-out px-1'>Summary</label>
        <textarea
          // type="text"
          name='summary'
          value={data.summary}
          onChange={(e) => onChange({ ...data, summary: e.target.value })}
          placeholder='Summary'
          className='w-full outline-none ring-1 focus:ring-green-600 ring-gray-200 transition-all ease-in-out duration-300 px-[8px] py-[4px] text-[14px] rounded-md relative z-10 min-h-[16ch]'
        />
      </div>

      <Button
        type='button'
        variant='primary'
        size='small'
        // onClick={handleSubmit}
      >
        Save Profile
      </Button>
    </>
  );
};

export default UserInfoStep;
