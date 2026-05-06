import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckCircle, AlertCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { getDashboardStats, getRecentTasks } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>;
}

function getDueClass(due) {
  if (!due) return '';
  const d = new Date(due);
  const now = new Date();
  if (d < now) return 'due-overdue';
  if (d - now < 86400000 * 2) return 'due-soon';
  return 'due-ok';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getRecentTasks()])
      .then(([s, r]) => {
        setStats(s.data);
        setRecent(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  if (loading) return <div className="loader-full"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">Here's what's happening across your projects</div>
        </div>
        <div className="avatar" style={{ background: user?.avatar_color, width:42, height:42, fontSize:16 }}>{initials}</div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon"><FolderKanban size={20} /></div>
            <div className="stat-number" style={{ color: 'var(--blue)' }}>{stats.total_projects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card teal">
            <div className="stat-icon"><Users size={20} /></div>
            <div className="stat-number" style={{ color: 'var(--teal)' }}>{stats.active_projects}</div>
            <div className="stat-label">Active Projects</div>
          </div>
          <div className="stat-card mauve">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-number" style={{ color: 'var(--mauve)' }}>{stats.my_tasks}</div>
            <div className="stat-label">Assigned to Me</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-icon"><TrendingUp size={20} /></div>
            <div className="stat-number" style={{ color: 'var(--yellow)' }}>{stats.in_progress_tasks}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon"><CheckCircle size={20} /></div>
            <div className="stat-number" style={{ color: 'var(--green)' }}>{stats.completed_tasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon"><AlertCircle size={20} /></div>
            <div className="stat-number" style={{ color: 'var(--red)' }}>{stats.overdue_tasks}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      )}

      {stats && (
        <div className="card mb-4" style={{ marginBottom: 20 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Overall Completion Rate</span>
            <span style={{ fontSize:15, fontWeight:700, color:'var(--green)', fontFamily:'JetBrains Mono' }}>{stats.completion_rate}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.completion_rate}%`, background:'var(--green)' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-dim">{stats.completed_tasks} completed</span>
            <span className="text-xs text-dim">{stats.total_tasks} total</span>
          </div>
        </div>
      )}

      <div>
        <div className="section-title">Recent Activity</div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={40} />
            <h3>No tasks yet</h3>
            <p>Create a project and add tasks to get started</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(task => (
                    <tr key={task.id}>
                      <td>
                        <Link to={`/projects/${task.project_id}`} style={{ color:'var(--text)', textDecoration:'none', fontWeight:500 }}>
                          {task.title}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/projects/${task.project_id}`} style={{ color:'var(--blue)', textDecoration:'none', fontSize:12 }}>
                          {task.project_name}
                        </Link>
                      </td>
                      <td><StatusBadge status={task.status} /></td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td>
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="avatar avatar-sm" style={{ background: task.assignee.avatar_color }}>
                              {task.assignee.name[0].toUpperCase()}
                            </div>
                            <span className="text-sm">{task.assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : <span className="text-dim text-xs">Unassigned</span>}
                      </td>
                      <td>
                        {task.due_date ? (
                          <span className={`text-xs ${getDueClass(task.due_date)}`}>
                            {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                          </span>
                        ) : <span className="text-dim text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
