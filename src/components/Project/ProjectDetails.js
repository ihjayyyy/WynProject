'use client';

import React, { useContext, useEffect, useState } from 'react';
import styles from './ProjectDetails.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import { getProjectById, getProjects, updateProject } from '../../services/Project';
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

export default function ProjectDetails() {
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('Details');
  const toast = useToast();
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const projectId = searchParams?.get ? searchParams.get('id') : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getProjects();
        if (res?.error) {
          toast.error('Failed to load project');
        } else {
          const list = res.data || [];
          const pid = projectId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null);
          const found = list.find((p) => String(p.id) === String(pid));
          if (mounted) {
            setProject(found || null);
            setForm(found ? { ...found } : {});
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

  const status = (Number(project.overallProgress) || 0) >= 100 ? 'Completed' : 'On Going';

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
            <div>{status}</div>
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
                {!editing && isAllowed(PageName, 'w') && <Button className="md" onClick={() => setEditing(true)}>Edit</Button>}
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
              {activeTab === 'Finance' && <ProjectFinanceTab projectId={project.id} project={project} editable={isAllowed(PageName, 'w')} />}
              {activeTab === 'Project Scope & Materials' && <ProjectScope projectId={project.id} editable={isAllowed(PageName, 'w')} onCompletedQtyUpdated={async () => {
                try {
                  const res = await getProjectById(project.id);
                  if (!res.error && res.data) {
                    const updated = res.data?.value && typeof res.data.value === 'object' && !Array.isArray(res.data.value)
                      ? res.data.value
                      : res.data;
                    setProject(updated);
                    setForm({ ...updated });
                  }
                } catch (e) {}
              }} />}
              {activeTab === 'Expenses' && <ExpensesTab projectId={project.id} />}
              {activeTab === 'Trip Tickets' && <TripTicketTab projectId={project.id} />}
              {activeTab === 'Staff' && <ProjectStaffTab projectId={project.id} />}
              {activeTab === 'Attendance' && <AttendanceTab projectId={project.id} />}
              {activeTab === 'Material Requests' && <MaterialRequestsTab projectId={project.id} />}
              {activeTab === 'Billing & Collection' && <ProjectBillingCollectionTab projectId={project.id} />}
          </div>
        )}
      </div>
    </div>
  );
}
