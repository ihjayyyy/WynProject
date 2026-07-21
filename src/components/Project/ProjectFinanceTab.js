import React, { useEffect, useState, useContext } from 'react';
import * as Yup from 'yup';
import {
  getProjectFinanceByProjectId,
  updateProjectFinance,
  createProjectFinance,
  INITIAL_PROJECT_FINANCE,
  generateDownpaymentBilling,
  getFinancialStatement,
} from '../../services/ProjectFinance';
import { useRouter } from 'next/navigation';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { AccessContext } from '@/app/contextProviders/accessContext';
import styles from './ProjectDetails.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import DataTable from '../ui/DataTable/DataTable';

export default function ProjectFinanceTab({ projectId, project, projectStatus, editable }) {
  // NOTE: adjust this string to whatever page key your AccessContext uses
  // for this page (same pattern as PageName in ProposalForm, e.g. 'Projects.Proposal').
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  // Finance permission - lowercase 'f'. Mirrors ProposalForm's canEditFinance.
  const canEditFinance = isAllowed(PageName, 'f');
  const isNotStarted = String(projectStatus).toUpperCase() === 'NOTSTARTED';

  const canEdit =
    Boolean(editable) &&
    canEditFinance &&
    isNotStarted;

  const router = useRouter();
  const confirmModal = useConfirmModal();
  const [finance, setFinance] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  // Financial Statement state
  const [statement, setStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(true);

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

  // Fetch Financial Statement
  useEffect(() => {
    let mounted = true;
    (async () => {
      setStatementLoading(true);
      const res = await getFinancialStatement(projectId);
      const data = res?.data?.value ?? res?.data ?? null;
      if (mounted) {
        setStatement(data);
      }
      setStatementLoading(false);
    })();
    return () => (mounted = false);
  }, [projectId]);

  const cleanPayload = (payload) => {
    const {
      error, isFailure, isSuccess, value, projectCompletion, downPaymentPercent,
      totalBilledAmount, lastBillingDate, ...cleaned
    } = payload;
    return cleaned;
  };

  const validationSchema = Yup.object().shape({
    downPaymentPercent: Yup.number().typeError('Down Payment Percent must be a number').min(0, 'Down Payment Percent cannot be less than 0').max(100, 'Down Payment Percent cannot be greater than 100').nullable(),
    downPayment: Yup.number().typeError('Down Payment must be a number').min(0, 'Down Payment cannot be negative').nullable(),
    retentionFee: Yup.number().typeError('Retention Fee must be a number').min(0, 'Retention Fee cannot be less than 0').max(100, 'Retention Fee cannot be greater than 100').nullable(),
    recoupmentPercentage: Yup.number().typeError('Recoupment % must be a number').min(0, 'Recoupment % cannot be less than 0').max(100, 'Recoupment % cannot be greater than 100').nullable(),
    lastBillingDate: Yup.date().typeError('Invalid date').nullable(),
  });

  const save = async () => {
    // Safety net: editing should only ever become true via the gated Edit
    // button below, but guard here too in case editing state is ever set
    // through another path.
    if (!canEdit) return;

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
    payload.hasDownpayment =
      typeof payload.hasDownpayment === 'string'
        ? payload.hasDownpayment.toLowerCase() === 'true'
        : Boolean(payload.hasDownpayment);
    payload.recoupmentBalance = Number(payload.downPayment) || 0;
    // Validate with Yup before submitting
    try {
      await validationSchema.validate(payload, { abortEarly: false });
      setFormErrors({});
    } catch (err) {
      const newErrors = {};
      if (err && err.inner && Array.isArray(err.inner)) {
        err.inner.forEach(e => {
          if (e.path) newErrors[e.path] = e.message;
        });
      } else if (err && err.path) {
        newErrors[err.path] = err.message;
      }
      setFormErrors(newErrors);
      setLoading(false);
      return;
    }
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

  // ---- Financial Statement helpers ----
  const fmt = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const renderFinancialStatement = () => {
    if (statementLoading) return <div>Loading financial statement...</div>;
    if (!statement) return <div>No financial statement available.</div>;

    const {
      totalContractPrice = 0,
      bom = 0,
      labor = 0,
      trips = 0,
      otherExpenses = 0,
      total = 0,
      net = 0,
    } = statement;


    const statementColumns = [
      {
        header: `Financial Statement as of ${todayLabel}`,
        key: 'label',
        align: 'left',
        sortable: false,
        width: '40%',
        render: (item) => (item.bold ? <strong>{item.label}</strong> : item.label),
      },
      {
        header: 'Debit',
        key: 'debit',
        align: 'right',
        sortable: false,
        width: '30%',
        render: (item) => (item.debit != null ? fmt(item.debit) : ''),
      },
      {
        header: 'Credit',
        key: 'credit',
        align: 'right',
        sortable: false,
        width: '30%',
        render: (item) => (item.credit != null ? fmt(item.credit) : ''),
      },
    ];

    const statementData = [
      { label: 'Total Contract Price', debit: totalContractPrice, credit: null },
      { label: 'Less', debit: null, credit: null, bold: true },
      { label: 'BOM', debit: null, credit: bom },
      { label: 'Labor', debit: null, credit: labor },
      { label: 'Trips', debit: null, credit: trips },
      { label: 'Other Expenses', debit: null, credit: otherExpenses },
      { label: '', debit: totalContractPrice, credit: total, isTotalRow: true },
      {
        label: 'Net',
        debit: null,
        credit: net,
        bold: true,
      },
    ];

    return (
      <DataTable
        columns={statementColumns}
        data={statementData}
        showActions={false}
        pagination={false}
        emptyMessage="No financial statement available."
      />
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
    <div className={styles.panelHeader}>
        <h3>Finance</h3>
        <div className={styles.panelActions}>
        {!editing &&
          projectStatus === 'ONGOING' &&
          finance &&
          !finance.hasDownpayment &&
          Number(finance.downPayment) > 0 && (
          <Button className="md" onClick={handleGenerateDownpaymentBilling}>
            Generate Downpayment Billing
          </Button>
        )}        
        {editing && (
          <>
            <Button className="secondary md" onClick={() => { setForm({ ...finance }); setEditing(false); }}>Cancel</Button>
            <Button className="save md" onClick={save}>Save</Button>
          </>
        )}
        {!editing && canEdit && <Button className="md" onClick={() => setEditing(true)}>Edit</Button>}

      </div>
    </div>
    <div className={styles.detailsFields}>

 <div className={styles.field}>
        <label>Contract Price</label>
        <div className="value">
          {project?.contractPrice
            ? Number(project.contractPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : (0).toFixed(2)}
        </div>
      </div>

      <div className={styles.field}>
        <label>Total Expense</label>
        <div className="value">
          {project?.totalExpenses
            ? Number(project.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : (0).toFixed(2)}
        </div>
      </div>

      <div className={styles.field}>
        <label>Net</label>
        <div className="value">
          {project?.net != null && project.net !== ''
            ? Number(project.net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : (0).toFixed(2)}
        </div>
      </div>

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
                  setFormErrors(prev => ({ ...prev, downPaymentPercent: undefined, downPayment: undefined }));
                }}
              />
              {formErrors.downPaymentPercent && <div style={{ color: 'red', fontSize: '0.75rem' }}>{formErrors.downPaymentPercent}</div>}
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
                  setFormErrors(prev => ({ ...prev, downPayment: undefined, downPaymentPercent: undefined }));
                }}
              />
              {formErrors.downPayment && <div style={{ color: 'red', fontSize: '0.75rem' }}>{formErrors.downPayment}</div>}
            </div>
          </div>
        ) : (
          <div className="value">
            {finance?.downPayment != null && finance.downPayment !== ''
              ? Number(finance.downPayment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : ''}
            {finance?.downPayment && project?.contractPrice
              ? ` (${((finance.downPayment / project.contractPrice) * 100).toFixed(2)}%)`
              : ''}
          </div>
        )}
      </div>
      <div className={styles.field}>
        <label>Retention Fee (%)</label>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Input
              type="number"
              value={form.retentionFee ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                setForm({ ...form, retentionFee: val });
                setFormErrors(prev => ({ ...prev, retentionFee: undefined }));
              }}
            />
            {formErrors.retentionFee && <div style={{ color: 'red', fontSize: '0.75rem' }}>{formErrors.retentionFee}</div>}
          </div>
        ) : (
          <div className="value">
            {finance?.retentionFee != null && finance.retentionFee !== ''
              ? `${Number(finance.retentionFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
              : ''}
          </div>
        )}
      </div>
      <div className={styles.field}>
        <label>Recoupment %</label>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Input
              type="number"
              value={form.recoupmentPercentage ?? ''}
              onChange={e => {
                setForm({ ...form, recoupmentPercentage: e.target.value === '' ? '' : Number(e.target.value) });
                setFormErrors(prev => ({ ...prev, recoupmentPercentage: undefined }));
              }}
            />
            {formErrors.recoupmentPercentage && <div style={{ color: 'red', fontSize: '0.75rem' }}>{formErrors.recoupmentPercentage}</div>}
          </div>
        ) : (
          <div className="value">
            {finance?.recoupmentPercentage != null && finance.recoupmentPercentage !== ''
              ? `${Number(finance.recoupmentPercentage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
              : ''}
          </div>
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
    </div>

    {String(projectStatus).toUpperCase() === 'ONGOING' && (
      <>
        <div className={styles.panelHeader}>
          <h3>Financial Statement</h3>
        </div>
        <div>
          {renderFinancialStatement()}
        </div>
      </>
    )}
    </>
  );
}