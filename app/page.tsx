'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  pomodoros: number;
  estimatedPomodoros: number;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const PomoTodo = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedTodos = localStorage.getItem('pomoTodos');
    if (savedTodos) setTodos(JSON.parse(savedTodos));

    const savedStats = localStorage.getItem('pomoStats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setSessionsCompleted(stats.sessions || 0);
      setTotalPomodoros(stats.total || 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pomoTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('pomoStats', JSON.stringify({ sessions: sessionsCompleted, total: totalPomodoros }));
  }, [sessionsCompleted, totalPomodoros]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 660;
      const gain = ctx.createGain();
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 600);
    } catch {}

    if (mode === 'work') {
      const newSess = sessionsCompleted + 1;
      setSessionsCompleted(newSess);
      setTotalPomodoros(p => p + 1);

      if (currentTaskId) {
        setTodos(prev => prev.map(t => t.id === currentTaskId ? {...t, pomodoros: t.pomodoros + 1} : t));
      }

      const newM = newSess % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(newM);
      setTimeLeft(newM === 'longBreak' ? 900 : 300);
    } else {
      setMode('work');
      setTimeLeft(1500);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 1500 : mode === 'shortBreak' ? 300 : 900);
  };

  const changeMode = (m: TimerMode) => {
    setIsRunning(false);
    setMode(m);
    setTimeLeft(m === 'work' ? 1500 : m === 'shortBreak' ? 300 : 900);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
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

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? {...t, completed: !t.completed} : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (currentTaskId === id) setCurrentTaskId(null);
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const progress = todos.length ? Math.round(todos.filter(t => t.completed).length / todos.length * 100) : 0;

  const activeTask = todos.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-6xl font-bold">PomoTodo</h1>
          <div className="flex gap-8">
            <div>Sessions: {sessionsCompleted}</div>
            <div>Pomos: {totalPomodoros}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Timer */}
          <div className="lg:col-span-2 bg-zinc-900 rounded-3xl p-12">
            <div className="flex gap-2 mb-8 justify-center">
              {(['work','shortBreak','longBreak'] as const).map(m => (
                <button key={m} onClick={() => changeMode(m)} className={`px-4 py-2 rounded-full ${mode === m ? 'bg-white text-black' : 'bg-zinc-800'}`}>
                  {m[0].toUpperCase()}
                </button>
              ))}
            </div>
            <div className="text-center text-[120px] font-mono mb-8 tabular-nums">{formatTime(timeLeft)}</div>
            
            <div className="flex gap-4">
              <button onClick={toggleTimer} className="flex-1 py-6 bg-white text-black rounded-2xl text-2xl font-medium">
                {isRunning ? 'PAUSE' : 'START'}
              </button>
              <button onClick={resetTimer} className="px-8 py-6 border rounded-2xl">Reset</button>
            </div>
            {activeTask && <div className="mt-8 text-center text-sm opacity-75">Focusing: {activeTask.text}</div>}
          </div>

          {/* Todos */}
          <div className="lg:col-span-3 bg-zinc-900 rounded-3xl p-8">
            <form onSubmit={addTodo} className="mb-8 flex">
              <input 
                value={newTodo} 
                onChange={e => setNewTodo(e.target.value)}
                placeholder="New task..." 
                className="flex-1 bg-zinc-800 px-6 py-4 rounded-l-2xl outline-none"
              />
              <button type="submit" className="bg-orange-500 px-8 rounded-r-2xl">Add</button>
            </form>

            <div className="flex mb-6 gap-2">
              {(['all','active','completed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-5 py-1.5 rounded-full text-sm ${filter === f ? 'bg-zinc-700' : ''}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-auto">
              {filteredTodos.map(todo => (
                <div key={todo.id} className="flex items-center gap-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800 group">
                  <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="w-6 h-6 accent-white" />
                  <div className="flex-1">{todo.text}</div>
                  <div className="text-xs text-zinc-400 font-mono">
                    {todo.pomodoros}/{todo.estimatedPomodoros}
                  </div>
                  <button onClick={() => setCurrentTaskId(todo.id)} className="text-xs px-3 py-1 border rounded">Focus</button>
                  <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100">🗑</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomoTodo;
