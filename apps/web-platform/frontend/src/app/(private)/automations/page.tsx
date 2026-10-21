'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Play,
  Square,
  Plus,
  Save,
  Trash2,
  Settings2,
  Heart,
  Clock,
  Sparkles,
  Send,
  DollarSign,
  Activity,
  X,
  Workflow,
  CheckCircle2,
} from 'lucide-react';

export interface WorkflowNode {
  id: string;
  title: string;
  category: 'schedule' | 'ai' | 'wellness' | 'finance' | 'notify';
  type: string;
  x: number;
  y: number;
  status: 'idle' | 'running' | 'success' | 'error';
  config: Record<string, any>;
  icon: string;
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
}

const INITIAL_NODES: WorkflowNode[] = [
  {
    id: 'node-morning-time',
    title: 'Morning Routine Alarm',
    category: 'schedule',
    type: 'Daily Chron Trigger',
    x: 60,
    y: 120,
    status: 'idle',
    config: {
      cron: '07:00 AM Daily',
      timezone: 'Asia/Yangon',
      target: 'Both Partners',
    },
    icon: 'Clock',
  },
  {
    id: 'node-love-note-ai',
    title: 'Sweet Morning Note AI',
    category: 'ai',
    type: 'Gemini Couple Companion',
    x: 400,
    y: 50,
    status: 'idle',
    config: {
      model: 'gemini-2.5-flash',
      prompt: 'Generate an affectionate morning message in Burmese with warm emojis.',
      tone: 'Loving & Wholesome',
    },
    icon: 'Heart',
  },
  {
    id: 'node-wellness-check',
    title: 'Cycle & Hydration Care',
    category: 'wellness',
    type: 'Health Guardian',
    x: 400,
    y: 250,
    status: 'idle',
    config: {
      monitorCycle: true,
      remindWaterIntake: 'Every 2 Hours',
      reminderTone: 'Caring & Gentle',
    },
    icon: 'Sparkles',
  },
  {
    id: 'node-finance-guard',
    title: 'Shared Budget Monitor',
    category: 'finance',
    type: 'Budget Threshold Watcher',
    x: 740,
    y: 250,
    status: 'idle',
    config: {
      threshold: '$500 Monthly Limit',
      alertOnOverspend: true,
    },
    icon: 'DollarSign',
  },
  {
    id: 'node-notify-couple',
    title: 'Telegram & App Dispatcher',
    category: 'notify',
    type: 'Instant Notification Hub',
    x: 740,
    y: 50,
    status: 'idle',
    config: {
      destination: 'Telegram Bot & In-App',
      batchNotifications: true,
    },
    icon: 'Send',
  },
];

const INITIAL_CONNECTIONS: WorkflowConnection[] = [
  { id: 'c1', from: 'node-morning-time', to: 'node-love-note-ai' },
  { id: 'c2', from: 'node-morning-time', to: 'node-wellness-check' },
  { id: 'c3', from: 'node-love-note-ai', to: 'node-notify-couple' },
  { id: 'c4', from: 'node-wellness-check', to: 'node-finance-guard' },
  { id: 'c5', from: 'node-finance-guard', to: 'node-notify-couple' },
];

const AVAILABLE_MODULES = [
  {
    category: 'ai' as const,
    title: 'Date Night Planner AI',
    desc: 'Auto-suggests weekend restaurant & movie plans.',
    type: 'Gemini Itinerary Maker',
    icon: 'Sparkles',
    config: { budgetLevel: 'Mid-range', city: 'Yangon' },
  },
  {
    category: 'schedule' as const,
    title: 'Anniversary & Memory Countdown',
    desc: 'Pre-alerts 3 days before upcoming occasions.',
    type: 'Event Watcher',
    icon: 'Clock',
    config: { preAlertDays: 3 },
  },
  {
    category: 'finance' as const,
    title: 'Telegram Quick Expense Logger',
    desc: 'Logs bills and splits automatically from Telegram chat.',
    type: 'Chat Expense Parser',
    icon: 'DollarSign',
    config: { autoSplit: true },
  },
  {
    category: 'wellness' as const,
    title: 'Sleep & Mood Tracker Sync',
    desc: 'Syncs morning mood states with gentle encouragement.',
    type: 'Mood Companion',
    icon: 'Heart',
    config: { promptForMood: true },
  },
];

export default function AutomationPipelinePage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<WorkflowConnection[]>(INITIAL_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warn'; nodeTitle: string }>>([
    {
      timestamp: '08:00:00',
      nodeTitle: 'COMPLEX-AQ',
      message: 'Couple routines & automation engine active.',
      type: 'info',
    },
  ]);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingNodeRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    setSelectedNodeId(id);
    draggingNodeRef.current = {
      id,
      offsetX: e.clientX - node.x,
      offsetY: e.clientY - node.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeRef.current) return;
    const { id, offsetX, offsetY } = draggingNodeRef.current;
    const newX = Math.max(20, Math.min(1800, e.clientX - offsetX));
    const newY = Math.max(20, Math.min(900, e.clientY - offsetY));

    setNodes(prev =>
      prev.map(node => (node.id === id ? { ...node, x: newX, y: newY } : node))
    );
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
  };

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        nodeTitle: 'PIPELINE',
        message: 'Starting scheduled routine execution...',
        type: 'info',
      },
      ...prev,
    ]);

    for (const node of nodes) {
      setNodes(prev =>
        prev.map(n => (n.id === node.id ? { ...n, status: 'running' } : n))
      );

      await new Promise(r => setTimeout(r, 600));

      setNodes(prev =>
        prev.map(n => (n.id === node.id ? { ...n, status: 'success' } : n))
      );

      setLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          nodeTitle: node.title,
          message: `Routine executed successfully [${node.type}]`,
          type: 'success',
        },
        ...prev,
      ]);
    }

    setIsRunning(false);
  };

  const handleAddModule = (mod: typeof AVAILABLE_MODULES[number]) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      title: mod.title,
      category: mod.category,
      type: mod.type,
      x: 350 + Math.random() * 80,
      y: 180 + Math.random() * 80,
      status: 'idle',
      config: mod.config,
      icon: mod.icon,
    };
    setNodes(prev => [...prev, newNode]);
    setShowAddDrawer(false);
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const renderCables = () => {
    return connections.map(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return null;

      const startX = fromNode.x + 240;
      const startY = fromNode.y + 44;
      const endX = toNode.x;
      const endY = toNode.y + 44;

      const dx = Math.abs(endX - startX) * 0.5;
      const path = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

      const isPulse = fromNode.status === 'running' || toNode.status === 'running';
      const isSuccess = fromNode.status === 'success' && toNode.status === 'success';

      return (
        <g key={conn.id}>
          <path
            d={path}
            fill="none"
            stroke={isPulse ? '#ec4899' : isSuccess ? '#10b981' : 'rgba(180, 140, 210, 0.45)'}
            strokeWidth={isPulse ? '3' : '2'}
            strokeDasharray={isPulse ? '6,6' : 'none'}
            className={isPulse ? 'animate-pulse' : ''}
          />
          <circle cx={startX} cy={startY} r="4" fill="rgb(var(--accent-1))" />
          <circle cx={endX} cy={endY} r="4" fill="rgb(var(--accent-2))" />
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] bg-card/60 backdrop-blur-xl text-text-1 overflow-hidden select-none rounded-2xl border border-border/70 shadow-card">
      {/* Top Header */}
      <header className="h-16 border-b border-border/50 bg-card/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-accent-1/15 text-accent-1 border border-accent-1/25">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <div>
            <h1 className="text-base font-serif font-semibold text-text-1 tracking-wide flex items-center gap-2">
              Couple Smart Automation Pipeline
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-1/10 text-accent-1 border border-accent-1/20 font-medium">
                Visual n8n Canvas
              </span>
            </h1>
            <p className="text-xs text-text-2">Sweet Notes · Wellness Reminders · Shared Budget Alerts · Telegram Sync</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddDrawer(!showAddDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-card hover:bg-accent-1/10 text-text-1 border border-border/80 transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-accent-1" />
            Add Routine
          </button>

          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full shadow-sm transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse'
                : 'bg-accent-1 hover:opacity-90 text-[color:var(--accent-foreground)]'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="h-3.5 w-3.5 animate-spin" /> Executing Routine...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Run Routine Now
              </>
            )}
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-card hover:bg-accent-1/10 text-text-2 border border-border/80 transition shadow-sm">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </header>

      {/* Visual Canvas Area */}
      <div className="flex-1 relative overflow-hidden flex" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <div
          ref={canvasRef}
          onClick={() => setSelectedNodeId(null)}
          className="flex-1 h-full relative cursor-grab active:cursor-grabbing overflow-auto bg-background/50"
          style={{
            backgroundImage: 'radial-gradient(rgba(180, 140, 210, 0.22) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        >
          <svg className="absolute inset-0 w-[2400px] h-[1200px] pointer-events-none z-0">
            {renderCables()}
          </svg>

          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isRunningNode = node.status === 'running';
            const isSuccessNode = node.status === 'success';

            const categoryColors: Record<string, string> = {
              schedule: 'from-amber-500/15 to-orange-500/10 border-amber-500/30 text-amber-500',
              ai: 'from-rose-500/15 to-pink-500/10 border-rose-500/30 text-rose-500',
              wellness: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/30 text-emerald-500',
              finance: 'from-sky-500/15 to-blue-500/10 border-sky-500/30 text-sky-500',
              notify: 'from-purple-500/15 to-indigo-500/10 border-purple-500/30 text-purple-500',
            };

            return (
              <div
                key={node.id}
                onMouseDown={e => handleMouseDown(e, node.id)}
                style={{
                  transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                  width: '240px',
                }}
                className={`absolute z-10 rounded-2xl border p-3.5 backdrop-blur-xl bg-card/95 shadow-card transition-all select-none hover:shadow-card-hover ${
                  isSelected ? 'ring-2 ring-accent-1 border-accent-1' : 'border-border/70 hover:border-accent-1/40'
                } ${isRunningNode ? 'ring-2 ring-amber-400 animate-pulse' : ''} ${
                  isSuccessNode ? 'border-emerald-500/60 shadow-emerald-500/10' : ''
                }`}
              >
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-card border-2 border-accent-1 hover:scale-125 transition-transform" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-card border-2 border-accent-2 hover:scale-125 transition-transform" />

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br border ${categoryColors[node.category] || 'border-border'}`}>
                      {node.category === 'schedule' && <Clock className="h-4 w-4" />}
                      {node.category === 'ai' && <Heart className="h-4 w-4" />}
                      {node.category === 'wellness' && <Sparkles className="h-4 w-4" />}
                      {node.category === 'finance' && <DollarSign className="h-4 w-4" />}
                      {node.category === 'notify' && <Send className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-text-2">
                        {node.category}
                      </span>
                      <h3 className="text-xs font-semibold text-text-1 leading-tight">{node.title}</h3>
                    </div>
                  </div>

                  <span
                    className={`h-2 w-2 rounded-full ${
                      node.status === 'running'
                        ? 'bg-amber-400 animate-ping'
                        : node.status === 'success'
                        ? 'bg-emerald-400'
                        : 'bg-text-2/40'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-text-2 line-clamp-1 mb-2 font-mono">{node.type}</p>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-text-2">
                  <span className="truncate max-w-[150px]">
                    {node.config.cron || node.config.model || node.config.threshold || node.config.chatTopic || 'Active'}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="text-text-2 hover:text-error p-0.5 rounded transition-colors"
                    title="Delete Node"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Node Inspector */}
        {selectedNode && (
          <div className="w-80 border-l border-border/60 bg-card/95 backdrop-blur-2xl p-5 flex flex-col z-20 shadow-2xl overflow-y-auto text-text-1">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-accent-1" />
                <h2 className="text-sm font-serif font-semibold text-text-1">Routine Inspector</h2>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-text-2 hover:text-text-1 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-text-2 block mb-1">Title</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={e => {
                    const val = e.target.value;
                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, title: val } : n));
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-text-2 block mb-1">Type & Category</label>
                <div className="px-2.5 py-1.5 rounded-lg bg-soft-tint border border-border/60 text-text-1 font-mono text-[11px]">
                  {selectedNode.type} ({selectedNode.category})
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-text-2 block mb-1">Configuration Parameters</label>
                <pre className="p-3 rounded-lg bg-card/80 border border-border/60 text-[11px] text-accent-1 font-mono overflow-x-auto">
                  {JSON.stringify(selectedNode.config, null, 2)}
                </pre>
              </div>

              <div className="pt-4 border-t border-border/50">
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-all font-medium text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove Routine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Node Drawer */}
        {showAddDrawer && (
          <div className="absolute top-4 left-6 w-80 bg-card/95 border border-border/70 rounded-2xl shadow-2xl p-4 z-30 backdrop-blur-2xl text-text-1">
            <div className="flex items-center justify-between pb-2 border-b border-border/50 mb-3">
              <span className="text-xs font-semibold text-text-1 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-accent-1" /> Couple Routine Modules
              </span>
              <button onClick={() => setShowAddDrawer(false)} className="text-text-2 hover:text-text-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {AVAILABLE_MODULES.map((mod, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddModule(mod)}
                  className="w-full text-left p-2.5 rounded-xl bg-soft-tint hover:bg-card border border-border/50 hover:border-accent-1/30 transition-all flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-1 group-hover:text-accent-1">{mod.title}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-card text-text-2 uppercase">
                      {mod.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-2 leading-normal">{mod.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Telemetry Logs Panel */}
      <div className="h-28 border-t border-border/50 bg-card/90 backdrop-blur px-6 py-2 flex flex-col z-20">
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent-1" />
            <span className="text-xs font-mono font-medium text-text-1">ROUTINE EXECUTION & TELEGRAM LOGS</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-2 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {isRunning ? 'ROUTINE RUNNING' : 'SYSTEM STANDBY'}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pt-1">
          {logs.map((log, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <span className="text-text-2/60">{log.timestamp}</span>
              <span className="text-accent-1 font-semibold">[{log.nodeTitle}]</span>
              <span className={log.type === 'success' ? 'text-emerald-500 font-medium' : log.type === 'warn' ? 'text-amber-500' : 'text-text-2'}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
