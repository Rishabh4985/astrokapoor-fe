export const buildDateFilter = (filter) => {
  const now = new Date();
  let startDate, endDate;

  switch (filter) {
    case "day": {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      break;
    }
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // start of week (Sunday)
      startDate = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate(),
        0,
        0,
        0,
        0
      );
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      break;
    }
    case "month": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;
    }
    case "year": {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
    default: {
      return null;
    }
  }

  return { start: startDate, end: endDate };
};

export const filterRecords = (records, filter, category) => {
  const range = buildDateFilter(filter);
  return records.filter((record) => {
    if (category !== "all" && record.category !== category) return false;
    if (!range) return true;
    const date = new Date(record.dateOfPayment);
    return date >= range.start && date <= range.end;
  });
};

// Monthly
export const groupMonthly = (records) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const groups = {};
  records.forEach(({ dateOfPayment, amount }) => {
    const date = new Date(dateOfPayment);
    const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    groups[key] = (groups[key] || 0) + (Number(amount) || 0);
  });

  return Object.entries(groups)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => {
      const [mA, yA] = a.name.split(" ");
      const [mB, yB] = b.name.split(" ");
      const monthIdx = monthNames.reduce(
        (acc, m, i) => ({ ...acc, [m]: i }),
        {}
      );
      if (parseInt(yA) !== parseInt(yB)) return parseInt(yA) - parseInt(yB);
      return monthIdx[mA] - monthIdx[mB];
    });
};

// sales vs refunds
export const sumSalesVsRefund = (records) => {
  const sales = records.reduce(
    (sum, rec) => sum + (Number(rec.amount) || 0),
    0
  );
  const refunds = records.reduce(
    (sum, rec) => sum + (Number(rec.refund) || 0),
    0
  );
  return [
    { name: "Sales", value: sales },
    { name: "Refunds", value: refunds },
  ];
};

// status Count
export const countStatus = (records) => {
  const map = {};
  records.forEach(({ status }) => {
    const s = (status || "unknown").trim().toLowerCase();
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    map[label] = (map[label] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};
