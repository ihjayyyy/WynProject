'use client';

import React, { useEffect, useState } from 'react';
import styles from './ProjectDetails.module.scss';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import { getProjects, updateProject } from '../../services/Project';
import { useToast } from '../ui/Toast/Toast';
import { FiBriefcase } from 'react-icons/fi';

export default function ProjectDetails({ id: propId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('Details');
  const toast = useToast();
  const router = useRouter();

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
          const pid = propId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null);
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
  }, [propId, toast]);

  const save = async () => {
    if (!project) return;
    setLoading(true);
    const res = await updateProject(project.id, form);
    if (res?.error) toast.error('Failed to save project');
    else { toast.success('Project saved'); setProject({ ...form }); setEditing(false); }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>No project found</div>;

  const status = (Number(project.overallProgress) || 0) >= 100 ? 'Completed' : 'On Going';

  const tabs = ['Details', 'Project Scope & Materials', 'Expenses', 'Trip Tickets', 'Staff', 'Billing & Collection'];

  return (
    <div className={styles.wrap}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs
            showBack
            backIcon={<FiBriefcase size={18} />}
            items={[{ label: project.projectName || project.name }]}
            backHref="/projects/project"
          />        </div>
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

        {/* edit buttons moved into Details tab panel */}
      </div>

      <div className={`${styles.content} ${activeTab === 'Details' ? styles.singleColumn : ''}`}>
        {activeTab === 'Details' ? (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Details</h3>
              <div className={styles.panelActions}>
                {!editing && <Button className="md" onClick={() => setEditing(true)}>Edit</Button>}
                {editing && (
                  <>
                    <Button className="secondary md" onClick={() => { setForm({ ...project }); setEditing(false); }}>Cancel</Button>
                    <Button className="save md" onClick={save}>Save</Button>
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
                {editing ? (
                  <Input type="number" value={form.contractPrice ?? ''} onChange={(e) => setForm({ ...form, contractPrice: e.target.value === '' ? '' : Number(e.target.value) })} />
                ) : (
                  <div className="value">{project.contractPrice ? Number(project.contractPrice).toLocaleString() : ''}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Overall Progress %</label>
                {editing ? (
                  <Input type="number" value={form.overallProgress ?? ''} onChange={(e) => setForm({ ...form, overallProgress: e.target.value === '' ? '' : Number(e.target.value) })} />
                ) : (
                  <div className="value">{project.overallProgress ?? 0}%</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Total Expense</label>
                {editing ? (
                  <Input type="number" value={form.totalExpenses ?? ''} onChange={(e) => setForm({ ...form, totalExpenses: e.target.value === '' ? '' : Number(e.target.value) })} />
                ) : (
                  <div className="value">{project.totalExpenses ? Number(project.totalExpenses).toLocaleString() : ''}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Net</label>
                {editing ? (
                  <Input type="number" value={form.net ?? ''} onChange={(e) => setForm({ ...form, net: e.target.value === '' ? '' : Number(e.target.value) })} />
                ) : (
                  <div className="value">{project.net ? Number(project.net).toLocaleString() : ''}</div>
                )}
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
          <div className={styles.panel} style={{ width: '100%' }}>
            {activeTab === 'Project Scope & Materials' && <div>Project scope and materials content</div>}
            {activeTab === 'Expenses' && <div>Expenses content</div>}
            {activeTab === 'Trip Tickets' && <div>Trip tickets content</div>}
            {activeTab === 'Staff' && <div>Staff content</div>}
            {activeTab === 'Billing & Collection' && <div>Billing & collection content</div>}
          </div>
        )}
      </div>
    </div>
  );
}
