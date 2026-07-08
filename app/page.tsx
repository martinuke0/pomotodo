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
  const [dragY, setDragY] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setDragY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const delta = touchStartY.current - currentY;
    setDragY(Math.max(-120, Math.min(120, delta * 0.6)));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    setDragY(0);

    if (Math.abs(delta) > 65) {
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

  const selectTask = (id: string) => {
    setCurrentTaskId(id);
    setScreen('timer');
  };

  const activeTask = todos.find(t => t.id === currentTaskId);
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Elegant Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-3xl border-b border-white/5 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400" />
          <div className="text-3xl font-light tracking-[-1.5px]">flow</div>
        </div>
        <div className="flex items-center gap-8 text-xs uppercase tracking-[2px] text-white/50">
          <div>{sessions} sessions</div>
          <div className="h-3 w-px bg-white/20" />
          <div>DEEP WORK</div>
        </div>
      </div>

      {/* Main Content with Gesture Layer */}
      <div 
        ref={containerRef}
        className="pt-20 pb-20 transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${dragY}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* ==================== TIMER SCREEN ==================== */}
        {screen === 'timer' && (
          <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 relative">
            {/* Immersive Timer */}
            <div className="relative w-[340px] h-[340px] flex items-center justify-center mb-8">
              {/* Background Ring */}
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="47" 
                  fill="none" 
                  stroke="#111" 
                  strokeWidth="2.5" 
                />
              </svg>
              
              {/* Progress Ring with Gradient */}
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <circle 
                  cx="50" cy="50" r="47" 
                  fill="none" 
                  stroke="url(#progressGradient)" 
                  strokeWidth="2.5" 
                  strokeDasharray="295.3" 
                  strokeDashoffset={295.3 - (progress / 100) * 295.3}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Timer Display */}
              <div className="relative z-10 text-center">
                <div className="font-light text-[92px] tabular-nums tracking-[-5px] leading-none">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[11px] uppercase tracking-[3px] text-white/40 mt-1">
                  {isRunning ? 'IN FLOW' : 'READY TO FOCUS'}
                </div>
              </div>

              {/* Subtle breathing ring when running */}
              {isRunning && (
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-pulse" />
              )}
            </div>

            {/* Current Focus Context */}
            {activeTask ? (
              <div className="text-center mb-12 px-8 max-w-md">
                <div className="uppercase text-[10px] tracking-[2.5px] text-cyan-400 mb-2">NOW FOCUSING ON</div>
                <div className="text-[22px] font-light leading-tight tracking-[-0.3px]">{activeTask.text}</div>
              </div>
            ) : (
              <div className="text-center mb-12 text-white/40 text-sm">
                Select a task from the Tasks screen
              </div>
            )}

            {/* Primary Action */}
            <button
              onClick={toggleTimer}
              className={`px-14 py-6 rounded-2xl text-base tracking-[1px] font-medium transition-all active:scale-[0.985] border ${isRunning ? 'border-white/30 hover:bg-white/5' : 'bg-white text-black border-white'}`}
            >
              {isRunning ? 'PAUSE SESSION' : 'BEGIN DEEP FOCUS'}
            </button>
          </div>
        )}

        {/* ==================== TASKS SCREEN ==================== */}
        {screen === 'tasks' && (
          <div className="px-6 pt-8 pb-24">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-[2px] text-white/40 mb-1">YOUR FOCUS QUEUE</div>
              <div className="text-4xl font-light tracking-[-1px]">What matters today?</div>
            </div>

            {/* Add Task */}
            <form onSubmit={addTodo} className="mb-8">
              <div className="relative">
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add a new focus target..."
                  className="w-full bg-[#0a0a0a] border border-white/10 focus:border-white/30 rounded-3xl px-7 py-6 text-[17px] placeholder:text-white/30 outline-none transition-all"
                />
              </div>
            </form>

            {/* Task List */}
            <div className="space-y-3">
              {todos.length === 0 && (
                <div className="py-16 text-center text-white/30 text-sm tracking-wide">
                  No targets yet. Add one above to begin.
                </div>
              )}
              {todos.map((todo, index) => (
                <div
                  key={todo.id}
                  onClick={() => selectTask(todo.id)}
                  className={`group p-7 rounded-3xl border transition-all active:scale-[0.985] cursor-pointer ${currentTaskId === todo.id ? 'border-cyan-400 bg-[#0a0a0a]' : 'border-white/10 hover:border-white/20 bg-[#0a0a0a]'}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="text-[19px] font-light tracking-[-0.2px] leading-tight pr-4">{todo.text}</div>
                      <div className="mt-5 flex items-center gap-4 text-xs text-white/40 font-mono">
                        <div>{todo.pomodoros} / {todo.estimatedPomodoros}</div>
                        <div className="h-px flex-1 bg-white/10" />
                        <div>SESSIONS</div>
                      </div>
                    </div>
                    <div className={`text-[10px] px-3 py-1 rounded-full border transition-all ${currentTaskId === todo.id ? 'border-cyan-400 text-cyan-400' : 'border-white/20 text-white/40 group-hover:border-white/40'}`}>
                      FOCUS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SOCIAL SCREEN ==================== */}
        {screen === 'social' && (
          <div className="px-6 pt-8 pb-24">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-[2px] text-white/40 mb-1">LIVE IN FLOW</div>
              <div className="text-4xl font-light tracking-[-1px]">See what others are building.</div>
            </div>

            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] aspect-[16/10] flex flex-col"
                >
                  {/* Abstract Visual Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#222_0.8px,transparent_1px)] bg-[length:5px_5px]" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
                  
                  {/* Live Indicator */}
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="text-[10px] uppercase tracking-[1.5px] text-emerald-400">LIVE • {12 + i} MIN AGO</div>
                  </div>

                  {/* Content */}
                  <div className="mt-auto p-7 relative z-10">
                    <div className="text-3xl font-light tracking-[-0.5px] leading-none mb-1">Deep work session</div>
                    <div className="text-white/60 text-sm">Anonymous creator • Building in public</div>
                    
                    <div className="mt-6 flex items-center justify-between text-xs">
                      <div className="px-4 py-2 rounded-full border border-white/20 text-white/60 group-hover:border-white/40 transition-colors cursor-pointer">
                        JOIN SESSION
                      </div>
                      <div className="font-mono text-white/40">27:41</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Elegant Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-3xl border-t border-white/5">
        <div className="flex justify-around items-center px-2 py-4 text-xs tracking-[1.5px]">
          {[
            { id: 'timer' as const, label: 'TIMER' },
            { id: 'tasks' as const, label: 'TASKS' },
            { id: 'social' as const, label: 'FLOW' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`px-8 py-3 rounded-2xl transition-all ${screen === item.id ? 'bg-white text-black font-medium' : 'text-white/50 hover:text-white/80'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Flow;
