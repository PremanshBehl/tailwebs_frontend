import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { format, isPast } from 'date-fns';
import { 
  Plus, ClipboardList, FileText, Megaphone, CheckCircle, 
  Inbox, Calendar, Users, Pencil, Trash2, 
  ChevronLeft, ChevronRight, Eye, Check, X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import {
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchSubmissionsForAssignment,
  fetchAnalytics,
  markSubmissionReviewed,
} from '../api/axios';

const STATUS_FILTERS = ['all', 'draft', 'published', 'completed'];

const statusTransitionLabel = {
  draft: { label: 'Publish', next: 'published', btnClass: 'btn-success', icon: <Megaphone size={14} /> },
  published: { label: 'Complete', next: 'completed', btnClass: 'btn-warning', icon: <CheckCircle size={14} /> },
  completed: null,
};

export default function TeacherDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewSubmissions, setViewSubmissions] = useState(null); // { assignment, submissions }
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (filter !== 'all') params.status = filter;

      const [assignRes, analyticsRes] = await Promise.all([
        fetchAssignments(params),
        fetchAnalytics(),
      ]);
      setAssignments(assignRes.data.data);
      setTotalPages(assignRes.data.totalPages);
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filter]);

  const openCreate = () => {
    reset({});
    setShowCreate(true);
  };

  const openEdit = (a) => {
    setEditingAssignment(a);
    reset({
      title: a.title,
      description: a.description,
      dueDate: format(new Date(a.dueDate), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const onSubmitCreate = async (data) => {
    setFormLoading(true);
    try {
      await createAssignment({ ...data, dueDate: new Date(data.dueDate).toISOString() });
      toast.success('Assignment created!');
      setShowCreate(false);
      reset({});
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setFormLoading(false);
    }
  };

  const onSubmitEdit = async (data) => {
    setFormLoading(true);
    try {
      await updateAssignment(editingAssignment._id, {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate).toISOString(),
      });
      toast.success('Assignment updated!');
      setEditingAssignment(null);
      reset({});
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTransition = async (assignment) => {
    const transition = statusTransitionLabel[assignment.status];
    if (!transition) return;
    try {
      await updateAssignment(assignment._id, { status: transition.next });
      toast.success(`Assignment moved to "${transition.next}"!`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transition failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft assignment?')) return;
    try {
      await deleteAssignment(id);
      toast.success('Assignment deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSubmissionsLoading(true);
    setViewSubmissions({ assignment, submissions: [] });
    try {
      const res = await fetchSubmissionsForAssignment(assignment._id);
      setViewSubmissions({ assignment, submissions: res.data.data });
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleMarkReviewed = async (submissionId) => {
    try {
      await markSubmissionReviewed(submissionId);
      toast.success('Marked as reviewed');
      // Refresh submissions in modal
      const updated = viewSubmissions.submissions.map(s =>
        s._id === submissionId ? { ...s, reviewed: true } : s
      );
      setViewSubmissions(prev => ({ ...prev, submissions: updated }));
    } catch (err) {
      toast.error('Failed to mark reviewed');
    }
  };

  const AssignmentForm = ({ onSubmit, title, isEdit }) => (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="f-title">Title</label>
        <input
          id="f-title"
          className="form-input"
          placeholder="e.g. Data Structures Quiz"
          {...register('title', { required: 'Title is required', maxLength: { value: 100, message: 'Max 100 chars' } })}
        />
        {errors.title && <p className="form-error">{errors.title.message}</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="f-desc">Description</label>
        <textarea
          id="f-desc"
          className="form-textarea"
          placeholder="Describe the assignment in detail…"
          rows={4}
          {...register('description', { required: 'Description is required', maxLength: { value: 2000, message: 'Max 2000 chars' } })}
        />
        {errors.description && <p className="form-error">{errors.description.message}</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="f-due">Due Date & Time</label>
        <input
          id="f-due"
          type="datetime-local"
          className="form-input"
          {...register('dueDate', { required: 'Due date is required' })}
        />
        {errors.dueDate && <p className="form-error">{errors.dueDate.message}</p>}
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => { isEdit ? setEditingAssignment(null) : setShowCreate(false); reset({}); }}
        >
          Cancel
        </button>
        <button type="submit" id={isEdit ? 'btn-save-edit' : 'btn-create-submit'} className="btn btn-primary" disabled={formLoading}>
          {formLoading
            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Saving…</>
            : isEdit ? 'Save Changes' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">

        {/* Header */}
        <div className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="dashboard-title">Teacher Dashboard</h1>
              <p className="dashboard-subtitle">Manage your assignments and track student progress</p>
            </div>
            <button id="btn-create-assignment" className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} /> New Assignment
            </button>
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon red"><ClipboardList size={22} color="var(--red)" /></div>
              <div>
                <div className="stat-value">{analytics.total}</div>
                <div className="stat-label">Total Assignments</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><FileText size={22} color="var(--amber)" /></div>
              <div>
                <div className="stat-value">{analytics.draft}</div>
                <div className="stat-label">Drafts</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><Megaphone size={22} color="var(--blue)" /></div>
              <div>
                <div className="stat-value">{analytics.published}</div>
                <div className="stat-label">Published</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><CheckCircle size={22} color="var(--green)" /></div>
              <div>
                <div className="stat-value">{analytics.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon navy"><Inbox size={22} color="var(--navy)" /></div>
              <div>
                <div className="stat-value">{analytics.totalSubmissions}</div>
                <div className="stat-label">Total Submissions</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-tabs">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                id={`filter-${f}`}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {!loading && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{assignments.length} assignments</span>}
        </div>

        {/* Assignments */}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner"></div></div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ClipboardList size={48} /></div>
            <div className="empty-title">No assignments found</div>
            <p className="empty-text">
              {filter === 'all' ? 'Create your first assignment to get started!' : `No ${filter} assignments.`}
            </p>
          </div>
        ) : (
          <>
            <div className="assignments-grid">
              {assignments.map(a => {
                const overdue = isPast(new Date(a.dueDate));
                const transition = statusTransitionLabel[a.status];
                return (
                  <div key={a._id} className="assignment-card">
                    <div className="assignment-card-header">
                      <h3 className="assignment-title">{a.title}</h3>
                      <span className={`badge badge-${a.status}`}>{a.status}</span>
                    </div>

                    <p className="assignment-desc">{a.description}</p>

                    <div className="assignment-meta">
                      <span className={`assignment-due ${overdue && a.status !== 'completed' ? 'overdue' : ''}`}>
                         <Calendar size={13} /> {format(new Date(a.dueDate), 'MMM d, yyyy · HH:mm')}
                        {overdue && a.status !== 'completed' && ' · Overdue'}
                      </span>
                      <span className="assignment-stats">
                        <Users size={13} /> Subs: {a.submissionCount}
                      </span>
                    </div>

                    <div className="assignment-actions">
                      {/* State transition */}
                      {transition && (
                        <button
                          className={`btn btn-sm ${transition.btnClass}`}
                          onClick={() => handleTransition(a)}
                          id={`btn-transition-${a._id}`}
                        >
                          {transition.icon}
                          {transition.label}
                        </button>
                      )}

                      {/* Edit — draft only */}
                      {a.status === 'draft' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(a)} id={`btn-edit-${a._id}`}>
                          <Pencil size={14} /> Edit
                        </button>
                       )}

                      {/* View Submissions */}
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleViewSubmissions(a)}
                        id={`btn-subs-${a._id}`}
                      >
                        <Inbox size={14} /> Submissions
                      </button>

                      {/* Delete — draft only */}
                      {a.status === 'draft' && (
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(a._id)} id={`btn-delete-${a._id}`} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={16} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={16} /></button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Create New Assignment</h2>
              <button className="modal-close" onClick={() => { setShowCreate(false); reset({}); }}><X size={18} /></button>
            </div>
            <AssignmentForm onSubmit={onSubmitCreate} title="Create" isEdit={false} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAssignment && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingAssignment(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit Assignment</h2>
              <button className="modal-close" onClick={() => { setEditingAssignment(null); reset({}); }}><X size={18} /></button>
            </div>
            <AssignmentForm onSubmit={onSubmitEdit} title="Save" isEdit={true} />
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {viewSubmissions && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewSubmissions(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Submissions</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {viewSubmissions.assignment.title}
                </p>
              </div>
              <button className="modal-close" onClick={() => setViewSubmissions(null)}><X size={18} /></button>
            </div>

            {submissionsLoading ? (
              <div className="spinner-wrap"><div className="spinner"></div></div>
            ) : viewSubmissions.submissions.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon" style={{ fontSize: 36 }}><Inbox size={48} /></div>
                <div className="empty-title">No submissions yet</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Answer</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewSubmissions.submissions.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.student?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.student?.email}</div>
                        </td>
                        <td className="td-answer">{s.answer}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {format(new Date(s.submittedAt), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td>
                          <span className={`badge ${s.reviewed ? 'badge-completed' : 'badge-pending'}`}>
                            {s.reviewed ? <Check size={10} /> : <Eye size={10} />}
                            {s.reviewed ? 'Reviewed' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {!s.reviewed && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleMarkReviewed(s._id)}
                              id={`btn-review-${s._id}`}
                            >
                              <Check size={14} /> Mark Reviewed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setViewSubmissions(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
