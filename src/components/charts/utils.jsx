export const getMonthlySalesData = (records) => {
  const monthlyTotals = {};

  records.forEach((record) => {
    let rawDate = record.dateOfPayment;

    if (typeof rawDate === "string") {
      rawDate = new Date(rawDate);
    }

    if (!(rawDate instanceof Date) || isNaN(rawDate)) return;

    const month = rawDate.toLocaleString("default", { month: "short" });
    const year = rawDate.getFullYear();
    const key = `${month} ${year}`;

    monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(record.amount || 0);
  });

  return Object.entries(monthlyTotals).map(([name, total]) => ({
    name,
    total,
  }));
};

export const getSalesVsRefundData = (records) => {
  //sales
  const sales = records.reduce((sum, record) => {
    const amount = parseFloat(record.amount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  //refund
  const refunds = records.reduce((sum, record) => {
    const refund = parseFloat(record.refund || 0);
    return sum + (isNaN(refund) ? 0 : refund);
  }, 0);

  return [
    { name: "Sales", value: sales },
    { name: "Refunds", value: refunds },
  ];
};

export const getStatusCountData = (records) => {
  const statusCount = {};

  records.forEach((record) => {
    const rawStatus = record.status || "Unknown";
    const status = rawStatus.trim().toLowerCase();
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  return Object.entries(statusCount).map(([name, value]) => ({
    name: name[0].toUpperCase() + name.slice(1),
    value,
  }));
};
