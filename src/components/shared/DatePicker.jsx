import React from "react";
import ReactDatePicker from "react-datepicker";
import { parseISO, isValid, getYear, getMonth } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { formatLocalDate } from "../../utils";

// helpers
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const range = (start, end, step = 1) => {
  const arr = [];
  for (let i = start; i <= end; i += step) arr.push(i);
  return arr;
};

const years = range(1990, getYear(new Date()) + 1);

// Custom Header Component
const CustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => (
  <div className="flex items-center justify-center gap-2 mb-2">
    <button
      onClick={decreaseMonth}
      disabled={prevMonthButtonDisabled}
      className="px-2"
    >
      {"<"}
    </button>

    <select
      value={getYear(date)}
      onChange={(e) => changeYear(+e.target.value)}
      className="border rounded px-2 py-1"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>

    <select
      value={getMonth(date)}
      onChange={(e) => changeMonth(+e.target.value)}
      className="border rounded px-2 py-1"
    >
      {MONTHS.map((m, i) => (
        <option key={m} value={i}>
          {m}
        </option>
      ))}
    </select>

    <button
      onClick={increaseMonth}
      disabled={nextMonthButtonDisabled}
      className="px-2"
    >
      {">"}
    </button>
  </div>
);

//  Main Component
export default function DateInput({
  value,
  onChange,
  disabled = false,
  className = "w-full px-4 py-2 border border-gray-300 rounded-lg",
}) {
  const selectedDate =
    value && isValid(parseISO(value)) ? parseISO(value) : null;

  const handleChange = (date) => {
    if (!date) return onChange("");
    onChange(formatLocalDate(date));
  };

  return (
    <ReactDatePicker
      selected={selectedDate}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      disabled={disabled}
      className={className}
      placeholderText="dd/mm/yyyy"
      renderCustomHeader={(props) => <CustomHeader {...props} />}
      // optional improvements
      showPopperArrow={false}
      showMonthDropdown={false}
      showYearDropdown={false}
    />
  );
}
