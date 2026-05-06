import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjects, createProject } from '../api/client';

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#89b4fa', due_date: '' });
  const [loading, setLoading] = useState(false);

  const COLORS = ['#89b4fa','#cba6f7','#a6e3a1','#f9e2af','#fab387','#f38ba8','#94e2d5','#74c7ec'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.due_date) delete payload.due_date;
      const res = await createProject(payload);
      toast.success('Project created!');
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Project</span>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What is this project about?" value={form.description}
              onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="flex gap-2" style={{ flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm({...form, color: c})}
                  style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer',
                    border: form.color === c ? '3px solid white' : '2px solid transparent',
                    boxShadow: form.color === c ? '0 0 0 2px '+c : 'none' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.due_date}
              onChange={e => setForm({...form, due_date: e.target.value})} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    getProjects().then(r => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader-full"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const rate = project.task_count > 0 ? Math.round((project.completed_task_count / project.task_count) * 100) : 0;
            return (
              <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:project.color, borderRadius:'4px 0 0 4px' }} />
                <div style={{ paddingLeft: 8 }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="project-card-name">{project.name}</div>
                    <span style={{ width:10, height:10, borderRadius:'50%', background:project.color, flexShrink:0 }} />
                  </div>
                  <div className="project-card-desc">{project.description || 'No description'}</div>
                  <div className="project-progress">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-dim">{project.completed_task_count}/{project.task_count} tasks</span>
                      <span className="text-xs" style={{ color: project.color }}>{rate}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${rate}%`, background:project.color }} />
                    </div>
                  </div>
                  <div className="project-card-meta" style={{ marginTop:12 }}>
                    <div className="member-avatars">
                      {project.members.slice(0,4).map(m => (
                        <div key={m.id} className="avatar avatar-sm" style={{ background: m.user.avatar_color }}>
                          {m.user.name[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span><Users size={12} style={{ marginRight:3 }} />{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                    <span><CheckCircle size={12} style={{ marginRight:3 }} />{project.task_count} tasks</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects([...projects, p])}
        />
      )}
    </div>
  );
}
