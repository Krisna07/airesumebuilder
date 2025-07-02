import DatePicker from "react-datepicker";

interface DatePickerProps {
  value?: string;
  index: number;
  current?: boolean;
  target: string;
  update: (index: number, target: string, value: string) => void;
}

export default function Datepicker({
  value,
  index,
  target,
  update,
}: DatePickerProps) {
  const isValidDate = value ? !isNaN(new Date(value).getTime()) : false;

  return (
    <label className="w-full grid gap-1 transition-all ease-in-out text-[14px] font-sans">
      {target == "startDate" ? "Start Date" : "End Date"}
      <div className="w-full bg-white  outline-none  ring-1 ring-gray-200 focus:ring-green-600 transition-all ease-in-out duration-300 px-[8px] py-[4px] text-[14px] rounded-md relative z-10">
        <span>{value ? value : "Select Date"}</span>

        <DatePicker
          selected={isValidDate ? new Date(value!) : null}
          onChange={(date: Date | null) => {
            if (date) {
              const options = {
                month: "short" as const,
                year: "numeric" as const,
              };
              const formattedDate = date.toLocaleDateString("en-US", options);
              update(index, target, formattedDate); // Update the date in the state
            }
          }}
          showMonthYearPicker
          dateFormat="yyyy-MM"
          customInput={<input />}
          className="absolute min-w-full opacity-0"
        />
      </div>
    </label>
  );
}
