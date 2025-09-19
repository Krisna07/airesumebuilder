'use client';

import { Calendar } from 'lucide-react';
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

interface DatePickerProps {
  value?: string;
  index: number;
  current?: boolean;
  target: string;
  update: (index: number, target: string, value: string) => void;
}

export default function Datepicker({ value, index, target, update }: DatePickerProps) {
  const isValidDate = value ? !isNaN(new Date(value).getTime()) : false;
  const [open, setOpen] = useState<boolean>(false);

  const handleChange = (date: Date | null) => {
    if (date) {
      const options = {
        month: 'short' as const,
        year: 'numeric' as const,
      };
      const formattedDate = date.toLocaleDateString('en-US', options);
      update(index, target, formattedDate); // Update the date in the state
      setOpen(false);
    }
  };

  return (
    <label className="w-full grid gap-1  transition-all ease-in-out text-[14px]  font-sans relative z-[20]">
      {target === 'startDate' ? 'Start Date' : 'End Date'}
      <div className="w-full outline-none ring-1 ring-gray-200 focus-within:ring-green-600 transition-all ease-in-out duration-300 px-[8px] py-[4px] text-[14px] rounded-md relative flex items-center gap-2">
        <span>
          <Calendar className="w-4 h-4" color={'gray'} />
        </span>

        <DatePicker
          selected={isValidDate ? new Date(value!) : null}
          onChange={handleChange}
          strictParsing
          open={open}
          onClickOutside={() => setOpen(false)}
          shouldCloseOnSelect={true}
          showMonthYearPicker
          placeholderText={value ? value : 'Select Date'}
          dateFormat="yyyy-MM"
          maxDate={new Date()}
          className="w-full outline-none"
          calendarClassName="rd-calendar animate-pop"
          showPopperArrow={true}
          popperPlacement="bottom-end"
        />
        <div onClick={() => setOpen(!open)} className="w-full h-full absolute bg-transparent"></div>
      </div>
    </label>
  );
}
