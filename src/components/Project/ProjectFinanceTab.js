import React, { useEffect, useState } from 'react';
import { getProjectFinanceById, getProjectFinanceByProjectId, updateProjectFinance, createProjectFinance, INITIAL_PROJECT_FINANCE } from '../../services/ProjectFinance';
import { useEffect as useEffectReact, useState as useStateReact } from 'react';
import styles from './ProjectDetails.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';

export default function ProjectFinanceTab({ projectId, project, editable }) {
  const [finance, setFinance] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  console.log('ProjectFinanceTab rendered with projectId:', projectId, 'project:', project);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await getProjectFinanceByProjectId(projectId);
      let merged;
      let financeData = null;
      if (res.data && Array.isArray(res.data.value) && res.data.value.length > 0) {
        financeData = res.data.value[0];
        merged = { ...INITIAL_PROJECT_FINANCE, ...financeData };
      } else {
        // Default lastBillingDate to today
        const today = new Date().toISOString().split('T')[0];
        merged = { ...INITIAL_PROJECT_FINANCE, projectId, lastBillingDate: today };
      }
      // Use project prop for code and name
      if (project) {
        merged.code = project.code || '';
        merged.name = project.name || '';
      }
      if (mounted) {
        setFinance(financeData ? merged : null);
        setForm(merged);
      }
      setLoading(false);
    })();
    return () => (mounted = false);
  }, [projectId, project]);

  const cleanPayload = (payload) => {
    const {
      error, isFailure, isSuccess, value, projectCompletion, ...cleaned
    } = payload;
    // Remove projectCompletion from payload as per backend update
    return cleaned;
  };

  const save = async () => {
    setLoading(true);
    let res;
    // Always update code and name from project if available
    let payload = { ...form };
    // Always enforce correct projectId
    payload.projectId = projectId;
    if (project) {
      payload.code = project.code || '';
      payload.name = project.name || '';
    }
    // Ensure lastBillingDate is never null or empty
    if (!payload.lastBillingDate) {
      payload.lastBillingDate = new Date().toISOString().split('T')[0];
    }
    payload = cleanPayload(payload);
    if (finance && finance.id) {
      res = await updateProjectFinance(finance.id, payload);
    } else {
      res = await createProjectFinance(payload);
    }
    if (!res?.error) {
      setFinance(res.data);
      setEditing(false);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
    <div className={styles.panelHeader}>
        <h3>Finance</h3>
                      <div className={styles.panelActions}>
        {!editing && editable && <Button className="md" onClick={() => setEditing(true)}>Edit</Button>}
        {editing && (
          <>
            <Button className="secondary md" onClick={() => { setForm({ ...finance }); setEditing(false); }}>Cancel</Button>
            <Button className="save md" onClick={save}>Save</Button>
          </>
        )}
      </div>
    </div>
    <div className={styles.detailsFields}>

      <div className={styles.field}>
        <label>Down Payment</label>
        {editing ? (
          <Input type="number" value={form.downPayment ?? ''} onChange={e => setForm({ ...form, downPayment: e.target.value === '' ? '' : Number(e.target.value) })} />
        ) : (
          <div className="value">{finance?.downPayment ?? ''}</div>
        )}
      </div>
      <div className={styles.field}>
        <label>Retention Fee</label>
        {editing ? (
          <Input type="number" value={form.retentionFee ?? ''} onChange={e => setForm({ ...form, retentionFee: e.target.value === '' ? '' : Number(e.target.value) })} />
        ) : (
          <div className="value">{finance?.retentionFee ?? ''}</div>
        )}
      </div>
      <div className={styles.field}>
        <label>Recoupment %</label>
        {editing ? (
          <Input type="number" value={form.recoupmentPercentage ?? ''} onChange={e => setForm({ ...form, recoupmentPercentage: e.target.value === '' ? '' : Number(e.target.value) })} />
        ) : (
          <div className="value">{finance?.recoupmentPercentage ?? ''}</div>
        )}
      </div>
      <div className={styles.field}>
        <label>Recoupment Balance</label>
        {editing ? (
          <Input type="number" value={form.recoupmentBalance ?? ''} onChange={e => setForm({ ...form, recoupmentBalance: e.target.value === '' ? '' : Number(e.target.value) })} />
        ) : (
          <div className="value">{finance?.recoupmentBalance ?? ''}</div>
        )}
      </div>
      <div className={styles.field}>
        <label>Total Billed Amount</label>
        {editing ? (
          <Input type="number" value={form.totalBilledAmount ?? ''} onChange={e => setForm({ ...form, totalBilledAmount: e.target.value === '' ? '' : Number(e.target.value) })} />
        ) : (
          <div className="value">{finance?.totalBilledAmount ?? ''}</div>
        )}
      </div>
      <div className={styles.field}>
        <label>Last Billing Date</label>
        {editing ? (
          <Input type="date" value={form.lastBillingDate ? String(form.lastBillingDate).split('T')[0] : ''} onChange={e => setForm({ ...form, lastBillingDate: e.target.value })} />
        ) : (
          <div className="value">{finance?.lastBillingDate ? new Date(finance.lastBillingDate).toLocaleDateString() : ''}</div>
        )}
      </div>
      {/* Project Completion input removed as per backend update */}
    </div>
    </>
  );
}
