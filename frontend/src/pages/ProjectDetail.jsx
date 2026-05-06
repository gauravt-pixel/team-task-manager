import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Pencil, Trash2, UserPlus, Crown, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import {
  getProject, updateProject, deleteProject,
  getTasks, createTask, updateTask, deleteTask,
  addMember, removeMember, updateMemberRole
} from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo','in_progress','review','done'];
const PRIORITIES = ['low','medium','high','critical'];
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };
const STATUS_COLORS = { todo:'var(--text-muted)', in_progress:'var(--blue)', review:'var(--yellow)', done:'var(--green)' };

function TaskModal({ task, projectId, members, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState(isEdit ? {
    title: task.title, description: task.description||'',
    status: task.status, priority: task.priority,
    assignee_id: task.assignee_id||'', due_date: task.due_date ? format(new Date(task.due_date),'yyyy-MM-dd') : '',
    tags: task.tags||''
  } : { title:'', description:'', status:'todo', priority:'medium', assignee_id:'', due_date:'', tags:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.assignee_id) delete payload.assignee_id;
      if (!payload.due_date) delete payload.due_date;
      if (!payload.tags) delete payload.tags;
      if (payload.assignee_id) payload.assignee_id = parseInt(payload.assignee_id);
      let res;
      if (isEdit) res = await updateTask(projectId, task.id, payload);
      else res = await createTask(projectId, payload);
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onSaved(res.data, isEdit);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</span>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title}
              onChange={e => setForm({...form, title:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Task details..." value={form.description}
              onChange={e => setForm({...form, description:e.target.value})} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assignee_id} onChange={e => setForm({...form, assignee_id:e.target.value})}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.user.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.due_date}
                onChange={e => setForm({...form, due_date:e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" placeholder="frontend, bug, urgent" value={form.tags}
              onChange={e => setForm({...form, tags:e.target.value})} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ email:'', role:'member' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addMember(projectId, form);
      toast.success('Member added!');
      onAdded(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add Member</span>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="member@example.com" value={form.email}
              onChange={e => setForm({...form, email:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    Promise.all([getProject(id), getTasks(id)])
      .then(([p, t]) => { setProject(p.data); setTasks(t.data); })
      .catch(() => { toast.error('Project not found'); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [id]);

  const myMembership = project?.members?.find(m => m.user_id === user?.id);
  const isAdmin = myMembership?.role === 'admin';

  const filteredTasks = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch { toast.error('Failed to delete project'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await updateTask(id, task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? res.data : t));
    } catch { toast.error('Failed to update status'); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await removeMember(id, memberId);
      setProject({ ...project, members: project.members.filter(m => m.id !== memberId) });
      toast.success('Member removed');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to remove member'); }
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      const res = await updateMemberRole(id, member.id, { role: newRole });
      setProject({ ...project, members: project.members.map(m => m.id === member.id ? res.data : m) });
      toast.success('Role updated');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to update role'); }
  };

  if (loading) return <div className="loader-full"><div className="spinner" /></div>;
  if (!project) return null;

  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div style={{ width:12, height:12, borderRadius:'50%', background:project.color }} />
          <div>
            <div className="page-title">{project.name}</div>
            {project.description && <div className="page-subtitle">{project.description}</div>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="card mb-4" style={{ marginBottom:20 }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">Progress</span>
          <span style={{ color:project.color, fontWeight:700, fontFamily:'JetBrains Mono' }}>{completionRate}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${completionRate}%`, background:project.color }} />
        </div>
        <div className="flex gap-4 mt-2">
          {STATUSES.map(s => (
            <span key={s} className="text-xs text-dim">
              <span className={`badge badge-${s}`} style={{ marginRight:4 }}>{STATUS_LABELS[s]}</span>
              {tasks.filter(t => t.status === s).length}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${tab==='tasks'?' active':''}`} onClick={() => setTab('tasks')}>Tasks ({tasks.length})</button>
        <button className={`tab${tab==='members'?' active':''}`} onClick={() => setTab('members')}>Members ({project.members.length})</button>
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="task-filters">
              {['all',...STATUSES].map(s => (
                <button key={s} className={`filter-pill${statusFilter===s?' active':''}`} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className={`btn btn-ghost btn-sm${view==='list'?' active':''}`} onClick={() => setView('list')}>List</button>
              <button className={`btn btn-ghost btn-sm${view==='kanban'?' active':''}`} onClick={() => setView('kanban')}>Board</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
                <Plus size={14} /> Add Task
              </button>
            </div>
          </div>

          {view === 'list' ? (
            filteredTasks.length === 0 ? (
              <div className="empty-state">
                <Plus size={40} />
                <h3>No tasks {statusFilter !== 'all' ? `with status "${STATUS_LABELS[statusFilter]}"` : 'yet'}</h3>
                <p>Click "Add Task" to create one</p>
              </div>
            ) : (
              filteredTasks.map(task => <TaskRow key={task.id} task={task}
                onEdit={() => { setEditTask(task); setShowTaskModal(true); }}
                onDelete={() => handleDeleteTask(task.id)}
                onStatusChange={handleStatusChange}
                isAdmin={isAdmin}
                userId={user?.id}
              />)
            )
          ) : (
            <div className="kanban-board">
              {STATUSES.map(status => {
                const col = tasks.filter(t => t.status === status);
                return (
                  <div key={status} className="kanban-col">
                    <div className="kanban-col-header">
                      <span className="kanban-col-title" style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                      <span className="kanban-count">{col.length}</span>
                    </div>
                    {col.map(task => (
                      <div key={task.id} className="kanban-task" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>
                        <div className="task-card-title" style={{ marginBottom:8 }}>{task.title}</div>
                        <div className="flex items-center justify-between">
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                          {task.assignee && (
                            <div className="avatar avatar-xs" style={{ background: task.assignee.avatar_color }}>
                              {task.assignee.name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        {task.due_date && (
                          <div className={`text-xs mt-1 ${getDueClass(task.due_date)}`}>
                            Due {formatDistanceToNow(new Date(task.due_date), { addSuffix:true })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom:16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                <UserPlus size={14} /> Add Member
              </button>
            </div>
          )}
          <div className="card" style={{ padding:0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Member</th><th>Email</th><th>Role</th><th>Joined</th>{isAdmin && <th></th>}</tr>
                </thead>
                <tbody>
                  {project.members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm" style={{ background: m.user.avatar_color }}>
                            {m.user.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{m.user.name}</span>
                          {m.user_id === user?.id && <span className="tag">You</span>}
                        </div>
                      </td>
                      <td className="text-muted text-sm">{m.user.email}</td>
                      <td>
                        {isAdmin && m.user_id !== user?.id ? (
                          <select className="form-select" style={{ width:'auto', padding:'4px 8px', fontSize:12 }}
                            value={m.role} onChange={e => handleRoleChange(m, e.target.value)}>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`badge badge-${m.role}`}>
                            {m.role === 'admin' ? <Crown size={10} style={{ marginRight:3 }} /> : <User size={10} style={{ marginRight:3 }} />}
                            {m.role}
                          </span>
                        )}
                      </td>
                      <td className="text-dim text-xs">{formatDistanceToNow(new Date(m.joined_at), { addSuffix:true })}</td>
                      {isAdmin && (
                        <td>
                          {m.user_id !== user?.id && (
                            <button className="btn-icon" onClick={() => handleRemoveMember(m.id)} title="Remove">
                              <X size={14} style={{ color:'var(--red)' }} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          members={project.members}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={(saved, isEdit) => {
            if (isEdit) setTasks(tasks.map(t => t.id === saved.id ? saved : t));
            else setTasks([saved, ...tasks]);
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={m => setProject({ ...project, members: [...project.members, m] })}
        />
      )}
    </div>
  );
}

function TaskRow({ task, onEdit, onDelete, onStatusChange, isAdmin, userId }) {
  const canEdit = isAdmin || task.creator_id === userId || task.assignee_id === userId;
  return (
    <div className="task-card">
      <div className="task-card-content">
        <div className="task-card-title">{task.title}</div>
        {task.description && <div className="text-sm text-muted" style={{ marginBottom:6, lineHeight:1.4 }}>{task.description}</div>}
        <div className="task-card-meta">
          <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          {task.assignee && (
            <div className="flex items-center gap-1">
              <div className="avatar avatar-xs" style={{ background: task.assignee.avatar_color }}>
                {task.assignee.name[0].toUpperCase()}
              </div>
              <span className="text-xs text-muted">{task.assignee.name.split(' ')[0]}</span>
            </div>
          )}
          {task.due_date && (
            <span className={`text-xs ${getDueClass(task.due_date)}`}>
              Due {formatDistanceToNow(new Date(task.due_date), { addSuffix:true })}
            </span>
          )}
          {task.tags && task.tags.split(',').map(tag => (
            <span key={tag} className="tag">{tag.trim()}</span>
          ))}
        </div>
      </div>
      {canEdit && (
        <div className="task-card-actions">
          <select className="form-select" style={{ padding:'4px 6px', fontSize:12, width:'auto' }}
            value={task.status} onChange={e => onStatusChange(task, e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn-icon" onClick={onEdit}><Pencil size={14} /></button>
          <button className="btn-icon" onClick={onDelete}><Trash2 size={14} style={{ color:'var(--red)' }} /></button>
        </div>
      )}
    </div>
  );
}

function getDueClass(due) {
  if (!due) return '';
  const d = new Date(due);
  const now = new Date();
  if (d < now) return 'due-overdue';
  if (d - now < 86400000 * 2) return 'due-soon';
  return 'due-ok';
}
