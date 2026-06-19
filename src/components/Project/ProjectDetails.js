'use client';

import React, { useContext, useEffect, useState } from 'react';
import styles from './ProjectDetails.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import { getProjectById, updateProject, startProject, completeProject, cancelProject, closeProject } from '../../services/Project';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import ProjectScope from './ProjectScope';
import ProjectStaffTab from './ProjectStaffTab';
import ProjectFinanceTab from './ProjectFinanceTab';
import AttendanceTab from './AttendanceTab';
import ExpensesTab from './ExpensesTab';
import TripTicketTab from './TripTicketTab';
import MaterialRequestsTab from './MaterialRequestsTab';
import ProjectBillingCollectionTab from './ProjectBillingCollectionTab';
import { useToast } from '../ui/Toast/Toast';
import { FiBriefcase } from 'react-icons/fi';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';
import StatusBadge from '../ui/StatusBadge/StatusBadge';

export default function ProjectDetails() {
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('Details');
  // Confirm modal state for start/complete actions
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const toast = useToast();
  const router = useRouter();

  const searchParams = useSearchParams();
  const projectId = searchParams?.get ? searchParams.get('id') : null;

  // Helper to unwrap the API response shape consistently everywhere
  const unwrap = (res) =>
    res?.data?.value && typeof res.data.value === 'object' && !Array.isArray(res.data.value)
      ? res.data.value
      : res?.data;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const pid = projectId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null);
        if (!pid) {
          if (mounted) {
            setProject(null);
            setForm({});
          }
          setLoading(false);
          return;
        }
        const res = await getProjectById(pid);
        if (res?.error) {
          toast.error('Failed to load project');
        } else {
          const data = unwrap(res);
          if (mounted) {
            setProject(data || null);
            setForm(data ? { ...data } : {});
          }
        }
      } catch (e) {
        toast.error('Failed to load project');
      }
      setLoading(false);
    })();
    return () => (mounted = false);
  }, [projectId, toast]);

  const save = async () => {
    if (!project) return;
    setLoading(true);
    const res = await updateProject(project.id, form);
    if (res?.error) toast.error('Failed to save project');
    else { toast.success('Project saved'); setProject({ ...form }); setEditing(false); }
    setLoading(false);
  };

  if (!isAllowed(PageName, 'r')) return <InvalidPage />;
  if (loading) return <div>Loading...</div>;
  if (!project) return <div>No project found</div>;

  // status can come back as a plain string, a number, or an object
  // (e.g. { id, name } / { value, label }) depending on the endpoint.
  // Normalize to an uppercase string regardless of shape.
  const rawStatus =
    typeof project.status === 'object' && project.status !== null
      ? (project.status.name || project.status.label || project.status.value || project.status.status || '')
      : project.status;
  const projectStatus = String(rawStatus || '').toUpperCase();
  const isCancelled = projectStatus === 'CANCELLED';
  const isFullyLocked = ['COMPLETED', 'CANCELLED', 'CLOSED'].includes(projectStatus);
  const isOngoing = projectStatus === 'ONGOING';
  const canWrite = isAllowed(PageName, 'w');

  // Returns true if this tab is editable based on project status
  const tabEditable = (tab) => {
    if (isFullyLocked) return false;
    return true;
  };

  const tabs = ['Details', 'Finance', 'Project Scope & Materials', 'Expenses', 'Trip Tickets', 'Staff', 'Attendance', 'Material Requests', 'Billing & Collection'];

  return (
    <div className={styles.wrap}>
      <div className={styles.breadcrumbs}>
        <Breadcrumbs
          showBack
          backIcon={<FiBriefcase size={18} />}
          items={[{ label: project.projectName || project.name }]}
          backHref="/projects/project"
        />
      </div>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.title}>{project.projectName || project.name}</div>
          <div className={styles.metaRow}>
            <div><StatusBadge status={project.status} /></div>
            <div>Project No. {project.projectNo || project.code}</div>
          </div>
          <div className={styles.tabs}>
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.overallProgressBlock}>
          <div className={styles.overallProgressLabel}>Overall Progress</div>
          <div className={styles.overallProgressValue}>{Number(project.overallProgress || 0).toFixed(2)}%</div>
        </div>
      </div>

      <div className={`${styles.content} ${styles.singleColumn}`}>
        {activeTab === 'Details' ? (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Details</h3>
              <div className={styles.panelActions}>
                {!editing && canWrite && tabEditable('Details') && (
                  <>
                    <Button className="md" onClick={() => setEditing(true)}>Edit</Button>

                    {/* Start Project button - shown when status is NOTSTARTED */}
                    {projectStatus === 'NOTSTARTED' && (
                      <Button
                        className="secondary md"
                        onClick={() => {
                          setConfirmTarget(project);
                          setConfirmTitle('Start Project?');
                          setConfirmMessage(`Start project "${project.projectName || project.name || project.code || ''}"?`);
                          setConfirmAction(() => async (target) => {
                            try {
                              setLoading(true);
                              const res = await startProject(target.id);
                              if (res?.error) toast.error('Failed to start project');
                              else {
                                toast.success('Project started');
                                const r = await getProjectById(target.id);
                                const updated = unwrap(r);
                                setProject(updated);
                                setForm({ ...updated });
                              }
                            } catch (e) {
                              toast.error('Failed to start project');
                            }
                            setLoading(false);
                          });
                          setIsConfirmOpen(true);
                        }}
                      >
                        Start Project
                      </Button>
                    )}

                    {/* Complete Project button - shown when overallProgress >= 100 */}
                    {Number(project.overallProgress || 0) >= 100 && projectStatus !== 'COMPLETED' && (
                      <Button
                        className="secondary md"
                        onClick={() => {
                          setConfirmTarget(project);
                          setConfirmTitle('Complete Project?');
                          setConfirmMessage(`Mark project "${project.projectName || project.name || project.code || ''}" as complete?`);
                          setConfirmAction(() => async (target) => {
                            try {
                              setLoading(true);
                              const res = await completeProject(target.id);
                              if (res?.error) toast.error('Failed to complete project');
                              else {
                                toast.success('Project marked complete');
                                const r = await getProjectById(target.id);
                                const updated = unwrap(r);
                                setProject(updated);
                                setForm({ ...updated });
                              }
                            } catch (e) {
                              toast.error('Failed to complete project');
                            }
                            setLoading(false);
                          });
                          setIsConfirmOpen(true);
                        }}
                      >
                        Complete Project
                      </Button>
                    )}
                  </>
                )}
                {/* Cancel Project - hidden when already Cancelled */}
                {!editing && canWrite && !isCancelled && (
                  <Button
                    className="secondary md"
                    onClick={() => {
                      setConfirmTarget(project);
                      setConfirmTitle('Cancel Project?');
                      setConfirmMessage(`Cancel project "${project.projectName || project.name || project.code || ''}"?`);
                      setConfirmAction(() => async (target) => {
                        try {
                          setLoading(true);
                          const res = await cancelProject(target.id);
                          if (res?.error) toast.error('Failed to cancel project');
                          else {
                            toast.success('Project cancelled');
                            const r = await getProjectById(target.id);
                            const updated = unwrap(r);
                            setProject(updated);
                            setForm({ ...updated });
                          }
                        } catch (e) {
                          toast.error('Failed to cancel project');
                        }
                        setLoading(false);
                      });
                      setIsConfirmOpen(true);
                    }}
                  >
                    Cancel Project
                  </Button>
                )}

                {/* Close Project - visible when status is COMPLETED or CANCELLED */}
                {!editing && canWrite && (projectStatus === 'COMPLETED' || isCancelled) && (
                  <Button
                    className="secondary md"
                    onClick={() => {
                      setConfirmTarget(project);
                      setConfirmTitle('Close Project?');
                      setConfirmMessage(`Close project "${project.projectName || project.name || project.code || ''}"?`);
                      setConfirmAction(() => async (target) => {
                        try {
                          setLoading(true);
                          const res = await closeProject(target.id);
                          if (res?.error) toast.error('Failed to close project');
                          else {
                            toast.success('Project closed');
                            const r = await getProjectById(target.id);
                            const updated = unwrap(r);
                            setProject(updated);
                            setForm({ ...updated });
                            router.push('/projects/project');
                          }
                        } catch (e) {
                          toast.error('Failed to close project');
                        }
                        setLoading(false);
                      });
                      setIsConfirmOpen(true);
                    }}
                  >
                    Close Project
                  </Button>
                )}

                {editing && (
                  <>
                    <Button className="secondary md" onClick={() => { setForm({ ...project }); setEditing(false); }}>Cancel</Button>
                    {isAllowed(PageName, 'w') && <Button className="save md" onClick={save}>Save</Button>}
                  </>
                )}
              </div>
            </div>

            {/* Left-side fields shown under Details title */}
            <div className={styles.detailsFields}>
              <div className={styles.field}>
                <label>Contact Person</label>
                {editing ? (
                  <Input value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                ) : (
                  <div className="value">{project.contactPerson}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Address</label>
                {editing ? (
                  <Input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                ) : (
                  <div className="value">{project.address}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Start Date</label>
                {editing ? (
                  <Input type="date" value={form.startDate ? String(form.startDate).split('T')[0] : ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                ) : (
                  <div className="value">{project.startDate ? new Date(project.startDate).toLocaleDateString() : ''}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>End Date</label>
                {editing ? (
                  <Input type="date" value={form.endDate ? String(form.endDate).split('T')[0] : ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                ) : (
                  <div className="value">{project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Contract Price</label>
                <div className="value">{project.contractPrice ? Number(project.contractPrice).toLocaleString() : ''}</div>
              </div>

              <div className={styles.field}>
                <label>Overall Progress %</label>
                <div className="value">{project.overallProgress ?? 0}%</div>
              </div>

              <div className={styles.field}>
                <label>Total Expense</label>
                <div className="value">{project.totalExpenses ? Number(project.totalExpenses).toLocaleString() : ''}</div>
              </div>

              <div className={styles.field}>
                <label>Net</label>
                  <div className="value">{project.net}</div>
              </div>
            </div>

            {/* Details content */}
            <div>
                  <p>Prepared by: {project.preparedBy}</p>
                  <p>Noted by: {project.notedBy}</p>
                  <p>Reference: {project.reference}</p>
            </div>
          </div>
        ) : (
          <div className={styles.panel}>
              {activeTab === 'Finance' && <ProjectFinanceTab projectId={project.id} project={project} editable={canWrite && tabEditable('Finance')} />}
              {activeTab === 'Project Scope & Materials' && <ProjectScope
                projectId={project.id}
                editable={canWrite && tabEditable('Project Scope & Materials')}
                projectStatus={projectStatus}
                onCompletedQtyUpdated={async () => {
                  try {
                    const res = await getProjectById(project.id);
                    if (!res.error && res.data) {
                      const updated = unwrap(res);
                      setProject(updated);
                      setForm({ ...updated });
                    }
                  } catch (e) {}
                }}
              />}
{activeTab === 'Expenses' && <ExpensesTab projectId={project.id} editable={canWrite && tabEditable('Expenses')} projectStatus={projectStatus} />}
{activeTab === 'Trip Tickets' && <TripTicketTab projectId={project.id} editable={canWrite && tabEditable('Trip Tickets')} projectStatus={projectStatus} />}
{activeTab === 'Staff' && <ProjectStaffTab projectId={project.id} editable={canWrite && tabEditable('Staff')} />}
{activeTab === 'Attendance' && <AttendanceTab projectId={project.id} editable={canWrite && tabEditable('Attendance')} projectStatus={projectStatus} />}
              {activeTab === 'Material Requests' && <MaterialRequestsTab projectId={project.id} editable={canWrite && tabEditable('Material Requests')} />}
              {activeTab === 'Billing & Collection' && <ProjectBillingCollectionTab projectId={project.id} editable={canWrite && tabEditable('Billing & Collection')} overallProgress={project.overallProgress} />}
          </div>
        )}
      </div>
      <ConfirmModal
        open={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm"
        onConfirm={async () => {
          setIsConfirmOpen(false);
          if (confirmAction && confirmTarget) {
            await confirmAction(confirmTarget);
          }
        }}
        onCancel={() => {
          setIsConfirmOpen(false);
          setConfirmTarget(null);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}