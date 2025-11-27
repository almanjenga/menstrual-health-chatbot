import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  TrendingUp,
  Bell,
  Save,
  X,
  Droplet,
  Heart,
  Brain,
  Activity
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Config";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Label } from "./components/ui/Label";
import { Switch } from "./components/ui/Switch";

const TrackCyclePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLogForm, setShowLogForm] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  
  const [logs, setLogs] = useState({});
  const [logData, setLogData] = useState({
    symptoms: [],
    mood: "",
    flowIntensity: "",
    notes: "",
  });

  const [cycleData, setCycleData] = useState({
    cycleLength: 28,
    periodDuration: 5,
    lastPeriodStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const symptoms = ["Cramps", "Bloating", "Headache", "Fatigue", "Mood swings", "Acne"];
  const moods = ["😊 Happy", "😌 Calm", "😢 Sad", "😤 Irritated", "💪 Energetic", "😴 Tired"];
  const flowLevels = ["Light", "Medium", "Heavy"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load saved cycle data
        const savedCycle = localStorage.getItem(`cycle_${currentUser.uid}`);
        if (savedCycle) {
          const parsed = JSON.parse(savedCycle);
          setCycleData(parsed);
        }
        // Load saved logs
        const savedLogs = localStorage.getItem(`logs_${currentUser.uid}`);
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        }
        // Load reminder settings
        const savedReminders = localStorage.getItem(`reminders_${currentUser.uid}`);
        if (savedReminders) {
          setRemindersEnabled(JSON.parse(savedReminders));
        }
      } else {
        navigate("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSaveLog = () => {
    if (user) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const updatedLogs = { ...logs, [dateKey]: { ...logData } };
      setLogs(updatedLogs);
      localStorage.setItem(`logs_${user.uid}`, JSON.stringify(updatedLogs));
      setShowLogForm(false);
      setLogData({ symptoms: [], mood: "", flowIntensity: "", notes: "" });
    }
  };

  const handleSaveCycle = () => {
    if (user) {
      localStorage.setItem(`cycle_${user.uid}`, JSON.stringify(cycleData));
      // Also update HomePage data
      const currentDay = calculateCurrentDay();
      const daysUntilPeriod = calculateDaysUntilPeriod();
      localStorage.setItem(`cycle_${user.uid}`, JSON.stringify({
        ...cycleData,
        currentDay,
        daysUntilPeriod
      }));
    }
  };

  // Auto-save cycle settings when changed
  useEffect(() => {
    if (user && cycleData.lastPeriodStart) {
      const timeoutId = setTimeout(() => {
        const currentDay = calculateCurrentDay();
        const daysUntilPeriod = calculateDaysUntilPeriod();
        const dataToSave = {
          ...cycleData,
          currentDay,
          daysUntilPeriod
        };
        localStorage.setItem(`cycle_${user.uid}`, JSON.stringify(dataToSave));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleData.cycleLength, cycleData.periodDuration, cycleData.lastPeriodStart, user]);

  const toggleSymptom = (symptom) => {
    setLogData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  // Calculate day of cycle for a given date
  const getDayOfCycle = (date) => {
    if (!cycleData.lastPeriodStart) return 0;
    const lastPeriod = new Date(cycleData.lastPeriodStart);
    const diffTime = date - lastPeriod;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayOfCycle = (diffDays % cycleData.cycleLength) + 1;
    return dayOfCycle;
  };

  // Calculate current day of cycle
  const calculateCurrentDay = () => {
    return getDayOfCycle(new Date());
  };

  // Calculate days until next period
  const calculateDaysUntilPeriod = () => {
    if (!cycleData.lastPeriodStart) return 0;
    const currentDay = calculateCurrentDay();
    const daysUntil = cycleData.cycleLength - currentDay + 1;
    return daysUntil > cycleData.cycleLength ? daysUntil - cycleData.cycleLength : daysUntil;
  };

  // Check if a date is a period day
  const isPeriodDay = (date) => {
    const dayOfCycle = getDayOfCycle(date);
    return dayOfCycle <= cycleData.periodDuration && dayOfCycle > 0;
  };

  // Check if a date is in the fertile window
  const isFertileWindow = (date) => {
    const dayOfCycle = getDayOfCycle(date);
    const ovulationDay = cycleData.cycleLength - 14;
    return dayOfCycle >= ovulationDay - 5 && dayOfCycle <= ovulationDay + 1 && dayOfCycle > 0;
  };

  // Get log for a specific date
  const getLogForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return logs[dateKey] || null;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
        className="absolute top-10 left-10 w-80 h-80 bg-rose-200/20 dark:bg-rose-900/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 140, ease: "linear" }}
        className="absolute bottom-10 right-10 w-96 h-96 bg-violet-200/20 dark:bg-violet-900/20 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-rose-400" />
              Track Your Cycle
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor your menstrual health and patterns
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Log Entry
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 dark:bg-gray-800/90 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {monthNames[month]} {year}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const newDate = new Date(year, month - 1, 1);
                    setSelectedDate(newDate);
                  }}
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const newDate = new Date(year, month + 1, 1);
                    setSelectedDate(newDate);
                  }}
                >
                  →
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                const isPeriod = isPeriodDay(date);
                const isFertile = isFertileWindow(date);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const dayLog = getLogForDate(date);
                const hasLog = dayLog !== null;
                
                return (
                  <motion.button
                    key={day}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedDate(date);
                      // Load existing log if available
                      if (dayLog) {
                        setLogData({ ...dayLog });
                      } else {
                        setLogData({ symptoms: [], mood: "", flowIntensity: "", notes: "" });
                      }
                      setShowLogForm(true);
                    }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all relative ${
                      isPeriod
                        ? "bg-gradient-to-br from-rose-400 to-pink-400 text-white"
                        : isFertile
                        ? "bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/50 dark:to-pink-800/50 text-purple-700 dark:text-purple-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    } ${isToday ? "ring-2 ring-rose-500 dark:ring-rose-400" : ""} ${hasLog ? "border-2 border-blue-400 dark:border-blue-500" : ""}`}
                  >
                    <span>{day}</span>
                    {hasLog && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {dayLog.symptoms.length > 0 && (
                          <div className="w-1 h-1 rounded-full bg-white dark:bg-gray-800"></div>
                        )}
                        {dayLog.flowIntensity && (
                          <div className="w-1 h-1 rounded-full bg-blue-300 dark:bg-blue-500"></div>
                        )}
                        {dayLog.mood && (
                          <div className="w-1 h-1 rounded-full bg-yellow-300 dark:bg-yellow-500"></div>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-rose-400 to-pink-400"></div>
                <span className="text-gray-600 dark:text-gray-400">Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/50 dark:to-pink-800/50"></div>
                <span className="text-gray-600 dark:text-gray-400">Fertile Window</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-rose-500 dark:border-rose-400"></div>
                <span className="text-gray-600 dark:text-gray-400">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-blue-400 dark:border-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Has Log</span>
              </div>
            </div>
          </Card>

          {/* Stats & Settings */}
          <div className="space-y-6">
            {/* Summary Stats */}
            <Card className="dark:bg-gray-800/90 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-400" />
                Summary
              </h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Cycle Length</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{cycleData.cycleLength} days</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Period Duration</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{cycleData.periodDuration} days</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Day</p>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{calculateCurrentDay()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Until Period</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateDaysUntilPeriod()}</p>
                </div>
              </div>
            </Card>

            {/* Cycle Settings */}
            <Card className="dark:bg-gray-800/90 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Cycle Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cycleLength">Cycle Length (days)</Label>
                  <Input
                    id="cycleLength"
                    type="number"
                    value={cycleData.cycleLength}
                    onChange={(e) => setCycleData({ ...cycleData, cycleLength: parseInt(e.target.value) || 28 })}
                    min="21"
                    max="35"
                  />
                </div>
                <div>
                  <Label htmlFor="periodDuration">Period Duration (days)</Label>
                  <Input
                    id="periodDuration"
                    type="number"
                    value={cycleData.periodDuration}
                    onChange={(e) => setCycleData({ ...cycleData, periodDuration: parseInt(e.target.value) || 5 })}
                    min="3"
                    max="7"
                  />
                </div>
                <div>
                  <Label htmlFor="lastPeriod">Last Period Start</Label>
                  <Input
                    id="lastPeriod"
                    type="date"
                    value={cycleData.lastPeriodStart}
                    onChange={(e) => setCycleData({ ...cycleData, lastPeriodStart: e.target.value })}
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleSaveCycle}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2 inline" />
                  Save Settings
                </Button>
              </div>
            </Card>

            {/* Reminders */}
            <Card className="dark:bg-gray-800/90 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" />
                Reminders
              </h3>
              <Switch
                label="Enable Cycle Reminders"
                checked={remindersEnabled}
                onCheckedChange={(checked) => {
                  setRemindersEnabled(checked);
                  if (user) {
                    localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(checked));
                  }
                }}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Log Entry Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Log Entry</h3>
              <button
                onClick={() => setShowLogForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Symptoms</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {symptoms.map(symptom => (
                    <motion.button
                      key={symptom}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        logData.symptoms.includes(symptom)
                          ? "bg-gradient-to-r from-rose-400 to-pink-400 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {symptom}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Mood</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {moods.map(mood => (
                    <motion.button
                      key={mood}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLogData({ ...logData, mood })}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        logData.mood === mood
                          ? "bg-gradient-to-r from-rose-400 to-pink-400 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {mood}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Flow Intensity</Label>
                <div className="flex gap-2 mt-2">
                  {flowLevels.map(level => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLogData({ ...logData, flowIntensity: level })}
                      className={`flex-1 p-2 rounded-lg text-sm transition-all ${
                        logData.flowIntensity === level
                          ? "bg-gradient-to-r from-rose-400 to-pink-400 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Droplet className="w-4 h-4 mx-auto mb-1" />
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={logData.notes}
                  onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-pink-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 mt-2"
                  rows="3"
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Date: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowLogForm(false);
                    setLogData({ symptoms: [], mood: "", flowIntensity: "", notes: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveLog}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2 inline" />
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TrackCyclePage;

