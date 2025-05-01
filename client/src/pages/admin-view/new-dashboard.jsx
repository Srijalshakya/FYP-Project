import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getDashboardMetrics } from "@/store/admin/admin-dashboard-slice";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function NewDashboard() {
  const dispatch = useDispatch();
  const { metrics, isLoading, error } = useSelector((state) => state.adminDashboard);
  const [timeRange, setTimeRange] = useState("All Time");
  const [granularity, setGranularity] = useState("day");

  useEffect(() => {
    dispatch(getDashboardMetrics());
    const interval = setInterval(() => {
      dispatch(getDashboardMetrics());
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [dispatch]);

  const processRevenueData = (revenueData, range, gran) => {
    if (!revenueData) return { labels: [], data: [] };

    const today = new Date();
    let startDate, endDate;

    // Parse revenue data into date objects
    const parsedData = revenueData.map((entry) => {
      const [day, month, year] = entry.day.split("/").map(Number);
      return {
        date: new Date(year, month - 1, day),
        total: entry.total,
      };
    });

    // Debug: Log parsed data to verify 27 April 2025 is included
    console.log("Raw Revenue Data from Backend:", revenueData);
    console.log("Parsed Revenue Data:", parsedData);

    // Determine the actual start and end dates of the data
    const dataStart = parsedData.length > 0 ? new Date(Math.min(...parsedData.map(d => d.date))) : new Date(today);
    const dataEnd = parsedData.length > 0 ? new Date(Math.max(...parsedData.map(d => d.date))) : new Date(today);

    // Set the start and end dates based on the time range
    if (range === "Past 7 Days") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      endDate = new Date(today);
    } else if (range === "Last 30 Days") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      endDate = new Date(today);
    } else {
      // "All Time"
      startDate = new Date(dataStart);
      endDate = new Date(today);
    }

    // Filter data based on the time range
    let filteredData = parsedData.filter((entry) => entry.date >= startDate && entry.date <= endDate);

    // Adjust startDate and endDate to ensure at least 7 intervals for the chosen granularity
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateLabels = [];
    const groupedData = {};

    if (gran === "month") {
      let currentDate = new Date(startDate);
      currentDate.setDate(1); // Start from the beginning of the month

      // Calculate how many months are in the range
      let monthCount = 0;
      const tempDate = new Date(currentDate);
      while (tempDate <= endDate) {
        monthCount++;
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      // If fewer than 7 months, extend the start date
      if (monthCount < 7) {
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 6); // Ensure 7 months
        startDate.setDate(1);
      }

      // Generate labels for at least 7 months
      currentDate = new Date(startDate);
      while (currentDate <= endDate || dateLabels.length < 7) {
        const key = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        groupedData[key] = 0;
        dateLabels.push(key);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Populate with actual data
      filteredData.forEach((entry) => {
        const key = `${months[entry.date.getMonth()]} ${entry.date.getFullYear()}`;
        if (groupedData[key] !== undefined) {
          groupedData[key] += entry.total;
        }
      });
    } else if (gran === "week") {
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start from the beginning of the week

      // Calculate how many weeks are in the range
      let weekCount = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24 * 7));
      if (weekCount < 7) {
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7 * 6); // Ensure 7 weeks
        startDate.setDate(startDate.getDate() - startDate.getDay());
      }

      // Generate labels for at least 7 weeks
      currentDate = new Date(startDate);
      while (currentDate <= endDate || dateLabels.length < 7) {
        const key = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        groupedData[key] = 0;
        dateLabels.push(key);
        currentDate.setDate(currentDate.getDate() + 7);
      }

      // Populate with actual data
      filteredData.forEach((entry) => {
        const weekStart = new Date(entry.date);
        weekStart.setDate(entry.date.getDate() - entry.date.getDay());
        const key = `${weekStart.getDate()} ${months[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
        if (groupedData[key] !== undefined) {
          groupedData[key] += entry.total;
        }
      });
    } else {
      // Daily granularity, ensure at least 7 days
      let dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (dayCount < 7) {
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6); // Ensure 7 days
      }

      // Generate labels for at least 7 days
      let currentDate = new Date(startDate);
      while (currentDate <= endDate || dateLabels.length < 7) {
        const key = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        groupedData[key] = 0;
        dateLabels.push(key);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Populate with actual data
      filteredData.forEach((entry) => {
        const key = `${entry.date.getDate()} ${months[entry.date.getMonth()]} ${entry.date.getFullYear()}`;
        if (groupedData[key] !== undefined) {
          groupedData[key] += entry.total;
        }
      });
    }

    // Debug: Log grouped data to verify 27 April 2025 revenue
    console.log("Grouped Data:", groupedData);

    // Prepare labels and data for the chart
    const labels = dateLabels;
    const data = labels.map((label) => groupedData[label] || 0);

    return { labels, data };
  };

  const { labels, data } = processRevenueData(metrics?.dailyRevenue, timeRange, granularity);
  const maxRevenue = Math.max(...data, 0);
  const suggestedMax = maxRevenue > 0 ? maxRevenue * 1.2 : 100;

  const chartData = {
    labels,
    datasets: [
      {
        label: `${granularity.charAt(0).toUpperCase() + granularity.slice(1)} Revenue`,
        data,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: false,
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `${granularity.charAt(0).toUpperCase() + granularity.slice(1)} Revenue (${timeRange})`,
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: suggestedMax,
        title: { display: true, text: "Revenue ($)" },
        ticks: {
          callback: (value) => `$${value.toFixed(0)}`,
        },
      },
      x: {
        title: { display: true, text: granularity.charAt(0).toUpperCase() + granularity.slice(1) },
      },
    },
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      {isLoading && <p>Loading metrics...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.totalSales?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOrders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Revenue Trend</CardTitle>
            <div className="flex space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border rounded p-2"
              >
                <option value="Past 7 Days">Past 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="All Time">All Time</option>
              </select>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                className="border rounded p-2"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewDashboard;