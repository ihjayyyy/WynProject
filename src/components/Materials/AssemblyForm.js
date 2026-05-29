'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiShare2 } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import AssemblyMaterialService from '../../services/AssemblyMaterial';
import AssemblyMaterialsTable from './AssemblyMaterialsTable';

export default function AssemblyForm() {
  const [uomOptions, setUomOptions] = useState([]);
  // Load UOM options
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { getUnitsOfMeasure } = await import('../../services/UnitOfMeasure');
      const res = await getUnitsOfMeasure();
      if (mounted && res.data) {
        const seen = new Set();
        setUomOptions(
          (res.data || [])
            .map(uom => ({ label: uom.name || uom.code, value: uom.name || uom.code }))
            .filter(opt => {
              if (seen.has(opt.value)) return false;
              seen.add(opt.value);
              return true;
            })
        );
      }
    })();
    return () => { mounted = false; };
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const toast = useToast();

  const [initialValues, setInitialValues] = useState({ ...AssemblyMaterialService.INITIAL_ASSEMBLY_MATERIAL.material, materialType: '', isAssembly: true });
  const [assemblyMaterials, setAssemblyMaterials] = useState([]);
  const [deletedAssemblyMaterials, setDeletedAssemblyMaterials] = useState([]);
  const [exists, setExists] = useState(false);
  // No local modal state here; handled by AssemblyMaterialsTable

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!materialId) {
        setInitialValues({ ...AssemblyMaterialService.INITIAL_ASSEMBLY_MATERIAL.material, materialType: 'AnyType', isAssembly: true });
        setAssemblyMaterials([]);
        setDeletedAssemblyMaterials([]);
        setExists(false);
        return;
      }
      try {
        const res = await AssemblyMaterialService.getAssemblyMaterial(materialId);
        if (cancelled) return;
        if (
          res?.error ||
          !res?.data ||
          !Array.isArray(res.data) ||
          res.data.length === 0
        ) {
          setInitialValues({ ...AssemblyMaterialService.INITIAL_ASSEMBLY_MATERIAL.material, materialType: 'AnyType', isAssembly: true });
          setAssemblyMaterials([]);
          setDeletedAssemblyMaterials([]);
          setExists(false);
        } else {
          const first = res.data[0];
          setInitialValues({ ...first.material, materialType: 'AnyType', isAssembly: true });
          console.log('Fetched assembly material', first.assemblyMaterials);
          setAssemblyMaterials(first.assemblyMaterials || []);
          setDeletedAssemblyMaterials(first.deletedAssemblyMaterials || []);
          setExists(true);
        }
      } catch (e) {
        if (!cancelled) {
          setInitialValues({ ...AssemblyMaterialService.INITIAL_ASSEMBLY_MATERIAL.material, materialType: 'AnyType', isAssembly: true });
          setAssemblyMaterials([]);
          setDeletedAssemblyMaterials([]);
          setExists(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [materialId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [exists, isEditMode]);

  const formTitle = useMemo(() => {
    if (!materialId) return 'Assembly Form';
    if (isEditMode) return 'Edit Assembly';
    return 'View Assembly';
  }, [materialId, isEditMode]);

  const fields = [
    { name: 'code', label: 'Code', span: 'span2', validator: Yup.string().required('Code is required') },
    { name: 'name', label: 'Name', span: 'span2', validator: Yup.string().required('Name is required') },
      { name: 'sellingPrice', label: 'Selling Price', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Selling price must be 0 or more') },

    {
      name: 'unitOfMeasure',
      label: 'UOM',
      type: 'select',
      options: uomOptions,
      span: 'span2',
      onChange: (selected, values, setValues) => {
        setValues({ ...values, unitOfMeasure: selected, purchaseUnitOfMeasure: selected });
      },
      validator: Yup.string().required('UOM is required'),
    },
    // { name: 'purchaseUnitOfMeasure', label: 'Default Purchase UOM', span: 'span2' },
  ];

  // Handler for AssemblyMaterialsTable changes
  const handleAssemblyMaterialsChange = (updated, deleted) => {
    setAssemblyMaterials(updated);
    setDeletedAssemblyMaterials(deleted);
  };



  // Handler for form submit
  const handleSubmit = async (values) => {
    let payload;
    if (materialId) {
      // Edit mode: Ensure new assembly materials have id: 0, existing keep their id
      const processedAssemblyMaterials = assemblyMaterials.map(item => ({ ...item, id: item.id ? item.id : 0 }));
      payload = {
        material: {
          ...values,
          isAssembly: true,
          materialType: 'Material',
          purchasePrice: 0,
          sellingPrice: 0,
        },
        assemblyMaterials: processedAssemblyMaterials,
        deletedAssemblyMaterials,
      };
    } else {
      // Create mode: do not include id
      const processedAssemblyMaterials = assemblyMaterials.map(({ id, ...rest }) => rest);
      payload = {
        material: {
          ...values,
          isAssembly: true,
          materialType: 'Material',
          purchasePrice: 0,
          sellingPrice: 0,
        },
        assemblyMaterials: processedAssemblyMaterials,
        deletedAssemblyMaterials,
      };
    }
    if (!materialId) {
      try {
        const res = await AssemblyMaterialService.createAssemblyMaterial(payload);
        if (res?.error) {
          toast.error('Failed to create assembly');
        } else {
          toast.success('Assembly created');
        }
        router.push('/materialsSettings/assembly');
      } catch (err) {
        toast.error('Failed to create assembly');
        router.push('/materialsSettings/assembly');
      }
      return;
    }
    try {
      const res = await AssemblyMaterialService.updateAssemblyMaterial(materialId, payload);
      if (res?.error) {
        toast.error('Failed to save assembly');
      } else {
        toast.success('Assembly saved');
      }
      router.push('/materialsSettings/assembly');
    } catch (err) {
      toast.error('Failed to save assembly');
      router.push('/materialsSettings/assembly');
    }
  };

  return (
    <EntityForm
      title={formTitle}
      icon={<FiShare2 />}
      fields={fields}
      initialValues={initialValues}
      extraContent={
        <AssemblyMaterialsTable
          items={assemblyMaterials}
          onChange={handleAssemblyMaterialsChange}
          editable={!isReadOnly}
        />
      }
      onSubmit={handleSubmit}
      backPath="/materialsSettings/assembly"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !materialId ? (
          <Button type="submit" variant="save">Create</Button>
        ) : (
          <>
            {isReadOnly ? (
              canEnterEditMode ? (
                <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
              ) : null
            ) : (
              <>
                <Button variant="outlineDanger" onClick={() => {
                  if (mode === 'edit') { router.push(`/materialsSettings/assembly/assemblyForm?id=${materialId}`); return; }
                  setIsEditModeLocal(false);
                }}>Cancel</Button>
                <Button type="submit" variant="save">Save</Button>
              </>
            )}
          </>
        )
      }
    />
  );
}
