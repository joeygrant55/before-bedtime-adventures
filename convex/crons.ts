import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Poll Lulu for order status updates every hour
// This checks all orders in "submitted" or "in_production" status
crons.interval(
  "poll-lulu-order-status",
  { hours: 1 },
  api.lulu.pollActiveOrders
);

export default crons;
