'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiUsers } from 'react-icons/fi';
import Button from '../ui/Button/Button';
import DataTable from '../ui/DataTable/DataTable';
import EntityForm from '../EntityForm/EntityForm';
import { useToast } from '../ui/Toast/Toast';
import { getRoleByRoleId, createRole, updateRole } from '@/services/Role';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';
import styles from './RolesForm.module.scss';

// ---------------------------------------------------------------------------
// Module tree mirrors the app's routes. `code` for each node is built by
// joining the parent's code + the node's key with a dot, e.g.
// "Projects.Proposal" — this must match the PageName strings used by
// isAllowed(PageName, 'r'|'w'|'a'|'f') elsewhere in the app.
// Edit this tree if pages get added/renamed.
// ---------------------------------------------------------------------------
const MODULE_TREE = [
  { key: 'Dashboard' },
  { key: 'Customers' },
  { key: 'Suppliers' },
  { key: 'Inquiry' },
  {
    key: 'Projects',
    children: [
      { key: 'Proposal' },
      { key: 'Projects' },
      { key: 'MaterialRequests' },
      { key: 'Billings' },
      { key: 'Collections' },
    ],
  },
  {
    key: 'Purchase',
    children: [
      { key: 'Requests' },
      { key: 'Orders' },
      { key: 'Deliveries' },
      { key: 'Invoices' },
      { key: 'Payments' },
      { key: 'SupplierRequests' },
    ],
  },
  {
    key: 'Finance',
    children: [
      { key: 'SalesBilling' },
      { key: 'Collections' },
      { key: 'Billings' },
      { key: 'Collection' },
    ],
  },
  {
    key: 'Storage',
    children: [{ key: 'Warehouse' }, { key: 'Rack' }],
  },
  {
    key: 'Materials',
    children: [{ key: 'Materials' }, { key: 'ToolsEquipment' }, { key: 'Assembly' }],
  },
  {
    key: 'Inventory',
    children: [
      { key: 'MaterialInventory' },
      { key: 'Report' },
      { key: 'MaterialTransfer' },
      { key: 'MaterialReceived' },
      { key: 'ToolsInventory' },
      { key: 'MaterialRequests' },
      { key: 'Barcode' },
    ],
  },
  { key: 'Employees', children: [{ key: 'Employees' }] },
  { key: 'Staff' },
  {
    key: 'Maintenance',
    children: [
      { key: 'UOM' },
      { key: 'UOMConversion' },
      { key: 'Users' },
      { key: 'Roles' },
    ],
  },
];

const PERMISSIONS = [
  { key: 'read', label: 'Read', flag: 'r' },
  { key: 'write', label: 'Write', flag: 'w' },
  { key: 'approve', label: 'Approve', flag: 'a' },
  { key: 'finance', label: 'Finance', flag: 'f' },
];

// Flattens MODULE_TREE into [{ code, name, label, parentCode, depth }].
// `code` === `name` === full dotted path so it lines up 1:1 with the
// PageName strings your pages already use.
function flattenModules(tree, parentCode = null, depth = 0, out = []) {
  tree.forEach((node) => {
    const code = parentCode ? `${parentCode}.${node.key}` : node.key;
    out.push({ code, name: code, label: node.key, parentCode, depth });
    if (node.children?.length) flattenModules(node.children, code, depth + 1, out);
  });
  return out;
}

const FLAT_MODULES = flattenModules(MODULE_TREE);

// Builds { [code]: { id, parentId, read, write, approve, finance } } from a
// role's existing `children` array (GET /api/Role/{id} response shape).
function accessMapFromChildren(children = []) {
  const map = {};
  (children || []).forEach((c) => {
    if (!c || !c.name) return;
    const access = String(c.access || '').toLowerCase();
    map[c.name] = {
      id: c.id || 0,
      parentId: c.parentId || 0,
      read: access.includes('r'),
      write: access.includes('w'),
      approve: access.includes('a'),
      finance: access.includes('f'),
    };
  });
  return map;
}

function accessStringFrom(perm) {
  return PERMISSIONS.filter((p) => perm?.[p.key])
    .map((p) => p.flag)
    .join('');
}

export default function RolesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal || !roleId;

  const { isAllowed } = useContext(AccessContext);
  const PageName = 'Maintenance.Roles';
  const toast = useToast();

  const [role, setRole] = useState(null); // null = not loaded yet
  const [permMap, setPermMap] = useState({});
  const [saving, setSaving] = useState(false);

  const isReadOnly = Boolean(roleId) && !isEditMode;

  useEffect(() => {
    let mounted = true;
    if (!roleId) {
      setRole({});
      setPermMap({});
      return;
    }
    (async () => {
      const res = await getRoleByRoleId(roleId);
      if (!mounted) return;
      if (res.error) {
        setRole({});
        return;
      }
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      setRole(data || {});
      setPermMap(accessMapFromChildren(data?.children));
    })();
    return () => (mounted = false);
  }, [roleId]);

  // Toggle one permission on a module. Cascades the same value down to every
  // descendant so checking "Projects" Read also turns Read on for every
  // "Projects.*" row — children can still be flipped individually after.
  const togglePermission = (moduleCode, permKey, checked) => {
    if (isReadOnly) return;
    setPermMap((prev) => {
      const next = { ...prev };
      const setOne = (c) => {
        next[c] = { ...(next[c] || {}), [permKey]: checked };
      };
      setOne(moduleCode);
      FLAT_MODULES.filter((m) => m.code.startsWith(`${moduleCode}.`)).forEach((m) => setOne(m.code));
      return next;
    });
  };

  const toggleColumn = (permKey, checked) => {
    if (isReadOnly) return;
    setPermMap((prev) => {
      const next = { ...prev };
      FLAT_MODULES.forEach((m) => {
        next[m.code] = { ...(next[m.code] || {}), [permKey]: checked };
      });
      return next;
    });
  };

  const isColumnFullyChecked = (permKey) => FLAT_MODULES.every((m) => permMap[m.code]?.[permKey]);

  const handleSave = async (values) => {
    if (!values.name?.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      const existingByCode = accessMapFromChildren(role?.children);
      const children = FLAT_MODULES.map((m) => {
        const perm = permMap[m.code] || {};
        const existing = existingByCode[m.code];
        const parentExisting = m.parentCode ? existingByCode[m.parentCode] : null;
        return {
          id: existing?.id || 0,
          name: m.name, // full dotted path — must match PageName usage elsewhere
          code: m.label, // short label, e.g. "Proposal"
          parentId: parentExisting?.id || 0,
          access: accessStringFrom(perm),
        };
      });

      const payload = {
        name: values.name.trim(),
        code: values.code?.trim() || '',
        children,
        deletedChildren: [],
      };

      const res = roleId ? await updateRole(roleId, payload) : await createRole(payload);

      if (res.error) {
        toast.error(roleId ? 'Failed to save role' : 'Failed to create role');
      } else {
        toast.success(roleId ? 'Role saved' : 'Role created');
        router.push('/maintainance/roles');
      }
    } finally {
      setSaving(false);
    }
  };

  if (roleId && role === null) return null;
  if (!isAllowed(PageName, 'r')) return <InvalidPage />;

  const moduleRows = FLAT_MODULES.map((module) => ({ ...module, id: module.code }));
  const permissionColumns = [
    ...PERMISSIONS.map((permission) => ({
      key: permission.key,
      header: (
        <label className={styles.colHeader}>
          <input
            type="checkbox"
            checked={isColumnFullyChecked(permission.key)}
            disabled={isReadOnly}
            onChange={(event) => toggleColumn(permission.key, event.target.checked)}
          />
          {permission.label}
        </label>
      ),
      align: 'center',
      width: '90px',
      sortable: false,
      render: (module) => (
        <input
          type="checkbox"
          checked={Boolean(permMap[module.code]?.[permission.key])}
          disabled={isReadOnly}
          onChange={(event) => togglePermission(module.code, permission.key, event.target.checked)}
          aria-label={`${permission.label} access for ${module.name}`}
        />
      ),
    })),
    {
      key: 'name',
      header: 'Name',
      sortable: false,
      render: (module) => (
        <span
          className={`${styles.moduleName} ${module.depth === 0 ? styles.parentModule : styles.childModule}`}
          style={{ paddingLeft: module.depth * 20 }}>
          {module.name}
        </span>
      ),
    },
  ];

  return (
    <EntityForm
      key={`role-${roleId || 'new'}-${mode || 'view'}`}
      title={roleId ? (isEditMode ? 'Edit Role' : 'View Role') : 'New Role'}
      breadcrumbLabel="Role"
      icon={<FiUsers />}
      fields={[{ name: 'name', label: 'Role Name', required: true, span: 'span3' }]}
      initialValues={{ name: role?.name || '', code: role?.code || '' }}
      onSubmit={handleSave}
      backPath="/maintainance/roles"
      readOnly={isReadOnly}
      showSubmitButton={false}
      headerActions={
        isReadOnly && isAllowed(PageName, 'w') ? (
          <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>
            Edit
          </Button>
        ) : null
      }
      rightActions={
        !isReadOnly && isAllowed(PageName, 'w') ? (
          <Button type="submit" variant="save" disabled={saving}>
            {roleId ? 'Save' : 'Create'}
          </Button>
        ) : null
      }
      extraContent={
        <section className={styles.permissionsSection}>
          <h3 className={styles.sectionTitle}>Module Permissions</h3>
          <DataTable columns={permissionColumns} data={moduleRows} showActions={false} pagination={false} />
        </section>
      }
    />
  );
}