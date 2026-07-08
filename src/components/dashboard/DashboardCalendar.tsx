import { memo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Zap, Users, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

// Generate some mock events roughly around "today"
const getMockEvents = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDay = today.getDate();

  return [
    { id: 1, date: new Date(year, month, currentDay + 1), title: 'Start VSL Kampanii: Projekt X', type: 'campaign', time: '09:00' },
    { id: 2, date: new Date(year, month, currentDay + 3), title: 'Drip Email #1 - Aktywacja Leada', type: 'crm', time: '14:30' },
    { id: 3, date: new Date(year, month, currentDay + 8), title: 'Kwantowy Pricing - Aktualizacja', type: 'system', time: '00:00' },
    { id: 4, date: new Date(year, month, currentDay + 11), title: 'Publikacja Wątku: "Toksyczna Retencja"', type: 'campaign', time: '18:00' }
  ];
};

const DashboardCalendarComponent = function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState(getMockEvents());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Shift first day so Monday is 0 instead of Sunday (0 => 6)
  const startingDayIndex = firstDay === 0 ? 6 : firstDay - 1;

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const getEventsForDay = (day: number) => {
    return events.filter(e => e.date.getDate() === day && e.date.getMonth() === month && e.date.getFullYear() === year);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col lg:flex-row h-full">
      {/* Calendar Grid Section */}
      <div className="p-6 flex-1 border-b lg:border-b-0 lg:border-r border-neutral-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <CalendarIcon size={18} className="text-rose-500" />
            Harmonogram Operacji
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-neutral-300">
              {monthNames[month]} {year}
            </span>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1 hover:text-white text-neutral-500 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextMonth} className="p-1 hover:text-white text-neutral-500 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-neutral-500">
          <div>Pn</div><div>Wt</div><div>Śr</div><div>Cz</div><div>Pt</div><div>Sb</div><div>Nd</div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 h-16 rounded-md bg-neutral-950/20" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);
            const isWeekend = (startingDayIndex + i) % 7 === 5 || (startingDayIndex + i) % 7 === 6;
            
            return (
              <div 
                key={day} 
                className={`p-1.5 h-16 xl:h-20 rounded-md border flex flex-col transition-colors
                  ${today ? 'border-rose-500/50 bg-rose-500/10' : 'border-neutral-800/50 bg-neutral-950/40 hover:bg-neutral-800'}
                  ${isWeekend ? 'opacity-60' : ''}
                `}
              >
                <span className={`text-xs font-medium mb-1 ${today ? 'text-rose-400' : 'text-neutral-400'}`}>
                  {day}
                </span>
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`w-full h-1.5 rounded-full ${
                        event.type === 'campaign' ? 'bg-amber-500' : 
                        event.type === 'crm' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      title={event.title}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="w-full lg:w-80 p-6 bg-neutral-950/30">
        <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">
          Zaplanowane (7 dni)
        </h4>
        <div className="space-y-4">
          {events.filter(e => e.date >= new Date()).slice(0, 4).map((event, i) => (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={event.id} 
              className="flex gap-3 items-start"
            >
              <div className="mt-0.5">
                {event.type === 'campaign' ? <Zap size={14} className="text-amber-500" /> : 
                 event.type === 'crm' ? <Users size={14} className="text-blue-500" /> : 
                 <Terminal size={14} className="text-emerald-500" />}
              </div>
              <div>
                <p className="text-sm text-gray-200 font-medium leading-tight">{event.title}</p>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-xs text-neutral-500">
                    {event.date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                    {event.time}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          {events.filter(e => e.date >= new Date()).length === 0 && (
            <div className="text-sm text-neutral-500 text-center py-4">Brak zaplanowanych operacji.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export const DashboardCalendar = memo(DashboardCalendarComponent);
