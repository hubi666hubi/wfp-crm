import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getAccessToken, initAuth, googleSignIn } from "../lib/auth";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  RefreshCw, 
  Search, 
  Sparkles, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Video,
  ExternalLink,
  Flame,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

interface InboundLead {
  id: string;
  name: string;
  bio: string;
  source: string;
  timestamp: string;
}

export function GoogleCalendarPage() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Create event State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("12:00");
  const [eventDuration, setEventDuration] = useState("60"); // in minutes
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Quick Add event State
  const [quickAddText, setQuickAddText] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Confirmation dialog state for deleting
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Events from Google Calendar API
  const fetchCalendarEvents = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      setIsLoading(true);
      // Retrieve events starting from 3 months ago up to 3 months in the future to populate monthly grid
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 3);
      timeMin.setHours(0, 0, 0, 0);

      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3);
      timeMax.setHours(23, 59, 59, 999);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&maxResults=150`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setNeedsAuth(true);
        }
        throw new Error("Błąd ładowania kalendarza Google");
      }

      const data = await res.json();
      setEvents(data.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Wystąpił problem z pobraniem wydarzeń z Twojego kalendarza.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Zapalnik CRM leads for quick scheduler
  const fetchCrmLeads = useCallback(async () => {
    try {
      setIsLoadingLeads(true);
      const res = await fetch("/api/inbound-leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.slice(0, 8)); // Grab the 8 latest leads
      }
    } catch (err) {
      console.error("Failed to load leads for calendar scheduling:", err);
    } finally {
      setIsLoadingLeads(false);
    }
  }, []);

  // Setup Auth state listener on Load
  useEffect(() => {
    const unsubscribe = initAuth(
      () => {
        setNeedsAuth(false);
        fetchCalendarEvents();
        fetchCrmLeads();
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, [fetchCalendarEvents, fetchCrmLeads]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchCalendarEvents();
        fetchCrmLeads();
      }
    } catch (err) {
      console.error("Calendar Login failed:", err);
      toast.error("Nie udało się zalogować do Google Calendar.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick Add Event (Natural Language Processing by Google API)
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Brak aktywnego tokenu autoryzacji.");
      return;
    }

    setIsQuickAdding(true);
    try {
      const encodedText = encodeURIComponent(quickAddText);
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/quickAdd?text=${encodedText}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Błąd szybkiego dodawania wydarzenia.");

      const eventData = await res.json();
      toast.success(`Błyskawicznie zaplanowano: "${eventData.summary}"!`);
      setQuickAddText("");
      fetchCalendarEvents();
    } catch (err: any) {
      toast.error(err.message || "Błąd szybkiego dodawania.");
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Direct normal create event standard call
  const handleCreateEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      toast.error("Nazwa wydarzenia oraz data są wymagane.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error("Brak uprawnień Google Workspace.");
      return;
    }

    setIsCreatingEvent(true);

    try {
      // Assemble startTime and endTime with duration
      const startIso = `${eventDate}T${eventTime || "12:00"}:00`;
      const startDateObj = new Date(startIso);
      const endDateObj = new Date(startDateObj.getTime() + parseInt(eventDuration, 10) * 60 * 1000);

      const payload = {
        summary: eventTitle,
        description: eventDescription,
        location: eventLocation,
        start: {
          dateTime: startDateObj.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: endDateObj.toISOString(),
          timeZone: "UTC",
        }
      };

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Wystąpił błąd podczas tworzenia wydarzenia.");
      }

      toast.success(`Dodano do kalendarza Google: "${eventTitle}"`);
      setShowCreateModal(false);
      
      // Reset State variables
      setEventTitle("");
      setEventDescription("");
      setEventLocation("");
      fetchCalendarEvents();
    } catch (err: any) {
      toast.error(err.message || "Nie udało się utworzyć wydarzenia.");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Schedule Consultation directly from CRM Lead panel
  const scheduleCrmConsultation = (lead: InboundLead) => {
    setEventTitle(`Konsultacja strategiczna // ${lead.name}`);
    setEventDescription(`Rozmowa doradcza z leadem zakwalifikowanym przez Zapalnik (Źródło: ${lead.source || "Keep"})\n\nProfil klienta:\n${lead.bio}`);
    setEventLocation("Giełda i Spotkanie Online (Google Meet Link zostanie dodany automatycznie)");
    
    // Set to tomorrow at 13:00 Polish time by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    
    setEventDate(`${yyyy}-${mm}-${dd}`);
    setEventTime("13:00");
    setEventDuration("45");
    setShowCreateModal(true);
    toast.info("Przygotowano parametry spotkania konsultacyjnego dla leada CRM.");
  };

  // Secure Mutating/Destructive confirm handler as required by guideline
  const requestDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    const token = getAccessToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error("Błąd usuwania wydarzenia z Google Calendar API");
      }

      toast.success(`Usunięto pomyślnie z Google Calendar: "${eventToDelete.summary}"`);
      fetchCalendarEvents();
    } catch (err: any) {
      toast.error(err.message || "Błąd zapisu.");
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  // Monthly Calendar Grid Helper computation logic
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1, etc.
    const julianFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to Monday as index 0

    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArr = [];

    // Prior month fill-ins
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = julianFirstDay; i > 0; i--) {
      daysArr.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i + 1),
        currentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      daysArr.push({
        date: new Date(year, month, i),
        currentMonth: true,
      });
    }

    // Subsequent month fill-ins to complete the calendar grid to block of 35 or 42
    const currentLength = daysArr.length;
    const paddingNeeded = currentLength <= 35 ? 35 - currentLength : 42 - currentLength;
    for (let i = 1; i <= paddingNeeded; i++) {
      daysArr.push({
        date: new Date(year, month + 1, i),
        currentMonth: false,
      });
    }

    return daysArr;
  }, [currentDate]);

  // Navigate month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Match events to days in month
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eStart = event.start.dateTime || event.start.date;
      if (!eStart) return false;
      const eventLocalDate = new Date(eStart);
      return (
        eventLocalDate.getFullYear() === date.getFullYear() &&
        eventLocalDate.getMonth() === date.getMonth() &&
        eventLocalDate.getDate() === date.getDate()
      );
    });
  }, [events]);

  // Filter events by Search Query
  const filteredEventsForDate = useMemo(() => {
    if (!selectedDay) return [];
    const dayEvents = getEventsForDate(selectedDay);
    if (!searchQuery.trim()) return dayEvents;
    return dayEvents.filter(e => 
      e.summary.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedDay, searchQuery, getEventsForDate]);

  // Format Helper to show readable dates
  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) return "Cały dzień";
    if (event.start.dateTime) {
      const dt = new Date(event.start.dateTime);
      return dt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    }
    return "Brak czasu";
  };

  if (needsAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
          <CalendarIcon size={32} />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-white">Google Calendar Hub</h2>
          <p className="text-sm text-neutral-400 font-sans">
            Wizualizuj swoje spotkania biznesowe, automatycznie planuj konsultacje konsultingowe dla leadów oraz zarządzaj harmonogramem z poziomu jednego panelu.
          </p>
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="px-6 py-3 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
        >
          {isLoggingIn ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          )}
          Autoryzuj kalendarz Google Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH HERO TITLE AND AUTOMATIONS */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="text-rose-500" size={24} />
              <h1 className="text-xl font-bold text-white tracking-tight">Google Calendar Hub</h1>
            </div>
            <p className="text-xs text-neutral-400 font-sans">
              Zintegrowany panel interaktywnego planowania spotkań dla leadów z Zapalnika oraz synchronizacji Google Workspace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchCalendarEvents();
                fetchCrmLeads();
                toast.success("Zsynchronizowano kalendarz Google");
              }}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-neutral-850 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Synchronizuj ręcznie"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setEventDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
                setEventTime("12:00");
                setEventDuration("60");
                setEventTitle("");
                setEventDescription("");
                setEventLocation("");
                setShowCreateModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-950/20"
            >
              <Plus size={14} /> Zaplanuj Wydarzenie
            </button>
          </div>
        </div>

        {/* NLP QUICK ADD BAR */}
        <div className="mt-5 border-t border-neutral-900 pt-4 bg-neutral-900/10">
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                placeholder="NLP Quick Add: wpisz np. 'Spotkanie z Dyrektorem jutro o 15:00 na Skype'..."
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2 text-xs text-neutral-300 focus:outline-none focus:border-rose-500/50 pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-mono font-semibold text-neutral-500 uppercase">
                <Sparkles size={10} className="text-amber-500 animate-pulse" /> AI NLP QuickAdd
              </span>
            </div>
            <button
              type="submit"
              disabled={isQuickAdding || !quickAddText.trim()}
              className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 disabled:opacity-50 text-neutral-200 text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans"
            >
              {isQuickAdding ? <RefreshCw className="animate-spin" size={12} /> : null}
              Utwórz
            </button>
          </form>
        </div>
      </div>

      {/* THREE PANELS GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CRM LEADS FAST ROAD (Planning meetings with CRM Leady) */}
        <div className="lg:col-span-3 bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <Flame size={16} className="text-rose-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">Szybkie spotkanie (CRM)</h3>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
            Kliknij na dowolnego leada z Zapalnika, aby błyskawicznie przygotować dla niego popołudniową konsultację z dołączoną notatką bio.
          </p>

          {isLoadingLeads ? (
            <div className="py-10 text-center animate-pulse text-xs text-neutral-500 font-mono">
              Skanowanie kolejki Zapalnika...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-neutral-600 text-xs italic font-sans">
              Brak nowych leadów w Zapalniku do zaplanowania spotkania.
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {leads.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => scheduleCrmConsultation(lead)}
                  className="w-full text-left bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-850/60 hover:border-neutral-800 p-3 rounded-xl block transition-all group font-sans relative cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-neutral-200 group-hover:text-rose-400 transition-colors truncate">
                      {lead.name}
                    </span>
                    <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                      Zapalnik
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                    {lead.bio}
                  </p>
                  <div className="mt-2 text-[9px] text-neutral-500 font-mono flex items-center justify-between">
                    <span>Źródło: {lead.source || "System"}</span>
                    <span className="text-[8px] bg-neutral-950 px-1 rounded text-neutral-400">Zaplanuj ✦</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MONTHLY CALENDAR GRID BOARD */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-white uppercase font-sans tracking-tight min-w-[120px] text-center">
                {currentDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDay(new Date());
              }}
              className="text-[9px] bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white px-2 py-1 rounded-lg font-mono font-bold uppercase transition-all cursor-pointer"
            >
              Dziś
            </button>
          </div>

          {/* GRID OF DAYS */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-widest">
            <div>Pn</div>
            <div>Wt</div>
            <div>Śr</div>
            <div>Cz</div>
            <div>Pt</div>
            <div>So</div>
            <div>Nd</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, idx) => {
              const dayEvents = getEventsForDate(day.date);
              const isSelected = selectedDay && 
                day.date.getFullYear() === selectedDay.getFullYear() &&
                day.date.getMonth() === selectedDay.getMonth() &&
                day.date.getDate() === selectedDay.getDate();
              const isToday = () => {
                const today = new Date();
                return (
                  day.date.getFullYear() === today.getFullYear() &&
                  day.date.getMonth() === today.getMonth() &&
                  day.date.getDate() === today.getDate()
                );
              };

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day.date)}
                  className={`aspect-square rounded-xl p-1.5 flex flex-col justify-between text-left relative transition-all border group cursor-pointer ${
                    isSelected
                      ? "bg-rose-500/10 border-rose-500/60 text-white shadow-md shadow-rose-950/20"
                      : isToday()
                      ? "bg-neutral-900 border-rose-500/40 text-rose-400"
                      : day.currentMonth
                      ? "bg-neutral-900/40 border-neutral-850/60 hover:bg-neutral-900 hover:border-neutral-800 text-neutral-100"
                      : "bg-neutral-950/10 border-transparent text-neutral-600 hover:text-neutral-500"
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isToday() ? 'text-rose-400' : ''}`}>
                    {day.date.getDate()}
                  </span>

                  {/* Badges/Event points */}
                  <div className="flex flex-wrap gap-0.5 justify-end mt-1 max-h-3 overflow-hidden">
                    {dayEvents.map((evt, eIdx) => (
                      <span
                        key={eIdx}
                        className="w-1.5 h-1.5 rounded-full bg-rose-500 border border-rose-900 shadow-sm shrink-0"
                        title={evt.summary}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SELECTED DAY EVENTS BOARD & AGENDA */}
        <div className="lg:col-span-4 bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-rose-500" />
              <h3 className="text-sm font-semibold text-white">Wydarzenia</h3>
            </div>
            <span className="text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded-full font-mono font-bold">
              {selectedDay ? selectedDay.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" }) : "Wszystkie"}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtruj wydarzenia po haśle..."
              className="w-full bg-neutral-950 border border-neutral-850 rounded-xl pl-9 pr-4 py-2 text-[11px] text-neutral-300 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          {filteredEventsForDate.length === 0 ? (
            <div className="py-16 text-center text-neutral-600 text-xs italic font-sans flex flex-col items-center justify-center space-y-2">
              <CalendarIcon size={32} className="text-neutral-800" />
              <p>Brak zaplanowanych wydarzeń na ten dzień.</p>
              <button
                onClick={() => {
                  if (selectedDay) {
                    const yyyy = selectedDay.getFullYear();
                    const mm = String(selectedDay.getMonth() + 1).padStart(2, "0");
                    const dd = String(selectedDay.getDate()).padStart(2, "0");
                    setEventDate(`${yyyy}-${mm}-${dd}`);
                  }
                  setEventTitle("");
                  setEventDescription("");
                  setEventLocation("");
                  setShowCreateModal(true);
                }}
                className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono font-bold"
              >
                + Dodaj wydarzenie
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {filteredEventsForDate.map(event => (
                <div
                  key={event.id}
                  className="bg-neutral-900/60 border border-neutral-850 p-3.5 rounded-xl block group font-sans relative"
                >
                  <button
                    onClick={() => requestDeleteEvent(event)}
                    className="absolute top-3.5 right-3.5 text-neutral-500 hover:text-rose-500 transition-colors p-1 rounded hover:bg-neutral-950 cursor-pointer"
                    title="Usuń to wydarzenie"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="space-y-1.5 pr-6">
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/25 px-1.5 py-0.5 rounded-md font-mono font-bold">
                      {formatEventTime(event)}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors leading-relaxed">
                      {event.summary}
                    </h4>
                    {event.description && (
                      <p className="text-[10px] text-neutral-400 whitespace-pre-wrap leading-relaxed select-text font-sans">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 select-text">
                        <MapPin size={10} className="text-neutral-400" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-rose-400 hover:text-rose-300 font-mono font-bold flex items-center gap-1 mt-1.5 hover:underline"
                      >
                        <ExternalLink size={10} /> Otwórz w Google Calendar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CONFIRMATION DIALOG (MODAL) FOR MUTATING DELETION DESTRUCTIVE OPERATIONS - MANDATORY */}
      <AnimatePresence>
        {eventToDelete && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEventToDelete(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 max-w-sm w-full relative z-10 space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-500">
                <AlertCircle size={20} className="animate-bounce" />
                <h3 className="text-sm font-bold text-white">Usunąć wydarzenie?</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Czy na pewno chcesz bezpowrotnie usunąć to wydarzenie z Twojego konta Google Calendar? Ta operacja natychmiast zsynchronizuje się z chmurą Google Workspace.
              </p>

              <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-850 text-left font-sans">
                <span className="text-[9px] font-mono text-rose-500 block">Wydarzenie:</span>
                <p className="text-xs font-bold text-white py-0.5">{eventToDelete.summary}</p>
                <div className="text-[9px] text-neutral-500 font-mono flex gap-2 items-center pt-1.5">
                  <Clock size={10} />
                  <span>
                    {eventToDelete.start.dateTime ? new Date(eventToDelete.start.dateTime).toLocaleDateString("pl-PL") : eventToDelete.start.date}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setEventToDelete(null)}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-mono border border-neutral-800 cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  {isDeleting ? <RefreshCw className="animate-spin" size={11} /> : null}
                  Zatwierdź Usunięcie
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE EVENT FULL FORM MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 max-w-md w-full relative z-10 space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-rose-500/10 pb-3">
                <CalendarIcon className="text-rose-500 animate-pulse" size={18} />
                <h3 className="text-sm font-semibold text-white">Zaplanuj Nowe Wydarzenie</h3>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4 font-sans text-xs">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block">Nazwa Spotkania / Wydarzenia</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Wpisz chwytliwy tytuł (np. Konsultacja 1:1)..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-300 focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                {/* Grid Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block font-bold">Data (Dzień)</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-300 focus:outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block font-bold">Godzina Startu</label>
                    <input
                      type="time"
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-300 focus:outline-none focus:border-rose-500/50"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block font-bold">Czas Trwania (Minuty)</label>
                  <select
                    value={eventDuration}
                    onChange={(e) => setEventDuration(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-300 focus:outline-none focus:border-rose-500/40"
                  >
                    <option value="15">15 minut</option>
                    <option value="30">30 minut</option>
                    <option value="45">45 minut</option>
                    <option value="60">60 minut (1 godzina)</option>
                    <option value="90">90 minut</option>
                    <option value="120">120 minut (2 godziny)</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block">Lokalizacja / Link do spotkania</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="np. Google Meet / Skype / Warszawa, Biuro..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-300 focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block">Notatka / Opis spotkania</label>
                  <textarea
                    rows={3}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Dodatkowe cele rozmowy, ból klienta, profil biznesowy..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-300 focus:outline-none focus:border-rose-500/50 resize-none"
                  />
                </div>

                {/* Actions Button */}
                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-mono border border-neutral-850 cursor-pointer"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingEvent}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/20"
                  >
                    {isCreatingEvent ? <RefreshCw className="animate-spin" size={12} /> : null}
                    Zatwierdź i Wyślij
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
