import React, { useContext, useEffect, useMemo, useState } from "react";
import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";
import Filters from "../../components/shared/Filters.jsx";
import { SellerContext } from "../../context/SellerContext.jsx";
import { categoryOptionsConfig } from "../../utils/utils.js";
import { useAuth } from "../../context/AuthContext";
import {
  WalletCards,
  RotateCcw,
  ListChecks,
  BarChart3,
  CirclePlus,
  Check,
  Trash2,
} from "lucide-react";

const EMPTY_CHART_DATA = [];

const getTaskStorageKey = (email = "") => {
  const normalizedEmail = email.toLowerCase().trim();
  return `seller_quick_tasks_${normalizedEmail || "default"}`;
};

const parseStoredTasks = (rawValue) => {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((task) => ({
        id: String(task?.id || `${Date.now()}-${Math.random()}`),
        text: String(task?.text || "").trim(),
        completed: Boolean(task?.completed),
        createdAt: task?.createdAt || new Date().toISOString(),
      }))
      .filter((task) => task.text.length > 0);
  } catch {
    return [];
  }
};

const SellerDashboard = () => {
  const { currentSeller } = useAuth();
  const { chartData } = useContext(SellerContext);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loadedTaskKey, setLoadedTaskKey] = useState("");

  const monthlySalesState = chartData["monthly-sales"] || {};
  const salesVsRefundState = chartData["sales-vs-refund"] || {};
  const statusCountState = chartData["status-count"] || {};

  const monthlySales = useMemo(
    () =>
      Array.isArray(monthlySalesState.data)
        ? monthlySalesState.data
        : EMPTY_CHART_DATA,
    [monthlySalesState.data],
  );
  const salesVsRefund = useMemo(
    () =>
      Array.isArray(salesVsRefundState.data)
        ? salesVsRefundState.data
        : EMPTY_CHART_DATA,
    [salesVsRefundState.data],
  );
  const statusCount = useMemo(
    () =>
      Array.isArray(statusCountState.data)
        ? statusCountState.data
        : EMPTY_CHART_DATA,
    [statusCountState.data],
  );
  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const monthlySalesTotal = useMemo(
    () =>
      monthlySales.reduce((sum, row) => sum + toNumber(row?.total || row?.value), 0),
    [monthlySales],
  );

  const totalStatusCount = useMemo(
    () => statusCount.reduce((sum, row) => sum + toNumber(row?.value), 0),
    [statusCount],
  );

  const refundTotal = useMemo(
    () =>
      salesVsRefund.reduce((sum, row) => {
        const name = (row?.name || "").toString().toLowerCase();
        return name.includes("refund") ? sum + toNumber(row?.value) : sum;
      }, 0),
    [salesVsRefund],
  );

  const salesTotal = useMemo(
    () =>
      salesVsRefund.reduce((sum, row) => {
        const name = (row?.name || "").toString().toLowerCase();
        return name.includes("sale") ? sum + toNumber(row?.value) : sum;
      }, 0),
    [salesVsRefund],
  );

  const sellerEmail = useMemo(() => {
    const authEmail = currentSeller?.email?.toLowerCase?.().trim();
    if (authEmail) return authEmail;

    try {
      const storedSeller = JSON.parse(localStorage.getItem("currentSeller") || "{}");
      return storedSeller?.email?.toLowerCase?.().trim() || "";
    } catch {
      return "";
    }
  }, [currentSeller]);

  const taskStorageKey = useMemo(
    () => getTaskStorageKey(sellerEmail),
    [sellerEmail],
  );

  useEffect(() => {
    const savedTasks = parseStoredTasks(localStorage.getItem(taskStorageKey));
    setTasks(savedTasks);
    setLoadedTaskKey(taskStorageKey);
  }, [taskStorageKey]);

  useEffect(() => {
    if (loadedTaskKey !== taskStorageKey) return;
    localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
  }, [tasks, taskStorageKey, loadedTaskKey]);

  const handleAddTask = () => {
    const text = taskInput.trim();
    if (!text) return;

    const newTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setTaskInput("");
  };

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const clearCompletedTasks = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  const completedTaskCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );

  const kpiCards = [
    {
      title: "Total Sales",
      value: salesTotal || monthlySalesTotal,
      icon: WalletCards,
      accent: "from-cyan-500 to-blue-500",
      note: "Current filtered view",
    },
    {
      title: "Total Refund",
      value: refundTotal,
      icon: RotateCcw,
      accent: "from-rose-500 to-red-500",
      note: "Current filtered view",
    },
    {
      title: "Status Types",
      value: statusCount.length,
      icon: ListChecks,
      accent: "from-violet-500 to-indigo-500",
      note: "Distinct statuses",
    },
    {
      title: "Status Volume",
      value: totalStatusCount,
      icon: BarChart3,
      accent: "from-emerald-500 to-teal-500",
      note: "Total records in statuses",
    },
  ];

  const formatMetric = (value) => new Intl.NumberFormat("en-IN").format(value);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Seller Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Insight board for sales and performance
          </p>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <Filters
            context={SellerContext}
            showSearch={false}
            showAdvancedToggle={true}
            categoryOptionsConfig={categoryOptionsConfig}
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => {
              const IconComponent = card.icon;

              return (
                <article
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div
                    className={`mb-4 h-1.5 w-full rounded-full bg-gradient-to-r ${card.accent} opacity-90`}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {card.title}
                      </p>
                      <p className="mt-1 text-3xl font-black text-slate-900">
                        {formatMetric(card.value)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{card.note}</p>
                    </div>
                    <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      <IconComponent className="h-5 w-5" />
                    </span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MonthlySalesChart
                data={monthlySales}
                loading={Boolean(monthlySalesState.loading)}
              />
            </div>
            <div className="xl:col-span-1">
              <SalesVsRefundChart
                data={salesVsRefund}
                loading={Boolean(salesVsRefundState.loading)}
              />
            </div>
            <div className="xl:col-span-2">
              <StatusChart
                data={statusCount}
                loading={Boolean(statusCountState.loading)}
              />
            </div>
            <aside className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-700 to-cyan-600 p-5 text-white shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Quick Tasks</h3>
                  <p className="text-sm text-cyan-100/90">
                    Add your personal daily follow-ups and reminders
                  </p>
                </div>
                <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                  {completedTaskCount}/{tasks.length} done
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  maxLength={140}
                  placeholder="Write a task and press Enter"
                  className="h-10 w-full rounded-lg border border-white/30 bg-white/15 px-3 text-sm text-white placeholder:text-cyan-100/80 outline-none transition focus:border-cyan-200/90 focus:bg-white/25"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white transition hover:bg-white/30"
                  aria-label="Add task"
                >
                  <CirclePlus className="h-5 w-5" />
                </button>
              </div>

              <div className="records-scrollbar mt-4 max-h-[220px] space-y-2 overflow-auto pr-1">
                {tasks.length === 0 && (
                  <div
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-cyan-100 backdrop-blur-sm"
                  >
                    No tasks yet. Add your first task above.
                  </div>
                )}

                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        task.completed
                          ? "border-emerald-200 bg-emerald-500 text-white"
                          : "border-white/60 bg-transparent text-transparent"
                      }`}
                      aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      <Check className="h-3 w-3" />
                    </button>

                    <p
                      className={`flex-1 break-words ${
                        task.completed
                          ? "text-orange-100/70 line-through"
                          : "text-white"
                      }`}
                    >
                      {task.text}
                    </p>

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-cyan-100 transition hover:bg-white/20 hover:text-white"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {completedTaskCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={clearCompletedTasks}
                    className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50 transition hover:bg-white/20"
                  >
                    Clear Completed
                  </button>
                </div>
              )}
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
