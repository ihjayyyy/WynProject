import React, { useEffect, useState } from 'react';
import { getProjectFinanceByProjectId, updateProjectFinance, createProjectFinance, INITIAL_PROJECT_FINANCE, generateDownpaymentBilling } from '../../services/ProjectFinance';
import { useRouter } from 'next/navigation';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import styles from './ProjectDetails.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';

export default function ProjectFinanceTab({ projectId, project, editable }) {
  const router = useRouter();
  const confirmModal = useConfirmModal();
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
      const rawValue = res.data?.value;
      if (rawValue && Array.isArray(rawValue) && rawValue.length > 0) {
        financeData = rawValue[0];
        merged = { ...INITIAL_PROJECT_FINANCE, ...financeData };
      } else if (rawValue && !Array.isArray(rawValue) && typeof rawValue === 'object') {
        financeData = rawValue;
        merged = { ...INITIAL_PROJECT_FINANCE, ...financeData };
      } else {
        // Default lastBillingDate to today
        merged = { ...INITIAL_PROJECT_FINANCE, projectId, lastBillingDate: new Date().toISOString() };
      }
      // Use project prop for code and name
      if (project) {
        merged.code = project.code || '';
        merged.name = project.name || '';
        // Derive downPaymentPercent from existing downPayment and contractPrice
        if (project.contractPrice > 0 && merged.downPayment) {
          merged.downPaymentPercent = parseFloat(((merged.downPayment / project.contractPrice) * 100).toFixed(4));
        } else {
          merged.downPaymentPercent = '';
        }
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
      error, isFailure, isSuccess, value, projectCompletion, downPaymentPercent,
      totalBilledAmount, lastBillingDate, ...cleaned
    } = payload;
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
    payload = cleanPayload(payload);
    payload.hasDownpayment = 0;
    payload.recoupmentBalance = Number(payload.downPayment) || 0;
    if (finance && finance.id) {
      res = await updateProjectFinance(finance.id, payload);
    } else {
      res = await createProjectFinance(payload);
    }
    if (!res?.error) {
      const saved = res.data?.value && typeof res.data.value === 'object' && !Array.isArray(res.data.value)
        ? res.data.value
        : res.data;
      setFinance(saved);
      setEditing(false);
    }
    setLoading(false);
  };

  

  const handleGenerateDownpaymentBilling = () => {
    confirmModal.show(
      'Generate Downpayment Billing',
      'Are you sure you want to generate a downpayment billing? You will be redirected to the Sales Billing form.',
      'Generate',
      'primary',
      () => async () => {
        setLoading(true);
        const res = await generateDownpaymentBilling(projectId);
        setLoading(false);
        if (res?.data) {
          sessionStorage.setItem('generatedBilling', JSON.stringify(res.data));
          router.push('/finance/billings/form');
        }
      }
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
    <div className={styles.panelHeader}>
        <h3>Finance</h3>
                      <div className={styles.panelActions}>
        {!editing && finance && !finance.hasDownpayment && <Button className="md" onClick={handleGenerateDownpaymentBilling}>Generate Downpayment Billing</Button>}
        {editing && (
          <>
            <Button className="secondary md" onClick={() => { setForm({ ...finance }); setEditing(false); }}>Cancel</Button>
            <Button className="save md" onClick={save}>Save</Button>
          </>
        )}
        {!editing && editable && <Button className="md" onClick={() => setEditing(true)}>Edit</Button>}

      </div>
    </div>
    <div className={styles.detailsFields}>

      <div className={styles.field}>
        <label>Down Payment</label>
        {editing ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>Percent (%)</span>
              <Input
                type="number"
                value={form.downPaymentPercent ?? ''}
                onChange={e => {
                  const pct = e.target.value === '' ? '' : Number(e.target.value);
                  const contractPrice = project?.contractPrice || 0;
                  const amt = pct !== '' ? parseFloat(((pct / 100) * contractPrice).toFixed(2)) : '';
                  setForm({ ...form, downPaymentPercent: pct, downPayment: amt, recoupmentBalance: amt });
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>Amount</span>
              <Input
                type="number"
                value={form.downPayment ?? ''}
                onChange={e => {
                  const amt = e.target.value === '' ? '' : Number(e.target.value);
                  const contractPrice = project?.contractPrice || 0;
                  const pct = amt !== '' && contractPrice > 0 ? parseFloat(((amt / contractPrice) * 100).toFixed(4)) : '';
                  setForm({ ...form, downPayment: amt, downPaymentPercent: pct, recoupmentBalance: amt });
                }}
              />
            </div>
          </div>
        ) : (
          <div className="value">
            {finance?.downPayment ?? ''}
            {finance?.downPayment && project?.contractPrice
              ? ` (${((finance.downPayment / project.contractPrice) * 100).toFixed(2)}%)`
              : ''}
          </div>
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
        <div className="value">{editing ? (form.downPayment ?? '') : (finance?.recoupmentBalance ?? '')}</div>
      </div>
      <div className={styles.field}>
        <label>Total Billed Amount</label>
        <div className="value">
          {(finance?.totalBilledAmount ?? 0).toLocaleString()}
        </div>
      </div>
      <div className={styles.field}>
        <label>Last Billing Date</label>
        <div className="value">{finance?.lastBillingDate ? new Date(finance.lastBillingDate).toLocaleDateString() : ''}</div>
      </div>
      {/* Project Completion input removed as per backend update */}
    </div>
    </>
  );
}
