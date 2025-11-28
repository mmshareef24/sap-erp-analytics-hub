import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  return years;
};

export default function DateFilter({ onFilterChange, className }) {
  const [filterType, setFilterType] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const years = generateYears();

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    if (type === "all") {
      setSelectedDate(null);
      setSelectedMonth("");
      setSelectedYear("");
      onFilterChange({ type: "all", startDate: null, endDate: null });
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      onFilterChange({ type: "day", startDate, endDate });
    }
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (month && selectedYear) {
      applyMonthYearFilter(month, selectedYear);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (filterType === "month" && selectedMonth && year) {
      applyMonthYearFilter(selectedMonth, year);
    } else if (filterType === "year" && year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
      onFilterChange({ type: "year", startDate, endDate });
    }
  };

  const applyMonthYearFilter = (month, year) => {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    onFilterChange({ type: "month", startDate, endDate });
  };

  const clearFilter = () => {
    setFilterType("all");
    setSelectedDate(null);
    setSelectedMonth("");
    setSelectedYear("");
    onFilterChange({ type: "all", startDate: null, endDate: null });
  };

  const getFilterLabel = () => {
    if (filterType === "all") return "All Time";
    if (filterType === "day" && selectedDate) return format(selectedDate, "MMM dd, yyyy");
    if (filterType === "month" && selectedMonth && selectedYear) {
      return `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
    }
    if (filterType === "year" && selectedYear) return selectedYear;
    return "Select Date";
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <div className="flex items-center bg-white border rounded-lg overflow-hidden">
        <Button
          variant={filterType === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFilterTypeChange("all")}
          className="rounded-none"
        >
          All
        </Button>
        <Button
          variant={filterType === "day" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFilterTypeChange("day")}
          className="rounded-none"
        >
          Day
        </Button>
        <Button
          variant={filterType === "month" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFilterTypeChange("month")}
          className="rounded-none"
        >
          Month
        </Button>
        <Button
          variant={filterType === "year" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleFilterTypeChange("year")}
          className="rounded-none"
        >
          Year
        </Button>
      </div>

      {filterType === "day" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      {filterType === "month" && (
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-24 h-9">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filterType === "year" && (
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-24 h-9">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filterType !== "all" && (
        <Button variant="ghost" size="sm" onClick={clearFilter} className="h-9 px-2">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Helper function to filter data by date
export function filterDataByDate(data, dateFilter, dateField = "created_date") {
  if (!dateFilter || dateFilter.type === "all" || !dateFilter.startDate || !dateFilter.endDate) {
    return data;
  }

  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= dateFilter.startDate && itemDate <= dateFilter.endDate;
  });
}