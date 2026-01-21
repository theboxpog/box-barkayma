import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const DatePicker = ({ value, onChange, minDate, allowedDays = [0, 1, 2, 3, 4, 5, 6], label }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return '';
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;

    const dayOfWeek = date.getDay();

    // Check if day of week is allowed
    if (!allowedDays.includes(dayOfWeek)) {
      return true;
    }

    // Check if date is before minimum date
    if (minDate) {
      const min = new Date(minDate + 'T00:00:00');
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      min.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      if (checkDate < min) {
        return true;
      }
    }

    return false;
  };

  const isDateSelected = (date) => {
    if (!date || !value) return false;
    return formatDate(date) === value;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    onChange(formatDate(date));
    setShowCalendar(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="relative" ref={calendarRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className={`w-full px-3 py-2 border rounded-md text-left flex items-center justify-between focus:outline-none focus:ring-2 ${
          value && !allowedDays.includes(new Date(value + 'T00:00:00').getDay())
            ? 'border-red-400 bg-red-50 focus:ring-red-500'
            : 'border-gray-300 bg-white focus:ring-blue-500'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {formatDisplayDate(value)}
        </span>
        <CalendarIcon size={18} className="text-gray-400" />
      </button>

      {allowedDays.length < 7 && (
        <p className="text-xs text-blue-600 mt-1 font-medium">
          ✓ Allowed days: {allowedDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
        </p>
      )}

      {showCalendar && (
        <div className="fixed inset-8 md:absolute md:inset-auto md:left-auto md:right-auto md:top-auto md:bottom-auto z-50 md:mt-2 bg-white border border-gray-300 w-auto md:w-80 max-w-[240px] mx-auto md:mx-0 overflow-y-auto" style={{padding: '4px'}}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between" style={{marginBottom: '3px'}}>
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="hover:bg-gray-100"
              style={{padding: '2px'}}
            >
              <ChevronLeft size={10} />
            </button>
            <span className="font-semibold text-gray-900" style={{fontSize: '9px'}}>{monthName}</span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="hover:bg-gray-100"
              style={{padding: '2px'}}
            >
              <ChevronRight size={10} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7" style={{gap: '1px', marginBottom: '2px'}}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="text-center font-semibold text-gray-600" style={{fontSize: '8px', padding: '1px'}}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7" style={{gap: '1px'}}>
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} style={{padding: '1px'}} />;
              }

              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  disabled={disabled}
                  style={{fontSize: '9px', padding: '1px', minHeight: '18px'}}
                  className={`
                    transition-colors
                    ${disabled
                      ? 'text-gray-300 bg-gray-50 cursor-not-allowed opacity-40'
                      : 'text-gray-900 hover:bg-blue-100 cursor-pointer'
                    }
                    ${selected
                      ? 'bg-blue-600 text-white font-bold hover:bg-blue-700'
                      : ''
                    }
                    ${today && !selected
                      ? 'border border-blue-600 font-semibold'
                      : ''
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
