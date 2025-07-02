import React from "react";

interface InputProps {
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  type,
  name,
  value,
  onChange,
  placeholder,
  required,
}) => {
  return (
    <div className="w-full grid gap-1 transition-all ease-in-out text-[14px] font-sans">
      <label className="w-full font-semibold transition-all ease-in-out px-1">
        {placeholder}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full outline-none ring-1 focus:ring-green-600 ring-gray-200 transition-all ease-in-out duration-300 px-[8px] py-[4px] text-[14px] rounded-md relative z-10"
      />
    </div>
  );
};

export default Input;
