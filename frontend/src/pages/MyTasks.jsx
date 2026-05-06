import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getMyTasks } from '../api/client';

const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };

function getDueClass(due) {
  if (!due) return '';
  const d = new Date(due);
  const now = new Date();
  if (d < now) return 'due-overdue';
  if (d - now < 86400000 * 2) return 'due-soon';
  return 'due-ok';
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getMyTasks().then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return <div className="loader-full"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">My Tasks</div>
          <div className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</div>
        </div>
      </div>

      <div className="task-filters">
        {['all', 'todo', 'in_progress', 'review', 'done'].map(s => (
          <button key={s} className={`filter-pill${filter===s?' active':''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? `All (${tasks.length})` : `${STATUS_LABELS[s]} (${tasks.filter(t=>t.status===s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={48} />
          <h3>{filter === 'all' ? 'No tasks assigned to you' : `No ${STATUS_LABELS[filter]} tasks`}</h3>
          <p>Tasks assigned to you across all projects appear here</p>
        </div>
      ) : (
        <div className="card" style={{ padding:0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {filtered.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && <div className="text-xs text-muted" style={{ marginTop:2 }}>{task.description.slice(0,80)}{task.description.length>80?'...':''}</div>}
                        {task.tags && (
                          <div className="flex gap-1 mt-1">
                            {task.tags.split(',').slice(0,3).map(t => <span key={t} className="tag">{t.trim()}</span>)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Link to={`/projects/${task.project_id}`} style={{ color:'var(--blue)', textDecoration:'none', fontSize:13 }}>
                        View Project →
                      </Link>
                    </td>
                    <td><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td>
                      {task.due_date ? (
                        <span className={`text-xs ${getDueClass(task.due_date)}`}>
                          {formatDistanceToNow(new Date(task.due_date), { addSuffix:true })}
                        </span>
                      ) : <span className="text-dim text-xs">No due date</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
