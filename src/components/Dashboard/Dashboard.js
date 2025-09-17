import React from "react";

import ThreeColumnLayout from "../ThreeColumnLayout/ThreeColumnLayout";
import StatsCard from "../ui/StatsCard/StatsCard";
import DataTable from "../ui/DataTable/DataTable";
import styles from "./Dashboard.module.scss";

const stats = [
  { number: "₱12,500", label: "Total Sales", change: "+5%", isPositive: true },
  { number: "₱8,200", label: "Total Purchases", change: "-2%", isPositive: false },
  { number: "15", label: "Suppliers", change: "+1", isPositive: true },
];

const columns = [
  { header: "Date", key: "date" },
  { header: "Type", key: "type" },
  { header: "Amount", key: "amount", align: "right" },
  { header: "Status", key: "status" },
];

const data = [
  { id: 1, date: "2025-09-15", type: "Sale", amount: "₱1,200", status: "Completed" },
  { id: 2, date: "2025-09-14", type: "Purchase", amount: "₱800", status: "Pending" },
  { id: 3, date: "2025-09-13", type: "Sale", amount: "₱2,500", status: "Completed" },
];

export default function Dashboard() {
  return (
      <div className={styles.dashboardWrap}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.statsRow}>
          {stats.map((stat, idx) => (
            <StatsCard
              key={idx}
              number={stat.number}
              label={stat.label}
              change={stat.change}
              isPositive={stat.isPositive}
            />
          ))}
        </div>
        <div className={styles.tableSection}>
          <h2>Recent Transactions</h2>
          <DataTable data={data} columns={columns} />
        </div>
      </div>
  
  );
}
