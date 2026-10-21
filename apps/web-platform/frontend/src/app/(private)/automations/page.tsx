'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Play,
  Square,
  Plus,
  Save,
  RotateCcw,
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
  SlidersHorizontal,
  LayoutGrid,
  Power,
  ChevronRight,
  Info,
  Layers,
  Trash2,
} from 'lucide-react';

export interface WorkflowNode {
  id: string;
  title: string;
  category: 'schedule' | 'ai' | 'wellness' | 'finance' | 'notify';
  type: string;
  enabled: boolean;
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

const DEFAULT_PIPELINE_NODES: WorkflowNode[] = [
  {
    id: 'node-morning-time',
    title: 'Morning Routine Alarm',
    category: 'schedule',
    type: 'Daily Chron Trigger',
    enabled: true,
    x: 60,
    y: 150,
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
    enabled: true,
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
    enabled: true,
    x: 400,
    y: 260,
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
    enabled: true,
    x: 740,
    y: 260,
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
    enabled: true,
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

const DEFAULT_CONNECTIONS: WorkflowConnection[] = [
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
    title: 'Anniversary Countdown Alert',
    desc: 'Pre-alerts 3 days before upcoming occasions.',
    type: 'Event Watcher',
    icon: 'Clock',
    config: { preAlertDays: 3 },
  },
  {
    category: 'wellness' as const,
    title: 'Bedtime Gratitude Prompt',
    desc: 'Prompts each partner to share one sweet appreciation.',
    type: 'Gentle Reflection',
    icon: 'Heart',
    config: { time: '10:30 PM' },
  },
];

export default function AutomationPipelinePage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(DEFAULT_PIPELINE_NODES);
  const [connections, setConnections] = useState<WorkflowConnection[]>(DEFAULT_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warn'; nodeTitle: string }>>([
    {
      timestamp: '08:00:00',
      nodeTitle: 'COMPLEX-AQ',
      message: 'Couple routines & automation engine active with 5 pre-wired workflows.',
      type: 'info',
    },
  ]);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingNodeRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const activeCount = useMemo(() => nodes.filter(n => n.enabled).length, [nodes]);

  const handleToggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodes(prev =>
      prev.map(node => {
        if (node.id === id) {
          const nextState = !node.enabled;
          setLogs(logList => [
            {
              timestamp: new Date().toLocaleTimeString(),
              nodeTitle: node.title,
              message: nextState ? 'Routine enabled and linked to pipeline.' : 'Routine paused.',
              type: nextState ? 'success' : 'warn',
            },
            ...logList,
          ]);
          return { ...node, enabled: nextState };
        }
        return node;
      })
    );
  };

  const handleToggleAll = (enable: boolean) => {
    setNodes(prev => prev.map(n => ({ ...n, enabled: enable })));
    setLogs(logList => [
      {
        timestamp: new Date().toLocaleTimeString(),
        nodeTitle: 'PIPELINE',
        message: enable ? 'All 5 couple routines enabled.' : 'All couple routines paused.',
        type: enable ? 'success' : 'warn',
      },
      ...logList,
    ]);
  };

  const handleResetLayout = () => {
    setNodes(DEFAULT_PIPELINE_NODES);
    setConnections(DEFAULT_CONNECTIONS);
    setSelectedNodeId(null);
    setLogs(logList => [
      {
        timestamp: new Date().toLocaleTimeString(),
        nodeTitle: 'CANVAS',
        message: 'Workflow pipeline layout reset to optimal 5-routine topology.',
        type: 'info',
      },
      ...logList,
    ]);
  };

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
        message: 'Starting scheduled routine execution for active nodes...',
        type: 'info',
      },
      ...prev,
    ]);

    for (const node of nodes) {
      if (!node.enabled) {
        setLogs(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            nodeTitle: node.title,
            message: `[Skipped] Routine is paused by couple setting.`,
            type: 'warn',
          },
          ...prev,
        ]);
        continue;
      }

      setNodes(prev =>
        prev.map(n => (n.id === node.id ? { ...n, status: 'running' } : n))
      );

      await new Promise(r => setTimeout(r, 650));

      setNodes(prev =>
        prev.map(n => (n.id === node.id ? { ...n, status: 'success' } : n))
      );

      let executionDetail = `Executed: ${node.type}`;
      if (node.id === 'node-morning-time') {
        executionDetail = 'Chime triggered for 07:00 AM (Asia/Yangon)';
      } else if (node.id === 'node-love-note-ai') {
        executionDetail = 'AI generated: "မင်္ဂလာနံနက်ခင်းပါ ချစ်ရသူရေ... မနက်စာကောင်းကောင်းစားပြီး ရေများများသောက်နော် 💖"';
      } else if (node.id === 'node-wellness-check') {
        executionDetail = 'Health check: Hydration prompt & cycle comfort note logged.';
      } else if (node.id === 'node-finance-guard') {
        executionDetail = 'Budget monitor: Shared monthly spend ($140 / $500) is safe.';
      } else if (node.id === 'node-notify-couple') {
        executionDetail = 'Dispatcher: Sent to Telegram couple bot & in-app alerts!';
      }

      setLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          nodeTitle: node.title,
          message: executionDetail,
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
      enabled: true,
      x: 390,
      y: 150,
      status: 'idle',
      config: mod.config,
      icon: mod.icon,
    };
    // Automatically wire the new node into the pipeline
    const newConnection: WorkflowConnection = {
      id: `c-${Date.now()}`,
      from: 'node-morning-time',
      to: newNode.id,
    };
    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, newConnection]);
    setShowAddDrawer(false);
    setSelectedNodeId(newNode.id);
    setLogs(logList => [
      {
        timestamp: new Date().toLocaleTimeString(),
        nodeTitle: mod.title,
        message: 'New routine added and automatically wired to Morning Alarm!',
        type: 'success',
      },
      ...logList,
    ]);
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
      const startY = fromNode.y + 46;
      const endX = toNode.x;
      const endY = toNode.y + 46;

      const dx = Math.abs(endX - startX) * 0.5;
      const path = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

      const isBothActive = fromNode.enabled && toNode.enabled;
      const isPulse = isBothActive && (fromNode.status === 'running' || toNode.status === 'running');
      const isSuccess = isBothActive && (fromNode.status === 'success' && toNode.status === 'success');

      return (
        <g key={conn.id}>
          <path
            d={path}
            fill="none"
            stroke={
              isPulse
                ? '#ec4899'
                : isSuccess
                ? '#10b981'
                : isBothActive
                ? 'rgb(var(--accent-1) / 0.55)'
                : 'rgba(170, 160, 190, 0.25)'
            }
            strokeWidth={isPulse ? '3' : isBothActive ? '2.5' : '1.5'}
            strokeDasharray={isPulse ? '6,6' : isBothActive ? 'none' : '4,4'}
            className={isPulse ? 'animate-pulse' : ''}
          />
          <circle
            cx={startX}
            cy={startY}
            r="4.5"
            fill={isBothActive ? 'rgb(var(--accent-1))' : 'rgba(170, 160, 190, 0.4)'}
          />
          <circle
            cx={endX}
            cy={endY}
            r="4.5"
            fill={isBothActive ? 'rgb(var(--accent-2))' : 'rgba(170, 160, 190, 0.4)'}
          />
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] bg-card text-text-1 overflow-hidden select-none rounded-3xl border border-border/70 shadow-sm">
      {/* Top Header */}
      <header className="h-16 border-b border-border/50 bg-card px-4 sm:px-6 flex items-center justify-between z-20 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-2 rounded-2xl bg-accent-1/10 text-accent-1 border border-accent-1/20 shrink-0">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-serif font-semibold text-text-1 tracking-wide flex items-center gap-2 truncate">
              Couple Smart Automation Pipeline
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-1/10 text-accent-1 border border-accent-1/20 font-medium">
                {activeCount} of {nodes.length} Active
              </span>
            </h1>
            <p className="text-xs text-text-2 truncate hidden sm:block">
              Morning Alarm → Sweet Note AI → Cycle & Hydration → Budget → Telegram Dispatcher
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-full border border-border/80 bg-soft-tint">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`p-1.5 rounded-full text-xs transition ${
                viewMode === 'canvas'
                  ? 'bg-card text-accent-1 shadow-xs'
                  : 'text-text-2 hover:text-text-1'
              }`}
              title="Visual Workflow Canvas"
            >
              <Workflow className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full text-xs transition ${
                viewMode === 'list'
                  ? 'bg-card text-accent-1 shadow-xs'
                  : 'text-text-2 hover:text-text-1'
              }`}
              title="Routines List View"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetLayout}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-card hover:bg-soft-tint text-text-2 border border-border/80 transition shadow-xs"
            title="Reset Pipeline Positions"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Layout
          </button>

          <button
            type="button"
            onClick={() => setShowAddDrawer(!showAddDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-card hover:bg-soft-tint text-text-1 border border-border/80 transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-accent-1" />
            <span className="hidden sm:inline">Add Routine</span>
          </button>

          <button
            type="button"
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full shadow-sm transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30 animate-pulse'
                : 'bg-accent-1 hover:opacity-90 text-white font-medium shadow-sm'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="h-3.5 w-3.5 animate-spin" /> Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Run Pipeline Now
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === 'canvas' ? (
        <div className="flex-1 relative overflow-hidden flex" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
          <div
            ref={canvasRef}
            onClick={() => setSelectedNodeId(null)}
            className="flex-1 h-full relative cursor-grab active:cursor-grabbing overflow-auto bg-[#faf7fd]"
            style={{
              backgroundImage: 'radial-gradient(rgba(140, 100, 180, 0.16) 1.5px, transparent 1.5px)',
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
                schedule: 'bg-amber-500/10 border-amber-300/40 text-amber-600',
                ai: 'bg-rose-500/10 border-rose-300/40 text-rose-600',
                wellness: 'bg-emerald-500/10 border-emerald-300/40 text-emerald-600',
                finance: 'bg-sky-500/10 border-sky-300/40 text-sky-600',
                notify: 'bg-purple-500/10 border-purple-300/40 text-purple-600',
              };

              return (
                <div
                  key={node.id}
                  onMouseDown={e => handleMouseDown(e, node.id)}
                  style={{
                    transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                    width: '240px',
                  }}
                  className={`absolute z-10 rounded-2xl border p-3.5 bg-card shadow-sm transition-all select-none hover:shadow-md ${
                    !node.enabled
                      ? 'opacity-65 border-border/50 bg-card/70'
                      : isSelected
                      ? 'ring-2 ring-accent-1 border-accent-1 shadow-md'
                      : 'border-border/70 hover:border-accent-1/40'
                  } ${isRunningNode ? 'ring-2 ring-amber-400 animate-pulse' : ''} ${
                    isSuccessNode ? 'border-emerald-500/60 shadow-emerald-500/10' : ''
                  }`}
                >
                  {/* Left Connection Handle */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-card border-2 border-accent-1 shadow-xs" />
                  {/* Right Connection Handle */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-card border-2 border-accent-2 shadow-xs" />

                  {/* Top Row: Icon + Category + Enable Toggle Switch */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl border ${categoryColors[node.category] || 'border-border'}`}>
                        {node.category === 'schedule' && <Clock className="h-3.5 w-3.5" />}
                        {node.category === 'ai' && <Heart className="h-3.5 w-3.5 fill-current" />}
                        {node.category === 'wellness' && <Sparkles className="h-3.5 w-3.5" />}
                        {node.category === 'finance' && <DollarSign className="h-3.5 w-3.5" />}
                        {node.category === 'notify' && <Send className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-2">
                          {node.category}
                        </span>
                      </div>
                    </div>

                    {/* Enable / Disable Toggle Switch */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={e => handleToggleNode(node.id, e)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          node.enabled ? 'bg-accent-1' : 'bg-border/90'
                        }`}
                        title={node.enabled ? 'Pause Routine' : 'Enable Routine'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            node.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title & Type */}
                  <h3 className="text-xs font-semibold text-text-1 leading-tight">{node.title}</h3>
                  <p className="text-[10px] text-text-2 line-clamp-1 mb-2 font-mono">{node.type}</p>

                  {/* Bottom Info & Setting link */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-text-2">
                    <span className="truncate max-w-[140px] font-medium">
                      {node.enabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {node.config.cron || node.config.model || node.config.threshold || 'Active'}
                        </span>
                      ) : (
                        <span className="text-text-2/70 italic">Paused</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      className="text-text-2 hover:text-accent-1 p-0.5 rounded transition"
                      title="Configure Routine Settings"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Configuration Drawer */}
          {selectedNode && (
            <div className="w-80 border-l border-border/60 bg-card p-5 flex flex-col z-20 shadow-xl overflow-y-auto text-text-1">
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
                <div>
                  <span className="text-[10px] font-mono text-accent-1 uppercase font-semibold">
                    Routine Inspector
                  </span>
                  <h3 className="text-sm font-semibold text-text-1">{selectedNode.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-full text-text-2 hover:bg-soft-tint hover:text-text-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status & Enable Switch */}
              <div className="p-3 rounded-2xl border border-border/60 bg-soft-tint mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-1">Routine Status</p>
                  <p className="text-[10px] text-text-2">
                    {selectedNode.enabled ? 'Enabled in automated pipeline' : 'Paused — will skip on execution'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNode(selectedNode.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    selectedNode.enabled ? 'bg-accent-1' : 'bg-border/90'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      selectedNode.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Node Config Fields */}
              <div className="space-y-3 flex-1 text-xs">
                <div>
                  <label className="text-text-2 font-medium block mb-1">Routine Title</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={e => {
                      const val = e.target.value;
                      setNodes(prev =>
                        prev.map(n => (n.id === selectedNode.id ? { ...n, title: val } : n))
                      );
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                  />
                </div>

                <div>
                  <label className="text-text-2 font-medium block mb-1">Module Type</label>
                  <div className="px-3 py-2 rounded-xl bg-soft-tint border border-border/60 text-text-1 font-mono text-[11px]">
                    {selectedNode.type}
                  </div>
                </div>

                {selectedNode.category === 'schedule' && (
                  <div>
                    <label className="text-text-2 font-medium block mb-1">Alarm / Schedule Time</label>
                    <input
                      type="text"
                      value={selectedNode.config.cron || '07:00 AM Daily'}
                      onChange={e => {
                        const val = e.target.value;
                        setNodes(prev =>
                          prev.map(n =>
                            n.id === selectedNode.id
                              ? { ...n, config: { ...n.config, cron: val } }
                              : n
                          )
                        );
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                    />
                  </div>
                )}

                {selectedNode.category === 'ai' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-text-2 font-medium block mb-1">AI Model</label>
                      <select
                        value={selectedNode.config.model || 'gemini-2.5-flash'}
                        onChange={e => {
                          const val = e.target.value;
                          setNodes(prev =>
                            prev.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, model: val } }
                                : n
                            )
                          );
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Free)</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-text-2 font-medium block mb-1">Prompt Instruction</label>
                      <textarea
                        rows={3}
                        value={selectedNode.config.prompt || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setNodes(prev =>
                            prev.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, prompt: val } }
                                : n
                            )
                          );
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.category === 'wellness' && (
                  <div>
                    <label className="text-text-2 font-medium block mb-1">Water Reminder Frequency</label>
                    <select
                      value={selectedNode.config.remindWaterIntake || 'Every 2 Hours'}
                      onChange={e => {
                        const val = e.target.value;
                        setNodes(prev =>
                          prev.map(n =>
                            n.id === selectedNode.id
                              ? { ...n, config: { ...n.config, remindWaterIntake: val } }
                              : n
                          )
                        );
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                    >
                      <option value="Every 1 Hour">Every 1 Hour</option>
                      <option value="Every 2 Hours">Every 2 Hours</option>
                      <option value="Every 3 Hours">Every 3 Hours</option>
                    </select>
                  </div>
                )}

                {selectedNode.category === 'finance' && (
                  <div>
                    <label className="text-text-2 font-medium block mb-1">Monthly Budget Limit</label>
                    <input
                      type="text"
                      value={selectedNode.config.threshold || '$500 Monthly Limit'}
                      onChange={e => {
                        const val = e.target.value;
                        setNodes(prev =>
                          prev.map(n =>
                            n.id === selectedNode.id
                              ? { ...n, config: { ...n.config, threshold: val } }
                              : n
                          )
                        );
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                    />
                  </div>
                )}

                {selectedNode.category === 'notify' && (
                  <div>
                    <label className="text-text-2 font-medium block mb-1">Telegram Dispatch Target</label>
                    <input
                      type="text"
                      value={selectedNode.config.destination || 'Telegram Bot & In-App'}
                      onChange={e => {
                        const val = e.target.value;
                        setNodes(prev =>
                          prev.map(n =>
                            n.id === selectedNode.id
                              ? { ...n, config: { ...n.config, destination: val } }
                              : n
                          )
                        );
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-all font-semibold text-xs"
                >
                  <Trash2 className="h-4 w-4" /> Delete from Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Routines List Mode (Clean cards with instant toggle switches) */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#faf7fd]">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="font-serif text-lg font-semibold text-text-1">All 5 Pre-Wired Routines</h2>
              <p className="text-xs text-text-2">Toggle any routine on or off. Active routines run in harmony.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleAll(true)}
                className="rounded-full px-3 py-1 text-xs font-semibold text-accent-1 bg-accent-1/10 border border-accent-1/20 hover:bg-accent-1/20 transition"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => handleToggleAll(false)}
                className="rounded-full px-3 py-1 text-xs font-medium text-text-2 bg-card border border-border hover:bg-soft-tint transition"
              >
                Disable All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map(node => (
              <div
                key={node.id}
                className={`rounded-2xl border p-4 bg-card shadow-xs transition-all ${
                  node.enabled
                    ? 'border-border/80 hover:border-accent-1/40 hover:shadow-sm'
                    : 'opacity-65 border-border/50 bg-card/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent-1 block mb-0.5 font-semibold">
                      {node.category}
                    </span>
                    <h3 className="text-sm font-semibold text-text-1 truncate">{node.title}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleNode(node.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      node.enabled ? 'bg-accent-1' : 'bg-border/90'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        node.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-text-2 mb-3 font-mono">{node.type}</p>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-text-2">
                  <span className="truncate max-w-[170px] text-[11px] font-medium">
                    {node.enabled ? (
                      <span className="text-emerald-600 inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {node.config.cron || node.config.model || node.config.threshold || 'Active'}
                      </span>
                    ) : (
                      <span className="italic text-text-2/70">Paused</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('canvas');
                      setSelectedNodeId(node.id);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-1 hover:underline"
                  >
                    Configure <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Module Modal / Drawer */}
      {showAddDrawer && (
        <div className="absolute top-4 left-6 w-80 bg-card border border-border/80 rounded-3xl shadow-2xl p-4 z-30 text-text-1">
          <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
            <div>
              <h4 className="text-sm font-serif font-semibold text-text-1">Add Routine Module</h4>
              <p className="text-[10px] text-text-2">Pre-configured couple automation routines</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDrawer(false)}
              className="p-1 rounded-full text-text-2 hover:bg-soft-tint hover:text-text-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {AVAILABLE_MODULES.map(mod => (
              <button
                key={mod.title}
                type="button"
                onClick={() => handleAddModule(mod)}
                className="w-full text-left p-3 rounded-2xl bg-soft-tint hover:bg-card border border-border/60 hover:border-accent-1/30 transition-all flex flex-col gap-1 group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-1 group-hover:text-accent-1 transition">
                    {mod.title}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-card text-text-2 uppercase">
                    {mod.category}
                  </span>
                </div>
                <p className="text-[11px] text-text-2 leading-relaxed">{mod.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Live Telemetry Logs Console */}
      <div className="h-28 border-t border-border/50 bg-card px-4 sm:px-6 py-2 flex flex-col z-20">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent-1" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-2 font-semibold">
              Live Pipeline Telemetry & Telegram Feed
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-text-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isRunning ? 'PIPELINE ACTIVE' : 'SYSTEM STANDBY'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px]">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 text-text-2">
              <span className="opacity-50 shrink-0">{log.timestamp}</span>
              <span
                className={`px-1.5 py-0.2 rounded font-semibold text-[10px] shrink-0 ${
                  log.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : log.type === 'warn'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-accent-1/10 text-accent-1'
                }`}
              >
                [{log.nodeTitle}]
              </span>
              <span className="text-text-1 truncate">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
