import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import {
  GraduationCap, BookOpen, CheckCircle, Clock, AlertCircle,
  Inbox, Calendar, FileText, Send, Eye,
  ChevronLeft, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { fetchAssignments, submitAnswer, fetchMySubmissions } from '../api/axios';

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // The assignment currently open for submission
  const [submittingFor, setSubmittingFor] = useState(null);
  const [viewingAnswer, setViewingAnswer] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, subsRes] = await Promise.all([
        fetchAssignments({ page, limit: 9 }),
        fetchMySubmissions(),
      ]);
      setAssignments(assignRes.data.data);
      setTotalPages(assignRes.data.totalPages);
      setMySubmissions(subsRes.data.data);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  // Map submissionId by assignment id for fast lookup
  const submissionMap = {};
  mySubmissions.forEach(s => {
    submissionMap[s.assignment?._id] = s;
  });

  const openSubmit = (assignment) => {
    reset({ answer: '' });
    setSubmittingFor(assignment);
  };

  const onSubmitAnswer = async (data) => {
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', submittingFor._id);
      formData.append('answer', data.answer || '');
      if (data.file && data.file[0]) {
        formData.append('file', data.file[0]);
      }

      await submitAnswer(formData);
      toast.success('Answer submitted successfully!');
      setSubmittingFor(null);
      reset({});
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const submittedCount = Object.keys(submissionMap).length;
  const pendingCount = assignments.filter(a => !submissionMap[a._id]).length;
  const overdueCount = assignments.filter(a => isPast(new Date(a.dueDate)) && !submissionMap[a._id]).length;

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <GraduationCap size={28} /> Student Dashboard
          </h1>
          <p className="dashboard-subtitle">View and submit your published assignments</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon navy"><BookOpen size={22} color="var(--navy)" /></div>
            <div>
              <div className="stat-value">{assignments.length}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle size={22} color="var(--green)" /></div>
            <div>
              <div className="stat-value">{submittedCount}</div>
              <div className="stat-label">Submitted</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"><Clock size={22} color="var(--amber)" /></div>
            <div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><AlertCircle size={22} color="var(--red)" /></div>
            <div>
              <div className="stat-value">{overdueCount}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
        </div>

        {/* Assignments */}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner"></div></div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Inbox size={48} /></div>
            <div className="empty-title">No assignments yet</div>
            <p className="empty-text">Your teacher hasn't published any assignments yet. Check back later!</p>
          </div>
        ) : (
          <>
            <div className="assignments-grid">
              {assignments.map(a => {
                const submission = submissionMap[a._id];
                const overdue = isPast(new Date(a.dueDate));
                const canSubmit = !submission && !overdue;

                return (
                  <div key={a._id} className={`assignment-card ${submission ? 'submitted' : ''}`}
                    style={submission ? { borderColor: 'rgba(34,197,94,0.25)' } : {}}
                  >
                    <div className="assignment-card-header">
                      <h3 className="assignment-title">{a.title}</h3>
                      <span className={`badge ${submission ? 'badge-submitted' : overdue ? 'badge-draft' : 'badge-pending'}`}>
                        {submission ? <CheckCircle size={10} /> : overdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                        {submission ? 'Submitted' : overdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>

                    <p className="assignment-desc">{a.description}</p>

                    <div className="assignment-meta">
                      <span className={`assignment-due ${overdue && !submission ? 'overdue' : ''}`}>
                        <Calendar size={13} /> {format(new Date(a.dueDate), 'MMM d, yyyy · HH:mm')}
                        {!overdue && (
                          <span style={{ marginLeft: 4, color: 'var(--amber)' }}>
                            · {formatDistanceToNow(new Date(a.dueDate), { addSuffix: true })}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Show submitted answer preview */}
                    {submission && (
                      <div style={{ marginTop: 4 }}>
                        <div className="submitted-label">
                          <FileText size={12} /> Your answer
                        </div>
                        <div className="answer-box" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {submission.answer}
                        </div>
                      </div>
                    )}

                    <div className="assignment-actions">
                      {canSubmit && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openSubmit(a)}
                          id={`btn-submit-${a._id}`}
                        >
                          <Send size={14} /> Submit Answer
                        </button>
                      )}
                      {submission && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewingAnswer({ assignment: a, submission })}
                          id={`btn-view-${a._id}`}
                        >
                          <Eye size={14} /> View Answer
                        </button>
                      )}
                      {overdue && !submission && (
                        <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={12} /> Submission closed
                        </span>
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

      {/* Submit Modal */}
      {submittingFor && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSubmittingFor(null)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Submit Answer</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {submittingFor.title}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSubmittingFor(null)}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {submittingFor.description}
              </p>
              {submittingFor.fileUrl && (
                <a href={submittingFor.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--blue)' }}>
                  📎 {submittingFor.originalFileName || 'View attached worksheet'}
                </a>
              )}
              <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} /> Due: {format(new Date(submittingFor.dueDate), 'MMM d, yyyy · HH:mm')}
              </p>
            </div>

            <div className="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> You cannot edit your answer after submission.
            </div>

            <form onSubmit={handleSubmit(onSubmitAnswer)} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="answer">Your Answer (Optional if attaching a file)</label>
                <textarea
                  id="answer"
                  className="form-textarea"
                  placeholder="Write your answer here or upload a file…"
                  rows={6}
                  {...register('answer')}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="f-file">Upload File (PDF, Image, Doc)</label>
                <input
                  id="f-file"
                  type="file"
                  className="form-input"
                  style={{ padding: '8px' }}
                  {...register('file')}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setSubmittingFor(null)}>
                  Cancel
                </button>
                <button type="submit" id="btn-confirm-submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading
                    ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Submitting…</>
                    : <><Send size={18} /> Submit Answer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Answer Modal */}
      {viewingAnswer && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewingAnswer(null)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Your Submission</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {viewingAnswer.assignment.title}
                </p>
              </div>
              <button className="modal-close" onClick={() => setViewingAnswer(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span
                className={`badge ${viewingAnswer.submission.reviewed ? 'badge-completed' : 'badge-pending'}`}
                style={{ fontSize: 12 }}
              >
                {viewingAnswer.submission.reviewed ? <CheckCircle size={10} /> : <Clock size={10} />}
                {viewingAnswer.submission.reviewed ? 'Reviewed by teacher' : 'Awaiting review'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> Submitted: {format(new Date(viewingAnswer.submission.submittedAt), 'MMM d, yyyy · HH:mm')}
              </span>
            </div>

            <div className="submitted-label"><FileText size={12} /> Your Answer</div>
            <div className="answer-box">
              {viewingAnswer.submission.answer || <em>No text answer provided.</em>}
            </div>
            
            {viewingAnswer.submission.fileUrl && (
              <div style={{ marginTop: 12 }}>
                <a href={viewingAnswer.submission.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontSize: 13, color: 'var(--blue)' }}>
                  📎 {viewingAnswer.submission.originalFileName || 'View uploaded file'}
                </a>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setViewingAnswer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
