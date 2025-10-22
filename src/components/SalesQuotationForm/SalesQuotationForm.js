"use client";

import React, { useState, useEffect } from "react";
import styles from "../QuotationForm/QuotationForm.module.scss";
import Input from "../ui/Input/Input";
import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import { FiFileText, FiPlus, FiTrash2, FiEdit, FiCheck, FiX } from "react-icons/fi";
import Select from "../ui/Select/Select";

import { InventoryService } from "../../services/inventoryService.js";
import { ServiceService } from "../../services/serviceService.js";
import SupplierService from "../../services/supplierService.js";
import SalesQuotationService from '../../services/salesQuotationService.js';
import { useSearchParams, useRouter } from 'next/navigation';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';

// Supplier service instance
const supplierService = new SupplierService();

const inventoryService = new InventoryService();
const serviceService = new ServiceService();

const initialProductItems = [];

const initialServiceItems = [];

const initialBlankServiceRow = {
  ServiceGuid: '',
  Description: '',
  Price: 0,
};

import QuotationForm from '../QuotationForm/QuotationForm';

// Adapter that maps the SalesQuotationService methods to the interface expected by QuotationForm
const salesServiceFactory = () => {
  const svc = new SalesQuotationService();
  return {
    getById: (id) => svc.getSalesQuotationById(id),
    getDetailsWithItemsByQuotationGuid: (id) => svc.getDetailsWithItemsByQuotationGuid(id),
    create: (payload) => svc.createSalesQuotation(payload),
    update: (payload) => svc.updateSalesQuotation(payload),
    subscribe: (cb) => SalesQuotationService.subscribe(cb)
  };
};

export default function SalesQuotationForm(props) {
  return (
    <QuotationForm
      serviceFactory={salesServiceFactory}
      landingRoute="/sales/quotationlanding"
      title="Sales Quotation Form"
      saveType="SalesType"
      {...props}
    />
  );
}
