'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  pomodoros: number;
  estimatedPomodoros: number;
}

type Screen = 'timer' | 'tasks' | 'social';

const Flow = () => {
  const [screen, setScreen] = useState<Screen>('timer');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('flowTodos');
    if (saved) setTodos(JSON.parse(saved));
    const savedSessions = localStorage.getItem('flowSessions');
    if (savedSessions) setSessions(parseInt(savedSessions));
  }, []);

  useEffect(() => {
    localStorage.setItem('flowTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('flowSessions', sessions.toString());
  }, [sessions]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessions(s => s + 1);
      if (currentTaskId) {
        setTodos(prev => prev.map(t => t.id === currentTaskId ? {...t, pomodoros: t.pomodoros + 1} : t));
      }
      setTimeLeft(25 * 60);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft, currentTaskId]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        if (screen === 'timer') setScreen('tasks');
        else if (screen === 'tasks') setScreen('social');
      } else {
        if (screen === 'social') setScreen('tasks');
        else if (screen === 'tasks') setScreen('timer');
      }
    }
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos(prev => [{
      id: Date.now().toString(36),
      text: newTodo.trim(),
      completed: false,
      pomodoros: 0,
      estimatedPomodoros: 4
    }, ...prev]);
    setNewTodo('');
  };

  const activeTask = todos.find(t => t.id === currentTaskId);

  return (
    <div 
      className="min-h-screen bg-black text-white overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div className="text-3xl font-light tracking-[-2px]">flow</div>
        <div className="text-[10px] uppercase tracking-[3px] text-white/40">deep focus</div>
      </div>

      {/* Timer Screen */}
      {screen === 'timer' && (
        <div className="h-screen flex flex-col items-center justify-center pt-16">
          <div className="relative w-[320px] h-[320px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle className="text-white/10" strokeWidth="4" fill="transparent" r="46" cx="50" cy="50"/>
              <circle 
                className="text-cyan-400 transition-all duration-200" 
                strokeWidth="4" 
                strokeDasharray="289" 
                strokeDashoffset={289 - (timeLeft / (25*60)) * 289} 
                strokeLinecap="round"
                fill="transparent" 
                r="46" 
                cx="50" 
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[92px] font-light tabular-nums tracking-[-4px]">{formatTime(timeLeft)}</div>
                <div className="text-sm text-white/40 -mt-2">FOCUS SESSION</div>
              </div>
            </div>
          </div>

          {activeTask && (
            <div className="mt-16 px-8 text-center">
              <div className="uppercase text-[10px] tracking-[2px] text-cyan-400">CURRENT FOCUS</div>
              <div className="mt-3 text-2xl font-light leading-tight">{activeTask.text}</div>
            </div>
          )}

          <button 
            onClick={toggleTimer}
            className="mt-20 px-20 py-7 border border-white/20 hover:bg-white/5 rounded-full text-lg tracking-wide transition-all active:scale-[0.985]"
          >
            {isRunning ? 'PAUSE' : 'START FOCUS'}
          </button>
        </div>
      )}

      {/* Tasks */}
      {screen === 'tasks' && (
        <div className="pt-24 px-6 pb-24">
          <form onSubmit={addTodo} className="mb-10">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="New focus target..."
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-7 py-6 text-xl placeholder:text-white/40 focus:outline-none"
            />
          </form>

          <div className="space-y-4">
            {todos.length === 0 && <div className="text-white/30 text-center py-12">Add a focus target above</div>}
            {todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => setCurrentTaskId(todo.id)}
                className={`p-7 rounded-3xl border transition-all ${currentTaskId === todo.id ? 'border-cyan-400 bg-white/5' : 'border-white/10 hover:border-white/30'}`}
              >
                <div className="text-[21px] leading-tight">{todo.text}</div>
                <div className="mt-4 text-xs font-mono text-white/40">
                  {todo.pomodoros} / {todo.estimatedPomodoros} SESSIONS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Feed */}
      {screen === 'social' && (
        <div className="pt-24 px-6">
          <div className="uppercase text-xs tracking-[3px] text-white/40 mb-8">LIVE FOCUS STREAM</div>
          
          <div className="space-y-8">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="aspect-[9/14] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-3xl overflow-hidden border border-white/10 relative group">
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center">
                    <div className="text-white/60 text-sm">Deep work in progress</div>
                    <div className="text-4xl font-light mt-2 tabular-nums">42:18</div>
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-md px-5 py-3 rounded-2xl text-xs flex justify-between items-center">
                  <div>Anonymous Flow</div>
                  <div className="text-cyan-400">Join</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Swipe Hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[2px] text-white/20">
        SWIPE ↑ ↓ TO NAVIGATE
      </div>
    </div>
  );
};

export default Flow;
