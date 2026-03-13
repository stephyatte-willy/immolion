// app/components/dashboard/CalendarWidget.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CalendarWidget.css';

interface CalendarWidgetProps {
  events: {
    id: number;
    titre: string;
    date: string;
    type: string;
  }[];
}

export default function CalendarWidget({ events }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convertir (0 = Dimanche) en (0 = Lundi) pour notre calendrier
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const hasEventOnDay = (day: number): boolean => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(event => event.date.startsWith(dateStr));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date.startsWith(dateStr));
  };

  const handlePrevMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <h3>Calendrier</h3>
        <div className="calendar-nav">
          <button onClick={handlePrevMonth}>←</button>
          <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={handleNextMonth}>→</button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {dayNames.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty"></div>
        ))}

        {days.map(day => (
          <motion.div
            key={day}
            className={`calendar-day ${hasEventOnDay(day) ? 'has-event' : ''} ${selectedDate?.getDate() === day ? 'selected' : ''}`}
            onClick={() => {
              const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              setSelectedDate(selectedDate?.getDate() === day ? null : newDate);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="day-number">{day}</span>
            {hasEventOnDay(day) && <span className="event-dot"></span>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            className="selected-date-events"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <h4>
              Événements du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h4>
            {getEventsForDay(selectedDate.getDate()).length > 0 ? (
              <div className="events-list">
                {getEventsForDay(selectedDate.getDate()).map(event => (
                  <div key={event.id} className="event-item">
                    <span className="event-type">
                      {event.type === 'maintenance' ? '🔧' : event.type === 'contrat' ? '📄' : '🏠'}
                    </span>
                    <span className="event-title">{event.titre}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-events">Aucun événement ce jour</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}